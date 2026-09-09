import json
import logging
import os
import re
from functools import wraps

import boto3
import requests

from django.conf import settings
from django.utils import timezone

from rest_framework import status
from rest_framework.response import Response

from ..models import UserProfile


logger = logging.getLogger(__name__)


MAX_CARD_RATIO = 4
TARGET_CARD_RATIO_TOTAL = 40
MAX_DECK_IMAGE_SIZE = 10 * 1024 * 1024

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "").strip()
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "").strip()
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "").strip()
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "").strip()
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "").strip().rstrip("/")

IMAGE_CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
}


def include_error_detail():
    return settings.DEBUG or str(
        os.getenv("API_ERROR_DETAILS", "")
    ).strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


def _get_r2_client():
    if not all(
        [
            R2_ACCOUNT_ID,
            R2_ACCESS_KEY_ID,
            R2_SECRET_ACCESS_KEY,
            R2_BUCKET_NAME,
            R2_PUBLIC_URL,
        ]
    ):
        raise RuntimeError(
            "R2 storage is not configured correctly."
        )

    return boto3.client(
        "s3",
        endpoint_url=(
            f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
        ),
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


def _normalize_r2_side(value):
    value = str(value or "").strip().lower()

    if value in {"plant", "plants"}:
        return "plants"

    if value in {"zombie", "zombies"}:
        return "zombies"

    return None


def _get_image_extension(uploaded_file):
    original_name = str(
        getattr(uploaded_file, "name", "") or ""
    )

    extension = os.path.splitext(original_name)[1].lower()

    if extension in IMAGE_CONTENT_TYPES:
        return extension

    content_type = str(
        getattr(uploaded_file, "content_type", "") or ""
    ).lower()

    for ext, allowed_type in IMAGE_CONTENT_TYPES.items():
        if content_type == allowed_type:
            return ext

    raise ValueError(
        "Unsupported image type. "
        "Use JPG, JPEG, PNG, WEBP, or GIF."
    )


def _slugify(value):
    value = str(value or "").strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = value.strip("-")

    return value or "deck"


def get_discord_user(request):
    discord_id = request.session.get("discord_id")

    if not discord_id:
        username = str(
            getattr(request.user, "username", "") or ""
        ).strip()

        if username.startswith("discord_"):
            discord_id = username[len("discord_"):]

    if not discord_id:
        return None

    discord_id = str(discord_id)

    profile = (
        UserProfile.objects
        .filter(discord_id=discord_id)
        .first()
    )

    access_token = request.session.get(
        "discord_access_token"
    )

    if access_token:
        try:
            response = requests.get(
                "https://discord.com/api/v10/users/@me",
                headers={
                    "Authorization": (
                        f"Bearer {access_token}"
                    ),
                },
                timeout=5,
            )

            if response.ok:
                discord_data = response.json()
                current_discord_id = discord_data.get("id")

                if (
                    current_discord_id
                    and str(current_discord_id) == discord_id
                ):
                    discord_username = str(
                        discord_data.get(
                            "username",
                            "",
                        )
                    ).strip()

                    discord_global_name = (
                        discord_data.get(
                            "global_name"
                        )
                        or discord_username
                        or f"discord_{discord_id}"
                    )

                    discord_avatar = (
                        discord_data.get("avatar")
                        or None
                    )

                    request.session["discord_id"] = (
                        discord_id
                    )

                    request.session["discord_username"] = (
                        discord_username
                    )

                    request.session["discord_global_name"] = (
                        discord_global_name
                    )

                    request.session["discord_avatar"] = (
                        discord_avatar
                    )

                    if profile:
                        changed = False

                        if (
                            profile.username
                            != discord_username
                        ):
                            profile.username = (
                                discord_username
                            )
                            changed = True

                        if (
                            not profile.display_name_is_custom
                            and profile.display_name
                            != discord_global_name
                        ):
                            profile.display_name = (
                                discord_global_name
                            )
                            changed = True

                        if profile.avatar != discord_avatar:
                            profile.avatar = (
                                discord_avatar
                            )
                            changed = True

                        if changed:
                            profile.updated_at = (
                                timezone.now()
                            )

                            profile.save(
                                update_fields=[
                                    "username",
                                    "display_name",
                                    "avatar",
                                    "updated_at",
                                ]
                            )

                    return {
                        "id": discord_id,
                        "username": discord_username,
                        "global_name": (
                            discord_global_name
                        ),
                        "avatar": (
                            discord_avatar
                            or (
                                profile.avatar
                                if profile
                                else ""
                            )
                            or ""
                        ),
                    }

        except requests.RequestException:
            logger.exception(
                "Failed to refresh Discord user %s.",
                discord_id,
            )
        except ValueError:
            logger.exception(
                "Invalid Discord response while refreshing "
                "user %s.",
                discord_id,
            )

    discord_username = request.session.get(
        "discord_username"
    )

    if not discord_username and profile and profile.username:
        discord_username = profile.username

    if not discord_username and request.user.is_authenticated:
        discord_username = str(
            request.user.username or ""
        ).strip()

        if discord_username.startswith("discord_"):
            discord_username = discord_username[
                len("discord_"):
            ]

    discord_global_name = request.session.get(
        "discord_global_name"
    )

    if not discord_global_name and profile and profile.display_name:
        discord_global_name = profile.display_name

    if not discord_global_name and request.user.is_authenticated:
        discord_global_name = (
            request.user.first_name
            or discord_username
        )

    if not discord_global_name:
        discord_global_name = (
            discord_username
            or f"discord_{discord_id}"
        )

    avatar = ""

    if profile and profile.avatar:
        avatar = profile.avatar
    else:
        avatar = (
            request.session.get(
                "discord_avatar"
            )
            or ""
        )

    return {
        "id": discord_id,
        "username": str(
            discord_username or ""
        ),
        "global_name": str(
            discord_global_name or ""
        ),
        "avatar": avatar,
    }


def normalize_card_ratio_list(value):
    if value is None:
        return []

    if isinstance(value, str):
        value = value.strip()

        if not value:
            return []

        try:
            parsed = json.loads(value)

            if isinstance(parsed, list):
                value = parsed

        except (
            json.JSONDecodeError,
            TypeError,
        ):
            pass

    if isinstance(value, list):
        raw_lines = []

        for item in value:
            if isinstance(item, dict):
                name = (
                    item.get("card_name")
                    or item.get("name")
                    or ""
                )

                count = item.get("count")

                if count is not None:
                    raw_lines.append(
                        f"{name}|{count}"
                    )
                    continue

                item = name

            for line in str(item).splitlines():
                raw_lines.append(line)

    else:
        raw_lines = str(value).splitlines()

    parsed_cards = []
    seen = set()

    for line in raw_lines:
        line = line.strip()

        if not line:
            continue

        name_part, _, count_part = line.partition("|")
        name = name_part.strip()

        if not name:
            continue

        try:
            count = int(
                str(count_part).strip()
            )
        except (
            TypeError,
            ValueError,
        ):
            count = 1

        count = max(
            1,
            min(
                count,
                MAX_CARD_RATIO,
            ),
        )

        key = name.lower()

        if key in seen:
            continue

        seen.add(key)

        parsed_cards.append(
            {
                "name": name,
                "count": count,
            }
        )

    return parsed_cards


def cards_to_storage_string(parsed_cards):
    return "\n".join(
        f"{card['name']}|{card['count']}"
        for card in parsed_cards
        if card.get("name")
    )


def normalize_card_list(value):
    if value is None:
        return []

    if isinstance(value, str):
        value = value.strip()

        if not value:
            return []

        try:
            parsed = json.loads(value)

            if isinstance(parsed, list):
                value = parsed

        except (
            json.JSONDecodeError,
            TypeError,
        ):
            pass

    if isinstance(value, list):
        cleaned = []

        for card in value:
            if isinstance(card, dict):
                card_name = (
                    card.get("card_name")
                    or card.get("name")
                    or ""
                )
            else:
                card_name = str(card)

            card_name = str(
                card_name
            ).strip()

            if not card_name:
                continue

            for line in card_name.splitlines():
                for item in line.split(","):
                    item = item.strip()

                    if (
                        item
                        and item not in cleaned
                    ):
                        cleaned.append(item)

        return cleaned

    cleaned = []

    for line in str(value).splitlines():
        for item in line.split(","):
            item = item.strip()

            if (
                item
                and item not in cleaned
            ):
                cleaned.append(item)

    return cleaned


def save_deck_image(
    uploaded_file,
    deckid,
    deck_name="",
    legacy=False,
    side="",
):
    if not uploaded_file:
        return None

    if not getattr(uploaded_file, "size", 0):
        raise ValueError(
            "Image is empty."
        )

    if uploaded_file.size > MAX_DECK_IMAGE_SIZE:
        raise ValueError(
            "Image is too large. Maximum size is 10 MB."
        )

    extension = _get_image_extension(
        uploaded_file
    )

    clean_name = str(
        deck_name
        or uploaded_file.name
        or "deck"
    ).strip()

    clean_name = os.path.splitext(
        clean_name
    )[0]

    clean_name = _slugify(
        clean_name
    )

    try:
        numeric_deck_id = int(deckid)
    except (
        TypeError,
        ValueError,
    ):
        numeric_deck_id = str(deckid).strip()

    filename = (
        f"{clean_name}-{numeric_deck_id}"
        f"{extension}"
    )

    normalized_side = _normalize_r2_side(
        side
    )

    if not normalized_side:
        raise ValueError(
            "Side must be Plants or Zombies."
        )

    if legacy:
        key = (
            f"legacy_decks/"
            f"{normalized_side}/"
            f"{filename}"
        )
    else:
        key = (
            f"decks/"
            f"{normalized_side}/"
            f"{filename}"
        )

    uploaded_file.seek(0)
    content = uploaded_file.read()

    if not content:
        raise ValueError(
            "Image is empty."
        )

    client = _get_r2_client()

    client.put_object(
        Bucket=R2_BUCKET_NAME,
        Key=key,
        Body=content,
        ContentType=IMAGE_CONTENT_TYPES[extension],
        CacheControl="public, max-age=31536000",
    )

    client.head_object(
        Bucket=R2_BUCKET_NAME,
        Key=key,
    )

    return f"{R2_PUBLIC_URL}/{key}"


def owner_required(view_func):
    @wraps(view_func)
    def wrapped_view(
        request,
        *args,
        **kwargs,
    ):
        discord_id = request.session.get(
            "discord_id"
        )

        if not discord_id:
            return Response(
                {
                    "authenticated": False,
                    "error": "Authentication required.",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        owner_id = str(
            getattr(
                settings,
                "DISCORD_OWNER_ID",
                "",
            )
        ).strip()

        if not owner_id:
            logger.error(
                "DISCORD_OWNER_ID is not configured."
            )

            return Response(
                {
                    "error": (
                        "Owner configuration is missing."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if str(discord_id) != owner_id:
            return Response(
                {
                    "error": (
                        "Owner permissions required."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return view_func(
            request,
            *args,
            **kwargs,
        )

    return wrapped_view
