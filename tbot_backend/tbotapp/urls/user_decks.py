from django.urls import path

from ..views.user_deck_suggestions import (
    user_deck_suggestion_create,
    user_deck_suggestion_status,
)
from ..views.user_decks import (
    download_user_deck_image,
    public_profile_decks_count,
    shared_user_deck,
    user_deck_create,
    user_deck_delete,
    user_deck_update,
    user_decks,
)


urlpatterns = [
    path(
        "user-decks/",
        user_decks,
        name="user_decks",
    ),
    path(
        "profile/<str:profile_slug>/decks/count/",
        public_profile_decks_count,
        name="public-profile-decks-count",
    ),
    path(
        "user-decks/create/",
        user_deck_create,
        name="user_deck_create",
    ),
    path(
        "user-decks/<int:deck_id>/",
        user_deck_update,
        name="user_deck_update",
    ),
    path(
        "user-decks/<int:deck_id>/delete/",
        user_deck_delete,
        name="user_deck_delete",
    ),
    path(
        "user-decks/shared/<str:profile_slug>/<int:deck_id>/",
        shared_user_deck,
        name="shared_user_deck",
    ),
    path(
        "user-deck-suggestions/create/",
        user_deck_suggestion_create,
        name="user_deck_suggestion_create",
    ),
    path(
        "user-deck-suggestions/<int:suggestion_id>/status/",
        user_deck_suggestion_status,
        name="user_deck_suggestion_status",
    ),
    path(
    "user-decks/<int:deck_id>/download/",
    download_user_deck_image,
    name="download_user_deck_image",
),
]