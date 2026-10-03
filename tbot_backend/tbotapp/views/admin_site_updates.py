import logging

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import SiteUpdate
from .permissions import owner_required

logger = logging.getLogger(__name__)


def serialize_site_update(update):
    return {
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


@api_view(["GET"])
@owner_required
def admin_site_updates(request):
    try:
        updates = SiteUpdate.objects.all().order_by(
            "-published_at",
            "-created_at",
        )

        return Response(
            [serialize_site_update(update) for update in updates],
            status=status.HTTP_200_OK,
        )

    except Exception as error:
        logger.exception("Unable to load admin site updates.")
        return Response(
            {
                "detail": "Unable to load site updates.",
                "error": str(error),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@owner_required
def admin_site_update_create(request):
    try:
        title = str(request.data.get("title", "")).strip()
        content = str(request.data.get("content", "")).strip()
        category = str(request.data.get("category", "")).strip()
        page_url = request.data.get("page_url")
        published = request.data.get("published", True)

        if not title:
            return Response(
                {"detail": "Title is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not content:
            return Response(
                {"detail": "Content is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_categories = dict(SiteUpdate.CATEGORY_CHOICES)

        if category not in valid_categories:
            return Response(
                {"detail": "Invalid category."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page_url is not None:
            page_url = str(page_url).strip() or None

        published = bool(published)
        now = timezone.now()

        update = SiteUpdate.objects.create(
            title=title,
            content=content,
            category=category,
            page_url=page_url,
            published=published,
            published_at=now,
        )

        return Response(
            serialize_site_update(update),
            status=status.HTTP_201_CREATED,
        )

    except Exception as error:
        logger.exception("Unable to create site update.")
        return Response(
            {
                "detail": "Unable to create site update.",
                "error": str(error),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["PATCH"])
@owner_required
def admin_site_update_update(request, update_id):
    try:
        update = SiteUpdate.objects.filter(id=update_id).first()

        if update is None:
            return Response(
                {"detail": "Site update not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if "title" in request.data:
            title = str(request.data.get("title", "")).strip()

            if not title:
                return Response(
                    {"detail": "Title is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            update.title = title

        if "content" in request.data:
            content = str(request.data.get("content", "")).strip()

            if not content:
                return Response(
                    {"detail": "Content is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            update.content = content

        if "category" in request.data:
            category = str(request.data.get("category", "")).strip()

            if category not in dict(SiteUpdate.CATEGORY_CHOICES):
                return Response(
                    {"detail": "Invalid category."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            update.category = category

        if "page_url" in request.data:
            page_url = request.data.get("page_url")
            update.page_url = (
                str(page_url).strip()
                if page_url is not None
                else None
            ) or None

        if "published" in request.data:
            published = bool(request.data.get("published"))

            if published and not update.published:
                update.published_at = timezone.now()

            update.published = published

        update.save()

        return Response(
            serialize_site_update(update),
            status=status.HTTP_200_OK,
        )

    except Exception as error:
        logger.exception("Unable to update site update.")
        return Response(
            {
                "detail": "Unable to update site update.",
                "error": str(error),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["DELETE"])
@owner_required
def admin_site_update_delete(request, update_id):
    try:
        update = SiteUpdate.objects.filter(id=update_id).first()

        if update is None:
            return Response(
                {"detail": "Site update not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        update.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    except Exception as error:
        logger.exception("Unable to delete site update.")
        return Response(
            {
                "detail": "Unable to delete site update.",
                "error": str(error),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )