import json
import re

from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view

from ..models import UserProfile, UserCard, WebCards
from ..serializers import UserCardSerializer

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
    cards = WebCards.objects.all()

    for excluded_type in EXCLUDED_CARD_TYPES:
        cards = cards.exclude(
            card_type__icontains=excluded_type
        )

    for excluded_term in EXCLUDED_DESCRIPTION_TERMS:
        cards = cards.exclude(
            description__icontains=excluded_term
        )

    for excluded_term in EXCLUDED_SET_RARITY_TERMS:
        cards = cards.exclude(
            set_rarity__icontains=excluded_term
        )

    cards = cards.exclude(
        card_type__contains=","
    )

    return cards

def get_card_class_names(cards):
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
    if not card_type or not requested_class:
        return False

    requested = requested_class.strip().casefold()

    return any(
        card_class.strip().casefold() == requested
        for card_class in str(card_type).split(",")
    )

def card_type_contains_any_class(card_type, requested_classes):
    if not card_type or not requested_classes:
        return False

    requested = {
        str(card_class).strip().casefold()
        for card_class in requested_classes
        if str(card_class).strip()
    }

    if not requested:
        return False

    card_classes = {
        card_class.strip().casefold()
        for card_class in str(card_type).split(",")
        if card_class.strip()
    }

    return bool(card_classes & requested)

def get_card_cost(card):
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
    return sorted(
        cards,
        key=lambda card: (
            get_card_cost(card),
            str(card.card_name or "").casefold(),
        ),
    )

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

        if quantity < 1 or quantity > 4:
            return JsonResponse(
                {
                    "error": (
                        f"Quantity for '{card_name}' must be between 1 and 4."
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

    saved_cards = []

    for item in validated_cards:
        web_card = item["web_card"]
        quantity = item["quantity"]

        user_card, created = UserCard.objects.update_or_create(
            profile_id=profile.id,
            card_name=web_card.card_name,
            defaults={
                "quantity": quantity,
            },
        )

        saved_cards.append(
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
            "saved": len(saved_cards),
            "cards": saved_cards,
        },
        status=201,
    )

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

    sides = [
        value.strip()
        for value in request.GET.getlist("side")
        if value.strip()
    ]

    classes = [
        value.strip()
        for value in request.GET.getlist("class")
        if value.strip()
    ]

    search = str(
        request.GET.get("search", "")
    ).strip()

    sides = list(dict.fromkeys(
        sides
    ))

    classes = list(dict.fromkeys(
        classes
    ))

    cards = get_collectible_cards()

    if sides:
        cards = cards.filter(
            side__in=sides
        )

    if search:
        cards = cards.filter(
            card_name__icontains=search
        )

    card_list = list(cards)

    if classes:
        card_list = [
            card
            for card in card_list
            if card_type_contains_any_class(
                card.card_type,
                classes,
            )
        ]

    card_list = sort_cards_by_cost_and_name(
        card_list
    )

    existing_quantities = {
        item["card_name"]: item["quantity"]
        for item in UserCard.objects.filter(profile_id=profile.id).values(
            "card_name",
            "quantity",
        )
    }

    results = []

    for card in card_list:
        if existing_quantities.get(card.card_name, 0) >= 4:
            continue
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
                "owned_quantity": existing_quantities.get(
                    card.card_name,
                    0,
                ),
            }
        )

    return JsonResponse(
        {
            "authenticated": True,
            "cards": results,
        }
    )

@require_http_methods(["GET"])
def user_card_classes(request):

    sides = [
        value.strip()
        for value in request.GET.getlist("side")
        if value.strip()
    ]

    sides = list(dict.fromkeys(
        sides
    ))

    cards = get_collectible_cards()

    if sides:
        cards = cards.filter(
            side__in=sides
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
                        "flavor_text": card.flavor_text,
                        "set_rarity": card.set_rarity,
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
