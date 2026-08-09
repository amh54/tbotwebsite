import logging
import os

from django.conf import settings
from django.db import DatabaseError
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Decklist, ZombieCards
from .serializers import (
    DeckSerializer,
    ZombieCardSerializer
)


logger = logging.getLogger(__name__)


def include_error_detail():
    return settings.DEBUG or str(os.getenv("API_ERROR_DETAILS", "")).strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


@api_view(["GET"])
def decklists(request):
    try:
        decks = Decklist.objects.all()

        serializer = DeckSerializer(
            decks,
            many=True
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
        return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def card_information(request):
    try:
        cards = ZombieCards.objects.all()

        serializer = ZombieCardSerializer(
            cards,
            many=True
        )

        return Response(serializer.data)
    except DatabaseError as exc:
        logger.exception("Card query failed")
        payload = {
            "error": "Database query failed for card information.",
            "error_type": exc.__class__.__name__,
        }
        if include_error_detail():
            payload["detail"] = str(exc)
        return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
