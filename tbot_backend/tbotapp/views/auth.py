import logging
import os

from urllib.parse import urlencode

import requests

from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import redirect
from django.utils import timezone
from django.views.decorators.csrf import (
    csrf_exempt,
    ensure_csrf_cookie,
    get_token,
)

from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import UserProfile
from .permissions import is_discord_owner


logger = logging.getLogger(__name__)


# ============================================================
# CSRF TOKEN
# ============================================================

@api_view(["GET"])
@ensure_csrf_cookie
def csrf_token(request):
    token = get_token(request)

    response = Response({
        "csrfToken": token
    })

    response.set_cookie(
        "csrftoken",
        token,
        domain=".pvzhtbot.com",
        secure=True,
        httponly=False,
        samesite="None",
    )

    return response
# ============================================================
# DISCORD LOGIN
# ============================================================

def discord_login(request):
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


# ============================================================
# DISCORD CALLBACK
# ============================================================

def discord_callback(request):
    code = request.GET.get("code")

    if not code:
        return JsonResponse(
            {
                "error": (
                    "Discord authorization code "
                    "was not provided."
                )
            },
            status=400,
        )

    token_url = (
        "https://discord.com/api/oauth2/token"
    )

    token_data = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "client_secret": settings.DISCORD_CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.DISCORD_REDIRECT_URI,
    }

    token_headers = {
        "Content-Type": (
            "application/x-www-form-urlencoded"
        ),
    }

    try:
        token_response = requests.post(
            token_url,
            data=token_data,
            headers=token_headers,
            timeout=10,
        )
    except requests.RequestException:
        logger.exception(
            "Unable to contact Discord token endpoint."
        )

        return JsonResponse(
            {
                "error": "Unable to contact Discord."
            },
            status=502,
        )

    if not token_response.ok:
        logger.error(
            "Discord token exchange failed: %s",
            token_response.text,
        )

        return JsonResponse(
            {
                "error": (
                    "Failed to authenticate with Discord."
                )
            },
            status=400,
        )

    try:
        token_json = token_response.json()
    except ValueError:
        logger.error(
            "Discord returned invalid token response."
        )

        return JsonResponse(
            {
                "error": (
                    "Discord returned an invalid "
                    "authentication response."
                )
            },
            status=400,
        )

    access_token = token_json.get(
        "access_token"
    )

    if not access_token:
        return JsonResponse(
            {
                "error": (
                    "Discord did not return "
                    "an access token."
                )
            },
            status=400,
        )

    try:
        user_response = requests.get(
            "https://discord.com/api/v10/users/@me",
            headers={
                "Authorization": (
                    f"Bearer {access_token}"
                ),
            },
            timeout=10,
        )
    except requests.RequestException:
        logger.exception(
            "Unable to retrieve Discord user."
        )

        return JsonResponse(
            {
                "error": (
                    "Unable to retrieve your "
                    "Discord account."
                )
            },
            status=502,
        )

    if not user_response.ok:
        logger.error(
            "Discord user request failed: %s",
            user_response.text,
        )

        return JsonResponse(
            {
                "error": (
                    "Failed to retrieve your "
                    "Discord account."
                )
            },
            status=400,
        )

    try:
        discord_user = user_response.json()
    except ValueError:
        logger.error(
            "Discord returned invalid user response."
        )

        return JsonResponse(
            {
                "error": (
                    "Discord returned invalid "
                    "user information."
                )
            },
            status=400,
        )

    discord_id = discord_user.get("id")
    username = discord_user.get("username")
    global_name = discord_user.get("global_name")
    avatar = discord_user.get("avatar")

    if not discord_id or not username:
        return JsonResponse(
            {
                "error": (
                    "Discord returned incomplete "
                    "user information."
                )
            },
            status=400,
        )

    display_name = global_name or username

    logger.info(
        "Discord login: id=%s username=%s avatar=%s",
        discord_id,
        username,
        avatar,
    )

    # ========================================================
    # DJANGO USER
    # ========================================================

    user, created = User.objects.get_or_create(
        username=f"discord_{discord_id}",
        defaults={
            "first_name": display_name,
        },
    )

    if not created:
        user.first_name = display_name

    # ========================================================
    # OWNER PERMISSIONS
    # ========================================================

    is_owner = (
        str(discord_id).strip()
        == str(settings.DISCORD_OWNER_ID).strip()
    )

    if is_owner:
        user.is_staff = True
        user.is_superuser = True
    else:
        user.is_staff = False
        user.is_superuser = False

    user.save()

    # ========================================================
    # CREATE / UPDATE USER PROFILE
    # ========================================================

    profile_slug = username.strip()
    now = timezone.now()

    UserProfile.objects.update_or_create(
        discord_id=str(discord_id),
        defaults={
            "username": username,
            "display_name": display_name,
            "profile_slug": profile_slug,
            "avatar": avatar,
            "updated_at": now,
        },
        create_defaults={
            "username": username,
            "display_name": display_name,
            "profile_slug": profile_slug,
            "avatar": avatar,
            "created_at": now,
            "updated_at": now,
        },
    )

    # ========================================================
    # LOGIN
    # ========================================================

    login(
        request,
        user,
    )

    request.session["discord_id"] = str(
        discord_id
    )

    request.session["discord_username"] = username

    request.session["discord_global_name"] = (
        display_name
    )

    request.session["discord_avatar"] = avatar

    request.session.save()

    # ========================================================
    # REDIRECT TO FRONTEND
    # ========================================================

    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173",
    ).rstrip("/")

    return redirect(frontend_url)


# ============================================================
# DISCORD CURRENT USER
# ============================================================

@api_view(["GET"])
def discord_me(request):
    if not request.user.is_authenticated:
        return Response({
            "authenticated": False,
        })

    discord_id = request.session.get(
        "discord_id"
    )

    if not discord_id:
        username = request.user.username

        if username.startswith("discord_"):
            discord_id = username[len("discord_"):]

    discord_username = request.session.get(
        "discord_username"
    )

    if not discord_username:
        discord_username = request.user.username

        if discord_username.startswith("discord_"):
            discord_username = discord_username[
                len("discord_"):
            ]

    discord_global_name = request.session.get(
        "discord_global_name"
    )

    if not discord_global_name:
        discord_global_name = (
            request.user.first_name
            or discord_username
        )

    avatar = request.session.get(
        "discord_avatar"
    )

    # ========================================================
    # BUILD DISCORD AVATAR URL
    # ========================================================

    avatar_url = None

    if discord_id and avatar:
        if str(avatar).startswith("a_"):
            avatar_extension = "gif"
        else:
            avatar_extension = "png"

        avatar_url = (
            "https://cdn.discordapp.com/avatars/"
            f"{discord_id}/{avatar}."
            f"{avatar_extension}?size=256"
        )

    elif discord_id:
        try:
            default_avatar_index = (
                (int(discord_id) >> 22) % 6
            )

            avatar_url = (
                "https://cdn.discordapp.com/embed/avatars/"
                f"{default_avatar_index}.png"
            )

        except (ValueError, TypeError):
            avatar_url = (
                "https://cdn.discordapp.com/embed/avatars/"
                "0.png"
            )

    # ========================================================
    # OWNER STATUS
    # ========================================================

    is_owner = is_discord_owner(request)

    return Response({
        "authenticated": True,
        "user": {
            "id": request.user.id,
            "username": discord_username,
            "first_name": request.user.first_name,
            "avatar": avatar_url,
            "is_owner": is_owner,
        },
    })


# ============================================================
# DISCORD LOGOUT
# ============================================================

@csrf_exempt
def discord_logout(request):
    if request.method != "POST":
        return JsonResponse(
            {
                "error": "POST request required.",
            },
            status=405,
        )

    logger.info(
        "Discord logout requested. User=%s",
        request.user,
    )

    logout(request)

    return JsonResponse({
        "authenticated": False,
    })