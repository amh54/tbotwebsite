from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from urllib.parse import unquote
from ..models import (
    WebDeckbuilder,
    UserProfile,
    Decklist,
)

from ..serializers import (
    PublicDeckbuilderSerializer,
    PublicDeckSerializer,
)



def _normalize_deckbuilder_name(value):
    text = str(value or "")
    for _ in range(5):
        decoded = unquote(text)
        if decoded == text:
            break
        text = decoded

    return " ".join(text.split()).casefold()


def _get_deckbuilder(deckbuilder_name):
    """
    Find a deckbuilder by name using normalized matching.
    """

    target_name = _normalize_deckbuilder_name(deckbuilder_name)

    for deckbuilder in WebDeckbuilder.objects.all():
        database_name = _normalize_deckbuilder_name(
            deckbuilder.deckbuilder_name
        )

        if database_name == target_name:
            return deckbuilder

    return None


def _split_deckbuilder_names(value):
    if not value:
        return []

    text = str(value).strip()

    if not text:
        return []

    # Normalize separators.
    text = text.replace("&", ",")
    text = text.replace(";", ",")
    text = text.replace("|", ",")

    # Handle "and" as a name separator.
    text = text.replace(" and ", ",")
    text = text.replace(" AND ", ",")

    names = []

    for name in text.split(","):
        normalized = _normalize_deckbuilder_name(name)

        if normalized and normalized not in names:
            names.append(normalized)

    return names


def _deck_matches_deckbuilder(deck, deckbuilder_name):


    target_name = _normalize_deckbuilder_name(deckbuilder_name)

    if not target_name:
        return False

    creator_names = _split_deckbuilder_names(
        getattr(deck, "creator", "")
    )

    optimization_names = _split_deckbuilder_names(
        getattr(deck, "optimization", "")
    )

    return (
        target_name in creator_names
        or target_name in optimization_names
    )


def _get_deckbuilder_decks(deckbuilder):
    if deckbuilder is None:
        return []

    deckbuilder_name = deckbuilder.deckbuilder_name

    all_decks = Decklist.objects.all()

    matching_decks = [
        deck
        for deck in all_decks
        if _deck_matches_deckbuilder(
            deck,
            deckbuilder_name,
        )
    ]

    matching_decks.sort(
        key=lambda deck: (
            str(getattr(deck, "side", "") or "").lower(),
            str(getattr(deck, "hero", "") or "").lower(),
            str(getattr(deck, "name", "") or "").lower(),
        )
    )

    return matching_decks


@api_view(["GET"])
def deckbuilders(request):
    deckbuilders_queryset = WebDeckbuilder.objects.all()

    results = []

    for deckbuilder in deckbuilders_queryset:
        profile = (
            UserProfile.objects
            .filter(
                discord_id=str(deckbuilder.user_id)
            )
            .first()
        )

        decks = _get_deckbuilder_decks(deckbuilder)
        actual_count = len(decks)

        serializer = PublicDeckbuilderSerializer(
            deckbuilder
        )

        data = serializer.data

        data["has_profile"] = profile is not None
        data["numb_of_decks"] = actual_count
        data["deck_count"] = actual_count
        data["actual_deck_count"] = actual_count

        results.append(data)

    results.sort(
        key=lambda item: (
            -int(item.get("numb_of_decks") or 0),
            str(
                item.get("deckbuilder_name")
                or ""
            ).casefold(),
        )
    )

    return Response(
        {
            "success": True,
            "deckbuilders": results,
            "count": len(results),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def deckbuilder_count(request):
    count = WebDeckbuilder.objects.count()

    return Response(
        {
            "success": True,
            "count": count,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def deckbuilder_detail(request, deckbuilder_name):

    deckbuilder = _get_deckbuilder(deckbuilder_name)

    if deckbuilder is None:
        return Response(
            {
                "success": False,
                "error": "Deckbuilder not found.",
                "requested_name": deckbuilder_name,
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    profile = (
        UserProfile.objects
        .filter(
            discord_id=str(deckbuilder.user_id)
        )
        .first()
    )

    serializer = PublicDeckbuilderSerializer(
        deckbuilder
    )

    data = serializer.data
    data["has_profile"] = profile is not None

    return Response(
        {
            "success": True,
            "deckbuilder": data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def deckbuilder_decks(request, deckbuilder_name):
    deckbuilder = _get_deckbuilder(deckbuilder_name)

    if deckbuilder is None:
        return Response(
            {
                "success": False,
                "error": "Deckbuilder not found.",
                "requested_name": deckbuilder_name,
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    decks = _get_deckbuilder_decks(deckbuilder)

    deckbuilder_serializer = PublicDeckbuilderSerializer(
        deckbuilder
    )

    deck_serializer = PublicDeckSerializer(
        decks,
        many=True,
    )

    profile = (
        UserProfile.objects
        .filter(
            discord_id=str(deckbuilder.user_id)
        )
        .first()
    )

    return Response(
        {
            "success": True,
            "deckbuilder": deckbuilder_serializer.data,
            "has_profile": profile is not None,
            "decks": deck_serializer.data,
            "deck_count": len(decks),
            "actual_deck_count": len(decks),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def deckbuilder_deck_count(request, deckbuilder_name):

    deckbuilder = _get_deckbuilder(deckbuilder_name)

    if deckbuilder is None:
        return Response(
            {
                "success": False,
                "error": "Deckbuilder not found.",
                "requested_name": deckbuilder_name,
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    decks = _get_deckbuilder_decks(deckbuilder)

    return Response(
        {
            "success": True,
            "deck_count": len(decks),
        },
        status=status.HTTP_200_OK,
    )