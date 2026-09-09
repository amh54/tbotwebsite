
import logging
import os
import re

import boto3

from django.db import DatabaseError

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import WebCards
from ..serializers import WebCardSerializer
from .helpers import include_error_detail
from .permissions import is_discord_owner


logger = logging.getLogger(__name__)


R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "").strip()
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "").strip()
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "").strip()
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "").strip()
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "").strip().rstrip("/")

MAX_IMAGE_SIZE = 10 * 1024 * 1024

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
        raise RuntimeError(
            "R2 storage is not configured correctly."
        )

    return boto3.client(
        "s3",
        endpoint_url=(
            f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
        ),
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


def _slugify(value):
    value = str(value or "").strip().lower()

    value = re.sub(
        r"[^a-z0-9]+",
        "-",
        value,
    )

    return value.strip("-")


def _normalize_side(value):
    value = str(value or "").strip().lower()

    if value in {"plant", "plants"}:
        return "plants"

    if value in {"zombie", "zombies"}:
        return "zombies"

    return _slugify(value) or "other"


def _normalize_class(value):
    return _slugify(value) or "other"


def _get_extension(image):
    extension = os.path.splitext(
        getattr(image, "name", "")
    )[1].lower()

    if extension in CONTENT_TYPES:
        return extension

    content_type = (
        getattr(image, "content_type", "") or ""
    ).lower()

    for ext, allowed_type in CONTENT_TYPES.items():
        if content_type == allowed_type:
            return ext

    raise ValueError(
        "Unsupported image type. Use JPEG, PNG, WebP, or GIF."
    )


def _upload_card_image(
    image,
    side,
    card_class,
    card_name,
):
    if not image:
        raise ValueError("No image was provided.")

    if not getattr(image, "size", 0):
        raise ValueError("Image is empty.")

    if image.size > MAX_IMAGE_SIZE:
        raise ValueError(
            "Image is too large. Maximum size is 10 MB."
        )

    extension = _get_extension(image)

    side_slug = _normalize_side(side)
    class_slug = _normalize_class(card_class)
    card_slug = _slugify(card_name)

    if not card_slug:
        raise ValueError("Card name is required.")

    filename = f"{card_slug}{extension}"

    key = (
        f"cards/"
        f"{side_slug}/"
        f"{class_slug}/"
        f"{filename}"
    )

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


@api_view(["GET", "PATCH", "DELETE"])
def admin_card_detail(request, cardid):
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

        if request.method == "GET":
            serializer = WebCardSerializer(card)

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        if request.method == "DELETE":
            card.delete()

            return Response(
                {
                    "success": True,
                    "message": "Card deleted.",
                },
                status=status.HTTP_200_OK,
            )

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

    image = request.FILES.get("image")

    if not image:
        return Response(
            {
                "error": "No image was provided.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    card_name = str(
        request.data.get(
            "card_name",
            "",
        )
    ).strip()

    if not card_name:
        return Response(
            {
                "error": "Card name is required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        card = (
            WebCards.objects
            .filter(card_name=card_name)
            .first()
        )

        if not card:
            return Response(
                {
                    "error": (
                        f"Card '{card_name}' was not found."
                    ),
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        side = str(
            getattr(card, "side", "") or ""
        ).strip()

        card_class = str(
            getattr(card, "card_type", "") or ""
        ).strip()

        if not side:
            return Response(
                {
                    "error": (
                        f"Card '{card_name}' has no side configured."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not card_class:
            return Response(
                {
                    "error": (
                        f"Card '{card_name}' has no card class configured."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        secure_url, key = _upload_card_image(
            image=image,
            side=side,
            card_class=card_class,
            card_name=card_name,
        )

        return Response(
            {
                "success": True,
                "url": secure_url,
                "secure_url": secure_url,
                "key": key,
                "card_name": card_name,
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "Database error during R2 card image upload."
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

    except ValueError as exc:
        return Response(
            {
                "error": str(exc),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Exception as exc:
        logger.exception(
            "R2 card image upload failed."
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
