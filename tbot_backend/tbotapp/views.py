import logging
import os

from django.conf import settings
from django.db import DatabaseError, connection
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Decklist, WebCards, KeepOrScrap
from .serializers import (
    DeckSerializer,
    WebCardSerializer,
    KeepOrScrapSerializer,
)

logger = logging.getLogger(__name__)


def include_error_detail():
    return settings.DEBUG or str(
        os.getenv("API_ERROR_DETAILS", "")
    ).strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


# ============================================================
# DECKLISTS
# ============================================================

@api_view(["GET"])
def decklists(request):
    try:
        # Temporary Neon database diagnostic.
        # This can be removed after the database connection
        # has been confirmed.
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    current_database(),
                    current_schema(),
                    current_user
            """)

            db_info = cursor.fetchone()

            cursor.execute("""
                SELECT to_regclass('public.web_decks')
            """)

            web_decks = cursor.fetchone()

        print("====================================")
        print("DATABASE INFO:", db_info)
        print("WEB_DECKS:", web_decks)
        print("====================================")

        decks = Decklist.objects.all()

        serializer = DeckSerializer(
            decks,
            many=True,
        )

        return Response(serializer.data)

    except DatabaseError as exc:
        logger.exception("Decklist query failed")

        payload = {
            "error": "Database query failed for decklists.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================================
# CARDS
# ============================================================

@api_view(["GET"])
def card_info(request):
    try:
        cards = WebCards.objects.all()

        serializer = WebCardSerializer(
            cards,
            many=True,
        )

        return Response(serializer.data)

    except DatabaseError as exc:
        logger.exception("Card information query failed")

        payload = {
            "error": "Database query failed for card information.",
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
        heroes = WebCards.objects.filter(
            set_rarity__icontains="Hero"
        )

        serializer = WebCardSerializer(
            heroes,
            many=True,
        )

        return Response({
            "count": heroes.count(),
            "results": serializer.data,
        })

    except DatabaseError as exc:
        logger.exception("Hero information query failed")

        payload = {
            "error": "Database query failed for hero information.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================================
# KEEP OR SCRAP
# ============================================================

@api_view(["GET"])
def keep_or_scrap(request):
    try:
        rows = KeepOrScrap.objects.all()

        serializer = KeepOrScrapSerializer(
            rows,
            many=True,
        )

        return Response(serializer.data)

    except DatabaseError as exc:
        logger.exception("Keep or Scrap query failed")

        payload = {
            "error": "Database query failed for keep or scrap.",
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

        return Response({
            "count": total,
        })

    except DatabaseError as exc:
        logger.exception("Decklist count query failed")

        payload = {
            "error": "Database query failed for decklist count.",
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

        return Response({
            "count": total,
        })

    except DatabaseError as exc:
        logger.exception("Card count query failed")

        payload = {
            "error": "Database query failed for card count.",
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
def keeporscrap_count(request):
    try:
        count = KeepOrScrap.objects.count()

        return Response({
            "count": count,
        })

    except DatabaseError as exc:
        logger.exception("Keep or Scrap count query failed")

        payload = {
            "error": "Database error while counting Keep or Scrap entries.",
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
        count = WebCards.objects.filter(
            set_rarity__icontains="Hero"
        ).count()

        return Response({
            "count": count,
        })

    except DatabaseError as exc:
        logger.exception("Hero count query failed")

        payload = {
            "error": "Database error while retrieving hero count.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )