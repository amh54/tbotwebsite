import logging

from django.db import DatabaseError

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import WebCards
from ..serializers import WebCardSerializer
from .helpers import include_error_detail


logger = logging.getLogger(__name__)


# ============================================================
# CARD INFORMATION
# ============================================================

@api_view(["GET"])
def card_info(request):
    try:
        cards = WebCards.objects.all()

        serializer = WebCardSerializer(
            cards,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "Card information query failed"
        )

        payload = {
            "error": (
                "Database query failed for "
                "card information."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================================
# HERO INFORMATION
# ============================================================

@api_view(["GET"])
def heroinfo(request):
    try:
        heroes = (
            WebCards.objects
            .filter(
                set_rarity__icontains="Hero"
            )
        )

        serializer = WebCardSerializer(
            heroes,
            many=True,
        )

        return Response(
            {
                "count": heroes.count(),
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "Hero information query failed"
        )

        payload = {
            "error": (
                "Database query failed for "
                "hero information."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================================
# CARD COUNT
# ============================================================

@api_view(["GET"])
def card_count(request):
    try:
        total = WebCards.objects.count()

        return Response(
            {
                "count": total,
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "Card count query failed"
        )

        payload = {
            "error": (
                "Database query failed for "
                "card count."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================================
# HERO COUNT
# ============================================================

@api_view(["GET"])
def hero_count(request):
    try:
        count = (
            WebCards.objects
            .filter(
                set_rarity__icontains="Hero"
            )
            .count()
        )

        return Response(
            {
                "count": count,
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "Hero count query failed"
        )

        payload = {
            "error": (
                "Database error while "
                "retrieving hero count."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )