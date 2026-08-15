from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):

    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "role",
        "phone",
        "is_active_resident",
        "is_active",
    )

    list_filter = (
        "role",
        "is_active",
        "is_active_resident",
        "is_staff",
        "is_superuser",
    )

    search_fields = (
        "username",
        "first_name",
        "last_name",
        "email",
        "phone",
    )

    ordering = (
        "username",
    )

    fieldsets = UserAdmin.fieldsets + (
        (
            "REMS Information",
            {
                "fields": (
                    "role",
                    "phone",
                    "profile_picture",
                    "is_active_resident",
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "REMS Information",
            {
                "fields": (
                    "role",
                    "phone",
                    "profile_picture",
                    "is_active_resident",
                )
            },
        ),
    )