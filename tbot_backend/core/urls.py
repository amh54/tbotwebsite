from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.urls import include, path, resolve
import tbotapp.urls
from tbotapp.robots import robots_txt
from tbotapp.sitemap import (
    DeckbuilderSitemap,
    ProfileSitemap,
    StaticViewSitemap,
)
print("ROOT URLS LOADED:", tbotapp.urls.__file__)

sitemaps = {
    "static": StaticViewSitemap,
    "deckbuilders": DeckbuilderSitemap,
    "profiles": ProfileSitemap,
}


urlpatterns = [
    path("admin/", admin.site.urls),
    path("tbotapp/", include("tbotapp.urls")),
    path(
        "sitemap.xml",
        sitemap,
        {"sitemaps": sitemaps},
        name="django-sitemap",
    ),
    path(
        "robots.txt",
        robots_txt,
        name="robots-txt",
    ),
]
try:
    resolved = resolve("/tbotapp/user-decks/5/")
    print(
        "RESOLVED USER DECK URL:",
        resolved.func,
        "URL NAME:",
        resolved.url_name,
        "ROUTE:",
        resolved.route,
    )
except Exception as exc:
    print("URL RESOLVE FAILED:", exc)