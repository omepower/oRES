
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from .models import (
    Booking,
    BookingGuest,
)


class FacilityBookingService:
    """
    Central business-logic layer for facility bookings.

    Responsibilities:
        - Availability checks
        - Financial calculations
        - Pencil-book expiration
        - Guest-list import preparation
        - Guest ordering helpers
        - Payment validation helpers

    The ViewSets should delegate business rules here instead
    of duplicating them across multiple endpoints.
    """

    PENCIL_HOLD_MINUTES = 30

    MONEY_QUANTIZE = Decimal("0.01")

    # ============================================================
    # MONEY
    # ============================================================

    @classmethod
    def money(
        cls,
        value,
    ):
        """
        Normalize monetary values to two decimal places.
        """
        if value is None:
            value = Decimal("0")

        return (
            Decimal(str(value))
            .quantize(
                cls.MONEY_QUANTIZE,
                rounding=ROUND_HALF_UP,
            )
        )

    # ============================================================
    # AVAILABILITY
    # ============================================================

    @classmethod
    def check_availability(
        cls,
        *,
        facility,
        booking_date,
        start_time,
        end_time,
        estimated_guests=1,
        exclude_booking_id=None,
    ):
        """
        Determine whether the requested facility/time block
        can be booked.

        Returns a predictable dictionary consumed by the API.
        """

        estimated_guests = int(
            estimated_guests or 0
        )

        if estimated_guests < 1:
            return {
                "available": False,
                "reason": (
                    "At least one guest is required."
                ),
            }

        if not facility.is_active:
            return {
                "available": False,
                "reason": (
                    "This facility is currently inactive."
                ),
            }

        if not facility.is_bookable:
            return {
                "available": False,
                "reason": (
                    "This facility is currently not available for booking."
                ),
            }

        if (
            facility.capacity
            and estimated_guests > facility.capacity
        ):
            return {
                "available": False,
                "reason": (
                    "The requested number of guests exceeds "
                    "the facility capacity."
                ),
            }

        if end_time <= start_time:
            return {
                "available": False,
                "reason": (
                    "End time must be later than start time."
                ),
            }

        # --------------------------------------------------------
        # BOOKING DATE WINDOW
        # --------------------------------------------------------

        today = timezone.localdate()

        if booking_date < today:
            return {
                "available": False,
                "reason": (
                    "The booking date cannot be in the past."
                ),
            }

        advance_days = (
            booking_date - today
        ).days

        if (
            facility.advance_booking_days is not None
            and advance_days
            > facility.advance_booking_days
        ):
            return {
                "available": False,
                "reason": (
                    "The selected date is outside the facility's "
                    "advance-booking window."
                ),
            }

        # --------------------------------------------------------
        # DURATION
        # --------------------------------------------------------

        start_minutes = (
            start_time.hour * 60
            + start_time.minute
        )

        end_minutes = (
            end_time.hour * 60
            + end_time.minute
        )

        duration_minutes = (
            end_minutes
            - start_minutes
        )

        if (
            duration_minutes
            < facility.minimum_booking_minutes
        ):
            return {
                "available": False,
                "reason": (
                    f"Minimum booking duration is "
                    f"{facility.minimum_booking_minutes} minutes."
                ),
            }

        if (
            duration_minutes
            > facility.maximum_booking_minutes
        ):
            return {
                "available": False,
                "reason": (
                    f"Maximum booking duration is "
                    f"{facility.maximum_booking_minutes} minutes."
                ),
            }

        # --------------------------------------------------------
        # OVERLAPPING ACTIVE BOOKINGS
        # --------------------------------------------------------

        active_statuses = [
            Booking.Status.PENCIL,
            Booking.Status.PENDING,
            Booking.Status.APPROVED,
            Booking.Status.IN_USE,
            Booking.Status.INSPECTION_PENDING,
            Booking.Status.REFUND_PENDING,
        ]

        overlapping = (
            Booking.objects
            .filter(
                facility=facility,
                booking_date=booking_date,
                status__in=active_statuses,
                start_time__lt=end_time,
                end_time__gt=start_time,
            )
        )

        if exclude_booking_id:
            overlapping = overlapping.exclude(
                pk=exclude_booking_id
            )

        if overlapping.exists():
            return {
                "available": False,
                "reason": (
                    "The selected facility time block "
                    "is already reserved."
                ),
            }

        # --------------------------------------------------------
        # SUCCESS
        # --------------------------------------------------------

        return {
            "available": True,
            "reason": (
                "The selected facility time block is available."
            ),
            "duration_minutes": duration_minutes,
        }

    # ============================================================
    # FINANCIALS
    # ============================================================

    @classmethod
    def calculate_financials(
        cls,
        facility,
    ):
        """
        Calculate the authoritative facility financial values.

        Current pricing model:
            rental_fee
            less resident discount
            plus security deposit
        """

        rental_fee = cls.money(
            facility.rental_fee
        )

        discount_percent = cls.money(
            facility.resident_discount_percent
        )

        discount_amount = cls.money(
            rental_fee
            * (
                discount_percent
                / Decimal("100")
            )
        )

        security_deposit = (
            cls.money(
                facility.security_deposit_amount
            )
            if facility.requires_security_deposit
            else Decimal("0.00")
        )

        payable_rental = cls.money(
            rental_fee
            - discount_amount
        )

        total_amount_due = cls.money(
            payable_rental
            + security_deposit
        )

        return {
            "rental_fee": rental_fee,
            "discount_amount": discount_amount,
            "security_deposit": security_deposit,
            "total_amount_due": total_amount_due,
        }

    # ============================================================
    # BOOKING FINANCIALS
    # ============================================================

    @classmethod
    def apply_financials(
        cls,
        booking,
    ):
        """
        Calculate and apply current facility pricing
        to a Booking instance.
        """

        financials = (
            cls.calculate_financials(
                booking.facility
            )
        )

        booking.rental_fee = financials[
            "rental_fee"
        ]

        booking.discount_amount = financials[
            "discount_amount"
        ]

        booking.security_deposit = financials[
            "security_deposit"
        ]

        booking.total_amount_due = financials[
            "total_amount_due"
        ]

        return financials

    # ============================================================
    # PENCIL HOLD
    # ============================================================

    @classmethod
    def pencil_expiry(
        cls,
    ):
        return (
            timezone.now()
            + timedelta(
                minutes=cls.PENCIL_HOLD_MINUTES
            )
        )

    @classmethod
    def expire_pencil_bookings(
        cls,
    ):
        """
        Safely expire Pencil holds.

        This method is intentionally isolated from normal GET
        queryset execution so an expiration-service problem cannot
        break the booking list endpoint.
        """

        now = timezone.now()

        expired_bookings = (
            Booking.objects
            .filter(
                status=Booking.Status.PENCIL,
                pencil_expires_at__isnull=False,
                pencil_expires_at__lte=now,
            )
            .exclude(
                booking_date__lt=timezone.localdate()
            )
        )

        expired_count = 0

        for booking in expired_bookings:
            booking.status = (
                Booking.Status.CANCELLED
            )

            booking.cancelled_at = now

            booking.cancellation_reason = (
                "Pencil booking expired before submission."
            )

            booking.pencil_expires_at = None

            booking.save(
                update_fields=[
                    "status",
                    "cancelled_at",
                    "cancellation_reason",
                    "pencil_expires_at",
                    "updated_at",
                ]
            )

            expired_count += 1

        return expired_count

    @classmethod
    def cancel_overdue_pencil_bookings(
        cls,
    ):
        """
        Alias retained for scheduled jobs / future management
        commands.
        """
        return cls.expire_pencil_bookings()

    # ============================================================
    # PENCIL VALIDATION
    # ============================================================

    @classmethod
    def validate_active_pencil_booking(
        cls,
        booking,
    ):
        """
        Validate that a booking is still an active Pencil hold.

        Returns:
            (True, "")
            or
            (False, message)
        """

        if booking.status != Booking.Status.PENCIL:
            return (
                False,
                "Only an active Pencil booking can be submitted.",
            )

        if booking.is_pencil_expired:
            return (
                False,
                (
                    "The Pencil booking has expired. "
                    "Please create a new reservation."
                ),
            )

        return (
            True,
            "",
        )

    # ============================================================
    # GUEST LIMITS
    # ============================================================

    @classmethod
    def guest_count(
        cls,
        booking,
    ):
        return (
            BookingGuest.objects
            .filter(
                booking=booking
            )
            .count()
        )

    @classmethod
    def guest_limit_reached(
        cls,
        booking,
    ):
        return (
            cls.guest_count(
                booking
            )
            >=
            int(
                booking.estimated_guests or 0
            )
        )

    @classmethod
    def next_guest_row_number(
        cls,
        booking,
    ):
        last_guest = (
            BookingGuest.objects
            .filter(
                booking=booking
            )
            .order_by(
                "-row_number",
                "-id",
            )
            .first()
        )

        if not last_guest:
            return 1

        return (
            int(
                last_guest.row_number
                or 0
            )
            + 1
        )

    # ============================================================
    # GUEST LIST NORMALIZATION
    # ============================================================

    @classmethod
    def normalize_guest_row(
        cls,
        row,
    ):
        """
        Normalize an imported XLSX row.

        Expected columns:
            Guest Name
            Guest Vehicle Plate Number
            Guest Vehicle Model
        """

        def clean(
            value,
        ):
            if value is None:
                return ""

            return str(
                value
            ).strip()

        return {
            "full_name": clean(
                row.get(
                    "Guest Name"
                )
            ),
            "vehicle_plate_number": clean(
                row.get(
                    "Guest Vehicle Plate Number"
                )
            ),
            "vehicle_model": clean(
                row.get(
                    "Guest Vehicle Model"
                )
            ),
        }

    @classmethod
    def validate_guest_row(
        cls,
        row,
        row_number=None,
    ):
        """
        Validate an already-normalized guest row.
        """

        errors = {}

        full_name = (
            str(
                row.get(
                    "full_name",
                    "",
                )
            )
            .strip()
        )

        vehicle_plate_number = (
            str(
                row.get(
                    "vehicle_plate_number",
                    "",
                )
            )
            .strip()
        )

        vehicle_model = (
            str(
                row.get(
                    "vehicle_model",
                    "",
                )
            )
            .strip()
        )

        if not full_name:
            errors[
                "full_name"
            ] = "Guest name is required."

        if len(full_name) > 200:
            errors[
                "full_name"
            ] = "Guest name must not exceed 200 characters."

        if len(vehicle_plate_number) > 30:
            errors[
                "vehicle_plate_number"
            ] = (
                "Guest vehicle plate number must not exceed "
                "30 characters."
            )

        if len(vehicle_model) > 150:
            errors[
                "vehicle_model"
            ] = (
                "Guest vehicle model must not exceed "
                "150 characters."
            )

        return errors

    # ============================================================
    # GUEST IMPORT
    # ============================================================

    @classmethod
    @transaction.atomic
    def import_guest_rows(
        cls,
        *,
        booking,
        rows,
        replace_existing=True,
    ):
        """
        Persist normalized guest rows.

        rows must be a list of dictionaries containing:
            full_name
            vehicle_plate_number
            vehicle_model
        """

        if booking.security_clearance_completed:
            raise ValueError(
                "The guest list is locked because security clearance has been completed."
            )

        if booking.status not in [
            Booking.Status.PENCIL,
            Booking.Status.PENDING,
            Booking.Status.APPROVED,
        ]:
            raise ValueError(
                "Guests can only be managed while the booking is active."
            )

        normalized_rows = []

        for index, row in enumerate(
            rows,
            start=1,
        ):
            normalized = {
                "full_name": str(
                    row.get(
                        "full_name",
                        "",
                    )
                ).strip(),
                "vehicle_plate_number": str(
                    row.get(
                        "vehicle_plate_number",
                        "",
                    )
                ).strip(),
                "vehicle_model": str(
                    row.get(
                        "vehicle_model",
                        "",
                    )
                ).strip(),
            }

            errors = cls.validate_guest_row(
                normalized,
                row_number=index,
            )

            if errors:
                raise ValueError(
                    {
                        "row": index,
                        "errors": errors,
                    }
                )

            normalized_rows.append(
                normalized
            )

        guest_limit = int(
            booking.estimated_guests or 0
        )

        if len(normalized_rows) > guest_limit:
            raise ValueError(
                (
                    f"The guest list contains "
                    f"{len(normalized_rows)} guests, "
                    f"but the booking allows only "
                    f"{guest_limit}."
                )
            )

        if replace_existing:
            (
                BookingGuest.objects
                .filter(
                    booking=booking
                )
                .delete()
            )

        created = []

        for index, guest_data in enumerate(
            normalized_rows,
            start=1,
        ):
            created.append(
                BookingGuest.objects.create(
                    booking=booking,
                    row_number=index,
                    full_name=guest_data[
                        "full_name"
                    ],
                    vehicle_plate_number=guest_data[
                        "vehicle_plate_number"
                    ],
                    vehicle_model=guest_data[
                        "vehicle_model"
                    ],
                )
            )

        return created

    # ============================================================
    # PAYMENT VALIDATION
    # ============================================================

    @classmethod
    def validate_full_booking_payment(
        cls,
        booking,
        payment_amount,
    ):
        """
        Confirm that the submitted booking payment is exactly
        equal to the authoritative booking total.
        """

        required_amount = cls.money(
            booking.total_amount_due
        )

        submitted_amount = cls.money(
            payment_amount
        )

        if required_amount <= 0:
            return (
                False,
                (
                    "There is no payable amount configured "
                    "for this facility booking."
                ),
            )

        if submitted_amount != required_amount:
            return (
                False,
                (
                    "The payment amount must exactly equal "
                    f"the total amount due of "
                    f"₱{required_amount:,.2f}."
                ),
            )

        return (
            True,
            "",
        )

    # ============================================================
    # SECURITY CLEARANCE
    # ============================================================

    @classmethod
    def lock_guest_data(
        cls,
        booking,
    ):
        """
        Security-clearance state is carried by the booking.
        This helper is provided for consistent business-rule
        checks.
        """

        booking.security_clearance_completed = True

        booking.save(
            update_fields=[
                "security_clearance_completed",
                "updated_at",
            ]
        )

        return booking

    # ============================================================
    # INSPECTION / REFUND
    # ============================================================

    @classmethod
    def calculate_refund(
        cls,
        booking,
        deduction_amount,
    ):
        """
        Calculate the deposit refund after inspection.

        Refund is limited to the actual security deposit.
        """

        deposit = cls.money(
            booking.security_deposit
        )

        deduction = cls.money(
            deduction_amount
        )

        if deduction < 0:
            raise ValueError(
                "Deduction cannot be negative."
            )

        if deduction > deposit:
            raise ValueError(
                (
                    "Deduction cannot exceed the "
                    "security deposit."
                )
            )

        refund = cls.money(
            deposit - deduction
        )

        return {
            "security_deposit": deposit,
            "deduction_amount": deduction,
            "refund_amount": refund,
        }
