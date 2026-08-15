from django.contrib import admin

from .models import (
    Vehicle,
    MotoristSticker,
)


@admin.register(Vehicle)
class VehicleAdmin(
    admin.ModelAdmin
):

    list_display = (
        "plate_number",
        "make",
        "model",
        "vehicle_type",
        "color",
        "registered_resident",
        "property",
        "is_active",
        "created_at",
    )

    list_filter = (
        "vehicle_type",
        "ownership_type",
        "is_active",
        "created_at",
    )

    search_fields = (
        "plate_number",
        "make",
        "model",
        "color",
        "registered_resident__first_name",
        "registered_resident__last_name",
        "property__address",
    )

    readonly_fields = (
        "vehicle_uuid",
        "created_at",
        "updated_at",
    )

    ordering = (
        "plate_number",
    )


@admin.register(MotoristSticker)
class MotoristStickerAdmin(
    admin.ModelAdmin
):

    list_display = (
        "sticker_number",
        "property",
        "vehicle",
        "resident",
        "status",
        "issued_at",
        "expires_at",
        "approved_by",
        "created_at",
    )

    list_filter = (
        "status",
        "created_at",
        "issued_at",
        "expires_at",
    )

    search_fields = (
        "sticker_number",
        "vehicle__plate_number",
        "resident__first_name",
        "resident__last_name",
        "property__address",
    )

    readonly_fields = (
        "sticker_number",
        "sticker_uuid",
        "issued_at",
        "revoked_at",
        "approved_by",
        "created_at",
        "updated_at",
    )

    ordering = (
        "-created_at",
    )