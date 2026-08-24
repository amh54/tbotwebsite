
import json
import re
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view
from ..models import UserProfile, UserCard, WebCards
from ..serializers import UserCardSerializer
# ---------------------------------------------------------------------------
# Card exclusion rules
# ---------------------------------------------------------------------------

EXCLUDED_CARD_TYPES = {
    "superpower",
    "superpowers",
    "superhero",
    "superheroes",
    "hero",
    "heroes",
    "token",
    "tokens",
}

EXCLUDED_DESCRIPTION_TERMS = {
    "superpower",
    "superpowers",
    "superpower trick",
    "superpower trick card",
    "token",
}

EXCLUDED_SET_RARITY_TERMS = {
    "superpower",
    "superpowers",
    "superhero",
    "superheroes",
    "hero",
    "heroes",
    "token",
    "tokens",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_current_profile(request):
    discord_id = request.session.get("discord_id")

    if not discord_id:
        return None

    try:
        return UserProfile.objects.get(
            discord_id=str(discord_id)
        )
    except UserProfile.DoesNotExist:
        return None


def get_collectible_cards():
    """
    Return only normal collectible cards.

    Excludes:
    - Superpowers
    - Superheroes
    - Heroes
    - Tokens
    - Multi-class Hero cards
    - Cards identified as special through description
    - Cards identified as special through set/rarity
    """

    cards = WebCards.objects.all()

    # ------------------------------------------------------------------
    # Exclude special card types.
    #
    # This catches cases where card_type itself contains things such as:
    # "Superpower"
    # "Token"
    # "Hero"
    # ------------------------------------------------------------------
    for excluded_type in EXCLUDED_CARD_TYPES:
        cards = cards.exclude(
            card_type__icontains=excluded_type
        )

    # ------------------------------------------------------------------
    # Exclude special cards based on their description.
    #
    # Example:
    #
    # Bubble Up
    # description = "Superpower Trick"
    #
    # It has card_type = "Guardian", so card_type filtering alone
    # would NOT remove it.
    # ------------------------------------------------------------------
    for excluded_term in EXCLUDED_DESCRIPTION_TERMS:
        cards = cards.exclude(
            description__icontains=excluded_term
        )

    # ------------------------------------------------------------------
    # Exclude special cards based on set/rarity.
    #
    # Example:
    #
    # Magic Beanstalk
    # set_rarity = "Token"
    #
    # Hero cards may have:
    # set_rarity = "Premium - Hero"
    # ------------------------------------------------------------------
    for excluded_term in EXCLUDED_SET_RARITY_TERMS:
        cards = cards.exclude(
            set_rarity__icontains=excluded_term
        )

    # ------------------------------------------------------------------
    # Multi-class cards are Heroes.
    #
    # Examples:
    #
    # Guardian, Smarty
    # Kabloom, Guardian
    #
    # Normal collectible cards have exactly one class.
    # ------------------------------------------------------------------
    cards = cards.exclude(
        card_type__contains=","
    )

    return cards


def get_card_class_names(cards):
    """
    Convert card_type values into a unique list of individual classes.

    Examples:

        Guardian
        Smarty
        Guardian, Smarty
        Kabloom, Guardian

    become:

        Guardian
        Kabloom
        Smarty

    Multi-class cards are already excluded from get_collectible_cards(),
    but splitting on commas here also prevents duplicate/composite class
    names from ever appearing in the dropdown.
    """

    class_names = set()

    for card_type in cards.values_list(
        "card_type",
        flat=True,
    ):
        if not card_type:
            continue

        for card_class in str(card_type).split(","):
            normalized = card_class.strip()

            if not normalized:
                continue

            if normalized.casefold() in EXCLUDED_CARD_TYPES:
                continue

            class_names.add(normalized)

    return sorted(
        class_names,
        key=lambda value: value.casefold(),
    )


def card_type_contains_class(card_type, requested_class):
    """
    Check whether a card's comma-separated card_type contains
    the requested individual class.

    Examples:

        "Guardian, Smarty" + "Guardian" -> True
        "Guardian, Smarty" + "Smarty"   -> True
        "Guardian, Smarty" + "Kabloom"  -> False
    """

    if not card_type or not requested_class:
        return False

    requested = requested_class.strip().casefold()

    return any(
        card_class.strip().casefold() == requested
        for card_class in str(card_type).split(",")
    )


def get_card_cost(card):
    """
    Extract the card's cost from the stats field.

    Example:

        "1 <:Sun:...> 2 <:Strength:...> 1 <:Health:...>"

    returns:

        1

    Cards without a usable stats cost are placed after cards
    with a valid cost.
    """

    stats = str(card.stats or "").strip()

    if not stats:
        return float("inf")

    match = re.search(r"\b(\d+)\b", stats)

    if not match:
        return float("inf")

    try:
        return int(match.group(1))
    except (TypeError, ValueError):
        return float("inf")


def sort_cards_by_cost_and_name(cards):
    """
    Sort cards by:

    1. Lowest cost first
    2. Alphabetically by card name when costs are equal
    """

    return sorted(
        cards,
        key=lambda card: (
            get_card_cost(card),
            str(card.card_name or "").casefold(),
        ),
    )


# ---------------------------------------------------------------------------
# User collection
# ---------------------------------------------------------------------------

@require_http_methods(["GET"])
def user_cards(request):
    profile = get_current_profile(request)

    if not profile:
        return JsonResponse(
            {
                "authenticated": False,
                "error": "You must be logged in.",
            },
            status=401,
        )

    cards = (
        UserCard.objects
        .filter(profile_id=profile.id)
        .order_by("card_name")
    )

    card_names = [
        card.card_name
        for card in cards
    ]

    web_cards = {}

    if card_names:
        matching_cards = (
            get_collectible_cards()
            .filter(card_name__in=card_names)
        )

        web_cards = {
            card.card_name: card
            for card in matching_cards
        }

    results = []

    for user_card in cards:
        card = web_cards.get(user_card.card_name)

        results.append(
            {
                "id": user_card.id,
                "card_name": user_card.card_name,
                "quantity": user_card.quantity,
                "card": (
                    {
                        "cardid": card.cardid,
                        "card_type": card.card_type,
                        "card_name": card.card_name,
                        "side": card.side,
                        "title": card.title,
                        "stats": card.stats,
                        "description": card.description,
                        "ability": card.ability,
                        "thumbnail": card.thumbnail,
                        "traits": card.traits,
                        "set_rarity": card.set_rarity,
                        "flavor_text": card.flavor_text,
                        "aliases": card.aliases,
                        "button": card.button,
                        "button_emoji": card.button_emoji,
                        "button2": card.button2,
                        "button_emoji2": card.button_emoji2,
                    }
                    if card
                    else None
                ),
            }
        )

    return JsonResponse(
        {
            "authenticated": True,
            "profile_id": profile.id,
            "cards": results,
        }
    )


# ---------------------------------------------------------------------------
# Add cards
# ---------------------------------------------------------------------------

@require_http_methods(["POST"])
def user_card_create(request):
    profile = get_current_profile(request)

    if not profile:
        return JsonResponse(
            {
                "authenticated": False,
                "error": "You must be logged in.",
            },
            status=401,
        )

    try:
        data = json.loads(request.body)
    except (TypeError, ValueError):
        return JsonResponse(
            {"error": "Invalid JSON."},
            status=400,
        )

    cards_data = data.get("cards")

    # Support a single-card request as well.
    if cards_data is None:
        card_name = str(
            data.get("card_name", "")
        ).strip()

        quantity = data.get("quantity", 1)

        if not card_name:
            return JsonResponse(
                {"error": "card_name is required."},
                status=400,
            )

        cards_data = [
            {
                "card_name": card_name,
                "quantity": quantity,
            }
        ]

    if not isinstance(cards_data, list):
        return JsonResponse(
            {
                "error": "cards must be an array."
            },
            status=400,
        )

    if not cards_data:
        return JsonResponse(
            {
                "error": "At least one card is required."
            },
            status=400,
        )

    validated_cards = []
    requested_names = set()
    collectible_cards = get_collectible_cards()

    for index, item in enumerate(cards_data):

        if not isinstance(item, dict):
            return JsonResponse(
                {
                    "error": (
                        f"Card at index {index} is invalid."
                    )
                },
                status=400,
            )

        card_name = str(
            item.get("card_name", "")
        ).strip()

        quantity = item.get("quantity", 1)

        if not card_name:
            return JsonResponse(
                {
                    "error": (
                        f"Card at index {index} "
                        "is missing card_name."
                    )
                },
                status=400,
            )

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return JsonResponse(
                {
                    "error": (
                        f"Quantity for '{card_name}' "
                        "must be an integer."
                    )
                },
                status=400,
            )

        if quantity <= 0:
            return JsonResponse(
                {
                    "error": (
                        f"Quantity for '{card_name}' "
                        "must be greater than 0."
                    )
                },
                status=400,
            )

        normalized_name = card_name.casefold()

        if normalized_name in requested_names:
            return JsonResponse(
                {
                    "error": (
                        f"'{card_name}' was selected "
                        "more than once."
                    )
                },
                status=400,
            )

        requested_names.add(normalized_name)

        try:
            web_card = collectible_cards.get(
                card_name=card_name
            )
        except WebCards.DoesNotExist:
            return JsonResponse(
                {
                    "error": (
                        f"That card does not exist or "
                        f"is not a collectible card: "
                        f"{card_name}"
                    )
                },
                status=404,
            )

        validated_cards.append(
            {
                "web_card": web_card,
                "quantity": quantity,
            }
        )

    web_card_names = [
        item["web_card"].card_name
        for item in validated_cards
    ]

    existing_cards = (
        UserCard.objects
        .filter(
            profile_id=profile.id,
            card_name__in=web_card_names,
        )
    )

    existing_by_name = {
        card.card_name: card
        for card in existing_cards
    }

    if existing_by_name:
        already_owned = []

        for card_name, user_card in existing_by_name.items():
            already_owned.append(
                {
                    "id": user_card.id,
                    "card_name": card_name,
                    "quantity": user_card.quantity,
                }
            )

        return JsonResponse(
            {
                "error": (
                    "One or more cards are already "
                    "in your collection."
                ),
                "already_owned": already_owned,
            },
            status=409,
        )

    created_cards = []

    for item in validated_cards:
        web_card = item["web_card"]
        quantity = item["quantity"]

        user_card = UserCard.objects.create(
            profile_id=profile.id,
            card_name=web_card.card_name,
            quantity=quantity,
        )

        created_cards.append(
            {
                "id": user_card.id,
                "card_name": user_card.card_name,
                "quantity": user_card.quantity,
                "card": {
                    "cardid": web_card.cardid,
                    "card_type": web_card.card_type,
                    "card_name": web_card.card_name,
                    "side": web_card.side,
                    "title": web_card.title,
                    "stats": web_card.stats,
                    "description": web_card.description,
                    "ability": web_card.ability,
                    "thumbnail": web_card.thumbnail,
                    "traits": web_card.traits,
                    "set_rarity": web_card.set_rarity,
                    "flavor_text": web_card.flavor_text,
                    "aliases": web_card.aliases,
                    "button": web_card.button,
                    "button_emoji": web_card.button_emoji,
                    "button2": web_card.button2,
                    "button_emoji2": web_card.button_emoji2,
                },
            }
        )

    return JsonResponse(
        {
            "success": True,
            "created": len(created_cards),
            "cards": created_cards,
        },
        status=201,
    )


# ---------------------------------------------------------------------------
# Update card quantity
# ---------------------------------------------------------------------------

@require_http_methods(["PATCH"])
def user_card_update(request, card_id):
    profile = get_current_profile(request)

    if not profile:
        return JsonResponse(
            {"error": "You must be logged in."},
            status=401,
        )

    try:
        data = json.loads(request.body)
    except (TypeError, ValueError):
        return JsonResponse(
            {"error": "Invalid JSON."},
            status=400,
        )

    try:
        quantity = int(data.get("quantity"))
    except (TypeError, ValueError):
        return JsonResponse(
            {"error": "quantity must be an integer."},
            status=400,
        )

    if quantity < 0:
        return JsonResponse(
            {"error": "quantity cannot be negative."},
            status=400,
        )

    try:
        user_card = UserCard.objects.get(
            id=card_id,
            profile_id=profile.id,
        )
    except UserCard.DoesNotExist:
        return JsonResponse(
            {"error": "Card not found."},
            status=404,
        )

    user_card.quantity = quantity

    user_card.save(
        update_fields=[
            "quantity",
            "updated_at",
        ]
    )

    return JsonResponse(
        {
            "success": True,
            "id": user_card.id,
            "card_name": user_card.card_name,
            "quantity": user_card.quantity,
        }
    )


# ---------------------------------------------------------------------------
# Delete card
# ---------------------------------------------------------------------------

@require_http_methods(["DELETE"])
def user_card_delete(request, card_id):
    profile = get_current_profile(request)

    if not profile:
        return JsonResponse(
            {"error": "You must be logged in."},
            status=401,
        )

    try:
        user_card = UserCard.objects.get(
            id=card_id,
            profile_id=profile.id,
        )
    except UserCard.DoesNotExist:
        return JsonResponse(
            {"error": "Card not found."},
            status=404,
        )

    user_card.delete()

    return JsonResponse(
        {
            "success": True,
            "deleted_id": card_id,
        }
    )


# ---------------------------------------------------------------------------
# Collection count
# ---------------------------------------------------------------------------

@require_http_methods(["GET"])
def user_card_count(request):
    profile = get_current_profile(request)

    if not profile:
        return JsonResponse(
            {
                "authenticated": False,
                "error": "You must be logged in.",
            },
            status=401,
        )

    total_unique = (
        UserCard.objects
        .filter(profile_id=profile.id)
        .count()
    )

    total_quantity = sum(
        UserCard.objects
        .filter(profile_id=profile.id)
        .values_list(
            "quantity",
            flat=True,
        )
    )

    total_web_cards = (
        get_collectible_cards().count()
    )

    return JsonResponse(
        {
            "unique_cards": total_unique,
            "total_quantity": total_quantity,
            "total_available_cards": total_web_cards,
            "collection_ratio": (
                total_unique / total_web_cards
                if total_web_cards
                else 0
            ),
        }
    )


# ---------------------------------------------------------------------------
# Available cards
# ---------------------------------------------------------------------------

@require_http_methods(["GET"])
def user_cards_available(request):
    profile = get_current_profile(request)

    if not profile:
        return JsonResponse(
            {
                "authenticated": False,
                "error": "You must be logged in.",
            },
            status=401,
        )

    side = str(
        request.GET.get("side", "")
    ).strip()

    card_class = str(
        request.GET.get("class", "")
    ).strip()

    search = str(
        request.GET.get("search", "")
    ).strip()

    # Start with ONLY collectible cards.
    cards = get_collectible_cards()

    if side:
        cards = cards.filter(
            side__iexact=side
        )

    if search:
        cards = cards.filter(
            card_name__icontains=search
        )

    # Convert the queryset to a list so we can:
    #
    # 1. Filter individual classes correctly.
    # 2. Sort by cost extracted from stats.
    # 3. Sort alphabetically when costs match.
    card_list = list(cards)

    # Class filtering.
    #
    # This allows a future multi-class card to match an individual
    # class, while the normal collectible query still excludes the
    # known Hero multi-class cards.
    if card_class:
        card_list = [
            card
            for card in card_list
            if card_type_contains_class(
                card.card_type,
                card_class,
            )
        ]

    # ---------------------------------------------------------------
    # Sort:
    #
    # Cost ascending
    # Then card name alphabetically
    #
    # Example:
    #
    # 0 - Swabbie
    # 1 - Forget-Me-Nuts
    # 1 - Another Card
    # 2 - ...
    # ---------------------------------------------------------------
    card_list = sort_cards_by_cost_and_name(
        card_list
    )

    existing_names = set(
        UserCard.objects
        .filter(profile_id=profile.id)
        .values_list(
            "card_name",
            flat=True,
        )
    )

    results = []

    for card in card_list:
        results.append(
            {
                "cardid": card.cardid,
                "card_name": card.card_name,
                "side": card.side,
                "card_type": card.card_type,
                "title": card.title,
                "thumbnail": card.thumbnail,
                "traits": card.traits,
                "set_rarity": card.set_rarity,
                "stats": card.stats,
                "description": card.description,
                "already_owned": (
                    card.card_name in existing_names
                ),
            }
        )

    return JsonResponse(
        {
            "authenticated": True,
            "cards": results,
        }
    )


# ---------------------------------------------------------------------------
# Card classes
# ---------------------------------------------------------------------------

@require_http_methods(["GET"])
def user_card_classes(request):
    side = str(
        request.GET.get("side", "")
    ).strip()

    # IMPORTANT:
    # Classes are generated from the same collectible-card queryset
    # used by the available-card endpoint.
    #
    # Therefore:
    #
    # - Superpowers are not used to generate classes.
    # - Tokens are not used.
    # - Heroes are not used.
    # - Multi-class Hero entries are not used.
    cards = get_collectible_cards()

    if side:
        cards = cards.filter(
            side__iexact=side
        )

    classes = get_card_class_names(cards)

    return JsonResponse(
        {
            "classes": classes,
        }
    )
@api_view(["GET"])
def user_profile_cards(request, profile_slug):

    try:
        profile = UserProfile.objects.get(
            profile_slug=profile_slug
        )
    except UserProfile.DoesNotExist:
        return Response(
            {
                "error": "Profile not found."
            },
            status=404,
        )

    user_cards = (
        UserCard.objects
        .filter(profile_id=profile.id)
        .order_by("card_name")
    )

    card_names = [
        card.card_name
        for card in user_cards
    ]

    web_cards = {}

    if card_names:
        matching_cards = (
            get_collectible_cards()
            .filter(card_name__in=card_names)
        )

        web_cards = {
            card.card_name: card
            for card in matching_cards
        }

    results = []

    for user_card in user_cards:

        card = web_cards.get(
            user_card.card_name
        )

        results.append(
            {
                "id": user_card.id,
                "card_name": user_card.card_name,
                "quantity": user_card.quantity,
                "card": (
                    {
                        "cardid": card.cardid,
                        "card_type": card.card_type,
                        "card_name": card.card_name,
                        "side": card.side,
                        "title": card.title,
                        "stats": card.stats,
                        "description": card.description,
                        "ability": card.ability,
                        "thumbnail": card.thumbnail,
                        "traits": card.traits,
                        "set_rarity": card.set_rarity,
                        "flavor_text": card.flavor_text,
                    }
                    if card
                    else None
                ),
            }
        )

    return Response(
        {
            "profile": profile_slug,
            "cards": results,
            "shared_view": True,
        }
    )