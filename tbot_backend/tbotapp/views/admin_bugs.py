
import logging
import os

import boto3

from django.db import DatabaseError
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from ..models import BugReport
from ..serializers import BugReportSerializer
from .permissions import is_discord_owner


logger = logging.getLogger(__name__)

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "").strip()
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "").strip()
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "").strip()
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "").strip()
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "").strip().rstrip("/")

MAX_IMAGE_SIZE = 15 * 1024 * 1024

CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
}

VALID_CATEGORIES = {
    "ui",
    "decklists",
    "cards",
    "account",
    "discord",
    "other",
}


def _get_discord_id(request):
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
                "detail": "You do not have permission to access bug reports."
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    return None


def _get_r2_client():
    if not all(
        [
            R2_ACCOUNT_ID,
            R2_ACCESS_KEY_ID,
            R2_SECRET_ACCESS_KEY,
            R2_BUCKET_NAME,
            R2_PUBLIC_URL,
        ]
    ):
        raise RuntimeError("R2 storage is not configured correctly.")

    return boto3.client(
        "s3",
        endpoint_url=(
            f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
        ),
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


def _get_category(category):
    category = str(category or "other").strip().lower()

    if category not in VALID_CATEGORIES:
        return "other"

    return category


def _get_extension(image_file):
    extension = os.path.splitext(
        getattr(image_file, "name", "")
    )[1].lower()

    if extension not in CONTENT_TYPES:
        content_type = getattr(image_file, "content_type", "")

        for ext, allowed_type in CONTENT_TYPES.items():
            if content_type == allowed_type:
                return ext

        raise ValueError("Unsupported image type.")

    return extension


def _upload_screenshot(image_file, category, bug_id):
    if not image_file:
        return None, None

    size = getattr(image_file, "size", 0)

    if not size:
        raise ValueError("Screenshot is empty.")

    if size > MAX_IMAGE_SIZE:
        raise ValueError("Screenshot must be 15 MB or smaller.")

    extension = _get_extension(image_file)
    content_type = CONTENT_TYPES[extension]

    category = _get_category(category)

    filename = f"bug-{bug_id}{extension}"
    key = f"bugs/{category}/{filename}"

    image_file.seek(0)
    content = image_file.read()

    if not content:
        raise ValueError("Screenshot is empty.")

    client = _get_r2_client()

    client.put_object(
        Bucket=R2_BUCKET_NAME,
        Key=key,
        Body=content,
        ContentType=content_type,
        CacheControl="public, max-age=31536000",
    )

    client.head_object(
        Bucket=R2_BUCKET_NAME,
        Key=key,
    )

    return f"{R2_PUBLIC_URL}/{key}", key


def _delete_r2_object(key):
    if not key:
        return

    client = _get_r2_client()

    client.delete_object(
        Bucket=R2_BUCKET_NAME,
        Key=key,
    )


def _get_r2_key(url):
    if not url:
        return None

    prefix = f"{R2_PUBLIC_URL}/"

    if not url.startswith(prefix):
        return None

    return url[len(prefix):]


@api_view(["POST"])
@parser_classes(
    [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]
)
def bug_report_create(request):
    discord_id = _get_discord_id(request)

    if not discord_id:
        return Response(
            {
                "detail": "You must be logged in to submit a bug report.",
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    screenshot = request.FILES.get("screenshot")

    try:
        data = request.data.copy()

        data.pop("screenshot", None)
        data["discord_id"] = discord_id

        serializer = BugReportSerializer(data=data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        bug_report = serializer.save(
            discord_id=discord_id,
        )

        if screenshot:
            try:
                screenshot_url, _ = _upload_screenshot(
                    screenshot,
                    bug_report.category,
                    bug_report.id,
                )

                BugReport.objects.filter(
                    id=bug_report.id
                ).update(
                    screenshot=screenshot_url
                )

                bug_report.screenshot = screenshot_url

            except Exception:
                BugReport.objects.filter(
                    id=bug_report.id
                ).delete()

                raise

        return Response(
            BugReportSerializer(bug_report).data,
            status=status.HTTP_201_CREATED,
        )

    except ValueError as exc:
        logger.warning(
            "Invalid bug report screenshot for Discord user %s: %s",
            discord_id,
            exc,
        )

        return Response(
            {
                "detail": str(exc),
            },
            status=status.HTTP_400_BAD_REQUEST,
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
            screenshot = request.FILES.get("screenshot")

            data = request.data.copy()
            data.pop("screenshot", None)

            old_screenshot = bug.screenshot

            serializer = BugReportSerializer(
                bug,
                data=data,
                partial=True,
            )

            if not serializer.is_valid():
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST,
                )

            updated_bug = serializer.save()

            new_screenshot_url = None
            new_screenshot_key = None

            if screenshot:
                try:
                    new_screenshot_url, new_screenshot_key = (
                        _upload_screenshot(
                            screenshot,
                            updated_bug.category,
                            updated_bug.id,
                        )
                    )

                    BugReport.objects.filter(
                        id=updated_bug.id
                    ).update(
                        screenshot=new_screenshot_url
                    )

                    updated_bug.screenshot = new_screenshot_url

                except Exception:
                    BugReport.objects.filter(
                        id=updated_bug.id
                    ).update(
                        screenshot=old_screenshot
                    )

                    raise

                old_screenshot_key = _get_r2_key(
                    old_screenshot
                )

                if (
                    old_screenshot_key
                    and old_screenshot_key != new_screenshot_key
                ):
                    try:
                        _delete_r2_object(
                            old_screenshot_key
                        )
                    except Exception:
                        logger.warning(
                            "Unable to delete old R2 screenshot "
                            "for bug report %s.",
                            bug_id,
                            exc_info=True,
                        )

            return Response(
                BugReportSerializer(updated_bug).data,
                status=status.HTTP_200_OK,
            )

        if request.method == "DELETE":
            screenshot = bug.screenshot
            screenshot_key = _get_r2_key(screenshot)

            bug.delete()

            if screenshot_key:
                try:
                    _delete_r2_object(screenshot_key)
                except Exception:
                    logger.warning(
                        "Unable to delete R2 screenshot "
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

    except ValueError as exc:
        logger.warning(
            "Invalid screenshot for bug report %s: %s",
            bug_id,
            exc,
        )

        return Response(
            {
                "detail": str(exc),
            },
            status=status.HTTP_400_BAD_REQUEST,
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
