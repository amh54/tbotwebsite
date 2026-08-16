from django.urls import path
from . import views

urlpatterns = [
    path(
        "decklists/",
        views.decklists,
        name="decklists",
    ),
    path(
        "cardinfo/",
        views.card_info,
        name="card_info",
    ),
    path(
        "heroinfo/",
        views.heroinfo,
        name="heroinfo",
    ),
    path(
        "keeporscrap/",
        views.keep_or_scrap,
        name="keep_or_scrap",
    ),
    path("decklist-count/", views.decklist_count, name="decklist-count"),
    path("card-count/", views.card_count, name="card-count"),
    path("hero-count/", views.hero_count, name="hero-count"),
    path("keeporscrap/count/", views.keeporscrap_count, name="keeporscrap_count"),
]