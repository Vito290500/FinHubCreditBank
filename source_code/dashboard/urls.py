"""
Configurazione routing dashboard app
"""
from django.urls import path
from django.views.generic import TemplateView

urlpatterns = [
    path('',                                        TemplateView.as_view(template_name='login.html'),                                                 name="login"),
    path('dashboard/homepage',                      TemplateView.as_view(template_name='dashboard.html'),                                             name="homepage"),
    path("register/",                               TemplateView.as_view(template_name="register.html"),                                              name="register"),
    path('profile/',                                TemplateView.as_view(template_name='profilo_section/profilo.html'),                               name='profile-page'),
    path('profile/gestisci_account',                TemplateView.as_view(template_name='profilo_section/gestisci_account.html'),                      name='gestisci-account'),
    path('profile/dati_personali',                  TemplateView.as_view(template_name='profilo_section/dati_personali.html'),                        name='dati-personali'),
    path('dashboard/bonifico',                      TemplateView.as_view(template_name='bonifico.html'),                                              name='bonifico'),
    path('transazioni/',                            TemplateView.as_view(template_name='transazioni.html'),                                           name='transazioni'),
    path('elenco-movimenti/',                       TemplateView.as_view(template_name='elenco_movimenti.html'),                                      name='elenco-movimenti'),
    path('dashboard/statistica',                    TemplateView.as_view(template_name='statistica.html'),                                            name='statistica'),
    path('suddivisione-spese/',                     TemplateView.as_view(template_name='spese.html'),                                                 name='spese'),
    path('estratto-conto/',                         TemplateView.as_view(template_name='estratto_conto.html'),                                        name='estratto'),
    path('goals-saving/',                           TemplateView.as_view(template_name='goals_saving.html'),                                          name='goals'),
]

