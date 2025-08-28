"""
Configurazione models per l'app accounts
"""
import uuid
from django.db import models
from django.conf import settings
from users.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone; timezone.now()
from django.contrib.auth.hashers import make_password, check_password


class Accounts(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE
    )
    iban = models.CharField(max_length=34, unique=True)
    name = models.CharField(max_length=120)
    currency = models.CharField(max_length=3)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.iban}"

        
class Profile(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    account = models.OneToOneField(
        Accounts,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    full_name = models.CharField(max_length=120,blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    birth_date = models.DateField(blank=True, null=True)
    fiscal_code = models.CharField(max_length=16,blank=True)
    city = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=10, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} - {self.account.name}"


class BankAccount(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    iban = models.CharField(max_length=34, unique=True)
    name = models.CharField(max_length=120)             
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='EUR')
    opened_at = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    pin = models.CharField(max_length=128, blank=True)
    credentials_sent = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({self.iban})"
    
    def set_pin(self, raw_pin: str):
        self.pin = make_password(raw_pin)

    def check_pin(self, raw_pin: str) -> bool:
        return check_password(raw_pin, self.pin)


class Card(models.Model):

    class Circuit(models.TextChoices):
        """Circuito appartenenza carta"""
        VISA   = "VISA",  "Visa"
        MAST   = "MC",    "Mastercard"
        AMEX   = "AMEX",  "American Express"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    account = models.ForeignKey(
        'accounts.BankAccount',
        on_delete=models.CASCADE,
        related_name='cards'
    )
    circuit = models.CharField(max_length=5, choices=Circuit.choices)
    pan_last4 = models.CharField(max_length=4)                
    pan_hash = models.CharField(max_length=128)              
    pan_real = models.CharField(max_length=19, blank=True, null=True) 
    expiry_month = models.PositiveSmallIntegerField()
    expiry_year = models.PositiveSmallIntegerField()
    cvv_hash = models.CharField(max_length=128)              
    cvv_real = models.CharField(max_length=4, blank=True, null=True)  
    holder_name = models.CharField(max_length=60)
    issued_at = models.DateField(auto_now_add=True)
    active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("account", "pan_hash")  

    def __str__(self):
        return f"{self.circuit} **** {self.pan_last4}"


class Contact(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='contacts'
    )
    name = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    iban = models.CharField(max_length=34)
    city = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "iban")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.iban})"


class Accredito(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    account = models.ForeignKey(
        BankAccount,
        on_delete=models.CASCADE,
        related_name="accrediti"
    )
    date = models.DateField(help_text="Data dell'accredito")
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Importo dell'accredito")
    currency = models.CharField(max_length=3, default="EUR", help_text="ISO 4217")
    description = models.TextField(blank=True)
    source = models.CharField(max_length=255, help_text="Origine dell'accredito (es. datore di lavoro, merchant)")
    notes = models.TextField(blank=True, help_text="Annotazioni libere")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.date} - {self.amount} {self.currency} da {self.source}"


@receiver(post_save, sender=BankAccount)
def sync_account_iban(sender, instance, **kwargs):
    """Helper function per sincronizzare l'iban"""
    try:
        account = Accounts.objects.get(user=instance.user)
        if account.iban != instance.iban:
            account.iban = instance.iban
            account.save(update_fields=["iban"])
    except Accounts.DoesNotExist:
        pass


class EstrattoConto(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='estratti_conto'
    )
    mese = models.PositiveSmallIntegerField() 
    anno = models.PositiveSmallIntegerField()
    saldo_iniziale = models.DecimalField(max_digits=12, decimal_places=2)
    saldo_finale = models.DecimalField(max_digits=12, decimal_places=2)
    data_creazione = models.DateTimeField(auto_now_add=True)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'mese', 'anno')
        ordering = ['-anno', '-mese']

    def __str__(self):
        return f" {self.mese:02d}/{self.anno}"
    

class GoalsSaving(models.Model):

    class Periodicita(models.TextChoices):
        """Classe per la scelta della periodicità"""
        SETTIMANALE = "WEEKLY", "Settimanale"
        MENSILE = "MONTHLY", "Mensile"
        TRIMESTRALE = "QUARTERLY", "Trimestrale"
        SEMESTRALE = "BIANNUAL", "Semestrale"
        ANNUALE = "YEARLY", "Annuale"

    class Colore(models.TextChoices):
        """Classe per la scelta del colore"""
        BLU = "#3498db", "Blu"
        VERDE = "#2ecc71", "Verde"
        ROSSO = "#e74c3c", "Rosso"
        ARANCIONE = "#f39c12", "Arancione"
        VIOLA = "#9b59b6", "Viola"
        TURCHESE = "#1abc9c", "Turchese"
        ROSA = "#e91e63", "Rosa"
        INDACO = "#3f51b5", "Indaco"

    id = models.UUIDField( 
        primary_key=True, 
        default=uuid.uuid4, 
        editable=False
    )
    bank_account = models.ForeignKey( 
        BankAccount,
        on_delete=models.CASCADE, 
        related_name='goals_saving'
    )
    nome = models.CharField(max_length=120, help_text="Nome dell'obiettivo (es. Vacanze, Sport, Auto)")
    importo_target = models.DecimalField( max_digits=12, decimal_places=2, help_text="Importo obiettivo da raggiungere")
    importo_attuale = models.DecimalField( max_digits=12, decimal_places=2, default=0, help_text="Importo attualmente risparmiato")
    colore = models.CharField( max_length=7, choices=Colore.choices, default=Colore.BLU, help_text="Colore dell'obiettivo per la visualizzazione")
    data_limite = models.DateField( blank=True, null=True, help_text="Data limite per raggiungere l'obiettivo (facoltativo)")
    periodicita = models.CharField( max_length=10, choices=Periodicita.choices, blank=True, help_text="Frequenza del versamento (facoltativo)")
    importo_periodicita = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, help_text="Importo da versare per ogni periodo")
    attivo = models.BooleanField(default=True)
    created = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created']
        unique_together = ('bank_account', 'nome')

    def __str__(self):
        return f"{self.nome} - {self.importo_attuale}/{self.importo_target}€"
    
    @property
    def percentuale_completamento(self):
        """Calcola la percentuale di completamento dell'obiettivo"""
        if self.importo_target > 0:
            return min((self.importo_attuale / self.importo_target) * 100, 100)
        return 0

    @property
    def importo_rimanente(self):
        """Calcola quanto manca per raggiungere l'obiettivo"""
        return max(self.importo_target - self.importo_attuale, 0)

    @property
    def is_completato(self):
        """Verifica se l'obiettivo è stato raggiunto"""
        return self.importo_attuale >= self.importo_target

    def aggiungi_versamento(self, importo, descrizione="Versamento"):
        """Metodo per aggiungere un versamento al goal"""
        from decimal import Decimal

        if not isinstance(importo, Decimal):
            importo = Decimal(str(importo))

        if importo <= 0:
            raise ValueError("L'importo deve essere positivo")

        movimento = GoalsSavingMovimento.objects.create(
            goal=self,
            tipo=GoalsSavingMovimento.TipoMovimento.VERSAMENTO,
            importo=importo,
            descrizione=descrizione
        )
        self.importo_attuale += importo
        self.save(update_fields=['importo_attuale', 'updated_at'])

        return movimento


class GoalsSavingMovimento(models.Model):
    
    class TipoMovimento(models.TextChoices):
        """Classe per il tipo di movimento"""
        VERSAMENTO = "DEPOSIT", "Versamento"
        PRELIEVO = "WITHDRAWAL", "Prelievo"
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    goal = models.ForeignKey(
        GoalsSaving, 
        on_delete=models.CASCADE, 
        related_name='movimenti'
    )
    tipo = models.CharField(max_length=10, choices=TipoMovimento.choices)
    importo = models.DecimalField(max_digits=12, decimal_places=2)
    descrizione = models.TextField(blank=True)
    data_movimento = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-data_movimento']
    
    def __str__(self):
        return f"{self.goal.nome} - {self.tipo} {self.importo}€"