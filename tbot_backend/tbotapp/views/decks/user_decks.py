import logging

from django.db import DatabaseError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from rest_framework.response import Response

from ...models import (
    UserDeck,
    UserProfile,
    Decklist,
    LegacyDecklist,
)
from ...serializers import UserDeckSerializer
from ..helpers import (
    get_discord_user,
    include_error_detail,
    save_deck_image,
)

logger = logging.getLogger(__name__)
R2_IMAGE_ERROR = "R2 did not return an image URL."
UPLOAD_ERROR = "Unable to upload deck image."
DECK_ERROR = "Deck not found."
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


def _user_deck_error(message, status_code, fields=None):
    payload = {"error": message}

    if fields is not None:
        payload["fields"] = fields

    return Response(payload, status=status_code)


def _prepare_user_deck_data(request):
    creator = str(request.data.get("creator", "")).strip()

    if not creator:
        return None, _user_deck_error(
            "Creator is required.",
            status.HTTP_400_BAD_REQUEST,
            fields=["creator"],
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

    deck_data = {
        field: request.data[field]
        for field in allowed_fields
        if field in request.data
    }

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
        if not str(deck_data.get(field, "")).strip()
    ]

    if missing_fields:
        return None, _user_deck_error(
            "Missing required deck fields.",
            status.HTTP_400_BAD_REQUEST,
            fields=missing_fields,
        )

    deck_data["suggested_date"] = timezone.now()

    image_file = request.FILES.get("image_file")

    if image_file:
        deck_data.pop("image", None)

    return {
        "creator": creator,
        "deck_data": deck_data,
        "image_file": image_file,
    }, None


def _create_user_deck(profile, creator, deck_data):
    try:
        return UserDeck.objects.create(
            profile_id=profile.id,
            creator=creator,
            **deck_data,
        ), None
    except DatabaseError as exc:
        logger.exception("User deck creation failed")

        payload = {
            "error": (
                "Database query failed while "
                "creating user deck."
            ),
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return None, Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def _delete_user_deck_after_upload_failure(deck):
    try:
        deck.delete()
    except Exception:
        logger.exception(
            "Unable to remove deck after R2 upload failure"
        )


def _upload_user_deck_image(deck, image_file):
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
            return _user_deck_error(
                R2_IMAGE_ERROR,
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        deck.image = image_url
        deck.save(update_fields=["image"])

    except Exception as exc:
        logger.exception("R2 user deck image upload failed")
        _delete_user_deck_after_upload_failure(deck)

        payload = {
            "error": UPLOAD_ERROR,
            "error_type": exc.__class__.__name__,
        }

        if include_error_detail():
            payload["detail"] = str(exc)

        return Response(
            payload,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return None


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

    prepared_data, error = _prepare_user_deck_data(request)

    if error:
        return error

    deck, error = _create_user_deck(
        profile,
        prepared_data["creator"],
        prepared_data["deck_data"],
    )

    if error:
        return error

    image_file = prepared_data["image_file"]

    if image_file:
        error = _upload_user_deck_image(deck, image_file)

        if error:
            return error

    serializer = UserDeckSerializer(deck)

    return Response(
        {
            "success": True,
            "deck": serializer.data,
        },
        status=status.HTTP_201_CREATED,
    )


def _user_deck_update_error(
    message,
    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    error_type=None,
    fields=None,
    exc=None,
):
    payload = {"error": message}

    if error_type:
        payload["error_type"] = error_type

    if fields is not None:
        payload["fields"] = fields

    if exc is not None and include_error_detail():
        payload["detail"] = str(exc)

    return Response(payload, status=status_code)


def _upload_user_deck_update_image(deck, update_data, image_file):
    try:
        image_url = save_deck_image(
            image_file,
            deck.id,
            deck_name=update_data.get("name", deck.name),
            side=update_data.get("side", deck.side),
            hero=update_data.get("hero", deck.hero),
            user_deck=True,
        )
    except Exception as exc:
        logger.exception("R2 user deck image replacement failed")
        return _user_deck_update_error(
            UPLOAD_ERROR,
            error_type=exc.__class__.__name__,
            exc=exc,
        )

    if not image_url:
        return _user_deck_update_error(
            R2_IMAGE_ERROR
        )

    update_data["image"] = image_url
    return None


def _save_user_deck_update(deck, update_data):
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
        return _user_deck_update_error(
            "Unable to update deck.",
            status.HTTP_400_BAD_REQUEST,
            fields=serializer.errors,
        )

    now = timezone.now()
    updated_deck = serializer.save(
        modified_at=now,
        updated_date=now,
    )

    return Response(
        {
            "success": True,
            "deck": UserDeckSerializer(updated_deck).data,
        },
        status=status.HTTP_200_OK,
    )


def _handle_user_deck_update_exception(exc, database_error=False):
    if database_error:
        logger.exception("User deck update failed")
        message = "Database query failed while updating user deck."
    else:
        logger.exception("Unexpected user deck update failure")
        message = "Unable to update user deck."

    return _user_deck_update_error(
        message,
        error_type=exc.__class__.__name__,
        exc=exc,
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
        deck = UserDeck.objects.filter(
            id=deck_id,
            profile_id=profile.id,
        ).first()

        if not deck:
            return Response(
                {"error": DECK_ERROR},
                status=status.HTTP_404_NOT_FOUND,
            )

        update_data = request.data.copy()
        image_file = request.FILES.get("image_file")

        for field in ("image_file", "suggested_date", "updated_date"):
            update_data.pop(field, None)

        if image_file:
            error = _upload_user_deck_update_image(
                deck,
                update_data,
                image_file,
            )
            if error:
                return error

        return _save_user_deck_update(deck, update_data)

    except DatabaseError as exc:
        return _handle_user_deck_update_exception(
            exc,
            database_error=True,
        )

    except Exception as exc:
        return _handle_user_deck_update_exception(exc)

@api_view(["PATCH"])
def _user_deck_update_error(
    message,
    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    error_type=None,
    fields=None,
    exc=None,
):
    payload = {"error": message}

    if error_type:
        payload["error_type"] = error_type

    if fields is not None:
        payload["fields"] = fields

    if exc is not None and include_error_detail():
        payload["detail"] = str(exc)

    return Response(payload, status=status_code)


def _upload_user_deck_replacement_image(deck, image_file, update_data):
    side = update_data.get("side", deck.side)
    hero = update_data.get("hero", deck.hero)
    deck_name = update_data.get("name", deck.name)

    try:
        image_url = save_deck_image(
            image_file,
            deck.id,
            deck_name=deck_name,
            side=side,
            hero=hero,
            user_deck=True,
        )
    except Exception as exc:
        logger.exception("R2 user deck image replacement failed")
        return None, _user_deck_update_error(
            UPLOAD_ERROR,
            error_type=exc.__class__.__name__,
            exc=exc,
        )

    if not image_url:
        return None, _user_deck_update_error(
            R2_IMAGE_ERROR
        )

    update_data["image"] = image_url
    return update_data, None


def _validate_user_deck_update(deck, update_data):
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
        return None, _user_deck_update_error(
            "Unable to update deck.",
            status.HTTP_400_BAD_REQUEST,
            fields=serializer.errors,
        )

    now = timezone.now()
    updated_deck = serializer.save(
        modified_at=now,
        updated_date=now,
    )

    return updated_deck, None


def _user_deck_update_exception(exc, database_error=False):
    if database_error:
        logger.exception("User deck update failed")
        message = "Database query failed while updating user deck."
    else:
        logger.exception("Unexpected user deck update failure")
        message = "Unable to update user deck."

    return _user_deck_update_error(
        message,
        error_type=exc.__class__.__name__,
        exc=exc,
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
        deck = UserDeck.objects.filter(
            id=deck_id,
            profile_id=profile.id,
        ).first()

        if not deck:
            return Response(
                {"error": DECK_ERROR},
                status=status.HTTP_404_NOT_FOUND,
            )

        update_data = request.data.copy()
        image_file = request.FILES.get("image_file")

        update_data.pop("image_file", None)
        update_data.pop("suggested_date", None)
        update_data.pop("updated_date", None)

        if image_file:
            update_data, error = _upload_user_deck_replacement_image(
                deck,
                image_file,
                update_data,
            )
            if error:
                return error

        updated_deck, error = _validate_user_deck_update(
            deck,
            update_data,
        )

        if error:
            return error

        return Response(
            {
                "success": True,
                "deck": UserDeckSerializer(updated_deck).data,
            },
            status=status.HTTP_200_OK,
        )

    except DatabaseError as exc:
        return _user_deck_update_exception(
            exc,
            database_error=True,
        )

    except Exception as exc:
        return _user_deck_update_exception(exc)


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
                    "error": DECK_ERROR,
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
@api_view(["GET"])
def public_user_decks_count(request):
    try:
        public_profile_ids = UserProfile.objects.filter(
            is_public=True
        ).values_list(
            "id",
            flat=True,
        )

        deck_count = UserDeck.objects.filter(
            profile_id__in=public_profile_ids
        ).count()

        return Response(
            {
                "success": True,
                "count": deck_count,
            },
            status=status.HTTP_200_OK,
        )
    except DatabaseError as exc:
        logger.exception(
            "Unable to load public user deck count"
        )

        return Response(
            {
                "error": "Unable to load public user deck count.",
                "error_type": exc.__class__.__name__,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
@api_view(["GET"])
def public_user_decks(request):
    try:
        profiles = UserProfile.objects.filter(
            is_public=True
        ).only(
            "id",
            "profile_slug",
            "display_name",
            "avatar",
        )

        profiles_by_id = {
            profile.id: profile
            for profile in profiles
        }

        decks = UserDeck.objects.filter(
            profile_id__in=profiles_by_id.keys()
        ).order_by("-id")

        serialized_decks = UserDeckSerializer(
            decks,
            many=True,
        ).data

        results = []

        for deck, serialized in zip(decks, serialized_decks):
            profile = profiles_by_id.get(deck.profile_id)

            if not profile:
                continue

            results.append({
                **dict(serialized),
                "profile": {
                    "profile_slug": profile.profile_slug,
                    "display_name": profile.display_name,
                    "avatar": profile.avatar,
                },
            })

        return Response({
            "success": True,
            "decks": results,
            "count": len(results),
        }, status=status.HTTP_200_OK)

    except DatabaseError as exc:
        logger.exception(
            "Unable to load public user decks"
        )

        return Response({
            "error": "Unable to load public user decks.",
            "error_type": exc.__class__.__name__,
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)