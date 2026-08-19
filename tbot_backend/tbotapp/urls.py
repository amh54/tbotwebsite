from django.urls import path

from . import views


urlpatterns = [
    # ============================================================
    # PUBLIC API
    # ============================================================

    path(
        "decklists/",
        views.decklists,
        name="decklists",
    ),

    path(
        "cardinfo/",
        views.card_info,
        name="card_info",
    ),

    path(
        "heroinfo/",
        views.heroinfo,
        name="heroinfo",
    ),

    path(
        "keeporscrap/",
        views.keep_or_scrap,
        name="keep_or_scrap",
    ),

    # ============================================================
    # COUNTS
    # ============================================================

    path(
        "decklists/count/",
        views.decklist_count,
        name="decklist_count",
    ),

    path(
        "cards/count/",
        views.card_count,
        name="card_count",
    ),

    path(
        "heroinfo/count/",
        views.hero_count,
        name="hero_count",
    ),

    path(
        "keeporscrap/count/",
        views.keeporscrap_count,
        name="keeporscrap_count",
    ),

    # ============================================================
    # CSRF
    # ============================================================

    path(
        "csrf/",
        views.csrf_token,
        name="csrf_token",
    ),

    # ============================================================
    # ADMIN / OWNER DECKLISTS
    # ============================================================

    path(
        "admin/check/",
        views.admin_check,
        name="admin_check",
    ),

    path(
        "admin/action/",
        views.owner_action,
        name="owner_action",
    ),

    path(
        "admin/decklists/",
        views.admin_decklists,
        name="admin_decklists",
    ),

    path(
        "admin/decklists/<str:deckid>/",
        views.admin_decklist_update,
        name="admin_decklist_update",
    ),

    path(
        "admin/decklists/<str:deckid>/delete/",
        views.admin_decklist_delete,
        name="admin_decklist_delete",
    ),

    # ============================================================
    # DISCORD AUTH
    # ============================================================

    path(
        "auth/discord/login/",
        views.discord_login,
        name="discord_login",
    ),

    path(
        "auth/discord/callback/",
        views.discord_callback,
        name="discord_callback",
    ),

    path(
        "auth/discord/me/",
        views.discord_me,
        name="discord_me",
    ),

    path(
        "auth/discord/logout/",
        views.discord_logout,
        name="discord_logout",
    ),
    path(
    "profile/me/",
    views.profile_me,
    name="profile_me",
),

path(
    "profile/<str:profile_slug>/",
    views.profile_detail,
    name="profile_detail",
),
# ============================================================
# USER DECKS
# ============================================================

path(
    "user-decks/",
    views.user_decks,
    name="user_decks",
),

path(
    "user-decks/<int:deck_id>/",
    views.user_deck_detail,
    name="user_deck_detail",
),
path(
    "profile/<str:profile_slug>/",
    views.profile_by_slug,
    name="profile_by_slug",
),
]