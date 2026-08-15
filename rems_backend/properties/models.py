from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Property(models.Model):

    class Status(models.TextChoices):

        VACANT = (
            "VACANT",
            "Vacant",
        )

        OWNER_OCCUPIED = (
            "OWNER_OCCUPIED",
            "Owner Occupied",
        )

        TENANT_OCCUPIED = (
            "TENANT_OCCUPIED",
            "Tenant Occupied",
        )

    subdivision = models.CharField(
        max_length=150,
        default="Main Subdivision",
    )

    block = models.CharField(
        max_length=50,
    )

    lot = models.CharField(
        max_length=50,
    )

    house_number = models.CharField(
        max_length=100,
        blank=True,
    )

    street = models.CharField(
        max_length=150,
        blank=True,
    )

    address = models.CharField(
        max_length=255,
    )

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.VACANT,
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
            "block",
            "lot",
        ]

        constraints = [

            models.UniqueConstraint(
                fields=[
                    "subdivision",
                    "block",
                    "lot",
                ],
                name="unique_property_location",
            ),

        ]

    def __str__(self):

        return self.address

    def update_status(self):
        """
        Property.status represents CURRENT OCCUPANCY only.

        Ownership does not determine occupancy status.

        Rules:

            Active TENANT occupancy
                -> TENANT_OCCUPIED

            Active HOMEOWNER occupancy
                -> OWNER_OCCUPIED

            No active occupancy
                -> VACANT
        """

        active_occupancy = (
            self.occupancy_history
            .filter(
                is_active=True,
            )
            .order_by(
                "-start_date",
                "-id",
            )
            .first()
        )

        if not active_occupancy:

            new_status = (
                self.Status.VACANT
            )

        elif (
            active_occupancy.occupancy_type
            == PropertyOccupancy.OccupancyType.TENANT
        ):

            new_status = (
                self.Status.TENANT_OCCUPIED
            )

        elif (
            active_occupancy.occupancy_type
            == PropertyOccupancy.OccupancyType.HOMEOWNER
        ):

            new_status = (
                self.Status.OWNER_OCCUPIED
            )

        else:

            new_status = (
                self.Status.VACANT
            )

        if self.status != new_status:

            Property.objects.filter(
                pk=self.pk,
            ).update(
                status=new_status,
            )

            self.status = new_status


class PropertyOwnership(models.Model):

    property = models.ForeignKey(
        Property,
        on_delete=models.PROTECT,
        related_name="ownership_history",
    )

    homeowner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="property_ownerships",
        limit_choices_to={
            "role": "HOMEOWNER",
        },
    )

    start_date = models.DateField()

    end_date = models.DateField(
        blank=True,
        null=True,
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
            "-start_date",
        ]

    def clean(self):

        if (
            self.end_date
            and self.end_date < self.start_date
        ):

            raise ValidationError(
                {
                    "end_date": (
                        "Ownership end date cannot be earlier "
                        "than the start date."
                    )
                }
            )

        if (
            self.is_active
            and self.end_date
        ):

            raise ValidationError(
                {
                    "is_active": (
                        "An active ownership record cannot "
                        "have an end date."
                    )
                }
            )

        overlapping_records = (
            PropertyOwnership.objects
            .filter(
                property=self.property,
                is_active=True,
            )
            .exclude(
                pk=self.pk,
            )
        )

        if (
            self.is_active
            and overlapping_records.exists()
        ):

            raise ValidationError(
                {
                    "property": (
                        "This property already has an active "
                        "ownership record."
                    )
                }
            )

    def save(
        self,
        *args,
        **kwargs,
    ):

        old_property_id = None

        if self.pk:

            old_property_id = (
                PropertyOwnership.objects
                .filter(
                    pk=self.pk,
                )
                .values_list(
                    "property_id",
                    flat=True,
                )
                .first()
            )

        self.full_clean()

        result = super().save(
            *args,
            **kwargs,
        )

        # Ownership does not determine occupancy.
        # Synchronization matters only because an existing
        # occupancy record may already exist.
        self.property.update_status()

        if (
            old_property_id
            and old_property_id != self.property_id
        ):

            old_property = (
                Property.objects
                .filter(
                    pk=old_property_id,
                )
                .first()
            )

            if old_property:

                old_property.update_status()

        return result

    def delete(
        self,
        *args,
        **kwargs,
    ):

        property_obj = self.property

        result = super().delete(
            *args,
            **kwargs,
        )

        property_obj.update_status()

        return result

    def __str__(self):

        return (
            f"{self.homeowner} - "
            f"{self.property}"
        )


class PropertyOccupancy(models.Model):

    class OccupancyType(models.TextChoices):

        HOMEOWNER = (
            "HOMEOWNER",
            "Homeowner",
        )

        TENANT = (
            "TENANT",
            "Tenant",
        )

    property = models.ForeignKey(
        Property,
        on_delete=models.PROTECT,
        related_name="occupancy_history",
    )

    resident = models.ForeignKey(
        "residents.Resident",
        on_delete=models.PROTECT,
        related_name="occupancy_history",
    )

    occupancy_type = models.CharField(
        max_length=20,
        choices=OccupancyType.choices,
    )

    start_date = models.DateField()

    end_date = models.DateField(
        blank=True,
        null=True,
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
            "-start_date",
        ]

    def clean(self):

        if (
            self.end_date
            and self.end_date < self.start_date
        ):

            raise ValidationError(
                {
                    "end_date": (
                        "Occupancy end date cannot be earlier "
                        "than the start date."
                    )
                }
            )

        if (
            self.is_active
            and self.end_date
        ):

            raise ValidationError(
                {
                    "is_active": (
                        "An active occupancy record cannot "
                        "have an end date."
                    )
                }
            )

        overlapping_records = (
            PropertyOccupancy.objects
            .filter(
                property=self.property,
                is_active=True,
            )
            .exclude(
                pk=self.pk,
            )
        )

        if (
            self.is_active
            and overlapping_records.exists()
        ):

            raise ValidationError(
                {
                    "property": (
                        "This property already has an active "
                        "occupancy record."
                    )
                }
            )

    def save(
        self,
        *args,
        **kwargs,
    ):

        old_property_id = None

        if self.pk:

            old_property_id = (
                PropertyOccupancy.objects
                .filter(
                    pk=self.pk,
                )
                .values_list(
                    "property_id",
                    flat=True,
                )
                .first()
            )

        self.full_clean()

        result = super().save(
            *args,
            **kwargs,
        )

        # Occupancy is the authority for property status.
        self.property.update_status()

        if (
            old_property_id
            and old_property_id != self.property_id
        ):

            old_property = (
                Property.objects
                .filter(
                    pk=old_property_id,
                )
                .first()
            )

            if old_property:

                old_property.update_status()

        return result

    def delete(
        self,
        *args,
        **kwargs,
    ):

        property_obj = self.property

        result = super().delete(
            *args,
            **kwargs,
        )

        property_obj.update_status()

        return result

    def __str__(self):

        return (
            f"{self.resident} - "
            f"{self.property} - "
            f"{self.occupancy_type}"
        )


# from django.conf import settings
# from django.core.exceptions import ValidationError
# from django.db import models


# class Property(models.Model):

#     class Status(models.TextChoices):

#         VACANT = (
#             "VACANT",
#             "Vacant",
#         )

#         OWNER_OCCUPIED = (
#             "OWNER_OCCUPIED",
#             "Owner Occupied",
#         )

#         TENANT_OCCUPIED = (
#             "TENANT_OCCUPIED",
#             "Tenant Occupied",
#         )

#     subdivision = models.CharField(
#         max_length=150,
#         default="Main Subdivision",
#     )

#     block = models.CharField(
#         max_length=50,
#     )

#     lot = models.CharField(
#         max_length=50,
#     )

#     house_number = models.CharField(
#         max_length=100,
#         blank=True,
#     )

#     street = models.CharField(
#         max_length=150,
#         blank=True,
#     )

#     address = models.CharField(
#         max_length=255,
#     )

#     status = models.CharField(
#         max_length=30,
#         choices=Status.choices,
#         default=Status.VACANT,
#     )

#     is_active = models.BooleanField(
#         default=True,
#     )

#     created_at = models.DateTimeField(
#         auto_now_add=True,
#     )

#     updated_at = models.DateTimeField(
#         auto_now=True,
#     )

#     class Meta:

#         ordering = [
#             "block",
#             "lot",
#         ]

#         constraints = [

#             models.UniqueConstraint(
#                 fields=[
#                     "subdivision",
#                     "block",
#                     "lot",
#                 ],
#                 name="unique_property_location",
#             ),

#         ]

#     def __str__(self):

#         return self.address

#     def update_status(self):
#         """
#         Recalculate the current property status.

#         Priority:

#         1. Active tenant occupancy
#         2. Active homeowner occupancy
#         3. Active homeowner ownership
#         4. Vacant
#         """

#         active_occupancy = (
#             self.occupancy_history
#             .filter(
#                 is_active=True,
#             )
#             .select_related(
#                 "resident",
#                 "resident__user",
#             )
#             .first()
#         )

#         if active_occupancy:

#             if (
#                 active_occupancy.occupancy_type
#                 == PropertyOccupancy.OccupancyType.TENANT
#             ):

#                 new_status = (
#                     self.Status.TENANT_OCCUPIED
#                 )

#             else:

#                 new_status = (
#                     self.Status.OWNER_OCCUPIED
#                 )

#         else:

#             active_ownership = (
#                 self.ownership_history
#                 .filter(
#                     is_active=True,
#                 )
#                 .first()
#             )

#             if active_ownership:

#                 new_status = (
#                     self.Status.OWNER_OCCUPIED
#                 )

#             else:

#                 new_status = (
#                     self.Status.VACANT
#                 )

#         if self.status != new_status:

#             Property.objects.filter(
#                 pk=self.pk,
#             ).update(
#                 status=new_status,
#             )

#             self.status = new_status


# class PropertyOwnership(models.Model):

#     property = models.ForeignKey(
#         Property,
#         on_delete=models.PROTECT,
#         related_name="ownership_history",
#     )

#     homeowner = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.PROTECT,
#         related_name="property_ownerships",
#         limit_choices_to={
#             "role": "HOMEOWNER",
#         },
#     )

#     start_date = models.DateField()

#     end_date = models.DateField(
#         blank=True,
#         null=True,
#     )

#     is_active = models.BooleanField(
#         default=True,
#     )

#     created_at = models.DateTimeField(
#         auto_now_add=True,
#     )

#     updated_at = models.DateTimeField(
#         auto_now=True,
#     )

#     class Meta:

#         ordering = [
#             "-start_date",
#         ]

#     def clean(self):

#         if (
#             self.end_date
#             and self.end_date < self.start_date
#         ):

#             raise ValidationError(
#                 {
#                     "end_date": (
#                         "Ownership end date cannot be earlier "
#                         "than the start date."
#                     )
#                 }
#             )

#         if (
#             self.is_active
#             and self.end_date
#         ):

#             raise ValidationError(
#                 {
#                     "is_active": (
#                         "An active ownership record cannot "
#                         "have an end date."
#                     )
#                 }
#             )

#         overlapping_records = (
#             PropertyOwnership.objects
#             .filter(
#                 property=self.property,
#                 is_active=True,
#             )
#             .exclude(
#                 pk=self.pk,
#             )
#         )

#         if (
#             self.is_active
#             and overlapping_records.exists()
#         ):

#             raise ValidationError(
#                 {
#                     "property": (
#                         "This property already has an active "
#                         "ownership record."
#                     )
#                 }
#             )

#     def save(
#         self,
#         *args,
#         **kwargs,
#     ):

#         old_property_id = None

#         if self.pk:

#             old_property_id = (
#                 PropertyOwnership.objects
#                 .filter(
#                     pk=self.pk,
#                 )
#                 .values_list(
#                     "property_id",
#                     flat=True,
#                 )
#                 .first()
#             )

#         self.full_clean()

#         result = super().save(
#             *args,
#             **kwargs,
#         )

#         self.property.update_status()

#         if (
#             old_property_id
#             and old_property_id != self.property_id
#         ):

#             old_property = (
#                 Property.objects
#                 .filter(
#                     pk=old_property_id,
#                 )
#                 .first()
#             )

#             if old_property:

#                 old_property.update_status()

#         return result

#     def delete(
#         self,
#         *args,
#         **kwargs,
#     ):

#         property_obj = self.property

#         result = super().delete(
#             *args,
#             **kwargs,
#         )

#         property_obj.update_status()

#         return result

#     def __str__(self):

#         return (
#             f"{self.homeowner} - "
#             f"{self.property}"
#         )


# class PropertyOccupancy(models.Model):

#     class OccupancyType(models.TextChoices):

#         HOMEOWNER = (
#             "HOMEOWNER",
#             "Homeowner",
#         )

#         TENANT = (
#             "TENANT",
#             "Tenant",
#         )

#     property = models.ForeignKey(
#         Property,
#         on_delete=models.PROTECT,
#         related_name="occupancy_history",
#     )

#     resident = models.ForeignKey(
#         "residents.Resident",
#         on_delete=models.PROTECT,
#         related_name="occupancy_history",
#     )

#     occupancy_type = models.CharField(
#         max_length=20,
#         choices=OccupancyType.choices,
#     )

#     start_date = models.DateField()

#     end_date = models.DateField(
#         blank=True,
#         null=True,
#     )

#     is_active = models.BooleanField(
#         default=True,
#     )

#     created_at = models.DateTimeField(
#         auto_now_add=True,
#     )

#     updated_at = models.DateTimeField(
#         auto_now=True,
#     )

#     class Meta:

#         ordering = [
#             "-start_date",
#         ]

#     def clean(self):

#         if (
#             self.end_date
#             and self.end_date < self.start_date
#         ):

#             raise ValidationError(
#                 {
#                     "end_date": (
#                         "Occupancy end date cannot be earlier "
#                         "than the start date."
#                     )
#                 }
#             )

#         if (
#             self.is_active
#             and self.end_date
#         ):

#             raise ValidationError(
#                 {
#                     "is_active": (
#                         "An active occupancy record cannot "
#                         "have an end date."
#                     )
#                 }
#             )

#         overlapping_records = (
#             PropertyOccupancy.objects
#             .filter(
#                 property=self.property,
#                 is_active=True,
#             )
#             .exclude(
#                 pk=self.pk,
#             )
#         )

#         if (
#             self.is_active
#             and overlapping_records.exists()
#         ):

#             raise ValidationError(
#                 {
#                     "property": (
#                         "This property already has an active "
#                         "occupancy record."
#                     )
#                 }
#             )

#     def save(
#         self,
#         *args,
#         **kwargs,
#     ):

#         old_property_id = None

#         if self.pk:

#             old_property_id = (
#                 PropertyOccupancy.objects
#                 .filter(
#                     pk=self.pk,
#                 )
#                 .values_list(
#                     "property_id",
#                     flat=True,
#                 )
#                 .first()
#             )

#         self.full_clean()

#         result = super().save(
#             *args,
#             **kwargs,
#         )

#         self.property.update_status()

#         if (
#             old_property_id
#             and old_property_id != self.property_id
#         ):

#             old_property = (
#                 Property.objects
#                 .filter(
#                     pk=old_property_id,
#                 )
#                 .first()
#             )

#             if old_property:

#                 old_property.update_status()

#         return result

#     def delete(
#         self,
#         *args,
#         **kwargs,
#     ):

#         property_obj = self.property

#         result = super().delete(
#             *args,
#             **kwargs,
#         )

#         property_obj.update_status()

#         return result

#     def __str__(self):

#         return (
#             f"{self.resident} - "
#             f"{self.property} - "
#             f"{self.occupancy_type}"
#         )