from django.contrib import admin

from .models import Gate


@admin.register(Gate)
class GateAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "gate_type",
        "location",
        "is_primary",
        "is_active",
        "created_at",
    )

    list_filter = (
        "gate_type",
        "is_primary",
        "is_active",
        "created_at",
    )

    search_fields = (
        "name",
        "location",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    ordering = (
        "name",
    )