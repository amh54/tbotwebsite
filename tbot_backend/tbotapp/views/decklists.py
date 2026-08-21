import logging

from django.db import DatabaseError

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import Decklist, LegacyDecklist
from ..serializers import (
    PublicDeckSerializer,
    PublicLegacyDeckSerializer,
)
from .helpers import include_error_detail


logger = logging.getLogger(__name__)


# ============================================================
# PUBLIC DECKLISTS
# ============================================================

@api_view(["GET"])
def decklists(request):
    try:
        decks = (
            Decklist.objects
            .all()
            .order_by(
                "side",
                "hero",
                "name",
            )
        )

        serializer = PublicDeckSerializer(
            decks,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "Decklist query failed"
        )

        payload = {
            "error": (
                "Database query failed for decklists."
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
# PUBLIC LEGACY DECKLISTS
# ============================================================

@api_view(["GET"])
def legacy_decklists(request):
    try:
        decks = (
            LegacyDecklist.objects
            .all()
            .order_by(
                "side",
                "hero",
                "name",
            )
        )

        serializer = PublicLegacyDeckSerializer(
            decks,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "Legacy decklist query failed"
        )

        payload = {
            "error": (
                "Database query failed for "
                "legacy decklists."
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
# DECKLIST COUNT
# ============================================================

@api_view(["GET"])
def decklist_count(request):
    try:
        total = Decklist.objects.count()

        return Response(
            {
                "count": total,
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "Decklist count query failed"
        )

        payload = {
            "error": (
                "Database query failed for "
                "decklist count."
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
# LEGACY DECKLIST COUNT
# ============================================================

@api_view(["GET"])
def legacy_decklist_count(request):
    try:
        total = LegacyDecklist.objects.count()

        return Response(
            {
                "count": total,
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "Legacy decklist count query failed"
        )

        payload = {
            "error": (
                "Database query failed for "
                "legacy decklist count."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )