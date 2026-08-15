from django.contrib import admin

from .models import (
    Property,
    PropertyOccupancy,
    PropertyOwnership,
)


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):

    list_display = (
        "address",
        "subdivision",
        "block",
        "lot",
        "status",
        "is_active",
        "created_at",
    )

    list_filter = (
        "status",
        "is_active",
        "subdivision",
    )

    search_fields = (
        "address",
        "block",
        "lot",
        "house_number",
        "street",
    )

    ordering = (
        "block",
        "lot",
    )


@admin.register(PropertyOwnership)
class PropertyOwnershipAdmin(admin.ModelAdmin):

    list_display = (
        "property",
        "homeowner",
        "start_date",
        "end_date",
        "is_active",
    )

    list_filter = (
        "is_active",
        "start_date",
    )

    search_fields = (
        "property__address",
        "homeowner__username",
        "homeowner__first_name",
        "homeowner__last_name",
    )


@admin.register(PropertyOccupancy)
class PropertyOccupancyAdmin(admin.ModelAdmin):

    list_display = (
        "property",
        "resident",
        "occupancy_type",
        "start_date",
        "end_date",
        "is_active",
    )

    list_filter = (
        "occupancy_type",
        "is_active",
        "start_date",
    )

    search_fields = (
        "property__address",
        "resident__first_name",
        "resident__last_name",
        "resident__user__username",
    )