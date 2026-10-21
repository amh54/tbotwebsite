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
R2_REGION = os.getenv("R2_REGION", "auto").strip()
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
        region_name=R2_REGION,
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


def _get_discord_id_from_request(request):
    discord_id = request.session.get("discord_id")

    if discord_id:
        return str(discord_id)

    username = str(
        getattr(request.user, "username", "") or ""
    ).strip()

    if username.startswith("discord_"):
        return username[len("discord_"):]

    return None


def _sync_discord_user_profile(
    profile,
    username,
    global_name,
    avatar,
):
    if not profile:
        return

    changed_fields = []

    if profile.username != username:
        profile.username = username
        changed_fields.append("username")

    if (
        not profile.display_name_is_custom
        and profile.display_name != global_name
    ):
        profile.display_name = global_name
        changed_fields.append("display_name")

    if profile.avatar != avatar:
        profile.avatar = avatar
        changed_fields.append("avatar")

    if changed_fields:
        profile.updated_at = timezone.now()
        changed_fields.append("updated_at")
        profile.save(update_fields=changed_fields)


def _refresh_discord_user(request, discord_id, profile):
    access_token = request.session.get("discord_access_token")

    if not access_token:
        return None

    try:
        response = requests.get(
            "https://discord.com/api/v10/users/@me",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=5,
        )

        if not response.ok:
            return None

        data = response.json()

    except requests.RequestException:
        logger.exception(
            "Failed to refresh Discord user %s.",
            discord_id,
        )
        return None
    except ValueError:
        logger.exception(
            "Invalid Discord response while refreshing user %s.",
            discord_id,
        )
        return None

    if str(data.get("id") or "") != discord_id:
        return None

    username = str(data.get("username") or "").strip()
    global_name = (
        data.get("global_name")
        or username
        or f"discord_{discord_id}"
    )
    avatar = data.get("avatar") or None

    request.session.update({
        "discord_id": discord_id,
        "discord_username": username,
        "discord_global_name": global_name,
        "discord_avatar": avatar,
    })

    _sync_discord_user_profile(
        profile,
        username,
        global_name,
        avatar,
    )

    return {
        "id": discord_id,
        "username": username,
        "global_name": global_name,
        "avatar": (
            avatar
            or (profile.avatar if profile else "")
            or ""
        ),
    }


def _get_session_discord_username(request, profile):
    username = (
        request.session.get("discord_username")
        or (profile.username if profile else "")
    )

    if username or not request.user.is_authenticated:
        return str(username or "")

    username = str(request.user.username or "").strip()

    if username.startswith("discord_"):
        username = username[len("discord_"):]

    return username


def _get_session_discord_user(request, discord_id, profile):
    username = _get_session_discord_username(request, profile)

    global_name = (
        request.session.get("discord_global_name")
        or (profile.display_name if profile else "")
    )

    if not global_name and request.user.is_authenticated:
        global_name = request.user.first_name or username

    global_name = global_name or username or f"discord_{discord_id}"

    avatar = (
        (profile.avatar if profile else "")
        or request.session.get("discord_avatar")
        or ""
    )

    return {
        "id": discord_id,
        "username": username,
        "global_name": str(global_name or ""),
        "avatar": avatar,
    }


def get_discord_user(request):
    discord_id = _get_discord_id_from_request(request)

    if not discord_id:
        return None

    profile = UserProfile.objects.filter(
        discord_id=discord_id
    ).first()

    refreshed_user = _refresh_discord_user(
        request,
        discord_id,
        profile,
    )

    if refreshed_user:
        return refreshed_user

    return _get_session_discord_user(
        request,
        discord_id,
        profile,
    )


def _parse_card_ratio_input(value):
    if value is None:
        return []

    if isinstance(value, str):
        value = value.strip()

        if not value:
            return []

        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return parsed
        except (json.JSONDecodeError, TypeError):
            pass

    return value


def _card_ratio_raw_lines(value):
    if not isinstance(value, list):
        return str(value).splitlines()

    raw_lines = []

    for item in value:
        if isinstance(item, dict):
            name = item.get("card_name") or item.get("name") or ""
            count = item.get("count")

            if count is not None:
                raw_lines.append(f"{name}|{count}")
                continue

            item = name

        raw_lines.extend(str(item).splitlines())

    return raw_lines


def _parse_card_ratio_line(line):
    line = line.strip()

    if not line:
        return None

    name_part, _, count_part = line.partition("|")
    name = name_part.strip()

    if not name:
        return None

    try:
        count = int(str(count_part).strip())
    except (TypeError, ValueError):
        count = 1

    return {
        "name": name,
        "count": max(1, min(count, MAX_CARD_RATIO)),
    }


def normalize_card_ratio_list(value):
    value = _parse_card_ratio_input(value)

    if value is None:
        return []

    parsed_cards = []
    seen = set()

    for line in _card_ratio_raw_lines(value):
        card = _parse_card_ratio_line(line)

        if not card:
            continue

        key = card["name"].lower()

        if key in seen:
            continue

        seen.add(key)
        parsed_cards.append(card)

    return parsed_cards


def cards_to_storage_string(parsed_cards):
    return "\n".join(
        f"{card['name']}|{card['count']}"
        for card in parsed_cards
        if card.get("name")
    )


def _parse_card_list_input(value):
    if value is None:
        return []

    if not isinstance(value, str):
        return value

    value = value.strip()
    if not value:
        return []

    try:
        parsed = json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return value

    return parsed if isinstance(parsed, list) else value


def _extract_card_name(card):
    if isinstance(card, dict):
        return str(
            card.get("card_name")
            or card.get("name")
            or ""
        ).strip()

    return str(card).strip()


def _split_card_names(value):
    names = []
    for line in str(value).splitlines():
        names.extend(
            item.strip()
            for item in line.split(",")
            if item.strip()
        )
    return names


def _normalize_card_list_items(items):
    cleaned = []
    seen = set()

    for card in items:
        for name in _split_card_names(_extract_card_name(card)):
            if name not in seen:
                seen.add(name)
                cleaned.append(name)

    return cleaned


def normalize_card_list(value):
    value = _parse_card_list_input(value)

    if isinstance(value, list):
        return _normalize_card_list_items(value)

    return _normalize_card_list_items([value]) if value is not None else []


def save_deck_image(
    uploaded_file,
    deckid,
    deck_name="",
    legacy=False,
    side="",
    hero="",
    user_deck=False,
):
    if not uploaded_file:
        logger.warning(
            "[R2] No uploaded file provided for deck %s.",
            deckid,
        )
        return None

    logger.info(
        "[R2] Starting image upload: deck=%s name=%s size=%s content_type=%s user_deck=%s legacy=%s side=%s hero=%s",
        deckid,
        getattr(uploaded_file, "name", None),
        getattr(uploaded_file, "size", None),
        getattr(uploaded_file, "content_type", None),
        user_deck,
        legacy,
        side,
        hero,
    )

    if not getattr(uploaded_file, "size", 0):
        logger.error(
            "[R2] Image is empty before upload: deck=%s",
            deckid,
        )
        raise ValueError("Image is empty.")

    if uploaded_file.size > MAX_DECK_IMAGE_SIZE:
        logger.error(
            "[R2] Image too large: deck=%s size=%s max=%s",
            deckid,
            uploaded_file.size,
            MAX_DECK_IMAGE_SIZE,
        )
        raise ValueError(
            "Image is too large. Maximum size is 10 MB."
        )

    extension = _get_image_extension(uploaded_file)

    logger.info(
        "[R2] Detected image extension: deck=%s extension=%s",
        deckid,
        extension,
    )

    clean_name = str(
        deck_name
        or uploaded_file.name
        or "deck"
    ).strip()

    clean_name = os.path.splitext(clean_name)[0]
    clean_name = _slugify(clean_name)

    clean_hero = _slugify(hero)

    if not clean_hero:
        logger.error(
            "[R2] Missing hero: deck=%s hero=%s",
            deckid,
            hero,
        )
        raise ValueError("Hero is required for deck images.")

    try:
        numeric_deck_id = int(deckid)
    except (TypeError, ValueError):
        numeric_deck_id = str(deckid).strip()

    normalized_side = _normalize_r2_side(side)

    if not normalized_side:
        logger.error(
            "[R2] Invalid side: deck=%s side=%s",
            deckid,
            side,
        )
        raise ValueError("Side must be Plants or Zombies.")

    filename = f"{clean_name}-{numeric_deck_id}{extension}"

    if user_deck:
        key = (
            f"user_decks/"
            f"{normalized_side}/"
            f"{clean_hero}/"
            f"{filename}"
        )
    elif legacy:
        key = (
            f"legacy_decks/"
            f"{normalized_side}/"
            f"{clean_hero}/"
            f"{filename}"
        )
    else:
        key = (
            f"decks/"
            f"{normalized_side}/"
            f"{clean_hero}/"
            f"{filename}"
        )

    uploaded_file.seek(0)
    content = uploaded_file.read()

    if not content:
        logger.error(
            "[R2] Image became empty after reading: deck=%s key=%s",
            deckid,
            key,
        )
        raise ValueError("Image is empty.")

    logger.info(
        "[R2] Uploading object: deck=%s bucket=%s key=%s size=%s content_type=%s",
        deckid,
        R2_BUCKET_NAME,
        key,
        len(content),
        IMAGE_CONTENT_TYPES[extension],
    )

    client = _get_r2_client()

    try:
        client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
            Body=content,
            ContentType=IMAGE_CONTENT_TYPES[extension],
            CacheControl="no-cache",
        )

        logger.info(
            "[R2] Upload completed: deck=%s key=%s",
            deckid,
            key,
        )

        head = client.head_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
        )

        logger.info(
            "[R2] Object verified: deck=%s key=%s size=%s etag=%s cache_control=%s content_type=%s",
            deckid,
            key,
            head.get("ContentLength"),
            head.get("ETag"),
            head.get("CacheControl"),
            head.get("ContentType"),
        )

    except Exception:
        logger.exception(
            "[R2] Upload or verification failed: deck=%s key=%s",
            deckid,
            key,
        )
        raise

    image_url = f"{R2_PUBLIC_URL}/{key}"

    logger.info(
        "[R2] Final image URL: deck=%s url=%s",
        deckid,
        image_url,
    )

    return image_url

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
