from django.conf import settings
from django.db import models
from django.utils import timezone


class CommunityAnnouncement(models.Model):

    # ========================================================
    # CATEGORY
    # ========================================================

    class Category(models.TextChoices):

        GENERAL = (
            "GENERAL",
            "General",
        )

        NOTICE = (
            "NOTICE",
            "Notice",
        )

        MAINTENANCE = (
            "MAINTENANCE",
            "Maintenance",
        )

        COMMUNITY_EVENT = (
            "COMMUNITY_EVENT",
            "Community Event",
        )

        POLICY = (
            "POLICY",
            "Policy",
        )

        SECURITY = (
            "SECURITY",
            "Security",
        )


    # ========================================================
    # PRIORITY
    # ========================================================

    class Priority(models.TextChoices):

        INFO = (
            "INFO",
            "Information",
        )

        IMPORTANT = (
            "IMPORTANT",
            "Important",
        )

        URGENT = (
            "URGENT",
            "Urgent",
        )


    # ========================================================
    # STATUS
    # ========================================================

    class Status(models.TextChoices):

        DRAFT = (
            "DRAFT",
            "Draft",
        )

        PUBLISHED = (
            "PUBLISHED",
            "Published",
        )

        ARCHIVED = (
            "ARCHIVED",
            "Archived",
        )


    # ========================================================
    # AUDIENCE
    # ========================================================

    class Audience(models.TextChoices):

        ALL_RESIDENTS = (
            "ALL_RESIDENTS",
            "All Residents",
        )

        HOMEOWNERS = (
            "HOMEOWNERS",
            "Homeowners",
        )

        TENANTS = (
            "TENANTS",
            "Tenants",
        )


    # ========================================================
    # CONTENT
    # ========================================================

    title = models.CharField(
        max_length=200,
    )

    content = models.TextField()


    # ========================================================
    # CLASSIFICATION
    # ========================================================

    category = models.CharField(
        max_length=30,
        choices=Category.choices,
        default=Category.GENERAL,
    )

    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.INFO,
    )


    # ========================================================
    # AUDIENCE
    # ========================================================

    audience = models.CharField(
        max_length=30,
        choices=Audience.choices,
        default=Audience.ALL_RESIDENTS,
    )


    # ========================================================
    # PUBLICATION LIFECYCLE
    # ========================================================

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )

    published_at = models.DateTimeField(
        blank=True,
        null=True,
        db_index=True,
    )

    scheduled_for = models.DateTimeField(
        blank=True,
        null=True,
        db_index=True,
    )

    expires_at = models.DateTimeField(
        blank=True,
        null=True,
        db_index=True,
    )


    # ========================================================
    # CREATOR
    # ========================================================

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="community_announcements_created",
    )


    # ========================================================
    # TIMESTAMPS
    # ========================================================

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )


    class Meta:

        ordering = [
            "-published_at",
            "-created_at",
        ]

        indexes = [

            models.Index(
                fields=[
                    "status",
                    "-published_at",
                ]
            ),

            models.Index(
                fields=[
                    "audience",
                    "status",
                    "-published_at",
                ]
            ),

            models.Index(
                fields=[
                    "category",
                    "status",
                    "-published_at",
                ]
            ),

        ]


    # ========================================================
    # PUBLICATION HELPERS
    # ========================================================

    @property
    def is_published(self):

        return (
            self.status ==
            self.Status.PUBLISHED
        )


    @property
    def is_expired(self):

        if not self.expires_at:

            return False

        return (
            timezone.now()
            >= self.expires_at
        )


    @property
    def is_visible(self):

        if (
            self.status !=
            self.Status.PUBLISHED
        ):

            return False

        if (
            self.scheduled_for
            and timezone.now()
                < self.scheduled_for
        ):

            return False

        if self.is_expired:

            return False

        return True


    # ========================================================
    # PUBLISH
    # ========================================================

    def publish(self):

        self.status = (
            self.Status.PUBLISHED
        )

        if not self.published_at:

            self.published_at = (
                timezone.now()
            )

        self.save(
            update_fields=[
                "status",
                "published_at",
                "updated_at",
            ]
        )


    # ========================================================
    # ARCHIVE
    # ========================================================

    def archive(self):

        self.status = (
            self.Status.ARCHIVED
        )

        self.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )


    # ========================================================
    # STRING REPRESENTATION
    # ========================================================

    def __str__(self):

        return self.title