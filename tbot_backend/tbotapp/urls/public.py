from django.urls import path

from ..views.cards import (
    card_count,
    card_info,
    hero_count,
    heroinfo,
)
from ..views.decklists import (
    decklist_count,
    decklists,
    legacy_decklist_count,
    legacy_decklists,
)
from ..views.download_deck import download_deck_image
from ..views.keep_or_scrap import (
    keep_or_scrap,
    keep_or_scrap_count,
)
from ..views.site_updates import site_updates


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
]