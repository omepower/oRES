from __future__ import annotations

from typing import Any, Optional

from django.db import transaction

from .models import AuditEvent


class AuditService:
    """Central audit-event writer for meaningful oRES business actions."""

    @staticmethod
    def _role_from_user(user) -> str:
        if not user or not getattr(user, "is_authenticated", False):
            return AuditEvent.ActorRole.SYSTEM
        role = str(getattr(user, "role", "") or "").upper()
        if role in {
            AuditEvent.ActorRole.ADMIN,
            AuditEvent.ActorRole.SECURITY,
            AuditEvent.ActorRole.RESIDENT,
        }:
            return role
        if role in {"HOMEOWNER", "TENANT"}:
            return AuditEvent.ActorRole.RESIDENT
        return AuditEvent.ActorRole.SYSTEM

    @staticmethod
    def _request_ip(request) -> Optional[str]:
        if not request:
            return None
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if forwarded:
            return forwarded.split(",")[0].strip() or None
        return request.META.get("REMOTE_ADDR")

    @classmethod
    @transaction.atomic
    def record(
        cls,
        *,
        module: str,
        action: str,
        event_type: str,
        description: str,
        user=None,
        request=None,
        object_type: str = "",
        object_id: Any = "",
        result: str = AuditEvent.Result.SUCCESS,
        severity: str = AuditEvent.Severity.INFO,
        actor_role: Optional[str] = None,
        before_data: Any = None,
        after_data: Any = None,
        metadata: Optional[dict] = None,
    ) -> AuditEvent:
        is_authenticated = bool(getattr(user, "is_authenticated", False))
        event = AuditEvent.objects.create(
            actor=user if is_authenticated else None,
            actor_role=actor_role or cls._role_from_user(user),
            module=module,
            action=action,
            event_type=str(event_type).strip(),
            object_type=str(object_type or ""),
            object_id=str(object_id or ""),
            description=str(description or "").strip(),
            result=result,
            severity=severity,
            ip_address=cls._request_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", "") if request else "",
            request_method=getattr(request, "method", "") if request else "",
            request_path=getattr(request, "path", "") if request else "",
            before_data=before_data,
            after_data=after_data,
            metadata=metadata or {},
        )
        return event

    @classmethod
    def success(cls, **kwargs):
        kwargs["result"] = AuditEvent.Result.SUCCESS
        return cls.record(**kwargs)

    @classmethod
    def failed(cls, **kwargs):
        kwargs["result"] = AuditEvent.Result.FAILED
        kwargs.setdefault("severity", AuditEvent.Severity.MEDIUM)
        return cls.record(**kwargs)

    @classmethod
    def denied(cls, **kwargs):
        kwargs["result"] = AuditEvent.Result.DENIED
        kwargs.setdefault("severity", AuditEvent.Severity.HIGH)
        return cls.record(**kwargs)

    @classmethod
    def system(cls, **kwargs):
        kwargs["actor_role"] = AuditEvent.ActorRole.SYSTEM
        kwargs["user"] = None
        return cls.record(**kwargs)
