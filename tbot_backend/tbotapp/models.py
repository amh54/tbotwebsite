from django.db import models
from django.db.models.functions import Now
class Decklist(models.Model):
    deckid = models.IntegerField(primary_key=True)
    side = models.CharField(max_length=30)
    hero = models.CharField(max_length=100)
    name = models.CharField(max_length=100)
    category = models.CharField(
        max_length=30,
        db_column="category",
    )
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


class WebCards(models.Model):
    cardid = models.SmallIntegerField(primary_key=True)
    card_type = models.CharField(max_length=50)
    card_name = models.CharField(max_length=200, blank=True)
    side = models.CharField(
        max_length=20,
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=100, blank=True)
    stats = models.CharField(max_length=300, blank=True)
    description = models.CharField(max_length=100, blank=True)
    ability = models.CharField(max_length=300, blank=True)
    thumbnail = models.CharField(max_length=330, blank=True)
    traits = models.CharField(max_length=150, blank=True)
    set_rarity = models.CharField(max_length=50, blank=True)
    flavor_text = models.CharField(max_length=300, blank=True)
    aliases = models.CharField(max_length=160, blank=True)
    button = models.CharField(max_length=130, blank=True)
    button_emoji = models.CharField(max_length=130, blank=True)
    button2 = models.CharField(max_length=130, blank=True)
    button_emoji2 = models.CharField(max_length=130, blank=True)

    class Meta:
        db_table = "web_cards"
        managed = False
class LegacyDecklist(models.Model):
    deckid = models.IntegerField(primary_key=True)
    side = models.CharField(max_length=30)
    hero = models.CharField(max_length=100)
    name = models.CharField(max_length=100)
    category = models.CharField(
        max_length=30,
        db_column="category",
    )
    archetype = models.CharField(max_length=30)
    description = models.CharField(max_length=1500)
    deck_doc = models.CharField(max_length=300, blank=True)
    image = models.CharField(max_length=300)
    creator = models.CharField(max_length=300, blank=True)
    optimization = models.CharField(max_length=60, blank=True)
    inspiration = models.CharField(max_length=60, blank=True)
    cost = models.CharField(max_length=10, blank=True)
    aliases = models.CharField(max_length=300, blank=True)
    cards = models.CharField(max_length=1000, blank=True)
    suggested_date = models.CharField(max_length=20, blank=True)
    updated_date = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = "web_legacy_decks"
        managed = False

class KeepOrScrap(models.Model):
    tierid = models.IntegerField(primary_key=True)
    side = models.CharField(max_length=40)
    card_class = models.CharField(
        max_length=30,
        db_column="class",
    )
    image = models.CharField(max_length=400, blank=True)
    reasoning = models.CharField(max_length=1500, blank=True)
    creator = models.CharField(max_length=1000, blank=True)

    class Meta:
        db_table = "web_keep_or_scrap"
        managed = False
        
class UserProfile(models.Model):
    id = models.BigAutoField(primary_key=True)

    discord_id = models.CharField(
        max_length=30,
        unique=True,
    )

    username = models.CharField(
        max_length=100,
    )

    display_name = models.CharField(
        max_length=100,
    )

    profile_slug = models.CharField(
        max_length=100,
        unique=True,
    )

    avatar = models.CharField(
        max_length=500,
        blank=True,
        null=True,
    )

    bio = models.TextField(
        blank=True,
        null=True,
    )

    is_public = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField()

    updated_at = models.DateTimeField()

    class Meta:
        db_table = "user_profiles"
        managed = False


class UserDeck(models.Model):
    id = models.BigAutoField(primary_key=True)

    profile_id = models.BigIntegerField()

    name = models.CharField(max_length=255)
    hero = models.CharField(max_length=255)
    side = models.CharField(max_length=255)
    category = models.CharField(max_length=255)
    archetype = models.CharField(max_length=255)

    description = models.TextField(
    blank=True,
    default="",
)

    image = models.CharField(
        max_length=500,
        blank=True,
        null=True,
    )

    cost = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    aliases = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    cards = models.TextField(
    blank=True,
    null=True,
)

    inspiration = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    optimization = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    suggested_date = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    updated_date = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    deck_doc = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
    db_default=Now(),
)

    modified_at = models.DateTimeField(
    db_default=Now(),
)

    class Meta:
        db_table = "user_decks"
        managed = False