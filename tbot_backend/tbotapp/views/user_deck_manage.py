import logging

from django.db import DatabaseError

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import UserDeck, UserProfile, UserDeckSuggestion
from ..serializers import UserDeckSerializer
from .helpers import (
    get_discord_user,
    include_error_detail,
)


logger = logging.getLogger(__name__)


# ============================================================
# CURRENT PROFILE HELPER
# ============================================================

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

    discord_id = str(
        discord_user["id"]
    )

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


# ============================================================
# CREATE USER DECK
# ============================================================

@api_view(["POST"])
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
        "creator",
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
                "error": (
                    "Missing required deck fields."
                ),
                "fields": missing_fields,
            },
            status=status.HTTP_400_BAD_REQUEST,
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


# ============================================================
# UPDATE USER DECK
# ============================================================

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

        update_data = {}

        for field in allowed_fields:
            if field in request.data:
                update_data[field] = request.data[field]

        if not update_data:
            return Response(
                {
                    "error": (
                        "No valid deck fields "
                        "were provided."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        for field, value in update_data.items():
            setattr(
                deck,
                field,
                value,
            )

        deck.save()

        # ========================================================
        # CHECK FOR DISCORD SUBMISSION
        # ========================================================

        submission = (
        UserDeckSuggestion.objects
        .filter(
        deck_id=deck.id,
        status="pending",
        consent_status="confirmed",
        discord_thread_id__isnull=False,
    )
    .first()
)

        if submission:
            submission.discord_update_pending = True
            submission.save(
                update_fields=["discord_update_pending"]
        )

            logger.info(
                "User deck %s was updated and is linked "
                "to Discord submission #%s. "
                "Marked submission for Discord update.",
                deck.id,
                submission.id,
            )

        serializer = UserDeckSerializer(deck)

        return Response(
            {
                "success": True,
                "deck": serializer.data,
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


# ============================================================
# DELETE USER DECK
# ============================================================

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