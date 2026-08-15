from django.core.exceptions import ValidationError
from django.db import models


class Gate(models.Model):
    class GateType(models.TextChoices):
        MAIN_ENTRANCE = "MAIN_ENTRANCE", "Main Entrance"
        SECONDARY = "SECONDARY", "Secondary Gate"
        SERVICE = "SERVICE", "Service Gate"
        EMERGENCY = "EMERGENCY", "Emergency Gate"

    name = models.CharField(
        max_length=100,
    )

    gate_type = models.CharField(
        max_length=30,
        choices=GateType.choices,
        default=GateType.MAIN_ENTRANCE,
    )

    location = models.CharField(
        max_length=255,
        blank=True,
    )

    is_primary = models.BooleanField(
        default=False,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "name",
        ]

    def clean(self):
        if self.is_primary:
            existing_primary = Gate.objects.filter(
                is_primary=True,
            ).exclude(
                pk=self.pk,
            )

            if existing_primary.exists():
                raise ValidationError(
                    {
                        "is_primary": (
                            "Only one gate can be designated "
                            "as the primary gate."
                        )
                    }
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.name