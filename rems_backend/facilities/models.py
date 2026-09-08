
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from datetime import datetime
from django.utils import timezone


# ============================================================
# FACILITY
# ============================================================

class Facility(models.Model):

    class FacilityType(models.TextChoices):
        CLUBHOUSE = (
            "CLUBHOUSE",
            "Clubhouse",
        )

        BASKETBALL_COURT = (
            "BASKETBALL_COURT",
            "Basketball Court",
        )

        SWIMMING_POOL = (
            "SWIMMING_POOL",
            "Swimming Pool",
        )

        CHILDREN_PARK = (
            "CHILDREN_PARK",
            "Children's Park",
        )

        CAR_PARKING = (
            "CAR_PARKING",
            "Car Parking",
        )

    # --------------------------------------------------------
    # BASIC INFORMATION
    # --------------------------------------------------------

    name = models.CharField(
        max_length=150,
    )

    facility_type = models.CharField(
        max_length=30,
        choices=FacilityType.choices,
    )

    description = models.TextField(
        blank=True,
        default="",
    )

    location = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    # --------------------------------------------------------
    # CAPACITY
    # --------------------------------------------------------

    capacity = models.PositiveIntegerField(
        default=1,
    )

    parking_capacity = models.PositiveIntegerField(
        blank=True,
        null=True,
    )

    # --------------------------------------------------------
    # BOOKING RULES
    # --------------------------------------------------------

    minimum_booking_minutes = models.PositiveIntegerField(
        default=60,
    )

    maximum_booking_minutes = models.PositiveIntegerField(
        default=480,
    )

    advance_booking_days = models.PositiveIntegerField(
        default=30,
    )

    requires_approval = models.BooleanField(
        default=True,
    )

    requires_security_deposit = models.BooleanField(
        default=False,
    )

    security_deposit_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    # --------------------------------------------------------
    # FEES
    # --------------------------------------------------------

    rental_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    resident_discount_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    # --------------------------------------------------------
    # AVAILABILITY
    # --------------------------------------------------------

    is_active = models.BooleanField(
        default=True,
    )

    is_bookable = models.BooleanField(
        default=True,
    )

    # --------------------------------------------------------
    # TIMESTAMPS
    # --------------------------------------------------------

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "name",
        ]

    def clean(self):

        if (
            self.minimum_booking_minutes
            <= 0
        ):
            raise ValidationError(
                {
                    "minimum_booking_minutes":
                        "Minimum booking duration must be greater than zero."
                }
            )

        if (
            self.maximum_booking_minutes
            < self.minimum_booking_minutes
        ):
            raise ValidationError(
                {
                    "maximum_booking_minutes":
                        "Maximum booking duration must be greater than or equal to the minimum duration."
                }
            )

        if self.capacity < 1:
            raise ValidationError(
                {
                    "capacity":
                        "Facility capacity must be at least 1."
                }
            )

        if (
            self.parking_capacity is not None
            and self.parking_capacity < 0
        ):
            raise ValidationError(
                {
                    "parking_capacity":
                        "Parking capacity cannot be negative."
                }
            )

        if self.rental_fee < 0:
            raise ValidationError(
                {
                    "rental_fee":
                        "Rental fee cannot be negative."
                }
            )

        if self.security_deposit_amount < 0:
            raise ValidationError(
                {
                    "security_deposit_amount":
                        "Security deposit cannot be negative."
                }
            )

        if not (
            Decimal("0.00")
            <= self.resident_discount_percent
            <= Decimal("100.00")
        ):
            raise ValidationError(
                {
                    "resident_discount_percent":
                        "Resident discount must be between 0 and 100 percent."
                }
            )

        if (
            not self.requires_security_deposit
            and self.security_deposit_amount
            != Decimal("0.00")
        ):
            raise ValidationError(
                {
                    "security_deposit_amount":
                        "Security deposit amount must be zero when a security deposit is not required."
                }
            )

    def __str__(self):
        return self.name


# ============================================================
# FACILITY BOOKING
# ============================================================

class Booking(models.Model):

    class Status(models.TextChoices):


        PENCIL = (
            "PENCIL",
            "Pencil Book",
        )

        PENDING = (
            "PENDING",
            "Pending Approval",
        )

        APPROVED = (
            "APPROVED",
            "Approved",
        )

        REJECTED = (
            "REJECTED",
            "Rejected",
        )

        CANCELLED = (
            "CANCELLED",
            "Cancelled",
        )

        EXPIRED = (
            "EXPIRED",
            "Expired",
        )

        IN_USE = (
            "IN_USE",
            "In Use",
        )

        COMPLETED = (
            "COMPLETED",
            "Completed",
        )

        INSPECTION_PENDING = (
            "INSPECTION_PENDING",
            "Inspection Pending",
        )

        REFUND_PENDING = (
            "REFUND_PENDING",
            "Refund Pending",
        )

        CLOSED = (
            "CLOSED",
            "Closed",
        )

    class EventType(models.TextChoices):

        PERSONAL = (
            "PERSONAL",
            "Personal",
        )

        FAMILY = (
            "FAMILY",
            "Family",
        )

        BIRTHDAY = (
            "BIRTHDAY",
            "Birthday",
        )

        MEETING = (
            "MEETING",
            "Meeting",
        )

        COMMUNITY_EVENT = (
            "COMMUNITY_EVENT",
            "Community Event",
        )

        OTHER = (
            "OTHER",
            "Other",
        )

    # --------------------------------------------------------
    # OWNERSHIP / RESOURCE
    # --------------------------------------------------------

    facility = models.ForeignKey(
        Facility,
        on_delete=models.PROTECT,
        related_name="bookings",
    )

    resident = models.ForeignKey(
        "residents.Resident",
        on_delete=models.PROTECT,
        related_name="facility_bookings",
    )

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PENCIL,
    )

    # --------------------------------------------------------
    # SCHEDULE
    # --------------------------------------------------------

    booking_date = models.DateField()

    start_time = models.TimeField()

    end_time = models.TimeField()

    # --------------------------------------------------------
    # EVENT INFORMATION
    # --------------------------------------------------------

    event_type = models.CharField(
        max_length=30,
        choices=EventType.choices,
        default=EventType.PERSONAL,
    )

    event_description = models.TextField(
        blank=True,
        default="",
    )

    estimated_guests = models.PositiveIntegerField(
        default=1,
    )

    # --------------------------------------------------------
    # EXTERNAL SUPPLIER
    #
    # Supplier information is part of the pencil booking
    # itself. No separate resident supplier document is
    # required.
    # --------------------------------------------------------

    has_external_supplier = models.BooleanField(
        default=False,
    )

    supplier_details = models.TextField(
        blank=True,
        default="",
    )

    # --------------------------------------------------------
    # FINANCIAL SNAPSHOT
    #
    # These values are copied from the facility configuration
    # when the resident submits the pencil booking.
    #
    # The booking therefore retains the exact financial state
    # applicable to that reservation.
    # --------------------------------------------------------

    rental_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    security_deposit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    total_amount_due = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    # --------------------------------------------------------
    # PENCIL BOOK CONTROL
    # --------------------------------------------------------

    pencil_created_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    pencil_expires_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    submitted_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    # --------------------------------------------------------
    # APPROVAL
    # --------------------------------------------------------

    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="approved_facility_bookings",
        blank=True,
        null=True,
    )

    approved_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    rejection_reason = models.TextField(
        blank=True,
        default="",
    )

    # --------------------------------------------------------
    # CANCELLATION
    # --------------------------------------------------------

    cancelled_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    cancellation_reason = models.TextField(
        blank=True,
        default="",
    )

    # --------------------------------------------------------
    # SECURITY CLEARANCE
    # --------------------------------------------------------

    security_clearance_required = models.BooleanField(
        default=True,
    )

    security_clearance_completed = models.BooleanField(
        default=False,
    )

    security_cleared_by= models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="cleared_facility_bookings",
        blank=True,
        null=True,
    )

    security_cleared_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    # --------------------------------------------------------
    # POST-EVENT INSPECTION
    # --------------------------------------------------------

    inspection_required = models.BooleanField(
        default=True,
    )

    # --------------------------------------------------------
    # TIMESTAMPS
    # --------------------------------------------------------

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-booking_date",
            "-start_time",
        ]

        indexes = [

            models.Index(
                fields=[
                    "facility",
                    "booking_date",
                    "status",
                ]
            ),

            models.Index(
                fields=[
                    "resident",
                    "-booking_date",
                ]
            ),

            models.Index(
                fields=[
                    "status",
                    "pencil_expires_at",
                ]
            ),
        ]

    def clean(self):

        if self.end_time <= self.start_time:
            raise ValidationError(
                {
                    "end_time":
                        "End time must be later than start time."
                }
            )

        if self.estimated_guests < 1:
            raise ValidationError(
                {
                    "estimated_guests":
                        "Estimated guests must be at least 1."
                }
            )

        if (
            self.facility
            and self.estimated_guests
            > self.facility.capacity
        ):
            raise ValidationError(
                {
                    "estimated_guests":
                        "The estimated number of guests exceeds the facility capacity."
                }
            )

        if self.has_external_supplier:
            if not self.supplier_details.strip():
                raise ValidationError(
                    {
                        "supplier_details":
                            "Supplier details are required when an external supplier is involved."
                    }
                )

        if self.rental_fee < 0:
            raise ValidationError(
                {
                    "rental_fee":
                        "Rental fee cannot be negative."
                }
            )

        if self.discount_amount < 0:
            raise ValidationError(
                {
                    "discount_amount":
                        "Discount amount cannot be negative."
                }
            )

        if self.security_deposit < 0:
            raise ValidationError(
                {
                    "security_deposit":
                        "Security deposit cannot be negative."
                }
            )

        if self.total_amount_due < 0:
            raise ValidationError(
                {
                    "total_amount_due":
                        "Total amount due cannot be negative."
                }
            )

    @property
    def is_pencil_expired(self):
        if (
            self.status
            != self.Status.PENCIL
        ):
            return False

        if not self.pencil_expires_at:
            return False

        return (
            timezone.now()
            >= self.pencil_expires_at
        )

    @property
    def scheduled_end_datetime(self):
        if (
            not self.booking_date
            or not self.end_time
        ):
            return None

        return timezone.make_aware(
                datetime.combine(
                self.booking_date,
                self.end_time,
            )
        )

    @property
    def is_overdue(self):
        scheduled_end = (
            self.scheduled_end_datetime
        )

        if not scheduled_end:
            return False

        return (
            timezone.now()
            >= scheduled_end
        )

    def __str__(self):
        return (
            f"{self.facility.name} - "
            f"{self.booking_date} - "
            f"{self.resident.full_name}"
        )


# ============================================================
# BOOKING GUEST
#
# This replaces the old separate guest + vehicle-permit
# relationship.
#
# One database row represents exactly one row in the resident's
# inline/XLSX guest table:
#
# Guest Name
# Guest Vehicle Plate Number
# Guest Vehicle Model
#
# No phone number, address, ID, or other unnecessary guest
# information is stored.
# ============================================================

class BookingGuest(models.Model):

    booking= models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name="guests",
    )

    row_number = models.PositiveIntegerField(
        default=1,
    )

    full_name = models.CharField(
        max_length=200,
    )

    vehicle_plate_number = models.CharField(
        max_length=30,
        blank=True,
        default="",
    )

    vehicle_model = models.CharField(
        max_length=150,
        blank=True,
        default="",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:

        ordering = [
            "row_number",
            "id",
        ]

        constraints = [

            models.UniqueConstraint(
                fields=[
                    "booking",
                    "row_number",
                ],
                name="unique_booking_guest_row",
            ),
        ]

        indexes = [

            models.Index(
                fields=[
                    "booking",
                    "row_number",
                ]
            ),

            models.Index(
                fields=[
                    "vehicle_plate_number",
                ]
            ),
        ]

    def clean(self):

        if not self.full_name.strip():
            raise ValidationError(
                {
                    "full_name":
                        "Guest name is required."
                }
            )

        if self.row_number < 1:
            raise ValidationError(
                {
                    "row_number":
                        "Guest row number must start at 1."
                }
            )

        if (
            self.booking
            and self.booking.estimated_guests
            and self.row_number
            > self.booking.estimated_guests
        ):
            raise ValidationError(
                {
                    "row_number":
                        "The guest row exceeds the estimated guest count for this booking."
                }
            )

    def __str__(self):
        return (
            f"{self.booking_id} - "
            f"{self.row_number} - "
            f"{self.full_name}"
        )


# ============================================================
# BOOKING PAYMENT
#
# One resident submission = one BOOKING_TOTAL payment.
#
# Refunds are represented explicitly rather than looking like
# another ordinary booking charge.
# ============================================================

class BookingPayment(models.Model):

    class PaymentType(models.TextChoices):

        BOOKING_TOTAL = (
            "BOOKING_TOTAL",
            "Facility Booking Total",
        )

        SECURITY_DEPOSIT_REFUND = (
            "SECURITY_DEPOSIT_REFUND",
            "Security Deposit Refund",
        )

    class PaymentMethod(models.TextChoices):

        CASH = (
            "CASH",
            "Cash",
        )

        CHECK = (
            "CHECK",
            "Check",
        )

        GCASH = (
            "GCASH",
            "GCash",
        )

        MAYA = (
            "MAYA",
            "Maya",
        )

        INSTAPAY_QR = (
            "INSTAPAY_QR",
            "InstaPay QR",
        )

        BANK_TRANSFER = (
            "BANK_TRANSFER",
            "Bank Transfer",
        )

        OTHER = (
            "OTHER",
            "Other",
        )

    class Status(models.TextChoices):

        PENDING = (
            "PENDING",
            "Pending Verification",
        )

        VERIFIED = (
            "VERIFIED",
            "Verified",
        )

        REJECTED = (
            "REJECTED",
            "Rejected",
        )

        REFUNDED = (
            "REFUNDED",
            "Refunded",
        )

    class Direction(models.TextChoices):

        INCOMING = (
            "INCOMING",
            "Incoming",
        )

        OUTGOING = (
            "OUTGOING",
            "Outgoing",
        )
        
    status = models.CharField(
                max_length=30,
                choices=Status.choices,
                default=Status.PENDING,
            )

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name="payments",
    )

    payment_type = models.CharField(
        max_length=40,
        choices=PaymentType.choices,
    )

    payment_method = models.CharField(
        max_length=30,
        choices=PaymentMethod.choices,
    )

    direction = models.CharField(
        max_length=20,
        choices=Direction.choices,
        default=Direction.INCOMING,
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    reference_number = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )
    
    

    proof = models.FileField(
        upload_to="facility_bookings/payment_proofs/",
        blank=True,
        null=True,
    )

    paid_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    verified_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="verified_booking_payments",
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:

        ordering = [
            "-created_at",
        ]

        indexes = [

            models.Index(
                fields=[
                    "booking",
                    "payment_type",
                    "status",
                ]
            ),

            models.Index(
                fields=[
                    "reference_number",
                ]
            ),
        ]

    def clean(self):

        if self.amount <= 0:
            raise ValidationError(
                {
                    "amount":
                        "Payment amount must be greater than zero."
                }
            )

        if (
            self.payment_type
            == self.PaymentType.BOOKING_TOTAL
        ):
            if self.direction != self.Direction.INCOMING:
                raise ValidationError(
                    {
                        "direction":
                            "A booking total payment must be an incoming payment."
                    }
                )

        if (
            self.payment_type
            == self.PaymentType.SECURITY_DEPOSIT_REFUND
        ):
            if self.direction != self.Direction.OUTGOING:
                raise ValidationError(
                    {
                        "direction":
                            "A security deposit refund must be an outgoing payment."
                    }
                )

    def __str__(self):

        if (
            self.payment_type
            == self.PaymentType.SECURITY_DEPOSIT_REFUND
        ):
            return (
                f"Refund - Booking #{self.booking_id} - "
                f"₱{self.amount:,.2f}"
            )

        return (
            f"Booking Payment - "
            f"Booking #{self.booking_id} - "
            f"₱{self.amount:,.2f}"
        )


# ============================================================
# BOOKING INSPECTION
# ============================================================

class BookingInspection(models.Model):

    class Result(models.TextChoices):

        PENDING = (
            "PENDING",
            "Pending",
        )

        PASSED = (
            "PASSED",
            "Passed",
        )

        DAMAGE_FOUND = (
            "DAMAGE_FOUND",
            "Damage Found",
        )

        CLEANUP_REQUIRED = (
            "CLEANUP_REQUIRED",
            "Cleanup Required",
        )

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name="inspection",
    )

    inspected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="facility_inspections",
        blank=True,
        null=True,
    )

    inspected_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    result = models.CharField(
        max_length=30,
        choices=Result.choices,
        default=Result.PENDING,
    )

    notes = models.TextField(
        blank=True,
        default="",
    )

    refund_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    deduction_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-created_at",
        ]

    def clean(self):

        if self.deduction_amount < 0:
            raise ValidationError(
                {
                    "deduction_amount":
                        "Deduction amount cannot be negative."
                }
            )

        if self.refund_amount < 0:
            raise ValidationError(
                {
                    "refund_amount":
                        "Refund amount cannot be negative."
                }
            )

        if (
            self.booking
            and self.deduction_amount
            > self.booking.security_deposit
        ):
            raise ValidationError(
                {
                    "deduction_amount":
                        "Deduction cannot exceed the security deposit."
                }
            )

        if (
            self.booking
            and self.refund_amount
            > self.booking.security_deposit
        ):
            raise ValidationError(
                {
                    "refund_amount":
                        "Refund cannot exceed the security deposit."
                }
            )

    def __str__(self):

        return (
            f"Inspection - "
            f"Booking #{self.booking_id}"
        )
