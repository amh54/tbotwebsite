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


def public_sitemap(request):
    original_host = request.get_host

    request.get_host = lambda: "pvzhtbot.com"

    try:
        response = sitemap(
            request,
            sitemaps=sitemaps,
        )
        response.headers.pop("X-Robots-Tag", None)
        return response
    finally:
        request.get_host = original_host


urlpatterns = [
    path("admin/", admin.site.urls),
    path("tbotapp/", include("tbotapp.urls")),
    path(
        "sitemap.xml",
        public_sitemap,
        name="django-sitemap",
    ),
    path(
        "robots.txt",
        robots_txt,
        name="robots-txt",
    ),
]