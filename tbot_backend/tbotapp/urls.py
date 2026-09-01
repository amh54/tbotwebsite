from django.urls import path

from .views.decklists import (
    decklists,
    legacy_decklists,
    legacy_decklist_count,
    decklist_count,
)
from .views.site_updates import site_updates
from .views.cards import (
    card_info,
    card_count,
    heroinfo,
    hero_count,
)

from .views.user_deck_suggestions import (
    user_deck_suggestion_create,
    user_deck_suggestion_status,
)

from .views.keep_or_scrap import (
    keep_or_scrap,
    keep_or_scrap_count,
)

from .views.admin_keep_or_scrap import (
    admin_keep_or_scrap,
    admin_keep_or_scrap_detail,
    admin_keep_or_scrap_image_upload,
    admin_keep_or_scrap_cloudinary_signature,
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
    public_profile_count,
    public_profiles,
    public_profile_decks,
    profile_update,
)

from .views.user_decks import (
    user_decks,
    public_profile_decks_count,
    user_deck_create,
    user_deck_update,
    user_deck_delete,
    shared_user_deck,
)

from .views.deckbuilders import (
    deckbuilders,
    deckbuilder_count,
    deckbuilder_detail,
    deckbuilder_decks,
    deckbuilder_deck_count,
)

from .views.user_cards import (
    user_cards,
    user_profile_cards,
    user_card_create,
    user_card_update,
    user_card_delete,
    user_card_count,
    user_cards_available,
    user_card_classes,
)

from .views.admin_cards import (
    admin_cards,
    admin_card_detail,
    admin_card_image_upload,
)

from .views.admin_bugs import (
    bug_report_create,
    admin_bug_reports,
    admin_bug_report_detail,
)

from .views.user_bugs import (
    user_bug_reports,
    user_bug_report_detail,
)


urlpatterns = [
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

    path(
        "admin/cards/",
        admin_cards,
        name="admin-cards",
    ),
    path(
        "admin/cards/<int:cardid>/",
        admin_card_detail,
        name="admin-card-detail",
    ),
    path(
        "admin/cards/image-upload/",
        admin_card_image_upload,
        name="admin-card-image-upload",
    ),

    path(
        "admin/keeporscrap/",
        admin_keep_or_scrap,
        name="admin-keep-or-scrap",
    ),
    path(
        "admin/keeporscrap/<int:tierid>/",
        admin_keep_or_scrap_detail,
        name="admin-keep-or-scrap-detail",
    ),
    path(
        "admin/keeporscrap/image-upload/",
        admin_keep_or_scrap_image_upload,
        name="admin-keep-or-scrap-image-upload",
    ),
    path(
        "admin/keeporscrap/cloudinary-signature/",
        admin_keep_or_scrap_cloudinary_signature,
        name="admin-keep-or-scrap-cloudinary-signature",
    ),

    path(
        "bug-reports/create/",
        bug_report_create,
        name="bug-report-create",
    ),
    path(
        "admin/bugs/",
        admin_bug_reports,
        name="admin-bug-reports",
    ),
    path(
        "admin/bugs/<int:bug_id>/",
        admin_bug_report_detail,
        name="admin-bug-report-detail",
    ),
    path(
        "user/bug-reports/",
        user_bug_reports,
        name="user-bug-reports",
    ),
    path(
        "user/bug-reports/<int:bug_id>/",
        user_bug_report_detail,
        name="user-bug-report-detail",
    ),

    path(
        "profile/me/",
        profile_me,
        name="profile_me",
    ),
    path(
        "profiles/count/",
        public_profile_count,
        name="public-profile-count",
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
        "deckbuilders/<str:deckbuilder_name>/",
        deckbuilder_detail,
        name="deckbuilder-detail",
    ),
    path(
        "deckbuilders/<str:deckbuilder_name>/decks/",
        deckbuilder_decks,
        name="deckbuilder-decks",
    ),
    path(
        "deckbuilders/<str:deckbuilder_name>/decks/count/",
        deckbuilder_deck_count,
        name="deckbuilder-deck-count",
    ),

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
    path("site-updates/", site_updates, name="site-updates"),
]