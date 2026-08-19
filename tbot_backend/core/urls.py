from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

from tbotapp import views


urlpatterns = [
    path("admin/", admin.site.urls),

    path(
        "tbotapp/",
        include("tbotapp.urls"),
    ),

    path(
        "auth/discord/login/",
        views.discord_login,
        name="discord_login",
    ),

    path(
        "auth/discord/callback/",
        views.discord_callback,
        name="discord_callback",
    ),

    path(
        "auth/discord/me/",
        views.discord_me,
        name="discord_me",
    ),

    path(
        "auth/discord/logout/",
        views.discord_logout,
        name="discord_logout",
    ),
    path(
    "profile/me/",
    views.profile_me,
    name="profile_me",
),

path(
    "profile/<str:profile_slug>/",
    views.profile_detail,
    name="profile_detail",
),
]