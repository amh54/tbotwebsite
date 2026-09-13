from django.db import models


class UserProfile(models.Model):
    id = models.BigAutoField(primary_key=True)
    discord_id = models.CharField(max_length=32, unique=True)
    username = models.CharField(max_length=255)
    display_name_is_custom = models.BooleanField(default=False)
    display_name = models.CharField(max_length=255)
    profile_slug = models.CharField(max_length=255, unique=True)
    avatar = models.TextField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "user_profiles"