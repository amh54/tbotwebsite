import logging

from django.db import DatabaseError

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import BugReport
from ..serializers import BugReportSerializer

logger = logging.getLogger(__name__)


def _get_discord_id(request):
    """
    Get the logged-in Discord user's ID from the Django session.
    """

    discord_id = request.session.get("discord_id")

    if not discord_id:
        return None

    try:
        return int(discord_id)
    except (TypeError, ValueError):
        return None


@api_view(["GET"])
def user_bug_reports(request):
    """
    Return bug reports submitted by the currently logged-in user.
    """

    discord_id = _get_discord_id(request)

    print("BUG REPORT REQUEST")
    print("SESSION:", dict(request.session))
    print("DISCORD ID:", discord_id)

    if not discord_id:
        return Response(
            {
                "detail": "You must be logged in to view your bug reports.",
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        bugs = (
            BugReport.objects
            .filter(discord_id=discord_id)
            .order_by("-created_at")
        )

        print("BUG REPORT COUNT:", bugs.count())

        serializer = BugReportSerializer(
            bugs,
            many=True,
        )

        print("BUG REPORT DATA:", serializer.data)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except Exception as exc:
        logger.exception(
            "Error loading bug reports for Discord user %s.",
            discord_id,
        )

        print("BUG REPORT ERROR:", repr(exc))

        return Response(
            {
                "detail": str(exc),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET"])
def user_bug_report_detail(request, bug_id):
    """
    Return a single bug report belonging to the currently logged-in user.

    Users can ONLY access their own bug reports.
    """

    discord_id = _get_discord_id(request)

    if not discord_id:
        return Response(
            {
                "detail": "You must be logged in to view this bug report."
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        bug = (
            BugReport.objects
            .filter(
                id=bug_id,
                discord_id=discord_id,
            )
            .first()
        )

        if not bug:
            return Response(
                {
                    "detail": "Bug report not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = BugReportSerializer(bug)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except DatabaseError:
        logger.exception(
            "Database error loading bug report %s for Discord user %s.",
            bug_id,
            discord_id,
        )

        return Response(
            {
                "detail": "Unable to load this bug report."
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    except Exception:
        logger.exception(
            "Unexpected error loading bug report %s for Discord user %s.",
            bug_id,
            discord_id,
        )

        return Response(
            {
                "detail": "Unable to load this bug report."
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )