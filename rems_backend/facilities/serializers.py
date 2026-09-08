
from datetime import datetime
from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

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

class FacilitySerializer(
    serializers.ModelSerializer
):

    facility_type_display = serializers.CharField(
        source="get_facility_type_display",
        read_only=True,
    )

    class Meta:

        model = Facility

        fields = [
            "id",
            "name",
            "facility_type",
            "facility_type_display",
            "description",
            "location",

            "capacity",
            "parking_capacity",

            "minimum_booking_minutes",
            "maximum_booking_minutes",
            "advance_booking_days",

            "requires_approval",

            "requires_security_deposit",
            "security_deposit_amount",

            "rental_fee",
            "resident_discount_percent",

            "is_active",
            "is_bookable",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "facility_type_display",
            "created_at",
            "updated_at",
        ]


# ============================================================
# BOOKING GUEST
#
# One record = one row in the resident guest table.
#
# Only the information actually required for facility access
# is collected:
#
#   Guest Name
#   Guest Vehicle Plate Number
#   Guest Vehicle Model
#
# No guest phone number, address, ID, age, or remarks.
# ============================================================

class BookingGuestSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = BookingGuest

        fields = [
            "id",
            "booking",
            "row_number",
            "full_name",
            "vehicle_plate_number",
            "vehicle_model",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_full_name(
        self,
        value,
    ):

        value = str(
            value or ""
        ).strip()

        if not value:
            raise serializers.ValidationError(
                "Guest name is required."
            )

        if len(value) > 200:
            raise serializers.ValidationError(
                "Guest name is too long."
            )

        return value

    def validate_vehicle_plate_number(
        self,
        value,
    ):

        value = str(
            value or ""
        ).strip()

        if len(value) > 30:
            raise serializers.ValidationError(
                "Vehicle plate number is too long."
            )

        return value.upper()

    def validate_vehicle_model(
        self,
        value,
    ):

        value = str(
            value or ""
        ).strip()

        if len(value) > 150:
            raise serializers.ValidationError(
                "Vehicle model is too long."
            )

        return value

    def validate(
        self,
        attrs,
    ):

        booking = attrs.get(
            "booking",
            getattr(
                self.instance,
                "booking",
                None,
            ),
        )

        row_number = attrs.get(
            "row_number",
            getattr(
                self.instance,
                "row_number",
                None,
            ),
        )

        if not booking:
            raise serializers.ValidationError(
                {
                    "booking":
                        "A facility booking is required."
                }
            )

        if not row_number:
            raise serializers.ValidationError(
                {
                    "row_number":
                        "Guest row number is required."
                }
            )

        if row_number < 1:
            raise serializers.ValidationError(
                {
                    "row_number":
                        "Guest row number must start at 1."
                }
            )

        if (
            booking.estimated_guests
            and row_number
            > booking.estimated_guests
        ):
            raise serializers.ValidationError(
                {
                    "row_number":
                        "This guest exceeds the estimated guest count for the booking."
                }
            )

        # ----------------------------------------------------
        # Prevent duplicate row numbers.
        # ----------------------------------------------------

        queryset = (
            BookingGuest.objects
            .filter(
                booking=booking,
                row_number=row_number,
            )
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                {
                    "row_number":
                        "This guest row already exists for the booking."
                }
            )

        return attrs


# ============================================================
# PAYMENT
#
# Resident:
#   BOOKING_TOTAL
#
# Admin:
#   SECURITY_DEPOSIT_REFUND
#
# Refunds are outgoing transactions and are therefore explicitly
# separated from the resident's original booking payment.
# ============================================================

class BookingPaymentSerializer(
    serializers.ModelSerializer
):

    payment_type_display = serializers.CharField(
        source="get_payment_type_display",
        read_only=True,
    )

    payment_method_display = serializers.CharField(
        source="get_payment_method_display",
        read_only=True,
    )

    direction_display = serializers.CharField(
        source="get_direction_display",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    verified_by_name = serializers.CharField(
        source="verified_by.get_full_name",
        read_only=True,
    )

    class Meta:

        model = BookingPayment

        fields = [
            "id",

            "booking",

            "payment_type",
            "payment_type_display",

            "payment_method",
            "payment_method_display",

            "direction",
            "direction_display",

            "amount",

            "reference_number",
            "proof",

            "paid_at",

            "verified_at",
            "verified_by",
            "verified_by_name",

            "status",
            "status_display",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",

            "direction",
            "direction_display",

            "verified_at",
            "verified_by",
            "verified_by_name",

            "status",
            "status_display",

            "created_at",
            "updated_at",
        ]

    def validate_amount(
        self,
        value,
    ):

        if value <= Decimal(
            "0.00"
        ):
            raise serializers.ValidationError(
                "Payment amount must be greater than zero."
            )

        return value

    def validate_reference_number(
        self,
        value,
    ):

        value = str(
            value or ""
        ).strip()

        return value

    def validate(
        self,
        attrs,
    ):

        booking = attrs.get(
            "booking"
        )

        payment_type = attrs.get(
            "payment_type"
        )

        payment_method = attrs.get(
            "payment_method"
        )

        amount = attrs.get(
            "amount"
        )

        reference_number = str(
            attrs.get(
                "reference_number",
                ""
            )
            or ""
        ).strip()

        proof = attrs.get(
            "proof"
        )

        # ----------------------------------------------------
        # BOOKING
        # ----------------------------------------------------

        if not booking:
            raise serializers.ValidationError(
                {
                    "booking":
                        "A facility booking is required."
                }
            )

        # ----------------------------------------------------
        # BOOKING TOTAL
        # ----------------------------------------------------

        if (
            payment_type
            == BookingPayment.PaymentType.BOOKING_TOTAL
        ):

            if (
                booking.status
                not in [
                    Booking.Status.PENCIL,
                    Booking.Status.PENDING,
                ]
            ):
                raise serializers.ValidationError(
                    {
                        "booking":
                            "The booking cannot accept a payment in its current status."
                    }
                )

            # ----------------------------------------------
            # Only one consolidated booking payment.
            # ----------------------------------------------

            existing = (
                BookingPayment.objects
                .filter(
                    booking=booking,
                    payment_type=(
                        BookingPayment.PaymentType.BOOKING_TOTAL
                    ),
                )
            )

            if self.instance:
                existing = existing.exclude(
                    pk=self.instance.pk
                )

            if existing.exists():
                raise serializers.ValidationError(
                    {
                        "payment_type":
                            "A facility booking total payment has already been submitted."
                    }
                )

            # ----------------------------------------------
            # Full amount required.
            # ----------------------------------------------

            expected_amount = (
                booking.total_amount_due
                or Decimal("0.00")
            )

            if (
                amount is not None
                and amount != expected_amount
            ):
                raise serializers.ValidationError(
                    {
                        "amount":
                            (
                                f"The booking requires the exact "
                                f"total amount of "
                                f"₱{expected_amount:,.2f}."
                            )
                    }
                )

            # ----------------------------------------------
            # Reference is mandatory.
            # ----------------------------------------------

            if not reference_number:
                raise serializers.ValidationError(
                    {
                        "reference_number":
                            "Payment reference number is required."
                    }
                )

            # ----------------------------------------------
            # Proof is mandatory for resident submission.
            # ----------------------------------------------

            if (
                not proof
                and not self.instance
            ):
                raise serializers.ValidationError(
                    {
                        "proof":
                            "Payment proof is required."
                    }
                )

            attrs[
                "direction"
            ] = (
                BookingPayment.Direction.INCOMING
            )

        # ----------------------------------------------------
        # SECURITY DEPOSIT REFUND
        # ----------------------------------------------------

        elif (
            payment_type
            == BookingPayment.PaymentType.SECURITY_DEPOSIT_REFUND
        ):

            attrs[
                "direction"
            ] = (
                BookingPayment.Direction.OUTGOING
            )

            # Refunds are created by the admin workflow.
            #
            # Reference/proof are not required in the same
            # manner as an incoming resident payment.
            #

        else:

            raise serializers.ValidationError(
                {
                    "payment_type":
                        "Invalid facility payment type."
                }
            )

        # ----------------------------------------------------
        # PAYMENT METHOD
        # ----------------------------------------------------

        if not payment_method:
            raise serializers.ValidationError(
                {
                    "payment_method":
                        "Payment method is required."
                }
            )

        return attrs


# ============================================================
# INSPECTION
# ============================================================

class BookingInspectionSerializer(
    serializers.ModelSerializer
):

    result_display = serializers.CharField(
        source="get_result_display",
        read_only=True,
    )

    inspected_by_name = serializers.CharField(
        source="inspected_by.get_full_name",
        read_only=True,
    )

    class Meta:

        model = BookingInspection

        fields = [
            "id",
            "booking",

            "inspected_by",
            "inspected_by_name",
            "inspected_at",

            "result",
            "result_display",

            "notes",

            "refund_amount",
            "deduction_amount",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",

            "inspected_by",
            "inspected_by_name",
            "inspected_at",

            "created_at",
            "updated_at",
        ]

    def validate_deduction_amount(
        self,
        value,
    ):

        if value < Decimal(
            "0.00"
        ):
            raise serializers.ValidationError(
                "Deduction amount cannot be negative."
            )

        return value

    def validate_refund_amount(
        self,
        value,
    ):

        if value < Decimal(
            "0.00"
        ):
            raise serializers.ValidationError(
                "Refund amount cannot be negative."
            )

        return value

    def validate(
        self,
        attrs,
    ):

        booking = attrs.get(
            "booking",
            getattr(
                self.instance,
                "booking",
                None,
            ),
        )

        deduction_amount = attrs.get(
            "deduction_amount",
            getattr(
                self.instance,
                "deduction_amount",
                Decimal("0.00"),
            ),
        )

        refund_amount = attrs.get(
            "refund_amount",
            getattr(
                self.instance,
                "refund_amount",
                Decimal("0.00"),
            ),
        )

        if not booking:
            raise serializers.ValidationError(
                {
                    "booking":
                        "A booking is required."
                }
            )

        security_deposit = (
            booking.security_deposit
            or Decimal("0.00")
        )

        if (
            deduction_amount
            > security_deposit
        ):
            raise serializers.ValidationError(
                {
                    "deduction_amount":
                        "The deduction cannot exceed the security deposit."
                }
            )

        if (
            refund_amount
            > security_deposit
        ):
            raise serializers.ValidationError(
                {
                    "refund_amount":
                        "The refund cannot exceed the security deposit."
                }
            )

        # ----------------------------------------------------
        # Refund and deduction represent the same deposit.
        # Therefore their combined value must not exceed the
        # security deposit.
        # ----------------------------------------------------

        if (
            deduction_amount
            + refund_amount
            > security_deposit
        ):
            raise serializers.ValidationError(
                {
                    "refund_amount":
                        "The combined refund and deduction cannot exceed the security deposit."
                }
            )

        return attrs


# ============================================================
# BOOKING
# ============================================================

class BookingSerializer(
    serializers.ModelSerializer
):

    facility_name = serializers.CharField(
        source="facility.name",
        read_only=True,
    )

    facility_type_display = serializers.CharField(
        source="facility.get_facility_type_display",
        read_only=True,
    )

    resident_name = serializers.CharField(
        source="resident.full_name",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    event_type_display = serializers.CharField(
        source="get_event_type_display",
        read_only=True,
    )

    approved_by_name = serializers.CharField(
        source="approved_by.get_full_name",
        read_only=True,
    )

    security_cleared_by_name = serializers.CharField(
        source="security_cleared_by.get_full_name",
        read_only=True,
    )

    duration_minutes = (
        serializers.SerializerMethodField()
    )

    guest_count = (
        serializers.SerializerMethodField()
    )

    has_guest_list = (
        serializers.SerializerMethodField()
    )

    payment_submitted = (
        serializers.SerializerMethodField()
    )

    payment_verified = (
        serializers.SerializerMethodField()
    )

    guests = BookingGuestSerializer(
        many=True,
        read_only=True,
    )

    payments = BookingPaymentSerializer(
        many=True,
        read_only=True,
    )

    inspection = BookingInspectionSerializer(
        read_only=True,
    )

    class Meta:

        model = Booking

        fields = [

            # ------------------------------------------------
            # IDENTITY
            # ------------------------------------------------

            "id",

            "facility",
            "facility_name",
            "facility_type_display",

            "resident",
            "resident_name",

            # ------------------------------------------------
            # SCHEDULE
            # ------------------------------------------------

            "booking_date",
            "start_time",
            "end_time",
            "duration_minutes",

            # ------------------------------------------------
            # EVENT
            # ------------------------------------------------

            "event_type",
            "event_type_display",
            "event_description",

            "estimated_guests",

            # ------------------------------------------------
            # SUPPLIER
            # ------------------------------------------------

            "has_external_supplier",
            "supplier_details",

            # ------------------------------------------------
            # FINANCIALS
            # ------------------------------------------------

            "rental_fee",
            "discount_amount",
            "security_deposit",
            "total_amount_due",

            # ------------------------------------------------
            # PENCIL
            # ------------------------------------------------

            "pencil_created_at",
            "pencil_expires_at",
            "submitted_at",

            # ------------------------------------------------
            # STATUS
            # ------------------------------------------------

            "status",
            "status_display",

            # ------------------------------------------------
            # APPROVAL
            # ------------------------------------------------

            "approved_by",
            "approved_by_name",
            "approved_at",
            "rejection_reason",

            # ------------------------------------------------
            # CANCELLATION
            # ------------------------------------------------

            "cancelled_at",
            "cancellation_reason",

            # ------------------------------------------------
            # SECURITY
            # ------------------------------------------------

            "security_clearance_required",
            "security_clearance_completed",

            "security_cleared_by",
            "security_cleared_by_name",
            "security_cleared_at",

            # ------------------------------------------------
            # INSPECTION
            # ------------------------------------------------

            "inspection_required",

            # ------------------------------------------------
            # RESIDENT ACCESS SUMMARY
            # ------------------------------------------------

            "guest_count",
            "has_guest_list",

            "payment_submitted",
            "payment_verified",

            # ------------------------------------------------
            # RELATED DATA
            # ------------------------------------------------

            "guests",
            "payments",
            "inspection",

            # ------------------------------------------------
            # TIMESTAMPS
            # ------------------------------------------------

            "created_at",
            "updated_at",
        ]

        read_only_fields = [

            "id",

            "resident",

            "facility_name",
            "facility_type_display",
            "resident_name",

            "duration_minutes",

            "rental_fee",
            "discount_amount",
            "security_deposit",
            "total_amount_due",

            "pencil_created_at",
            "pencil_expires_at",
            "submitted_at",

            "status",
            "status_display",

            "approved_by",
            "approved_by_name",
            "approved_at",
            "rejection_reason",

            "cancelled_at",
            "cancellation_reason",

            "security_clearance_completed",

            "security_cleared_by",
            "security_cleared_by_name",
            "security_cleared_at",

            "guest_count",
            "has_guest_list",

            "payment_submitted",
            "payment_verified",

            "guests",
            "payments",
            "inspection",

            "created_at",
            "updated_at",
        ]

    # ========================================================
    # DURATION
    # ========================================================

    def get_duration_minutes(
        self,
        obj,
    ):

        start = datetime.combine(
            obj.booking_date,
            obj.start_time,
        )

        end = datetime.combine(
            obj.booking_date,
            obj.end_time,
        )

        return int(
            (
                end - start
            ).total_seconds()
            / 60
        )

    # ========================================================
    # GUEST COUNT
    # ========================================================

    def get_guest_count(
        self,
        obj,
    ):

        if hasattr(
            obj,
            "_guest_count",
        ):
            return obj._guest_count

        return obj.guests.count()

    # ========================================================
    # HAS GUEST LIST
    # ========================================================

    def get_has_guest_list(
        self,
        obj,
    ):

        return (
            self.get_guest_count(obj)
            > 0
        )

    # ========================================================
    # PAYMENT SUBMITTED
    # ========================================================

    def get_payment_submitted(
        self,
        obj,
    ):

        return (
            obj.payments
            .filter(
                payment_type=(
                    BookingPayment
                    .PaymentType
                    .BOOKING_TOTAL
                )
            )
            .exists()
        )

    # ========================================================
    # PAYMENT VERIFIED
    # ========================================================

    def get_payment_verified(
        self,
        obj,
    ):

        return (
            obj.payments
            .filter(
                payment_type=(
                    BookingPayment
                    .PaymentType
                    .BOOKING_TOTAL
                ),
                status=(
                    BookingPayment
                    .Status
                    .VERIFIED
                ),
            )
            .exists()
        )

    # ========================================================
    # BOOKING VALIDATION
    # ========================================================

    def validate(
        self,
        attrs,
    ):

        facility = attrs.get(
            "facility",
            getattr(
                self.instance,
                "facility",
                None,
            ),
        )

        booking_date = attrs.get(
            "booking_date",
            getattr(
                self.instance,
                "booking_date",
                None,
            ),
        )

        start_time = attrs.get(
            "start_time",
            getattr(
                self.instance,
                "start_time",
                None,
            ),
        )

        end_time = attrs.get(
            "end_time",
            getattr(
                self.instance,
                "end_time",
                None,
            ),
        )

        estimated_guests = attrs.get(
            "estimated_guests",
            getattr(
                self.instance,
                "estimated_guests",
                1,
            ),
        )

        has_external_supplier = attrs.get(
            "has_external_supplier",
            getattr(
                self.instance,
                "has_external_supplier",
                False,
            ),
        )

        supplier_details = attrs.get(
            "supplier_details",
            getattr(
                self.instance,
                "supplier_details",
                "",
            ),
        )

        # ----------------------------------------------------
        # FACILITY
        # ----------------------------------------------------

        if not facility:
            raise serializers.ValidationError(
                {
                    "facility":
                        "A facility is required."
                }
            )

        if not facility.is_active:
            raise serializers.ValidationError(
                {
                    "facility":
                        "This facility is currently unavailable."
                }
            )

        if not facility.is_bookable:
            raise serializers.ValidationError(
                {
                    "facility":
                        "This facility is not currently available for booking."
                }
            )

        # ----------------------------------------------------
        # DATE
        # ----------------------------------------------------

        if (
            booking_date
            and booking_date
            < timezone.localdate()
        ):

            raise serializers.ValidationError(
                {
                    "booking_date":
                        "A booking date cannot be in the past."
                }
            )

        # ----------------------------------------------------
        # TIME
        # ----------------------------------------------------

        if (
            start_time
            and end_time
            and end_time <= start_time
        ):

            raise serializers.ValidationError(
                {
                    "end_time":
                        "End time must be later than start time."
                }
            )

        # ----------------------------------------------------
        # DURATION
        # ----------------------------------------------------

        if (
            booking_date
            and start_time
            and end_time
        ):

            start = datetime.combine(
                booking_date,
                start_time,
            )

            end = datetime.combine(
                booking_date,
                end_time,
            )

            duration = int(
                (
                    end - start
                ).total_seconds()
                / 60
            )

            if (
                duration
                < facility.minimum_booking_minutes
            ):

                raise serializers.ValidationError(
                    {
                        "end_time":
                            (
                                "Minimum booking duration is "
                                f"{facility.minimum_booking_minutes} "
                                "minutes."
                            )
                    }
                )

            if (
                duration
                > facility.maximum_booking_minutes
            ):

                raise serializers.ValidationError(
                    {
                        "end_time":
                            (
                                "Maximum booking duration is "
                                f"{facility.maximum_booking_minutes} "
                                "minutes."
                            )
                    }
                )

        # ----------------------------------------------------
        # GUEST CAPACITY
        # ----------------------------------------------------

        if (
            estimated_guests
            < 1
        ):

            raise serializers.ValidationError(
                {
                    "estimated_guests":
                        "Estimated guests must be at least 1."
                }
            )

        if (
            estimated_guests
            > facility.capacity
        ):

            raise serializers.ValidationError(
                {
                    "estimated_guests":
                        (
                            "The estimated number of guests "
                            "exceeds the facility capacity."
                        )
                }
            )

        # ----------------------------------------------------
        # SUPPLIER
        # ----------------------------------------------------

        if has_external_supplier:

            if not str(
                supplier_details or ""
            ).strip():

                raise serializers.ValidationError(
                    {
                        "supplier_details":
                            (
                                "Supplier details are required "
                                "when external suppliers are "
                                "involved."
                            )
                    }
                )

        else:

            attrs[
                "supplier_details"
            ] = ""

        return attrs


# ============================================================
# AVAILABILITY QUERY
# ============================================================

class BookingAvailabilitySerializer(
    serializers.Serializer
):

    facility = (
        serializers.PrimaryKeyRelatedField(
            queryset=Facility.objects.filter(
                is_active=True,
                is_bookable=True,
            )
        )
    )

    booking_date = (
        serializers.DateField()
    )

    start_time = (
        serializers.TimeField()
    )

    end_time = (
        serializers.TimeField()
    )

    estimated_guests = (
        serializers.IntegerField(
            min_value=1,
            default=1,
        )
    )

    def validate(
        self,
        attrs,
    ):

        facility = attrs[
            "facility"
        ]

        booking_date = attrs[
            "booking_date"
        ]

        start_time = attrs[
            "start_time"
        ]

        end_time = attrs[
            "end_time"
        ]

        estimated_guests = attrs[
            "estimated_guests"
        ]

        # ----------------------------------------------------
        # DATE
        # ----------------------------------------------------

        if (
            booking_date
            < timezone.localdate()
        ):

            raise serializers.ValidationError(
                {
                    "booking_date":
                        "Booking date cannot be in the past."
                }
            )

        # ----------------------------------------------------
        # TIME
        # ----------------------------------------------------

        if (
            end_time
            <= start_time
        ):

            raise serializers.ValidationError(
                {
                    "end_time":
                        "End time must be later than start time."
                }
            )

        # ----------------------------------------------------
        # DURATION
        # ----------------------------------------------------

        start = datetime.combine(
            booking_date,
            start_time,
        )

        end = datetime.combine(
            booking_date,
            end_time,
        )

        duration = int(
            (
                end - start
            ).total_seconds()
            / 60
        )

        if (
            duration
            < facility.minimum_booking_minutes
        ):

            raise serializers.ValidationError(
                {
                    "end_time":
                        (
                            "Minimum booking duration is "
                            f"{facility.minimum_booking_minutes} "
                            "minutes."
                        )
                }
            )

        if (
            duration
            > facility.maximum_booking_minutes
        ):

            raise serializers.ValidationError(
                {
                    "end_time":
                        (
                            "Maximum booking duration is "
                            f"{facility.maximum_booking_minutes} "
                            "minutes."
                        )
                }
            )

        # ----------------------------------------------------
        # CAPACITY
        # ----------------------------------------------------

        if (
            estimated_guests
            > facility.capacity
        ):

            raise serializers.ValidationError(
                {
                    "estimated_guests":
                        (
                            "The estimated number of guests "
                            "exceeds the facility capacity."
                        )
                }
            )

        return attrs
