from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import (
    IsAdmin,
    IsAdminOrResident,
)

from .models import Resident

from .serializers import ResidentSerializer


class ResidentViewSet(ModelViewSet):

    queryset = Resident.objects.select_related(
        "user",
    ).all()

    serializer_class = ResidentSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    search_fields = [
        "first_name",
        "middle_name",
        "last_name",
        "phone",
        "email",
        "address",
        "user__username",
        "user__email",
    ]

    filterset_fields = [
        "resident_type",
        "is_active",
        "user__role",
    ]

    ordering_fields = [
        "first_name",
        "last_name",
        "resident_type",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "last_name",
        "first_name",
    ]

    def get_queryset(self):

        queryset = super().get_queryset()

        user = self.request.user

        if user.role == user.Roles.ADMIN:
            return queryset

        return queryset.filter(
            user=user
        )

    def get_permissions(self):

        if self.action in [
            "list",
            "create",
            "destroy",
        ]:
            permission_classes = [
                IsAuthenticated,
                IsAdmin,
            ]

        elif self.action in [
            "homeowners",
            "tenants",
        ]:
            permission_classes = [
                IsAuthenticated,
                IsAdmin,
            ]

        else:
            permission_classes = [
                IsAuthenticated,
                IsAdminOrResident,
            ]

        return [
            permission()
            for permission
            in permission_classes
        ]

    @action(
        detail=False,
        methods=["get"],
        url_path="me",
    )
    def me(
        self,
        request,
    ):

        try:
            resident = (
                Resident.objects
                .select_related("user")
                .get(
                    user=request.user
                )
            )

        except Resident.DoesNotExist:

            return Response(
                {
                    "detail":
                        "No resident profile is associated with this account."
                },
                status=(
                    status.HTTP_404_NOT_FOUND
                ),
            )

        serializer = self.get_serializer(
            resident
        )

        return Response(
            serializer.data
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="homeowners",
        permission_classes=[
            IsAuthenticated,
            IsAdmin,
        ],
    )
    def homeowners(
        self,
        request,
    ):

        residents = self.get_queryset().filter(
            resident_type=(
                Resident.ResidentType.HOMEOWNER
            )
        )

        serializer = self.get_serializer(
            residents,
            many=True,
        )

        return Response(
            serializer.data
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="tenants",
        permission_classes=[
            IsAuthenticated,
            IsAdmin,
        ],
    )
    def tenants(
        self,
        request,
    ):

        residents = self.get_queryset().filter(
            resident_type=(
                Resident.ResidentType.TENANT
            )
        )

        serializer = self.get_serializer(
            residents,
            many=True,
        )

        return Response(
            serializer.data
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="active",
        permission_classes=[
            IsAuthenticated,
            IsAdmin,
        ],
    )
    def active(
        self,
        request,
    ):

        residents = self.get_queryset().filter(
            is_active=True
        )

        serializer = self.get_serializer(
            residents,
            many=True,
        )

        return Response(
            serializer.data
        )