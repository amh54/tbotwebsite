
import logging
import os
import re

import cloudinary
import cloudinary.uploader

from django.db import DatabaseError

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import WebCards
from ..serializers import WebCardSerializer
from .helpers import include_error_detail
from .permissions import is_discord_owner


logger = logging.getLogger(__name__)


# ============================================================
# CLOUDINARY CONFIG
# ============================================================

cloudinary.config(
    cloud_name=os.environ.get(
        "CLOUDINARY_CLOUD_NAME",
        "",
    ),
    api_key=os.environ.get(
        "CLOUDINARY_API_KEY",
        "",
    ),
    api_secret=os.environ.get(
        "CLOUDINARY_API_SECRET",
        "",
    ),
)


# ============================================================
# ADMIN CARD LIST / CREATE
# ============================================================

@api_view(["GET", "POST"])
def admin_cards(request):

    if not is_discord_owner(request):
        return Response(
            {
                "authorized": False,
                "is_owner": False,
                "error": "Owner access required.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    try:

        # ----------------------------------------------------
        # GET ALL CARDS
        # ----------------------------------------------------

        if request.method == "GET":

            cards = (
                WebCards.objects
                .all()
                .order_by("cardid")
            )

            serializer = WebCardSerializer(
                cards,
                many=True,
            )

            return Response(
                {
                    "authorized": True,
                    "is_owner": True,
                    "count": cards.count(),
                    "results": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        # ----------------------------------------------------
        # CREATE CARD
        # ----------------------------------------------------

        data = request.data

        cardid = data.get("cardid")

        if cardid in (None, ""):
            return Response(
                {
                    "error": "cardid is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if WebCards.objects.filter(
            cardid=cardid
        ).exists():

            return Response(
                {
                    "error": (
                        f"Card ID {cardid} already exists."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        card = WebCards(
            cardid=cardid,

            card_type=data.get(
                "card_type",
                "",
            ),

            card_name=data.get(
                "card_name",
                "",
            ),

            side=data.get(
                "side",
                "",
            ),

            title=data.get(
                "title",
                "",
            ),

            stats=data.get(
                "stats",
                "",
            ),

            description=data.get(
                "description",
                "",
            ),

            ability=data.get(
                "ability",
                "",
            ),

            thumbnail=data.get(
                "thumbnail",
                "",
            ),

            traits=data.get(
                "traits",
                "",
            ),

            set_rarity=data.get(
                "set_rarity",
                "",
            ),

            flavor_text=data.get(
                "flavor_text",
                "",
            ),

            aliases=data.get(
                "aliases",
                "",
            ),

            button=data.get(
                "button",
                "",
            ),

            button_emoji=data.get(
                "button_emoji",
                "",
            ),

            button2=data.get(
                "button2",
                "",
            ),

            button_emoji2=data.get(
                "button_emoji2",
                "",
            ),
        )

        card.save(force_insert=True)

        serializer = WebCardSerializer(card)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    except DatabaseError as exc:

        logger.exception(
            "Admin card operation failed."
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
# ADMIN CARD DETAIL
# ============================================================

@api_view(["GET", "PATCH", "DELETE"])
def admin_card_detail(
    request,
    cardid,
):

    if not is_discord_owner(request):
        return Response(
            {
                "authorized": False,
                "is_owner": False,
                "error": "Owner access required.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    try:

        try:
            card = WebCards.objects.get(
                cardid=cardid
            )

        except WebCards.DoesNotExist:

            return Response(
                {
                    "error": "Card not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # ----------------------------------------------------
        # GET
        # ----------------------------------------------------

        if request.method == "GET":

            serializer = WebCardSerializer(card)

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        # ----------------------------------------------------
        # DELETE
        # ----------------------------------------------------

        if request.method == "DELETE":

            card.delete()

            return Response(
                {
                    "success": True,
                    "message": "Card deleted.",
                },
                status=status.HTTP_200_OK,
            )

        # ----------------------------------------------------
        # PATCH
        # ----------------------------------------------------

        data = request.data

        editable_fields = [
            "card_type",
            "card_name",
            "side",
            "title",
            "stats",
            "description",
            "ability",
            "thumbnail",
            "traits",
            "set_rarity",
            "flavor_text",
            "aliases",
            "button",
            "button_emoji",
            "button2",
            "button_emoji2",
        ]

        for field in editable_fields:

            if field in data:

                value = data.get(field)

                setattr(
                    card,
                    field,
                    value if value is not None else "",
                )

        card.save()

        serializer = WebCardSerializer(card)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:

        logger.exception(
            "Admin card detail operation failed."
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
def admin_card_image_upload(request):
    if not is_discord_owner(request):
        return Response(
            {
                "authorized": False,
                "is_owner": False,
                "error": "Owner access required.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    cloud_name = os.environ.get(
        "CLOUDINARY_CLOUD_NAME",
        "",
    ).strip()

    api_key = os.environ.get(
        "CLOUDINARY_API_KEY",
        "",
    ).strip()

    api_secret = os.environ.get(
        "CLOUDINARY_API_SECRET",
        "",
    ).strip()

    if not cloud_name:
        return Response(
            {
                "error": "Cloudinary cloud name is not configured.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if not api_key:
        return Response(
            {
                "error": "Cloudinary API key is not configured.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if not api_secret:
        return Response(
            {
                "error": "Cloudinary API secret is not configured.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    image = request.FILES.get("image")

    if not image:
        return Response(
            {
                "error": "No image was provided.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    card_name = str(
        request.data.get("card_name", "")
    ).strip()

    if not card_name:
        return Response(
            {
                "error": "Card name is required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    }

    content_type = (
        getattr(image, "content_type", "") or ""
    ).lower()

    if content_type not in allowed_types:
        return Response(
            {
                "error": (
                    "Unsupported image type. "
                    "Use JPEG, PNG, WebP, or GIF."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    max_size = 10 * 1024 * 1024

    if image.size > max_size:
        return Response(
            {
                "error": (
                    "Image is too large. "
                    "Maximum size is 10 MB."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        safe_name = " ".join(card_name.split())

        result = cloudinary.uploader.upload(
            image,
            folder="tbot/cards",
            public_id=safe_name,
            resource_type="image",
            overwrite=True,
            use_filename=False,
            unique_filename=False,
        )

        secure_url = result.get("secure_url")
        public_id = result.get("public_id")

        if not secure_url:
            logger.error(
                "Cloudinary upload returned no secure_url: %s",
                result,
            )

            return Response(
                {
                    "error": (
                        "Cloudinary did not return "
                        "an image URL."
                    ),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "success": True,
                "url": secure_url,
                "secure_url": secure_url,
                "public_id": public_id,
                "card_name": card_name,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as exc:
        logger.exception(
            "Cloudinary card image upload failed."
        )

        payload = {
            "error": (
                "Unable to upload image "
                "to Cloudinary."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_502_BAD_GATEWAY,
        )