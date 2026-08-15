import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Vehicle(models.Model):

    class VehicleType(models.TextChoices):
        MOTORCYCLE = "MOTORCYCLE", "Motorcycle"
        SEDAN = "SEDAN", "Sedan"
        SUV = "SUV", "SUV"
        PICKUP = "PICKUP", "Pickup"
        VAN = "VAN", "Van"
        TRUCK = "TRUCK", "Truck"
        OTHER = "OTHER", "Other"

    class OwnershipType(models.TextChoices):
        OWNED = "OWNED", "Owned"
        COMPANY = "COMPANY", "Company"
        LEASED = "LEASED", "Leased"
        OTHER = "OTHER", "Other"

    vehicle_uuid = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )

    property = models.ForeignKey(
        "properties.Property",
        on_delete=models.PROTECT,
        related_name="vehicles",
    )

    registered_resident = models.ForeignKey(
        "residents.Resident",
        on_delete=models.PROTECT,
        related_name="vehicles",
    )

    vehicle_type = models.CharField(
        max_length=20,
        choices=VehicleType.choices,
    )

    make = models.CharField(
        max_length=100,
    )

    model = models.CharField(
        max_length=100,
    )

    color = models.CharField(
        max_length=50,
    )

    plate_number = models.CharField(
        max_length=30,
        unique=True,
    )

    ownership_type = models.CharField(
        max_length=20,
        choices=OwnershipType.choices,
        default=OwnershipType.OWNED,
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
            "plate_number",
        ]

    def clean(self):

        if not self.property_id:
            return

        if not self.registered_resident_id:
            return

        resident = self.registered_resident

        authorized = (
            self.property.occupancy_history
            .filter(
                resident=resident,
                is_active=True,
            )
            .exists()
            or
            self.property.ownership_history
            .filter(
                homeowner=resident.user,
                is_active=True,
            )
            .exists()
        )

        if not authorized:

            raise ValidationError(
                {
                    "registered_resident": (
                        "This resident is not "
                        "currently authorized "
                        "for this property."
                    )
                }
            )

    def save(self, *args, **kwargs):

        self.plate_number = (
            self.plate_number.strip().upper()
        )

        self.full_clean()

        return super().save(*args, **kwargs)

    def __str__(self):

        return (
            f"{self.plate_number} - "
            f"{self.make} {self.model}"
        )


class MotoristSticker(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACTIVE = "ACTIVE", "Active"
        REVOKED = "REVOKED", "Revoked"
        EXPIRED = "EXPIRED", "Expired"

    sticker_number = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
    )

    sticker_uuid = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )

    property = models.ForeignKey(
        "properties.Property",
        on_delete=models.PROTECT,
        related_name="motorist_stickers",
    )

    vehicle = models.OneToOneField(
        Vehicle,
        on_delete=models.PROTECT,
        related_name="motorist_sticker",
    )

    resident = models.ForeignKey(
        "residents.Resident",
        on_delete=models.PROTECT,
        related_name="motorist_stickers",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    issued_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    revoked_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    expires_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    approved_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="approved_motorist_stickers",
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

    def clean(self):

        if not self.property_id:
            return

        if not self.resident_id:
            return

        # ----------------------------------------------------
        # Verify resident/property relationship
        # ----------------------------------------------------

        resident = self.resident

        authorized = (
            self.property.occupancy_history
            .filter(
                resident=resident,
                is_active=True,
            )
            .exists()
            or
            self.property.ownership_history
            .filter(
                homeowner=resident.user,
                is_active=True,
            )
            .exists()
        )

        if not authorized:

            raise ValidationError(
                {
                    "resident": (
                        "This resident is not "
                        "currently authorized "
                        "for this property."
                    )
                }
            )

        # ----------------------------------------------------
        # Vehicle must belong to same property/resident
        # ----------------------------------------------------

        if self.vehicle_id:

            if self.vehicle.property_id != (
                self.property_id
            ):

                raise ValidationError(
                    {
                        "vehicle": (
                            "The vehicle does not "
                            "belong to this property."
                        )
                    }
                )

            if self.vehicle.registered_resident_id != (
                self.resident_id
            ):

                raise ValidationError(
                    {
                        "vehicle": (
                            "The vehicle is not "
                            "registered to this resident."
                        )
                    }
                )

        # ----------------------------------------------------
        # Maximum of 3 active/pending stickers
        # ----------------------------------------------------

        if (
            self.status in [
                self.Status.PENDING,
                self.Status.ACTIVE,
            ]
        ):

            existing_count = (
                MotoristSticker.objects
                .filter(
                    property=self.property,
                    status__in=[
                        self.Status.PENDING,
                        self.Status.ACTIVE,
                    ],
                )
                .exclude(
                    pk=self.pk,
                )
                .count()
            )

            if existing_count >= 3:

                raise ValidationError(
                    {
                        "property": (
                            "This property has "
                            "already reached the "
                            "maximum of 3 motorist "
                            "stickers."
                        )
                    }
                )

    def save(self, *args, **kwargs):

        if not self.sticker_number:

            self.sticker_number = (
                f"REMS-{uuid.uuid4().hex[:10].upper()}"
            )

        self.full_clean()

        return super().save(*args, **kwargs)

    def __str__(self):

        return self.sticker_number