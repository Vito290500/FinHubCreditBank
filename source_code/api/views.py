"""
Configurazione views per le api
"""
import logging
from django.forms import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework import serializers
from rest_framework import generics, permissions
from rest_framework.generics import ListAPIView

from django.utils.timezone import now
from django.shortcuts import render
from django.utils import timezone
from django.db.models import (
    Sum, Q,
    Min, Max
)
from django.db import transaction

from accounts.models import BankAccount, Card
from accounts.serializers import (
    BankAccountSerializer, CardSerializer,
    EstrattoContoSerializer, GoalsSavingSerializer,
    GoalsSavingMovimentoSerializer
)
from accounts.models import (
    Accounts, EstrattoConto,
    GoalsSaving, GoalsSavingMovimento,
    Accredito, BankAccount
)
from transactions.models import Category,Transaction
from datetime import timedelta, date, datetime
from decimal import Decimal
from calendar import monthrange
from collections import defaultdict


logger = logging.getLogger(__name__)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        self.user.last_login = now()
        self.user.save(update_fields=['last_login'])
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class DashboardDataAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user
        last_login = user.last_login
        last_login_str = last_login.isoformat() if last_login else None
        account = BankAccount.objects.filter(user=user).first()

        card = Card.objects.filter(account=account).first() if account else None
        account_data = BankAccountSerializer(account).data if account else None
        card_data = CardSerializer(card).data if card else None
        card_iban = card.account.iban if card and card.account else ''

        if card_data is not None:
            card_data['iban'] = card_iban
        else:
            card_data = {'iban': ''}

        try:
            user_account = Accounts.objects.get(user=user)
            profile = getattr(user_account, 'profile', None)

            if profile and profile.full_name:
                user_full_name = profile.full_name
            else:
                user_full_name = user.email

        except Accounts.DoesNotExist:
            user_full_name = user.email

        card_number = card.pan_real if card and card.pan_real else ''
        cvv_real = card.cvv_real if card and card.cvv_real else ''
        holder_name = card.holder_name if card and card.holder_name else ''

        if card_data is not None:
            card_data['card_number'] = card_number
            card_data['cvv'] = cvv_real
            card_data['holder_name'] = holder_name
        else:
            card_data = {'card_number': '', 'cvv': '', 'holder_name': ''}

        return Response({
            'user_full_name': user_full_name,
            'last_login': last_login_str,
            'account': account_data,
            'card': card_data,
        })


class UserBankAccountListView(ListAPIView):

    serializer_class = BankAccountSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None 
    ordering = ['-created_at']
    ordering_fields = ['created_at', 'opened_at']

    def get_ordering(self):
        return ['-created_at']

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return BankAccount.objects.filter(user=self.request.user)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class CategoryListView(ListAPIView):

    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Category.objects.all()

    def get_ordering(self):
        return []


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        transactions = Transaction.objects.filter(account__user=user)
        bonifici_inviati = transactions.filter(amount__lt=0).count()
        bonifici_ricevuti = transactions.filter(amount__gt=0).count()

        transazioni = transactions.count()
        categorie = Category.objects.filter(transactions__account__user=user).distinct().count()

        return Response({
            "bonifici_inviati": bonifici_inviati,
            "bonifici_ricevuti": bonifici_ricevuti,
            "transazioni": transazioni,
            "categorie": categorie,
        })
    

class EntrateUsciteChartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user
        today = timezone.now().date()

        first_day_this_month = today.replace(day=1)
        first_day_last_month = (first_day_this_month - timedelta(days=1)).replace(day=1)
        last_day_last_month = first_day_this_month - timedelta(days=1)

        transactions = Transaction.objects.filter(account__user=user)
        entrate_uscite = []

        for d in range(1, today.day+1):
            
            day = first_day_this_month + timedelta(days=d-1)
            entrate = transactions.filter(date=day, amount__gt=0).aggregate(s=Sum('amount'))['s'] or 0
            uscite = transactions.filter(date=day, amount__lt=0).aggregate(s=Sum('amount'))['s'] or 0
            entrate_uscite.append({"day": day.day, "entrate": float(entrate), "uscite": abs(float(uscite)),})

        days_last_month = (last_day_last_month - first_day_last_month).days + 1
        entrate_uscite_prev = []

        for d in range(1, days_last_month+1):

            day = first_day_last_month + timedelta(days=d-1)
            entrate = transactions.filter(date=day, amount__gt=0).aggregate(s=Sum('amount'))['s'] or 0
            uscite = transactions.filter(date=day, amount__lt=0).aggregate(s=Sum('amount'))['s'] or 0
            entrate_uscite_prev.append({ "day": day.day, "entrate": float(entrate), "uscite": abs(float(uscite)), })

        return Response({
            "current_month": entrate_uscite,
            "previous_month": entrate_uscite_prev,
        })
    

class CategoriaChartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user
        transactions = Transaction.objects.filter(account__user=user)

        data = (transactions.values('category__name').annotate(total=Sum('amount')).order_by('-total'))
        data = [d for d in data if d['category__name']]

        return Response(data)
    

class EstrattoContoListAPIView(generics.ListAPIView):
    serializer_class = EstrattoContoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):

        user = request.user
        bank_account = BankAccount.objects.filter(user=user).first()

        if not bank_account:
            return Response([])
        
        saldo_corrente = bank_account.balance
        transactions = Transaction.objects.filter(account__user=user).order_by('date')
        accreditamenti = Accredito.objects.filter(account__user=user).order_by('date')

        if not transactions.exists() and not accreditamenti.exists():
            return Response([])

        first_date_trans = transactions.first().date if transactions.exists() else None
        first_date_acc = accreditamenti.first().date if accreditamenti.exists() else None

        first_date_candidates = [d for d in [first_date_trans, first_date_acc] if d is not None]
        first_date = min(first_date_candidates) if first_date_candidates else None

        last_date_trans = transactions.last().date if transactions.exists() else None
        last_date_acc = accreditamenti.last().date if accreditamenti.exists() else None

        last_date_candidates = [d for d in [last_date_trans, last_date_acc] if d is not None]
        last_date = max(last_date_candidates) if last_date_candidates else None

        if first_date is None or last_date is None:
            return Response([])

        current_year = first_date.year
        current_month = first_date.month
        end_year = last_date.year
        end_month = last_date.month

        mesi_anni = []

        while (current_year < end_year) or (current_year == end_year and current_month <= end_month):
            mesi_anni.append((current_year, current_month))

            if current_month == 12:
                current_month = 1
                current_year += 1

            else:
                current_month += 1

        estratti = []
        saldo_iniziale_mese_successivo = saldo_corrente

        for anno, mese in mesi_anni[::-1]:
            last_day = monthrange(anno, mese)[1]

            totale_movimenti_positivi = transactions.filter(date__year=anno, date__month=mese, amount__gt=0).aggregate(total=Sum('amount'))['total'] or 0
            totale_movimenti_negativi = transactions.filter(date__year=anno, date__month=mese, amount__lt=0).aggregate(total=Sum('amount'))['total'] or 0
            totale_accreditamenti = accreditamenti.filter(date__year=anno, date__month=mese).aggregate(total=Sum('amount'))['total'] or 0

            saldo_finale = saldo_iniziale_mese_successivo
            saldo_iniziale = saldo_finale - totale_movimenti_positivi + totale_movimenti_negativi

            estratti.append({
                'mese': mese,
                'anno': anno,
                'saldo_iniziale': saldo_iniziale,
                'saldo_finale': saldo_finale,
                'data_creazione': datetime(anno, mese, 1).isoformat()
            })

            saldo_iniziale_mese_successivo = saldo_iniziale

        return Response(estratti)
    

class MovimentiMensiliAPIView(APIView): 
    permission_classes = [IsAuthenticated]

    def get(self, request, estratto_id):

        try:
            estratto = EstrattoConto.objects.get(id=estratto_id, user=request.user)
            year = estratto.anno
            month = estratto.mese
            
            first_day = date(year, month, 1)
            last_day_num = monthrange(year, month)[1]
            last_day = date(year, month, last_day_num)
            
            movimenti = Transaction.objects.filter(
                account__user=request.user,
                date__gte=first_day,
                date__lte=last_day
            ).order_by('date', 'created_at')
            
            movimenti_data = []
            for mov in movimenti:
                movimenti_data.append({
                    'id': mov.id,
                    'date': mov.date.isoformat(),
                    'amount': float(mov.amount),
                    'description': mov.description,
                    'category': mov.category.name if mov.category else 'Altro',
                    'recipient_name': getattr(mov, 'recipient_name', ''),
                    'recipient_iban': getattr(mov, 'recipient_iban', ''),
                })
            
            return Response({
                'estratto': EstrattoContoSerializer(estratto).data,
                'movimenti': movimenti_data
            })
            
        except EstrattoConto.DoesNotExist:
            return Response({'error': 'Estratto non trovato'}, status=404)
        

class GoalsSavingListCreateView(generics.ListCreateAPIView):
    serializer_class = GoalsSavingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GoalsSaving.objects.filter(bank_account__user=self.request.user)

    def perform_create(self, serializer):
        bank_account = self.request.user.bankaccount_set.first()

        if not bank_account:
            raise ValidationError("Nessun conto associato all'utente.")
        
        serializer.save(bank_account=bank_account)


class GoalsSavingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GoalsSavingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GoalsSaving.objects.filter(bank_account__user=self.request.user)
    

class GoalsSavingAddMoneyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):

        try:
            goal = GoalsSaving.objects.get(pk=pk, bank_account__user=request.user)

        except GoalsSaving.DoesNotExist:
            return Response({'detail': 'Obiettivo non trovato.'}, status=404)

        importo = request.data.get('importo')
        descrizione = request.data.get('descrizione', 'Versamento manuale')

        if not importo:
            return Response({'detail': 'Importo richiesto.'}, status=400)

        try:
            importo = Decimal(str(importo))
        except (ValueError, TypeError):
            return Response({'detail': 'Importo non valido.'}, status=400)

        if importo <= 0:
            return Response({'detail': 'Importo deve essere positivo.'}, status=400)

        logger.info(f"Versamento di {importo} per goal {goal.id} ({goal.nome})")
        logger.info(f"Importo attuale prima del versamento: {goal.importo_attuale}")

        try:
            with transaction.atomic():

                movimento = goal.aggiungi_versamento(importo, descrizione)
                logger.info(f"Importo attuale dopo il versamento: {goal.importo_attuale}")
                goal.refresh_from_db()

                return Response({
                    'movimento': GoalsSavingMovimentoSerializer(movimento).data,
                    'goal_aggiornato': GoalsSavingSerializer(goal).data
                }, status=201)

        except ValueError as e:
            return Response({'detail': str(e)}, status=400)
        
        except Exception as e:
            logger.error(f"Errore durante il versamento: {str(e)}")
            return Response({'detail': 'Errore interno durante il versamento.'}, status=500)

        except Exception as e:
            logger.error(f"Errore durante il versamento: {str(e)}")
            return Response({'detail': 'Errore interno durante il versamento.'}, status=500)