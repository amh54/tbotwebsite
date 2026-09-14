from django.db import models


class WebCards(models.Model):
    cardid = models.SmallIntegerField(primary_key=True)
    card_type = models.CharField(max_length=100)
    card_name = models.CharField(max_length=255)
    side = models.CharField(max_length=50, null=True)
    title = models.TextField()
    stats = models.TextField()
    description = models.TextField()
    ability = models.TextField()
    thumbnail = models.TextField()
    traits = models.TextField()
    set_rarity = models.TextField()
    flavor_text = models.TextField()
    aliases = models.TextField()
    button = models.TextField()
    button_emoji = models.TextField()
    button2 = models.TextField()
    button_emoji2 = models.TextField()

    class Meta:
        managed = False
        db_table = "web_cards"


class KeepOrScrap(models.Model):
    tierid = models.IntegerField(primary_key=True)
    side = models.CharField(max_length=50)
    card_class = models.CharField(max_length=100, db_column="class")
    image = models.TextField()
    reasoning = models.TextField()
    faq = models.TextField()
    creator = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = "web_keep_or_scrap"