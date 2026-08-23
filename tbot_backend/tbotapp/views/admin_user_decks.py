from django.db import DatabaseError

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from ..models import UserDeck
from ..serializers import UserDeckSerializer
from .permissions import is_discord_owner


@api_view(["GET"])
def admin_user_decks(request):
    if not is_discord_owner(request):
        return Response(
            {
                "authorized": False,
                "error": "Owner access required.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        decks = UserDeck.objects.all().order_by("-created_at")

        serializer = UserDeckSerializer(
            decks,
            many=True,
        )

        return Response(
            {
                "authorized": True,
                "decks": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        print("Unable to load admin user decks:", exc)

        return Response(
            {
                "error": "Database query failed while loading user decks.",
                "error_type": exc.__class__.__name__,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["DELETE"])
def admin_user_deck_delete(request, deck_id):
    if not is_discord_owner(request):
        return Response(
            {
                "authorized": False,
                "error": "Owner access required.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        deck = UserDeck.objects.filter(id=deck_id).first()

        if deck is None:
            return Response(
                {
                    "error": "User deck not found.",
                    "deck_id": deck_id,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        deleted_id = deck.id
        deck.delete()

        print(
            f"Admin deleted user deck {deleted_id}"
        )

        return Response(
            {
                "success": True,
                "deleted": True,
                "deck_id": deleted_id,
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        print(
            "Unable to delete admin user deck:",
            exc,
        )

        return Response(
            {
                "error": "Database operation failed while deleting user deck.",
                "error_type": exc.__class__.__name__,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["PUT", "PATCH"])
def admin_user_deck_update(request, deck_id):
    if not is_discord_owner(request):
        return Response(
            {
                "authorized": False,
                "error": "Owner access required.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        deck = UserDeck.objects.filter(id=deck_id).first()

        if deck is None:
            return Response(
                {
                    "error": "User deck not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UserDeckSerializer(
            deck,
            data=request.data,
            partial=request.method == "PATCH",
        )

        if not serializer.is_valid():
            return Response(
                {
                    "error": "Invalid deck data.",
                    "details": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()

        return Response(
            {
                "success": True,
                "deck": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        print(
            "Unable to update admin user deck:",
            exc,
        )

        return Response(
            {
                "error": "Database operation failed.",
                "error_type": exc.__class__.__name__,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )