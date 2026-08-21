from rest_framework import serializers

from .models import Decklist, WebCards, KeepOrScrap, UserDeck, LegacyDecklist, UserProfile


class PublicDeckSerializer(serializers.ModelSerializer):
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
            "cards",
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

    def validate(self, attrs):
        cards = attrs.get("cards")

        if cards is None:
            return attrs

        if isinstance(cards, str):
            lines = cards.splitlines()
        elif isinstance(cards, list):
            lines = cards
        else:
            raise serializers.ValidationError({
                "cards": "Cards must be a valid card ratio list."
            })

        total = 0

        for line in lines:
            if not line:
                continue

            if isinstance(line, str):
                parts = line.split("|", 1)

                if len(parts) != 2:
                    raise serializers.ValidationError({
                        "cards": f"Invalid card ratio: {line}"
                    })

                card_name = parts[0].strip()

                try:
                    ratio = int(parts[1].strip())
                except (TypeError, ValueError):
                    raise serializers.ValidationError({
                        "cards": f"Invalid ratio for {card_name}."
                    })

            elif isinstance(line, dict):
                card_name = str(
                    line.get("name")
                    or line.get("card_name")
                    or ""
                ).strip()

                try:
                    ratio = int(line.get("count", 0))
                except (TypeError, ValueError):
                    raise serializers.ValidationError({
                        "cards": f"Invalid ratio for {card_name}."
                    })

            else:
                raise serializers.ValidationError({
                    "cards": "Invalid card ratio format."
                })

            if not card_name:
                raise serializers.ValidationError({
                    "cards": "Every card must have a name."
                })

            if ratio < 1 or ratio > 4:
                raise serializers.ValidationError({
                    "cards": (
                        f"{card_name} must have a ratio between "
                        "1 and 4."
                    )
                })

            total += ratio

        if total != 40:
            raise serializers.ValidationError({
                "cards": (
                    f"Card ratios must add up to 40. "
                    f"Currently they add up to {total}."
                )
            })

        return attrs
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "id",
            "discord_id",
            "profile_slug",
            "display_name",
            "bio",
            "avatar",
            "is_public",
            "created_at",
            "updated_at",
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