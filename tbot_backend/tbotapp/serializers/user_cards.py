from rest_framework import serializers

from ..models import UserCard, WebCards
from .cards import WebCardSerializer


class UserCardSerializer(serializers.ModelSerializer):
    amount = serializers.IntegerField(source="quantity", min_value=1,
    max_value=4)
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
            card = WebCards.objects.filter(
                card_name=obj.card_name
            ).first()

            if not card:
                return None

            return WebCardSerializer(card).data
        except Exception:
            return None