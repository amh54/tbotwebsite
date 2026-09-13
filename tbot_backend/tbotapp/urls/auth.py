from django.urls import path

from ..views.auth import (
    csrf_token,
    discord_callback,
    discord_login,
    discord_logout,
    discord_me,
)


urlpatterns = [
    path(
        "csrf/",
        csrf_token,
        name="csrf_token",
    ),
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
]