
import logging
import os
import re

import boto3

from django.db import DatabaseError

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import KeepOrScrap
from ..serializers import KeepOrScrapSerializer

from .helpers import include_error_detail
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
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


def _slugify(value):
    value = str(value or "").strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def _get_extension(image):
    extension = os.path.splitext(
        getattr(image, "name", "")
    )[1].lower()

    if extension in CONTENT_TYPES:
        return extension

    content_type = (
        getattr(image, "content_type", "") or ""
    ).lower()

    for extension, allowed_type in CONTENT_TYPES.items():
        if content_type == allowed_type:
            return extension

    raise ValueError(
        "Unsupported image type. Use JPEG, PNG, WebP, or GIF."
    )


def _upload_keep_or_scrap_image(image, card_class):
    if not image:
        raise ValueError("No image was provided.")

    if not getattr(image, "size", 0):
        raise ValueError("Image is empty.")

    if image.size > MAX_IMAGE_SIZE:
        raise ValueError(
            "Image is too large. Maximum size is 15 MB."
        )

    card_slug = _slugify(card_class)

    if not card_slug:
        raise ValueError(
            "Card class is required before uploading an image."
        )

    extension = _get_extension(image)

    filename = f"{card_slug}{extension}"
    key = f"keep_or_scrap/{filename}"

    image.seek(0)
    content = image.read()

    if not content:
        raise ValueError("Image is empty.")

    client = _get_r2_client()

    client.put_object(
        Bucket=R2_BUCKET_NAME,
        Key=key,
        Body=content,
        ContentType=CONTENT_TYPES[extension],
        CacheControl="public, max-age=31536000",
    )

    client.head_object(
        Bucket=R2_BUCKET_NAME,
        Key=key,
    )

    return f"{R2_PUBLIC_URL}/{key}", key


@api_view(["GET", "POST"])
def admin_keep_or_scrap(request):
    if not is_discord_owner(request):
        return Response(
            {"error": "Unauthorized."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        if request.method == "GET":
            queryset = (
                KeepOrScrap.objects
                .all()
                .order_by(
                    "side",
                    "card_class",
                    "tierid",
                )
            )

            serializer = KeepOrScrapSerializer(
                queryset,
                many=True,
            )

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        data = request.data.copy()

        tierid = data.get("tierid")

        if not tierid:
            latest = (
                KeepOrScrap.objects
                .order_by("-tierid")
                .first()
            )

            tierid = (
                int(latest.tierid) + 1
                if latest
                else 1
            )

        serializer = KeepOrScrapSerializer(
            data={
                "tierid": tierid,
                "side": data.get("side", ""),
                "card_class": data.get("card_class", ""),
                "image": data.get("image", ""),
                "reasoning": data.get("reasoning", ""),
                "creator": data.get("creator", ""),
            }
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    except DatabaseError as exc:
        logger.exception(
            "Admin Keep or Scrap operation failed"
        )

        payload = {
            "error": "Database operation failed.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["PATCH", "DELETE"])
def admin_keep_or_scrap_detail(request, tierid):
    if not is_discord_owner(request):
        return Response(
            {"error": "Unauthorized."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        entry = KeepOrScrap.objects.get(
            tierid=tierid
        )

        if request.method == "DELETE":
            entry.delete()

            return Response(
                status=status.HTTP_204_NO_CONTENT
            )

        serializer = KeepOrScrapSerializer(
            entry,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except KeepOrScrap.DoesNotExist:
        return Response(
            {
                "error": "Keep or Scrap entry not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    except DatabaseError as exc:
        logger.exception(
            "Admin Keep or Scrap detail operation failed"
        )

        payload = {
            "error": "Database operation failed.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def admin_keep_or_scrap_image_upload(request):
    if not is_discord_owner(request):
        return Response(
            {"error": "Unauthorized."},
            status=status.HTTP_403_FORBIDDEN,
        )

    image = request.FILES.get("image")

    if not image:
        return Response(
            {"error": "No image was provided."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    card_class = str(
        request.data.get("card_class", "")
    ).strip()

    if not card_class:
        return Response(
            {
                "error": (
                    "Card class is required before "
                    "uploading an image."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        secure_url, key = _upload_keep_or_scrap_image(
            image=image,
            card_class=card_class,
        )

        return Response(
            {
                "success": True,
                "url": secure_url,
                "secure_url": secure_url,
                "key": key,
                "card_class": card_class,
            },
            status=status.HTTP_201_CREATED,
        )

    except ValueError as exc:
        return Response(
            {"error": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Exception as exc:
        logger.exception(
            "Keep or Scrap R2 image upload failed"
        )

        payload = {
            "error": "Unable to upload image to R2.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_502_BAD_GATEWAY,
        )
