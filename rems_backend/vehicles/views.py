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

    def get_queryset(
        self
    ):

        queryset = super().get_queryset()

        user = self.request.user

        if user.role == user.Roles.ADMIN:

            return queryset

        return queryset.filter(
            resident__user=user
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

        sticker = self.get_object()

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

        serializer = self.get_serializer(
            sticker
        )

        return Response(
            serializer.data
        )

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

        sticker = self.get_object()

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

        sticker.status = (
            MotoristSticker.Status.REVOKED
        )

        sticker.revoked_at = (
            timezone.now()
        )

        sticker.save()

        serializer = self.get_serializer(
            sticker
        )

        return Response(
            serializer.data
        )

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

        sticker = self.get_object()

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

        sticker.status = (
            MotoristSticker.Status.EXPIRED
        )

        sticker.save()

        serializer = self.get_serializer(
            sticker
        )

        return Response(
            serializer.data
        )