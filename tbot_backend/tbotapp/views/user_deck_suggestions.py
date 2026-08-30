from datetime import timedelta

from django.db import IntegrityError
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.response import Response

from ..models import (
    UserProfile,
    UserDeck,
    UserDeckSuggestion,
)
from .helpers import get_discord_user


COOLDOWN_DAYS = 14


@api_view(["POST"])
@authentication_classes([])
@permission_classes([])
def user_deck_suggestion_create(request):
    """
    Create a suggestion for a UserDeck.

    The browser only sends deck_id.

    The backend determines:
        - who owns the deck
        - whether the requester is the owner
        - the creator's Discord ID
        - whether creator consent is required
    """

    discord_user = get_discord_user(request)

    if not discord_user:
        return Response(
            {
                "success": False,
                "authenticated": False,
                "reason": "authentication_required",
                "message": (
                    "You must be logged in with Discord "
                    "to suggest a deck."
                ),
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
        return Response(
            {
                "success": False,
                "authenticated": True,
                "reason": "profile_not_found",
                "message": (
                    "Your profile could not be found. "
                    "Please log in with Discord again."
                ),
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    deck_id = request.data.get("deck_id")

    if deck_id is None:
        return Response(
            {
                "success": False,
                "reason": "deck_id_required",
                "message": "A deck ID is required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        deck_id = int(deck_id)
    except (TypeError, ValueError):
        return Response(
            {
                "success": False,
                "reason": "invalid_deck_id",
                "message": "The deck ID is invalid.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    deck = (
        UserDeck.objects
        .filter(id=deck_id)
        .first()
    )

    if not deck:
        return Response(
            {
                "success": False,
                "reason": "deck_not_found",
                "message": "That deck could not be found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    # ------------------------------------------------------------
    # ALREADY SUGGESTED
    # ------------------------------------------------------------

    existing_suggestion = (
        UserDeckSuggestion.objects
        .filter(
            deck_id=deck.id,
            deck_name=deck.name,
        )
        .first()
    )

    if existing_suggestion:
        return Response(
            {
                "success": False,
                "reason": "already_suggested",
                "suggestion_id": existing_suggestion.id,
                "consent_status": existing_suggestion.consent_status,
                "status": existing_suggestion.status,
                "message": (
                    "This deck has already been suggested. "
                    "Join the Discord to view the suggestion."
                ),
            },
            status=status.HTTP_409_CONFLICT,
        )

        # ------------------------------------------------------------
    # COOLDOWN
    # ------------------------------------------------------------

    previous_suggestion = (
        UserDeckSuggestion.objects
        .filter(
            suggested_by_discord_id=discord_id,
        )
        .order_by("-created_at")
        .first()
    )

    if previous_suggestion:
        cooldown_until = (
            previous_suggestion.created_at
            + timedelta(days=COOLDOWN_DAYS)
        )

        now = timezone.now()

        if now < cooldown_until:
            return Response(
                {
                    "success": False,
                    "reason": "cooldown",
                    "suggestion_id": previous_suggestion.id,
                    "consent_status": (
                        previous_suggestion.consent_status
                    ),
                    "status": previous_suggestion.status,
                    "message": (
                        "You recently suggested a deck. "
                        "You must wait until your cooldown "
                        "expires before suggesting another deck."
                    ),
                    "cooldown_until": (
                        cooldown_until.isoformat()
                    ),
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

    # ------------------------------------------------------------
    # DETERMINE DECK OWNER
    # ------------------------------------------------------------

    is_owner = str(deck.profile_id) == str(profile.id)

    if is_owner:
        # Owners automatically consent to their own deck.
        consent_type = "self_created"
        consent_status = "confirmed"
        creator_discord_id = discord_id
        consent_given_at = timezone.now()

    else:
        # The browser NEVER supplies creator_discord_id.
        #
        # We determine the actual creator from deck.profile_id.

        consent_type = "permission"
        consent_status = "awaiting_creator"

        creator_profile = (
            UserProfile.objects
            .filter(id=deck.profile_id)
            .first()
        )

        if not creator_profile:
            return Response(
                {
                    "success": False,
                    "reason": "creator_not_found",
                    "message": (
                        "The deck creator's profile could "
                        "not be found."
                    ),
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        creator_discord_id = str(
            creator_profile.discord_id or ""
        ).strip()

        if not creator_discord_id:
            return Response(
                {
                    "success": False,
                    "reason": "creator_not_connected",
                    "message": (
                        "The deck creator does not have a "
                        "Discord account connected to Tbot."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        consent_given_at = None

    # ------------------------------------------------------------
    # CREATE SUGGESTION
    # ------------------------------------------------------------

    suggestion = UserDeckSuggestion(
        deck_id=deck.id,
        deck_name=deck.name,
        hero=deck.hero,
        side=deck.side,
        category=deck.category,
        archetype=deck.archetype,
        creator=deck.creator,
        description=deck.description,
        image=deck.image,
        cost=deck.cost,
        aliases=deck.aliases,
        cards=deck.cards,
        inspiration=deck.inspiration,
        optimization=deck.optimization,
        suggested_date=deck.suggested_date,
        updated_date=deck.updated_date,
        deck_doc=deck.deck_doc,

        # Person making the suggestion
        suggested_by_discord_id=discord_id,
        suggested_by_profile_id=profile.id,
        suggested_by_username=profile.username,
        suggested_by_display_name=profile.display_name,
        suggested_by_profile_slug=profile.profile_slug,
        suggested_by_avatar=profile.avatar,

        # Suggestion state
        status="pending",

        # Consent state
        consent_type=consent_type,
        consent_status=consent_status,
        consent_creator_discord_id=creator_discord_id,
        consent_given_at=consent_given_at,
    )

    try:
        suggestion.save()

    except IntegrityError:
        existing_suggestion = (
            UserDeckSuggestion.objects
            .filter(
                deck_id=deck.id,
                deck_name=deck.name,
            )
            .first()
        )

        if existing_suggestion:
            return Response(
                {
                    "success": False,
                    "reason": "already_suggested",
                    "suggestion_id": existing_suggestion.id,
                    "consent_status": (
                        existing_suggestion.consent_status
                    ),
                    "status": existing_suggestion.status,
                    "message": (
                        "This deck has already been suggested. "
                        "Join the Discord to view the suggestion."
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        raise

    # ------------------------------------------------------------
    # RESPONSE
    # ------------------------------------------------------------

    if consent_status == "confirmed":
        message = (
            "Your deck suggestion was submitted successfully!"
        )
    else:
        message = (
            "The deck suggestion was created. "
            "The deck creator must confirm permission "
            "through Discord before it is posted."
        )

    return Response(
        {
            "success": True,
            "suggestion_id": suggestion.id,

            # Important:
            # The frontend uses this to show the correct message.
            "consent_status": consent_status,

            # Keep the overall suggestion status available too.
            "status": suggestion.status,

            "consent_type": consent_type,

            "message": message,
        },
        status=status.HTTP_201_CREATED,
    )


# ============================================================
# CHECK SUGGESTION STATUS
# ============================================================

@api_view(["GET"])
@authentication_classes([])
@permission_classes([])
def user_deck_suggestion_status(request, suggestion_id):
    """
    Return the current consent state of a suggestion.

    This endpoint is used by the frontend after a suggestion
    has been created so the UI can detect when the deck creator
    approves or denies the request in Discord.
    """

    discord_user = get_discord_user(request)

    if not discord_user:
        return Response(
            {
                "success": False,
                "authenticated": False,
                "reason": "authentication_required",
                "message": (
                    "You must be logged in with Discord "
                    "to view this suggestion."
                ),
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    discord_id = str(discord_user["id"])

    suggestion = (
        UserDeckSuggestion.objects
        .filter(id=suggestion_id)
        .first()
    )

    if not suggestion:
        return Response(
            {
                "success": False,
                "reason": "suggestion_not_found",
                "message": "That suggestion could not be found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    # Only the person who submitted the suggestion may
    # check its status from the website.
    if str(suggestion.suggested_by_discord_id) != discord_id:
        return Response(
            {
                "success": False,
                "reason": "not_authorized",
                "message": (
                    "You are not authorized to view "
                    "this suggestion."
                ),
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    # ------------------------------------------------------------
    # CURRENT STATE
    # ------------------------------------------------------------

    consent_status = suggestion.consent_status

    if consent_status == "confirmed":
        message = (
            "The deck creator approved your suggestion. "
            "The deck suggestion has been confirmed."
        )

    elif consent_status == "denied":
        message = (
            "The deck creator did not approve this suggestion."
        )

    elif consent_status == "awaiting_creator":
        message = (
            "The deck creator has not approved the suggestion yet."
        )

    else:
        message = (
            "The current suggestion status is unavailable."
        )

    return Response(
        {
            "success": True,
            "suggestion_id": suggestion.id,
            "deck_id": suggestion.deck_id,

            # These are the values the React component should watch.
            "status": suggestion.status,
            "consent_status": consent_status,
            "consent_type": suggestion.consent_type,

            "consent_given_at": (
                suggestion.consent_given_at.isoformat()
                if suggestion.consent_given_at
                else None
            ),

            "message": message,
        },
        status=status.HTTP_200_OK,
    )