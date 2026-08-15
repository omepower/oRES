
import uuid

from datetime import datetime

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils import timezone


# ============================================================
# Preserve Python's built-in property decorator.
#
# Reason:
# The REMS models contain a field named "property", so keeping
# an explicit reference to the built-in decorator avoids any
# confusion inside the model code.
# ============================================================

py_property = property


# ============================================================
# VISITOR INVITATION
# ============================================================

class VisitorInvitation(models.Model):

    class Status(models.TextChoices):

        PENDING = (
            "PENDING",
            "Pending",
        )

        USED = (
            "USED",
            "Used",
        )

        EXPIRED = (
            "EXPIRED",
            "Expired",
        )

        CANCELLED = (
            "CANCELLED",
            "Cancelled",
        )


    invitation_code = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )


    visitor_name = models.CharField(
        max_length=200,
    )


    visitor_home_address = models.CharField(
        max_length=255,
    )


    visitor_phone = models.CharField(
        max_length=30,
    )


    host = models.ForeignKey(
        "residents.Resident",
        on_delete=models.PROTECT,
        related_name="visitor_invitations",
    )


    property = models.ForeignKey(
        "properties.Property",
        on_delete=models.PROTECT,
        related_name="visitor_invitations",
    )


    visit_date = models.DateField()


    expected_time_in = models.TimeField()


    expected_time_out = models.TimeField()


    # ========================================================
    # HISTORICAL HOST SNAPSHOT
    # ========================================================

    host_name_snapshot = models.CharField(
        max_length=200,
    )


    host_address_snapshot = models.CharField(
        max_length=255,
    )


    host_phone_snapshot = models.CharField(
        max_length=30,
    )


    host_type_snapshot = models.CharField(
        max_length=20,
    )


    # ========================================================
    # INVITATION STATUS
    # ========================================================

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )


    qr_generated_at = models.DateTimeField(
        blank=True,
        null=True,
    )


    cancelled_at = models.DateTimeField(
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


    # ========================================================
    # VALIDATION
    # ========================================================

    def clean(self):

        errors = {}


        # ----------------------------------------------------
        # TIME VALIDATION
        # ----------------------------------------------------

        if (
            self.expected_time_out
            <= self.expected_time_in
        ):

            errors["expected_time_out"] = (
                "Expected time out must be later "
                "than expected time in."
            )


        # ----------------------------------------------------
        # DATE VALIDATION
        # ----------------------------------------------------

        if (
            self.visit_date
            and self.visit_date
            < timezone.localdate()
        ):

            errors["visit_date"] = (
                "The visit date cannot be "
                "in the past."
            )


        # ----------------------------------------------------
        # PROPERTY AUTHORIZATION
        # ----------------------------------------------------

        if (
            self.host_id
            and self.property_id
        ):

            active_occupancy = (
                self.property
                .occupancy_history
                .filter(
                    resident=self.host,
                    is_active=True,
                )
                .exists()
            )


            active_ownership = (
                self.property
                .ownership_history
                .filter(
                    homeowner=self.host.user,
                    is_active=True,
                )
                .exists()
            )


            if not (
                active_occupancy
                or active_ownership
            ):

                errors["host"] = (
                    "The selected resident is not "
                    "currently authorized for this property."
                )


        # ----------------------------------------------------
        # RAISE VALIDATION ERRORS
        # ----------------------------------------------------

        if errors:

            raise ValidationError(
                errors
            )


    # ========================================================
    # SAVE
    # ========================================================

    def save(
        self,
        *args,
        **kwargs,
    ):

        if self.host_id:

            if not self.host_name_snapshot:

                self.host_name_snapshot = (
                    self.host.full_name
                )


            if not self.host_address_snapshot:

                self.host_address_snapshot = (
                    self.property.address
                )


            if not self.host_phone_snapshot:

                self.host_phone_snapshot = (
                    self.host.phone
                )


            if not self.host_type_snapshot:

                self.host_type_snapshot = (
                    self.host.resident_type
                )


        self.full_clean()


        return super().save(
            *args,
            **kwargs,
        )


    # ========================================================
    # EXPIRATION HELPERS
    # ========================================================

    def get_expiration_datetime(
        self,
    ):
        """
        Return the exact datetime at which this
        visitor invitation expires.

        The invitation remains valid until
        expected_time_out on visit_date.
        """

        if (
            not self.visit_date
            or not self.expected_time_out
        ):

            return None


        naive_datetime = (
            datetime.combine(
                self.visit_date,
                self.expected_time_out,
            )
        )


        return timezone.make_aware(
            naive_datetime,
            timezone.get_current_timezone(),
        )


    @py_property
    def is_expired(
        self,
    ):
        """
        Return True when the invitation has expired.
        """

        if self.status in [
            self.Status.CANCELLED,
            self.Status.EXPIRED,
        ]:

            return True


        expiration_datetime = (
            self.get_expiration_datetime()
        )


        if not expiration_datetime:

            return False


        return (
            timezone.now()
            >= expiration_datetime
        )


    def expire_if_needed(
        self,
    ):
        """
        Mark a pending invitation as expired when
        its permitted time has ended.
        """

        if (
            self.status
            == self.Status.PENDING
            and self.is_expired
        ):

            self.status = (
                self.Status.EXPIRED
            )


            self.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )


            return True


        return False


    @classmethod
    def expire_overdue_pending(
        cls,
    ):
        """
        Bulk-expire all pending invitations whose
        permitted visit window has ended.

        This can be called before returning visitor
        invitation lists so stale PENDING records are
        automatically converted to EXPIRED.
        """

        now = timezone.localtime()

        today = now.date()

        current_time = now.time()


        return (
            cls.objects
            .filter(
                status=cls.Status.PENDING,
            )
            .filter(
                Q(
                    visit_date__lt=today,
                )
                |
                Q(
                    visit_date=today,
                    expected_time_out__lte=current_time,
                )
            )
            .update(
                status=cls.Status.EXPIRED,
                updated_at=now,
            )
        )


    # ========================================================
    # STRING REPRESENTATION
    # ========================================================

    def __str__(
        self,
    ):

        return (
            f"{self.visitor_name} - "
            f"{self.visit_date} - "
            f"{self.property.address}"
        )


# ============================================================
# VISITOR VISIT
# ============================================================

class VisitorVisit(models.Model):

    class Status(models.TextChoices):

        INSIDE = (
            "INSIDE",
            "Inside",
        )

        COMPLETED = (
            "COMPLETED",
            "Completed",
        )

        DENIED = (
            "DENIED",
            "Denied",
        )


    invitation = models.OneToOneField(
        VisitorInvitation,
        on_delete=models.PROTECT,
        related_name="visit",
    )


    gate = models.ForeignKey(
        "security.Gate",
        on_delete=models.PROTECT,
        related_name="visitor_visits",
    )


    time_in = models.DateTimeField(
        blank=True,
        null=True,
    )


    time_out = models.DateTimeField(
        blank=True,
        null=True,
    )


    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.INSIDE,
    )


    scanned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="scanned_visitor_visits",
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
            "-time_in",
        ]


    # ========================================================
    # VALIDATION
    # ========================================================

    def clean(self):

        # ----------------------------------------------------
        # TIME OUT REQUIRES TIME IN
        # ----------------------------------------------------

        if (
            self.time_out
            and not self.time_in
        ):

            raise ValidationError(
                {
                    "time_out": (
                        "A visitor cannot have a "
                        "time out without a time in."
                    )
                }
            )


        # ----------------------------------------------------
        # TIME OUT CANNOT PRECEDE TIME IN
        # ----------------------------------------------------

        if (
            self.time_out
            and self.time_in
            and self.time_out
            < self.time_in
        ):

            raise ValidationError(
                {
                    "time_out": (
                        "Time out cannot be earlier "
                        "than time in."
                    )
                }
            )


        # ----------------------------------------------------
        # COMPLETED VISIT MUST HAVE TIME OUT
        # ----------------------------------------------------

        if (
            self.status
            == self.Status.COMPLETED
            and not self.time_out
        ):

            raise ValidationError(
                {
                    "status": (
                        "A completed visit must have "
                        "a time out."
                    )
                }
            )


    # ========================================================
    # SAVE
    # ========================================================

    def save(
        self,
        *args,
        **kwargs,
    ):

        self.full_clean()


        return super().save(
            *args,
            **kwargs,
        )


    # ========================================================
    # STRING REPRESENTATION
    # ========================================================

    def __str__(
        self,
    ):

        return (
            f"{self.invitation.visitor_name} - "
            f"{self.status}"
        )



# import uuid
# from datetime import datetime
# from django.conf import settings
# from django.core.exceptions import ValidationError
# from django.db import models
# from django.db.models import Q
# from django.utils import timezone

# # 1. Capture the original Python built-in property decorator here (Reason : There is a varibale field named property in my REMS, so this helps to avoild conflicts since its a keyword in python)
# py_property = property 


# class VisitorInvitation(models.Model):

#     class Status(models.TextChoices):
#         PENDING = "PENDING", "Pending"
#         USED = "USED", "Used"
#         EXPIRED = "EXPIRED", "Expired"
#         CANCELLED = "CANCELLED", "Cancelled"

#     invitation_code = models.UUIDField(
#         default=uuid.uuid4,
#         unique=True,
#         editable=False,
#     )

#     visitor_name = models.CharField(
#         max_length=200,
#     )

#     visitor_home_address = models.CharField(
#         max_length=255,
#     )

#     visitor_phone = models.CharField(
#         max_length=30,
#     )

#     host = models.ForeignKey(
#         "residents.Resident",
#         on_delete=models.PROTECT,
#         related_name="visitor_invitations",
#     )

#     property = models.ForeignKey(
#         "properties.Property",
#         on_delete=models.PROTECT,
#         related_name="visitor_invitations",
#     )

#     visit_date = models.DateField()

#     expected_time_in = models.TimeField()

#     expected_time_out = models.TimeField()

#     # --------------------------------------------------------
#     # Historical snapshot of host information
#     # --------------------------------------------------------

#     host_name_snapshot = models.CharField(
#         max_length=200,
#     )

#     host_address_snapshot = models.CharField(
#         max_length=255,
#     )

#     host_phone_snapshot = models.CharField(
#         max_length=30,
#     )

#     host_type_snapshot = models.CharField(
#         max_length=20,
#     )

#     # --------------------------------------------------------
#     # Invitation status
#     # --------------------------------------------------------

#     status = models.CharField(
#         max_length=20,
#         choices=Status.choices,
#         default=Status.PENDING,
#     )

#     qr_generated_at = models.DateTimeField(
#         blank=True,
#         null=True,
#     )

#     cancelled_at = models.DateTimeField(
#         blank=True,
#         null=True,
#     )

#     created_at = models.DateTimeField(
#         auto_now_add=True,
#     )

#     updated_at = models.DateTimeField(
#         auto_now=True,
#     )

#     class Meta:
#         ordering = [
#             "-created_at",
#         ]

#     def clean(self):
#         errors = {}

#         if self.expected_time_out <= self.expected_time_in:
#             errors["expected_time_out"] = (
#                 "Expected time out must be later "
#                 "than expected time in."
#             )

#         if self.visit_date and self.visit_date < timezone.localdate():
#             errors["visit_date"] = (
#                 "The visit date cannot be in the past."
#             )

#         if self.host_id and self.property_id:

#             active_occupancy = (
#                 self.property.occupancy_history
#                 .filter(
#                     resident=self.host,
#                     is_active=True,
#                 )
#                 .exists()
#             )

#             active_ownership = (
#                 self.property.ownership_history
#                 .filter(
#                     homeowner=self.host.user,
#                     is_active=True,
#                 )
#                 .exists()
#             )

#             if not active_occupancy and not active_ownership:
#                 errors["host"] = (
#                     "The selected resident is not currently "
#                     "authorized for this property."
#                 )

#         if errors:
#             raise ValidationError(errors)

#     def save(self, *args, **kwargs):
#         if self.host_id:

#             if not self.host_name_snapshot:
#                 self.host_name_snapshot = self.host.full_name

#             if not self.host_address_snapshot:
#                 self.host_address_snapshot = (
#                     self.property.address
#                 )

#             if not self.host_phone_snapshot:
#                 self.host_phone_snapshot = self.host.phone

#             if not self.host_type_snapshot:
#                 self.host_type_snapshot = (
#                     self.host.resident_type
#                 )

#         self.full_clean()

#         return super().save(*args, **kwargs)

#     @py_property
    
#     # ========================================================
#     # EXPIRATION HELPERS
#     # ========================================================

   
#     @py_property
#     def get_expiration_datetime(self):

#         if not self.visit_date or not self.expected_time_out:
#             return None

#         naive_datetime = datetime.combine(
#             self.visit_date,
#             self.expected_time_out,
#         )

#         return timezone.make_aware(
#             naive_datetime,
#             timezone.get_current_timezone(),
#         )


#     @py_property
#     def is_expired(self):

#         if self.status in [
#             self.Status.CANCELLED,
#             self.Status.EXPIRED,
#         ]:
#             return True

#         expiration_datetime = (
#             self.get_expiration_datetime
#         )

#         if not expiration_datetime:
#             return False

#         return timezone.now() >= expiration_datetime


#     def expire_if_needed(self):

#         if (
#             self.status == self.Status.PENDING
#             and self.is_expired
#         ):

#             self.status = (
#                 self.Status.EXPIRED
#             )

#             self.save(
#                 update_fields=[
#                     "status",
#                     "updated_at",
#                 ]
#             )

#             return True

#         return False




#     @classmethod
#     def expire_overdue_pending(cls):
#         """
#         Bulk-expire all pending invitations whose allowed
#         visit window has ended.

#         This is used by API queries so the status is updated
#         automatically when residents/admins view invitations.
#         """

#         now = timezone.localtime()

#         today = now.date()

#         current_time = now.time()


#         return cls.objects.filter(
#             status=cls.Status.PENDING
#         ).filter(

#             Q(
#                 visit_date__lt=today
#             )

#             |

#             Q(
#                 visit_date=today,
#                 expected_time_out__lte=current_time,
#             )

#         ).update(

#             status=cls.Status.EXPIRED,

#             updated_at=now,

#         )


# class VisitorVisit(models.Model):

#     class Status(models.TextChoices):
#         INSIDE = "INSIDE", "Inside"
#         COMPLETED = "COMPLETED", "Completed"
#         DENIED = "DENIED", "Denied"

#     invitation = models.OneToOneField(
#         VisitorInvitation,
#         on_delete=models.PROTECT,
#         related_name="visit",
#     )

#     gate = models.ForeignKey(
#         "security.Gate",
#         on_delete=models.PROTECT,
#         related_name="visitor_visits",
#     )

#     time_in = models.DateTimeField(
#         blank=True,
#         null=True,
#     )

#     time_out = models.DateTimeField(
#         blank=True,
#         null=True,
#     )

#     status = models.CharField(
#         max_length=20,
#         choices=Status.choices,
#         default=Status.INSIDE,
#     )

#     scanned_by = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.PROTECT,
#         related_name="scanned_visitor_visits",
#         blank=True,
#         null=True,
#     )

#     created_at = models.DateTimeField(
#         auto_now_add=True,
#     )

#     updated_at = models.DateTimeField(
#         auto_now=True,
#     )

#     class Meta:
#         ordering = [
#             "-time_in",
#         ]

#     def clean(self):
#         if self.time_out and not self.time_in:
#             raise ValidationError(
#                 {
#                     "time_out": (
#                         "A visitor cannot have a time out "
#                         "without a time in."
#                     )
#                 }
#             )

#         if self.time_out and self.time_in:
#             if self.time_out < self.time_in:
#                 raise ValidationError(
#                     {
#                         "time_out": (
#                             "Time out cannot be earlier "
#                             "than time in."
#                         )
#                     }
#                 )

#         if (
#             self.status == self.Status.COMPLETED
#             and not self.time_out
#         ):
#             raise ValidationError(
#                 {
#                     "status": (
#                         "A completed visit must have "
#                         "a time out."
#                     )
#                 }
#             )

#     def save(self, *args, **kwargs):
#         self.full_clean()

#         return super().save(*args, **kwargs)

#     def __str__(self):
#         return (
#             f"{self.invitation.visitor_name} - "
#             f"{self.status}"
#         )