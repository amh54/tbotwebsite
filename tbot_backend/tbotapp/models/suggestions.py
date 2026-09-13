from django.db import models
from django.db.models.functions import Now


class UserSuggestion(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("reviewing", "Reviewing"),
        ("planned", "Planned"),
        ("completed", "Completed"),
        ("declined", "Declined"),
    ]

    CATEGORY_CHOICES = [
        ("improvement", "Improvement"),
        ("feature", "Feature"),
        ("ui", "UI"),
        ("performance", "Performance"),
        ("other", "Other"),
    ]

    discord_thread_id = models.BigIntegerField(null=True)
    discord_message_id = models.BigIntegerField(null=True)
    discord_thread_url = models.TextField(blank=True, default="")
    id = models.BigAutoField(primary_key=True)
    discord_id = models.BigIntegerField()
    discord_username = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )
    admin_response = models.TextField()
    admin_notes = models.TextField()
    page_url = models.TextField()
    browser = models.CharField(max_length=255)
    operating_system = models.CharField(max_length=255)
    created_at = models.DateTimeField(db_default=Now())
    updated_at = models.DateTimeField(db_default=Now())

    class Meta:
        managed = False
        db_table = "user_suggestions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"#{self.id} - {self.title}"