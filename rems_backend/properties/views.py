from django.db import transaction
from django.db.models import Prefetch, Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import (
    IsAdmin,
    IsAdminOrResident,
)

from notifications.models import Notification

from notifications.services import (
    NotificationService,
)

from .models import (
    Property,
    PropertyOwnership,
    PropertyOccupancy,
)

from .serializers import (
    PropertySerializer,
    PropertyOwnershipSerializer,
    PropertyOccupancySerializer,
)




class PropertyViewSet(
    ModelViewSet
):

    queryset = Property.objects.all()

    serializer_class = PropertySerializer
    
    permission_classes = [
        IsAuthenticated,
        IsAdminOrResident,
    ]

    search_fields = [
        "subdivision",
        "block",
        "lot",
        "house_number",
        "street",
        "address",
    ]

    filterset_fields = [
        "subdivision",
        "status",
        "is_active",
    ]

    ordering_fields = [
        "subdivision",
        "block",
        "lot",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "block",
        "lot",
    ]

    def get_queryset(
        self,
    ):

        active_ownerships = (
            PropertyOwnership.objects
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
        )

        active_occupancies = (
            PropertyOccupancy.objects
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
        )

        return (
            super()
            .get_queryset()
            .prefetch_related(
                Prefetch(
                    "ownership_history",
                    queryset=active_ownerships,
                    to_attr="active_ownership_records",
                ),
                Prefetch(
                    "occupancy_history",
                    queryset=active_occupancies,
                    to_attr="active_occupancy_records",
                ),
            )
        )
        
    @action(
    detail=False,
    methods=["get"],
     url_path="mine",
    )
    def mine(
        self,
        request,
    ):
        """
        Return properties associated with the authenticated resident.

        HOMEOWNER:
            Returns properties actively owned by the user.

        TENANT:
            Returns properties where the user has an active occupancy.

        ADMIN:
            Returns all properties.
        """

        user = request.user

        if user.role == user.Roles.ADMIN:

            properties = self.get_queryset()

        elif user.role == user.Roles.HOMEOWNER:

            properties = (
                self.get_queryset()
                .filter(
                    ownership_history__homeowner=user,
                    ownership_history__is_active=True,
                )
                .distinct()
            )

        elif user.role == user.Roles.TENANT:

            properties = (
                self.get_queryset()
                .filter(
                    occupancy_history__resident__user=user,
                    occupancy_history__is_active=True,
                )
                .distinct()
            )

        else:

            properties = self.get_queryset().none()

        serializer = self.get_serializer(
            properties,
            many=True,
        )

        return Response(
            serializer.data
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="ownership-history",
    )
    def ownership_history(
        self,
        request,
        pk=None,
    ):

        property_obj = self.get_object()

        records = (
            PropertyOwnership.objects
            .select_related(
                "homeowner",
                "property",
            )
            .filter(
                property=property_obj,
            )
            .order_by(
                "-start_date",
            )
        )

        serializer = (
            PropertyOwnershipSerializer(
                records,
                many=True,
            )
        )

        return Response(
            serializer.data
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="occupancy-history",
    )
    def occupancy_history(
        self,
        request,
        pk=None,
    ):

        property_obj = self.get_object()

        records = (
            PropertyOccupancy.objects
            .select_related(
                "resident",
                "resident__user",
                "property",
            )
            .filter(
                property=property_obj,
            )
            .order_by(
                "-start_date",
            )
        )

        serializer = (
            PropertyOccupancySerializer(
                records,
                many=True,
            )
        )

        return Response(
            serializer.data
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="current-owner",
    )
    def current_owner(
        self,
        request,
        pk=None,
    ):

        property_obj = self.get_object()

        ownership = (
            PropertyOwnership.objects
            .select_related(
                "homeowner",
                "property",
            )
            .filter(
                property=property_obj,
                is_active=True,
            )
            .order_by(
                "-start_date",
                "-id",
            )
            .first()
        )

        if not ownership:

            return Response(
                {
                    "detail":
                        "This property currently has no active homeowner."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = (
            PropertyOwnershipSerializer(
                ownership,
            )
        )

        return Response(
            serializer.data
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="current-occupant",
    )
    def current_occupant(
        self,
        request,
        pk=None,
    ):

        property_obj = self.get_object()

        occupancy = (
            PropertyOccupancy.objects
            .select_related(
                "resident",
                "resident__user",
                "property",
            )
            .filter(
                property=property_obj,
                is_active=True,
            )
            .order_by(
                "-start_date",
                "-id",
            )
            .first()
        )

        if not occupancy:

            return Response(
                {
                    "detail":
                        "This property currently has no active occupant."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = (
            PropertyOccupancySerializer(
                occupancy,
            )
        )

        return Response(
            serializer.data
        )


class PropertyOwnershipViewSet(
    ModelViewSet
):

    queryset = (
        PropertyOwnership.objects
        .select_related(
            "property",
            "homeowner",
        )
        .all()
    )

    serializer_class = (
        PropertyOwnershipSerializer
    )

    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]

    filterset_fields = [
        "property",
        "homeowner",
        "is_active",
    ]

    search_fields = [
        "property__address",
        "property__block",
        "property__lot",
        "homeowner__username",
        "homeowner__first_name",
        "homeowner__last_name",
    ]

    ordering = [
        "-start_date",
    ]

    @action(
        detail=False,
        methods=["get"],
        url_path="active",
    )
    def active(
        self,
        request,
    ):

        records = (
            self.get_queryset()
            .filter(
                is_active=True,
            )
        )

        serializer = self.get_serializer(
            records,
            many=True,
        )

        return Response(
            serializer.data
        )
    
    # ========================================================
    # HOMEOWNER PORTAL URL
    # ========================================================

    def _homeowner_property_url(
        self,
    ):

        return "/homeowner/properties"
    
    # ========================================================
    # CREATE OWNERSHIP
    #
    # Property assigned to homeowner
    # → Homeowner notification
    # ========================================================

    def perform_create(
        self,
        serializer,
    ):

        ownership = (
            serializer.save()
        )

        homeowner = (
            ownership.homeowner
        )

        property_obj = (
            ownership.property
        )


        if not homeowner:
            return


        def notify():

            NotificationService.property(

                recipient=homeowner,

                actor=self.request.user,

                title=(
                    "Property Ownership Assigned"
                ),

                message=(
                    f"You have been assigned ownership "
                    f"of {property_obj.address}."
                ),

                action_url=(
                    self._homeowner_property_url()
                ),

                metadata={

                    "event":
                        "PROPERTY_OWNERSHIP_ASSIGNED",

                    "ownership_id":
                        ownership.id,

                    "property_id":
                        property_obj.id,

                    "property_address":
                        property_obj.address,

                    "homeowner_id":
                        homeowner.id,
                },

                priority=(
                    Notification.Priority.SUCCESS
                ),
            )


        transaction.on_commit(
            notify
        )
    
    # ========================================================
    # UPDATE OWNERSHIP
    #
    # Active ownership → inactive
    # → Homeowner notification
    # ========================================================

    def perform_update(
        self,
        serializer,
    ):

        previous_instance = (
            self.get_object()
        )

        was_active = (
            previous_instance.is_active
        )

        ownership = (
            serializer.save()
        )

        became_inactive = (
            was_active
            and not ownership.is_active
        )


        if not became_inactive:
            return


        homeowner = (
            ownership.homeowner
        )

        property_obj = (
            ownership.property
        )


        if not homeowner:
            return


        def notify():

            NotificationService.property(

                recipient=homeowner,

                actor=self.request.user,

                title=(
                    "Property Ownership Ended"
                ),

                message=(
                    f"Your ownership of "
                    f"{property_obj.address} "
                    f"has ended."
                ),

                action_url=(
                    self._homeowner_property_url()
                ),

                metadata={

                    "event":
                        "PROPERTY_OWNERSHIP_ENDED",

                    "ownership_id":
                        ownership.id,

                    "property_id":
                        property_obj.id,

                    "property_address":
                        property_obj.address,

                    "homeowner_id":
                        homeowner.id,
                },

                priority=(
                    Notification.Priority.WARNING
                ),
            )


        transaction.on_commit(
            notify
        )


class PropertyOccupancyViewSet(
    ModelViewSet
):

    queryset = (
        PropertyOccupancy.objects
        .select_related(
            "property",
            "resident",
            "resident__user",
        )
        .all()
    )

    serializer_class = (
        PropertyOccupancySerializer
    )

    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]

    filterset_fields = [
        "property",
        "resident",
        "occupancy_type",
        "is_active",
    ]

    search_fields = [
        "property__address",
        "property__block",
        "property__lot",
        "resident__user__username",
        "resident__user__first_name",
        "resident__user__last_name",
    ]

    ordering = [
        "-start_date",
    ]

    @action(
        detail=False,
        methods=["get"],
        url_path="active",
    )
    def active(
        self,
        request,
    ):

        records = (
            self.get_queryset()
            .filter(
                is_active=True,
            )
        )

        serializer = self.get_serializer(
            records,
            many=True,
        )

        return Response(
            serializer.data
        )
    
    # ========================================================
    # RESIDENT PORTAL URL
    # ========================================================

    def _resident_property_url(
        self,
        resident,
    ):

        role = str(
            getattr(
                resident.user,
                "role",
                "",
            )
        ).strip().upper()


        if role == "TENANT":

            return "/tenant/property"


        return "/homeowner/properties"
    
    # ========================================================
    # CREATE OCCUPANCY
    #
    # Resident assigned to property
    # → Resident notification
    # ========================================================

    def perform_create(
        self,
        serializer,
    ):

        occupancy = (
            serializer.save()
        )

        resident = (
            occupancy.resident
        )

        property_obj = (
            occupancy.property
        )


        if not resident:
            return


        resident_user = (
            resident.user
        )


        def notify():

            NotificationService.property(

                recipient=resident_user,

                actor=self.request.user,

                title=(
                    "Residence Assignment Updated"
                ),

                message=(
                    f"You have been assigned to "
                    f"{property_obj.address}."
                ),

                action_url=(
                    self._resident_property_url(
                        resident
                    )
                ),

                metadata={

                    "event":
                        "PROPERTY_OCCUPANCY_ASSIGNED",

                    "occupancy_id":
                        occupancy.id,

                    "property_id":
                        property_obj.id,

                    "property_address":
                        property_obj.address,

                    "resident_id":
                        resident.id,
                },

                priority=(
                    Notification.Priority.SUCCESS
                ),
            )


        transaction.on_commit(
            notify
        )
    
    # ========================================================
    # UPDATE OCCUPANCY
    #
    # Active occupancy → inactive
    # → Resident notification
    # ========================================================

    def perform_update(
        self,
        serializer,
    ):

        previous_instance = (
            self.get_object()
        )

        was_active = (
            previous_instance.is_active
        )

        occupancy = (
            serializer.save()
        )

        became_inactive = (
            was_active
            and not occupancy.is_active
        )


        if not became_inactive:
            return


        resident = (
            occupancy.resident
        )

        property_obj = (
            occupancy.property
        )


        if not resident:
            return


        resident_user = (
            resident.user
        )


        def notify():

            NotificationService.property(

                recipient=resident_user,

                actor=self.request.user,

                title=(
                    "Residence Assignment Ended"
                ),

                message=(
                    f"Your occupancy of "
                    f"{property_obj.address} "
                    f"has ended."
                ),

                action_url=(
                    self._resident_property_url(
                        resident
                    )
                ),

                metadata={

                    "event":
                        "PROPERTY_OCCUPANCY_ENDED",

                    "occupancy_id":
                        occupancy.id,

                    "property_id":
                        property_obj.id,

                    "property_address":
                        property_obj.address,

                    "resident_id":
                        resident.id,
                },

                priority=(
                    Notification.Priority.WARNING
                ),
            )


        transaction.on_commit(
            notify
        )