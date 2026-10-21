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

from ...models import (
    LegacyDecklist,
    WebCards,
)

from ...serializers import (
    AdminLegacyDeckSerializer,
)

from ..helpers import (
    owner_required,
    include_error_detail,
    normalize_card_list,
    normalize_card_ratio_list,
    cards_to_storage_string,
    save_deck_image,
    TARGET_CARD_RATIO_TOTAL,
)


logger = logging.getLogger(__name__)

SIDE_VALIDATION_ERROR = "Side must be Plants or Zombies."
DB_FAILED = "Database query failed."
def normalize_deck_side(value):


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
    return " ".join(
        str(value or "").strip().split()
    ).casefold()



def validate_deck_hero(side, hero):
    hero_name = str(hero or "").strip()

    if not hero_name:
        return None, None, {"error": "A hero is required."}

    hero_card = (
        WebCards.objects
        .filter(card_name__iexact=hero_name)
        .first()
    )

    if not hero_card:
        possible_heroes = list(
            WebCards.objects
            .filter(card_name__icontains=hero_name)
            .values("card_name", "side", "set_rarity", "card_type")[:20]
        )
        logger.error(
            "HERO NOT FOUND: hero=%r side=%r matches=%r",
            hero_name, side, possible_heroes,
        )
        return None, None, {
            "error": "The selected hero does not exist.",
            "side": side,
            "hero": hero_name,
        }

    hero_side = str(getattr(hero_card, "side", "") or "").strip()
    logger.info(
        "HERO FOUND: requested_hero=%r requested_side=%r db_hero=%r db_side=%r",
        hero_name, side, hero_card.card_name, hero_side,
    )

    if not side_matches(hero_side, side):
        logger.error(
            "HERO SIDE MISMATCH: hero=%r requested_side=%r db_side=%r",
            hero_name, side, hero_side,
        )
        return None, None, {
            "error": "The selected hero does not belong to the selected deck side.",
            "side": side,
            "hero": hero_name,
            "database_side": hero_side,
        }

    rarity = str(getattr(hero_card, "set_rarity", "") or "").strip().lower()
    if "hero" not in rarity:
        logger.error(
            "INVALID HERO RARITY: hero=%r rarity=%r side=%r",
            hero_name, rarity, side,
        )
        return None, None, {
            "error": "The selected card is not a valid hero.",
            "hero": hero_name,
        }

    hero_types = {
        item.strip().lower()
        for item in str(getattr(hero_card, "card_type", "") or "").split(",")
        if item.strip()
    }

    if not hero_types:
        logger.error("HERO HAS NO CARD TYPES: hero=%r side=%r", hero_name, side)
        return None, None, {
            "error": "The selected hero does not have any card types configured.",
            "hero": hero_name,
        }

    return hero_card, hero_types, None


def build_side_card_lookup(side):
    all_cards = list(WebCards.objects.all())
    card_lookup = {}

    for card in all_cards:
        name = str(getattr(card, "card_name", "") or "").strip()
        if not name or not side_matches(getattr(card, "side", ""), side):
            continue

        key = normalized_card_name(name)
        if key not in card_lookup:
            card_lookup[key] = card

    logger.info("CARD LOOKUP BUILT: side=%r cards=%d", side, len(card_lookup))
    return all_cards, card_lookup


def log_missing_card(cleaned_name, lookup_key, side, all_cards):
    possible_matches = list(
        WebCards.objects
        .filter(card_name__icontains=cleaned_name)
        .values("card_name", "side", "set_rarity", "card_type")[:20]
    )
    logger.error(
        "INVALID CARD - NOT FOUND FOR SIDE: selected_cleaned=%r "
        "lookup_key=%r expected_side=%r possible_matches=%r",
        cleaned_name, lookup_key, side, possible_matches,
    )

    normalized_matches = []
    for card in all_cards:
        db_name = str(getattr(card, "card_name", "") or "").strip()
        if normalized_card_name(db_name) != lookup_key:
            continue

        normalized_matches.append({
            "card_name": db_name,
            "side": getattr(card, "side", ""),
            "set_rarity": getattr(card, "set_rarity", ""),
            "card_type": getattr(card, "card_type", ""),
        })

    logger.error(
        "NORMALIZED NAME MATCHES FOR %r: %r",
        cleaned_name, normalized_matches,
    )


def validate_selected_deck_cards(parsed_cards, card_lookup, hero_card_types, side, hero_name, all_cards):
    valid_cards = []
    invalid_cards = []
    incompatible_cards = []

    for entry in parsed_cards:
        cleaned_name = " ".join(str(entry.get("name", "") or "").strip().split())
        lookup_key = normalized_card_name(cleaned_name)
        card = card_lookup.get(lookup_key)

        if not card:
            log_missing_card(cleaned_name, lookup_key, side, all_cards)
            invalid_cards.append(cleaned_name)
            continue

        db_name = str(getattr(card, "card_name", "") or "").strip()
        rarity = str(getattr(card, "set_rarity", "") or "").strip().lower()
        card_types = {
            item.strip().lower()
            for item in str(getattr(card, "card_type", "") or "").split(",")
            if item.strip()
        }

        logger.debug(
            "CARD MATCH: selected=%r db_name=%r db_side=%r rarity=%r types=%r",
            cleaned_name, db_name, getattr(card, "side", ""), rarity, card_types,
        )

        if rarity == "token" or not card_types.intersection(hero_card_types):
            logger.error(
                "INCOMPATIBLE CARD: card=%r db_name=%r card_types=%r hero_types=%r",
                cleaned_name, db_name, sorted(card_types), sorted(hero_card_types),
            )
            incompatible_cards.append(cleaned_name)
            continue

        valid_cards.append({"name": db_name, "count": entry["count"]})

    if invalid_cards:
        logger.error(
            "DECK CARD VALIDATION FAILED: side=%r hero=%r invalid_cards=%r",
            side, hero_name, invalid_cards,
        )
        return None, {
            "error": "One or more selected cards do not belong to the selected deck side.",
            "side": side,
            "invalid_cards": invalid_cards,
        }

    if incompatible_cards:
        logger.error(
            "DECK CARD COMPATIBILITY FAILED: side=%r hero=%r incompatible_cards=%r",
            side, hero_name, incompatible_cards,
        )
        return None, {
            "error": "One or more selected cards are not compatible with the selected hero.",
            "hero": hero_name,
            "card_types": sorted(hero_card_types),
            "invalid_cards": incompatible_cards,
        }

    return valid_cards, None


def validate_deck_cards(side, hero, selected_cards):
    raw_side = str(side or "")
    normalized_side = normalize_deck_side(raw_side)

    if not normalized_side:
        logger.error("INVALID DECK SIDE: raw=%r", raw_side)
        return {
            "error": SIDE_VALIDATION_ERROR,
            "side": raw_side.strip(),
        }

    hero_name = str(hero or "").strip()
    _, hero_types, error = validate_deck_hero(normalized_side, hero_name)
    if error:
        return error

    parsed_cards = normalize_card_ratio_list(selected_cards)
    if not parsed_cards:
        return {"error": "Please select at least one card."}

    logger.info(
        "VALIDATING DECK CARDS: side=%r hero=%r parsed_cards=%r",
        normalized_side, hero_name, parsed_cards,
    )

    all_cards, card_lookup = build_side_card_lookup(normalized_side)
    valid_cards, error = validate_selected_deck_cards(
        parsed_cards, card_lookup, hero_types,
        normalized_side, hero_name, all_cards,
    )
    if error:
        return error

    ratio_total = sum(card["count"] for card in valid_cards)
    if ratio_total != TARGET_CARD_RATIO_TOTAL:
        logger.error(
            "INVALID CARD RATIO: side=%r hero=%r total=%r expected=%r",
            normalized_side, hero_name, ratio_total, TARGET_CARD_RATIO_TOTAL,
        )
        return {
            "error": (
                f"Card ratios must add up to {TARGET_CARD_RATIO_TOTAL} "
                f"(currently {ratio_total})."
            ),
        }

    logger.info(
        "DECK CARD VALIDATION PASSED: side=%r hero=%r cards=%r",
        normalized_side, hero_name, valid_cards,
    )
    return {"cards": cards_to_storage_string(valid_cards)}



def get_admin_legacy_decklists():
    try:
        decks = LegacyDecklist.objects.all().order_by("side", "hero", "name")
        serializer = AdminLegacyDeckSerializer(decks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except DatabaseError as exc:
        logger.exception("Admin legacy decklist query failed")
        payload = {
            "error": "Database query failed for admin legacy decklists.",
            "error_type": exc.__class__.__name__,
        }
        if include_error_detail():
            payload["detail"] = str(exc)
        return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_next_legacy_deck_id():
    existing_ids = LegacyDecklist.objects.values_list("deckid", flat=True)
    numeric_ids = []

    for existing_id in existing_ids:
        try:
            numeric_ids.append(int(existing_id))
        except (TypeError, ValueError):
            continue

    return str(max(numeric_ids, default=0) + 1)


def validate_legacy_deck_fields(data):
    required_fields = [
        "side", "hero", "name", "category", "archetype", "description",
    ]
    missing_fields = [
        field for field in required_fields
        if not str(data.get(field, "")).strip()
    ]

    if missing_fields:
        return Response(
            {
                "error": "Missing required fields.",
                "fields": {
                    field: ["This field is required."]
                    for field in missing_fields
                },
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    normalized_side = normalize_deck_side(data.get("side"))
    if not normalized_side:
        return Response(
            {"error": SIDE_VALIDATION_ERROR},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data["side"] = normalized_side
    return None


def validate_legacy_deck_card_data(data, deckid, action):
    if "cards" not in data:
        return None

    validation = validate_deck_cards(
        side=data.get("side"),
        hero=data.get("hero"),
        selected_cards=data.get("cards"),
    )
    if validation.get("error"):
        logger.error(
            "LEGACY DECK %s CARD VALIDATION FAILED: "
            "deckid=%r side=%r hero=%r result=%r",
            action, deckid, data.get("side"), data.get("hero"), validation,
        )
        return Response(validation, status=status.HTTP_400_BAD_REQUEST)

    data["cards"] = validation.get("cards", "")
    return None


def process_legacy_deck_image(request, data, deckid, required):
    uploaded_image = (
        request.FILES.get("image_file")
        or request.FILES.get("image")
    )

    if not uploaded_image and required:
        return None, Response(
            {"error": "A deck image is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not uploaded_image:
        return None, None

    try:
        image_url = save_deck_image(
            uploaded_image,
            deckid=deckid,
            deck_name=data.get("name") or deckid,
            legacy=True,
            side=data.get("side"),
        )
        data["image"] = image_url
        return uploaded_image, None
    except ValueError as exc:
        return None, Response(
            {"error": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as exc:
        logger.exception("Unable to save legacy deck image.")
        payload = {
            "error": "Unable to save uploaded image.",
            "error_type": exc.__class__.__name__,
        }
        if include_error_detail():
            payload["detail"] = str(exc)
        return None, Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def create_legacy_deck_record(data, deckid):
    data.pop("image_file", None)
    data.pop("remove_image", None)

    serializer = AdminLegacyDeckSerializer(data=data)
    if not serializer.is_valid():
        return Response(
            {
                "error": "Unable to create legacy deck.",
                "fields": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        deck = serializer.save()
    except DatabaseError as exc:
        logger.exception("Unable to create legacy deck %s", deckid)
        payload = {
            "error": "Database creation failed.",
            "error_type": exc.__class__.__name__,
        }
        if include_error_detail():
            payload["detail"] = str(exc)
        return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as exc:
        logger.exception("Unexpected legacy deck creation error.")
        payload = {
            "error": "Unable to create legacy deck.",
            "error_type": exc.__class__.__name__,
        }
        if include_error_detail():
            payload["detail"] = str(exc)
        return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(
        AdminLegacyDeckSerializer(deck).data,
        status=status.HTTP_201_CREATED,
    )


def create_admin_legacy_decklist(request):
    data = request.data.copy()
    error_response = validate_legacy_deck_fields(data)
    if error_response:
        return error_response

    try:
        deckid = get_next_legacy_deck_id()
    except DatabaseError as exc:
        logger.exception("Unable to generate legacy deck ID")
        payload = {
            "error": DB_FAILED,
            "error_type": exc.__class__.__name__,
        }
        if include_error_detail():
            payload["detail"] = str(exc)
        return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    data["deckid"] = deckid

    error_response = validate_legacy_deck_card_data(data, deckid, "CREATION")
    if error_response:
        return error_response

    _, error_response = process_legacy_deck_image(
        request, data, deckid, required=True,
    )
    if error_response:
        return error_response

    return create_legacy_deck_record(data, deckid)


@api_view(["GET", "POST"])
@parser_classes([MultiPartParser, FormParser])
@owner_required
def admin_legacy_decklists(request):
    if request.method == "GET":
        return get_admin_legacy_decklists()

    return create_admin_legacy_decklist(request)

        

def get_legacy_deck_for_update(deckid):
    try:
        return LegacyDecklist.objects.get(deckid=deckid), None
    except LegacyDecklist.DoesNotExist:
        return None, Response(
            {"error": "Legacy decklist not found."},
            status=status.HTTP_404_NOT_FOUND,
        )
    except DatabaseError as exc:
        logger.exception("Unable to retrieve legacy decklist %s", deckid)
        payload = {
            "error": DB_FAILED,
            "error_type": exc.__class__.__name__,
        }
        if include_error_detail():
            payload["detail"] = str(exc)
        return None, Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def prepare_legacy_deck_update(data, deck, deckid):
    if "side" in data:
        normalized_side = normalize_deck_side(data.get("side"))
        if not normalized_side:
            return Response(
                {"error": SIDE_VALIDATION_ERROR},
                status=status.HTTP_400_BAD_REQUEST,
            )
        data["side"] = normalized_side

    if "cards" in data:
        data.setdefault("side", deck.side)
        data.setdefault("hero", deck.hero)
        error_response = validate_legacy_deck_card_data(data, deckid, "UPDATE")
        if error_response:
            return error_response

    return None


def save_legacy_deck_update(deck, data, deckid):
    data.pop("remove_image", None)
    data.pop("image_file", None)

    serializer = AdminLegacyDeckSerializer(deck, data=data, partial=True)
    if not serializer.is_valid():
        return Response(
            {
                "error": "Invalid legacy decklist data.",
                "fields": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        updated_deck = serializer.save()
    except DatabaseError as exc:
        logger.exception("Unable to update legacy decklist %s", deckid)
        payload = {
            "error": "Database update failed.",
            "error_type": exc.__class__.__name__,
        }
        if include_error_detail():
            payload["detail"] = str(exc)
        return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(
        AdminLegacyDeckSerializer(updated_deck).data,
        status=status.HTTP_200_OK,
    )


@api_view(["PATCH"])
@owner_required
@parser_classes([MultiPartParser, FormParser])
def admin_legacy_decklist_update(request, deckid):
    deck, error_response = get_legacy_deck_for_update(deckid)
    if error_response:
        return error_response

    data = request.data.copy()
    error_response = prepare_legacy_deck_update(data, deck, deckid)
    if error_response:
        return error_response

    uploaded_image, error_response = process_legacy_deck_image(
        request, data, deckid, required=False,
    )
    if error_response:
        return error_response

    remove_image = str(data.get("remove_image", "")).lower() in {
        "1", "true", "yes", "on",
    }
    if remove_image and not uploaded_image:
        data["image"] = ""

    return save_legacy_deck_update(deck, data, deckid)


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
            "error": DB_FAILED,
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