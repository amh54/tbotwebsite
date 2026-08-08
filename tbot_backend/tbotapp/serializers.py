from rest_framework import serializers
from .models import Decklist, ZombieCards


class DeckSerializer(serializers.ModelSerializer):

    class Meta:
        model = Decklist
        fields = "__all__"
class ZombieCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = ZombieCards
        fields = [
            "cardid",
            "card_type",
            "card_name",
            "title",
            "cost",
            "strength",
            "health",
            "description",
            "ability",
            "thumbnail",
            "traits",
            "set_rarity",
            "flavor_text",
        ]