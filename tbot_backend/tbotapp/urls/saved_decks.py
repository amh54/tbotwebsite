from django.urls import path

from ..views.saved_decks import (
    remove_saved_deck,
    save_deck,
    saved_decks_list,
)


urlpatterns = [
    path(
        "saved-decks/",
        saved_decks_list,
        name="saved-decks-list",
    ),
    path(
        "saved-decks/<str:source_type>/<int:deck_id>/",
        save_deck,
        name="saved-deck-save",
    ),
    path(
        "saved-decks/<str:source_type>/<int:deck_id>/remove/",
        remove_saved_deck,
        name="saved-deck-remove",
    ),
]