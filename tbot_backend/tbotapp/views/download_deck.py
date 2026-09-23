import re

import requests

from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view

from ..models import Decklist, LegacyDecklist, UserDeck


def _download_image(image_url, filename):
    if not image_url:
        return HttpResponse(
            "Deck image is missing.",
            status=404,
            content_type="text/plain",
        )

    try:
        response = requests.get(
            image_url,
            timeout=30,
        )
        response.raise_for_status()
    except requests.RequestException as error:
        return HttpResponse(
            f"Unable to download deck image: {error}",
            status=502,
            content_type="text/plain",
        )

    content_type = response.headers.get(
        "Content-Type",
        "image/webp",
    ).split(";")[0]

    extension = {
        "image/webp": "webp",
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/gif": "gif",
    }.get(
        content_type,
        "webp",
    )

    filename = str(filename or "decklist").strip()

    filename = re.sub(
        r"[^a-zA-Z0-9]+",
        "-",
        filename,
    )

    filename = filename.strip("-").lower()

    if not filename:
        filename = "decklist"

    filename = f"{filename}.{extension}"

    return HttpResponse(
        response.content,
        content_type=content_type,
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            ),
        },
    )


@api_view(["GET"])
def download_deck_image(request, deckid):
    deck = Decklist.objects.filter(
        deckid=deckid,
    ).first()

    if not deck:
        return HttpResponse(
            "Decklist not found.",
            status=404,
            content_type="text/plain",
        )

    return _download_image(
        deck.image,
        f"{deck.deckid}-{deck.name or 'decklist'}",
    )


@api_view(["GET"])
def download_legacy_deck_image(request, deckid):
    deck = LegacyDecklist.objects.filter(
        deckid=deckid,
    ).first()

    if not deck:
        return HttpResponse(
            "Legacy decklist not found.",
            status=404,
            content_type="text/plain",
        )

    return _download_image(
        deck.image,
        f"{deck.deckid}-{deck.name or 'legacy-deck'}",
    )


@api_view(["GET"])
def download_user_deck_image(request, deck_id):
    deck = get_object_or_404(
        UserDeck,
        id=deck_id,
    )

    return _download_image(
        deck.image,
        f"{deck.id}-{deck.name or 'decklist'}",
    )