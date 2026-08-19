from django.utils import timezone

from rest_framework import serializers

from .models import (
    VisitorInvitation,
    VisitorVisit,
)

from residents.models import Resident


class VisitorInvitationSerializer(
    serializers.ModelSerializer
):

    host_name = serializers.CharField(
        source="host.full_name",
        read_only=True,
    )

    host_phone = serializers.CharField(
        source="host.phone",
        read_only=True,
    )

    host_type = serializers.CharField(
        source="host.resident_type",
        read_only=True,
    )

    property_address = serializers.CharField(
        source="property.address",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    is_expired = serializers.BooleanField(
        read_only=True,
    )

    invitation_code = serializers.UUIDField(
        read_only=True,
    )

    visit = serializers.SerializerMethodField()

    def get_visit(self, obj):

        try:

            visit = obj.visit

        except VisitorVisit.DoesNotExist:

            return None

        return VisitorVisitSerializer(
            visit,
            context=self.context,
        ).data


    class Meta:

        model = VisitorInvitation

        fields = [
            "id",
            "invitation_code",

            "visitor_name",
            "visitor_home_address",
            "visitor_phone",

            "host",
            "host_name",
            "host_address_snapshot",
            "host_phone_snapshot",
            "host_type_snapshot",
            "host_phone",
            "host_type",

            "property",
            "property_address",

            "visit_date",
            "expected_time_in",
            "expected_time_out",

            "status",
            "status_display",

            "qr_generated_at",
            "cancelled_at",

            "is_expired",

            "visit",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "invitation_code",

            "host_name",
            "host_phone",
            "host_type",

            "host_address_snapshot",
            "host_phone_snapshot",
            "host_type_snapshot",

            "property_address",

            "status",
            "status_display",

            "qr_generated_at",
            "cancelled_at",

            "is_expired",

            "created_at",
            "updated_at",
        ]

        extra_kwargs = {
            "host": {
                "required": False,
            },
        }



    def _get_request_user(
        self,
    ):

        request = self.context.get(
            "request"
        )

        if not request:
            return None

        return request.user


    def _get_authenticated_resident(
        self,
    ):

        user = self._get_request_user()

        if not user:
            return None

        try:

            return (
                Resident.objects
                .select_related("user")
                .get(
                    user=user
                )
            )

        except Resident.DoesNotExist:

            raise serializers.ValidationError(
                {
                    "host":
                        "No resident profile is associated with the authenticated account."
                }
            )


    def validate(
        self,
        attrs,
    ):

        request_user = (
            self._get_request_user()
        )

        visit_date = attrs.get(
            "visit_date",
            getattr(
                self.instance,
                "visit_date",
                None,
            ),
        )

        expected_time_in = attrs.get(
            "expected_time_in",
            getattr(
                self.instance,
                "expected_time_in",
                None,
            ),
        )

        expected_time_out = attrs.get(
            "expected_time_out",
            getattr(
                self.instance,
                "expected_time_out",
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

        submitted_host = attrs.get(
            "host",
            getattr(
                self.instance,
                "host",
                None,
            ),
        )


        # ========================================================
        # DATE / TIME VALIDATION
        # ========================================================

        if (
            expected_time_in
            and expected_time_out
            and expected_time_out <= expected_time_in
        ):

            raise serializers.ValidationError(
                {
                    "expected_time_out":
                        "Expected time out must be later than expected time in."
                }
            )


        if (
            visit_date
            and visit_date < timezone.localdate()
        ):

            raise serializers.ValidationError(
                {
                    "visit_date":
                        "The visit date cannot be in the past."
                }
            )


        # ========================================================
        # RESIDENT HOST ASSIGNMENT
        # ========================================================

        if (
            request_user
            and request_user.role != request_user.Roles.ADMIN
        ):

            resident = (
                self._get_authenticated_resident()
            )

            if not self.instance:

                submitted_host = resident

            else:

                submitted_host = resident

                if (
                    self.instance.host_id
                    != resident.id
                ):

                    raise serializers.ValidationError(
                        {
                            "host":
                                "You can only modify your own visitor invitations."
                        }
                    )


            attrs["host"] = submitted_host


        else:

            if (
                not self.instance
                and not submitted_host
            ):

                raise serializers.ValidationError(
                    {
                        "host":
                            "A host is required when creating a visitor invitation."
                    }
                )


            if (
                submitted_host
                and submitted_host.user.role
                not in [
                    submitted_host.user.Roles.HOMEOWNER,
                    submitted_host.user.Roles.TENANT,
                ]
            ):

                raise serializers.ValidationError(
                    {
                        "host":
                            "The selected host must be a homeowner or tenant resident."
                    }
                )


            attrs["host"] = submitted_host


        host = attrs.get(
            "host",
            getattr(
                self.instance,
                "host",
                None,
            ),
        )


        # ========================================================
        # PROPERTY / RESIDENT AUTHORIZATION
        # ========================================================

        if (
            host
            and property_obj
        ):

            authorized_by_occupancy = (
                property_obj
                .occupancy_history
                .filter(
                    resident=host,
                    is_active=True,
                )
                .exists()
            )

            authorized_by_ownership = (
                property_obj
                .ownership_history
                .filter(
                    homeowner=host.user,
                    is_active=True,
                )
                .exists()
            )

            if not (
                authorized_by_occupancy
                or authorized_by_ownership
            ):

                raise serializers.ValidationError(
                    {
                        "property":
                            "You are not currently authorized for the selected property."
                    }
                )


        # ========================================================
        # INSTANCE SAFETY
        # ========================================================

        if self.instance:

            if (
                self.instance.status
                != VisitorInvitation.Status.PENDING
            ):

                raise serializers.ValidationError(
                    "Only pending visitor invitations can be modified."
                )


        return attrs


class VisitorVisitSerializer(
    serializers.ModelSerializer
):

    visitor_name = serializers.CharField(
        source="invitation.visitor_name",
        read_only=True,
    )

    visitor_phone = serializers.CharField(
        source="invitation.visitor_phone",
        read_only=True,
    )

    visitor_home_address = serializers.CharField(
        source="invitation.visitor_home_address",
        read_only=True,
    )

    host_name = serializers.CharField(
        source="invitation.host_name_snapshot",
        read_only=True,
    )

    host_address = serializers.CharField(
        source="invitation.host_address_snapshot",
        read_only=True,
    )

    host_phone = serializers.CharField(
        source="invitation.host_phone_snapshot",
        read_only=True,
    )

    property_address = serializers.CharField(
        source="invitation.property.address",
        read_only=True,
    )

    invitation_code = serializers.UUIDField(
        source="invitation.invitation_code",
        read_only=True,
    )

    gate_name = serializers.CharField(
        source="gate.name",
        read_only=True,
    )

    scanned_by_name = serializers.CharField(
        source="scanned_by.get_full_name",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:

        model = VisitorVisit

        fields = [
            "id",

            "invitation",
            "invitation_code",

            "visitor_name",
            "visitor_phone",
            "visitor_home_address",

            "host_name",
            "host_address",
            "host_phone",

            "property_address",

            "gate",
            "gate_name",

            "time_in",
            "time_out",

            "status",
            "status_display",

            "scanned_by",
            "scanned_by_name",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "invitation_code",

            "visitor_name",
            "visitor_phone",
            "visitor_home_address",

            "host_name",
            "host_address",
            "host_phone",

            "property_address",

            "gate_name",

            "time_in",
            "time_out",

            "status",
            "status_display",

            "scanned_by",
            "scanned_by_name",

            "created_at",
            "updated_at",
        ]

# from django.utils import timezone

# from rest_framework import serializers

# from .models import (
#     VisitorInvitation,
#     VisitorVisit,
# )

# from residents.models import Resident



# class VisitorInvitationSerializer(
#     serializers.ModelSerializer
# ):

#     host_name = serializers.CharField(
#         source="host.full_name",
#         read_only=True,
#     )

#     host_phone = serializers.CharField(
#         source="host.phone",
#         read_only=True,
#     )

#     host_type = serializers.CharField(
#         source="host.resident_type",
#         read_only=True,
#     )

#     property_address = serializers.CharField(
#         source="property.address",
#         read_only=True,
#     )

#     status_display = serializers.CharField(
#         source="get_status_display",
#         read_only=True,
#     )

#     is_expired = serializers.BooleanField(
#         read_only=True,
#     )

#     invitation_code = serializers.UUIDField(
#         read_only=True,
#     )

#     class Meta:

#         model = VisitorInvitation

#         fields = [
#             "id",
#             "invitation_code",

#             "visitor_name",
#             "visitor_home_address",
#             "visitor_phone",

#             "host",
#             "host_name",
#             "host_address_snapshot",
#             "host_phone_snapshot",
#             "host_type_snapshot",
#             "host_phone",
#             "host_type",

#             "property",
#             "property_address",

#             "visit_date",
#             "expected_time_in",
#             "expected_time_out",

#             "status",
#             "status_display",

#             "qr_generated_at",
#             "cancelled_at",

#             "is_expired",

#             "created_at",
#             "updated_at",
#         ]

#         read_only_fields = [
#             "id",
#             "invitation_code",

#             "host_name",
#             "host_phone",
#             "host_type",

#             "host_address_snapshot",
#             "host_phone_snapshot",
#             "host_type_snapshot",

#             "property_address",

#             "status",
#             "status_display",

#             "qr_generated_at",
#             "cancelled_at",

#             "is_expired",

#             "created_at",
#             "updated_at",
#         ]

#         extra_kwargs = {
#             "host": {
#                 "required": False,
#             },
#         }


#     def _get_request_user(self):

#         request = self.context.get(
#             "request"
#         )

#         if not request:
#             return None

#         return request.user


#     def _get_authenticated_resident(self):

#         user = self._get_request_user()

#         if not user:
#             return None

#         try:

#             return (
#                 Resident.objects
#                 .select_related("user")
#                 .get(
#                     user=user
#                 )
#             )

#         except Resident.DoesNotExist:

#             raise serializers.ValidationError(
#                 {
#                     "host":
#                         "No resident profile is associated with the authenticated account."
#                 }
#             )


#     def validate(
#         self,
#         attrs,
#     ):

#         request_user = (
#             self._get_request_user()
#         )

#         visit_date = attrs.get(
#             "visit_date",
#             getattr(
#                 self.instance,
#                 "visit_date",
#                 None,
#             ),
#         )

#         expected_time_in = attrs.get(
#             "expected_time_in",
#             getattr(
#                 self.instance,
#                 "expected_time_in",
#                 None,
#             ),
#         )

#         expected_time_out = attrs.get(
#             "expected_time_out",
#             getattr(
#                 self.instance,
#                 "expected_time_out",
#                 None,
#             ),
#         )

#         property_obj = attrs.get(
#             "property",
#             getattr(
#                 self.instance,
#                 "property",
#                 None,
#             ),
#         )

#         submitted_host = attrs.get(
#             "host",
#             getattr(
#                 self.instance,
#                 "host",
#                 None,
#             ),
#         )


#         # ========================================================
#         # DATE / TIME VALIDATION
#         # ========================================================

#         if (
#             expected_time_in
#             and expected_time_out
#             and expected_time_out <= expected_time_in
#         ):

#             raise serializers.ValidationError(
#                 {
#                     "expected_time_out":
#                         "Expected time out must be later than expected time in."
#                 }
#             )


#         if (
#             visit_date
#             and visit_date < timezone.localdate()
#         ):

#             raise serializers.ValidationError(
#                 {
#                     "visit_date":
#                         "The visit date cannot be in the past."
#                 }
#             )


#         # ========================================================
#         # RESIDENT HOST ASSIGNMENT
#         #
#         # ADMIN:
#         #   May explicitly select a host.
#         #
#         # HOMEOWNER / TENANT:
#         #   Host is always the authenticated resident.
#         # ========================================================

#         if (
#             request_user
#             and request_user.role != request_user.Roles.ADMIN
#         ):

#             resident = (
#                 self._get_authenticated_resident()
#             )

#             if not self.instance:

#                 submitted_host = resident

#             else:

#                 submitted_host = resident

#                 if (
#                     self.instance.host_id
#                     != resident.id
#                 ):

#                     raise serializers.ValidationError(
#                         {
#                             "host":
#                                 "You can only modify your own visitor invitations."
#                         }
#                     )


#             attrs["host"] = submitted_host


#         else:

#             # ADMIN CREATE
#             if not self.instance and not submitted_host:

#                 raise serializers.ValidationError(
#                     {
#                         "host":
#                             "A host is required when creating a visitor invitation."
#                     }
#                 )


#             if (
#                 submitted_host
#                 and submitted_host.user.role
#                 not in [
#                     submitted_host.user.Roles.HOMEOWNER,
#                     submitted_host.user.Roles.TENANT,
#                 ]
#             ):

#                 raise serializers.ValidationError(
#                     {
#                         "host":
#                             "The selected host must be a homeowner or tenant resident."
#                     }
#                 )


#             attrs["host"] = submitted_host


#         host = attrs.get(
#             "host",
#             getattr(
#                 self.instance,
#                 "host",
#                 None,
#             ),
#         )


#         # ========================================================
#         # PROPERTY / RESIDENT AUTHORIZATION
#         # ========================================================

#         if (
#             host
#             and property_obj
#         ):

#             authorized_by_occupancy = (
#                 property_obj
#                 .occupancy_history
#                 .filter(
#                     resident=host,
#                     is_active=True,
#                 )
#                 .exists()
#             )

#             authorized_by_ownership = (
#                 property_obj
#                 .ownership_history
#                 .filter(
#                     homeowner=host.user,
#                     is_active=True,
#                 )
#                 .exists()
#             )

#             if not (
#                 authorized_by_occupancy
#                 or authorized_by_ownership
#             ):

#                 raise serializers.ValidationError(
#                     {
#                         "property":
#                             "You are not currently authorized for the selected property."
#                     }
#                 )


#         # ========================================================
#         # ADMIN / RESIDENT INSTANCE SAFETY
#         # ========================================================

#         if self.instance:

#             if self.instance.status != (
#                 VisitorInvitation.Status.PENDING
#             ):

#                 raise serializers.ValidationError(
#                     "Only pending visitor invitations can be modified."
#                 )


#         return attrs




# class VisitorVisitSerializer(
#     serializers.ModelSerializer
# ):

#     visitor_name = serializers.CharField(
#         source="invitation.visitor_name",
#         read_only=True,
#     )

#     visitor_phone = serializers.CharField(
#         source="invitation.visitor_phone",
#         read_only=True,
#     )

#     visitor_home_address = serializers.CharField(
#         source="invitation.visitor_home_address",
#         read_only=True,
#     )

#     host_name = serializers.CharField(
#         source="invitation.host_name_snapshot",
#         read_only=True,
#     )

#     host_address = serializers.CharField(
#         source="invitation.host_address_snapshot",
#         read_only=True,
#     )

#     host_phone = serializers.CharField(
#         source="invitation.host_phone_snapshot",
#         read_only=True,
#     )

#     property_address = serializers.CharField(
#         source="invitation.property.address",
#         read_only=True,
#     )

#     invitation_code = serializers.UUIDField(
#         source="invitation.invitation_code",
#         read_only=True,
#     )

#     gate_name = serializers.CharField(
#         source="gate.name",
#         read_only=True,
#     )

#     scanned_by_name = serializers.CharField(
#         source="scanned_by.get_full_name",
#         read_only=True,
#     )

#     status_display = serializers.CharField(
#         source="get_status_display",
#         read_only=True,
#     )

#     class Meta:
#         model = VisitorVisit

#         fields = [
#             "id",

#             "invitation",
#             "invitation_code",

#             "visitor_name",
#             "visitor_phone",
#             "visitor_home_address",

#             "host_name",
#             "host_address",
#             "host_phone",

#             "property_address",

#             "gate",
#             "gate_name",

#             "time_in",
#             "time_out",

#             "status",
#             "status_display",

#             "scanned_by",
#             "scanned_by_name",

#             "created_at",
#             "updated_at",
#         ]

#         read_only_fields = [
#             "id",
#             "invitation_code",

#             "visitor_name",
#             "visitor_phone",
#             "visitor_home_address",

#             "host_name",
#             "host_address",
#             "host_phone",

#             "property_address",

#             "gate_name",

#             "time_in",
#             "time_out",

#             "status",
#             "status_display",

#             "scanned_by",
#             "scanned_by_name",

#             "created_at",
#             "updated_at",
#         ]

