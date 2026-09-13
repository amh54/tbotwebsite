import logging

from rest_framework import serializers

from ..models import UserProfile, UserSuggestion

logger = logging.getLogger(__name__)


class UserSuggestionSerializer(serializers.ModelSerializer):
    discord_username = serializers.SerializerMethodField()

    class Meta:
        model = UserSuggestion
        fields = [
            "id",
            "discord_id",
            "discord_username",
            "title",
            "description",
            "category",
            "status",
            "admin_response",
            "admin_notes",
            "page_url",
            "browser",
            "operating_system",
            "discord_thread_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "discord_username",
            "status",
            "admin_response",
            "created_at",
            "updated_at",
        ]

    def get_discord_username(self, obj):
        discord_id = str(obj.discord_id or "").strip()

        if discord_id:
            try:
                profile = UserProfile.objects.filter(
                    discord_id=discord_id
                ).first()

                if profile:
                    return (
                        profile.display_name
                        or profile.username
                        or obj.discord_username
                        or "Unknown User"
                    )
            except Exception:
                logger.exception(
                    "Failed to resolve UserSuggestion user %s",
                    discord_id,
                )

        return obj.discord_username or "Unknown User"


class AdminUserSuggestionSerializer(serializers.ModelSerializer):
    discord_username = serializers.SerializerMethodField()

    class Meta:
        model = UserSuggestion
        fields = [
            "id",
            "discord_id",
            "discord_username",
            "title",
            "description",
            "category",
            "status",
            "admin_response",
            "admin_notes",
            "page_url",
            "browser",
            "operating_system",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "discord_id",
            "discord_username",
            "created_at",
            "updated_at",
        ]

    def get_discord_username(self, obj):
        discord_id = str(obj.discord_id or "").strip()

        if discord_id:
            try:
                profile = UserProfile.objects.filter(
                    discord_id=discord_id
                ).first()

                if profile:
                    return (
                        profile.display_name
                        or profile.username
                        or obj.discord_username
                        or "Unknown User"
                    )
            except Exception:
                logger.exception(
                    "Failed to resolve UserSuggestion user %s",
                    discord_id,
                )

        return obj.discord_username or "Unknown User"

    def validate_category(self, value):
        valid_categories = {
            "improvement",
            "feature",
            "ui",
            "performance",
            "other",
        }

        if value not in valid_categories:
            raise serializers.ValidationError(
                "Invalid suggestion category."
            )

        return value

    def validate_status(self, value):
        valid_statuses = {
            "pending",
            "reviewing",
            "planned",
            "completed",
            "declined",
        }

        if value not in valid_statuses:
            raise serializers.ValidationError(
                "Invalid suggestion status."
            )

        return value