import logging
from rest_framework import serializers

from .models import (
    Decklist,
    WebCards,
    KeepOrScrap,
    UserCard,
    UserDeck,
    LegacyDecklist,
    UserProfile,
    WebDeckbuilder,
    BugReport,
)

logger = logging.getLogger(__name__)
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


class PublicLegacyDeckSerializer(serializers.ModelSerializer):
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


class AdminDeckSerializer(serializers.ModelSerializer):
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
    username = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    profile_slug = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = UserDeck
        fields = [
            "id",
            "profile_id",

            # User information
            "username",
            "display_name",
            "profile_slug",
            "avatar",

            # Deck information
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
            "creator",
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
            "username",
            "display_name",
            "profile_slug",
            "avatar",
            "created_at",
            "modified_at",
        ]

    def _get_profile(self, obj):
        try:
            return (
                UserProfile.objects
                .filter(id=obj.profile_id)
                .first()
            )
        except Exception:
            return None

    def get_username(self, obj):
        profile = self._get_profile(obj)

        if not profile:
            return ""

        return profile.username or ""

    def get_display_name(self, obj):
        profile = self._get_profile(obj)

        if not profile:
            return ""

        return profile.display_name or ""

    def get_profile_slug(self, obj):
        profile = self._get_profile(obj)

        if not profile:
            return ""

        return profile.profile_slug or ""

    def get_avatar(self, obj):
        profile = self._get_profile(obj)

        if not profile:
            return ""

        return profile.avatar or ""

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
                        "cards": (
                            f"Invalid ratio for {card_name}."
                        )
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
                        "cards": (
                            f"Invalid ratio for {card_name}."
                        )
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
                        f"{card_name} must have a ratio "
                        "between 1 and 4."
                    )
                })

            total += ratio

        if total != 40:
            raise serializers.ValidationError({
                "cards": (
                    "Card ratios must add up to 40. "
                    f"Currently they add up to {total}."
                )
            })

        return attrs


class UserCardSerializer(serializers.ModelSerializer):
    card = serializers.SerializerMethodField()

    class Meta:
        model = UserCard
        fields = [
            "id",
            "profile_id",
            "card_name",
            "amount",
            "card",
        ]

    def get_card(self, obj):
        try:
            card = (
                WebCards.objects
                .filter(card_name=obj.card_name)
                .first()
            )

            if not card:
                return None

            return WebCardSerializer(card).data

        except Exception:
            return None


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "id",
            "discord_id",
            "username",
            "display_name",
            "profile_slug",
            "avatar",
            "bio",
            "is_public",
            "created_at",
            "updated_at",
        ]


class WebDeckbuilderSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebDeckbuilder
        fields = [
            "id",
            "deckbuilder_name",
            "color",
            "user_id",
            "aliases",
            "numb_of_decks",
        ]


class PublicDeckbuilderSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    profile_slug = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    discord_id = serializers.SerializerMethodField()

    class Meta:
        model = WebDeckbuilder
        fields = [
            "user_id",
            "deckbuilder_name",
            "numb_of_decks",
            "profile",
            "display_name",
            "username",
            "profile_slug",
            "avatar",
            "bio",
            "discord_id",
        ]

    def _get_profile(self, obj):
        try:
            return (
                UserProfile.objects
                .filter(
                    discord_id=str(obj.user_id)
                )
                .first()
            )
        except Exception:
            return None

    def get_profile(self, obj):
        profile = self._get_profile(obj)

        if not profile:
            return None

        return UserProfileSerializer(profile).data

    def get_display_name(self, obj):
        profile = self._get_profile(obj)

        if profile:
            return (
                profile.display_name
                or profile.username
                or obj.deckbuilder_name
            )

        return obj.deckbuilder_name

    def get_username(self, obj):
        profile = self._get_profile(obj)

        if not profile:
            return ""

        return profile.username or ""

    def get_profile_slug(self, obj):
        profile = self._get_profile(obj)

        if not profile:
            return ""

        return profile.profile_slug or ""

    def get_avatar(self, obj):
        profile = self._get_profile(obj)

        if not profile:
            return ""

        return profile.avatar or ""

    def get_bio(self, obj):
        profile = self._get_profile(obj)

        if not profile:
            return ""

        return profile.bio or ""

    def get_discord_id(self, obj):
        profile = self._get_profile(obj)

        if profile:
            return profile.discord_id

        return str(obj.user_id)


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


class BugReportSerializer(serializers.ModelSerializer):

    screenshot = serializers.ImageField(
        required=False,
        allow_null=True,
    )

    class Meta:
        model = BugReport

        fields = [
            "id",
            "discord_id",
            "discord_username",
            "title",
            "description",
            "page_url",
            "category",
            "priority",
            "status",
            "browser",
            "operating_system",
            "screenshot",
            "admin_notes",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "discord_id",
            "discord_username",
            "status",
            "admin_notes",
            "created_at",
            "updated_at",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)

        screenshot = getattr(
            instance,
            "screenshot",
            None,
        )

        if not screenshot:
            data["screenshot"] = ""
            return data

        try:
            data["screenshot"] = str(
                screenshot.url
            )
        except Exception:
            logger.exception(
                "Unable to resolve screenshot URL for bug report %s",
                getattr(instance, "id", "unknown"),
            )

            data["screenshot"] = ""

        return data

    def validate_status(self, value):
        valid_statuses = {
            "open",
            "in_progress",
            "resolved",
            "closed",
        }

        if value not in valid_statuses:
            raise serializers.ValidationError(
                "Status must be one of: open, in_progress, resolved, or closed."
            )

        return value