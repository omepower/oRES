from rest_framework import serializers
from datetime import timezone

from .models import (
    Vehicle,
    MotoristSticker,
)


class VehicleSerializer(
    serializers.ModelSerializer
):

    vehicle_type_display = serializers.CharField(
        source="get_vehicle_type_display",
        read_only=True,
    )

    ownership_type_display = serializers.CharField(
        source="get_ownership_type_display",
        read_only=True,
    )

    vehicle_uuid = serializers.UUIDField(
        read_only=True,
    )

    property_address = serializers.CharField(
        source="property.address",
        read_only=True,
    )

    resident_name = serializers.CharField(
        source="registered_resident.full_name",
        read_only=True,
    )

    motorist_sticker = serializers.SerializerMethodField(
        read_only=True,
    )

    class Meta:

        model = Vehicle

        fields = [
            "id",
            "vehicle_uuid",

            "property",
            "property_address",

            "registered_resident",
            "resident_name",

            "vehicle_type",
            "vehicle_type_display",

            "make",
            "model",
            "color",
            "plate_number",

            "ownership_type",
            "ownership_type_display",

            "is_active",

            "motorist_sticker",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "vehicle_uuid",

            "property_address",
            "resident_name",

            "vehicle_type_display",
            "ownership_type_display",

            "motorist_sticker",

            "created_at",
            "updated_at",
        ]

    def get_motorist_sticker(
        self,
        obj,
    ):

        try:

            sticker = (
                obj.motorist_sticker
            )

        except MotoristSticker.DoesNotExist:

            return None

        return {
            "id": sticker.id,

            "sticker_number":
                sticker.sticker_number,

            "sticker_uuid":
                str(
                    sticker.sticker_uuid
                ),

            "status":
                sticker.status,

            "status_display":
                sticker.get_status_display(),

            "issued_at":
                sticker.issued_at,

            "revoked_at":
                sticker.revoked_at,

            "expires_at":
                sticker.expires_at,
        }

    def validate(
        self,
        attrs,
    ):

        request = self.context.get(
            "request"
        )

        user = (
            request.user
            if request
            else None
        )


        # ========================================================
        # ADMIN
        # ========================================================

        if (
            user
            and user.role == user.Roles.ADMIN
        ):

            resident = attrs.get(
                "registered_resident",
                getattr(
                    self.instance,
                    "registered_resident",
                    None,
                ),
            )

            property_obj = attrs.get(
                "property",
                getattr(
                    self.instance,
                    "property",
                    None,
                ),
            )

            if not resident:

                raise serializers.ValidationError(
                    {
                        "registered_resident":
                            "Registered resident is required."
                    }
                )

            if not property_obj:

                raise serializers.ValidationError(
                    {
                        "property":
                            "Property is required."
                    }
                )

            authorized = (
                property_obj
                .occupancy_history
                .filter(
                    resident=resident,
                    is_active=True,
                )
                .exists()
                or
                property_obj
                .ownership_history
                .filter(
                    homeowner=resident.user,
                    is_active=True,
                )
                .exists()
            )

            if not authorized:

                raise serializers.ValidationError(
                    {
                        "registered_resident":
                            "This resident is not currently authorized for this property."
                    }
                )

            return attrs


        # ========================================================
        # RESIDENT
        # HOMEOWNER / TENANT
        # ========================================================

        if not user:

            return attrs


        if user.role not in [
            user.Roles.HOMEOWNER,
            user.Roles.TENANT,
        ]:

            return attrs


        resident = (
            getattr(
                user,
                "resident",
                None,
            )
        )


        if not resident:

            raise serializers.ValidationError(
                {
                    "registered_resident":
                        "No resident profile is associated with your account."
                }
            )


        property_obj = attrs.get(
            "property",
            getattr(
                self.instance,
                "property",
                None,
            ),
        )


        if not property_obj:

            raise serializers.ValidationError(
                {
                    "property":
                        "Please select an authorized property."
                }
            )


        authorized = (
            property_obj
            .occupancy_history
            .filter(
                resident=resident,
                is_active=True,
            )
            .exists()
            or
            property_obj
            .ownership_history
            .filter(
                homeowner=user,
                is_active=True,
            )
            .exists()
        )


        if not authorized:

            raise serializers.ValidationError(
                {
                    "property":
                        "This property is not currently authorized for your resident account."
                }
            )


        attrs[
            "registered_resident"
        ] = resident


        return attrs


class MotoristStickerSerializer(
    serializers.ModelSerializer
):

    sticker_uuid = serializers.UUIDField(
        read_only=True,
    )

    sticker_number = serializers.CharField(
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    property_address = serializers.CharField(
        source="property.address",
        read_only=True,
    )

    resident_name = serializers.CharField(
        source="resident.full_name",
        read_only=True,
    )

    vehicle_plate_number = serializers.CharField(
        source="vehicle.plate_number",
        read_only=True,
    )

    vehicle_description = serializers.SerializerMethodField()

    approved_by_name = serializers.CharField(
        source="approved_by.get_full_name",
        read_only=True,
    )

    class Meta:

        model = MotoristSticker

        fields = [
            "id",
            "sticker_number",
            "sticker_uuid",

            "property",
            "property_address",

            "vehicle",
            "vehicle_plate_number",
            "vehicle_description",

            "resident",
            "resident_name",

            "status",
            "status_display",

            "issued_at",
            "revoked_at",
            "expires_at",

            "approved_by",
            "approved_by_name",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "sticker_number",
            "sticker_uuid",

            "property",
            "property_address",

            "resident",
            "resident_name",

            "vehicle_plate_number",
            "vehicle_description",

            "status",
            "status_display",

            "issued_at",
            "revoked_at",

            "approved_by",
            "approved_by_name",

            "created_at",
            "updated_at",
        ]

    def get_vehicle_description(
        self,
        obj,
    ):

        if not obj.vehicle:
            return "—"

        return (
            f"{obj.vehicle.color} "
            f"{obj.vehicle.make} "
            f"{obj.vehicle.model}"
        )

    def validate(
        self,
        attrs,
    ):

        request = self.context.get(
            "request"
        )

        user = (
            request.user
            if request
            else None
        )

        vehicle = attrs.get(
            "vehicle",
            getattr(
                self.instance,
                "vehicle",
                None,
            ),
        )

        if not vehicle:

            raise serializers.ValidationError(
                {
                    "vehicle":
                        "A vehicle is required."
                }
            )


        # ========================================================
        # RESIDENT REQUEST
        # ========================================================

        is_resident = (
            user
            and user.role != user.Roles.ADMIN
        )


        if is_resident:

            # --------------------------------------------
            # Resident must have his/her own vehicle
            # --------------------------------------------

            if (
                vehicle.registered_resident.user_id
                != user.id
            ):

                raise serializers.ValidationError(
                    {
                        "vehicle":
                            "You can only request a sticker for your own registered vehicle."
                    }
                )


            # --------------------------------------------
            # Vehicle must be active
            # --------------------------------------------

            if not vehicle.is_active:

                raise serializers.ValidationError(
                    {
                        "vehicle":
                            "Only active vehicles can receive a motorist sticker."
                    }
                )


            # --------------------------------------------
            # Derive resident/property from vehicle
            # --------------------------------------------

            resident = (
                vehicle.registered_resident
            )

            property_obj = (
                vehicle.property
            )


            attrs["resident"] = (
                resident
            )

            attrs["property"] = (
                property_obj
            )


            # --------------------------------------------
            # New resident requests are always PENDING
            # --------------------------------------------

            attrs["status"] = (
                MotoristSticker.Status.PENDING
            )


            # --------------------------------------------
            # Existing resident sticker must be pending
            # --------------------------------------------

            if self.instance:

                if self.instance.status != (
                    MotoristSticker.Status.PENDING
                ):

                    raise serializers.ValidationError(
                        "Only pending sticker requests can be modified."
                    )

                if (
                    self.instance.resident_id
                    != resident.id
                ):

                    raise serializers.ValidationError(
                        {
                            "vehicle":
                                "You can only modify your own sticker request."
                        }
                    )


        # ========================================================
        # ADMIN REQUEST
        # ========================================================

        else:

            property_obj = attrs.get(
                "property",
                getattr(
                    self.instance,
                    "property",
                    None,
                ),
            )

            resident = attrs.get(
                "resident",
                getattr(
                    self.instance,
                    "resident",
                    None,
                ),
            )

            status_value = attrs.get(
                "status",
                getattr(
                    self.instance,
                    "status",
                    MotoristSticker.Status.PENDING,
                ),
            )

            if not property_obj:
                raise serializers.ValidationError(
                    {
                        "property":
                            "Property is required."
                    }
                )

            if not resident:
                raise serializers.ValidationError(
                    {
                        "resident":
                            "Resident is required."
                    }
                )

            # --------------------------------------------
            # Resident/property authorization
            # --------------------------------------------

            authorized = (
                property_obj
                .occupancy_history
                .filter(
                    resident=resident,
                    is_active=True,
                )
                .exists()
                or
                property_obj
                .ownership_history
                .filter(
                    homeowner=resident.user,
                    is_active=True,
                )
                .exists()
            )

            if not authorized:

                raise serializers.ValidationError(
                    {
                        "resident":
                            "This resident is not currently authorized for this property."
                    }
                )


            # --------------------------------------------
            # Vehicle relationship
            # --------------------------------------------

            if vehicle.property_id != (
                property_obj.id
            ):

                raise serializers.ValidationError(
                    {
                        "vehicle":
                            "The vehicle does not belong to this property."
                    }
                )


            if vehicle.registered_resident_id != (
                resident.id
            ):

                raise serializers.ValidationError(
                    {
                        "vehicle":
                            "The vehicle is not registered to this resident."
                    }
                )


            # --------------------------------------------
            # Admin status
            # --------------------------------------------

            if (
                not self.instance
                and "status" not in attrs
            ):

                attrs["status"] = (
                    MotoristSticker.Status.PENDING
                )

            else:

                attrs["status"] = status_value


        # ========================================================
        # ONE STICKER PER VEHICLE
        # ========================================================

        if hasattr(
            vehicle,
            "motorist_sticker",
        ):

            existing_sticker = (
                vehicle.motorist_sticker
            )

            if (
                not self.instance
                or existing_sticker.pk
                != self.instance.pk
            ):

                raise serializers.ValidationError(
                    {
                        "vehicle":
                            "This vehicle already has a motorist sticker."
                    }
                )


        # ========================================================
        # MAXIMUM 3 ACTIVE / PENDING PER PROPERTY
        # ========================================================

        property_obj = attrs.get(
            "property",
            getattr(
                self.instance,
                "property",
                None,
            ),
        )

        status_value = attrs.get(
            "status",
            getattr(
                self.instance,
                "status",
                MotoristSticker.Status.PENDING,
            ),
        )

        if (
            property_obj
            and status_value in [
                MotoristSticker.Status.PENDING,
                MotoristSticker.Status.ACTIVE,
            ]
        ):

            existing_count = (
                MotoristSticker.objects
                .filter(
                    property=property_obj,
                    status__in=[
                        MotoristSticker.Status.PENDING,
                        MotoristSticker.Status.ACTIVE,
                    ],
                )
                .exclude(
                    pk=(
                        self.instance.pk
                        if self.instance
                        else None
                    ),
                )
                .count()
            )

            if existing_count >= 3:

                raise serializers.ValidationError(
                    {
                        "property":
                            "This property has already reached the maximum of 3 motorist stickers."
                    }
                )


        # ========================================================
        # EXPLICIT STATUS PROTECTION
        # ========================================================

        if (
            is_resident
            and "status" in attrs
        ):

            attrs["status"] = (
                MotoristSticker.Status.PENDING
            )


        return attrs


    def update(
        self,
        instance,
        validated_data,
    ):

        request = self.context.get(
            "request"
        )

        user = (
            request.user
            if request
            else None
        )


        # ========================================================
        # RESIDENT
        # ========================================================

        if (
            user
            and user.role != user.Roles.ADMIN
        ):

            if instance.status != (
                MotoristSticker.Status.PENDING
            ):

                raise serializers.ValidationError(
                    "Only pending sticker requests can be modified."
                )


            # Residents cannot change lifecycle state.

            validated_data["status"] = (
                MotoristSticker.Status.PENDING
            )


            # Resident may only use own vehicle.

            vehicle = validated_data.get(
                "vehicle",
                instance.vehicle,
            )

            if (
                vehicle.registered_resident.user_id
                != user.id
            ):

                raise serializers.ValidationError(
                    {
                        "vehicle":
                            "You can only use your own registered vehicle."
                    }
                )


            # Re-derive relationships.

            validated_data["resident"] = (
                vehicle.registered_resident
            )

            validated_data["property"] = (
                vehicle.property
            )


            return super().update(
                instance,
                validated_data,
            )


        # ========================================================
        # ADMIN
        # ========================================================

        new_status = validated_data.get(
            "status",
            instance.status,
        )


        if new_status != instance.status:

            if new_status == (
                MotoristSticker.Status.ACTIVE
            ):

                instance.issued_at = (
                    timezone.now()
                )

                instance.revoked_at = None

                instance.approved_by = (
                    user
                )

            elif new_status == (
                MotoristSticker.Status.REVOKED
            ):

                instance.revoked_at = (
                    timezone.now()
                )

            elif new_status == (
                MotoristSticker.Status.EXPIRED
            ):

                instance.revoked_at = None

            elif new_status == (
                MotoristSticker.Status.PENDING
            ):

                instance.issued_at = None

                instance.revoked_at = None

                instance.approved_by = None


        instance.status = (
            new_status
        )


        return super().update(
            instance,
            validated_data,
        )
