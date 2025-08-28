"""
Configurazione del routing per l'app accounts
"""
from django.urls import path
from .views import (
    MyAccountView,
    ContactListCreateView,
    ContactDeleteView
)

urlpatterns = [
    path('me/',                    MyAccountView.as_view(),                 name='my-account'),
    path('contacts/',              ContactListCreateView.as_view(),         name='contacts-list-create'),
    path('contacts/<int:pk>/',     ContactDeleteView.as_view(),             name='contacts-delete'),
]
