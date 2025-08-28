"""
File helper per la generazione dell'estratto conto
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from .models import EstrattoConto
from datetime import date
from django.db.models import Sum


class Command(BaseCommand):
    help = 'Genera estratti conto mensili per tutti gli utenti'

    def handle(self, *args, **kwargs):
        oggi = date.today()
        
        if oggi.month == 1:
            mese = 12
            anno = oggi.year - 1
        else:
            mese = oggi.month - 1
            anno = oggi.year

        for user in User.objects.all():
            if not EstrattoConto.objects.filter(user=user, mese=mese, anno=anno).exists():
                saldo_iniziale = 0 
                saldo_finale = 0   
                EstrattoConto.objects.create(
                    user=user,
                    mese=mese,
                    anno=anno,
                    saldo_iniziale=saldo_iniziale,
                    saldo_finale=saldo_finale
                )
                self.stdout.write(self.style.SUCCESS(f'Estratto conto creato per {user.username} {mese}/{anno}'))