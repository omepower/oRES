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