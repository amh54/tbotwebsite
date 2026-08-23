from django.db import IntegrityError
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.response import Response

from ..models import UserProfile, UserDeck
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
        profile_slug=profile_slug,
    )

    discord_user = get_discord_user(request)

    is_owner = (
        discord_user is not None
        and str(discord_user["id"]) == str(profile.discord_id)
    )

    if not profile.is_public and not is_owner:
        return Response(
            {
                "error": "This profile is private.",
            },
            status=status.HTTP_403_FORBIDDEN,
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

    # Get ONLY the number of decks.
    deck_count = UserDeck.objects.filter(
        profile_id=profile.id
    ).count()

    serializer = UserProfileSerializer(profile)

    return Response(
        {
            "profile": serializer.data,
            "deck_count": deck_count,
            "is_owner": is_owner,
            "is_site_owner": is_site_owner,
        },
        status=status.HTTP_200_OK    )


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
        profile_slug=profile_slug,
    )

    discord_user = get_discord_user(request)

    is_owner = (
        discord_user is not None
        and str(discord_user["id"]) == str(profile.discord_id)
    )

    if not profile.is_public and not is_owner:
        return Response(
            {
                "error": "This profile is private.",
            },
            status=status.HTTP_403_FORBIDDEN,
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
    }

    update_data = {}

    for field in allowed_fields:
        if field in request.data:
            update_data[field] = request.data[field]

    if not update_data:
        return Response(
            {
                "error": (
                    "No valid profile fields were provided."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if "display_name" in update_data:
        display_name = str(
            update_data["display_name"]
        ).strip()

        if not display_name:
            return Response(
                {
                    "error": "Display name cannot be empty.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(display_name) > 100:
            return Response(
                {
                    "error": (
                        "Display name cannot exceed "
                        "100 characters."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        update_data["display_name"] = display_name

    if "profile_slug" in update_data:
        profile_slug = str(
            update_data["profile_slug"]
        ).strip().lower()

        if not profile_slug:
            return Response(
                {
                    "error": "Profile slug cannot be empty.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(profile_slug) > 100:
            return Response(
                {
                    "error": (
                        "Profile slug cannot exceed "
                        "100 characters."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_profile = (
            UserProfile.objects
            .filter(
                profile_slug=profile_slug,
            )
            .exclude(
                id=profile.id,
            )
            .exists()
        )

        if existing_profile:
            return Response(
                {
                    "error": (
                        "That profile URL is already "
                        "being used."
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        update_data["profile_slug"] = profile_slug

    if "avatar" in update_data:
        avatar = update_data["avatar"]

        if avatar is None:
            update_data["avatar"] = ""
        else:
            avatar = str(avatar).strip()

            if len(avatar) > 500:
                return Response(
                    {
                        "error": (
                            "Avatar URL cannot exceed "
                            "500 characters."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            update_data["avatar"] = avatar

    if "bio" in update_data:
        bio = update_data["bio"]

        if bio is None:
            bio = ""

        bio = str(bio).strip()

        if len(bio) > 2000:
            return Response(
                {
                    "error": (
                        "Bio cannot exceed "
                        "2000 characters."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        update_data["bio"] = bio

    if "is_public" in update_data:
        value = update_data["is_public"]

        if isinstance(value, bool):
            pass

        elif isinstance(value, str):
            normalized = value.strip().lower()

            if normalized in {
                "true",
                "1",
                "yes",
                "public",
            }:
                update_data["is_public"] = True

            elif normalized in {
                "false",
                "0",
                "no",
                "private",
            }:
                update_data["is_public"] = False

            else:
                return Response(
                    {
                        "error": (
                            "is_public must be "
                            "true or false."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        else:
            return Response(
                {
                    "error": (
                        "is_public must be "
                        "true or false."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    for field, value in update_data.items():
        setattr(
            profile,
            field,
            value,
        )

    try:
        profile.save()

    except IntegrityError:
        return Response(
            {
                "error": (
                    "Unable to update profile because "
                    "one of the unique fields is already "
                    "in use."
                ),
            },
            status=status.HTTP_409_CONFLICT,
        )

    serializer = UserProfileSerializer(profile)

    return Response(
        {
            "success": True,
            "profile": serializer.data,
        },
        status=status.HTTP_200_OK,
    )