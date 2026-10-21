from django.urls import path

from ..views.cards.cards import (
    card_count,
    card_info,
    hero_count,
    heroinfo,
)
from ..views.discord_servers import discord_servers, discord_server_count
from ..views.decks.decklists import (
    decklist_count,
    decklists,
    legacy_decklist_count,
    legacy_decklists,
)
from ..views.decks.download_deck import (
    download_deck_image,
    download_legacy_deck_image,
)
from ..views.cards.keep_or_scrap import (
    keep_or_scrap,
    keep_or_scrap_count,
)
from ..views.site_updates import site_updates
from ..views.decks.user_decks import (
     public_user_decks,
     public_user_decks_count
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
        "decks/<int:deckid>/download/",
        download_deck_image,
        name="download-deck-image",
    ),
    path(
        "legacy-decks/<int:deckid>/download/",
        download_legacy_deck_image,
        name="download-legacy-deck-image",
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
        "site-updates/",
        site_updates,
        name="site-updates",
    ),
    path(
    "public-decks/",
    public_user_decks,
    name="public_decks",
),
    path(
    "servers/",
    discord_servers,
    name="servers",
),
 path("servers/count/", discord_server_count, name="discord-server-count"),   
    path(
    "public-user-decks-count/",
    public_user_decks_count,
    name="public-user-decks-count",
),
]