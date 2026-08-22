from django.conf import settings
from django.db import models
from django.utils import timezone


class Notification(models.Model):

    class Category(models.TextChoices):

        SYSTEM = (
            "SYSTEM",
            "System",
        )

        ACCOUNT = (
            "ACCOUNT",
            "Account",
        )

        PROPERTY = (
            "PROPERTY",
            "Property",
        )

        VISITOR = (
            "VISITOR",
            "Visitor",
        )

        VEHICLE = (
            "VEHICLE",
            "Vehicle",
        )

        STICKER = (
            "STICKER",
            "Motorist Sticker",
        )

        SECURITY = (
            "SECURITY",
            "Security",
        )


    class Priority(models.TextChoices):

        INFO = (
            "INFO",
            "Information",
        )

        SUCCESS = (
            "SUCCESS",
            "Success",
        )

        WARNING = (
            "WARNING",
            "Warning",
        )

        DANGER = (
            "DANGER",
            "Danger",
        )


    # ========================================================
    # RECIPIENT
    # ========================================================

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )


    # ========================================================
    # OPTIONAL ACTOR
    # ========================================================

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="generated_notifications",
        blank=True,
        null=True,
    )


    # ========================================================
    # CONTENT
    # ========================================================

    title = models.CharField(
        max_length=180,
    )

    message = models.TextField()


    # ========================================================
    # CLASSIFICATION
    # ========================================================

    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.SYSTEM,
    )

    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.INFO,
    )


    # ========================================================
    # OPTIONAL FRONTEND ROUTE
    # ========================================================

    action_url = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )


    # ========================================================
    # OPTIONAL STRUCTURED DATA
    # ========================================================

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )


    # ========================================================
    # READ STATE
    # ========================================================

    is_read = models.BooleanField(
        default=False,
        db_index=True,
    )

    read_at = models.DateTimeField(
        blank=True,
        null=True,
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
            "-created_at",
        ]

        indexes = [

            models.Index(
                fields=[
                    "recipient",
                    "is_read",
                    "-created_at",
                ]
            ),

            models.Index(
                fields=[
                    "recipient",
                    "-created_at",
                ]
            ),

        ]


    def mark_as_read(self):

        if self.is_read:
            return

        self.is_read = True

        self.read_at = timezone.now()

        self.save(
            update_fields=[
                "is_read",
                "read_at",
                "updated_at",
            ]
        )


    def __str__(self):

        return (
            f"{self.recipient} - "
            f"{self.title}"
        )