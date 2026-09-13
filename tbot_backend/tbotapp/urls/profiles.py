from django.urls import path

from ..views.profile import (
    profile_detail,
    profile_me,
    profile_update,
    public_profile_count,
    public_profile_decks,
    public_profiles,
)


urlpatterns = [
    path(
        "profile/me/",
        profile_me,
        name="profile_me",
    ),
    path(
        "profiles/count/",
        public_profile_count,
        name="public-profile-count",
    ),
    path(
        "profile/update/",
        profile_update,
        name="profile_update",
    ),
    path(
        "profiles/",
        public_profiles,
        name="public_profiles",
    ),
    path(
        "profile/<str:profile_slug>/",
        profile_detail,
        name="profile_by_slug",
    ),
    path(
        "profile/<str:profile_slug>/decks/",
        public_profile_decks,
        name="public_profile_decks",
    ),
]