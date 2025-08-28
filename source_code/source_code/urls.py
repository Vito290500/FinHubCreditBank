"""
Configurazione endpoint della folder principale
"""

from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework.routers import SimpleRouter
from users.views import CustomUserViewSet
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

router = SimpleRouter()
router.register(r'users', CustomUserViewSet, basename='user')

urlpatterns = [
  path('admin/',                                  admin.site.urls),

  path('',                                        include('dashboard.urls')                                                                ),
  path('api/accounts/',                           include('accounts.urls')                                                                 ),
  
  path('api/', include('api.urls')),
  path('api/schema/',                             SpectacularAPIView.as_view(),                                                            name='schema'),
  path('docs/',                                   SpectacularSwaggerView.as_view(url_name='schema'),                                       name='swagger-ui'),
  path('redoc/',                                  SpectacularRedocView.as_view(url_name='schema'),                                         name='redoc'),

  path('activate/<uid>/<token>/',                 TemplateView.as_view(template_name='activation.html'),                                   name='activation-page'),
  path('reset-password/',                         TemplateView.as_view(template_name='reset_password.html'),                               name='password-reset-request'),
  path('reset-password-confirm/<uid>/<token>/',   TemplateView.as_view(template_name='conferma_reset.html'),                               name='password-reset-confirm-page'),


  path('auth/',                                   include(router.urls)                                                                     ),
  path("auth/",                                   include("djoser.urls")                                                                   ),         
  path("auth/",                                   include("djoser.urls.authtoken")                                                         ),
  path('auth/',                                   include('djoser.urls.jwt')                                                               ),
]
