"""
Configurazione serializers per users app
"""

from djoser.serializers import TokenCreateSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class CustomTokenCreateSerializer(TokenCreateSerializer):
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({'detail': 'Credenziali non valide'}, code='authorization')

        if not user.is_active:
            raise serializers.ValidationError({'detail': "Account non attivo: controlla la tua email per l'attivazione."}, code='authorization')

        if not user.check_password(password):
            raise serializers.ValidationError({'detail': 'Credenziali non valide'}, code='authorization')

        return super().validate(attrs) 