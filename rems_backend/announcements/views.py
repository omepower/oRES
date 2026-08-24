from django.db.models import Q
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
    CommunityAnnouncement,
)

from .serializers import (
    CommunityAnnouncementSerializer,
)

from .services import (
    CommunityAnnouncementService,
)


class CommunityAnnouncementViewSet(
    ModelViewSet
):

    queryset = (
        CommunityAnnouncement.objects
        .select_related(
            "created_by",
        )
        .all()
    )

    serializer_class = (
        CommunityAnnouncementSerializer
    )

    permission_classes = [
        IsAuthenticated,
        IsAdminOrResident,
    ]

    search_fields = [
        "title",
        "content",
    ]

    filterset_fields = [
        "category",
        "priority",
        "status",
        "audience",
    ]

    ordering_fields = [
        "title",
        "category",
        "priority",
        "published_at",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-published_at",
        "-created_at",
    ]


    # ========================================================
    # PERMISSIONS
    # ========================================================

    def get_permissions(
        self,
    ):

        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
            "publish",
            "archive",
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
            for permission in permission_classes
        ]


    # ========================================================
    # QUERYSET VISIBILITY
    # ========================================================

    def get_queryset(
        self,
    ):

        queryset = super().get_queryset()

        user = self.request.user


        # ----------------------------------------------------
        # ADMIN
        # ----------------------------------------------------

        if user.role == user.Roles.ADMIN:

            return queryset


        # ----------------------------------------------------
        # RESIDENT
        # ----------------------------------------------------

        if user.role == user.Roles.HOMEOWNER:

            return queryset.filter(
                status=(
                    CommunityAnnouncement.Status.PUBLISHED
                ),
                audience__in=[
                    CommunityAnnouncement.Audience.ALL_RESIDENTS,
                    CommunityAnnouncement.Audience.HOMEOWNERS,
                ],
            )


        if user.role == user.Roles.TENANT:

            return queryset.filter(
                status=(
                    CommunityAnnouncement.Status.PUBLISHED
                ),
                audience__in=[
                    CommunityAnnouncement.Audience.ALL_RESIDENTS,
                    CommunityAnnouncement.Audience.TENANTS,
                ],
            )


        return queryset.none()


    # ========================================================
    # CREATE
    # ========================================================

    def perform_create(
        self,
        serializer,
    ):

        serializer.save(
            created_by=self.request.user,
        )


    # ========================================================
    # RESIDENT FEED
    #
    # GET /api/announcements/feed/
    # ========================================================

    @action(
    detail=False,
    methods=["get"],
    url_path="feed",
    )
    def feed(
        self,
        request,
    ):

        now = timezone.now()


        queryset = (
            self.get_queryset()
            .filter(
                status=(
                    CommunityAnnouncement.Status.PUBLISHED
                ),
            )
            .filter(
                (
                    Q(
                        scheduled_for__isnull=True
                    )
                    |
                    Q(
                        scheduled_for__lte=now
                    )
                )
            )
            .filter(
                (
                    Q(
                        expires_at__isnull=True
                    )
                    |
                    Q(
                        expires_at__gt=now
                    )
                )
            )
            .order_by(
                "-published_at",
                "-created_at",
            )
        )


        serializer = self.get_serializer(
            queryset,
            many=True,
        )


        return Response(
            serializer.data
        )

    # ========================================================
    # PUBLISH
    #
    # POST /api/announcements/<id>/publish/
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="publish",
        permission_classes=[
            IsAuthenticated,
            IsAdmin,
        ],
    )
    def publish(
        self,
        request,
        pk=None,
    ):

        announcement = (
            self.get_object()
        )


        if (
            announcement.status ==
            CommunityAnnouncement.Status.ARCHIVED
        ):

            return Response(
                {
                    "detail":
                        "Archived announcements cannot be published.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        if (
            announcement.status ==
            CommunityAnnouncement.Status.PUBLISHED
        ):

            return Response(
                self.get_serializer(
                    announcement
                ).data
            )


        # ----------------------------------------------------
        # Prevent accidental early publication of scheduled
        # announcements.
        # ----------------------------------------------------

        if (
            announcement.scheduled_for
            and
            announcement.scheduled_for >
            timezone.now()
        ):

            return Response(
                {
                    "detail":
                        "This announcement is scheduled for a future date and cannot be published yet.",
                    "scheduled_for":
                        announcement.scheduled_for,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        announcement = (
            CommunityAnnouncementService.publish(
                announcement=announcement,
                actor=request.user,
            )
        )


        return Response(
            self.get_serializer(
                announcement
            ).data
        )


    # ========================================================
    # ARCHIVE
    #
    # POST /api/announcements/<id>/archive/
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="archive",
        permission_classes=[
            IsAuthenticated,
            IsAdmin,
        ],
    )
    def archive(
        self,
        request,
        pk=None,
    ):

        announcement = (
            self.get_object()
        )


        if (
            announcement.status ==
            CommunityAnnouncement.Status.ARCHIVED
        ):

            return Response(
                self.get_serializer(
                    announcement
                ).data
            )


        announcement = (
            CommunityAnnouncementService.archive(
                announcement
            )
        )


        return Response(
            self.get_serializer(
                announcement
            ).data
        )


    # ========================================================
    # ADMIN ONLY LIST
    #
    # GET /api/announcements/admin/
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="admin",
        permission_classes=[
            IsAuthenticated,
            IsAdmin,
        ],
    )
    def admin_list(
        self,
        request,
    ):

        queryset = (
            CommunityAnnouncement.objects
            .select_related(
                "created_by",
            )
            .all()
            .order_by(
                "-created_at",
            )
        )


        serializer = self.get_serializer(
            queryset,
            many=True,
        )


        return Response(
            serializer.data
        )