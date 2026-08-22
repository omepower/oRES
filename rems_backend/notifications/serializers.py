from rest_framework import serializers

from .models import Notification


class NotificationSerializer(
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

    actor_name = serializers.CharField(
        source="actor.get_full_name",
        read_only=True,
    )


    class Meta:

        model = Notification

        fields = [

            "id",

            "title",
            "message",

            "category",
            "category_display",

            "priority",
            "priority_display",

            "action_url",

            "metadata",

            "is_read",
            "read_at",

            "actor",
            "actor_name",

            "created_at",
            "updated_at",

        ]


        read_only_fields = [

            "id",

            "category_display",
            "priority_display",

            "actor_name",

            "is_read",
            "read_at",

            "created_at",
            "updated_at",

        ]