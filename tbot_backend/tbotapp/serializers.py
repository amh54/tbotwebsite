from rest_framework import serializers

from .models import Decklist, WebCards, KeepOrScrap, UserDeck, LegacyDecklist


# ============================================================
# PUBLIC DECKLIST SERIALIZER
# ============================================================

class PublicDeckSerializer(serializers.ModelSerializer):
    """
    Serializer used by the public decklist page.

    The cards field is intentionally excluded.
    """

    class Meta:
        model = Decklist

        fields = [
            "deckid",
            "name",
            "hero",
            "side",
            "category",
            "archetype",
            "description",
            "image",
            "creator",
            "cost",
            "aliases",
            "inspiration",
            "optimization",
            "suggested_date",
            "updated_date",
            "deck_doc",
        ]
# ============================================================
# PUBLIC LEGACY DECK SERIALIZER
# ============================================================

class PublicLegacyDeckSerializer(serializers.ModelSerializer):
    """
    Serializer used by the public legacy decklist page.

    The cards field is intentionally excluded.
    """

    class Meta:
        model = LegacyDecklist

        fields = [
            "deckid",
            "name",
            "hero",
            "side",
            "category",
            "archetype",
            "description",
            "image",
            "creator",
            "cost",
            "aliases",
            "inspiration",
            "optimization",
            "suggested_date",
            "updated_date",
            "deck_doc",
        ]
# ============================================================
# ADMIN DECKLIST SERIALIZER
# ============================================================

class AdminDeckSerializer(serializers.ModelSerializer):
    """
    Serializer used only by owner/admin endpoints.

    The cards field is intentionally included here.
    """

    class Meta:
        model = Decklist

        fields = [
            "deckid",
            "name",
            "hero",
            "side",
            "category",
            "archetype",
            "description",
            "image",
            "creator",
            "cost",
            "aliases",
            "cards",
            "inspiration",
            "optimization",
            "suggested_date",
            "updated_date",
            "deck_doc",
        ]
class AdminLegacyDeckSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegacyDecklist
        fields = [
            "deckid",
            "side",
            "hero",
            "name",
            "category",
            "archetype",
            "description",
            "deck_doc",
            "image",
            "creator",
            "optimization",
            "inspiration",
            "cost",
            "aliases",
            "cards",
            "suggested_date",
            "updated_date",
        ]
class UserDeckSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDeck

        fields = [
            "id",
            "profile_id",
            "name",
            "hero",
            "side",
            "category",
            "archetype",
            "description",
            "image",
            "cost",
            "aliases",
            "cards",
            "inspiration",
            "optimization",
            "suggested_date",
            "updated_date",
            "deck_doc",
            "created_at",
            "modified_at",
        ]

        read_only_fields = [
            "id",
            "profile_id",
            "created_at",
            "modified_at",
        ]

# ============================================================
# WEB CARDS
# ============================================================

class WebCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebCards

        fields = [
            "cardid",
            "card_type",
            "card_name",
            "side",
            "title",
            "stats",
            "description",
            "ability",
            "thumbnail",
            "traits",
            "set_rarity",
            "flavor_text",
            "aliases",
            "button",
            "button_emoji",
            "button2",
            "button_emoji2",
        ]


# ============================================================
# KEEP OR SCRAP
# ============================================================

class KeepOrScrapSerializer(serializers.ModelSerializer):
    class Meta:
        model = KeepOrScrap

        fields = [
            "tierid",
            "side",
            "card_class",
            "image",
            "reasoning",
            "creator",
        ]