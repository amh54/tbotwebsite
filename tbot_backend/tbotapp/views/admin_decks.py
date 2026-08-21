import logging

from django.db import DatabaseError
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from ..models import Decklist, WebCards
from ..serializers import AdminDeckSerializer

from .helpers import (
    owner_required,
    include_error_detail,
    normalize_card_list,
    save_deck_image,
)

logger = logging.getLogger(__name__)


# ============================================================
# ADMIN DECKLISTS
# ============================================================

@api_view(["GET"])
@owner_required
def admin_decklists(request):
    try:
        decks = (
            Decklist.objects
            .all()
            .order_by(
                "side",
                "hero",
                "name",
            )
        )

        serializer = AdminDeckSerializer(
            decks,
            many=True,
        )

        return Response(serializer.data)

    except DatabaseError as exc:
        logger.exception(
            "Admin decklist query failed"
        )

        payload = {
            "error": "Database query failed for admin decklists.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================================
# ADMIN DECKLIST CREATE
# ============================================================

@api_view(["POST"])
@owner_required
@parser_classes([MultiPartParser, FormParser])
def admin_decklist_create(request):
    data = request.data.copy()

    # ========================================================
    # CARDS
    # ========================================================

    if "cards" in data:
        selected_cards = normalize_card_list(
            data.get("cards")
        )

        existing_cards = set(
            WebCards.objects
            .filter(
                card_name__in=selected_cards
            )
            .values_list(
                "card_name",
                flat=True,
            )
        )

        invalid_cards = [
            card
            for card in selected_cards
            if card not in existing_cards
        ]

        if invalid_cards:
            return Response(
                {
                    "error": (
                        "One or more selected cards "
                        "do not exist."
                    ),
                    "invalid_cards": invalid_cards,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        data["cards"] = ", ".join(selected_cards)

    # ========================================================
    # IMAGE
    # ========================================================

    uploaded_image = (
        request.FILES.get("image_file")
        or request.FILES.get("image")
    )

    if uploaded_image:
        try:
            image_url = save_deck_image(
                uploaded_image,
                deckid=data.get("deckid") or "",
                deck_name=data.get("name") or "deck",
            )

            data["image"] = image_url

        except ValueError as exc:
            return Response(
                {
                    "error": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as exc:
            logger.exception(
                "Unable to save deck image."
            )

            payload = {
                "error": "Unable to save uploaded image.",
                "error_type": exc.__class__.__name__,
            }

            if include_error_detail():
                payload["detail"] = str(exc)

            return Response(
                payload,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    data.pop("image_file", None)
    data.pop("remove_image", None)

    # ========================================================
    # CREATE
    # ========================================================

    serializer = AdminDeckSerializer(
        data=data
    )

    if not serializer.is_valid():
        return Response(
            {
                "error": "Invalid decklist data.",
                "fields": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        deck = serializer.save()

    except DatabaseError as exc:
        logger.exception(
            "Unable to create decklist."
        )

        payload = {
            "error": "Database creation failed.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        AdminDeckSerializer(deck).data,
        status=status.HTTP_201_CREATED,
    )


# ============================================================
# ADMIN DECKLIST UPDATE
# ============================================================

@api_view(["PATCH"])
@owner_required
@parser_classes([MultiPartParser, FormParser])
def admin_decklist_update(request, deckid):
    print("\n========================================")
    print("ADMIN DECKLIST UPDATE START")
    print("DECK ID:", deckid)
    print("METHOD:", request.method)
    print("CONTENT TYPE:", request.content_type)
    print("FILES:", request.FILES)
    print("DATA:", request.data)
    print("========================================")

    try:
        deck = Decklist.objects.get(
            deckid=deckid
        )

    except Decklist.DoesNotExist:
        print("DECK NOT FOUND")

        return Response(
            {
                "error": "Decklist not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    except DatabaseError as exc:
        print("DATABASE ERROR:", repr(exc))

        logger.exception(
            "Unable to retrieve decklist %s",
            deckid,
        )

        payload = {
            "error": "Database query failed.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    print("DECK FOUND:", deck.deckid)

    # ========================================================
    # COPY REQUEST DATA
    # ========================================================

    data = request.data.copy()

    print("COPIED DATA:", data)

    # ========================================================
    # CARDS
    # ========================================================

    if "cards" in data:
        print("PROCESSING CARDS")

        selected_cards = normalize_card_list(
            data.get("cards")
        )

        print(
            "SELECTED CARDS:",
            selected_cards,
        )

        existing_cards = set(
            WebCards.objects
            .filter(
                card_name__in=selected_cards
            )
            .values_list(
                "card_name",
                flat=True,
            )
        )

        print(
            "EXISTING CARDS:",
            existing_cards,
        )

        invalid_cards = [
            card
            for card in selected_cards
            if card not in existing_cards
        ]

        print(
            "INVALID CARDS:",
            invalid_cards,
        )

        if invalid_cards:
            print(
                "RETURNING 400 BECAUSE OF INVALID CARDS"
            )

            return Response(
                {
                    "error": (
                        "One or more selected cards "
                        "do not exist."
                    ),
                    "invalid_cards": invalid_cards,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        data["cards"] = ", ".join(
            selected_cards
        )

    # ========================================================
    # IMAGE UPLOAD
    # ========================================================

    uploaded_image = (
        request.FILES.get("image_file")
        or request.FILES.get("image")
    )

    print(
        "UPLOADED IMAGE:",
        uploaded_image,
    )

    if uploaded_image:
        print(
            "STARTING CLOUDINARY UPLOAD"
        )

        try:
            image_url = save_deck_image(
                uploaded_image,
                deckid=deckid,
                deck_name=data.get("name") or deck.name,
            )

            print(
                "CLOUDINARY IMAGE URL:",
                image_url,
            )

            data["image"] = image_url

        except ValueError as exc:
            print(
                "IMAGE VALUE ERROR:",
                repr(exc),
            )

            return Response(
                {
                    "error": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as exc:
            print(
                "IMAGE UPLOAD ERROR:",
                repr(exc),
            )

            logger.exception(
                "Unable to save deck image."
            )

            payload = {
                "error": "Unable to save uploaded image.",
                "error_type": exc.__class__.__name__,
            }

            if include_error_detail():
                payload["detail"] = str(exc)

            return Response(
                payload,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # ========================================================
    # REMOVE IMAGE
    # ========================================================

    remove_image = str(
        data.get("remove_image", "")
    ).lower() in {
        "1",
        "true",
        "yes",
        "on",
    }

    if remove_image and not uploaded_image:
        data["image"] = ""

    data.pop(
        "remove_image",
        None,
    )

    data.pop(
        "image_file",
        None,
    )

    print(
        "DATA BEFORE SERIALIZER:",
        data,
    )

    # ========================================================
    # SERIALIZE
    # ========================================================

    serializer = AdminDeckSerializer(
        deck,
        data=data,
        partial=True,
    )

    print("SERIALIZER CREATED")

    if not serializer.is_valid():
        print("========================================")
        print("DECK UPDATE SERIALIZER ERROR")
        print(serializer.errors)
        print("========================================")

        return Response(
            {
                "error": "Invalid decklist data.",
                "fields": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    print("SERIALIZER VALID")

    # ========================================================
    # SAVE
    # ========================================================

    try:
        updated_deck = serializer.save()

        print(
            "DECK SAVED:",
            updated_deck.deckid,
        )

        print(
            "NEW IMAGE:",
            updated_deck.image,
        )

    except DatabaseError as exc:
        print(
            "DATABASE SAVE ERROR:",
            repr(exc),
        )

        logger.exception(
            "Unable to update decklist %s",
            deckid,
        )

        payload = {
            "error": "Database update failed.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    print(
        "ADMIN DECKLIST UPDATE SUCCESS"
    )

    print(
        "========================================\n"
    )

    return Response(
        AdminDeckSerializer(
            updated_deck
        ).data,
        status=status.HTTP_200_OK,
    )


# ============================================================
# ADMIN DECKLIST DELETE
# ============================================================

@csrf_exempt
@api_view(["DELETE"])
@owner_required
def admin_decklist_delete(
    request,
    deckid,
):
    try:
        deck = Decklist.objects.get(
            deckid=deckid
        )

    except Decklist.DoesNotExist:
        return Response(
            {
                "error": "Decklist not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    except DatabaseError as exc:
        logger.exception(
            "Unable to retrieve decklist %s for deletion",
            deckid,
        )

        payload = {
            "error": "Database query failed.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        deck.delete()

    except DatabaseError as exc:
        logger.exception(
            "Unable to delete decklist %s",
            deckid,
        )

        payload = {
            "error": "Database deletion failed.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {
            "success": True,
            "deleted": deckid,
        },
        status=status.HTTP_200_OK,
    )