from notifications.models import Notification
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

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
    Vehicle,
    MotoristSticker,
)

from .serializers import (
    VehicleSerializer,
    MotoristStickerSerializer,
)

from notifications.services import (
    NotificationService,
)

User = get_user_model()



class VehicleViewSet(
    ModelViewSet
):

    queryset = (
        Vehicle.objects
        .select_related(
            "property",
            "registered_resident",
            "registered_resident__user",
        )
        .all()
    )

    serializer_class = VehicleSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdminOrResident,
    ]

    search_fields = [
        "plate_number",
        "make",
        "model",
        "color",
        "property__address",
        "property__block",
        "property__lot",
        "registered_resident__first_name",
        "registered_resident__last_name",
    ]

    filterset_fields = [
        "vehicle_type",
        "ownership_type",
        "is_active",
        "property",
        "registered_resident",
    ]

    ordering_fields = [
        "plate_number",
        "make",
        "model",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "plate_number",
    ]
    
    # ========================================================
    # CREATE VEHICLE
    #
    # Resident vehicle registration
    # → Admin notification
    # ========================================================

    def perform_create(
        self,
        serializer,
    ):

        vehicle = (
            serializer.save()
        )

        actor = (
            self.request.user
        )


        # ----------------------------------------------------
        # Only resident-created vehicles generate an
        # administrator notification.
        # ----------------------------------------------------

        if actor.role == actor.Roles.ADMIN:

            return


        resident = (
            vehicle.registered_resident
        )


        resident_name = (
            resident.full_name
            if resident
            else "A resident"
        )


        vehicle_name = (
            f"{vehicle.color} "
            f"{vehicle.make} "
            f"{vehicle.model}"
        ).strip()


        def notify():

            admin_users = (
                User.objects
                .filter(
                    role=User.Roles.ADMIN,
                    is_active=True,
                )
            )


            for admin_user in admin_users:

                NotificationService.vehicle(

                    recipient=admin_user,

                    actor=actor,

                    title=(
                        "New Vehicle Registration"
                    ),

                    message=(
                        f"{resident_name} registered "
                        f"{vehicle_name} "
                        f"({vehicle.plate_number})."
                    ),

                    action_url=(
                        "/admin/vehicles"
                    ),

                    metadata={

                        "event":
                            "VEHICLE_REGISTERED",

                        "vehicle_id":
                            vehicle.id,

                        "vehicle_uuid":
                            str(
                                vehicle.vehicle_uuid
                            ),

                        "plate_number":
                            vehicle.plate_number,

                        "registered_resident":
                            vehicle.registered_resident_id,

                        "property_id":
                            vehicle.property_id,
                    },

                    priority=(
                        Notification.Priority.INFO
                    ),
                )


        transaction.on_commit(
            notify
        )

    def get_queryset(
        self
    ):

        queryset = super().get_queryset()

        user = self.request.user

        if user.role == user.Roles.ADMIN:

            return queryset

        return queryset.filter(
            registered_resident__user=user
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

        vehicles = (
            self.get_queryset()
            .filter(
                registered_resident__user=
                    request.user
            )
        )

        serializer = self.get_serializer(
            vehicles,
            many=True,
        )

        return Response(
            serializer.data
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="active",
    )
    def active(
        self,
        request,
    ):

        vehicles = (
            self.get_queryset()
            .filter(
                is_active=True
            )
        )

        serializer = self.get_serializer(
            vehicles,
            many=True,
        )

        return Response(
            serializer.data
        )
    
    



# ============================================================
# MOTORIST STICKERS
# ============================================================

class MotoristStickerViewSet(
    ModelViewSet
):

    queryset = (
        MotoristSticker.objects
        .select_related(
            "property",
            "vehicle",
            "resident",
            "resident__user",
            "approved_by",
        )
        .all()
    )

    serializer_class = (
        MotoristStickerSerializer
    )

    permission_classes = [
        IsAuthenticated,
        IsAdminOrResident,
    ]

    search_fields = [
        "sticker_number",
        "vehicle__plate_number",
        "vehicle__make",
        "vehicle__model",
        "resident__first_name",
        "resident__last_name",
        "property__address",
    ]

    filterset_fields = [
        "status",
        "property",
        "resident",
        "vehicle",
    ]

    ordering_fields = [
        "sticker_number",
        "created_at",
        "issued_at",
        "expires_at",
    ]

    ordering = [
        "-created_at",
    ]


    # ========================================================
    # HELPERS
    # ========================================================

    def _resident_sticker_url(
        self,
        resident_user,
    ):

        role = str(
            getattr(
                resident_user,
                "role",
                "",
            )
        ).upper()

        if role == "TENANT":

            return "/tenant/stickers"

        return "/homeowner/stickers"


    def _notify_admins_sticker_request(
        self,
        sticker,
        actor,
    ):

        admin_users = (
            User.objects
            .filter(
                role=User.Roles.ADMIN,
                is_active=True,
            )
        )

        vehicle = (
            sticker.vehicle
        )

        resident = (
            sticker.resident
        )

        resident_name = (
            resident.full_name
            if resident
            else "A resident"
        )

        vehicle_description = (
            f"{vehicle.plate_number}"
            if vehicle
            else "vehicle"
        )

        for admin_user in admin_users:

            NotificationService.sticker(

                recipient=admin_user,

                actor=actor,

                title=(
                    "New Motorist Sticker Request"
                ),

                message=(
                    f"{resident_name} submitted "
                    f"a motorist sticker request "
                    f"for {vehicle_description}."
                ),

                action_url="/admin/stickers",

                metadata={

                    "event":
                        "STICKER_REQUESTED",

                    "sticker_id":
                        sticker.id,

                    "sticker_number":
                        sticker.sticker_number,

                    "vehicle_id":
                        sticker.vehicle_id,

                    "plate_number":
                        vehicle.plate_number
                        if vehicle
                        else "",

                    "resident_id":
                        resident.id
                        if resident
                        else None,

                    "property_id":
                        sticker.property_id,

                },

                priority=(
                    NotificationService
                    .create.__func__.__defaults__[1]
                    if False
                    else Notification.Priority.INFO
                ),
            )


    # ========================================================
    # QUERYSET
    # ========================================================

    def get_queryset(
        self
    ):

        queryset = (
            super().get_queryset()
        )

        user = (
            self.request.user
        )

        if (
            user.role ==
            user.Roles.ADMIN
        ):

            return queryset

        return queryset.filter(
            resident__user=user
        )


    # ========================================================
    # CREATE
    # Sticker request
    # ========================================================

    def perform_create(
        self,
        serializer,
    ):

        sticker = (
            serializer.save()
        )

        actor = (
            self.request.user
        )

        def notify():

            self._notify_admins_sticker_request(
                sticker,
                actor,
            )

        transaction.on_commit(
            notify
        )


    # ========================================================
    # MINE
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="mine",
    )
    def mine(
        self,
        request,
    ):

        stickers = (
            self.get_queryset()
            .filter(
                resident__user=request.user
            )
        )

        serializer = self.get_serializer(
            stickers,
            many=True,
        )

        return Response(
            serializer.data
        )


    # ========================================================
    # PENDING
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="pending",
        permission_classes=[
            IsAuthenticated,
            IsAdmin,
        ],
    )
    def pending(
        self,
        request,
    ):

        stickers = (
            MotoristSticker.objects
            .select_related(
                "property",
                "vehicle",
                "resident",
                "resident__user",
            )
            .filter(
                status=(
                    MotoristSticker.Status.PENDING
                )
            )
        )

        serializer = self.get_serializer(
            stickers,
            many=True,
        )

        return Response(
            serializer.data
        )


    # ========================================================
    # ACTIVE
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="active",
    )
    def active(
        self,
        request,
    ):

        stickers = (
            self.get_queryset()
            .filter(
                status=(
                    MotoristSticker.Status.ACTIVE
                )
            )
        )

        serializer = self.get_serializer(
            stickers,
            many=True,
        )

        return Response(
            serializer.data
        )


    # ========================================================
    # AVAILABLE SLOTS
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="available-slots",
    )
    def available_slots(
        self,
        request,
    ):

        property_id = (
            request.query_params.get(
                "property"
            )
        )

        if not property_id:

            return Response(
                {
                    "detail":
                        "property query parameter is required."
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        active_count = (
            MotoristSticker.objects
            .filter(
                property_id=property_id,
                status__in=[
                    MotoristSticker.Status.PENDING,
                    MotoristSticker.Status.ACTIVE,
                ],
            )
            .count()
        )

        return Response(
            {
                "property": property_id,
                "maximum": 3,
                "used": active_count,
                "available": max(
                    0,
                    3 - active_count,
                ),
            }
        )


    # ========================================================
    # APPROVE
    # Sticker approved → Resident notification
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="approve",
        permission_classes=[
            IsAuthenticated,
            IsAdmin,
        ],
    )
    def approve(
        self,
        request,
        pk=None,
    ):

        sticker = (
            self.get_object()
        )

        if sticker.status != (
            MotoristSticker.Status.PENDING
        ):

            return Response(
                {
                    "detail":
                        "Only pending stickers can be approved."
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )


        with transaction.atomic():

            sticker = (
                MotoristSticker.objects
                .select_for_update()
                .select_related(
                    "property",
                    "vehicle",
                    "resident",
                    "resident__user",
                )
                .get(
                    pk=sticker.pk
                )
            )


            active_count = (
                MotoristSticker.objects
                .filter(
                    property=sticker.property,
                    status__in=[
                        MotoristSticker.Status.PENDING,
                        MotoristSticker.Status.ACTIVE,
                    ],
                )
                .exclude(
                    pk=sticker.pk
                )
                .count()
            )


            if active_count >= 3:

                return Response(
                    {
                        "detail":
                            "This property has already reached the maximum of 3 motorist stickers."
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )


            sticker.status = (
                MotoristSticker.Status.ACTIVE
            )

            sticker.issued_at = (
                timezone.now()
            )

            sticker.approved_by = (
                request.user
            )

            sticker.save()


            resident_user = (
                sticker.resident.user
            )


            def notify():

                NotificationService.sticker(

                    recipient=resident_user,

                    actor=request.user,

                    title=(
                        "Motorist Sticker Approved"
                    ),

                    message=(
                        f"Your motorist sticker "
                        f"{sticker.sticker_number} "
                        f"has been approved."
                    ),

                    action_url=(
                        self._resident_sticker_url(
                            resident_user
                        )
                    ),

                    metadata={

                        "event":
                            "STICKER_APPROVED",

                        "sticker_id":
                            sticker.id,

                        "sticker_number":
                            sticker.sticker_number,

                        "vehicle_id":
                            sticker.vehicle_id,

                        "plate_number":
                            sticker.vehicle.plate_number,

                        "property_id":
                            sticker.property_id,

                    },

                    priority=(
                        Notification.Priority.SUCCESS
                    ),
                )


            transaction.on_commit(
                notify
            )


        serializer = self.get_serializer(
            sticker
        )

        return Response(
            serializer.data
        )


    # ========================================================
    # REVOKE
    # Sticker revoked → Resident notification
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="revoke",
        permission_classes=[
            IsAuthenticated,
            IsAdmin,
        ],
    )
    def revoke(
        self,
        request,
        pk=None,
    ):

        sticker = (
            self.get_object()
        )

        if sticker.status != (
            MotoristSticker.Status.ACTIVE
        ):

            return Response(
                {
                    "detail":
                        "Only active stickers can be revoked."
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )


        with transaction.atomic():

            sticker = (
                MotoristSticker.objects
                .select_for_update()
                .select_related(
                    "property",
                    "vehicle",
                    "resident",
                    "resident__user",
                )
                .get(
                    pk=sticker.pk
                )
            )


            sticker.status = (
                MotoristSticker.Status.REVOKED
            )

            sticker.revoked_at = (
                timezone.now()
            )

            sticker.save()


            resident_user = (
                sticker.resident.user
            )


            def notify():

                NotificationService.sticker(

                    recipient=resident_user,

                    actor=request.user,

                    title=(
                        "Motorist Sticker Revoked"
                    ),

                    message=(
                        f"Your motorist sticker "
                        f"{sticker.sticker_number} "
                        f"has been revoked."
                    ),

                    action_url=(
                        self._resident_sticker_url(
                            resident_user
                        )
                    ),

                    metadata={

                        "event":
                            "STICKER_REVOKED",

                        "sticker_id":
                            sticker.id,

                        "sticker_number":
                            sticker.sticker_number,

                        "vehicle_id":
                            sticker.vehicle_id,

                        "plate_number":
                            sticker.vehicle.plate_number,

                        "property_id":
                            sticker.property_id,

                    },

                    priority=(
                        Notification.Priority.WARNING
                    ),
                )


            transaction.on_commit(
                notify
            )


        serializer = self.get_serializer(
            sticker
        )

        return Response(
            serializer.data
        )


    # ========================================================
    # EXPIRE
    # Sticker expired → Resident notification
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="expire",
        permission_classes=[
            IsAuthenticated,
            IsAdmin,
        ],
    )
    def expire(
        self,
        request,
        pk=None,
    ):

        sticker = (
            self.get_object()
        )

        if sticker.status != (
            MotoristSticker.Status.ACTIVE
        ):

            return Response(
                {
                    "detail":
                        "Only active stickers can be expired."
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )


        with transaction.atomic():

            sticker = (
                MotoristSticker.objects
                .select_for_update()
                .select_related(
                    "property",
                    "vehicle",
                    "resident",
                    "resident__user",
                )
                .get(
                    pk=sticker.pk
                )
            )


            sticker.status = (
                MotoristSticker.Status.EXPIRED
            )

            sticker.save()


            resident_user = (
                sticker.resident.user
            )


            def notify():

                NotificationService.sticker(

                    recipient=resident_user,

                    actor=request.user,

                    title=(
                        "Motorist Sticker Expired"
                    ),

                    message=(
                        f"Your motorist sticker "
                        f"{sticker.sticker_number} "
                        f"has expired."
                    ),

                    action_url=(
                        self._resident_sticker_url(
                            resident_user
                        )
                    ),

                    metadata={

                        "event":
                            "STICKER_EXPIRED",

                        "sticker_id":
                            sticker.id,

                        "sticker_number":
                            sticker.sticker_number,

                        "vehicle_id":
                            sticker.vehicle_id,

                        "plate_number":
                            sticker.vehicle.plate_number,

                        "property_id":
                            sticker.property_id,

                    },

                    priority=(
                        Notification.Priority.WARNING
                    ),
                )


            transaction.on_commit(
                notify
            )


        serializer = self.get_serializer(
            sticker
        )

        return Response(
            serializer.data
        )