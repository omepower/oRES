from django.db.models import Count, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .filters import AuditEventFilter
from .models import AuditEvent
from .pagination import AuditPagination
from .permissions import IsAuditAdministrator
from .serializers import AuditEventSerializer


class AuditEventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditEvent.objects.select_related("actor").all()
    serializer_class = AuditEventSerializer
    permission_classes = [IsAuthenticated, IsAuditAdministrator]
    
    # Enabled DjangoFilterBackend, SearchFilter, and OrderingFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = AuditEventFilter
    pagination_class = AuditPagination

    search_fields = [
        "event_id",
        "description",
        "event_type",
        "object_type",
        "object_id",
        "actor__username",
        "actor__first_name",
        "actor__last_name",
    ]
    ordering_fields = [
        "timestamp",
        "created_at",
        "severity",
        "module",
        "action",
        "event_type",
    ]
    ordering = ["-timestamp", "-id"]

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """
        Calculates KPI counts across ALL database records, completely 
        independent of pagination and active list filters.
        """
        # Query full database table without filters
        total_qs = AuditEvent.objects.all()
        today = timezone.localdate()

        module_labels = dict(AuditEvent.Module.choices)
        action_labels = dict(AuditEvent.Action.choices)

        # Global aggregations across entire database
        total_events = total_qs.count()
        today_events = total_qs.filter(timestamp__date=today).count()
        
        # Severity Counts
        critical_events = total_qs.filter(
            severity__iexact=getattr(AuditEvent.Severity, "CRITICAL", "CRITICAL")
        ).count()
        high_events = total_qs.filter(
            severity__iexact=getattr(AuditEvent.Severity, "HIGH", "HIGH")
        ).count()

        # Outcome Counts
        failed_events = total_qs.filter(
            Q(result__iexact=getattr(AuditEvent.Result, "FAILED", "FAILED")) |
            Q(result__iexact=getattr(AuditEvent.Result, "DENIED", "DENIED")) |
            Q(action__icontains="FAIL") |
            Q(action__icontains="REJECT")
        ).count()

        successful_events = total_qs.filter(
            Q(result__iexact=getattr(AuditEvent.Result, "SUCCESS", "SUCCESS")) |
            Q(result__iexact=getattr(AuditEvent.Result, "SUCCESSFUL", "SUCCESSFUL")) |
            Q(result__iexact=getattr(AuditEvent.Result, "OK", "OK"))
        ).count()

        # Distinct Entity Counts across DB
        unique_users = total_qs.values("actor_id").distinct().count()
        unique_models = total_qs.values("module").distinct().count()

        by_module = [
            {
                "module": row["module"],
                "label": module_labels.get(row["module"], row["module"]),
                "total": row["total"],
            }
            for row in total_qs.values("module")
            .annotate(total=Count("id"))
            .order_by("-total")
        ]

        by_action = [
            {
                "action": row["action"],
                "label": action_labels.get(row["action"], row["action"]),
                "total": row["total"],
            }
            for row in total_qs.values("action")
            .annotate(total=Count("id"))
            .order_by("-total")
        ]

        return Response({
            "total_events": total_events,
            "today_events": today_events,
            "critical_events": critical_events,
            "high_events": high_events,
            "failed_events": failed_events,
            "successful_events": successful_events,
            "unique_users": unique_users,
            "unique_models": unique_models,
            "integrity_status": "NORMAL",
            "failed_actions": failed_events,
            "denied_actions": total_qs.filter(result=getattr(AuditEvent.Result, "DENIED", "DENIED")).count(),
            "security_events": total_qs.filter(module=getattr(AuditEvent.Module, "SECURITY", "SECURITY")).count(),
            "data_access_events": total_qs.filter(action=getattr(AuditEvent.Action, "VIEW", "VIEW")).count(),
            "by_module": by_module,
            "by_action": by_action,
        })

    @action(detail=False, methods=["get"], url_path="recent")
    def recent(self, request):
        try:
            limit = max(1, min(int(request.query_params.get("limit", 10)), 100))
        except (TypeError, ValueError):
            limit = 10
        queryset = self.get_queryset()[:limit]
        return Response(self.get_serializer(queryset, many=True).data)