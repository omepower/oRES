from rest_framework import serializers

from .models import (
    Property,
    PropertyOwnership,
    PropertyOccupancy,
)


class PropertySerializer(
    serializers.ModelSerializer
):

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    ownership_history_count = (
        serializers.IntegerField(
            source="ownership_history.count",
            read_only=True,
        )
    )

    occupancy_history_count = (
        serializers.IntegerField(
            source="occupancy_history.count",
            read_only=True,
        )
    )

    ownership_status = (
        serializers.SerializerMethodField()
    )

    current_owner_name = (
        serializers.SerializerMethodField()
    )

    current_owner_username = (
        serializers.SerializerMethodField()
    )

    current_occupant_name = (
        serializers.SerializerMethodField()
    )

    current_occupant_username = (
        serializers.SerializerMethodField()
    )

    current_occupant_type = (
        serializers.SerializerMethodField()
    )

    def get_active_ownership(
        self,
        obj,
    ):

        ownerships = getattr(
            obj,
            "active_ownership_records",
            None,
        )

        if ownerships is not None:

            return ownerships[0] if ownerships else None

        return (
            obj.ownership_history
            .select_related(
                "homeowner",
            )
            .filter(
                is_active=True,
            )
            .order_by(
                "-start_date",
                "-id",
            )
            .first()
        )

    def get_active_occupancy(
        self,
        obj,
    ):

        occupancies = getattr(
            obj,
            "active_occupancy_records",
            None,
        )

        if occupancies is not None:

            return (
                occupancies[0]
                if occupancies
                else None
            )

        return (
            obj.occupancy_history
            .select_related(
                "resident",
                "resident__user",
            )
            .filter(
                is_active=True,
            )
            .order_by(
                "-start_date",
                "-id",
            )
            .first()
        )

    def get_ownership_status(
        self,
        obj,
    ):

        ownership = (
            self.get_active_ownership(
                obj
            )
        )

        return (
            "OWNED"
            if ownership
            else "NOT_OWNED"
        )

    def get_current_owner_name(
        self,
        obj,
    ):

        ownership = (
            self.get_active_ownership(
                obj
            )
        )

        if not ownership:

            return ""

        return (
            ownership.homeowner.get_full_name()
            or
            ownership.homeowner.username
        )

    def get_current_owner_username(
        self,
        obj,
    ):

        ownership = (
            self.get_active_ownership(
                obj
            )
        )

        if not ownership:

            return ""

        return (
            ownership.homeowner.username
        )

    def get_current_occupant_name(
        self,
        obj,
    ):

        occupancy = (
            self.get_active_occupancy(
                obj
            )
        )

        if not occupancy:

            return ""

        return (
            occupancy.resident.full_name
            or
            occupancy.resident.user.username
        )

    def get_current_occupant_username(
        self,
        obj,
    ):

        occupancy = (
            self.get_active_occupancy(
                obj
            )
        )

        if not occupancy:

            return ""

        return (
            occupancy.resident.user.username
        )

    def get_current_occupant_type(
        self,
        obj,
    ):

        occupancy = (
            self.get_active_occupancy(
                obj
            )
        )

        if not occupancy:

            return None

        return occupancy.occupancy_type

    class Meta:

        model = Property

        fields = [

            "id",

            "subdivision",

            "block",

            "lot",

            "house_number",

            "street",

            "address",

            "status",

            "status_display",

            "ownership_status",

            "current_owner_name",

            "current_owner_username",

            "current_occupant_name",

            "current_occupant_username",

            "current_occupant_type",

            "is_active",

            "ownership_history_count",

            "occupancy_history_count",

            "created_at",

            "updated_at",

        ]

        read_only_fields = [

            "id",

            "status",

            "status_display",

            "ownership_status",

            "current_owner_name",

            "current_owner_username",

            "current_occupant_name",

            "current_occupant_username",

            "current_occupant_type",

            "created_at",

            "updated_at",

            "ownership_history_count",

            "occupancy_history_count",

        ]


class PropertyOwnershipSerializer(
    serializers.ModelSerializer
):

    homeowner_name = serializers.CharField(
        source="homeowner.get_full_name",
        read_only=True,
    )

    homeowner_username = serializers.CharField(
        source="homeowner.username",
        read_only=True,
    )

    property_address = serializers.CharField(
        source="property.address",
        read_only=True,
    )

    class Meta:

        model = PropertyOwnership

        fields = [

            "id",

            "property",

            "property_address",

            "homeowner",

            "homeowner_name",

            "homeowner_username",

            "start_date",

            "end_date",

            "is_active",

            "created_at",

            "updated_at",

        ]

        read_only_fields = [

            "id",

            "homeowner_name",

            "homeowner_username",

            "property_address",

            "created_at",

            "updated_at",

        ]

    def validate_homeowner(
        self,
        value,
    ):

        if (
            value.role
            != value.Roles.HOMEOWNER
        ):

            raise serializers.ValidationError(
                "The selected user must have the HOMEOWNER role."
            )

        return value

    def validate(
        self,
        attrs,
    ):

        property_obj = attrs.get(
            "property",
            getattr(
                self.instance,
                "property",
                None,
            ),
        )

        start_date = attrs.get(
            "start_date",
            getattr(
                self.instance,
                "start_date",
                None,
            ),
        )

        end_date = attrs.get(
            "end_date",
            getattr(
                self.instance,
                "end_date",
                None,
            ),
        )

        is_active = attrs.get(
            "is_active",
            getattr(
                self.instance,
                "is_active",
                True,
            ),
        )

        if (
            start_date
            and end_date
            and end_date < start_date
        ):

            raise serializers.ValidationError(
                {
                    "end_date":
                        "Ownership end date cannot be earlier than the start date."
                }
            )

        if (
            is_active
            and end_date
        ):

            raise serializers.ValidationError(
                {
                    "is_active":
                        "An active ownership record cannot have an end date."
                }
            )

        if (
            property_obj
            and is_active
        ):

            queryset = (
                PropertyOwnership.objects
                .filter(
                    property=property_obj,
                    is_active=True,
                )
            )

            if self.instance:

                queryset = queryset.exclude(
                    pk=self.instance.pk
                )

            if queryset.exists():

                raise serializers.ValidationError(
                    {
                        "property":
                            "This property already has an active ownership record."
                    }
                )

        return attrs


class PropertyOccupancySerializer(
    serializers.ModelSerializer
):

    resident_name = serializers.CharField(
        source="resident.full_name",
        read_only=True,
    )

    resident_username = serializers.CharField(
        source="resident.user.username",
        read_only=True,
    )

    property_address = serializers.CharField(
        source="property.address",
        read_only=True,
    )

    occupancy_type_display = (
        serializers.CharField(
            source="get_occupancy_type_display",
            read_only=True,
        )
    )

    class Meta:

        model = PropertyOccupancy

        fields = [

            "id",

            "property",

            "property_address",

            "resident",

            "resident_name",

            "resident_username",

            "occupancy_type",

            "occupancy_type_display",

            "start_date",

            "end_date",

            "is_active",

            "created_at",

            "updated_at",

        ]

        read_only_fields = [

            "id",

            "property_address",

            "resident_name",

            "resident_username",

            "occupancy_type_display",

            "created_at",

            "updated_at",

        ]

    def validate(
        self,
        attrs,
    ):

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

        occupancy_type = attrs.get(
            "occupancy_type",
            getattr(
                self.instance,
                "occupancy_type",
                None,
            ),
        )

        start_date = attrs.get(
            "start_date",
            getattr(
                self.instance,
                "start_date",
                None,
            ),
        )

        end_date = attrs.get(
            "end_date",
            getattr(
                self.instance,
                "end_date",
                None,
            ),
        )

        is_active = attrs.get(
            "is_active",
            getattr(
                self.instance,
                "is_active",
                True,
            ),
        )

        if (
            start_date
            and end_date
            and end_date < start_date
        ):

            raise serializers.ValidationError(
                {
                    "end_date":
                        "Occupancy end date cannot be earlier than the start date."
                }
            )

        if (
            is_active
            and end_date
        ):

            raise serializers.ValidationError(
                {
                    "is_active":
                        "An active occupancy record cannot have an end date."
                }
            )

        if (
            resident
            and occupancy_type
        ):

            resident_role = (
                resident.user.role
            )

            if (
                occupancy_type
                ==
                PropertyOccupancy.OccupancyType.HOMEOWNER
                and
                resident_role
                !=
                resident.user.Roles.HOMEOWNER
            ):

                raise serializers.ValidationError(
                    {
                        "occupancy_type":
                            "A HOMEOWNER occupancy must belong to a homeowner."
                    }
                )

            if (
                occupancy_type
                ==
                PropertyOccupancy.OccupancyType.TENANT
                and
                resident_role
                !=
                resident.user.Roles.TENANT
            ):

                raise serializers.ValidationError(
                    {
                        "occupancy_type":
                            "A TENANT occupancy must belong to a tenant."
                    }
                )

        if (
            property_obj
            and is_active
        ):

            queryset = (
                PropertyOccupancy.objects
                .filter(
                    property=property_obj,
                    is_active=True,
                )
            )

            if self.instance:

                queryset = queryset.exclude(
                    pk=self.instance.pk
                )

            if queryset.exists():

                raise serializers.ValidationError(
                    {
                        "property":
                            "This property already has an active occupancy record."
                    }
                )

        return attrs