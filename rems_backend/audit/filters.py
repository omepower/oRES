import django_filters

from .models import AuditEvent


class AuditEventFilter(django_filters.FilterSet):
    timestamp_after = django_filters.IsoDateTimeFilter(field_name="timestamp", lookup_expr="gte")
    timestamp_before = django_filters.IsoDateTimeFilter(field_name="timestamp", lookup_expr="lte")

    class Meta:
        model = AuditEvent
        fields = [
            "module",
            "action",
            "event_type",
            "actor_role",
            "result",
            "severity",
            "object_type",
            "object_id",
        ]
