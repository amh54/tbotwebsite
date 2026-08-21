import logging

from django.db import DatabaseError

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import UserDeck, UserProfile
from ..serializers import UserDeckSerializer
from .helpers import (
    get_discord_user,
    include_error_detail,
)


logger = logging.getLogger(__name__)


# ============================================================
# USER DECKS
# ============================================================

@api_view(["GET"])
def user_decks(request):
    try:
        discord_user = get_discord_user(request)

        if not discord_user:
            return Response(
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
            return Response(
                {
                    "authenticated": True,
                    "profile_exists": False,
                    "error": "Profile not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        decks = (
            UserDeck.objects
            .filter(
                profile_id=profile.id,
            )
            .order_by(
                "side",
                "hero",
                "name",
            )
        )

        serializer = UserDeckSerializer(
            decks,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "User deck query failed"
        )

        payload = {
            "error": (
                "Database query failed for "
                "user decks."
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
# USER DECK COUNT
# ============================================================

@api_view(["GET"])
def user_deck_count(request):
    try:
        discord_user = get_discord_user(request)

        if not discord_user:
            return Response(
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
            return Response(
                {
                    "authenticated": True,
                    "profile_exists": False,
                    "error": "Profile not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        total = (
            UserDeck.objects
            .filter(
                profile_id=profile.id,
            )
            .count()
        )

        return Response(
            {
                "count": total,
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "User deck count query failed"
        )

        payload = {
            "error": (
                "Database query failed for "
                "user deck count."
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
# USER DECK DETAIL
# ============================================================

@api_view(["GET"])
def user_deck_detail(request, deck_id):
    try:
        discord_user = get_discord_user(request)

        if not discord_user:
            return Response(
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
            return Response(
                {
                    "authenticated": True,
                    "profile_exists": False,
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
                    "error": "Deck not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UserDeckSerializer(deck)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "User deck detail query failed"
        )

        payload = {
            "error": (
                "Database query failed for "
                "user deck."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )