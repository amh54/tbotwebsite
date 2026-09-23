from rest_framework import serializers

from ..models.saved_decks import SavedDeck


class SavedDeckSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedDeck
        fields = [
            "id",
            "profile_id",
            "source_deck_id",
            "source_type",
            "name",
            "hero",
            "side",
            "category",
            "archetype",
            "creator",
            "description",
            "image",
            "cost",
            "aliases",
            "cards",
            "inspiration",
            "optimization",
            "suggested_date",
            "updated_date",
            "deck_doc",
        ]