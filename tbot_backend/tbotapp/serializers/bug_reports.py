import logging

from rest_framework import serializers

from ..models import BugReport, UserProfile

logger = logging.getLogger(__name__)


class BugReportSerializer(serializers.ModelSerializer):
    screenshot = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    discord_username = serializers.SerializerMethodField()

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
            "screenshot",
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
        stored_username = (obj.discord_username or "").strip()
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
                        or stored_username
                        or "Unknown User"
                    )
            except Exception:
                logger.exception(
                    "Failed to resolve BugReport user %s",
                    discord_id,
                )

        return stored_username or "Unknown User"

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if not instance.screenshot:
            data["screenshot"] = ""
        else:
            data["screenshot"] = str(instance.screenshot)

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
                "Invalid bug report status."
            )

        return value