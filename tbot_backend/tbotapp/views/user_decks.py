
import logging
import os
import re

import boto3

from django.db import DatabaseError
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from rest_framework.response import Response

from ..models import UserDeck, UserProfile
from ..serializers import UserDeckSerializer

from .helpers import (
    get_discord_user,
    include_error_detail,
)

logger = logging.getLogger(__name__)


R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "").rstrip("/")

R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

MAX_IMAGE_SIZE = 10 * 1024 * 1024

CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
}


def get_r2_client():
    required = {
        "R2_ACCOUNT_ID": R2_ACCOUNT_ID,
        "R2_ACCESS_KEY_ID": R2_ACCESS_KEY_ID,
        "R2_SECRET_ACCESS_KEY": R2_SECRET_ACCESS_KEY,
        "R2_BUCKET_NAME": R2_BUCKET_NAME,
        "R2_PUBLIC_URL": R2_PUBLIC_URL,
    }

    missing = [
        name
        for name, value in required.items()
        if not value
    ]

    if missing:
        raise RuntimeError(
            "Missing required environment variables: "
            + ", ".join(missing)
        )

    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


def slugify(value):
    value = str(value or "").strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = value.strip("-")
    return value or "untitled"


def normalize_side(value):
    value = str(value or "").strip().lower()

    if value in {"plant", "plants"}:
        return "plants"

    if value in {"zombie", "zombies"}:
        return "zombies"

    return slugify(value)


def normalize_hero(value):
    return slugify(value)


def get_extension(image_file):
    filename = str(
        getattr(image_file, "name", "")
        or ""
    )

    extension = os.path.splitext(filename)[1].lower()

    if extension in CONTENT_TYPES:
        return extension

    content_type = str(
        getattr(image_file, "content_type", "")
        or ""
    ).lower()

    for extension, known_type in CONTENT_TYPES.items():
        if content_type == known_type:
            return extension

    return ".webp"


def get_content_type(extension):
    return CONTENT_TYPES.get(
        extension.lower(),
        "image/webp",
    )


def upload_deck_image(
    image_file,
    side,
    hero,
    deck_name,
    deck_id,
):
    if not image_file:
        return None

    image_file.seek(0)

    image_data = image_file.read()

    if not image_data:
        raise RuntimeError(
            "Uploaded image is empty."
        )

    if len(image_data) > MAX_IMAGE_SIZE:
        raise RuntimeError(
            "Uploaded image exceeds the 10 MB limit."
        )

    extension = get_extension(image_file)
    content_type = get_content_type(extension)

    side_slug = normalize_side(side)
    hero_slug = normalize_hero(hero)
    deck_slug = slugify(deck_name)

    filename = (
        f"{deck_slug}-{deck_id}"
        f"{extension}"
    )

    key = (
        f"user_decks/"
        f"{side_slug}/"
        f"{hero_slug}/"
        f"{filename}"
    )

    s3 = get_r2_client()

    s3.put_object(
        Bucket=R2_BUCKET_NAME,
        Key=key,
        Body=image_data,
        ContentType=content_type,
        CacheControl="public, max-age=3600",
    )

    head = s3.head_object(
        Bucket=R2_BUCKET_NAME,
        Key=key,
    )

    uploaded_size = int(
        head.get("ContentLength", 0)
    )

    if uploaded_size != len(image_data):
        raise RuntimeError(
            "R2 image verification failed."
        )

    return f"{R2_PUBLIC_URL}/{key}"


def get_current_profile(request):
    discord_user = get_discord_user(request)

    if not discord_user:
        return None, Response(
            {
                "authenticated": False,
                "error": "Authentication required.",
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    discord_id = str(discord_user["id"])

    profile = (
        UserProfile.objects
        .filter(
            discord_id=discord_id,
        )
        .first()
    )

    if not profile:
        return None, Response(
            {
                "authenticated": True,
                "profile_exists": False,
                "error": "Profile not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    return profile, None


@api_view(["GET"])
def user_decks(request):
    profile, error = get_current_profile(request)

    if error:
        return error

    try:
        decks = (
            UserDeck.objects
            .filter(
                profile_id=profile.id,
            )
            .order_by("-id")
        )

        serializer = UserDeckSerializer(
            decks,
            many=True,
        )

        return Response(
            {
                "success": True,
                "decks": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "Unable to load user decks"
        )

        payload = {
            "error": (
                "Database query failed while "
                "loading user decks."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def public_profile_decks_count(
    request,
    profile_slug,
):
    profile = get_object_or_404(
        UserProfile,
        profile_slug=profile_slug,
    )

    discord_user = get_discord_user(request)

    is_owner = (
        discord_user is not None
        and str(discord_user["id"])
        == str(profile.discord_id)
    )

    if not profile.is_public and not is_owner:
        return Response(
            {
                "error": "This profile is private.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    deck_count = UserDeck.objects.filter(
        profile_id=profile.id
    ).count()

    return Response(
        {
            "success": True,
            "deck_count": deck_count,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@parser_classes([
    JSONParser,
    FormParser,
    MultiPartParser,
])
def user_deck_create(request):
    profile, error = get_current_profile(request)

    if error:
        return error

    creator = str(
        request.data.get("creator", "")
    ).strip()

    if not creator:
        return Response(
            {
                "error": "Creator is required.",
                "fields": ["creator"],
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    allowed_fields = {
        "name",
        "hero",
        "side",
        "category",
        "archetype",
        "description",
        "image",
        "cost",
        "aliases",
        "cards",
        "inspiration",
        "optimization",
        "suggested_date",
        "updated_date",
        "deck_doc",
    }

    deck_data = {}

    for field in allowed_fields:
        if field in request.data:
            deck_data[field] = request.data[field]

    required_fields = {
        "name",
        "hero",
        "side",
        "category",
        "archetype",
    }

    missing_fields = [
        field
        for field in required_fields
        if not str(
            deck_data.get(field, "")
        ).strip()
    ]

    if missing_fields:
        return Response(
            {
                "error": "Missing required deck fields.",
                "fields": missing_fields,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    image_file = request.FILES.get("image_file")

    if image_file:
        deck_data.pop("image", None)

    try:
        deck = UserDeck.objects.create(
            profile_id=profile.id,
            creator=creator,
            **deck_data,
        )

    except DatabaseError as exc:
        logger.exception(
            "User deck creation failed"
        )

        payload = {
            "error": (
                "Database query failed while "
                "creating user deck."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if image_file:
        try:
            image_url = upload_deck_image(
                image_file,
                deck.side,
                deck.hero,
                deck.name,
                deck.id,
            )

            if not image_url:
                deck.delete()

                return Response(
                    {
                        "error": (
                            "R2 did not return "
                            "an image URL."
                        ),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            deck.image = image_url
            deck.save(update_fields=["image"])

        except Exception as exc:
            logger.exception(
                "R2 user deck image upload failed"
            )

            try:
                deck.delete()
            except Exception:
                logger.exception(
                    "Unable to remove deck after "
                    "R2 upload failure"
                )

            payload = {
                "error": (
                    "Unable to upload deck image."
                ),
                "error_type": exc.__class__.__name__,
            }

            if include_error_detail():
                payload["detail"] = str(exc)

            return Response(
                payload,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    serializer = UserDeckSerializer(deck)

    return Response(
        {
            "success": True,
            "deck": serializer.data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["PATCH"])
@parser_classes([
    JSONParser,
    FormParser,
    MultiPartParser,
])
def user_deck_update(request, deck_id):
    profile, error = get_current_profile(request)

    if error:
        return error

    try:
        deck = (
            UserDeck.objects
            .filter(
                id=deck_id,
                profile_id=profile.id,
            )
            .first()
        )

        if not deck:
            return Response(
                {
                    "error": "Deck not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        update_data = request.data.copy()

        image_file = request.FILES.get(
            "image_file"
        )

        update_data.pop(
            "image_file",
            None,
        )

        if image_file:
            side = update_data.get(
                "side",
                deck.side,
            )

            hero = update_data.get(
                "hero",
                deck.hero,
            )

            deck_name = update_data.get(
                "name",
                deck.name,
            )

            serializer = UserDeckSerializer(
                deck,
                data=update_data,
                partial=True,
            )

            if not serializer.is_valid():
                return Response(
                    {
                        "error": "Unable to update deck.",
                        "fields": serializer.errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                image_url = upload_deck_image(
                    image_file,
                    side,
                    hero,
                    deck_name,
                    deck.id,
                )

                if not image_url:
                    return Response(
                        {
                            "error": (
                                "R2 did not return "
                                "an image URL."
                            ),
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

                update_data["image"] = image_url

            except Exception as exc:
                logger.exception(
                    "R2 user deck image replacement failed"
                )

                payload = {
                    "error": (
                        "Unable to upload deck image."
                    ),
                    "error_type": (
                        exc.__class__.__name__
                    ),
                }

                if include_error_detail():
                    payload["detail"] = str(exc)

                return Response(
                    payload,
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        serializer = UserDeckSerializer(
            deck,
            data=update_data,
            partial=True,
        )

        if not serializer.is_valid():
            return Response(
                {
                    "error": "Unable to update deck.",
                    "fields": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated_deck = serializer.save()

        return Response(
            {
                "success": True,
                "deck": UserDeckSerializer(
                    updated_deck
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "User deck update failed"
        )

        payload = {
            "error": (
                "Database query failed while "
                "updating user deck."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    except Exception as exc:
        logger.exception(
            "Unexpected user deck update failure"
        )

        payload = {
            "error": "Unable to update user deck.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["DELETE"])
def user_deck_delete(request, deck_id):
    profile, error = get_current_profile(request)

    if error:
        return error

    try:
        deck = (
            UserDeck.objects
            .filter(
                id=deck_id,
                profile_id=profile.id,
            )
            .first()
        )

        if not deck:
            return Response(
                {
                    "error": "Deck not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        deck.delete()

        return Response(
            {
                "success": True,
                "message": (
                    "Deck deleted successfully."
                ),
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "User deck deletion failed"
        )

        payload = {
            "error": (
                "Database query failed while "
                "deleting user deck."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def shared_user_deck(
    request,
    profile_slug,
    deck_id,
):
    try:
        profile = (
            UserProfile.objects
            .filter(
                profile_slug=profile_slug,
            )
            .first()
        )

        if not profile:
            return Response(
                {
                    "error": "Profile not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        deck = (
            UserDeck.objects
            .filter(
                id=deck_id,
                profile_id=profile.id,
            )
            .first()
        )

        if not deck:
            return Response(
                {
                    "error": "Shared deck not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UserDeckSerializer(deck)

        return Response(
            {
                "success": True,
                "deck": serializer.data,
                "profile": {
                    "id": profile.id,
                    "profile_slug": profile.profile_slug,
                    "display_name": profile.display_name,
                    "avatar": profile.avatar,
                    "is_public": profile.is_public,
                },
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "Unable to load shared user deck"
        )

        payload = {
            "error": (
                "Database query failed while "
                "loading shared deck."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
