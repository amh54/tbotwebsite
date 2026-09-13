from rest_framework import serializers

from ..models import (
    Decklist,
    LegacyDecklist,
    UserProfile,
    WebDeckbuilder,
)

from .profile import UserProfileSerializer


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
            "side",
            "hero",
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
            return UserProfile.objects.filter(
                discord_id=str(obj.user_id)
            ).first()
        except Exception:
            return None

    def get_profile(self, obj):
        profile = self._get_profile(obj)

        if not profile:
            return None

        return UserProfileSerializer(profile).data

    def get_display_name(self, obj):
        profile = self._get_profile(obj)

        if not profile:
            return obj.deckbuilder_name

        return (
            profile.display_name
            or profile.username
            or obj.deckbuilder_name
        )

    def get_username(self, obj):
        profile = self._get_profile(obj)
        return profile.username if profile else ""

    def get_profile_slug(self, obj):
        profile = self._get_profile(obj)
        return profile.profile_slug if profile else ""

    def get_avatar(self, obj):
        profile = self._get_profile(obj)
        return profile.avatar if profile else ""

    def get_bio(self, obj):
        profile = self._get_profile(obj)
        return profile.bio if profile else ""

    def get_discord_id(self, obj):
        profile = self._get_profile(obj)

        if profile:
            return profile.discord_id

        return str(obj.user_id)