"""Signals per l'app accounts"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from .models import BankAccount, Card
from .utils import generate_pin, mask_iban

def try_send_credentials(account: BankAccount):
    """Funzione che gestisce l'invio dell'email con i dati sensibili."""

    if account.credentials_sent:
        return

    user = account.user
    card = account.cards.filter(active=True).order_by('-issued_at').first()

    context = {
        "user_name": getattr(user, "full_name", "") or user.email,
        "iban": account.iban,
        "pin": None,
        "card_brand": None,
        "card_last4": None,
        "expiry_month": None,
        "expiry_year": None,
        "cvv_real": None,
    }

    if not account.pin:
        raw_pin = generate_pin(6)
        account.set_pin(raw_pin)
        account.save(update_fields=["pin"])
        context["pin"] = raw_pin
    else:
        raw_pin = generate_pin(6)
        account.set_pin(raw_pin)
        account.save(update_fields=["pin"])
        context["pin"] = raw_pin

    if card:
        context.update({
            "card_brand": card.get_circuit_display() if hasattr(card, "get_circuit_display") else card.circuit,
            "card_last4": card.pan_last4,
            "expiry_month": card.expiry_month,
            "expiry_year": card.expiry_year,
        })
        if card.cvv_real:
            context["cvv_real"] = card.cvv_real

    subject = "Credenziali conto FinHub (IBAN, PIN e dati carta)"
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@finhub.local")
    to = [user.email]

    text_body = render_to_string("users/credentials.txt", context)
    try:
        html_body = render_to_string("users/credentials.html", context)
    except Exception:
        html_body = None

    email = EmailMultiAlternatives(subject, text_body, from_email, to)
    if html_body:
        email.attach_alternative(html_body, "text/html")
    email.send(fail_silently=True)

    account.credentials_sent = True
    account.save(update_fields=["credentials_sent"])

    if card and (card.cvv_real or card.pan_real):
        card.cvv_real = None
        card.pan_real = None
        card.save(update_fields=["cvv_real", "pan_real"])


@receiver(post_save, sender=BankAccount)
def bankaccount_created_set_pin_and_notify(sender, instance: BankAccount, created, **kwargs):
    """Funzione che gestisce la creazione del pin"""
    if created:
        if not instance.pin:
            raw_pin = generate_pin(6)
            instance.set_pin(raw_pin)
            instance.save(update_fields=["pin"])
        try_send_credentials(instance)


@receiver(post_save, sender=Card)
def card_created_try_notify(sender, instance: Card, created, **kwargs):
    if created and not instance.account.credentials_sent:
        try_send_credentials(instance.account)