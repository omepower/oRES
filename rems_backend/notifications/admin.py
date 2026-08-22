from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(
    admin.ModelAdmin
):

    list_display = [

        "id",
        "recipient",
        "title",
        "category",
        "priority",
        "is_read",
        "created_at",

    ]

    list_filter = [

        "category",
        "priority",
        "is_read",
        "created_at",

    ]

    search_fields = [

        "recipient__username",
        "recipient__first_name",
        "recipient__last_name",
        "title",
        "message",

    ]

    ordering = [
        "-created_at",
    ]