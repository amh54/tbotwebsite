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
]