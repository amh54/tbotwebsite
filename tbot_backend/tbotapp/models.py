from django.db import models
from django.db.models.functions import Now
from cloudinary.models import CloudinaryField

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
class WebDeckbuilder(models.Model):
    id = models.IntegerField(primary_key=True)

    deckbuilder_name = models.CharField(
        max_length=255,
    )

    color = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    user_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        db_column="userid",
    )

    aliases = models.CharField(
        max_length=1000,
        blank=True,
        null=True,
    )

    numb_of_decks = models.IntegerField(
        default=0,
    )

    class Meta:
        db_table = "web_deckbuilders"
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

    name = models.CharField(
        max_length=255,
    )

    hero = models.CharField(
        max_length=255,
    )

    side = models.CharField(
        max_length=255,
    )

    category = models.CharField(
        max_length=255,
    )

    archetype = models.CharField(
        max_length=255,
    )
    creator = models.CharField(
    max_length=255,
    blank=True,
    default="",
    )
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
class UserDeckSuggestion(models.Model):
    id = models.BigAutoField(primary_key=True)

    deck_id = models.BigIntegerField()
    deck_name = models.CharField(max_length=255)

    hero = models.CharField(max_length=255)
    side = models.CharField(max_length=255)
    category = models.CharField(max_length=255)
    archetype = models.CharField(max_length=255)

    creator = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

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

    suggested_by_discord_id = models.CharField(
        max_length=30,
    )

    suggested_by_profile_id = models.BigIntegerField(
        null=True,
        blank=True,
    )

    suggested_by_username = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    suggested_by_display_name = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    suggested_by_profile_slug = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    suggested_by_avatar = models.CharField(
        max_length=500,
        blank=True,
        null=True,
    )

    status = models.CharField(
        max_length=20,
        default="pending",
    )

    consent_type = models.CharField(
        max_length=30,
        default="self_created",
    )

    consent_status = models.CharField(
        max_length=30,
        default="confirmed",
    )

    consent_creator_discord_id = models.CharField(
        max_length=30,
        blank=True,
        null=True,
    )

    consent_given_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    consent_denied_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        db_default=Now(),
    )

    updated_at = models.DateTimeField(
        db_default=Now(),
    )
    discord_message_id = models.CharField(
    max_length=30,
    blank=True,
    null=True,
    )
    discord_update_pending = models.BooleanField(
    default=False,
)
    discord_thread_id = models.CharField(
        max_length=30,
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "user_deck_suggestions"
        managed = False
class UserCard(models.Model):
    id = models.BigAutoField(primary_key=True)

    profile_id = models.BigIntegerField()

    card_name = models.CharField(
        max_length=200,
    )

    quantity = models.IntegerField(
        default=1,
    )

    created_at = models.DateTimeField(
        db_default=Now(),
    )

    updated_at = models.DateTimeField(
        db_default=Now(),
    )

    class Meta:
        db_table = "user_cards"
        managed = False

        constraints = [
            models.UniqueConstraint(
                fields=["profile_id", "card_name"],
                name="user_cards_unique_profile_card",
            ),
        ]
class BugReport(models.Model):
    STATUS_CHOICES = [
        ("open", "Open"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
        ("closed", "Closed"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("normal", "Normal"),
        ("high", "High"),
    ]

    CATEGORY_CHOICES = [
        ("ui", "UI"),
        ("decklists", "Decklists"),
        ("cards", "Cards"),
        ("account", "Account"),
        ("discord", "Discord"),
        ("other", "Other"),
    ]

    id = models.BigAutoField(primary_key=True)

    discord_id = models.BigIntegerField(
        null=True,
        blank=True,
    )

    discord_username = models.CharField(
        max_length=255,
        blank=True,
    )

    title = models.CharField(
        max_length=255,
    )

    description = models.TextField()

    page_url = models.TextField(
        blank=True,
    )

    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
        default="other",
    )

    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default="normal",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="open",
    )

    browser = models.TextField(
        blank=True,
    )

    operating_system = models.CharField(
        max_length=255,
        blank=True,
    )

    screenshot = CloudinaryField(
        "screenshot",
        null=True,
        blank=True,
    )

    admin_notes = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"#{self.id} - {self.title}"

    class Meta:
        db_table = "bug_reports"
        managed = False
class SiteUpdate(models.Model):
    CATEGORY_CHOICES = [
        ("new", "New"),
        ("improvement", "Improvement"),
        ("fix", "Bug Fix"),
        ("data", "Data"),
        ("announcement", "Announcement"),
    ]

    id = models.BigAutoField(primary_key=True)

    title = models.CharField(max_length=255)

    content = models.TextField()

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="improvement",
    )

    page_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
    )

    published = models.BooleanField(default=True)

    published_at = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "site_updates"
        ordering = ["-published_at", "-created_at"]

    def __str__(self):
        return self.title