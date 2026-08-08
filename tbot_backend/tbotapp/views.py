from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Decklist, ZombieCards
from .serializers import (
    DeckSerializer,
    ZombieCardSerializer
)


@api_view(["GET"])
def decklists(request):
    decks = Decklist.objects.all()

    serializer = DeckSerializer(
        decks,
        many=True
    )

    return Response(serializer.data)
@api_view(["GET"])
def card_information(request):

    cards = ZombieCards.objects.all()


    serializer = ZombieCardSerializer(
        cards,
        many=True
    )


    return Response(serializer.data)
