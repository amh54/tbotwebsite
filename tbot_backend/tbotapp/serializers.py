from rest_framework import serializers
from .models import Decklist, WebCards, KeepOrScrap


class DeckSerializer(serializers.ModelSerializer):
    class Meta:
        model = Decklist
        fields = "__all__"


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