
import re

import requests
from django.http import HttpResponse
from rest_framework.decorators import api_view

from ..models import Decklist


@api_view(["GET"])
def download_deck_image(request, deckid):
    deck = Decklist.objects.filter(deckid=deckid).first()

    if not deck or not deck.image:
        return HttpResponse(status=404)

    try:
        response = requests.get(deck.image, timeout=30)
        response.raise_for_status()
    except requests.RequestException:
        return HttpResponse(status=502)

    content_type = response.headers.get(
        "Content-Type",
        "image/webp",
    ).split(";")[0]

    extension = {
        "image/webp": "webp",
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/gif": "gif",
    }.get(content_type, "webp")

    filename = str(deck.name or "decklist").strip()
    filename = re.sub(r"[^a-zA-Z0-9]+", "-", filename)
    filename = filename.strip("-").lower()

    if not filename:
        filename = "decklist"

    filename = f"{deck.deckid}-{filename}.{extension}"

    return HttpResponse(
        response.content,
        content_type=content_type,
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            ),
        },
    )
