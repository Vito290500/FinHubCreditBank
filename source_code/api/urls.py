"""
Configurazione routing per le api
"""
from rest_framework.routers import DefaultRouter
from transactions.views import TransactionViewSet, TransferView
from django.urls import path
from .views import (
    DashboardDataAPIView, DashboardStatsView,
    EntrateUsciteChartView, CategoriaChartView,
    GoalsSavingAddMoneyView, CustomTokenObtainPairView
)
from api.views import (
    UserBankAccountListView, CategoryListView,
    DashboardStatsView, EstrattoContoListAPIView,
    MovimentiMensiliAPIView, GoalsSavingDetailView,
    GoalsSavingListCreateView
)
from accounts.views import AccreditoViewSet

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'accrediti', AccreditoViewSet, basename='accredito')

urlpatterns = [
    path('token/',                                          CustomTokenObtainPairView.as_view(),            name='token_obtain_pair'),
] + router.urls + [
    path('dashboard-data/',                                 DashboardDataAPIView.as_view(),                 name='dashboard-data'),
    path('transfer/',                                       TransferView.as_view(),                         name='transfer'),
    path('accounts/',                                       UserBankAccountListView.as_view(),              name='user-accounts'),
    path('categories/',                                     CategoryListView.as_view(),                     name='categories'),
    
    path('dashboard-stats/',                                DashboardStatsView.as_view(),                   name='dashboard-stats'),

    path('entrate-uscite-chart/',                           EntrateUsciteChartView.as_view(),               name='entrate-uscite-chart'),
    path('categoria-chart/',                                CategoriaChartView.as_view(),                   name='categoria-chart'),

    path('estratti-conto/',                                 EstrattoContoListAPIView.as_view()              ),
    path('estratti-conto/<uuid:estratto_id>/movimenti/',    MovimentiMensiliAPIView.as_view(),              name='movimenti-mensili'),

    path('goals-saving/',                                   GoalsSavingListCreateView.as_view(),            name='goals-saving-list-create'),
    path('goals-saving/<uuid:pk>/',                         GoalsSavingDetailView.as_view(),                name='goals-saving-detail'),
    path('goals-saving/<uuid:pk>/add-money/',               GoalsSavingAddMoneyView.as_view(),              name='goals-saving-add-money'),
]