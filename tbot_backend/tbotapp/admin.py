from django.contrib import admin

from .models import (
    Decklist,
    WebCards,
    KeepOrScrap,
)


@admin.register(Decklist)
class DecklistAdmin(admin.ModelAdmin):
    list_display = (
        "deckid",
        "side",
        "hero",
        "name",
        "category",
        "archetype",
        "creator",
    )

    search_fields = (
        "name",
        "hero",
        "creator",
        "category",
        "archetype",
    )

    list_filter = (
        "side",
        "hero",
        "category",
        "archetype",
    )


@admin.register(WebCards)
class WebCardsAdmin(admin.ModelAdmin):
    list_display = (
        "cardid",
        "card_name",
        "card_type",
        "side",
        "set_rarity",
    )

    search_fields = (
        "card_name",
        "aliases",
        "traits",
        "description",
    )

    list_filter = (
        "side",
        "card_type",
        "set_rarity",
    )


@admin.register(KeepOrScrap)
class KeepOrScrapAdmin(admin.ModelAdmin):
    list_display = (
        "tierid",
        "side",
        "card_class",
        "creator",
    )

    search_fields = (
        "card_class",
        "reasoning",
        "creator",
    )

    list_filter = (
        "side",
        "card_class",
    )