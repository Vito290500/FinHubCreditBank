"""
Configurazione signals per users app
"""

from django.contrib.auth.signals import user_logged_in
from django.utils.timezone import now
from django.dispatch import receiver
import logging

logger = logging.getLogger(__name__)

@receiver(user_logged_in)
def update_last_login(sender, request, user, **kwargs):
    logger.info(f'update_last_login called for user: {user.email}')
    user.last_login = now()
    user.save(update_fields=['last_login'])




