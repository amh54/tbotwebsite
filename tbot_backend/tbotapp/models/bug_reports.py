from django.db import models


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
    discord_id = models.BigIntegerField(null=True)
    discord_username = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    description = models.TextField()
    page_url = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
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
    browser = models.CharField(max_length=255)
    operating_system = models.CharField(max_length=255)
    screenshot = models.TextField(null=True)
    admin_notes = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = "bug_reports"

    def __str__(self):
        return f"#{self.id} - {self.title}"