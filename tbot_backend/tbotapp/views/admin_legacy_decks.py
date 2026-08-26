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
# SIDE NORMALIZATION
# ============================================================

def normalize_deck_side(value):
    """
    Normalize all accepted Plant/Zombie side values.

    API/deck storage:
        Plants
        Zombies

    Database may contain:
        Plant
        Plants
        Zombie
        Zombies
    """

    raw_side = str(value or "").strip()

    if raw_side.casefold() in {
        "plant",
        "plants",
    }:
        return "Plants"

    if raw_side.casefold() in {
        "zombie",
        "zombies",
    }:
        return "Zombies"

    return None


def side_matches(db_side, expected_side):
    """
    Treat singular/plural database values as equivalent.

    Examples:

        Zombie  == Zombies
        Plant   == Plants
    """

    normalized_db_side = str(db_side or "").strip().casefold()
    normalized_expected_side = str(
        expected_side or ""
    ).strip().casefold()

    if normalized_expected_side in {
        "plant",
        "plants",
    }:
        return normalized_db_side in {
            "plant",
            "plants",
        }

    if normalized_expected_side in {
        "zombie",
        "zombies",
    }:
        return normalized_db_side in {
            "zombie",
            "zombies",
        }

    return False


def normalized_card_name(value):
    """
    Normalize card names for comparisons.

    Handles:
        leading/trailing whitespace
        repeated whitespace
        case differences
    """

    return " ".join(
        str(value or "").strip().split()
    ).casefold()


# ============================================================
# DECK CARD VALIDATION
# ============================================================

def validate_deck_cards(
    side,
    hero,
    selected_cards,
):
    # ========================================================
    # NORMALIZE SIDE
    # ========================================================

    raw_side = str(side or "")
    side = normalize_deck_side(raw_side)

    if not side:
        logger.error(
            "INVALID DECK SIDE: raw=%r",
            raw_side,
        )

        return {
            "error": "Side must be Plants or Zombies.",
            "side": raw_side.strip(),
        }

    # ========================================================
    # NORMALIZE HERO
    # ========================================================

    raw_hero = str(hero or "")
    hero_name = raw_hero.strip()

    if not hero_name:
        return {
            "error": "A hero is required.",
        }

    # ========================================================
    # FIND HERO
    # ========================================================

    hero_card = (
        WebCards.objects
        .filter(
            card_name__iexact=hero_name,
        )
        .first()
    )

    if not hero_card:
        possible_heroes = list(
            WebCards.objects
            .filter(
                card_name__icontains=hero_name,
            )
            .values(
                "card_name",
                "side",
                "set_rarity",
                "card_type",
            )[:20]
        )

        logger.error(
            "HERO NOT FOUND: hero=%r side=%r matches=%r",
            hero_name,
            side,
            possible_heroes,
        )

        return {
            "error": (
                "The selected hero does not exist."
            ),
            "side": side,
            "hero": hero_name,
        }

    hero_db_side = str(
        getattr(
            hero_card,
            "side",
            "",
        ) or ""
    ).strip()

    logger.info(
        "HERO FOUND: requested_hero=%r "
        "requested_side=%r "
        "db_hero=%r "
        "db_side=%r",
        hero_name,
        side,
        getattr(
            hero_card,
            "card_name",
            "",
        ),
        hero_db_side,
    )

    # ========================================================
    # HERO SIDE VALIDATION
    # ========================================================

    if not side_matches(
        hero_db_side,
        side,
    ):
        logger.error(
            "HERO SIDE MISMATCH: hero=%r "
            "requested_side=%r db_side=%r",
            hero_name,
            side,
            hero_db_side,
        )

        return {
            "error": (
                "The selected hero does not belong "
                "to the selected deck side."
            ),
            "side": side,
            "hero": hero_name,
            "database_side": hero_db_side,
        }

    # ========================================================
    # HERO RARITY
    # ========================================================

    hero_rarity = str(
        getattr(
            hero_card,
            "set_rarity",
            "",
        ) or ""
    ).strip().lower()

    if "hero" not in hero_rarity:
        logger.error(
            "INVALID HERO RARITY: hero=%r rarity=%r side=%r",
            hero_name,
            hero_rarity,
            side,
        )

        return {
            "error": (
                "The selected card is not a valid hero."
            ),
            "hero": hero_name,
        }

    # ========================================================
    # HERO CARD TYPES
    # ========================================================

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
        logger.error(
            "HERO HAS NO CARD TYPES: hero=%r side=%r",
            hero_name,
            side,
        )

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
            "error": "Please select at least one card.",
        }

    logger.info(
        "VALIDATING DECK CARDS: side=%r hero=%r parsed_cards=%r",
        side,
        hero_name,
        parsed_cards,
    )

    # ========================================================
    # LOAD ALL CARDS
    #
    # IMPORTANT:
    #
    # DO NOT use:
    #
    #     side__iexact=side
    #
    # because the API uses "Zombies" while the database
    # contains "Zombie".
    #
    # Instead load cards and compare using side_matches().
    # ========================================================

    all_cards = list(
        WebCards.objects.all()
    )

    card_lookup = {}

    for card in all_cards:
        db_name_raw = getattr(
            card,
            "card_name",
            "",
        )

        db_name = str(
            db_name_raw or ""
        ).strip()

        if not db_name:
            continue

        if not side_matches(
            getattr(card, "side", ""),
            side,
        ):
            continue

        lookup_key = normalized_card_name(
            db_name
        )

        if lookup_key not in card_lookup:
            card_lookup[lookup_key] = card

    logger.info(
        "CARD LOOKUP BUILT: side=%r cards=%d",
        side,
        len(card_lookup),
    )

    invalid_cards = []
    incompatible_cards = []
    valid_cards = []

    # ========================================================
    # VALIDATE EACH SELECTED CARD
    # ========================================================

    for entry in parsed_cards:
        raw_name = entry.get(
            "name",
            "",
        )

        cleaned_name = str(
            raw_name or ""
        ).strip()

        cleaned_name = " ".join(
            cleaned_name.split()
        )

        lookup_key = normalized_card_name(
            cleaned_name
        )

        card = card_lookup.get(
            lookup_key
        )

        # ====================================================
        # CARD NOT FOUND
        # ====================================================

        if not card:
            logger.error(
                "INVALID CARD - NOT FOUND FOR SIDE: "
                "selected_raw=%r selected_cleaned=%r "
                "lookup_key=%r expected_side=%r",
                raw_name,
                cleaned_name,
                lookup_key,
                side,
            )

            # Look for the card regardless of side so the
            # database problem is visible in the logs.
            possible_matches = list(
                WebCards.objects
                .filter(
                    card_name__icontains=cleaned_name
                )
                .values(
                    "card_name",
                    "side",
                    "set_rarity",
                    "card_type",
                )[:20]
            )

            logger.error(
                "POSSIBLE DATABASE MATCHES FOR CARD %r: %r",
                cleaned_name,
                possible_matches,
            )

            normalized_matches = []

            for db_card in all_cards:
                db_name = str(
                    getattr(
                        db_card,
                        "card_name",
                        "",
                    ) or ""
                ).strip()

                normalized_db_name = normalized_card_name(
                    db_name
                )

                if normalized_db_name != lookup_key:
                    continue

                normalized_matches.append(
                    {
                        "card_name": db_name,
                        "side": getattr(
                            db_card,
                            "side",
                            "",
                        ),
                        "set_rarity": getattr(
                            db_card,
                            "set_rarity",
                            "",
                        ),
                        "card_type": getattr(
                            db_card,
                            "card_type",
                            "",
                        ),
                    }
                )

            logger.error(
                "NORMALIZED NAME MATCHES FOR %r: %r",
                cleaned_name,
                normalized_matches,
            )

            invalid_cards.append(
                cleaned_name
            )

            continue

        # ====================================================
        # CARD DATABASE VALUES
        # ====================================================

        db_card_name = str(
            getattr(
                card,
                "card_name",
                "",
            ) or ""
        ).strip()

        db_side = str(
            getattr(
                card,
                "side",
                "",
            ) or ""
        ).strip()

        card_rarity = str(
            getattr(
                card,
                "set_rarity",
                "",
            ) or ""
        ).strip().lower()

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

        logger.debug(
            "CARD MATCH: selected=%r "
            "db_name=%r db_side=%r "
            "rarity=%r types=%r",
            cleaned_name,
            db_card_name,
            db_side,
            card_rarity,
            card_types,
        )

        # ====================================================
        # TOKEN
        # ====================================================

        if card_rarity == "token":
            logger.error(
                "INCOMPATIBLE CARD - TOKEN: "
                "card=%r db_name=%r side=%r",
                cleaned_name,
                db_card_name,
                db_side,
            )

            incompatible_cards.append(
                cleaned_name
            )

            continue

        # ====================================================
        # CARD TYPE
        # ====================================================

        if not card_types.intersection(
            hero_card_types
        ):
            logger.error(
                "INCOMPATIBLE CARD - CARD TYPE: "
                "card=%r db_name=%r "
                "card_types=%r hero_types=%r",
                cleaned_name,
                db_card_name,
                sorted(card_types),
                sorted(hero_card_types),
            )

            incompatible_cards.append(
                cleaned_name
            )

            continue

        # ====================================================
        # VALID CARD
        # ====================================================

        valid_cards.append(
            {
                "name": db_card_name,
                "count": entry["count"],
            }
        )

    # ========================================================
    # INVALID SIDE CARDS
    # ========================================================

    if invalid_cards:
        logger.error(
            "DECK CARD VALIDATION FAILED: "
            "side=%r hero=%r invalid_cards=%r",
            side,
            hero_name,
            invalid_cards,
        )

        return {
            "error": (
                "One or more selected cards do not "
                "belong to the selected deck side."
            ),
            "side": side,
            "invalid_cards": invalid_cards,
        }

    # ========================================================
    # INCOMPATIBLE CARDS
    # ========================================================

    if incompatible_cards:
        logger.error(
            "DECK CARD COMPATIBILITY FAILED: "
            "side=%r hero=%r incompatible_cards=%r "
            "hero_card_types=%r",
            side,
            hero_name,
            incompatible_cards,
            sorted(hero_card_types),
        )

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

    # ========================================================
    # CARD RATIO
    # ========================================================

    ratio_total = sum(
        card["count"]
        for card in valid_cards
    )

    if ratio_total != TARGET_CARD_RATIO_TOTAL:
        logger.error(
            "INVALID CARD RATIO: "
            "side=%r hero=%r total=%r expected=%r "
            "valid_cards=%r",
            side,
            hero_name,
            ratio_total,
            TARGET_CARD_RATIO_TOTAL,
            valid_cards,
        )

        return {
            "error": (
                f"Card ratios must add up to "
                f"{TARGET_CARD_RATIO_TOTAL} "
                f"(currently {ratio_total})."
            ),
        }

    # ========================================================
    # VALIDATION PASSED
    # ========================================================

    logger.info(
        "DECK CARD VALIDATION PASSED: "
        "side=%r hero=%r cards=%r",
        side,
        hero_name,
        valid_cards,
    )

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

        deck_side = normalize_deck_side(
            data.get("side")
        )

        if not deck_side:
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

            validation = validate_deck_cards(
                side=deck_side,
                hero=data.get("hero"),
                selected_cards=data.get("cards"),
            )

            if validation.get("error"):
                logger.error(
                    "LEGACY DECK CREATION CARD "
                    "VALIDATION FAILED: "
                    "deckid=%r side=%r hero=%r "
                    "cards=%r result=%r",
                    deckid,
                    deck_side,
                    data.get("hero"),
                    data.get("cards"),
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

    # ========================================================
    # GET EXISTING DECK
    # ========================================================

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
    # NORMALIZE SIDE IF PROVIDED
    # ========================================================

    if "side" in data:

        normalized_side = normalize_deck_side(
            data.get("side")
        )

        if not normalized_side:
            return Response(
                {
                    "error": (
                        "Side must be Plants or Zombies."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        data["side"] = normalized_side

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

            logger.error(
                "LEGACY DECK UPDATE CARD "
                "VALIDATION FAILED: "
                "deckid=%r side=%r hero=%r "
                "cards=%r result=%r",
                deckid,
                selected_side,
                selected_hero,
                data.get("cards"),
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