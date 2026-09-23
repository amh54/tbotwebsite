from django.contrib.sitemaps import Sitemap

from .models.decklists import WebDeckbuilder
from .models.profiles import UserProfile


class StaticViewSitemap(Sitemap):
    priority = 0.8
    changefreq = "weekly"

    def items(self):
        return [
            "/",
            "/decklists",
            "/cardinfo",
            "/heroinfo",
            "/deckbuilders",
            "/keeporscrap",
            "/legacydecks",
            "/tutorial",
            "/updates",
            "/users",
            "/termsofservice",
            "/privacypolicy",
        ]

    def location(self, item):
        return item


class DeckbuilderSitemap(Sitemap):
    priority = 0.7
    changefreq = "weekly"

    def items(self):
        return WebDeckbuilder.objects.all()

    def location(self, obj):
        return f"/deckbuilders/{obj.deckbuilder_name}/decks"


class ProfileSitemap(Sitemap):
    priority = 0.6
    changefreq = "weekly"

    def items(self):
        return UserProfile.objects.filter(is_public=True)

    def location(self, obj):
        return f"/profile/{obj.profile_slug}"