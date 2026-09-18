from django.db import models
from django.db.models.functions import Now


class UserCard(models.Model):
    id = models.BigAutoField(primary_key=True)
    profile_id = models.BigIntegerField()
    card_name = models.CharField(max_length=255)
    quantity = models.IntegerField(
    default=1
)
    created_at = models.DateTimeField(db_default=Now())
    updated_at = models.DateTimeField(db_default=Now())

    class Meta:
        managed = False
        db_table = "user_cards"
        constraints = [
            models.UniqueConstraint(
                fields=["profile_id", "card_name"],
                name="user_cards_unique_profile_card",
            )
        ]