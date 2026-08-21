import logging

from django.db import DatabaseError
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    parser_classes,
)
from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
)
from rest_framework.response import Response

from ..models import (
    LegacyDecklist,
    WebCards,
)

from ..serializers import (
    AdminLegacyDeckSerializer,
)

from .helpers import (
    owner_required,
    include_error_detail,
    normalize_card_list,
    normalize_card_ratio_list,
    cards_to_storage_string,
    save_deck_image,
    TARGET_CARD_RATIO_TOTAL,
)

logger = logging.getLogger(__name__)


# ============================================================
# DECK CARD VALIDATION
# ============================================================

def validate_deck_cards(
    side,
    hero,
    selected_cards,
):
    side = str(
        side or ""
    ).strip()

    if side.lower() in {
        "plant",
        "plants",
    }:
        side = "Plants"

    elif side.lower() in {
        "zombie",
        "zombies",
    }:
        side = "Zombies"

    hero_name = str(
        hero or ""
    ).strip()

    if not hero_name:
        return {
            "error": "A hero is required."
        }

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
            "error": (
                "The selected hero does not belong "
                "to the selected deck side."
            ),
            "side": side,
            "hero": hero_name,
        }

    hero_rarity = str(
        getattr(
            hero_card,
            "set_rarity",
            "",
        ) or ""
    ).strip().lower()

    if "hero" not in hero_rarity:
        return {
            "error": (
                "The selected card is not a valid hero."
            ),
            "hero": hero_name,
        }

    hero_card_types = {
        value.strip().lower()
        for value in str(
            getattr(
                hero_card,
                "card_type",
                "",
            ) or ""
        ).split(",")
        if value.strip()
    }

    if not hero_card_types:
        return {
            "error": (
                "The selected hero does not have "
                "any card types configured."
            ),
            "hero": hero_name,
        }

    # ========================================================
    # PARSE NAME|COUNT
    # ========================================================

    parsed_cards = normalize_card_ratio_list(
        selected_cards
    )

    if not parsed_cards:
        return {
            "error": "Please select at least one card."
        }

    side_cards = list(
        WebCards.objects
        .filter(
            side__iexact=side
        )
        .exclude(
            set_rarity__iexact="Token"
        )
    )

    card_lookup = {}

    for card in side_cards:
        card_name = str(
            getattr(
                card,
                "card_name",
                "",
            ) or ""
        ).strip()

        if card_name:
            card_lookup.setdefault(
                card_name.lower(),
                card,
            )

    invalid_cards = []
    incompatible_cards = []
    valid_cards = []

    for entry in parsed_cards:
        cleaned_name = entry["name"]
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
            getattr(
                card,
                "set_rarity",
                "",
            ) or ""
        ).strip().lower()

        if card_rarity == "token":
            incompatible_cards.append(
                cleaned_name
            )
            continue

        card_types = {
            value.strip().lower()
            for value in str(
                getattr(
                    card,
                    "card_type",
                    "",
                ) or ""
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

        valid_cards.append({
            "name": str(
                getattr(
                    card,
                    "card_name",
                )
            ).strip(),
            "count": entry["count"],
        })

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
            "card_types": sorted(
                hero_card_types
            ),
            "invalid_cards": incompatible_cards,
        }

    ratio_total = sum(
        card["count"]
        for card in valid_cards
    )

    if ratio_total != TARGET_CARD_RATIO_TOTAL:
        return {
            "error": (
                f"Card ratios must add up to "
                f"{TARGET_CARD_RATIO_TOTAL} "
                f"(currently {ratio_total})."
            ),
        }

    return {
        "cards": cards_to_storage_string(
            valid_cards
        )
    }


# ============================================================
# ADMIN LEGACY DECKLISTS
# ============================================================

@api_view(["GET", "POST"])
@parser_classes([MultiPartParser, FormParser])
@owner_required
def admin_legacy_decklists(request):

    # ========================================================
    # GET — LIST LEGACY DECKS
    # ========================================================

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

    # ========================================================
    # POST — CREATE LEGACY DECK
    # ========================================================

    if request.method == "POST":
        data = request.data.copy()

        # ====================================================
        # REQUIRED FIELDS
        # ====================================================

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
            if not str(
                data.get(
                    field,
                    "",
                )
            ).strip()
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

        # ====================================================
        # DECK ID
        # ====================================================

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

        deckid = str(next_id)

        data["deckid"] = deckid

        # ====================================================
        # SIDE
        # ====================================================

        deck_side = str(
            data.get(
                "side",
                "",
            )
        ).strip().lower()

        if deck_side in {
            "plant",
            "plants",
        }:
            deck_side = "Plants"

        elif deck_side in {
            "zombie",
            "zombies",
        }:
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

        # ====================================================
        # CARDS
        # ====================================================

        if "cards" in data:
            parsed_cards = normalize_card_ratio_list(
                data.get("cards")
            )

            if not parsed_cards:
                return Response(
                    {
                        "error": (
                            "Please select at least one card."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            selected_names = [
                card["name"]
                for card in parsed_cards
            ]

            existing_cards = set(
                WebCards.objects
                .filter(
                    card_name__in=selected_names,
                    side__iexact=deck_side,
                )
                .values_list(
                    "card_name",
                    flat=True,
                )
            )

            invalid_cards = [
                card["name"]
                for card in parsed_cards
                if card["name"] not in existing_cards
            ]

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

            ratio_total = sum(
                card["count"]
                for card in parsed_cards
            )

            if ratio_total != TARGET_CARD_RATIO_TOTAL:
                return Response(
                    {
                        "error": (
                            f"Card ratios must add up to "
                            f"{TARGET_CARD_RATIO_TOTAL} "
                            f"(currently {ratio_total})."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            data["cards"] = cards_to_storage_string(
                parsed_cards
            )

        # ====================================================
        # CLOUDINARY IMAGE UPLOAD
        # ====================================================

        uploaded_image = (
            request.FILES.get("image_file")
            or request.FILES.get("image")
        )

        if not uploaded_image:
            return Response(
                {
                    "error": "A deck image is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            image_url = save_deck_image(
                uploaded_image,
                deckid=deckid,
                deck_name=data.get("name") or deckid,
            )

            data["image"] = image_url

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

        # ====================================================
        # REMOVE FILE-ONLY FIELDS
        # ====================================================

        data.pop(
            "image_file",
            None,
        )

        data.pop(
            "remove_image",
            None,
        )

        # ====================================================
        # CREATE SERIALIZER
        # ====================================================

        serializer = AdminLegacyDeckSerializer(
            data=data
        )

        if not serializer.is_valid():
            return Response(
                {
                    "error": (
                        "Unable to create legacy deck."
                    ),
                    "fields": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ====================================================
        # SAVE
        # ====================================================

        try:
            legacy_deck = serializer.save()

        except DatabaseError as exc:
            logger.exception(
                "Unable to create legacy deck %s",
                deckid,
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

        return Response(
            AdminLegacyDeckSerializer(
                legacy_deck
            ).data,
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# ADMIN LEGACY DECKLIST UPDATE
# ============================================================

@api_view(["PATCH"])
@owner_required
@parser_classes([MultiPartParser, FormParser])
def admin_legacy_decklist_update(
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

    data = request.data.copy()

    # ========================================================
    # CARDS
    # ========================================================

    if "cards" in data:
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
            selected_cards=data.get("cards"),
        )

        if validation.get("error"):
            return Response(
                validation,
                status=status.HTTP_400_BAD_REQUEST,
            )

        data["cards"] = validation.get(
            "cards",
            "",
        )

    # ========================================================
    # IMAGE UPLOAD
    # ========================================================

    uploaded_image = (
        request.FILES.get("image_file")
        or request.FILES.get("image")
    )

    if uploaded_image:
        try:
            image_url = save_deck_image(
                uploaded_image,
                deckid=deckid,
                deck_name=data.get("name") or deck.name,
            )

            data["image"] = image_url

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
        data.get(
            "remove_image",
            "",
        )
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

    # ========================================================
    # SERIALIZE
    # ========================================================

    serializer = AdminLegacyDeckSerializer(
        deck,
        data=data,
        partial=True,
    )

    if not serializer.is_valid():
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

    return Response(
        AdminLegacyDeckSerializer(
            updated_deck
        ).data,
        status=status.HTTP_200_OK,
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