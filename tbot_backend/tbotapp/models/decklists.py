from django.db import models


class Decklist(models.Model):
    deckid = models.IntegerField(primary_key=True)
    side = models.CharField(max_length=50)
    hero = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    archetype = models.CharField(max_length=100)
    description = models.TextField()
    deck_doc = models.TextField()
    image = models.TextField()
    creator = models.CharField(max_length=255)
    optimization = models.TextField()
    inspiration = models.TextField()
    cost = models.CharField(max_length=50, blank=True, null=True)
    aliases = models.TextField()
    cards = models.TextField()
    suggested_date = models.TextField()
    updated_date = models.TextField()

    class Meta:
        managed = False
        db_table = "web_decks"


class LegacyDecklist(models.Model):
    deckid = models.IntegerField(primary_key=True)
    side = models.CharField(max_length=50)
    hero = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    archetype = models.CharField(max_length=100)
    description = models.TextField()
    deck_doc = models.TextField()
    image = models.TextField()
    creator = models.CharField(max_length=255)
    optimization = models.TextField()
    inspiration = models.TextField()
    cost = models.CharField(max_length=50, blank=True, null=True)
    aliases = models.TextField()
    cards = models.CharField(max_length=1000)
    suggested_date = models.TextField()
    updated_date = models.TextField()

    class Meta:
        managed = False
        db_table = "web_legacy_decks"


class WebDeckbuilder(models.Model):
    id = models.IntegerField(primary_key=True)
    deckbuilder_name = models.CharField(max_length=255)
    color = models.CharField(max_length=50, null=True)
    user_id = models.CharField(
    max_length=32,
    db_column="userid",
    blank=True,
    null=True,
)
    aliases = models.TextField()
    numb_of_decks = models.IntegerField()

    class Meta:
        managed = False
        db_table = "web_deckbuilders"