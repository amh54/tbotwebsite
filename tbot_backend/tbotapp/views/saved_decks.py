from django.db import IntegrityError

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import (
    Decklist,
    LegacyDecklist,
    SavedDeck,
    UserDeck,
)
from ..serializers import SavedDeckSerializer
from ..utils.saved_decks import (
    normalize_datetime,
    sync_saved_decks_for_deck,
)
from .profile import get_current_profile


SOURCE_MODELS = {
    "decklist": (
        Decklist,
        "deckid",
    ),
    "legacy": (
        LegacyDecklist,
        "deckid",
    ),
    "user_deck": (
        UserDeck,
        "id",
    ),
}


def _deck_value(
    deck,
    field,
    default="",
):
    value = getattr(
        deck,
        field,
        None,
    )

    if value is None:
        return default

    return value


def _get_source_model(source_type):
    return SOURCE_MODELS.get(source_type)


@api_view(["GET"])
def saved_decks_list(request):
    profile, error = get_current_profile(request)

    if error:
        return error

    saved_decks = (
        SavedDeck.objects
        .filter(profile_id=profile.id)
        .order_by("-id")
    )

    serializer = SavedDeckSerializer(
        saved_decks,
        many=True,
    )

    return Response(
        {
            "success": True,
            "saved_decks": serializer.data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def save_deck(
    request,
    source_type,
    deck_id,
):
    profile, error = get_current_profile(request)

    if error:
        return error

    source_config = _get_source_model(source_type)

    if source_config is None:
        return Response(
            {
                "error": "Invalid deck source type."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    model, id_field = source_config

    try:
        deck = model.objects.get(
            **{
                id_field: deck_id,
            }
        )
    except model.DoesNotExist:
        return Response(
            {
                "error": "Deck not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    source_id = getattr(
        deck,
        id_field,
    )

    existing_saved_deck = (
        SavedDeck.objects
        .filter(
            profile_id=profile.id,
            source_type=source_type,
            source_deck_id=source_id,
        )
        .first()
    )

    if existing_saved_deck:
        sync_saved_decks_for_deck(
            deck,
            source_type=source_type,
        )

        existing_saved_deck.refresh_from_db()

        return Response(
            {
                "success": True,
                "saved": True,
                "already_saved": True,
                "message": (
                    f"{existing_saved_deck.name} "
                    "is already saved to your profile."
                ),
                "deck": SavedDeckSerializer(
                    existing_saved_deck
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    saved_deck = SavedDeck(
        profile_id=profile.id,
        source_deck_id=source_id,
        source_type=source_type,

        name=_deck_value(
            deck,
            "name",
        ),
        hero=_deck_value(
            deck,
            "hero",
        ),
        side=_deck_value(
            deck,
            "side",
        ),
        category=_deck_value(
            deck,
            "category",
        ),
        archetype=_deck_value(
            deck,
            "archetype",
        ),
        creator=_deck_value(
            deck,
            "creator",
        ),

        description=_deck_value(
            deck,
            "description",
        ),
        image=_deck_value(
            deck,
            "image",
            None,
        ),
        cost=_deck_value(
            deck,
            "cost",
        ),
        aliases=_deck_value(
            deck,
            "aliases",
            None,
        ),
        cards=_deck_value(
            deck,
            "cards",
            None,
        ),
        inspiration=_deck_value(
            deck,
            "inspiration",
            None,
        ),
        optimization=_deck_value(
            deck,
            "optimization",
            None,
        ),

        suggested_date=normalize_datetime(
            _deck_value(
                deck,
                "suggested_date",
                None,
            )
        ),
        updated_date=normalize_datetime(
            _deck_value(
                deck,
                "updated_date",
                None,
            )
        ),
        deck_doc=_deck_value(
            deck,
            "deck_doc",
            None,
        ),
    )

    try:
        saved_deck.save()

    except IntegrityError:
        existing_saved_deck = (
            SavedDeck.objects
            .filter(
                profile_id=profile.id,
                source_type=source_type,
                source_deck_id=source_id,
            )
            .first()
        )

        if existing_saved_deck:
            sync_saved_decks_for_deck(
                deck,
                source_type=source_type,
            )

            existing_saved_deck.refresh_from_db()

            return Response(
                {
                    "success": True,
                    "saved": True,
                    "already_saved": True,
                    "message": (
                        f"{existing_saved_deck.name} "
                        "is already saved to your profile."
                    ),
                    "deck": SavedDeckSerializer(
                        existing_saved_deck
                    ).data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "error": "Unable to save deck."
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {
            "success": True,
            "saved": True,
            "already_saved": False,
            "message": (
                f"{saved_deck.name} "
                "was saved to your profile."
            ),
            "deck": SavedDeckSerializer(
                saved_deck
            ).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["DELETE"])
def remove_saved_deck(request, source_type, deck_id):
    profile, error = get_current_profile(request)

    if error:
        return error

    source_type = str(source_type).strip().lower()

    if source_type == "userdeck":
        source_type = "user_deck"
    elif source_type == "user-deck":
        source_type = "user_deck"
    elif source_type == "legacydeck":
        source_type = "legacy"
    elif source_type == "legacy-deck":
        source_type = "legacy"

    if source_type not in SOURCE_MODELS:
        return Response(
            {"error": "Invalid deck source type."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    saved_deck = (
        SavedDeck.objects
        .filter(
            profile_id=profile.id,
            source_type=source_type,
            source_deck_id=deck_id,
        )
        .first()
    )

    if saved_deck is None:
        return Response(
            {
                "error": "Saved deck not found.",
                "profile_id": profile.id,
                "source_type": source_type,
                "source_deck_id": deck_id,
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    saved_deck.delete()

    return Response(
        {
            "success": True,
            "saved": False,
            "message": "Deck removed from your saved decks.",
        },
        status=status.HTTP_200_OK,
    )