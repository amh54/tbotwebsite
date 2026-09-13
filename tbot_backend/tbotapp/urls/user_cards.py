from django.urls import path

from ..views.user_cards import (
    user_card_count,
    user_card_create,
    user_card_delete,
    user_card_update,
    user_cards,
    user_cards_available,
    user_card_classes,
    user_profile_cards,
)


urlpatterns = [
    path(
        "user-cards/",
        user_cards,
        name="user_cards",
    ),
    path(
        "profile/<str:profile_slug>/cards/",
        user_profile_cards,
        name="user_profile_cards",
    ),
    path(
        "user-cards/create/",
        user_card_create,
        name="user_card_create",
    ),
    path(
        "user-cards/count/",
        user_card_count,
        name="user_card_count",
    ),
    path(
        "user-cards/available/",
        user_cards_available,
        name="user_cards_available",
    ),
    path(
        "user-cards/classes/",
        user_card_classes,
        name="user_card_classes",
    ),
    path(
        "user-cards/<int:card_id>/",
        user_card_update,
        name="user_card_update",
    ),
    path(
        "user-cards/<int:card_id>/delete/",
        user_card_delete,
        name="user_card_delete",
    ),
]