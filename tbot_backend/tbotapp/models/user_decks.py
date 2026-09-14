from django.db import models
from django.db.models.functions import Now


class UserDeck(models.Model):
    id = models.BigAutoField(primary_key=True)
    profile_id = models.BigIntegerField()
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
    created_at = models.DateTimeField(db_default=Now())
    modified_at = models.DateTimeField(db_default=Now())

    class Meta:
        managed = False
        db_table = "user_decks"


class UserDeckSuggestion(models.Model):
    id = models.BigAutoField(primary_key=True)
    deck_id = models.BigIntegerField()
    deck_name = models.CharField(max_length=255)
    hero = models.CharField(max_length=100)
    side = models.CharField(max_length=50)
    category = models.CharField(max_length=100)
    archetype = models.CharField(max_length=100)
    creator = models.CharField(max_length=255)
    description = models.TextField()
    image = models.TextField()
    cost = models.IntegerField()
    aliases = models.TextField()
    cards = models.TextField()
    inspiration = models.TextField()
    optimization = models.TextField()
    suggested_date = models.DateTimeField()
    updated_date = models.DateTimeField()
    deck_doc = models.TextField()
    suggested_by_discord_id = models.BigIntegerField()
    suggested_by_profile_id = models.BigIntegerField(null=True)
    suggested_by_username = models.CharField(max_length=255)
    suggested_by_display_name = models.CharField(max_length=255)
    suggested_by_profile_slug = models.CharField(max_length=255)
    suggested_by_avatar = models.TextField(null=True)
    status = models.CharField(max_length=50, default="pending")
    consent_type = models.CharField(max_length=50, default="self_created")
    consent_status = models.CharField(max_length=50, default="confirmed")
    consent_creator_discord_id = models.BigIntegerField(null=True)
    consent_given_at = models.DateTimeField(null=True)
    consent_denied_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(db_default=Now())
    updated_at = models.DateTimeField(db_default=Now())
    discord_message_id = models.BigIntegerField(null=True)
    discord_update_pending = models.BooleanField(default=False)
    discord_thread_id = models.BigIntegerField(null=True)

    class Meta:
        managed = False
        db_table = "user_deck_suggestions"