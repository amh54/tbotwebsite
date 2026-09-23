from django.db import models


class SavedDeck(models.Model):
    id = models.BigAutoField(primary_key=True)
    profile_id = models.BigIntegerField()

    source_deck_id = models.BigIntegerField()

    source_type = models.CharField(
        max_length=50,
        default="decklist",
    )

    name = models.CharField(max_length=255)
    hero = models.CharField(max_length=100)
    side = models.CharField(max_length=50)
    category = models.CharField(max_length=100)
    archetype = models.CharField(max_length=100)
    creator = models.CharField(max_length=255)

    description = models.TextField()
    image = models.TextField(null=True)
    cost = models.CharField(max_length=255)
    aliases = models.TextField(null=True)
    cards = models.TextField(null=True)
    inspiration = models.TextField(null=True)
    optimization = models.TextField(null=True)

    suggested_date = models.DateTimeField(null=True)
    updated_date = models.DateTimeField(null=True)
    deck_doc = models.TextField(null=True)

    class Meta:
        managed = False
        db_table = "saved_decks"
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "profile_id",
                    "source_type",
                    "source_deck_id",
                ],
                name="saved_decks_profile_source_unique",
            )
        ]

    def __str__(self):
        return f"{self.name} - profile {self.profile_id}"