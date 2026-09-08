
from django.contrib import admin

from .models import (
    Facility,
    Booking,
    BookingGuest,
    BookingPayment,
    BookingInspection,
)


# ============================================================
# FACILITY
# ============================================================

@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "facility_type",
        "capacity",
        "rental_fee",
        "security_deposit_amount",
        "requires_approval",
        "requires_security_deposit",
        "is_active",
        "is_bookable",
    )

    list_filter = (
        "facility_type",
        "requires_approval",
        "requires_security_deposit",
        "is_active",
        "is_bookable",
    )

    search_fields = (
        "name",
        "description",
        "location",
    )

    ordering = (
        "name",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (
            "Facility",
            {
                "fields": (
                    "name",
                    "facility_type",
                    "description",
                    "location",
                )
            },
        ),
        (
            "Capacity",
            {
                "fields": (
                    "capacity",
                    "parking_capacity",
                )
            },
        ),
        (
            "Booking Rules",
            {
                "fields": (
                    "minimum_booking_minutes",
                    "maximum_booking_minutes",
                    "advance_booking_days",
                    "requires_approval",
                )
            },
        ),
        (
            "Financial Settings",
            {
                "fields": (
                    "rental_fee",
                    "resident_discount_percent",
                    "requires_security_deposit",
                    "security_deposit_amount",
                )
            },
        ),
        (
            "Availability",
            {
                "fields": (
                    "is_active",
                    "is_bookable",
                )
            },
        ),
        (
            "Audit",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )


# ============================================================
# BOOKING
# ============================================================

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "facility",
        "resident",
        "booking_date",
        "start_time",
        "end_time",
        "estimated_guests",
        "status",
        "total_amount_due",
        "security_clearance_completed",
    )

    list_filter = (
        "status",
        "booking_date",
        "event_type",
        "security_clearance_completed",
        "inspection_required",
        "has_external_supplier",
    )

    search_fields = (
        "facility__name",
        "resident__first_name",
        "resident__last_name",
        "resident__user__username",
        "resident__user__email",
        "event_description",
    )

    ordering = (
        "-booking_date",
        "-start_time",
    )

    readonly_fields = (
        "rental_fee",
        "discount_amount",
        "security_deposit",
        "total_amount_due",
        "pencil_expires_at",
        "approved_at",
        "cancelled_at",
        "created_at",
        "updated_at",
    )

    raw_id_fields = (
        "facility",
        "resident",
        "approved_by",
    )

    fieldsets = (
        (
            "Booking",
            {
                "fields": (
                    "facility",
                    "resident",
                    "status",
                )
            },
        ),
        (
            "Schedule",
            {
                "fields": (
                    "booking_date",
                    "start_time",
                    "end_time",
                )
            },
        ),
        (
            "Event",
            {
                "fields": (
                    "event_type",
                    "event_description",
                    "estimated_guests",
                )
            },
        ),
        (
            "Supplier",
            {
                "fields": (
                    "has_external_supplier",
                    "supplier_details",
                )
            },
        ),
        (
            "Financials",
            {
                "fields": (
                    "rental_fee",
                    "discount_amount",
                    "security_deposit",
                    "total_amount_due",
                )
            },
        ),
        (
            "Pencil Hold",
            {
                "fields": (
                    "pencil_expires_at",
                )
            },
        ),
        (
            "Approval",
            {
                "fields": (
                    "approved_by",
                    "approved_at",
                    "rejection_reason",
                )
            },
        ),
        (
            "Cancellation",
            {
                "fields": (
                    "cancelled_at",
                    "cancellation_reason",
                )
            },
        ),
        (
            "Security",
            {
                "fields": (
                    "security_clearance_required",
                    "security_clearance_completed",
                )
            },
        ),
        (
            "Inspection",
            {
                "fields": (
                    "inspection_required",
                )
            },
        ),
        (
            "Audit",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )





# ============================================================
# BOOKING GUEST
# ============================================================

@admin.register(BookingGuest)
class BookingGuestAdmin(admin.ModelAdmin):
    list_display = (
        "row_number",
        "full_name",
        "vehicle_plate_number",
        "vehicle_model",
        "booking",
    )

    list_filter = (
        "booking__status",
        "booking__booking_date",
    )

    search_fields = (
        "full_name",
        "vehicle_plate_number",
        "vehicle_model",
        "booking__facility__name",
        "booking__resident__first_name",
        "booking__resident__last_name",
    )

    ordering = (
        "booking",
        "row_number",
    )

    raw_id_fields = (
        "booking",
    )


# ============================================================
# BOOKING PAYMENT
# ============================================================

@admin.register(BookingPayment)
class BookingPaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "booking",
        "payment_type",
        "payment_method",
        "amount",
        "status",
        "reference_number",
        "verified_by",
        "created_at",
    )

    list_filter = (
        "payment_type",
        "payment_method",
        "status",
        "created_at",
        "verified_at",
    )

    search_fields = (
        "reference_number",
        "booking__facility__name",
        "booking__resident__first_name",
        "booking__resident__last_name",
        "verified_by__username",
    )

    ordering = (
        "-created_at",
    )

    readonly_fields = (
        "verified_at",
        "verified_by",
        "created_at",
    )

    raw_id_fields = (
        "booking",
        "verified_by",
    )

    fieldsets = (
        (
            "Payment",
            {
                "fields": (
                    "booking",
                    "payment_type",
                    "payment_method",
                    "amount",
                    "reference_number",
                    "proof",
                )
            },
        ),
        (
            "Verification",
            {
                "fields": (
                    "status",
                    "paid_at",
                    "verified_at",
                    "verified_by",
                )
            },
        ),
        (
            "Audit",
            {
                "fields": (
                    "created_at",
                )
            },
        ),
    )


# ============================================================
# BOOKING INSPECTION
# ============================================================

@admin.register(BookingInspection)
class BookingInspectionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "booking",
        "result",
        "deduction_amount",
        "refund_amount",
        "inspected_by",
        "inspected_at",
    )

    list_filter = (
        "result",
        "inspected_at",
    )

    search_fields = (
        "booking__facility__name",
        "booking__resident__first_name",
        "booking__resident__last_name",
        "notes",
        "inspected_by__username",
    )

    ordering = (
        "-created_at",
    )

    readonly_fields = (
        "inspected_by",
        "inspected_at",
        "created_at",
    )

    raw_id_fields = (
        "booking",
        "inspected_by",
    )


