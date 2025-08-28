"""
Configurazione serializers per le transazioni
"""
from rest_framework import serializers
from .models import Transaction, Category
from accounts.models import BankAccount
from django.utils import timezone
from django.db import transaction as db_transaction
from rest_framework.pagination import PageNumberPagination
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from accounts.serializers import BankAccountSerializer
from accounts.models import Accounts


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    transaction_name = serializers.SerializerMethodField()
    row_number = serializers.SerializerMethodField()
    class Meta:
        model = Transaction
        fields = [
            'row_number',
            'id',
            'transaction_name',
            'date',
            'amount',
            'currency',
            'destinatario_nome',
            'category',
            'category_name',
        ]
        read_only_fields = ['id']

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_transaction_name(self, obj):
        return obj.clausola or '-'

    def get_row_number(self, obj):
       
        request = self.context.get('request')
        if not request:
            return None
        try:
            page = int(request.query_params.get('page', 1))
        except Exception:
            page = 1
        page_size = getattr(self, 'page_size', 10)
        if hasattr(self, 'root') and hasattr(self.root, 'context'):
            page_size = self.root.context.get('view').paginator.page_size
        count = getattr(self.root, 'count', None)
        if count is None:
        
            count = type(obj).objects.filter(account__user=request.user).count()

        if hasattr(obj, '_row_position'):
            row_in_page = obj._row_position
        else:
            row_in_page = 0
        return count - ((page - 1) * page_size + row_in_page)

    def get_destinatario_nome(self, obj):
        return obj.destinatario_nome or ''


class TransferSerializer(serializers.Serializer):

    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    description = serializers.CharField(allow_blank=True, required=False)
    category = serializers.CharField(allow_blank=True, required=False)
    clause = serializers.CharField(allow_blank=True, required=False)
    pin = serializers.CharField(max_length=6)
    to_name = serializers.CharField(allow_blank=True, required=False)
    to_email = serializers.EmailField(allow_blank=True, required=False)
    to_iban = serializers.CharField(max_length=34)
    to_city = serializers.CharField(allow_blank=True, required=False)

    def validate(self, data):
        user = self.context['request'].user
     
        from_account = BankAccount.objects.filter(user=user).first()  

        if not from_account:
            raise serializers.ValidationError("Conto mittente non trovato.")
   
        to_iban = data['to_iban']

        try:
            to_account = BankAccount.objects.get(iban=to_iban) 

        except BankAccount.DoesNotExist:  
            raise serializers.ValidationError("Conto destinatario non trovato.")

        if from_account == to_account:
            raise serializers.ValidationError("Il conto mittente e destinatario devono essere diversi.")
        amount = data['amount']

        if amount <= 0:
            raise serializers.ValidationError("L'importo deve essere positivo.")

        if from_account.balance < amount:
            raise serializers.ValidationError("Saldo insufficiente sul conto mittente.")


        if from_account.pin != data['pin']:
            raise serializers.ValidationError("PIN errato.")

        data['from_account'] = from_account
        data['to_account'] = to_account

        return data

    def create(self, validated_data):
        from_account = validated_data['from_account']
        to_account = validated_data['to_account']
        amount = validated_data['amount']
        description = validated_data.get('description', '')
        category_name = validated_data.get('category', '')
        clause = validated_data.get('clause', '')
        to_name = validated_data.get('to_name', '')
        to_email = validated_data.get('to_email', '')
        to_iban = validated_data.get('to_iban', '')
        to_city = validated_data.get('to_city', '')
        date = timezone.now().date()

        category_obj = None
        if category_name:
            category_obj, _ = Category.objects.get_or_create(name=category_name)
  
        try:
            mittente_citta = Accounts.objects.get(user=from_account.user).profile.city

        except Exception:
            mittente_citta = ''

        with db_transaction.atomic():
  
            tx_out = Transaction.objects.create(
                account=from_account,
                date=date,
                amount=-amount,
                currency='EUR',
                description=description,
                category=category_obj,
                notes=clause,
                merchant_name=str(to_account),

                mittente_nome=from_account.name,
                mittente_email=from_account.user.email,
                mittente_iban=from_account.iban,
                mittente_citta=mittente_citta,
              
                destinatario_nome=to_name,
                destinatario_email=to_email,
                destinatario_iban=to_iban,
                destinatario_citta=to_city,
           
                clausola=clause,
                stato='Completata',
                id_transazione='',
            )
    
            tx_in = Transaction.objects.create(
                account=to_account,
                date=date,
                amount=amount,
                currency='EUR',
                description=description,
                category=category_obj,
                notes=clause,
                merchant_name=str(from_account),
          
                mittente_nome=from_account.name,
                mittente_email=from_account.user.email,
                mittente_iban=from_account.iban,
                mittente_citta=mittente_citta,
           
                destinatario_nome=to_name,
                destinatario_email=to_email,
                destinatario_iban=to_iban,
                destinatario_citta=to_city,
         
                clausola=clause,
                stato='Completata',
                id_transazione='',
            )

            from_account.balance -= amount
            to_account.balance += amount

            from_account.save()
            to_account.save()
        return {'tx_out': tx_out, 'tx_in': tx_in}


class TransactionDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    class Meta:
        model = Transaction
        fields = '__all__'

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None
