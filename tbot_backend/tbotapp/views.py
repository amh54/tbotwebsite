import json
import logging
import os
from django.utils import timezone

import requests

from functools import wraps

from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.db import DatabaseError, connection
from django.http import JsonResponse
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import (
    Decklist,
     LegacyDecklist,
    WebCards,
    KeepOrScrap,
    UserProfile,
    UserDeck,
)
from .serializers import (
    PublicDeckSerializer,
    AdminLegacyDeckSerializer,
    AdminDeckSerializer,
    PublicLegacyDeckSerializer,
    WebCardSerializer,
    KeepOrScrapSerializer,
    UserDeckSerializer
)

logger = logging.getLogger(__name__)


# ============================================================
# HELPERS
# ============================================================

def include_error_detail():
    return settings.DEBUG or str(
        os.getenv("API_ERROR_DETAILS", "")
    ).strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


# ============================================================
# CSRF TOKEN
# ============================================================

@api_view(["GET"])
@ensure_csrf_cookie
def csrf_token(request):
    token = get_token(request)

    return Response({
        "csrfToken": token,
    })

# ============================================================
# OWNER PERMISSIONS
# ============================================================

def is_discord_owner(request):

    if not request.user.is_authenticated:
        return False

    owner_id = str(
        settings.DISCORD_OWNER_ID
    ).strip()

    if not owner_id:
        return False

    # Session Discord ID
    session_discord_id = request.session.get(
        "discord_id"
    )

    if (
        session_discord_id is not None
        and str(session_discord_id).strip() == owner_id
    ):
        return True

    # Django username
    username = str(
        request.user.username or ""
    ).strip()

    expected_username = f"discord_{owner_id}"

    if username == expected_username:
        return True

    return False


def owner_required(view_func):

    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):

        if not is_discord_owner(request):

            logger.warning(
                "Owner permission denied. "
                "user=%s authenticated=%s username=%s "
                "session_discord_id=%s",
                request.user,
                request.user.is_authenticated,
                getattr(
                    request.user,
                    "username",
                    None,
                ),
                request.session.get(
                    "discord_id"
                ),
            )

            return Response(
                {
                    "error": "Owner permissions required."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return view_func(
            request,
            *args,
            **kwargs,
        )

    return wrapped_view


# ============================================================
# ADMIN PERMISSION CHECK
# ============================================================

@api_view(["GET"])
@ensure_csrf_cookie
def admin_check(request):

    if not request.user.is_authenticated:

        return Response(
            {
                "authorized": False,
                "is_owner": False,
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not is_discord_owner(request):

        return Response(
            {
                "authorized": False,
                "is_owner": False,
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    return Response({
        "authorized": True,
        "is_owner": True,
    })


# ============================================================
# OWNER ACTION TEST
# ============================================================

@api_view(["POST"])
@owner_required
def owner_action(request):

    return Response({
        "success": True,
    })


# ============================================================
# DECKLISTS
# ============================================================

@api_view(["GET"])
def decklists(request):

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    current_database(),
                    current_schema(),
                    current_user
            """)

            db_info = cursor.fetchone()

            cursor.execute("""
                SELECT to_regclass('public.web_decks')
            """)

            web_decks = cursor.fetchone()

        print("====================================")
        print("DATABASE INFO:", db_info)
        print("WEB_DECKS:", web_decks)
        print("====================================")

        decks = Decklist.objects.all()

        serializer = PublicDeckSerializer(
    decks,
    many=True,
)

        return Response(serializer.data)

    except DatabaseError as exc:

        logger.exception(
            "Decklist query failed"
        )

        payload = {
            "error": "Database query failed for decklists.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
# ============================================================
# PUBLIC LEGACY DECKLISTS
# ============================================================

@api_view(["GET"])
def legacy_decklists(request):
    try:
        decks = LegacyDecklist.objects.all().order_by(
            "side",
            "hero",
            "name",
        )

        serializer = PublicLegacyDeckSerializer(
            decks,
            many=True,
        )

        return Response(serializer.data)

    except DatabaseError as exc:
        logger.exception(
            "Unable to load legacy decklists: %s",
            exc,
        )

        return Response(
            {
                "error": "Unable to load legacy decklists.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================================
# PUBLIC LEGACY DECK COUNT
# ============================================================

@api_view(["GET"])
def legacy_decklist_count(request):
    try:
        count = LegacyDecklist.objects.count()

        return Response({
            "count": count,
        })

    except DatabaseError as exc:
        logger.exception(
            "Unable to load legacy deck count: %s",
            exc,
        )

        return Response(
            {
                "error": "Unable to load legacy deck count.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
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
# ADMIN LEGACY DECKLISTS
# ============================================================
# ============================================================
# DECK CARD VALIDATION
# ============================================================

def validate_deck_cards(side, hero, selected_cards):
    side = str(side or "").strip()

    if side.lower() in {"plant", "plants"}:
        side = "Plants"
    elif side.lower() in {"zombie", "zombies"}:
        side = "Zombies"

    hero_name = str(hero or "").strip()

    if not hero_name:
        return {
            "error": "A hero is required."
        }

    # --------------------------------------------------------
    # HERO
    # --------------------------------------------------------

    hero_card = (
        WebCards.objects
        .filter(
            card_name__iexact=hero_name,
            side__iexact=side,
        )
        .first()
    )

    if not hero_card:
        return {
            "error": "The selected hero does not belong to the selected deck side.",
            "side": side,
            "hero": hero_name,
        }

    hero_rarity = str(
        getattr(hero_card, "set_rarity", "") or ""
    ).strip().lower()

    if "hero" not in hero_rarity:
        return {
            "error": "The selected card is not a valid hero.",
            "hero": hero_name,
        }

    # --------------------------------------------------------
    # HERO CARD TYPES
    # --------------------------------------------------------

    hero_card_types = {
        value.strip().lower()
        for value in str(
            getattr(hero_card, "card_type", "") or ""
        ).split(",")
        if value.strip()
    }

    if not hero_card_types:
        return {
            "error": "The selected hero does not have any card types configured.",
            "hero": hero_name,
        }

    # --------------------------------------------------------
    # NORMALIZE SELECTED CARDS
    # --------------------------------------------------------

    normalized_cards = normalize_card_list(
        selected_cards
    )

    if not normalized_cards:
        return {
            "cards": ""
        }

    # --------------------------------------------------------
    # LOAD ALL POSSIBLE CARDS
    # --------------------------------------------------------

    side_cards = list(
        WebCards.objects
        .filter(
            side__iexact=side,
        )
        .exclude(
            set_rarity__iexact="Token"
        )
    )

    # --------------------------------------------------------
    # BUILD NORMALIZED LOOKUP
    # --------------------------------------------------------

    card_lookup = {}

    for card in side_cards:

        card_name = str(
            getattr(card, "card_name", "") or ""
        ).strip()

        if not card_name:
            continue

        card_lookup.setdefault(
            card_name.lower(),
            card,
        )

    # --------------------------------------------------------
    # VALIDATE
    # --------------------------------------------------------

    invalid_cards = []
    incompatible_cards = []

    valid_cards = []

    for selected_card in normalized_cards:

        cleaned_name = str(
            selected_card or ""
        ).strip()

        lookup_key = cleaned_name.lower()

        card = card_lookup.get(
            lookup_key
        )

        if not card:
            invalid_cards.append(
                cleaned_name
            )
            continue

        card_rarity = str(
            getattr(card, "set_rarity", "") or ""
        ).strip().lower()

        if card_rarity == "token":
            incompatible_cards.append(
                cleaned_name
            )
            continue

        card_types = {
            value.strip().lower()
            for value in str(
                getattr(card, "card_type", "") or ""
            ).split(",")
            if value.strip()
        }

        if not card_types.intersection(
            hero_card_types
        ):
            incompatible_cards.append(
                cleaned_name
            )
            continue

        valid_cards.append(
            str(
                getattr(card, "card_name", "")
            ).strip()
        )

    # --------------------------------------------------------
    # ERRORS
    # --------------------------------------------------------

    if invalid_cards:
        return {
            "error": (
                "One or more selected cards do not "
                "belong to the selected deck side."
            ),
            "side": side,
            "invalid_cards": invalid_cards,
        }

    if incompatible_cards:
        return {
            "error": (
                "One or more selected cards are not "
                "compatible with the selected hero."
            ),
            "hero": hero_name,
            "card_types": sorted(hero_card_types),
            "invalid_cards": incompatible_cards,
        }

    # --------------------------------------------------------
    # SUCCESS
    # --------------------------------------------------------

    return {
        "cards": ", ".join(valid_cards)
    }
@api_view(["GET", "POST"])
@ensure_csrf_cookie
@owner_required
@parser_classes([MultiPartParser, FormParser])
def admin_legacy_decklists(request):

    # ============================================================
    # GET — LIST LEGACY DECKS
    # ============================================================

    if request.method == "GET":

        try:

            decks = (
                LegacyDecklist.objects
                .all()
                .order_by(
                    "side",
                    "hero",
                    "name",
                )
            )

            serializer = AdminLegacyDeckSerializer(
                decks,
                many=True,
            )

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        except DatabaseError as exc:

            logger.exception(
                "Admin legacy decklist query failed"
            )

            payload = {
                "error": (
                    "Database query failed for "
                    "admin legacy decklists."
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
    # POST — CREATE LEGACY DECK
    # ============================================================

    if request.method == "POST":

        data = request.data.copy()

        print("\n========================================")
        print("ADMIN LEGACY DECKLIST CREATE")
        print("METHOD:", request.method)
        print("CONTENT TYPE:", request.content_type)
        print("FILES:", request.FILES)
        print("DATA:", request.data)
        print("========================================")

        # ========================================================
        # REQUIRED FIELDS
        # ========================================================

        required_fields = [
            "side",
            "hero",
            "name",
            "category",
            "archetype",
            "description",
        ]

        missing_fields = [
            field
            for field in required_fields
            if not str(data.get(field, "")).strip()
        ]

        if missing_fields:

            return Response(
                {
                    "error": "Missing required fields.",
                    "fields": {
                        field: [
                            "This field is required."
                        ]
                        for field in missing_fields
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ========================================================
        # DECK ID
        # ========================================================
        existing_ids = (
            LegacyDecklist.objects
            .values_list(
                "deckid",
                flat=True,
            )
        )

        numeric_ids = []

        for existing_id in existing_ids:

            try:
                numeric_ids.append(
                    int(existing_id)
                )

            except (
                TypeError,
                ValueError,
            ):
                continue

        next_id = max(
            numeric_ids,
            default=0,
        ) + 1

        deckid = str(
            next_id
        )

        data["deckid"] = deckid

        # ========================================================
        # SIDE
        # ========================================================

        deck_side = str(
            data.get("side", "")
        ).strip().lower()

        if deck_side in {"plant", "plants"}:

            deck_side = "Plants"

        elif deck_side in {"zombie", "zombies"}:

            deck_side = "Zombies"

        else:

            return Response(
                {
                    "error": (
                        "Side must be Plants or Zombies."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        data["side"] = deck_side

        # ========================================================
        # CARDS
        # ========================================================

        if "cards" in data:
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
                            card_name__in=selected_cards,
                            side__iexact=deck_side,
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
        
                        return Response(
                            {
                                "error": (
                                    "One or more selected cards "
                                    "do not belong to the selected "
                                    "deck side."
                                ),
                                "side": deck_side,
                                "invalid_cards": invalid_cards,
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )
        
            data["cards"] = ", ".join(
                        selected_cards
                    )

        # ========================================================
        # CLOUDINARY IMAGE UPLOAD
        # ========================================================

        uploaded_image = (
            request.FILES.get("image_file")
            or request.FILES.get("image")
        )

        if not uploaded_image:

            return Response(
                {
                    "error": (
                        "A deck image is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        print(
            "UPLOADING LEGACY DECK IMAGE TO CLOUDINARY..."
        )

        try:

            image_url = save_deck_image(
                uploaded_image,
                deckid=deckid,
                deck_name=data.get("name") or deckid,
            )

            data["image"] = image_url

            print(
                "CLOUDINARY IMAGE URL:",
                image_url,
            )

        except ValueError as exc:

            return Response(
                {
                    "error": str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as exc:

            logger.exception(
                "Unable to save legacy deck image."
            )

            payload = {
                "error": (
                    "Unable to save uploaded image."
                ),
                "error_type": exc.__class__.__name__,
            }

            if include_error_detail():
                payload["detail"] = str(exc)

            return Response(
                payload,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # ========================================================
        # REMOVE FILE-ONLY FIELDS
        # ========================================================

        data.pop(
            "image_file",
            None,
        )

        data.pop(
            "remove_image",
            None,
        )

        # ========================================================
        # CREATE SERIALIZER
        # ========================================================

        print(
            "DATA BEFORE LEGACY DECK SERIALIZER:",
            data,
        )

        serializer = AdminLegacyDeckSerializer(
            data=data
        )

        if not serializer.is_valid():

            print(
                "LEGACY DECK CREATION SERIALIZER ERRORS:",
                serializer.errors,
            )

            return Response(
                {
                    "error": (
                        "Unable to create legacy deck."
                    ),
                    "fields": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ========================================================
        # SAVE
        # ========================================================

        try:

            legacy_deck = serializer.save()

        except DatabaseError as exc:

            logger.exception(
                "Unable to create legacy deck %s",
                deckid,
            )

            payload = {
                "error": (
                    "Database creation failed."
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
                "Unexpected legacy deck creation error."
            )

            payload = {
                "error": (
                    "Unable to create legacy deck."
                ),
                "error_type": exc.__class__.__name__,
            }

            if include_error_detail():
                payload["detail"] = str(exc)

            return Response(
                payload,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # ========================================================
        # SUCCESS
        # ========================================================

        return Response(
            AdminLegacyDeckSerializer(
                legacy_deck
            ).data,
            status=status.HTTP_201_CREATED,
        )
@api_view(["PATCH", "DELETE"])
@owner_required
def admin_legacy_decklist_detail(request, deckid):

    try:
        deck = LegacyDecklist.objects.get(
            deckid=deckid
        )

    except LegacyDecklist.DoesNotExist:
        return Response(
            {
                "error": "Legacy deck not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    # ========================================================
    # DELETE
    # ========================================================

    if request.method == "DELETE":

        deck.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

    # ========================================================
    # PATCH
    # ========================================================

    if request.method == "PATCH":

        data = request.data.copy()

        image_file = request.FILES.get("image_file")

        if image_file:
            import os
            from django.core.files.storage import default_storage

            filename = default_storage.save(
                f"decklists/{image_file.name}",
                image_file,
            )

            data["image"] = default_storage.url(filename)

        serializer = AdminLegacyDeckSerializer(
            deck,
            data=data,
            partial=True,
        )

        if not serializer.is_valid():
            return Response(
                {
                    "error": "Unable to update legacy deck.",
                    "fields": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        deck = serializer.save()

        return Response(
            AdminLegacyDeckSerializer(deck).data,
            status=status.HTTP_200_OK,
        )
# ============================================================
# ADMIN LEGACY DECKLIST UPDATE
# ============================================================

@api_view(["PATCH"])
@owner_required
@parser_classes([MultiPartParser, FormParser])
def admin_legacy_decklist_update(request, deckid):

    print("\n========================================")
    print("ADMIN LEGACY DECKLIST UPDATE START")
    print("DECK ID:", deckid)
    print("METHOD:", request.method)
    print("CONTENT TYPE:", request.content_type)
    print("FILES:", request.FILES)
    print("DATA:", request.data)
    print("========================================")

    try:

        deck = LegacyDecklist.objects.get(
            deckid=deckid
        )

    except LegacyDecklist.DoesNotExist:

        print("LEGACY DECK NOT FOUND")

        return Response(
            {
                "error": "Legacy decklist not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    except DatabaseError as exc:

        print("DATABASE ERROR:", repr(exc))

        logger.exception(
            "Unable to retrieve legacy decklist %s",
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

    print("LEGACY DECK FOUND:", deck.deckid)

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

        # Use the incoming hero/side when supplied.
        # Otherwise retain the existing deck values.
        selected_side = data.get(
            "side",
            deck.side,
        )

        selected_hero = data.get(
            "hero",
            deck.hero,
        )

        validation = validate_deck_cards(
            side=selected_side,
            hero=selected_hero,
            selected_cards=selected_cards,
        )

        if validation.get("error"):

            print(
                "CARD VALIDATION ERROR:",
                validation,
            )

            return Response(
                validation,
                status=status.HTTP_400_BAD_REQUEST,
            )

        data["cards"] = validation.get(
            "cards",
            "",
        )

        print(
            "VALIDATED CARDS:",
            data["cards"],
        )

    # ========================================================
    # IMAGE UPLOAD
    # ========================================================

    uploaded_image = (
        request.FILES.get("image_file")
        or request.FILES.get("image")
    )

    print("UPLOADED IMAGE:", uploaded_image)

    if uploaded_image:

        print("STARTING CLOUDINARY UPLOAD")

        try:

            image_url = save_deck_image(
                uploaded_image,
                deckid=deckid,
                deck_name=data.get("name") or deck.name,
            )

            print("CLOUDINARY IMAGE URL:", image_url)

            data["image"] = image_url

        except ValueError as exc:

            print("IMAGE VALUE ERROR:", repr(exc))

            return Response(
                {
                    "error": str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as exc:

            print("IMAGE UPLOAD ERROR:", repr(exc))

            logger.exception(
                "Unable to save legacy deck image."
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

    # ========================================================
    # REMOVE image_file
    # ========================================================

    data.pop(
        "image_file",
        None,
    )

    print("DATA BEFORE SERIALIZER:", data)

    # ========================================================
    # SERIALIZE
    # ========================================================

    serializer = AdminLegacyDeckSerializer(
        deck,
        data=data,
        partial=True,
    )

    if not serializer.is_valid():

        print("========================================")
        print("LEGACY DECK UPDATE SERIALIZER ERROR")
        print(serializer.errors)
        print("========================================")

        return Response(
            {
                "error": "Invalid legacy decklist data.",
                "fields": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ========================================================
    # SAVE
    # ========================================================

    try:

        updated_deck = serializer.save()

        print(
            "LEGACY DECK SAVED:",
            updated_deck.deckid,
        )

        print(
            "NEW IMAGE:",
            updated_deck.image,
        )

    except DatabaseError as exc:

        logger.exception(
            "Unable to update legacy decklist %s",
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

    print("ADMIN LEGACY DECKLIST UPDATE SUCCESS")
    print("========================================\n")

    return Response(
        AdminLegacyDeckSerializer(
            updated_deck
        ).data,
        status=status.HTTP_200_OK,
    )
@api_view(["POST"])
@owner_required
@parser_classes([MultiPartParser, FormParser])
def admin_decklist_create(request):
    data = request.data.copy()

    # ========================================================
    # CARDS
    # ========================================================

    if "cards" in data:
        selected_cards = normalize_card_list(data.get("cards"))

        existing_cards = set(
            WebCards.objects
            .filter(card_name__in=selected_cards)
            .values_list("card_name", flat=True)
        )

        invalid_cards = [
            card
            for card in selected_cards
            if card not in existing_cards
        ]

        if invalid_cards:
            return Response(
                {
                    "error": "One or more selected cards do not exist.",
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
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as exc:
            logger.exception("Unable to save deck image.")

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

    serializer = AdminDeckSerializer(data=data)

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
        logger.exception("Unable to create decklist.")

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
# ADMIN LEGACY DECKLIST DELETE
# ============================================================

@csrf_exempt
@api_view(["DELETE"])
@owner_required
def admin_legacy_decklist_delete(
    request,
    deckid,
):

    try:

        deck = LegacyDecklist.objects.get(
            deckid=deckid
        )

    except LegacyDecklist.DoesNotExist:

        return Response(
            {
                "error": "Legacy decklist not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    except DatabaseError as exc:

        logger.exception(
            "Unable to retrieve legacy decklist %s for deletion",
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
            "Unable to delete legacy decklist %s",
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
# ============================================================
# NORMALIZE CARD INPUT
# ============================================================

def normalize_card_list(value):
    """
    Convert card input into a clean list of card names.

    Accepted formats:

        ["Card A", "Card B"]

        '["Card A", "Card B"]'

        "Card A, Card B"

        "Card A
        Card B
        Card C"
    """

    if value is None:
        return []

    # Multipart form / JSON string
    if isinstance(value, str):

        value = value.strip()

        if not value:
            return []

        # Try JSON first
        try:
            parsed = json.loads(value)

            if isinstance(parsed, list):
                value = parsed

        except (json.JSONDecodeError, TypeError):
            pass

    # Already a list
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

            # A card itself may contain newline/comma-separated values
            card_name = str(card_name).strip()

            if not card_name:
                continue

            parts = []

            for line in card_name.splitlines():
                for item in line.split(","):
                    item = item.strip()

                    if item:
                        parts.append(item)

            for item in parts:

                if item not in cleaned:
                    cleaned.append(item)

        return cleaned

    # String fallback
    value = str(value)

    cleaned = []

    for line in value.splitlines():

        for item in line.split(","):

            item = item.strip()

            if item and item not in cleaned:
                cleaned.append(item)

    return cleaned


# ============================================================
# SAVE DECK IMAGE
# ============================================================

import os
import uuid

import cloudinary.uploader


def save_deck_image(uploaded_file, deckid, deck_name=""):
    """
    Upload a deck image to Cloudinary.

    Images are stored using a readable, deck-specific public ID.

    Example:
        tbot/decklists/14-ringspresso

    Returns the permanent public HTTPS URL.
    """

    if not uploaded_file:
        return None

    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif",
    }

    original_name = uploaded_file.name or ""

    extension = os.path.splitext(
        original_name
    )[1].lower()

    if extension not in allowed_extensions:
        raise ValueError(
            "Unsupported image type. "
            "Use JPG, JPEG, PNG, WEBP, or GIF."
        )

    # 10 MB limit
    max_size = 10 * 1024 * 1024

    if uploaded_file.size > max_size:
        raise ValueError(
            "Image is too large. Maximum size is 10 MB."
        )

    # ========================================================
    # CREATE READABLE NAME
    # ========================================================

    import re

    clean_name = str(
        deck_name or uploaded_file.name or "deck"
    ).strip()

    # Remove the file extension if it came from the filename.
    clean_name = os.path.splitext(
        clean_name
    )[0]

    # Convert to lowercase.
    clean_name = clean_name.lower()

    # Replace spaces and special characters with hyphens.
    clean_name = re.sub(
        r"[^a-z0-9]+",
        "-",
        clean_name,
    )

    # Remove leading/trailing hyphens.
    clean_name = clean_name.strip("-")

    if not clean_name:
        clean_name = "deck"

    # ========================================================
    # CLOUDINARY PUBLIC ID
    # ========================================================

    public_id = (
        f"tbot/decklists/"
        f"{deckid}-"
        f"{clean_name}"
    )

    # ========================================================
    # UPLOAD
    # ========================================================

    result = cloudinary.uploader.upload(
        uploaded_file,
        public_id=public_id,
        resource_type="image",
        overwrite=True,
    )

    return result["secure_url"]

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

        print("SELECTED CARDS:", selected_cards)

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

        print("EXISTING CARDS:", existing_cards)

        invalid_cards = [
            card
            for card in selected_cards
            if card not in existing_cards
        ]

        print("INVALID CARDS:", invalid_cards)

        if invalid_cards:

            print("RETURNING 400 BECAUSE OF INVALID CARDS")

            return Response(
                {
                    "error": "One or more selected cards do not exist.",
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

    print("UPLOADED IMAGE:", uploaded_image)

    if uploaded_image:

        print("STARTING CLOUDINARY UPLOAD")

        try:

            image_url = save_deck_image(
    uploaded_image,
    deckid=deckid,
    deck_name=data.get("name") or deck.name,
)

            print("CLOUDINARY IMAGE URL:", image_url)

            data["image"] = image_url

        except ValueError as exc:

            print("IMAGE VALUE ERROR:", repr(exc))

            return Response(
                {
                    "error": str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as exc:

            print("IMAGE UPLOAD ERROR:", repr(exc))

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

    # ========================================================
    # REMOVE image_file
    # ========================================================

    data.pop(
        "image_file",
        None,
    )

    print("DATA BEFORE SERIALIZER:", data)

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

        print("DECK SAVED:", updated_deck.deckid)
        print("NEW IMAGE:", updated_deck.image)

    except DatabaseError as exc:

        print("DATABASE SAVE ERROR:", repr(exc))

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

    print("ADMIN DECKLIST UPDATE SUCCESS")
    print("========================================\n")

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

# ============================================================
# USER PROFILE
# ============================================================

@api_view(["GET"])
def my_profile(request):

    if not request.user.is_authenticated:
        return Response(
            {
                "error": "You must be logged in."
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    discord_id = request.session.get("discord_id")

    if not discord_id:
        return Response(
            {
                "error": "Discord session not found."
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        profile = UserProfile.objects.get(
            discord_id=str(discord_id)
        )

    except UserProfile.DoesNotExist:
        return Response(
            {
                "error": "Profile not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(
        {
            "id": profile.id,
            "discord_id": profile.discord_id,
            "username": profile.username,
            "display_name": profile.display_name,
            "profile_slug": profile.profile_slug,
            "avatar": profile.avatar,
            "bio": profile.bio,
            "is_public": profile.is_public,
            "created_at": profile.created_at,
            "updated_at": profile.updated_at,
        }
    )

@api_view(["GET"])
def profile_by_slug(request, profile_slug):
    try:
        profile = UserProfile.objects.get(
            profile_slug=profile_slug
        )
    except UserProfile.DoesNotExist:
        return Response(
            {
                "error": "Profile not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    is_owner = (
        request.user.is_authenticated
        and str(request.user.username) == f"discord_{profile.discord_id}"
    )

    if not profile.is_public and not is_owner:
        return Response(
            {
                "error": "This profile is private."
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    decks = UserDeck.objects.filter(
        profile_id=profile.id
    ).order_by("-created_at")

    serializer = UserProfileSerializer(profile)
    deck_serializer = UserDeckSerializer(
        decks,
        many=True,
    )

    return Response(
        {
            "profile": serializer.data,
            "decks": deck_serializer.data,
            "is_owner": is_owner,
            "is_site_owner": (
                request.user.is_authenticated
                and request.user.is_superuser
            ),
        }
    )
# ============================================================
# PUBLIC / SHARED PROFILE
# ============================================================

@api_view(["GET"])
def profile_detail(request, profile_slug):

    try:
        profile = UserProfile.objects.get(
            profile_slug=profile_slug
        )

    except UserProfile.DoesNotExist:

        return Response(
            {
                "error": "Profile not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    # ========================================================
    # LOGIN REQUIRED
    # ========================================================

    if not request.user.is_authenticated:

        return Response(
            {
                "error": "You must be logged in."
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    current_discord_id = str(
        request.session.get("discord_id", "")
    ).strip()

    profile_discord_id = str(
        profile.discord_id
    ).strip()

    is_profile_owner = (
        current_discord_id == profile_discord_id
    )

    is_site_owner = (
        current_discord_id
        == str(settings.DISCORD_OWNER_ID).strip()
    )

    # ========================================================
    # PRIVATE PROFILE
    # ========================================================

    if (
        not profile.is_public
        and not is_profile_owner
        and not is_site_owner
    ):

        # The profile is intentionally still accessible
        # when the user has the direct URL.
        #
        # We only prevent discovery through the Users page.
        pass

    # ========================================================
    # USER DECKS
    # ========================================================

    decks = UserDeck.objects.filter(
        profile_id=profile.id
    ).order_by(
        "-modified_at",
        "name",
    )

    return Response(
        {
            "profile": {
                "id": profile.id,
                "discord_id": profile.discord_id,
                "username": profile.username,
                "display_name": profile.display_name,
                "profile_slug": profile.profile_slug,
                "avatar": profile.avatar,
                "bio": profile.bio,
                "is_public": profile.is_public,
                "created_at": profile.created_at,
                "updated_at": profile.updated_at,
            },

            "decks": UserDeckSerializer(
                decks,
                many=True,
            ).data,

            "is_owner": is_profile_owner,
            "is_site_owner": is_site_owner,
        },
        status=status.HTTP_200_OK,
    )


# ============================================================
# MY PROFILE
# ============================================================

@api_view(["GET", "PATCH"])
@parser_classes([MultiPartParser, FormParser])
def profile_me(request):

    if not request.user.is_authenticated:
        return Response(
            {
                "error": "You must be logged in."
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    discord_id = str(
        request.session.get("discord_id", "")
    ).strip()

    try:
        profile = UserProfile.objects.get(
            discord_id=discord_id
        )

    except UserProfile.DoesNotExist:
        return Response(
            {
                "error": "Profile not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    # ========================================================
    # GET
    # ========================================================

    if request.method == "GET":

        decks = UserDeck.objects.filter(
            profile_id=profile.id
        ).order_by(
            "-modified_at",
            "name",
        )

        return Response(
            {
                "profile": {
                    "id": profile.id,
                    "discord_id": profile.discord_id,
                    "username": profile.username,
                    "display_name": profile.display_name,
                    "profile_slug": profile.profile_slug,
                    "avatar": profile.avatar,
                    "bio": profile.bio,
                    "is_public": profile.is_public,
                    "created_at": profile.created_at,
                    "updated_at": profile.updated_at,
                },
                "decks": UserDeckSerializer(
                    decks,
                    many=True,
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    # ========================================================
    # PATCH
    # ========================================================

    data = request.data.copy()

    # Never allow these fields to be changed.
    for field in [
        "id",
        "discord_id",
        "username",
        "profile_slug",
        "created_at",
        "updated_at",
    ]:
        data.pop(field, None)

    # Only these fields can be edited.
    allowed_fields = {
        "display_name",
        "avatar",
        "bio",
        "is_public",
    }

    cleaned_data = {
        key: value
        for key, value in data.items()
        if key in allowed_fields
    }

    # ========================================================
    # DISPLAY NAME
    # ========================================================

    if "display_name" in cleaned_data:

        display_name = str(
            cleaned_data["display_name"]
        ).strip()

        if not display_name:
            return Response(
                {
                    "error": "Display name cannot be empty."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(display_name) > 100:
            return Response(
                {
                    "error": "Display name is too long."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.display_name = display_name

    # ========================================================
    # BIO
    # ========================================================

    if "bio" in cleaned_data:

        profile.bio = str(
            cleaned_data["bio"]
        ).strip()

    # ========================================================
    # PUBLIC / PRIVATE
    # ========================================================

    if "is_public" in cleaned_data:

        value = str(
            cleaned_data["is_public"]
        ).strip().lower()

        profile.is_public = value in {
            "true",
            "1",
            "yes",
            "on",
        }

    # ========================================================
    # AVATAR
    # ========================================================

    if "avatar" in cleaned_data:

        profile.avatar = str(
            cleaned_data["avatar"]
        ).strip()

    profile.updated_at = timezone.now()

    try:

        profile.save(
            update_fields=[
                "display_name",
                "avatar",
                "bio",
                "is_public",
                "updated_at",
            ]
        )

    except DatabaseError as exc:

        logger.exception(
            "Unable to update user profile."
        )

        payload = {
            "error": "Unable to update profile.",
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
            "profile": {
                "id": profile.id,
                "discord_id": profile.discord_id,
                "username": profile.username,
                "display_name": profile.display_name,
                "profile_slug": profile.profile_slug,
                "avatar": profile.avatar,
                "bio": profile.bio,
                "is_public": profile.is_public,
                "created_at": profile.created_at,
                "updated_at": profile.updated_at,
            }
        },
        status=status.HTTP_200_OK,
    )


@api_view(["PATCH"])
def update_my_profile(request):

    if not request.user.is_authenticated:
        return Response(
            {
                "error": "You must be logged in."
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    discord_id = request.session.get("discord_id")

    if not discord_id:
        return Response(
            {
                "error": "Discord session not found."
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        profile = UserProfile.objects.get(
            discord_id=str(discord_id)
        )

    except UserProfile.DoesNotExist:
        return Response(
            {
                "error": "Profile not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    allowed_fields = {
        "display_name",
        "bio",
        "is_public",
    }

    for field in allowed_fields:

        if field in request.data:

            setattr(
                profile,
                field,
                request.data[field],
            )

    profile.save(
        update_fields=[
            "display_name",
            "bio",
            "is_public",
            "updated_at",
        ]
    )

    return Response(
        {
            "id": profile.id,
            "discord_id": profile.discord_id,
            "username": profile.username,
            "display_name": profile.display_name,
            "profile_slug": profile.profile_slug,
            "avatar": profile.avatar,
            "bio": profile.bio,
            "is_public": profile.is_public,
            "created_at": profile.created_at,
            "updated_at": profile.updated_at,
        }
    )
    # ============================================================
# USER DECKS
# ============================================================

@api_view(["GET", "POST"])
@parser_classes([MultiPartParser, FormParser])
def user_decks(request):

    # ========================================================
    # REQUIRE LOGIN
    # ========================================================

    if not request.user.is_authenticated:

        return Response(
            {
                "error": "You must be logged in."
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # ========================================================
    # GET USER'S DECKS
    # ========================================================

    if request.method == "GET":

        try:

            profile = UserProfile.objects.get(
                discord_id=request.session.get("discord_id")
            )

        except UserProfile.DoesNotExist:

            return Response(
                {
                    "error": "Profile not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        decks = UserDeck.objects.filter(
            profile_id=profile.id
        ).order_by(
            "-modified_at",
            "name",
        )

        return Response(
            UserDeckSerializer(
                decks,
                many=True,
            ).data,
            status=status.HTTP_200_OK,
        )

    # ========================================================
    # POST
    # ========================================================

    profile = UserProfile.objects.filter(
        discord_id=request.session.get("discord_id")
    ).first()

    if not profile:

        return Response(
            {
                "error": "Profile not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

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

        data["cards"] = ", ".join(
            selected_cards
        )

    # ========================================================
    # IMAGE
    # ========================================================

    uploaded_image = (
        request.FILES.get("image_file")
        or request.FILES.get("image")
    )

    if uploaded_image:

        try:

            data["image"] = save_deck_image(
                uploaded_image
            )

        except ValueError as exc:

            return Response(
                {
                    "error": str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as exc:

            logger.exception(
                "Unable to save user deck image."
            )

            payload = {
                "error": (
                    "Unable to save uploaded image."
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

    data.pop(
        "image_file",
        None,
    )

    # Never allow client to choose another profile.
    data.pop(
        "profile_id",
        None,
    )

    # ========================================================
    # CREATE
    # ========================================================

    serializer = UserDeckSerializer(
        data=data
    )

    if not serializer.is_valid():

        return Response(
            {
                "error": "Invalid user deck data.",
                "fields": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        deck = serializer.save(
            profile_id=profile.id
        )

    except DatabaseError as exc:

        logger.exception(
            "Unable to create user deck."
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

    return Response(
        UserDeckSerializer(deck).data,
        status=status.HTTP_201_CREATED,
    )


# ============================================================
# USER DECK DETAIL
# ============================================================

@api_view(["GET", "PATCH", "DELETE"])
@parser_classes([MultiPartParser, FormParser])
def user_deck_detail(request, deck_id):

    if not request.user.is_authenticated:
        return Response(
            {
                "error": "You must be logged in."
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    discord_id = str(
        request.session.get("discord_id", "")
    ).strip()

    try:
        profile = UserProfile.objects.get(
            discord_id=discord_id
        )

    except UserProfile.DoesNotExist:
        return Response(
            {
                "error": "Profile not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        deck = UserDeck.objects.get(
            id=deck_id
        )

    except UserDeck.DoesNotExist:
        return Response(
            {
                "error": "Deck not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    # ========================================================
    # OWNERSHIP
    # ========================================================

    is_owner = (
        deck.profile_id == profile.id
    )

    is_site_owner = (
        discord_id
        == str(settings.DISCORD_OWNER_ID).strip()
    )

    if not is_owner and not is_site_owner:
        return Response(
            {
                "error": (
                    "You do not have permission "
                    "to modify this deck."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    # ========================================================
    # GET
    # ========================================================

    if request.method == "GET":

        return Response(
            UserDeckSerializer(deck).data,
            status=status.HTTP_200_OK,
        )

    # ========================================================
    # DELETE
    # ========================================================

    if request.method == "DELETE":

        deck.delete()

        return Response(
            {
                "message": "Deck deleted successfully."
            },
            status=status.HTTP_200_OK,
        )

    # ========================================================
    # PATCH
    # ========================================================

    serializer = UserDeckSerializer(
        deck,
        data=request.data,
        partial=True,
    )

    if not serializer.is_valid():

        return Response(
            {
                "error": "Invalid user deck data.",
                "fields": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    updated_deck = serializer.save(
        modified_at=timezone.now()
    )

    return Response(
        UserDeckSerializer(updated_deck).data,
        status=status.HTTP_200_OK,
    )
# ============================================================
# CARDS
# ============================================================

@api_view(["GET"])
def card_info(request):

    try:

        cards = WebCards.objects.all()

        serializer = WebCardSerializer(
            cards,
            many=True,
        )

        return Response(
            serializer.data
        )

    except DatabaseError as exc:

        logger.exception(
            "Card information query failed"
        )

        payload = {
            "error": "Database query failed for card information.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================================
# HERO INFORMATION
# ============================================================

@api_view(["GET"])
def heroinfo(request):

    try:

        heroes = WebCards.objects.filter(
            set_rarity__icontains="Hero"
        )

        serializer = WebCardSerializer(
            heroes,
            many=True,
        )

        return Response({
            "count": heroes.count(),
            "results": serializer.data,
        })

    except DatabaseError as exc:

        logger.exception(
            "Hero information query failed"
        )

        payload = {
            "error": "Database query failed for hero information.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================================
# KEEP OR SCRAP
# ============================================================

@api_view(["GET"])
def keep_or_scrap(request):

    try:

        rows = KeepOrScrap.objects.all()

        serializer = KeepOrScrapSerializer(
            rows,
            many=True,
        )

        return Response(
            serializer.data
        )

    except DatabaseError as exc:

        logger.exception(
            "Keep or Scrap query failed"
        )

        payload = {
            "error": "Database query failed for keep or scrap.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================================
# DECKLIST COUNT
# ============================================================

@api_view(["GET"])
def decklist_count(request):

    try:

        total = Decklist.objects.count()

        return Response({
            "count": total,
        })

    except DatabaseError as exc:

        logger.exception(
            "Decklist count query failed"
        )

        payload = {
            "error": "Database query failed for decklist count.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================================
# CARD COUNT
# ============================================================

@api_view(["GET"])
def card_count(request):

    try:

        total = WebCards.objects.count()

        return Response({
            "count": total,
        })

    except DatabaseError as exc:

        logger.exception(
            "Card count query failed"
        )

        payload = {
            "error": "Database query failed for card count.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================================
# KEEP OR SCRAP COUNT
# ============================================================

@api_view(["GET"])
def keeporscrap_count(request):

    try:

        count = KeepOrScrap.objects.count()

        return Response({
            "count": count,
        })

    except DatabaseError as exc:

        logger.exception(
            "Keep or Scrap count query failed"
        )

        payload = {
            "error": "Database error while counting Keep or Scrap entries.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================================
# HERO COUNT
# ============================================================

@api_view(["GET"])
def hero_count(request):

    try:

        count = (
            WebCards.objects
            .filter(
                set_rarity__icontains="Hero"
            )
            .count()
        )

        return Response({
            "count": count,
        })

    except DatabaseError as exc:

        logger.exception(
            "Hero count query failed"
        )

        payload = {
            "error": "Database error while retrieving hero count.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================================
# DISCORD OAUTH2 LOGIN
# ============================================================

def discord_login(request):

    discord_authorize_url = (
        "https://discord.com/oauth2/authorize"
    )

    params = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": settings.DISCORD_REDIRECT_URI,
        "scope": "identify",
    }

    query_string = requests.compat.urlencode(
        params
    )

    return redirect(
        f"{discord_authorize_url}?{query_string}"
    )


# ============================================================
# DISCORD OAUTH2 CALLBACK
# ============================================================

def discord_callback(request):
    code = request.GET.get("code")

    if not code:
        return JsonResponse(
            {
                "error": "Discord authorization code was not provided."
            },
            status=400,
        )

    token_url = "https://discord.com/api/oauth2/token"

    token_data = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "client_secret": settings.DISCORD_CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.DISCORD_REDIRECT_URI,
    }

    token_headers = {
        "Content-Type": "application/x-www-form-urlencoded",
    }

    try:
        token_response = requests.post(
            token_url,
            data=token_data,
            headers=token_headers,
            timeout=10,
        )

    except requests.RequestException:
        logger.exception(
            "Unable to contact Discord token endpoint."
        )

        return JsonResponse(
            {
                "error": "Unable to contact Discord."
            },
            status=502,
        )

    if not token_response.ok:
        logger.error(
            "Discord token exchange failed: %s",
            token_response.text,
        )

        return JsonResponse(
            {
                "error": "Failed to authenticate with Discord."
            },
            status=400,
        )

    try:
        token_json = token_response.json()

    except ValueError:
        logger.error(
            "Discord returned invalid token response."
        )

        return JsonResponse(
            {
                "error": (
                    "Discord returned an invalid "
                    "authentication response."
                )
            },
            status=400,
        )

    access_token = token_json.get("access_token")

    if not access_token:
        return JsonResponse(
            {
                "error": (
                    "Discord did not return "
                    "an access token."
                )
            },
            status=400,
        )

    # ============================================================
    # GET DISCORD USER
    # ============================================================

    try:
        user_response = requests.get(
            "https://discord.com/api/v10/users/@me",
            headers={
                "Authorization": f"Bearer {access_token}",
            },
            timeout=10,
        )

    except requests.RequestException:
        logger.exception(
            "Unable to retrieve Discord user."
        )

        return JsonResponse(
            {
                "error": (
                    "Unable to retrieve your "
                    "Discord account."
                )
            },
            status=502,
        )

    if not user_response.ok:
        logger.error(
            "Discord user request failed: %s",
            user_response.text,
        )

        return JsonResponse(
            {
                "error": (
                    "Failed to retrieve your "
                    "Discord account."
                )
            },
            status=400,
        )

    try:
        discord_user = user_response.json()

    except ValueError:
        logger.error(
            "Discord returned invalid user response."
        )

        return JsonResponse(
            {
                "error": (
                    "Discord returned invalid "
                    "user information."
                )
            },
            status=400,
        )

    discord_id = discord_user.get("id")
    username = discord_user.get("username")
    global_name = discord_user.get("global_name")
    avatar = discord_user.get("avatar")

    if not discord_id or not username:
        return JsonResponse(
            {
                "error": (
                    "Discord returned incomplete "
                    "user information."
                )
            },
            status=400,
        )

    display_name = global_name or username

    logger.info(
        "Discord login: id=%s username=%s avatar=%s",
        discord_id,
        username,
        avatar,
    )

    # ============================================================
    # DJANGO USER
    # ============================================================

    user, created = User.objects.get_or_create(
        username=f"discord_{discord_id}",
        defaults={
            "first_name": display_name,
        },
    )

    if not created:
        user.first_name = display_name

    # ============================================================
    # OWNER PERMISSIONS
    # ============================================================

    is_owner = (
        str(discord_id).strip()
        == str(settings.DISCORD_OWNER_ID).strip()
    )

    if is_owner:
        user.is_staff = True
        user.is_superuser = True
    else:
        user.is_staff = False
        user.is_superuser = False

    user.save()

    # ============================================================
    # CREATE / UPDATE USER PROFILE
    # ============================================================

    profile_slug = username.strip()

    now = timezone.now()

    UserProfile.objects.update_or_create(
        discord_id=str(discord_id),
        defaults={
            "username": username,
            "display_name": display_name,
            "profile_slug": profile_slug,
            "avatar": avatar,
            "updated_at": now,
        },
        create_defaults={
            "username": username,
            "display_name": display_name,
            "profile_slug": profile_slug,
            "avatar": avatar,
            "created_at": now,
            "updated_at": now,
    },
)

    # ============================================================
    # LOGIN
    # ============================================================

    login(
        request,
        user,
    )

    request.session["discord_id"] = str(
        discord_id
    )

    request.session["discord_username"] = username

    request.session["discord_global_name"] = (
        display_name
    )

    request.session["discord_avatar"] = avatar

    request.session.save()

    # ============================================================
    # REDIRECT TO FRONTEND
    # ============================================================

    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173",
    ).rstrip("/")

    return redirect(
        frontend_url
    )


# ============================================================
# DISCORD CURRENT USER
# ============================================================

@api_view(["GET"])
def discord_me(request):

    if not request.user.is_authenticated:

        return Response({
            "authenticated": False,
        })

    discord_id = request.session.get(
        "discord_id"
    )

    if not discord_id:

        username = request.user.username

        if username.startswith("discord_"):

            discord_id = username[
                len("discord_"):
            ]

    discord_username = (
        request.session.get(
            "discord_username"
        )
    )

    if not discord_username:

        discord_username = (
            request.user.username
        )

        if discord_username.startswith("discord_"):

            discord_username = (
                discord_username[
                    len("discord_"):
                ]
            )

    discord_global_name = (
        request.session.get(
            "discord_global_name"
        )
    )

    if not discord_global_name:

        discord_global_name = (
            request.user.first_name
            or discord_username
        )

    avatar = request.session.get(
        "discord_avatar"
    )

    avatar_url = None

    if discord_id and avatar:

        if str(avatar).startswith("a_"):
            avatar_extension = "gif"
        else:
            avatar_extension = "png"

        avatar_url = (
            "https://cdn.discordapp.com/avatars/"
            f"{discord_id}/{avatar}."
            f"{avatar_extension}?size=256"
        )

    elif discord_id:

        try:

            default_avatar_index = (
                int(discord_id) >> 22
            ) % 6

            avatar_url = (
                "https://cdn.discordapp.com/embed/avatars/"
                f"{default_avatar_index}.png"
            )

        except (
            ValueError,
            TypeError,
        ):

            avatar_url = (
                "https://cdn.discordapp.com/embed/avatars/"
                "0.png"
            )

    is_owner = is_discord_owner(
        request
    )

    return Response({

        "authenticated": True,

        "user": {

            "id": request.user.id,

            "username": discord_username,

            "first_name": (
                request.user.first_name
            ),

            "avatar": avatar_url,

            "is_owner": is_owner,
        },
    })


# ============================================================
# DISCORD LOGOUT
# ============================================================

@csrf_exempt
def discord_logout(request):

    if request.method != "POST":

        return JsonResponse(
            {
                "error": "POST request required.",
            },
            status=405,
        )

    logger.info(
        "Discord logout requested. User=%s",
        request.user,
    )

    logout(request)

    return JsonResponse({
        "authenticated": False,
    })