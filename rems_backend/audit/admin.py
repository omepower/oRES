from django.contrib import admin

from .models import AuditEvent


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = (
        "event_id", "timestamp", "actor_display", "actor_role", "module",
        "action", "event_type", "result", "severity",
    )
    list_filter = ("module", "action", "event_type", "actor_role", "result", "severity")
    search_fields = (
        "event_id", "description", "object_type", "object_id",
        "actor__username", "actor__first_name", "actor__last_name",
    )
    readonly_fields = (
        "event_id", "timestamp", "actor", "actor_role", "module", "action", "event_type",
        "object_type", "object_id", "description", "result", "severity", "ip_address",
        "user_agent", "before_data", "after_data", "metadata", "created_at",
    )
    ordering = ("-timestamp", "-id")
    list_per_page = 50

    @admin.display(description="Actor")
    def actor_display(self, obj):
        if not obj.actor:
            return "SYSTEM"
        return getattr(obj.actor, "full_name", None) or getattr(obj.actor, "username", None) or f"User #{obj.actor_id}"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
