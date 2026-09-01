import logging

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import SiteUpdate

logger = logging.getLogger(__name__)


@api_view(["GET"])
def site_updates(request):
    try:
        updates = (
            SiteUpdate.objects
            .filter(published=True)
            .order_by("-published_at", "-created_at")
        )

        data = [
            {
                "id": update.id,
                "title": update.title,
                "page_url": update.page_url,
                "content": update.content,
                "category": update.category,
                "published": update.published,
                "published_at": update.published_at,
                "created_at": update.created_at,
                "updated_at": update.updated_at,
            }
            for update in updates
        ]

        return Response(data, status=status.HTTP_200_OK)

    except Exception as error:
        logger.exception("Unable to load site updates.")
        return Response(
            {
                "detail": "Unable to load site updates.",
                "error": str(error),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )