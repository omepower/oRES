from rest_framework import serializers

from .models import AuditEvent


class AuditEventSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    actor_username = serializers.SerializerMethodField()
    actor_display = serializers.SerializerMethodField()
    module_display = serializers.CharField(source="get_module_display", read_only=True)
    action_display = serializers.CharField(source="get_action_display", read_only=True)
    result_display = serializers.CharField(source="get_result_display", read_only=True)
    severity_display = serializers.CharField(source="get_severity_display", read_only=True)

    class Meta:
        model = AuditEvent
        fields = [
            "id", "event_id", "timestamp", "actor", "actor_name", "actor_username", "actor_display",
            "actor_role", "module", "module_display", "action", "action_display", "event_type",
            "object_type", "object_id", "description", "result", "result_display", "severity",
            "severity_display", "ip_address", "user_agent", "request_method", "request_path",
            "before_data", "after_data", "metadata", "created_at",
        ]
        read_only_fields = fields

    def get_actor_name(self, obj):
        if not obj.actor:
            return "System"
        full_name = getattr(obj.actor, "full_name", None)
        if full_name:
            return full_name
        name = (
            f"{getattr(obj.actor, 'first_name', '')} "
            f"{getattr(obj.actor, 'last_name', '')}"
        ).strip()
        return name or str(obj.actor)

    def get_actor_username(self, obj):
        return getattr(obj.actor, "username", None) if obj.actor else None

    def get_actor_display(self, obj):
        return self.get_actor_name(obj) if obj.actor else "SYSTEM"