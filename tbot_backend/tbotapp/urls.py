from django.urls import path

from django.urls import path

# ============================================================
# PUBLIC DECKLIST VIEWS
# ============================================================

from .views.decklists import (
    decklists,
    legacy_decklists,
    legacy_decklist_count,
    decklist_count,
)

# ============================================================
# CARD / HERO VIEWS
# ============================================================

from .views.cards import (
    card_info,
    card_count,
    heroinfo,
    hero_count,
)

# ============================================================
# KEEP OR SCRAP VIEWS
# ============================================================

from .views.keep_or_scrap import (
    keep_or_scrap,
    keep_or_scrap_count,
)

# ============================================================
# AUTH VIEWS
# ============================================================

from .views.auth import (
    csrf_token,
    discord_login,
    discord_callback,
    discord_me,
    discord_logout,
)

# ============================================================
# PERMISSIONS / OWNER VIEWS
# ============================================================

from .views.permissions import (
    admin_check,
    owner_action,
)

# ============================================================
# ADMIN DECK VIEWS
# ============================================================

from .views.admin_decks import (
    admin_decklists,
    admin_decklist_create,
    admin_decklist_update,
    admin_decklist_delete,
)

# ============================================================
# ADMIN LEGACY DECK VIEWS
# ============================================================

from .views.admin_legacy_decks import (
    admin_legacy_decklists,
    admin_legacy_decklist_update,
    admin_legacy_decklist_delete,
)

# ============================================================
# PROFILE VIEWS
# ============================================================

from .views.profile import (
    profile_me,
    profile_detail,
)


urlpatterns = [

    # ========================================================
    # PUBLIC API
    # ========================================================

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
        "cardinfo/",
        card_info,
        name="card_info",
    ),

    path(
        "heroinfo/",
        heroinfo,
        name="heroinfo",
    ),

    path(
        "keeporscrap/",
        keep_or_scrap,
        name="keep_or_scrap",
    ),

    # ========================================================
    # COUNTS
    # ========================================================

    path(
        "decklists/count/",
        decklist_count,
        name="decklist_count",
    ),

    path(
        "cards/count/",
        card_count,
        name="card_count",
    ),

    path(
        "heroinfo/count/",
        hero_count,
        name="hero_count",
    ),

    path(
        "keeporscrap/count/",
        keep_or_scrap_count,
        name="keep_or_scrap_count",
    ),

    # ========================================================
    # CSRF
    # ========================================================

    path(
        "csrf/",
        csrf_token,
        name="csrf_token",
    ),

    # ========================================================
    # ADMIN / OWNER
    # ========================================================

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

    # ========================================================
    # ADMIN CURRENT DECKS
    # ========================================================

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

    # ========================================================
    # ADMIN / LEGACY DECKLISTS
    # ========================================================

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

    # ========================================================
    # DISCORD AUTH
    # ========================================================

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

    # ========================================================
    # PROFILES
    # ========================================================

    path(
        "profile/me/",
        profile_me,
        name="profile_me",
    ),

    path(
        "profile/<str:profile_slug>/",
        profile_detail,
        name="profile_by_slug",
    ),
]