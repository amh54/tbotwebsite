from django.db import IntegrityError

from django.shortcuts import get_object_or_404

from rest_framework import status

from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)

from rest_framework.response import Response

from ..models import UserProfile, UserDeck, UserCard

from ..serializers import (
    UserProfileSerializer,
    UserDeckSerializer,
)

from .helpers import get_discord_user


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
        .filter(discord_id=discord_id)
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
def profile_me(request):
    profile, error = get_current_profile(request)

    if error:
        return error

    serializer = UserProfileSerializer(profile)

    return Response(
        {
            "authenticated": True,
            "profile_exists": True,
            "profile": serializer.data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def profile_detail(request, profile_slug):
    profile = get_object_or_404(
    UserProfile,
    profile_slug__iexact=profile_slug.strip(),
)

    discord_user = get_discord_user(request)

    is_owner = (
        discord_user is not None
        and str(discord_user["id"]) == str(profile.discord_id)
    )

    is_site_owner = False

    if discord_user:
        discord_username = str(
            discord_user.get(
                "username",
                "",
            )
        )

        is_site_owner = (
            discord_username == f"discord_{profile.discord_id}"
            and str(discord_user["id"]) == str(profile.discord_id)
        )

    deck_count = UserDeck.objects.filter(
        profile_id=profile.id
    ).count()

    card_count = UserCard.objects.filter(
        profile_id=profile.id
    ).count()

    serializer = UserProfileSerializer(profile)

    return Response(
        {
            "profile": serializer.data,
            "deck_count": deck_count,
            "card_count": card_count,
            "is_owner": is_owner,
            "is_site_owner": is_site_owner,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def public_profiles(request):
    profiles = (
        UserProfile.objects
        .filter(is_public=True)
        .order_by(
            "display_name",
            "id",
        )
    )

    serializer = UserProfileSerializer(
        profiles,
        many=True,
    )

    return Response(
        {
            "success": True,
            "profiles": serializer.data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def public_profile_count(request):
    user_count = UserProfile.objects.filter(
        is_public=True
    ).count()

    return Response(
        {
            "success": True,
            "count": user_count,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def public_profile_decks(request, profile_slug):
    profile = get_object_or_404(
    UserProfile,
    profile_slug__iexact=profile_slug.strip(),
)

    discord_user = get_discord_user(request)

    is_owner = (
        discord_user is not None
        and str(discord_user["id"]) == str(profile.discord_id)
    )

    decks = (
        UserDeck.objects
        .filter(profile_id=profile.id)
        .order_by(
            "-created_at",
            "-id",
        )
    )

    profile_serializer = UserProfileSerializer(profile)

    deck_serializer = UserDeckSerializer(
        decks,
        many=True,
    )

    return Response(
        {
            "success": True,
            "profile": profile_serializer.data,
            "decks": deck_serializer.data,
            "is_owner": is_owner,
        },
        status=status.HTTP_200_OK,
    )



def _profile_validation_error(
    message,
    status_code=status.HTTP_400_BAD_REQUEST,
):
    return Response(
        {"error": message},
        status=status_code,
    )


def _validate_display_name(value):
    display_name = str(value).strip()

    if not display_name:
        return None, "Display name cannot be empty."

    if len(display_name) > 100:
        return None, "Display name cannot exceed 100 characters."

    return display_name, None


def _validate_profile_slug(value, profile_id):
    profile_slug = str(value).strip().lower()

    if not profile_slug:
        return (
            None,
            "Profile slug cannot be empty.",
            status.HTTP_400_BAD_REQUEST,
        )

    if len(profile_slug) > 100:
        return (
            None,
            "Profile slug cannot exceed 100 characters.",
            status.HTTP_400_BAD_REQUEST,
        )

    existing_profile = (
        UserProfile.objects
        .filter(profile_slug=profile_slug)
        .exclude(id=profile_id)
        .exists()
    )

    if existing_profile:
        return (
            None,
            "That profile URL is already being used.",
            status.HTTP_409_CONFLICT,
        )

    return profile_slug, None, None


def _validate_avatar(value):
    avatar = "" if value is None else str(value).strip()

    if len(avatar) > 500:
        return None, "Avatar URL cannot exceed 500 characters."

    return avatar, None


def _validate_bio(value):
    bio = "" if value is None else str(value).strip()

    if len(bio) > 2000:
        return None, "Bio cannot exceed 2000 characters."

    return bio, None


def _validate_social_url(value, field):
    value = "" if value is None else str(value).strip()

    if len(value) > 500:
        return None, f"{field} cannot exceed 500 characters."

    if value and not value.startswith(("https://", "http://")):
        return (
            None,
            f"{field} must be a valid HTTP or HTTPS URL.",
        )

    return value, None


def _normalize_is_public(value):
    if isinstance(value, bool):
        return value, None

    if isinstance(value, str):
        normalized = value.strip().lower()

        if normalized in {"true", "1", "yes", "public"}:
            return True, None

        if normalized in {"false", "0", "no", "private"}:
            return False, None

    return None, "is_public must be true or false."


def _validate_basic_profile_fields(update_data):
    validators = {
        "display_name": _validate_display_name,
        "avatar": _validate_avatar,
        "bio": _validate_bio,
    }

    for field, validator in validators.items():
        if field not in update_data:
            continue

        value, error = validator(update_data[field])

        if error:
            return error

        update_data[field] = value

        if field == "display_name":
            update_data["display_name_is_custom"] = True

    return None


def _validate_profile_slug_field(update_data, profile):
    if "profile_slug" not in update_data:
        return None, None

    value, error, error_status = _validate_profile_slug(
        update_data["profile_slug"],
        profile.id,
    )

    if error:
        return error, error_status

    update_data["profile_slug"] = value

    return None, None


def _validate_social_fields(update_data):
    social_fields = {
        "youtube_url",
        "twitch_url",
        "tiktok_url",
        "instagram_url",
        "twitter_url",
        "discord_server_url",
    }

    for field in social_fields.intersection(update_data):
        value, error = _validate_social_url(
            update_data[field],
            field,
        )

        if error:
            return error

        update_data[field] = value

    return None


def _validate_visibility_field(update_data):
    if "is_public" not in update_data:
        return None

    value, error = _normalize_is_public(update_data["is_public"])

    if error:
        return error

    update_data["is_public"] = value

    return None


def _validate_profile_update_data(update_data, profile):
    error = _validate_basic_profile_fields(update_data)

    if error:
        return error, None

    error, error_status = _validate_profile_slug_field(
        update_data,
        profile,
    )

    if error:
        return error, error_status

    error = _validate_social_fields(update_data)

    if error:
        return error, None

    error = _validate_visibility_field(update_data)

    if error:
        return error, None

    return None, None


@api_view(["PATCH"])
@authentication_classes([])
@permission_classes([])
def profile_update(request):
    profile, error = get_current_profile(request)

    if error:
        return error

    allowed_fields = {
        "display_name",
        "profile_slug",
        "avatar",
        "bio",
        "is_public",
        "youtube_url",
        "twitch_url",
        "tiktok_url",
        "instagram_url",
        "twitter_url",
        "discord_server_url",
    }

    update_data = {
        field: request.data[field]
        for field in allowed_fields
        if field in request.data
    }

    if not update_data:
        return _profile_validation_error(
            "No valid profile fields were provided."
        )

    validation_error, error_status = _validate_profile_update_data(
        update_data,
        profile,
    )

    if validation_error:
        return _profile_validation_error(
            validation_error,
            error_status or status.HTTP_400_BAD_REQUEST,
        )

    for field, value in update_data.items():
        setattr(profile, field, value)

    try:
        profile.save()
    except IntegrityError:
        return _profile_validation_error(
            "Unable to update profile because one of the unique fields is already in use.",
            status.HTTP_409_CONFLICT,
        )

    serializer = UserProfileSerializer(profile)

    return Response(
        {
            "success": True,
            "profile": serializer.data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def profile_me_cards(request):
    profile, error = get_current_profile(request)

    if error:
        return error

    cards = profile.cards.all().order_by("card_name")

    return Response(
        {
            "authenticated": True,
            "profile": profile.profile_slug,
            "cards": cards,
        },
        status=status.HTTP_200_OK,
    )
