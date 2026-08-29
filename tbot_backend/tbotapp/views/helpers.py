import json
import logging
import os
import re
import logging
import requests

from django.utils import timezone

from ..models import UserProfile
import cloudinary.uploader

from django.conf import settings

logger = logging.getLogger(__name__)


def include_error_detail():
    return settings.DEBUG or str(
        os.getenv("API_ERROR_DETAILS", "")
    ).strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }





logger = logging.getLogger(__name__)


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

    # ============================================================
    # CURRENT STORED PROFILE
    # ============================================================

    profile = (
        UserProfile.objects
        .filter(
            discord_id=discord_id
        )
        .first()
    )

    # ============================================================
    # REFRESH DISCORD PROFILE
    # ============================================================

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

                # Make sure this token belongs to the
                # Discord account stored in the session.
                if (
                    current_discord_id
                    and str(current_discord_id) == discord_id
                ):
                    discord_username = str(
                        discord_data.get(
                            "username",
                            ""
                        )
                    ).strip()

                    discord_global_name = (
                        discord_data.get(
                            "global_name"
                        )
                        or discord_username
                        or f"discord_{discord_id}"
                    )

                    # ====================================================
                    # DISCORD AVATAR
                    # ====================================================
                    #
                    # Keep the RAW Discord avatar hash.
                    #
                    # Static:
                    #     123456789
                    #
                    # Animated:
                    #     a_123456789
                    #
                    # Do NOT build the CDN URL here.

                    discord_avatar = (
                        discord_data.get("avatar")
                        or None
                    )

                    # ====================================================
                    # UPDATE SESSION
                    # ====================================================

                    request.session["discord_id"] = (
                        discord_id
                    )

                    request.session["discord_username"] = (
                        discord_username
                    )

                    request.session["discord_global_name"] = (
                        discord_global_name
                    )

                    # Store exactly what Discord returned.
                    #
                    # This can be:
                    #     "123456789"
                    #     "a_123456789"
                    #     None
                    #
                    # Do not leave an old avatar in the session
                    # when Discord says the user currently has no
                    # custom avatar.

                    request.session["discord_avatar"] = (
                        discord_avatar
                    )

                    # ====================================================
                    # UPDATE DATABASE
                    # ====================================================

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
                            profile.display_name
                            != discord_global_name
                        ):
                            profile.display_name = (
                                discord_global_name
                            )
                            changed = True

                        # IMPORTANT:
                        #
                        # Always synchronize the avatar with Discord.
                        #
                        # This handles:
                        #
                        # NULL -> a_123456789
                        # old hash -> a_123456789
                        # a_old -> a_new
                        # a_123456789 -> NULL
                        #
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

                    # ====================================================
                    # RETURN CURRENT DISCORD PROFILE
                    # ====================================================

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

    # ============================================================
    # FALLBACK TO DATABASE / SESSION
    # ============================================================

    discord_username = request.session.get(
        "discord_username"
    )

    if not discord_username:
        if profile and profile.username:
            discord_username = profile.username

    if not discord_username:
        if request.user.is_authenticated:
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

    if not discord_global_name:
        if profile and profile.display_name:
            discord_global_name = (
                profile.display_name
            )

    if not discord_global_name:
        if request.user.is_authenticated:
            discord_global_name = (
                request.user.first_name
                or discord_username
            )

    if not discord_global_name:
        discord_global_name = (
            discord_username
            or f"discord_{discord_id}"
        )

    # Prefer the database avatar because it is the
    # persistent source of truth.
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



MAX_CARD_RATIO = 4
TARGET_CARD_RATIO_TOTAL = 40


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

        parsed_cards.append({
            "name": name,
            "count": count,
        })

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
):
    if not uploaded_file:
        return None

    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif",
    }

    original_name = (
        uploaded_file.name or ""
    )

    extension = os.path.splitext(
        original_name
    )[1].lower()

    if extension not in allowed_extensions:
        raise ValueError(
            "Unsupported image type. "
            "Use JPG, JPEG, PNG, WEBP, or GIF."
        )

    max_size = 10 * 1024 * 1024

    if uploaded_file.size > max_size:
        raise ValueError(
            "Image is too large. Maximum size is 10 MB."
        )

    clean_name = str(
        deck_name
        or uploaded_file.name
        or "deck"
    ).strip()

    clean_name = os.path.splitext(
        clean_name
    )[0]

    clean_name = clean_name.lower()

    clean_name = re.sub(
        r"[^a-z0-9]+",
        "-",
        clean_name,
    )

    clean_name = clean_name.strip("-")

    if not clean_name:
        clean_name = "deck"

    public_id = (
        f"tbot/decklists/"
        f"{deckid}-"
        f"{clean_name}"
    )

    result = cloudinary.uploader.upload(
        uploaded_file,
        public_id=public_id,
        resource_type="image",
        overwrite=True,
    )

    return result["secure_url"]
# ============================================================
# OWNER REQUIRED DECORATOR
# ============================================================

from functools import wraps
from rest_framework.response import Response
from rest_framework import status


def owner_required(view_func):
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        discord_id = request.session.get("discord_id")

        if not discord_id:
            return Response(
                {
                    "authenticated": False,
                    "error": "Authentication required.",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        owner_id = str(
            getattr(settings, "DISCORD_OWNER_ID", "")
        ).strip()

        if not owner_id:
            logger.error(
                "DISCORD_OWNER_ID is not configured."
            )
            return Response(
                {
                    "error": "Owner configuration is missing."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if str(discord_id) != owner_id:
            return Response(
                {
                    "error": "Owner permissions required."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return view_func(request, *args, **kwargs)

    return wrapped_view