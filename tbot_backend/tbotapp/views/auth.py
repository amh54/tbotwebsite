import logging
import os

from urllib.parse import urlencode

import requests
from django.views.decorators.http import require_GET
from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import redirect
from django.utils import timezone
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import (
    ensure_csrf_cookie,
    get_token,
)

from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import UserProfile
from .permissions import is_discord_owner


logger = logging.getLogger(__name__)
DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"
DISCORD_USER_URL = "https://discord.com/api/v10/users/@me"


@require_GET
@ensure_csrf_cookie
def csrf_token(request):
    return JsonResponse({
        "csrfToken": get_token(request),
    })

def discord_login(_request):
    discord_authorize_url = (
        "https://discord.com/oauth2/authorize"
    )

    params = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": settings.DISCORD_REDIRECT_URI,
        "scope": "identify",
    }

    query_string = urlencode(params)

    return redirect(
        f"{discord_authorize_url}?{query_string}"
    )


def exchange_discord_code(code):
    try:
        response = requests.post(
            DISCORD_TOKEN_URL,
            data={
                "client_id": settings.DISCORD_CLIENT_ID,
                "client_secret": settings.DISCORD_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.DISCORD_REDIRECT_URI,
            },
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
            },
            timeout=10,
        )
    except requests.RequestException:
        logger.exception("Unable to contact Discord token endpoint.")
        return None, JsonResponse(
            {"error": "Unable to contact Discord."},
            status=502,
        )

    if not response.ok:
        logger.error("Discord token exchange failed: %s", response.text)
        return None, JsonResponse(
            {"error": "Failed to authenticate with Discord."},
            status=400,
        )

    try:
        token_data = response.json()
    except ValueError:
        logger.error("Discord returned invalid token response.")
        return None, JsonResponse(
            {"error": "Discord returned an invalid authentication response."},
            status=400,
        )

    access_token = token_data.get("access_token")
    if not access_token:
        return None, JsonResponse(
            {"error": "Discord did not return an access token."},
            status=400,
        )

    return access_token, None


def fetch_discord_user(access_token):
    try:
        response = requests.get(
            DISCORD_USER_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
    except requests.RequestException:
        logger.exception("Unable to retrieve Discord user.")
        return None, JsonResponse(
            {"error": "Unable to retrieve your Discord account."},
            status=502,
        )

    if not response.ok:
        logger.error("Discord user request failed: %s", response.text)
        return None, JsonResponse(
            {"error": "Failed to retrieve your Discord account."},
            status=400,
        )

    try:
        discord_user = response.json()
    except ValueError:
        logger.error("Discord returned invalid user response.")
        return None, JsonResponse(
            {"error": "Discord returned invalid user information."},
            status=400,
        )

    if not discord_user.get("id") or not discord_user.get("username"):
        return None, JsonResponse(
            {"error": "Discord returned incomplete user information."},
            status=400,
        )

    return discord_user, None


def sync_discord_user(discord_user):
    discord_id = str(discord_user["id"])
    username = discord_user["username"]
    display_name = discord_user.get("global_name") or username
    avatar = discord_user.get("avatar")

    user, created = User.objects.get_or_create(
        username=f"discord_{discord_id}",
        defaults={"first_name": display_name},
    )

    if not created:
        user.first_name = display_name

    is_owner = discord_id.strip() == str(
        settings.DISCORD_OWNER_ID
    ).strip()

    user.is_staff = is_owner
    user.is_superuser = is_owner
    user.save()

    now = timezone.now()
    profile = UserProfile.objects.filter(
        discord_id=discord_id
    ).first()

    if profile is None:
        UserProfile.objects.create(
            discord_id=discord_id,
            username=username,
            display_name=display_name,
            profile_slug=username.strip(),
            avatar=avatar,
            created_at=now,
            updated_at=now,
        )
    else:
        profile.username = username

        if not profile.display_name_is_custom:
            profile.display_name = display_name

        profile.avatar = avatar
        profile.updated_at = now
        profile.save(
            update_fields=[
                "username",
                "display_name",
                "avatar",
                "updated_at",
            ]
        )

    return user, discord_id, username, display_name, avatar


def set_discord_session(
    request,
    discord_id,
    username,
    display_name,
    avatar,
    access_token,
):
    login(request, User.objects.get(username=f"discord_{discord_id}"))

    request.session.update({
        "discord_id": discord_id,
        "discord_username": username,
        "discord_global_name": display_name,
        "discord_avatar": avatar,
        "discord_access_token": access_token,
    })
    request.session.save()


def discord_callback(request):
    code = request.GET.get("code")
    if not code:
        return JsonResponse(
            {"error": "Discord authorization code was not provided."},
            status=400,
        )

    access_token, error_response = exchange_discord_code(code)
    if error_response:
        return error_response

    discord_user, error_response = fetch_discord_user(access_token)
    if error_response:
        return error_response

    discord_id = str(discord_user["id"])
    username = discord_user["username"]
    avatar = discord_user.get("avatar")

    logger.info(
        "Discord login: id=%s username=%s avatar=%s",
        discord_id,
        username,
        avatar,
    )

    user, discord_id, username, display_name, avatar = sync_discord_user(
        discord_user
    )

    login(request, user)
    request.session.update({
        "discord_id": discord_id,
        "discord_username": username,
        "discord_global_name": display_name,
        "discord_avatar": avatar,
        "discord_access_token": access_token,
    })
    request.session.save()

    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173",
    ).rstrip("/")

    return redirect(frontend_url)


def get_discord_id(request):
    discord_id = request.session.get("discord_id")

    if not discord_id and request.user.username.startswith("discord_"):
        discord_id = request.user.username[len("discord_"):]

    return discord_id


def get_discord_username(request):
    username = request.session.get("discord_username")

    if username:
        return username

    username = request.user.username

    if username.startswith("discord_"):
        return username[len("discord_"):]

    return username


def get_discord_display_name(request, profile, discord_username):
    if profile and profile.display_name:
        return profile.display_name

    return (
        request.session.get("discord_global_name")
        or request.user.first_name
        or discord_username
    )


def get_discord_avatar_url(discord_id, avatar):
    if not discord_id:
        return None

    if avatar:
        extension = "gif" if str(avatar).startswith("a_") else "png"
        return (
            f"https://cdn.discordapp.com/avatars/"
            f"{discord_id}/{avatar}.{extension}?size=256"
        )

    try:
        default_avatar_index = (int(discord_id) >> 22) % 6
    except (ValueError, TypeError):
        default_avatar_index = 0

    return (
        "https://cdn.discordapp.com/embed/avatars/"
        f"{default_avatar_index}.png"
    )


@api_view(["GET"])
def discord_me(request):
    if not request.user.is_authenticated:
        return Response({"authenticated": False})

    discord_id = get_discord_id(request)
    discord_username = get_discord_username(request)

    profile = UserProfile.objects.filter(
        discord_id=str(discord_id)
    ).first()

    display_name = get_discord_display_name(
        request, profile, discord_username
    )

    avatar_url = get_discord_avatar_url(
        discord_id,
        request.session.get("discord_avatar"),
    )

    return Response({
        "authenticated": True,
        "user": {
            "id": request.user.id,
            "username": discord_username,
            "first_name": display_name,
            "avatar": avatar_url,
            "is_owner": is_discord_owner(request),
        },
    })



@require_POST
def discord_logout(request):
    logger.info(
        "Discord logout requested. User=%s Authenticated=%s",
        request.user,
        request.user.is_authenticated,
    )

    logout(request)

    response = JsonResponse({"authenticated": False})
    response.delete_cookie(
        settings.SESSION_COOKIE_NAME,
        path=settings.SESSION_COOKIE_PATH,
        domain=settings.SESSION_COOKIE_DOMAIN,
        samesite=settings.SESSION_COOKIE_SAMESITE,
    )

    return response