from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Resident(models.Model):

    class ResidentType(models.TextChoices):

        HOMEOWNER = (
            "HOMEOWNER",
            "Homeowner",
        )

        TENANT = (
            "TENANT",
            "Tenant",
        )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="resident_profile",
    )

    first_name = models.CharField(
        max_length=100,
    )

    middle_name = models.CharField(
        max_length=100,
        blank=True,
    )

    last_name = models.CharField(
        max_length=100,
    )

    resident_type = models.CharField(
        max_length=20,
        choices=ResidentType.choices,
    )

    phone = models.CharField(
        max_length=30,
    )

    email = models.EmailField(
        blank=True,
    )

    address = models.CharField(
        max_length=255,
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:

        ordering = [
            "last_name",
            "first_name",
        ]

    def clean(self):

        if not self.user_id:
            return

        if (
            self.resident_type
            == self.ResidentType.HOMEOWNER
            and self.user.role
            != "HOMEOWNER"
        ):

            raise ValidationError(
                {
                    "resident_type": (
                        "A homeowner resident must use a "
                        "HOMEOWNER user account."
                    )
                }
            )

        if (
            self.resident_type
            == self.ResidentType.TENANT
            and self.user.role
            != "TENANT"
        ):

            raise ValidationError(
                {
                    "resident_type": (
                        "A tenant resident must use a "
                        "TENANT user account."
                    )
                }
            )

    def sync_user_status(self):
        """
        Synchronize the User resident-status flag
        with the Resident profile.

        Resident.is_active is the authoritative value.
        """

        if not self.user_id:
            return

        desired_status = bool(
            self.is_active
        )

        if (
            self.user.is_active_resident
            != desired_status
        ):

            type(self.user).objects.filter(
                pk=self.user_id
            ).update(
                is_active_resident=desired_status
            )

            self.user.is_active_resident = (
                desired_status
            )

    def save(
        self,
        *args,
        **kwargs,
    ):

        self.full_clean()

        old_user_id = None

        if self.pk:

            old_user_id = (
                type(self).objects
                .filter(
                    pk=self.pk
                )
                .values_list(
                    "user_id",
                    flat=True,
                )
                .first()
            )

        result = super().save(
            *args,
            **kwargs,
        )

        # -------------------------------------------------
        # Synchronize the current user's resident status
        # -------------------------------------------------

        self.sync_user_status()

        # -------------------------------------------------
        # If the resident was reassigned to another user,
        # deactivate the previous user's resident flag.
        # -------------------------------------------------

        if (
            old_user_id
            and old_user_id != self.user_id
        ):

            type(self.user).objects.filter(
                pk=old_user_id
            ).update(
                is_active_resident=False
            )

        return result

    def delete(
        self,
        *args,
        **kwargs,
    ):

        user_id = self.user_id

        result = super().delete(
            *args,
            **kwargs,
        )

        # A deleted resident profile should no longer
        # be marked as an active resident on the user.
        type(self.user).objects.filter(
            pk=user_id
        ).update(
            is_active_resident=False
        )

        return result

    @property
    def full_name(self):

        parts = [
            self.first_name,
            self.middle_name,
            self.last_name,
        ]

        return " ".join(
            part
            for part in parts
            if part
        )

    def __str__(self):

        return self.full_name