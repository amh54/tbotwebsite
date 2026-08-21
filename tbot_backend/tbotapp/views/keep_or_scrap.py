import logging

from django.db import DatabaseError

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import KeepOrScrap
from ..serializers import KeepOrScrapSerializer
from .helpers import include_error_detail


logger = logging.getLogger(__name__)


# ============================================================
# KEEP OR SCRAP
# ============================================================

@api_view(["GET"])
def keep_or_scrap(request):
    try:
        queryset = (
            KeepOrScrap.objects
            .all()
            .order_by(
                "side",
                "card_class",
                "tierid",
            )
        )

        side = request.GET.get("side")
        card_class = request.GET.get("class")

        if side:
            queryset = queryset.filter(
                side__iexact=side.strip()
            )

        if card_class:
            queryset = queryset.filter(
                card_class__iexact=card_class.strip()
            )

        serializer = KeepOrScrapSerializer(
            queryset,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "Keep or Scrap query failed"
        )

        payload = {
            "error": (
                "Database query failed for "
                "Keep or Scrap."
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
# KEEP OR SCRAP COUNT
# ============================================================

@api_view(["GET"])
def keep_or_scrap_count(request):
    try:
        queryset = KeepOrScrap.objects.all()

        side = request.GET.get("side")
        card_class = request.GET.get("class")

        if side:
            queryset = queryset.filter(
                side__iexact=side.strip()
            )

        if card_class:
            queryset = queryset.filter(
                card_class__iexact=card_class.strip()
            )

        return Response(
            {
                "count": queryset.count(),
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "Keep or Scrap count query failed"
        )

        payload = {
            "error": (
                "Database query failed for "
                "Keep or Scrap count."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )