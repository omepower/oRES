from django.utils import timezone

from rest_framework import serializers

from .models import (
    CommunityAnnouncement,
)


class CommunityAnnouncementSerializer(
    serializers.ModelSerializer
):

    category_display = serializers.CharField(
        source="get_category_display",
        read_only=True,
    )

    priority_display = serializers.CharField(
        source="get_priority_display",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    audience_display = serializers.CharField(
        source="get_audience_display",
        read_only=True,
    )

    created_by_name = serializers.CharField(
        source="created_by.get_full_name",
        read_only=True,
    )

    is_published = serializers.BooleanField(
        read_only=True,
    )

    is_expired = serializers.BooleanField(
        read_only=True,
    )

    is_visible = serializers.BooleanField(
        read_only=True,
    )


    class Meta:

        model = CommunityAnnouncement

        fields = [
            "id",

            "title",
            "content",

            "category",
            "category_display",

            "priority",
            "priority_display",

            "audience",
            "audience_display",

            "status",
            "status_display",

            "published_at",
            "scheduled_for",
            "expires_at",

            "created_by",
            "created_by_name",

            "is_published",
            "is_expired",
            "is_visible",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",

            "category_display",
            "priority_display",
            "status_display",
            "audience_display",

            "created_by",
            "created_by_name",

            "is_published",
            "is_expired",
            "is_visible",

            "published_at",

            "created_at",
            "updated_at",
        ]


    # ========================================================
    # VALIDATION
    # ========================================================

    def validate_title(
        self,
        value,
    ):

        value = value.strip()

        if not value:

            raise serializers.ValidationError(
                "Announcement title is required."
            )

        return value


    def validate_content(
        self,
        value,
    ):

        value = value.strip()

        if not value:

            raise serializers.ValidationError(
                "Announcement content is required."
            )

        return value


    def validate(
        self,
        attrs,
    ):

        scheduled_for = attrs.get(
            "scheduled_for",
            getattr(
                self.instance,
                "scheduled_for",
                None,
            ),
        )

        expires_at = attrs.get(
            "expires_at",
            getattr(
                self.instance,
                "expires_at",
                None,
            ),
        )

        status_value = attrs.get(
            "status",
            getattr(
                self.instance,
                "status",
                CommunityAnnouncement.Status.DRAFT,
            ),
        )


        # ====================================================
        # EXPIRATION
        # ====================================================

        if (
            scheduled_for
            and expires_at
            and expires_at <= scheduled_for
        ):

            raise serializers.ValidationError(
                {
                    "expires_at":
                        "Expiration time must be later than the scheduled publication time."
                }
            )


        # ====================================================
        # STATUS
        #
        # Do not allow clients to manually set published_at.
        # Publication timestamps are controlled by the server.
        # ====================================================

        if (
            status_value ==
            CommunityAnnouncement.Status.PUBLISHED
        ):

            if (
                scheduled_for
                and scheduled_for < timezone.now()
            ):

                # This is valid.
                # The view/service will publish immediately.
                pass


        return attrs