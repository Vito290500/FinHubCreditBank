"""
Configurazione delle view dell'account app
"""
import uuid
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets

from users.models import User
from transactions.pagination import TransactionPageNumberPagination
from .models import (
    Accounts,
    Contact,
    Accredito
)
from .serializers import (
    AccountWithProfileSerializer,
    ContactSerializer,
    AccreditoSerializer
)
from django.contrib.sites.shortcuts import get_current_site
from django.urls import reverse
from django.core.mail import send_mail


class MyAccountView(RetrieveUpdateAPIView):
    """Api per il retrive e update dei dati dell'account."""
    serializer_class = AccountWithProfileSerializer
    permission_classes =[IsAuthenticated]

    def get_queryset(self):
        return Accounts.objects.all()

    def get_object(self):
        return self.get_queryset().get(user=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        data = request.data
        old_email = instance.user.email
        response = super().update(request, *args, **kwargs)
        new_email = data.get('email')

        if new_email and new_email != old_email:
            user = instance.user
            user.email = new_email
            user.is_active = False
            recovery_code = str(uuid.uuid4())
            user.recovery_code = recovery_code
            user.save()
            response.data['recovery_code'] = recovery_code

        return response

class ContactListCreateView(APIView):
    """Api per la richiesta della lista coordinate salvate in rubrica"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        contacts = Contact.objects.filter(user=request.user) 
        serializer = ContactSerializer(contacts, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ContactSerializer(data=request.data)
        
        if serializer.is_valid():
            Contact.objects.create(user=request.user, **serializer.validated_data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ContactDeleteView(APIView):
    """Api per la richiesta di scarto delle coordinate non trovate"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):

        try:
            contact = Contact.objects.get(pk=pk, user=request.user)
            contact.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        except Contact.DoesNotExist:
            return Response({'detail': 'Contatto non trovato.'}, status=status.HTTP_404_NOT_FOUND)

class AccreditoViewSet(viewsets.ReadOnlyModelViewSet):
    """Api per la richiesta di accredito."""
    serializer_class = AccreditoSerializer
    permission_classes = [IsAuthenticated]
    ordering_fields = ['created_at', 'date', 'amount', 'source', 'currency']
    pagination_class = TransactionPageNumberPagination

    def get_queryset(self):
        user = self.request.user
        return Accredito.objects.filter(account__user=user).order_by('-date', '-created_at')

   