from django.urls import path
from . import views

urlpatterns = [
    path(
        "decklists/",
        views.decklists,
        name="decklists",
    ),
    path(
        "cardinformation/",
        views.card_information,
        name="card_information",
    ),
    path(
        "heroinformation/",
        views.heroinformation,
        name="heroinformation",
    ),
    path(
        "keeporscrap/",
        views.keep_or_scrap,
        name="keep_or_scrap",
    ),
]