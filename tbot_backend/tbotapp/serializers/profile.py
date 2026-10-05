from rest_framework import serializers

from ..models import UserProfile


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
            "youtube_url",
            "twitch_url",
            "tiktok_url",
            "instagram_url",
            "twitter_url",
            "discord_server_url",
            "created_at",
            "updated_at",
        ]