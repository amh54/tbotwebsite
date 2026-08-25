import logging

import cloudinary
import cloudinary.uploader

from django.conf import settings
from django.db import DatabaseError

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import KeepOrScrap
from ..serializers import KeepOrScrapSerializer

from .helpers import include_error_detail
from .permissions import is_discord_owner


logger = logging.getLogger(__name__)


# ============================================================
# CLOUDINARY CONFIGURATION
# ============================================================

cloudinary.config(
    cloud_name=getattr(settings, "CLOUDINARY_CLOUD_NAME", ""),
    api_key=getattr(settings, "CLOUDINARY_API_KEY", ""),
    api_secret=getattr(settings, "CLOUDINARY_API_SECRET", ""),
)


# ============================================================
# ADMIN KEEP OR SCRAP
# ============================================================

@api_view(["GET", "POST"])
def admin_keep_or_scrap(request):
    if not is_discord_owner(request):
        return Response(
            {"error": "Unauthorized."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        # ----------------------------------------------------
        # GET
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # POST
        # ----------------------------------------------------

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


# ============================================================
# ADMIN KEEP OR SCRAP DETAIL
# ============================================================

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

        # ----------------------------------------------------
        # DELETE
        # ----------------------------------------------------

        if request.method == "DELETE":
            entry.delete()

            return Response(
                status=status.HTTP_204_NO_CONTENT
            )

        # ----------------------------------------------------
        # PATCH
        # ----------------------------------------------------

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


# ============================================================
# ADMIN KEEP OR SCRAP CLOUDINARY IMAGE UPLOAD
# ============================================================

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
            {
                "error": "No image was provided."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------------
    # Basic image validation
    # --------------------------------------------------------

    allowed_content_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    }

    content_type = getattr(
        image,
        "content_type",
        "",
    )

    if content_type not in allowed_content_types:
        return Response(
            {
                "error": (
                    "Invalid image type. "
                    "Please upload a JPG, PNG, WEBP, "
                    "or GIF image."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 15 MB maximum upload size.

    max_size = 15 * 1024 * 1024

    if image.size > max_size:
        return Response(
            {
                "error": (
                    "Image is too large. "
                    "Maximum size is 15 MB."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------------
    # Verify Cloudinary configuration
    # --------------------------------------------------------

    cloud_name = getattr(
        settings,
        "CLOUDINARY_CLOUD_NAME",
        "",
    )

    api_key = getattr(
        settings,
        "CLOUDINARY_API_KEY",
        "",
    )

    api_secret = getattr(
        settings,
        "CLOUDINARY_API_SECRET",
        "",
    )

    if not cloud_name or not api_key or not api_secret:
        logger.error(
            "Cloudinary is not configured correctly."
        )

        return Response(
            {
                "error": (
                    "Cloudinary is not configured "
                    "on the server."
                )
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # --------------------------------------------------------
    # Upload
    # --------------------------------------------------------

    try:
        result = cloudinary.uploader.upload(
            image,
            folder="tbot/keep-or-scrap",
            resource_type="image",
        )

        secure_url = result.get("secure_url")

        if not secure_url:
            logger.error(
                "Cloudinary upload returned no secure URL: %s",
                result,
            )

            return Response(
                {
                    "error": (
                        "Cloudinary did not return "
                        "an image URL."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "url": secure_url,
                "secure_url": secure_url,
                "public_id": result.get("public_id"),
                "width": result.get("width"),
                "height": result.get("height"),
                "format": result.get("format"),
            },
            status=status.HTTP_201_CREATED,
        )

    except Exception as exc:
        logger.exception(
            "Keep or Scrap Cloudinary upload failed"
        )

        payload = {
            "error": "Cloudinary upload failed.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )