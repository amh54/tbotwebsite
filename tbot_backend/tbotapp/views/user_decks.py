import logging

from django.db import DatabaseError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from rest_framework.response import Response

from ..models import (
    UserDeck,
    UserProfile,
    SavedDeck,
    Decklist,
    LegacyDecklist,
)
from ..serializers import UserDeckSerializer
from .helpers import (
    get_discord_user,
    include_error_detail,
    save_deck_image,
)

logger = logging.getLogger(__name__)
logger.warning(
    "[User Decks Module] user_decks.py LOADED"
)

def get_current_profile(request):
    discord_user = get_discord_user(request)

    if not discord_user:
        return None, Response(
            {
                "authenticated": False,
                "error": "Authentication required.",
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    discord_id = str(discord_user["id"])

    profile = (
        UserProfile.objects
        .filter(
            discord_id=discord_id,
        )
        .first()
    )

    if not profile:
        return None, Response(
            {
                "authenticated": True,
                "profile_exists": False,
                "error": "Profile not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    return profile, None


@api_view(["GET"])
def user_decks(request):
    profile, error = get_current_profile(request)

    if error:
        return error

    try:
        decks = (
            UserDeck.objects
            .filter(
                profile_id=profile.id,
            )
            .order_by("-id")
        )

        serializer = UserDeckSerializer(
            decks,
            many=True,
        )

        return Response(
            {
                "success": True,
                "decks": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "Unable to load user decks"
        )

        payload = {
            "error": (
                "Database query failed while "
                "loading user decks."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def public_profile_decks_count(
    request,
    profile_slug,
):
    profile = get_object_or_404(
        UserProfile,
        profile_slug=profile_slug,
    )

    discord_user = get_discord_user(request)

    is_owner = (
        discord_user is not None
        and str(discord_user["id"])
        == str(profile.discord_id)
    )

    if not profile.is_public and not is_owner:
        return Response(
            {
                "error": "This profile is private.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    deck_count = UserDeck.objects.filter(
        profile_id=profile.id
    ).count()

    return Response(
        {
            "success": True,
            "deck_count": deck_count,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@parser_classes([
    JSONParser,
    FormParser,
    MultiPartParser,
])
def user_deck_create(request):
    profile, error = get_current_profile(request)

    if error:
        return error

    creator = str(
        request.data.get("creator", "")
    ).strip()

    if not creator:
        return Response(
            {
                "error": "Creator is required.",
                "fields": ["creator"],
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    allowed_fields = {
        "name",
        "hero",
        "side",
        "category",
        "archetype",
        "description",
        "image",
        "cost",
        "aliases",
        "cards",
        "inspiration",
        "optimization",
        "deck_doc",
    }

    deck_data = {}

    for field in allowed_fields:
        if field in request.data:
            deck_data[field] = request.data[field]

    required_fields = {
        "name",
        "hero",
        "side",
        "category",
        "archetype",
    }

    missing_fields = [
        field
        for field in required_fields
        if not str(
            deck_data.get(field, "")
        ).strip()
    ]

    if missing_fields:
        return Response(
            {
                "error": "Missing required deck fields.",
                "fields": missing_fields,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    deck_data["suggested_date"] = timezone.now()

    image_file = request.FILES.get("image_file")

    if image_file:
        deck_data.pop("image", None)

    try:
        deck = UserDeck.objects.create(
            profile_id=profile.id,
            creator=creator,
            **deck_data,
        )

    except DatabaseError as exc:
        logger.exception(
            "User deck creation failed"
        )

        payload = {
            "error": (
                "Database query failed while "
                "creating user deck."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if image_file:
        try:
            image_url = save_deck_image(
    image_file,
    deck.id,
    deck_name=deck.name,
    side=deck.side,
    hero=deck.hero,
    user_deck=True,
)

            if not image_url:
                deck.delete()

                return Response(
                    {
                        "error": (
                            "R2 did not return "
                            "an image URL."
                        ),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            deck.image = image_url

            deck.save(
                update_fields=["image"]
            )

        except Exception as exc:
            logger.exception(
                "R2 user deck image upload failed"
            )

            try:
                deck.delete()
            except Exception:
                logger.exception(
                    "Unable to remove deck after "
                    "R2 upload failure"
                )

            payload = {
                "error": (
                    "Unable to upload deck image."
                ),
                "error_type": exc.__class__.__name__,
            }

            if include_error_detail():
                payload["detail"] = str(exc)

            return Response(
                payload,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    serializer = UserDeckSerializer(deck)

    return Response(
        {
            "success": True,
            "deck": serializer.data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["PATCH"])
@parser_classes([
    JSONParser,
    FormParser,
    MultiPartParser,
])
def user_deck_update(request, deck_id):
    profile, error = get_current_profile(request)
    if error:
        return error

    try:
        deck = (
            UserDeck.objects
            .filter(
                id=deck_id,
                profile_id=profile.id,
            )
            .first()
        )

        if not deck:
            return Response(
                {
                    "error": "Deck not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        update_data = request.data.copy()

        image_file = request.FILES.get("image_file")

        update_data.pop("image_file", None)
        update_data.pop("suggested_date", None)
        update_data.pop("updated_date", None)

        if image_file:
            side = update_data.get(
                "side",
                deck.side,
            )

            hero = update_data.get(
                "hero",
                deck.hero,
            )

            deck_name = update_data.get(
                "name",
                deck.name,
            )

            try:
                image_url = save_deck_image(
                    image_file,
                    deck.id,
                    deck_name=deck_name,
                    side=side,
                    hero=hero,
                    user_deck=True,
                )

                if not image_url:
                    return Response(
                        {
                            "error": (
                                "R2 did not return "
                                "an image URL."
                            ),
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

                update_data["image"] = image_url

            except Exception as exc:
                logger.exception(
                    "R2 user deck image replacement failed"
                )

                payload = {
                    "error": (
                        "Unable to upload deck image."
                    ),
                    "error_type": (
                        exc.__class__.__name__
                    ),
                }

                if include_error_detail():
                    payload["detail"] = str(exc)

                return Response(
                    payload,
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        serializer = UserDeckSerializer(
            deck,
            data=update_data,
            partial=True,
        )

        if not serializer.is_valid():
            logger.error(
                "User deck serializer validation failed: %s",
                serializer.errors,
            )

            return Response(
                {
                    "error": "Unable to update deck.",
                    "fields": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated_deck = serializer.save(
            updated_date=timezone.now()
        )
        return Response(
            {
                "success": True,
                "deck": UserDeckSerializer(
                    updated_deck
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "User deck update failed"
        )

        payload = {
            "error": (
                "Database query failed while "
                "updating user deck."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    except Exception as exc:
        logger.exception(
            "Unexpected user deck update failure"
        )

        payload = {
            "error": "Unable to update user deck.",
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["DELETE"])
def user_deck_delete(request, deck_id):
    profile, error = get_current_profile(request)

    if error:
        return error

    try:
        deck = (
            UserDeck.objects
            .filter(
                id=deck_id,
                profile_id=profile.id,
            )
            .first()
        )

        if not deck:
            return Response(
                {
                    "error": "Deck not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        deck.delete()

        return Response(
            {
                "success": True,
                "message": (
                    "Deck deleted successfully."
                ),
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "User deck deletion failed"
        )

        payload = {
            "error": (
                "Database query failed while "
                "deleting user deck."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def shared_user_deck(
    request,
    profile_slug,
    source_type,
    deck_id,
):
    try:
        profile = (
            UserProfile.objects
            .filter(profile_slug=profile_slug)
            .first()
        )

        if not profile:
            return Response(
                {
                    "error": "Profile not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        normalized_source_type = str(
            source_type or ""
        ).strip().lower()

        try:
            source_id = int(deck_id)

        except (TypeError, ValueError):
            return Response(
                {
                    "error": "Invalid deck ID.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if normalized_source_type == "user":
            source_deck = (
                UserDeck.objects
                .filter(id=source_id)
                .first()
            )

            resolved_source_type = "user_deck"

        elif normalized_source_type == "deck":
            source_deck = (
                Decklist.objects
                .filter(deckid=source_id)
                .first()
            )

            resolved_source_type = "decklist"

        elif normalized_source_type == "legacy":
            source_deck = (
                LegacyDecklist.objects
                .filter(deckid=source_id)
                .first()
            )

            resolved_source_type = "legacy"

        else:
            return Response(
                {
                    "error": "Invalid deck source type.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not source_deck:
            logger.warning(
                "Shared deck not found: profile=%s source_type=%s source_id=%s",
                profile_slug,
                normalized_source_type,
                source_id,
            )

            return Response(
                {
                    "error": "Shared deck not found.",
                    "profile_slug": profile_slug,
                    "source_type": normalized_source_type,
                    "source_id": source_id,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if resolved_source_type == "user_deck":
            deck_data = {
                "id": source_deck.id,
                "deckid": source_deck.id,
                "source_deck_id": source_deck.id,
                "source_type": "user_deck",
                "name": source_deck.name,
                "hero": source_deck.hero,
                "side": source_deck.side,
                "category": source_deck.category,
                "archetype": source_deck.archetype,
                "creator": source_deck.creator,
                "description": source_deck.description,
                "image": source_deck.image,
                "cost": source_deck.cost,
                "aliases": source_deck.aliases,
                "cards": source_deck.cards,
                "inspiration": source_deck.inspiration,
                "optimization": source_deck.optimization,
                "deck_doc": source_deck.deck_doc,
                "suggested_date": source_deck.suggested_date,
                "updated_date": source_deck.updated_date,
            }

        else:
            deck_data = {
                "id": source_deck.deckid,
                "deckid": source_deck.deckid,
                "source_deck_id": source_deck.deckid,
                "source_type": resolved_source_type,
                "name": source_deck.name,
                "hero": source_deck.hero,
                "side": source_deck.side,
                "category": source_deck.category,
                "archetype": source_deck.archetype,
                "creator": source_deck.creator,
                "description": source_deck.description,
                "image": source_deck.image,
                "cost": source_deck.cost,
                "aliases": source_deck.aliases,
                "cards": source_deck.cards,
                "inspiration": source_deck.inspiration,
                "optimization": source_deck.optimization,
                "deck_doc": source_deck.deck_doc,
                "suggested_date": source_deck.suggested_date,
                "updated_date": source_deck.updated_date,
            }

        return Response(
            {
                "success": True,
                "deck": deck_data,
                "profile": {
                    "id": profile.id,
                    "profile_slug": profile.profile_slug,
                    "display_name": profile.display_name,
                    "avatar": profile.avatar,
                    "is_public": profile.is_public,
                },
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        logger.exception(
            "Unable to load shared deck"
        )

        payload = {
            "error": (
                "Database query failed while "
                "loading shared deck."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )