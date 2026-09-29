from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.response import Response
from ..models import UserDeckSuggestion, Decklist
from .helpers import get_discord_user
from .permissions import is_discord_owner


VALID_STATUSES = {
    "pending",
    "reviewing",
    "planned",
    "completed",
    "declined",
}


def _iso(value):
    if not value:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _format_deck_date(value):
    if not value:
        return ""

    if hasattr(value, "month") and hasattr(value, "day") and hasattr(value, "year"):
        return f"{value.month}/{value.day}/{value.year % 100:02d}"

    raw = str(value).strip()

    if not raw:
        return ""

    try:
        date_part = raw.split("T", 1)[0].split(" ", 1)[0]
        year, month, day = date_part.split("-")[:3]
        return f"{int(month)}/{int(day)}/{int(year) % 100:02d}"
    except (ValueError, TypeError):
        return raw


def serialize_user_deck_suggestion(suggestion):
    return {
        "id": suggestion.id,
        "deck_id": suggestion.deck_id,
        "deck_name": suggestion.deck_name,
        "hero": suggestion.hero,
        "side": suggestion.side,
        "category": suggestion.category,
        "archetype": suggestion.archetype,
        "creator": suggestion.creator,
        "description": suggestion.description,
        "image": suggestion.image,
        "cost": suggestion.cost,
        "aliases": suggestion.aliases,
        "cards": suggestion.cards,
        "inspiration": suggestion.inspiration,
        "optimization": suggestion.optimization,
        "suggested_date": _format_deck_date(suggestion.suggested_date),
        "updated_date": _format_deck_date(suggestion.updated_date),
        "deck_doc": suggestion.deck_doc,
        "suggested_by_discord_id": suggestion.suggested_by_discord_id,
        "suggested_by_profile_id": suggestion.suggested_by_profile_id,
        "suggested_by_username": suggestion.suggested_by_username,
        "suggested_by_display_name": suggestion.suggested_by_display_name,
        "suggested_by_profile_slug": suggestion.suggested_by_profile_slug,
        "suggested_by_avatar": suggestion.suggested_by_avatar,
        "discord_thread_url": suggestion.discord_thread_url,
        "status": suggestion.status,
        "consent_type": suggestion.consent_type,
        "consent_status": suggestion.consent_status,
        "consent_given_at": _iso(suggestion.consent_given_at),
        "consent_denied_at": _iso(suggestion.consent_denied_at),
        "created_at": _iso(suggestion.created_at),
        "updated_at": _iso(suggestion.updated_at),
        "published_deckid": suggestion.published_deckid,
    }


def _owner_denied_response():
    return Response(
        {
            "authorized": False,
            "error": "Owner access required.",
        },
        status=status.HTTP_403_FORBIDDEN,
    )


@api_view(["GET"])
@authentication_classes([])
@permission_classes([])
def my_user_deck_suggestions(request):
    discord_user = get_discord_user(request)

    if not discord_user:
        return Response(
            {"detail": "You must be logged in with Discord."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    suggestions = (
        UserDeckSuggestion.objects
        .filter(
            suggested_by_discord_id=str(discord_user["id"])
        )
        .order_by("-created_at")
    )

    return Response(
        [serialize_user_deck_suggestion(s) for s in suggestions],
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def admin_user_deck_suggestions(request):
    if not is_discord_owner(request):
        return _owner_denied_response()

    suggestions = UserDeckSuggestion.objects.order_by("-created_at")

    return Response(
        [serialize_user_deck_suggestion(s) for s in suggestions],
        status=status.HTTP_200_OK,
    )


@api_view(["PATCH", "DELETE"])
def admin_user_deck_suggestion_detail(request, suggestion_id):
    if not is_discord_owner(request):
        return Response(
            {
                "authorized": False,
                "error": "Owner access required.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    suggestion = (
        UserDeckSuggestion.objects
        .filter(id=suggestion_id)
        .first()
    )

    if not suggestion:
        return Response(
            {"detail": "That deck suggestion could not be found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "DELETE":
        suggestion.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    new_status = str(
        request.data.get("status", "")
    ).strip().lower()

    if new_status not in VALID_STATUSES:
        return Response(
            {"detail": "Invalid status."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        with transaction.atomic():
            if (
                new_status == "completed"
                and not suggestion.published_deckid
            ):
                latest_deck = (
                    Decklist.objects
                    .select_for_update()
                    .order_by("-deckid")
                    .first()
                )

                next_deck_id = (
                    latest_deck.deckid + 1
                    if latest_deck
                    else 1
                )

                published_deck = Decklist.objects.create(
                    deckid=next_deck_id,
                    side=suggestion.side,
                    hero=suggestion.hero,
                    name=suggestion.deck_name,
                    category=suggestion.category,
                    archetype=suggestion.archetype,
                    description=suggestion.description,
                    deck_doc=suggestion.deck_doc,
                    image=suggestion.image,
                    creator=suggestion.creator,
                    optimization=suggestion.optimization,
                    inspiration=suggestion.inspiration,
                    cost=suggestion.cost,
                    aliases=suggestion.aliases,
                    cards=suggestion.cards,
                    suggested_date=_format_deck_date(
                        suggestion.suggested_date
                    ),
                    updated_date="",
                )

                suggestion.published_deckid = published_deck.deckid

            suggestion.status = new_status
            suggestion.updated_at = timezone.now()

            update_fields = [
                "status",
                "updated_at",
            ]

            if new_status == "completed":
                update_fields.append("published_deckid")

            suggestion.save(update_fields=update_fields)

    except Exception as exc:
        return Response(
            {
                "detail": "The suggestion status could not be updated.",
                "error": str(exc),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        serialize_user_deck_suggestion(suggestion),
        status=status.HTTP_200_OK,
    )