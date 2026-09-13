from django.urls import path

from ..views.deckbuilders import (
    deckbuilder_count,
    deckbuilder_deck_count,
    deckbuilder_decks,
    deckbuilder_detail,
    deckbuilders,
)


urlpatterns = [
    path(
        "deckbuilders/",
        deckbuilders,
        name="deckbuilders",
    ),
    path(
        "deckbuilders/count/",
        deckbuilder_count,
        name="deckbuilder-count",
    ),
    path(
        "deckbuilders/<str:deckbuilder_name>/decks/count/",
        deckbuilder_deck_count,
        name="deckbuilder-deck-count",
    ),
    path(
        "deckbuilders/<str:deckbuilder_name>/decks/",
        deckbuilder_decks,
        name="deckbuilder-decks",
    ),
    path(
        "deckbuilders/<str:deckbuilder_name>/",
        deckbuilder_detail,
        name="deckbuilder-detail",
    ),
]