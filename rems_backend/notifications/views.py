from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(
    ModelViewSet
):

    serializer_class = NotificationSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    http_method_names = [
        "get",
        "post",
        "patch",
        "delete",
        "head",
        "options",
    ]


    def get_queryset(
        self,
    ):

        return (
            Notification.objects
            .filter(
                recipient=self.request.user,
            )
            .select_related(
                "actor",
            )
            .order_by(
                "-created_at",
            )
        )


    # ========================================================
    # UNREAD COUNT
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="unread-count",
    )
    def unread_count(
        self,
        request,
    ):

        count = (
            self.get_queryset()
            .filter(
                is_read=False,
            )
            .count()
        )

        return Response(
            {
                "count": count,
            }
        )


    # ========================================================
    # UNREAD
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="unread",
    )
    def unread(
        self,
        request,
    ):

        queryset = (
            self.get_queryset()
            .filter(
                is_read=False,
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
    # MARK ONE READ
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="mark-read",
    )
    def mark_read(
        self,
        request,
        pk=None,
    ):

        notification = (
            self.get_object()
        )

        notification.mark_as_read()

        return Response(
            self.get_serializer(
                notification
            ).data
        )


    # ========================================================
    # MARK ALL READ
    # ========================================================

    @action(
        detail=False,
        methods=["post"],
        url_path="mark-all-read",
    )
    def mark_all_read(
        self,
        request,
    ):

        now = timezone.now()

        updated = (
            self.get_queryset()
            .filter(
                is_read=False,
            )
            .update(
                is_read=True,
                read_at=now,
                updated_at=now,
            )
        )

        return Response(
            {
                "success": True,
                "updated": updated,
            }
        )


    # ========================================================
    # DELETE
    # ========================================================

    def destroy(
        self,
        request,
        *args,
        **kwargs,
    ):

        notification = (
            self.get_object()
        )

        notification.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )