from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models.functions import Trim
from ..models import (
    WebDeckbuilder,
    UserProfile,
    Decklist,
)

from ..serializers import (
    PublicDeckbuilderSerializer,
    PublicDeckSerializer,
)
def _get_deckbuilder(deckbuilder_name):
    normalized_name = str(deckbuilder_name or "").strip()

    print("REQUESTED DECKBUILDER:", repr(deckbuilder_name))
    print("NORMALIZED DECKBUILDER:", repr(normalized_name))

    deckbuilders = WebDeckbuilder.objects.all()

    for db in deckbuilders:
        print("DATABASE DECKBUILDER:", repr(db.deckbuilder_name))

    return (
        WebDeckbuilder.objects
        .annotate(normalized_name=Trim("deckbuilder_name"))
        .filter(normalized_name__iexact=normalized_name)
        .first()
    )

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
        normalized = name.strip().lower()

        if normalized and normalized not in names:
            names.append(normalized)

    return names


def _deck_matches_deckbuilder(deck, deckbuilder_name):
    """
    Determine whether a deck belongs to a deckbuilder.

    A deck matches when the deckbuilder's name appears as an
    individual name in either:

        - creator
        - optimization

    inspiration is intentionally NOT checked.
    """
    target_name = str(deckbuilder_name or "").strip().lower()

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
    deckbuilders_queryset = (
        WebDeckbuilder.objects
        .all()
    )

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
    """
    Return one deckbuilder and their profile information.

    The name comes from web_deckbuilders.deckbuilder_name.
    """
    deckbuilder = _get_deckbuilder(deckbuilder_name)

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
    """
    Return every deck belonging to the specified deckbuilder.

    A deck belongs to the deckbuilder when their name appears as
    an individual name in either:

        - creator
        - optimization

    Examples:

        creator = "Xera"

        creator = "Xera, Pillowy"

        optimization = "Xera, Pillowy, Zzyzx_Master"

    All of those count toward Xera.

    IMPORTANT:
    inspiration is NOT checked.
    """
    deckbuilder = _get_deckbuilder(deckbuilder_name)

    decks = _get_deckbuilder_decks(
        deckbuilder
    )

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

            # This is now the ACTUAL number of matching decks.
            #
            # It includes decks where the name appears in creator
            # OR optimization.
            "deck_count": len(decks),

            "actual_deck_count": len(decks),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def deckbuilder_deck_count(request, deckbuilder_name):
    """
    Return the actual number of decks belonging to the deckbuilder.

    The count uses exactly the same matching logic as
    deckbuilder_decks().

    Matching fields:

        creator
        optimization

    inspiration is intentionally NOT checked.
    """
    deckbuilder = _get_deckbuilder(deckbuilder_name)

    decks = _get_deckbuilder_decks(
        deckbuilder
    )

    return Response(
        {
            "success": True,
            "deck_count": len(decks),
        },
        status=status.HTTP_200_OK,
    )