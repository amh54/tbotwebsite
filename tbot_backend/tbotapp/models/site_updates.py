from django.db import models


class SiteUpdate(models.Model):
    CATEGORY_CHOICES = [
        ("new", "New"),
        ("improvement", "Improvement"),
        ("fix", "Fix"),
        ("data", "Data"),
        ("announcement", "Announcement"),
    ]

    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    page_url = models.TextField(null=True)
    published = models.BooleanField(default=True)
    published_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = "site_updates"
        ordering = ["-published_at", "-created_at"]

    def __str__(self):
        return self.title