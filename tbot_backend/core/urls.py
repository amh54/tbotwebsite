from django.contrib import admin
from django.urls import include, path

from tbotapp.views.auth import (
    discord_login,
    discord_callback,
    discord_me,
    discord_logout,
)

from tbotapp.views.profile import (
    profile_me,
    profile_detail,
)


urlpatterns = [
    # ============================================================
    # DJANGO ADMIN
    # ============================================================

    path(
        "admin/",
        admin.site.urls,
    ),

    # ============================================================
    # TBOT API
    # ============================================================

    path(
        "tbotapp/",
        include("tbotapp.urls"),
    ),

    # ============================================================
    # DISCORD AUTH
    # ============================================================

    path(
        "auth/discord/login/",
        discord_login,
        name="discord_login",
    ),

    path(
        "auth/discord/callback/",
        discord_callback,
        name="discord_callback",
    ),

    path(
        "auth/discord/me/",
        discord_me,
        name="discord_me",
    ),

    path(
        "auth/discord/logout/",
        discord_logout,
        name="discord_logout",
    ),

    # ============================================================
    # PROFILES
    # ============================================================

    path(
        "profile/me/",
        profile_me,
        name="profile_me",
    ),

    path(
        "profile/<str:profile_slug>/",
        profile_detail,
        name="profile_detail",
    ),
]