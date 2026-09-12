import logging

from django.db import DatabaseError

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import UserSuggestion
from ..serializers import (
    UserSuggestionSerializer,
    AdminUserSuggestionSerializer,
)
from .permissions import is_discord_owner

logger = logging.getLogger(__name__)


def _get_discord_id(request):
    discord_id = request.session.get("discord_id")

    if not discord_id:
        return None

    try:
        return int(discord_id)
    except (TypeError, ValueError):
        return None


def _require_owner(request):
    if not is_discord_owner(request):
        return Response(
            {
                "detail": "You do not have permission to access suggestions."
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    return None


@api_view(["POST"])
def suggestion_create(request):
    discord_id = _get_discord_id(request)

    if not discord_id:
        return Response(
            {
                "detail": "You must be logged in to submit a suggestion.",
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        profile = None

        try:
            from ..models import UserProfile

            profile = (
                UserProfile.objects
                .filter(discord_id=str(discord_id))
                .first()
            )
        except Exception:
            logger.exception(
                "Unable to load Discord profile for suggestion."
            )

        discord_username = ""

        if profile:
            discord_username = (
                profile.display_name
                or profile.username
                or ""
            )

        data = request.data.copy()

        data.pop("discord_id", None)
        data.pop("status", None)
        data.pop("admin_response", None)
        data.pop("admin_notes", None)

        data["discord_id"] = discord_id
        data["discord_username"] = discord_username
        data["status"] = "pending"

        serializer = UserSuggestionSerializer(
            data=data,
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        suggestion = serializer.save(
            discord_id=discord_id,
            discord_username=discord_username,
            status="pending",
        )

        return Response(
            UserSuggestionSerializer(suggestion).data,
            status=status.HTTP_201_CREATED,
        )

    except DatabaseError:
        logger.exception(
            "Database error creating suggestion for Discord user %s.",
            discord_id,
        )

        return Response(
            {
                "detail": "Unable to submit suggestion.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    except Exception:
        logger.exception(
            "Unexpected error creating suggestion for Discord user %s.",
            discord_id,
        )

        return Response(
            {
                "detail": "Unable to submit suggestion.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def user_suggestions(request):
    discord_id = _get_discord_id(request)

    if not discord_id:
        return Response(
            {
                "detail": "You must be logged in to view your suggestions.",
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        suggestions = (
            UserSuggestion.objects
            .filter(discord_id=discord_id)
            .order_by("-created_at")
        )

        serializer = UserSuggestionSerializer(
            suggestions,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except DatabaseError:
        logger.exception(
            "Database error loading suggestions for Discord user %s.",
            discord_id,
        )

        return Response(
            {
                "detail": "Unable to load your suggestions.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    except Exception:
        logger.exception(
            "Unexpected error loading suggestions for Discord user %s.",
            discord_id,
        )

        return Response(
            {
                "detail": "Unable to load your suggestions.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def user_suggestion_detail(request, suggestion_id):
    discord_id = _get_discord_id(request)

    if not discord_id:
        return Response(
            {
                "detail": "You must be logged in to view this suggestion.",
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        suggestion = (
            UserSuggestion.objects
            .filter(
                id=suggestion_id,
                discord_id=discord_id,
            )
            .first()
        )

        if not suggestion:
            return Response(
                {
                    "detail": "Suggestion not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UserSuggestionSerializer(
            suggestion,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except DatabaseError:
        logger.exception(
            "Database error loading suggestion %s for Discord user %s.",
            suggestion_id,
            discord_id,
        )

        return Response(
            {
                "detail": "Unable to load this suggestion.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    except Exception:
        logger.exception(
            "Unexpected error loading suggestion %s for Discord user %s.",
            suggestion_id,
            discord_id,
        )

        return Response(
            {
                "detail": "Unable to load this suggestion.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def admin_suggestions(request):
    permission_error = _require_owner(request)

    if permission_error:
        return permission_error

    try:
        suggestions = (
            UserSuggestion.objects
            .all()
            .order_by("-created_at")
        )

        serializer = AdminUserSuggestionSerializer(
            suggestions,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except DatabaseError:
        logger.exception(
            "Database error loading suggestions."
        )

        return Response(
            {
                "detail": "Unable to load suggestions.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    except Exception:
        logger.exception(
            "Unexpected error loading suggestions."
        )

        return Response(
            {
                "detail": "Unable to load suggestions.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET", "PATCH", "DELETE"])
def admin_suggestion_detail(request, suggestion_id):
    permission_error = _require_owner(request)

    if permission_error:
        return permission_error

    try:
        suggestion = (
            UserSuggestion.objects
            .filter(id=suggestion_id)
            .first()
        )

        if not suggestion:
            return Response(
                {
                    "detail": "Suggestion not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.method == "GET":
            serializer = AdminUserSuggestionSerializer(
                suggestion,
            )

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        if request.method == "PATCH":
            data = request.data.copy()

            data.pop("discord_id", None)
            data.pop("discord_username", None)
            data.pop("created_at", None)
            data.pop("updated_at", None)

            serializer = AdminUserSuggestionSerializer(
                suggestion,
                data=data,
                partial=True,
            )

            if not serializer.is_valid():
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST,
                )

            updated_suggestion = serializer.save()

            return Response(
                AdminUserSuggestionSerializer(
                    updated_suggestion
                ).data,
                status=status.HTTP_200_OK,
            )

        if request.method == "DELETE":
            suggestion.delete()

            return Response(
                status=status.HTTP_204_NO_CONTENT,
            )

        return Response(
            {
                "detail": "Unsupported request method.",
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    except DatabaseError:
        logger.exception(
            "Database error processing suggestion %s.",
            suggestion_id,
        )

        return Response(
            {
                "detail": "Unable to process suggestion.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    except Exception:
        logger.exception(
            "Unexpected error processing suggestion %s.",
            suggestion_id,
        )

        return Response(
            {
                "detail": "Unable to process suggestion.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )