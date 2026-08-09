from rest_framework import serializers
from .models import ZombieCards

class ZombieCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = ZombieCards
        fields = [
            "cardid",
            "card_type",
            "card_name",
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