import logging

from functools import wraps

from django.conf import settings
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response


logger = logging.getLogger(__name__)


# ============================================================
# DISCORD OWNER CHECK
# ============================================================

def is_discord_owner(request):
    if not request.user.is_authenticated:
        return False

    owner_id = str(
        settings.DISCORD_OWNER_ID
    ).strip()

    if not owner_id:
        return False

    session_discord_id = request.session.get(
        "discord_id"
    )

    if (
        session_discord_id is not None
        and str(session_discord_id).strip() == owner_id
    ):
        return True

    username = str(
        request.user.username or ""
    ).strip()

    expected_username = f"discord_{owner_id}"

    if username == expected_username:
        return True

    return False


# ============================================================
# OWNER REQUIRED DECORATOR
# ============================================================

def owner_required(view_func):
    @wraps(view_func)
    def wrapped_view(
        request,
        *args,
        **kwargs,
    ):
        if not is_discord_owner(request):
            logger.warning(
                "Owner permission denied. "
                "user=%s authenticated=%s username=%s "
                "session_discord_id=%s",
                request.user,
                request.user.is_authenticated,
                getattr(
                    request.user,
                    "username",
                    None,
                ),
                request.session.get(
                    "discord_id"
                ),
            )

            return Response(
                {
                    "error": (
                        "Owner permissions required."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return view_func(
            request,
            *args,
            **kwargs,
        )

    return wrapped_view


# ============================================================
# ADMIN CHECK
# ============================================================

@api_view(["GET"])
@ensure_csrf_cookie
def admin_check(request):
    if not request.user.is_authenticated:
        return Response(
            {
                "authorized": False,
                "is_owner": False,
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not is_discord_owner(request):
        return Response(
            {
                "authorized": False,
                "is_owner": False,
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    return Response({
        "authorized": True,
        "is_owner": True,
    })


# ============================================================
# OWNER ACTION
# ============================================================

@api_view(["POST"])
@owner_required
def owner_action(request):
    return Response({
        "success": True,
    })