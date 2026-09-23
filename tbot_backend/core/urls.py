from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.urls import include, path

from tbotapp.robots import robots_txt
from tbotapp.sitemap import (
    DeckbuilderSitemap,
    ProfileSitemap,
    StaticViewSitemap,
)


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