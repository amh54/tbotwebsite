from datetime import datetime

from django.utils import timezone

from ..models import SavedDeck


def normalize_datetime(value):
    if value is None or value == "":
        return None

    if isinstance(value, datetime):
        if timezone.is_naive(value):
            return timezone.make_aware(
                value,
                timezone.get_current_timezone(),
            )
        return value

    value = str(value).strip()

    if not value:
        return None

    date_formats = (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%m/%d/%y",
    )

    for date_format in date_formats:
        try:
            parsed = datetime.strptime(
                value,
                date_format,
            )

            return timezone.make_aware(
                parsed,
                timezone.get_current_timezone(),
            )
        except ValueError:
            continue

    return None


def sync_saved_decks_for_deck(
    deck,
    source_type="decklist",
):
    source_id = getattr(
        deck,
        "deckid",
        None,
    )

    if source_id is None:
        source_id = getattr(
            deck,
            "id",
            None,
        )

    if source_id is None:
        return

    SavedDeck.objects.filter(
        source_type=source_type,
        source_deck_id=source_id,
    ).update(
        name=getattr(deck, "name", None) or "",
        hero=getattr(deck, "hero", None) or "",
        side=getattr(deck, "side", None) or "",
        category=getattr(deck, "category", None) or "",
        archetype=getattr(deck, "archetype", None) or "",
        description=getattr(deck, "description", None) or "",
        image=getattr(deck, "image", None),
        creator=getattr(deck, "creator", None) or "",
        cost=getattr(deck, "cost", None) or "",
        aliases=getattr(deck, "aliases", None),
        cards=getattr(deck, "cards", None),
        inspiration=getattr(deck, "inspiration", None),
        optimization=getattr(deck, "optimization", None),
        suggested_date=normalize_datetime(
            getattr(deck, "suggested_date", None)
        ),
        updated_date=normalize_datetime(
            getattr(deck, "updated_date", None)
        ),
        deck_doc=getattr(deck, "deck_doc", None),
    )