import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class AuditEvent(models.Model):
    class ActorRole(models.TextChoices):
        ADMIN = "ADMIN", "Administrator"
        SECURITY = "SECURITY", "Security"
        RESIDENT = "RESIDENT", "Resident"
        SYSTEM = "SYSTEM", "System"

    class Module(models.TextChoices):
        ACCOUNTS = "ACCOUNTS", "Accounts"
        RESIDENTS = "RESIDENTS", "Residents"
        PROPERTIES = "PROPERTIES", "Properties"
        VISITORS = "VISITORS", "Visitors"
        VEHICLES = "VEHICLES", "Vehicles"
        SECURITY = "SECURITY", "Security"
        FACILITIES = "FACILITIES", "Facilities"
        ANNOUNCEMENTS = "ANNOUNCEMENTS", "Announcements"
        NOTIFICATIONS = "NOTIFICATIONS", "Notifications"
        AUDIT = "AUDIT", "Audit"
        SYSTEM = "SYSTEM", "System"

    class Action(models.TextChoices):
        CREATE = "CREATE", "Create"
        VIEW = "VIEW", "View"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"
        APPROVE = "APPROVE", "Approve"
        REJECT = "REJECT", "Reject"
        VERIFY = "VERIFY", "Verify"
        CANCEL = "CANCEL", "Cancel"
        LOGIN = "LOGIN", "Login"
        LOGOUT = "LOGOUT", "Logout"
        CHECK_IN = "CHECK_IN", "Check In"
        CHECK_OUT = "CHECK_OUT", "Check Out"
        REFUND = "REFUND", "Refund"
        CLEARANCE = "CLEARANCE", "Clearance"
        INSPECT = "INSPECT", "Inspect"
        EXPIRE = "EXPIRE", "Expire"
        EXPORT = "EXPORT", "Export"
        PASSWORD_CHANGE = "PASSWORD_CHANGE", "Password Change"
        ROLE_CHANGE = "ROLE_CHANGE", "Role Change"
        PERMISSION_CHANGE = "PERMISSION_CHANGE", "Permission Change"
        OTHER = "OTHER", "Other"

    class Result(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"
        DENIED = "DENIED", "Denied"

    class Severity(models.TextChoices):
        INFO = "INFO", "Info"
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    id = models.BigAutoField(primary_key=True)
    event_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_events",
    )
    actor_role = models.CharField(max_length=30, choices=ActorRole.choices, default=ActorRole.SYSTEM, db_index=True)
    module = models.CharField(max_length=40, choices=Module.choices, db_index=True)
    action = models.CharField(max_length=40, choices=Action.choices, db_index=True)
    event_type = models.CharField(max_length=100, db_index=True)
    object_type = models.CharField(max_length=100, blank=True, default="", db_index=True)
    object_id = models.CharField(max_length=100, blank=True, default="", db_index=True)
    description = models.TextField()
    result = models.CharField(max_length=20, choices=Result.choices, default=Result.SUCCESS, db_index=True)
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.INFO, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    request_method = models.CharField(max_length=10, blank=True, default="", db_index=True)
    request_path = models.TextField(blank=True, default="")
    before_data = models.JSONField(null=True, blank=True)
    after_data = models.JSONField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp", "-id"]
        indexes = [
            models.Index(fields=["module", "action", "-timestamp"], name="audit_event_module_action_ts"),
            models.Index(fields=["actor", "-timestamp"], name="audit_event_actor_ts"),
            models.Index(fields=["severity", "-timestamp"], name="audit_event_severity_ts"),
            models.Index(fields=["result", "-timestamp"], name="audit_event_result_ts"),
            models.Index(fields=["object_type", "object_id"], name="audit_event_object_idx"),
        ]

    def clean(self):
        if not str(self.description or "").strip():
            raise ValidationError({"description": "Audit event description is required."})
        if not str(self.event_type or "").strip():
            raise ValidationError({"event_type": "Audit event type is required."})

    def __str__(self):
        return f"{self.event_type} · {self.event_id}"
