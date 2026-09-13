from django.urls import path

from ..views.suggestions import (
    admin_suggestion_detail,
    admin_suggestions,
    suggestion_create,
    user_suggestion_detail,
    user_suggestions,
)


urlpatterns = [
    path(
        "suggestions/create/",
        suggestion_create,
        name="suggestion-create",
    ),
    path(
        "suggestions/my/",
        user_suggestions,
        name="user-suggestions",
    ),
    path(
        "suggestions/my/<int:suggestion_id>/",
        user_suggestion_detail,
        name="user-suggestion-detail",
    ),
    path(
        "admin/suggestions/",
        admin_suggestions,
        name="admin-suggestions",
    ),
    path(
        "admin/suggestions/<int:suggestion_id>/",
        admin_suggestion_detail,
        name="admin-suggestion-detail",
    ),
]