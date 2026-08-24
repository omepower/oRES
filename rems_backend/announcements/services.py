from django.db import transaction
from django.utils import timezone

from notifications.models import Notification

from notifications.services import (
    NotificationService,
)

from .models import (
    CommunityAnnouncement,
)


class CommunityAnnouncementService:

    # ========================================================
    # AUDIENCE
    # ========================================================

    @staticmethod
    def get_recipients(
        announcement,
    ):

        from accounts.models import User


        users = (
            User.objects
            .filter(
                is_active=True,
            )
        )


        if (
            announcement.audience
            ==
            CommunityAnnouncement.Audience.HOMEOWNERS
        ):

            return users.filter(
                role=User.Roles.HOMEOWNER,
            )


        if (
            announcement.audience
            ==
            CommunityAnnouncement.Audience.TENANTS
        ):

            return users.filter(
                role=User.Roles.TENANT,
            )


        return users.filter(
            role__in=[
                User.Roles.HOMEOWNER,
                User.Roles.TENANT,
            ]
        )


    # ========================================================
    # ACTION URL
    # ========================================================

    @staticmethod
    def get_action_url(
        recipient,
        announcement_id,
    ):

        role = str(
            getattr(
                recipient,
                "role",
                "",
            )
        ).strip().upper()


        if role == "TENANT":

            return (
                f"/tenant/announcements/"
                f"{announcement_id}"
            )


        return (
            f"/homeowner/announcements/"
            f"{announcement_id}"
        )


    # ========================================================
    # NOTIFICATION PRIORITY
    # ========================================================

    @staticmethod
    def get_notification_priority(
        announcement,
    ):

        if (
            announcement.priority
            ==
            CommunityAnnouncement.Priority.URGENT
        ):

            return Notification.Priority.DANGER


        if (
            announcement.priority
            ==
            CommunityAnnouncement.Priority.IMPORTANT
        ):

            return Notification.Priority.WARNING


        return Notification.Priority.INFO


    # ========================================================
    # PUBLISH
    # ========================================================

    @staticmethod
    def publish(
        announcement,
        actor=None,
    ):

        if (
            announcement.status
            ==
            CommunityAnnouncement.Status.PUBLISHED
        ):

            return announcement


        announcement.status = (
            CommunityAnnouncement.Status.PUBLISHED
        )


        if not announcement.published_at:

            announcement.published_at = (
                timezone.now()
            )


        announcement.save(
            update_fields=[
                "status",
                "published_at",
                "updated_at",
            ]
        )


        recipients = (
            CommunityAnnouncementService
            .get_recipients(
                announcement
            )
        )


        notification_priority = (
            CommunityAnnouncementService
            .get_notification_priority(
                announcement
            )
        )


        def create_notifications():

            for recipient in recipients:

                NotificationService.property(

                    recipient=recipient,

                    actor=actor,

                    title=(
                        "New Community Announcement"
                    ),

                    message=(
                        announcement.title
                    ),

                    action_url=(
                        CommunityAnnouncementService
                        .get_action_url(
                            recipient,
                            announcement.id,
                        )
                    ),

                    metadata={

                        "event":
                            "COMMUNITY_ANNOUNCEMENT_PUBLISHED",

                        "announcement_id":
                            announcement.id,

                        "category":
                            announcement.category,

                        "priority":
                            announcement.priority,

                        "audience":
                            announcement.audience,
                    },

                    priority=(
                        notification_priority
                    ),
                )


        transaction.on_commit(
            create_notifications
        )


        return announcement


    # ========================================================
    # ARCHIVE
    # ========================================================

    @staticmethod
    def archive(
        announcement,
    ):

        announcement.status = (
            CommunityAnnouncement.Status.ARCHIVED
        )


        announcement.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )


        return announcement