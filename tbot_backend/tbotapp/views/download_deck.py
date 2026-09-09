import mimetypes
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
    )

    filename = deck.image.split("/")[-1].split("?")[0]

    return HttpResponse(
        response.content,
        content_type=content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )