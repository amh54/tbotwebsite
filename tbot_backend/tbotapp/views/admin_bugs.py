import logging

from django.db import DatabaseError

from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
    JSONParser,
)
from rest_framework.response import Response

from ..models import BugReport
from ..serializers import BugReportSerializer
from .permissions import is_discord_owner


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


def _require_owner(request):
    if not is_discord_owner(request):
        return Response(
            {
                "detail": (
                    "You do not have permission to access bug reports."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    return None


@api_view(["POST"])
@parser_classes(
    [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]
)
def bug_report_create(request):
    """
    Create a bug report.

    The Discord ID is ALWAYS taken from the authenticated
    Django session. It is never trusted from the frontend.

    Screenshot uploads are sent as multipart/form-data.
    The BugReport.screenshot CloudinaryField handles the
    actual Cloudinary upload.
    """

    discord_id = _get_discord_id(request)

    print("BUG REPORT CREATE")
    print("SESSION:", dict(request.session))
    print("DISCORD ID:", discord_id)

    if not discord_id:
        return Response(
            {
                "detail": "You must be logged in to submit a bug report.",
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        # Copy request data so we can safely control discord_id.
        data = request.data.copy()

        # Never trust a Discord ID supplied by the frontend.
        data["discord_id"] = discord_id

        serializer = BugReportSerializer(
            data=data,
        )

        if not serializer.is_valid():
            print("BUG REPORT VALIDATION ERRORS:", serializer.errors)

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        bug_report = serializer.save(
            discord_id=discord_id,
        )

        print("BUG REPORT CREATED:", bug_report.id)
        print("SAVED DISCORD ID:", bug_report.discord_id)

        return Response(
            BugReportSerializer(bug_report).data,
            status=status.HTTP_201_CREATED,
        )

    except DatabaseError:
        logger.exception(
            "Database error creating bug report for Discord user %s.",
            discord_id,
        )

        return Response(
            {
                "detail": "Unable to submit bug report.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    except Exception:
        logger.exception(
            "Unexpected error creating bug report for Discord user %s.",
            discord_id,
        )

        return Response(
            {
                "detail": "Unable to submit bug report.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def admin_bug_reports(request):
    """
    Return all bug reports for the site owner.
    """

    permission_error = _require_owner(request)

    if permission_error:
        return permission_error

    try:
        bugs = (
            BugReport.objects
            .all()
            .order_by("-created_at")
        )

        serializer = BugReportSerializer(
            bugs,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except DatabaseError:
        logger.exception(
            "Database error loading bug reports."
        )

        return Response(
            {
                "detail": "Unable to load bug reports.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    except Exception:
        logger.exception(
            "Unexpected error loading bug reports."
        )

        return Response(
            {
                "detail": "Unable to load bug reports.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET", "PATCH", "DELETE"])
@parser_classes(
    [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]
)
def admin_bug_report_detail(request, bug_id):
    """
    View, update, or delete a single bug report.
    """

    permission_error = _require_owner(request)

    if permission_error:
        return permission_error

    try:
        bug = (
            BugReport.objects
            .filter(id=bug_id)
            .first()
        )

        if not bug:
            return Response(
                {
                    "detail": "Bug report not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.method == "GET":
            serializer = BugReportSerializer(bug)

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        if request.method == "PATCH":
            serializer = BugReportSerializer(
                bug,
                data=request.data,
                partial=True,
            )

            if not serializer.is_valid():
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST,
                )

            updated_bug = serializer.save()

            return Response(
                BugReportSerializer(updated_bug).data,
                status=status.HTTP_200_OK,
            )

        if request.method == "DELETE":
            screenshot = bug.screenshot

            bug.delete()

            # Remove the Cloudinary asset when the storage backend
            # supports deletion through the FieldFile.
            if screenshot:
                try:
                    screenshot.delete(save=False)
                except Exception:
                    logger.warning(
                        "Unable to delete Cloudinary screenshot "
                        "for bug report %s.",
                        bug_id,
                        exc_info=True,
                    )

            return Response(
                status=status.HTTP_204_NO_CONTENT,
            )

        return Response(
            {
                "detail": "Unsupported request method.",
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    except DatabaseError:
        logger.exception(
            "Database error processing bug report %s.",
            bug_id,
        )

        return Response(
            {
                "detail": "Unable to process bug report.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    except Exception:
        logger.exception(
            "Unexpected error processing bug report %s.",
            bug_id,
        )

        return Response(
            {
                "detail": "Unable to process bug report.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
