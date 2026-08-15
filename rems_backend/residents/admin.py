from django.contrib import admin

from .models import Resident


@admin.register(Resident)
class ResidentAdmin(admin.ModelAdmin):

    list_display = (
        "full_name",
        "username",
        "resident_type",
        "phone",
        "email",
        "is_active",
        "created_at",
    )

    list_filter = (
        "resident_type",
        "is_active",
        "created_at",
    )

    search_fields = (
        "first_name",
        "middle_name",
        "last_name",
        "phone",
        "email",
        "user__username",
    )

    ordering = (
        "last_name",
        "first_name",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    def full_name(
        self,
        obj,
    ):
        return obj.full_name

    full_name.short_description = "Name"

    def username(
        self,
        obj,
    ):
        return obj.user.username

    username.short_description = "Username"