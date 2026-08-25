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
    JSONParser,
)

from rest_framework.response import Response

from ..models import (
    Decklist,
    WebCards,
)

from ..serializers import (
    AdminDeckSerializer,
)

from .helpers import (
    owner_required,
    include_error_detail,
    normalize_card_ratio_list,
    cards_to_storage_string,
    save_deck_image,
    TARGET_CARD_RATIO_TOTAL,
)


logger = logging.getLogger(__name__)


# ============================================================
# SIDE NORMALIZATION
# ============================================================

def normalize_side(value):
    """
    Normalize all accepted side values to the database values:

        Plants
        Zombies

    The database uses the plural forms.
    """

    value = str(value or "").strip()

    if value.lower() in {
        "plant",
        "plants",
    }:
        return "Plants"

    if value.lower() in {
        "zombie",
        "zombies",
    }:
        return "Zombies"

    return None


def normalize_name(value):
    """
    Normalize a card/hero name for comparison.
    """

    return str(value or "").strip().casefold()


# ============================================================
# DECK CARD VALIDATION
# ============================================================

def validate_deck_cards(
    side,
    hero,
    selected_cards,
):
    """
    Validate:

    1. A valid side was selected.
    2. A valid hero was selected.
    3. The hero belongs to the selected side.
    4. The selected cards belong to the selected side.
    5. The selected cards are compatible with the hero.
    6. Card ratios add up to TARGET_CARD_RATIO_TOTAL.

    Returns either:

        {
            "cards": "Card A|4, Card B|3, ..."
        }

    or:

        {
            "error": "...",
            ...
        }
    """

    # ========================================================
    # SIDE
    # ========================================================

    normalized_side = normalize_side(side)

    if not normalized_side:
        return {
            "error": "Side must be Plants or Zombies.",
        }

    side = normalized_side

    logger.info(
        "DECK VALIDATION - selected side=%r normalized side=%r",
        side,
        normalized_side,
    )

    # ========================================================
    # HERO NAME
    # ========================================================

    hero_name = str(hero or "").strip()

    if not hero_name:
        return {
            "error": "A hero is required.",
        }

    logger.info(
        "DECK VALIDATION - selected hero=%r",
        hero_name,
    )

    # ========================================================
    # FIND HERO BY NAME FIRST
    #
    # IMPORTANT:
    #
    # Do NOT combine hero name + side in the initial query.
    #
    # If the combined query fails, the old code incorrectly
    # reported that the hero belonged to the wrong side.
    #
    # We now find the hero first and then explicitly compare
    # the hero's database side.
    # ========================================================

    hero_card = (
        WebCards.objects
        .filter(
            card_name__iexact=hero_name,
        )
        .first()
    )

    if not hero_card:
        logger.error(
            "HERO VALIDATION FAILED - hero does not exist in "
            "WebCards. hero=%r selected_side=%r",
            hero_name,
            side,
        )

        return {
            "error": (
                "The selected hero could not be found "
                "in the card database."
            ),
            "side": side,
            "hero": hero_name,
        }

    # ========================================================
    # READ HERO DATABASE SIDE
    # ========================================================

    database_hero_side_raw = str(
        getattr(
            hero_card,
            "side",
            "",
        ) or ""
    ).strip()

    database_hero_side = normalize_side(
        database_hero_side_raw
    )

    logger.info(
        "HERO VALIDATION - hero=%r "
        "selected_side=%r "
        "database_side=%r "
        "raw_database_side=%r",
        hero_name,
        side,
        database_hero_side,
        database_hero_side_raw,
    )

    # ========================================================
    # HERO SIDE VALIDATION
    # ========================================================

    if not database_hero_side:
        logger.error(
            "HERO VALIDATION FAILED - hero=%r has invalid "
            "database side=%r",
            hero_name,
            database_hero_side_raw,
        )

        return {
            "error": (
                "The selected hero does not have a valid "
                "Plants or Zombies side in the card database."
            ),
            "hero": hero_name,
            "database_side": database_hero_side_raw,
            "selected_side": side,
        }

    if database_hero_side != side:
        logger.error(
            "HERO SIDE MISMATCH - hero=%r "
            "selected_side=%r "
            "database_side=%r",
            hero_name,
            side,
            database_hero_side,
        )

        return {
            "error": (
                "The selected hero does not belong "
                "to the selected deck side."
            ),
            "side": side,
            "hero": hero_name,
            "database_side": database_hero_side,
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

    logger.info(
        "HERO VALIDATION - hero=%r rarity=%r",
        hero_name,
        hero_rarity,
    )

    if "hero" not in hero_rarity:
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
        return {
            "error": (
                "The selected hero does not have "
                "any card types configured."
            ),
            "hero": hero_name,
        }

    logger.info(
        "HERO VALIDATION - hero=%r card_types=%s",
        hero_name,
        sorted(hero_card_types),
    )

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

    # ========================================================
    # LOAD CARDS FOR SIDE
    #
    # Database values are expected to be:
    #
    #     Plants
    #     Zombies
    #
    # We still normalize the result in Python so accidental
    # whitespace/casing does not cause incorrect behavior.
    # ========================================================

    side_cards = list(
        WebCards.objects
        .exclude(
            set_rarity__iexact="Token"
        )
    )

    # ========================================================
    # BUILD SIDE-SPECIFIC CARD LOOKUP
    # ========================================================

    card_lookup = {}

    for card in side_cards:

        database_side_raw = str(
            getattr(
                card,
                "side",
                "",
            ) or ""
        ).strip()

        database_side = normalize_side(
            database_side_raw
        )

        if database_side != side:
            continue

        card_name = str(
            getattr(
                card,
                "card_name",
                "",
            ) or ""
        ).strip()

        if not card_name:
            continue

        card_lookup.setdefault(
            normalize_name(card_name),
            card,
        )

    logger.info(
        "CARD VALIDATION - selected side=%r "
        "loaded %d cards for that side",
        side,
        len(card_lookup),
    )

    # ========================================================
    # VALIDATE CARDS
    # ========================================================

    invalid_cards = []
    incompatible_cards = []
    valid_cards = []

    for entry in parsed_cards:

        cleaned_name = str(
            entry.get(
                "name",
                "",
            )
        ).strip()

        lookup_key = normalize_name(
            cleaned_name
        )

        card = card_lookup.get(
            lookup_key
        )

        # ----------------------------------------------------
        # CARD DOES NOT EXIST / WRONG SIDE
        # ----------------------------------------------------

        if not card:
            invalid_cards.append(
                cleaned_name
            )
            continue

        # ----------------------------------------------------
        # TOKEN
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # CARD TYPES
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # HERO COMPATIBILITY
        # ----------------------------------------------------

        if not card_types.intersection(
            hero_card_types
        ):
            incompatible_cards.append(
                cleaned_name
            )
            continue

        # ----------------------------------------------------
        # VALID CARD
        # ----------------------------------------------------

        valid_cards.append(
            {
                "name": str(
                    getattr(
                        card,
                        "card_name",
                        "",
                    ) or ""
                ).strip(),
                "count": entry["count"],
            }
        )

    # ========================================================
    # INVALID SIDE CARDS
    # ========================================================

    if invalid_cards:
        logger.error(
            "CARD VALIDATION FAILED - wrong/missing side cards "
            "side=%r cards=%s",
            side,
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
            "CARD VALIDATION FAILED - incompatible cards "
            "hero=%r hero_types=%s cards=%s",
            hero_name,
            sorted(hero_card_types),
            incompatible_cards,
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
    # RATIO TOTAL
    # ========================================================

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

    # ========================================================
    # STORAGE FORMAT
    # ========================================================

    return {
        "cards": cards_to_storage_string(
            valid_cards
        )
    }


# ============================================================
# GET / POST ADMIN DECKLISTS
# ============================================================

@api_view(["GET", "POST"])
@parser_classes([
    MultiPartParser,
    FormParser,
])
@owner_required
def admin_decklists(request):

    # ========================================================
    # GET
    # ========================================================

    if request.method == "GET":

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

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        except DatabaseError as exc:

            logger.exception(
                "Admin decklist query failed"
            )

            payload = {
                "error": (
                    "Database query failed for "
                    "admin decklists."
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

    # ========================================================
    # POST
    # ========================================================

    if request.method == "POST":

        return create_admin_deck(
            request
        )


# ============================================================
# CREATE ADMIN DECK
# ============================================================

def create_admin_deck(request):

    data = request.data.copy()

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

    # ========================================================
    # GENERATE DECK ID
    # ========================================================

    try:

        existing_ids = (
            Decklist.objects
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

        next_id = (
            max(
                numeric_ids,
                default=0,
            )
            + 1
        )

        deckid = str(
            next_id
        )

        data["deckid"] = deckid

        print(
            "GENERATED DECK ID:",
            deckid,
        )

    except DatabaseError as exc:

        logger.exception(
            "Unable to generate deck ID."
        )

        payload = {
            "error": (
                "Unable to generate deck ID."
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

    # ========================================================
    # SIDE
    # ========================================================

    deck_side = normalize_side(
        data.get(
            "side",
            "",
        )
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

    # ========================================================
    # HERO + CARDS
    # ========================================================

    if "cards" in data:

        validation = validate_deck_cards(
            side=deck_side,
            hero=data.get("hero"),
            selected_cards=data.get("cards"),
        )

        print(
            "CARD VALIDATION:",
            validation,
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

    else:

        return Response(
            {
                "error": (
                    "Please select at least one card."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ========================================================
    # CLOUDINARY IMAGE
    # ========================================================

    uploaded_image = (
        request.FILES.get("image_file")
        or request.FILES.get("image")
    )

    print(
        "UPLOADED IMAGE:",
        uploaded_image,
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

    try:

        image_url = save_deck_image(
            uploaded_image,
            deckid=deckid,
            deck_name=(
                data.get("name")
                or deckid
            ),
        )

        data["image"] = image_url

        print(
            "SAVED IMAGE URL:",
            image_url,
        )

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
    # SERIALIZER
    # ========================================================

    serializer = AdminDeckSerializer(
        data=data
    )

    if not serializer.is_valid():

        print()
        print("========================================")
        print("CREATE SERIALIZER ERROR")
        print(serializer.errors)
        print("========================================")

        return Response(
            {
                "error": (
                    "Unable to create deck."
                ),
                "fields": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ========================================================
    # SAVE
    # ========================================================

    try:

        deck = serializer.save()

    except DatabaseError as exc:

        logger.exception(
            "Unable to create deck %s",
            deckid,
        )

        payload = {
            "error": (
                "Database creation failed."
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

    except Exception as exc:

        logger.exception(
            "Unexpected deck creation error."
        )

        payload = {
            "error": (
                "Unable to create deck."
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

    return Response(
        AdminDeckSerializer(
            deck
        ).data,
        status=status.HTTP_201_CREATED,
    )


# ============================================================
# CREATE ENDPOINT
# ============================================================

@api_view(["POST"])
@parser_classes([
    MultiPartParser,
    FormParser,
])
@owner_required
def admin_decklist_create(request):

    return create_admin_deck(
        request
    )


# ============================================================
# ADMIN DECKLIST UPDATE
# ============================================================

@api_view(["PATCH"])
@owner_required
@parser_classes([
    MultiPartParser,
    FormParser,
    JSONParser,
])
def admin_decklist_update(
    request,
    deckid,
):

    # ========================================================
    # FIND DECK
    # ========================================================

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
            "Unable to retrieve decklist %s",
            deckid,
        )

        payload = {
            "error": (
                "Database query failed."
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

    # ========================================================
    # COPY DATA
    # ========================================================

    data = request.data.copy()

    # ========================================================
    # SIDE
    # ========================================================

    selected_side = normalize_side(
        data.get(
            "side",
            deck.side,
        )
    )

    if not selected_side:

        return Response(
            {
                "error": (
                    "Side must be Plants or Zombies."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    data["side"] = selected_side

    logger.info(
        "DECK UPDATE - deckid=%s "
        "selected side=%r "
        "existing side=%r "
        "selected hero=%r "
        "existing hero=%r",
        deckid,
        selected_side,
        deck.side,
        data.get("hero", deck.hero),
        deck.hero,
    )

    hero_changed = "hero" in data
    cards_changed = "cards" in data
    side_changed = (
        normalize_side(deck.side)
        != selected_side
    )

    if (
        hero_changed
        or cards_changed
        or side_changed
    ):

        selected_hero = data.get(
            "hero",
            deck.hero,
        )

        selected_cards = data.get(
            "cards",
            deck.cards,
        )

        validation = validate_deck_cards(
            side=selected_side,
            hero=selected_hero,
            selected_cards=selected_cards,
        )

        print(
            "UPDATE CARD VALIDATION:",
            validation,
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

        data["hero"] = str(
            selected_hero or ""
        ).strip()

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
                deck_name=(
                    data.get("name")
                    or deck.name
                ),
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

    # ========================================================
    # REMOVE FILE-ONLY FIELDS
    # ========================================================

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

    serializer = AdminDeckSerializer(
        deck,
        data=data,
        partial=True,
    )

    if not serializer.is_valid():

        print()
        print("========================================")
        print("UPDATE SERIALIZER ERROR")
        print(serializer.errors)
        print("========================================")

        return Response(
            {
                "error": (
                    "Invalid decklist data."
                ),
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
            "Unable to update decklist %s",
            deckid,
        )

        payload = {
            "error": (
                "Database update failed."
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

    except Exception as exc:

        logger.exception(
            "Unexpected deck update error."
        )

        payload = {
            "error": (
                "Unable to update decklist."
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

    # ========================================================
    # FIND DECK
    # ========================================================

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
            "error": (
                "Database query failed."
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

    # ========================================================
    # DELETE
    # ========================================================

    try:

        deck.delete()

    except DatabaseError as exc:

        logger.exception(
            "Unable to delete decklist %s",
            deckid,
        )

        payload = {
            "error": (
                "Database deletion failed."
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

    return Response(
        {
            "success": True,
            "deleted": deckid,
        },
        status=status.HTTP_200_OK,
    )