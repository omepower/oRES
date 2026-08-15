from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    class Roles(models.TextChoices):
        ADMIN = "ADMIN", "Administrator"
        HOMEOWNER = "HOMEOWNER", "Homeowner"
        TENANT = "TENANT", "Tenant"
        SECURITY = "SECURITY", "Security Officer"

    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.TENANT,
    )

    phone = models.CharField(
        max_length=30,
        blank=True,
    )

    profile_picture = models.ImageField(
        upload_to="profiles/",
        blank=True,
        null=True,
    )

    
    is_active_resident = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return (
            self.get_full_name()
            or self.username
        )