from rest_framework import serializers

from ..models import UserDeck, UserProfile


class UserDeckSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    profile_slug = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    inspiration = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    optimization = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    deck_doc = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    class Meta:
        model = UserDeck
        fields = [
            "id",
            "profile_id",
            "username",
            "display_name",
            "profile_slug",
            "avatar",
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
        if not hasattr(obj, "_serializer_profile"):
            try:
                obj._serializer_profile = (
                    UserProfile.objects
                    .filter(id=obj.profile_id)
                    .first()
                )
            except Exception:
                obj._serializer_profile = None

        return obj._serializer_profile

    def get_username(self, obj):
        profile = self._get_profile(obj)
        return (profile.username or "") if profile else ""

    def get_display_name(self, obj):
        profile = self._get_profile(obj)
        return (profile.display_name or "") if profile else ""

    def get_profile_slug(self, obj):
        profile = self._get_profile(obj)
        return (profile.profile_slug or "") if profile else ""

    def get_avatar(self, obj):
        profile = self._get_profile(obj)
        return (profile.avatar or "") if profile else ""

    def _parse_card_line(self, line):
        if isinstance(line, str):
            parts = line.split("|", 1)

            if len(parts) != 2:
                raise serializers.ValidationError({
                    "cards": f"Invalid card ratio: {line}"
                })

            card_name = parts[0].strip()
            ratio_value = parts[1].strip()

        elif isinstance(line, dict):
            card_name = str(
                line.get("name") or line.get("card_name") or ""
            ).strip()
            ratio_value = line.get("count", 0)

        else:
            raise serializers.ValidationError({
                "cards": "Invalid card ratio format."
            })

        if not card_name:
            raise serializers.ValidationError({
                "cards": "Every card must have a name."
            })

        try:
            ratio = int(ratio_value)
        except (TypeError, ValueError):
            raise serializers.ValidationError({
                "cards": f"Invalid ratio for {card_name}."
            })

        if not 1 <= ratio <= 4:
            raise serializers.ValidationError({
                "cards": (
                    f"{card_name} must have a ratio "
                    "between 1 and 4."
                )
            })

        return ratio

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

        total = sum(
            self._parse_card_line(line)
            for line in lines
            if line
        )

        if total != 40:
            raise serializers.ValidationError({
                "cards": (
                    "Card ratios must add up to 40. "
                    f"Currently they add up to {total}."
                )
            })

        return attrs