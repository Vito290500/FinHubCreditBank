"""
Configurazione admin per l'users
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Classe per la visualizzazione dell'user nella sezione admin"""

    model = User
    list_display   = ("email", "full_name", "is_staff", "is_superuser", "is_active", "last_login")
    list_filter    = ("is_staff", "is_superuser", "is_active")
    search_fields  = ("email", "full_name")
    ordering       = ("email",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Dati personali", {"fields": ("full_name",)}),
        ("Permessi", {
            "fields": (
                "is_active",
                "is_staff",
                "is_superuser",
                "groups",
                "user_permissions",
            )
        }),
        ("Informazioni di accesso", {"fields": ("last_login",)}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "full_name", "password1", "password2", "is_active", "is_staff", "is_superuser"),
        }),
    )