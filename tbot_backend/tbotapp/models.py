from django.db import models

class Decklist(models.Model):
    deckid = models.IntegerField(primary_key=True)
    side = models.CharField(max_length=30)
    hero = models.CharField(max_length=100)
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=30, db_column="category")
    archetype = models.CharField(max_length=30)
    description = models.CharField(max_length=1500)
    deck_doc = models.CharField(max_length=300, blank=True)
    image = models.CharField(max_length=300)
    creator = models.CharField(max_length=300, blank=True)
    optimization = models.CharField(max_length=60, blank=True)
    inspiration = models.CharField(max_length=60, blank=True)
    cost = models.CharField(max_length=10, blank=True)
    aliases = models.CharField(max_length=300, blank=True)
    cards = models.CharField(max_length=400, blank=True)
    suggested_date = models.CharField(max_length=20, blank=True)
    updated_date = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = "web_decks"
        managed = False
class ZombieCards(models.Model):
    cardid = models.SmallIntegerField(primary_key=True)
    card_type = models.CharField(max_length=50)
    card_name = models.CharField(max_length=200)
    title = models.CharField(max_length=100)
    cost = models.CharField(max_length=50, blank=True)
    strength = models.CharField(max_length=50, blank=True)
    health = models.CharField(max_length=50, blank=True)
    description = models.CharField(max_length=100)
    ability = models.CharField(max_length=300)
    thumbnail = models.CharField(max_length=330)
    traits = models.CharField(max_length=150)
    set_rarity = models.CharField(max_length=50)
    flavor_text = models.CharField(max_length=300)
    aliases = models.CharField(max_length=160)
    button = models.CharField(max_length=130)
    button_emoji = models.CharField(max_length=130)
    button2 = models.CharField(max_length=130)
    button_emoji2 = models.CharField(max_length=130)

    class Meta:
        db_table = 'zombiecards'
        managed = False
  