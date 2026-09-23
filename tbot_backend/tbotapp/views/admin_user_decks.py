from django.db import DatabaseError

from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework import status

from ..models import UserDeck
from ..serializers import UserDeckSerializer
from .permissions import is_discord_owner
from .user_decks import upload_deck_image


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
        print(
            "Unable to load admin user decks:",
            exc,
        )

        return Response(
            {
                "error": (
                    "Database query failed while "
                    "loading user decks."
                ),
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
        deck = (
            UserDeck.objects
            .filter(id=deck_id)
            .first()
        )

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
                "error": (
                    "Database operation failed while "
                    "deleting user deck."
                ),
                "error_type": exc.__class__.__name__,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["PUT", "PATCH"])
@parser_classes([
    JSONParser,
    FormParser,
    MultiPartParser,
])
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
        deck = (
            UserDeck.objects
            .filter(id=deck_id)
            .first()
        )

        if deck is None:
            return Response(
                {
                    "error": "User deck not found.",
                    "deck_id": deck_id,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        update_data = request.data.copy()

        # These dates should not come from the admin
        # browser. The server controls the update timestamp.
        update_data.pop("suggested_date", None)
        update_data.pop("updated_date", None)

        # image_file is an uploaded file and is not a
        # UserDeckSerializer field.
        image_file = request.FILES.get("image_file")

        update_data.pop("image_file", None)

        # --------------------------------------------------
        # Upload a new image to Cloudflare R2
        # --------------------------------------------------

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

                # Give the serializer the resulting
                # public R2 URL.
                update_data["image"] = image_url

                print(
                    f"Admin uploaded new R2 image "
                    f"for user deck {deck.id}: "
                    f"{image_url}"
                )

            except Exception as exc:
                print(
                    "R2 admin user deck image upload failed:",
                    exc,
                )

                return Response(
                    {
                        "error": (
                            "Unable to upload deck image."
                        ),
                        "error_type": (
                            exc.__class__.__name__
                        ),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        # --------------------------------------------------
        # Update deck
        # --------------------------------------------------

        serializer = UserDeckSerializer(
            deck,
            data=update_data,
            partial=True,
        )

        if not serializer.is_valid():
            print(
                f"Admin user deck {deck_id} "
                "validation failed:",
                serializer.errors,
            )

            return Response(
                {
                    "error": "Invalid deck data.",
                    "details": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated_deck = serializer.save()

        # Keep updated_date controlled by the server.
        updated_deck.updated_date = updated_deck.modified_at
        updated_deck.save(
            update_fields=[
                "updated_date",
            ]
        )

        serializer = UserDeckSerializer(
            updated_deck
        )

        print(
            f"Admin updated user deck {deck_id}"
        )

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