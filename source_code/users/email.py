"""
Email customizzazione
"""
from djoser import email as djoser_email
from djoser import utils
from djoser.conf import settings as djoser_settings
from django.contrib.auth.tokens import default_token_generator


class ActivationEmail(djoser_email.ActivationEmail):
    """Classe che gestisce l'email di attivazione email."""

    template_name = 'users/activation.html'

    def get_context_data(self):        
        context = super().get_context_data()
        user = context['user']
        context['uid']   = utils.encode_uid(user.pk)
        context['token'] = default_token_generator.make_token(user)
        context['url'] = context.get('url')
        return context


class ResetPasswordEmail(djoser_email.PasswordResetEmail):
    """Classe che gestisce il reset password"""

    template_name = 'users/password_reset.html'
    subject_template_name = 'users/password_reset_subject.txt'

    def get_context_data(self):
        context = super().get_context_data()
        user = context['user']
        
        context['uid']   = utils.encode_uid(user.pk)
        context['token'] = default_token_generator.make_token(user)
        context['url'] = f"reset-password-confirm/{context['uid']}/{context['token']}/"
        return context

    def get_subject(self):
        raise Exception("Classe custom ResetPasswordEmail caricata!")
        return "Reimposta la tua password su FinHub Credit Bank"