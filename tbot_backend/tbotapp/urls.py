from django.urls import path
from . import views
urlpatterns = [
   path('decklists/', views.decklists, name='decklists'),
   path('cardinformation/', views.card_information, name='card_information')
]
