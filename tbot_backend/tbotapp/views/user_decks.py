import logging

import cloudinary.uploader

from django.db import DatabaseError

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


def upload_deck_image(image_file):
    if not image_file:
        return None

    upload_result = cloudinary.uploader.upload(
        image_file,
        folder="pvzhtbot/decks",
        resource_type="image",
    )

    return upload_result.get("secure_url")


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
        if not deck_data.get(field)
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
        try:
            image_url = upload_deck_image(image_file)

            if not image_url:
                return Response(
                    {
                        "error": "Cloudinary did not return an image URL.",
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            deck_data["image"] = image_url

        except Exception as exc:
            logger.exception(
                "Cloudinary deck image upload failed"
            )

            payload = {
                "error": "Unable to upload deck image.",
                "error_type": exc.__class__.__name__,
            }

            if include_error_detail():
                payload["detail"] = str(exc)

            return Response(
                payload,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    deck_data["profile_id"] = profile.id

    try:
        deck = UserDeck.objects.create(
            **deck_data
        )

        serializer = UserDeckSerializer(deck)

        return Response(
            {
                "success": True,
                "deck": serializer.data,
            },
            status=status.HTTP_201_CREATED,
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


@api_view(["PATCH"])
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

        if "image_file" in request.FILES:
            image_file = request.FILES["image_file"]

            if image_file:
                from cloudinary.uploader import upload

                upload_result = upload(
                    image_file,
                    folder="tbot/user-decks",
                )

                update_data["image"] = upload_result.get("secure_url", "")

        update_data.pop("image_file", None)

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
                "deck": UserDeckSerializer(updated_deck).data,
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
                "message": "Deck deleted successfully.",
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
def shared_user_deck(request, deck_id):
    try:
        deck = (
            UserDeck.objects
            .filter(
                id=deck_id,
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

        profile = (
            UserProfile.objects
            .filter(
                id=deck.profile_id,
            )
            .first()
        )

        if not profile:
            return Response(
                {
                    "error": "Deck owner profile not found.",
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