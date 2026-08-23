from django.urls import path

from .views.decklists import (
    decklists,
    legacy_decklists,
    legacy_decklist_count,
    decklist_count,
)

from .views.cards import (
    card_info,
    card_count,
    heroinfo,
    hero_count,
)

from .views.keep_or_scrap import (
    keep_or_scrap,
    keep_or_scrap_count,
)

from .views.auth import (
    csrf_token,
    discord_login,
    discord_callback,
    discord_me,
    discord_logout,
)

from .views.permissions import (
    admin_check,
    owner_action,
)

from .views.admin_decks import (
    admin_decklists,
    admin_decklist_create,
    admin_decklist_update,
    admin_decklist_delete,
)

from .views.admin_legacy_decks import (
    admin_legacy_decklists,
    admin_legacy_decklist_update,
    admin_legacy_decklist_delete,
)

from .views.admin_user_decks import (
    admin_user_decks,
    admin_user_deck_update,
    admin_user_deck_delete,
)

from .views.profile import (
    profile_me,
    profile_detail,
    public_profiles,
    public_profile_decks,
    profile_update,
)

from .views.user_decks import (
    user_decks,
    user_deck_create,
    user_deck_update,
    user_deck_delete,
    shared_user_deck,
)


urlpatterns = [

    # ---------------------------------------------------------
    # Public decklists
    # ---------------------------------------------------------

    path(
        "decklists/",
        decklists,
        name="decklists",
    ),

    path(
        "legacy-decklists/",
        legacy_decklists,
        name="legacy-decklists",
    ),

    path(
        "legacy-decklist-count/",
        legacy_decklist_count,
        name="legacy-decklist-count",
    ),

    path(
        "decklist-count/",
        decklist_count,
        name="decklist-count",
    ),

    # ---------------------------------------------------------
    # Cards / Heroes
    # ---------------------------------------------------------

    path(
        "cardinfo/",
        card_info,
        name="card_info",
    ),

    path(
        "card-count/",
        card_count,
        name="card-count",
    ),

    path(
        "heroinfo/",
        heroinfo,
        name="heroinfo",
    ),

    path(
        "hero-count/",
        hero_count,
        name="hero-count",
    ),

    # ---------------------------------------------------------
    # Keep or Scrap
    # ---------------------------------------------------------

    path(
        "keeporscrap/",
        keep_or_scrap,
        name="keep_or_scrap",
    ),

    path(
        "keeporscrap/count/",
        keep_or_scrap_count,
        name="keep-or-scrap-count",
    ),

    # ---------------------------------------------------------
    # Authentication
    # ---------------------------------------------------------

    path(
        "csrf/",
        csrf_token,
        name="csrf_token",
    ),

    path(
        "auth/discord/login/",
        discord_login,
        name="discord_login",
    ),

    path(
        "auth/discord/callback/",
        discord_callback,
        name="discord_callback",
    ),

    path(
        "auth/discord/me/",
        discord_me,
        name="discord_me",
    ),

    path(
        "auth/discord/logout/",
        discord_logout,
        name="discord_logout",
    ),

    # ---------------------------------------------------------
    # Admin permissions
    # ---------------------------------------------------------

    path(
        "admin/check/",
        admin_check,
        name="admin_check",
    ),

    path(
        "admin/action/",
        owner_action,
        name="owner_action",
    ),

    # ---------------------------------------------------------
    # Admin - Main Decklists
    # ---------------------------------------------------------

    path(
        "admin/decklists/",
        admin_decklists,
        name="admin_decklists",
    ),

    path(
        "admin/decklists/create/",
        admin_decklist_create,
        name="admin_decklist_create",
    ),

    path(
        "admin/decklists/<str:deckid>/",
        admin_decklist_update,
        name="admin_decklist_update",
    ),

    path(
        "admin/decklists/<str:deckid>/delete/",
        admin_decklist_delete,
        name="admin_decklist_delete",
    ),

    # ---------------------------------------------------------
    # Admin - Legacy Decklists
    # ---------------------------------------------------------

    path(
        "admin/legacy-decklists/",
        admin_legacy_decklists,
        name="admin_legacy_decklists",
    ),

    path(
        "admin/legacy-decklists/<str:deckid>/",
        admin_legacy_decklist_update,
        name="admin_legacy_decklist_update",
    ),

    path(
        "admin/legacy-decklists/<str:deckid>/delete/",
        admin_legacy_decklist_delete,
        name="admin_legacy_decklist_delete",
    ),

    path(
        "admin/user-decks/",
        admin_user_decks,
        name="admin_user_decks",
    ),

    path(
        "admin/user-decks/<int:deck_id>/",
        admin_user_deck_update,
        name="admin_user_deck_update",
    ),

    path(
        "admin/user-decks/<int:deck_id>/delete/",
        admin_user_deck_delete,
        name="admin_user_deck_delete",
    ),

    # ---------------------------------------------------------
    # Profiles
    # ---------------------------------------------------------

    path(
        "profile/me/",
        profile_me,
        name="profile_me",
    ),

    path(
        "profile/update/",
        profile_update,
        name="profile_update",
    ),

    path(
        "profiles/",
        public_profiles,
        name="public_profiles",
    ),

    path(
        "profile/<str:profile_slug>/",
        profile_detail,
        name="profile_by_slug",
    ),

    path(
        "profile/<str:profile_slug>/decks/",
        public_profile_decks,
        name="public_profile_decks",
    ),

    # ---------------------------------------------------------
    # User Decks
    # ---------------------------------------------------------

    path(
        "user-decks/",
        user_decks,
        name="user_decks",
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
]