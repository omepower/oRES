from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import AuditEvent
from .services import AuditService


class AuditServiceTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="audit_test_admin", password="test-password")
        if hasattr(self.user, "role"):
            self.user.role = "ADMIN"
            self.user.save(update_fields=["role"])

    def test_records_event(self):
        event = AuditService.success(
            module=AuditEvent.Module.FACILITIES,
            action=AuditEvent.Action.APPROVE,
            event_type="BOOKING_APPROVED",
            description="Facility booking approved.",
            user=self.user,
            object_type="Booking",
            object_id="1",
            before_data={"status": "PENDING"},
            after_data={"status": "APPROVED"},
        )
        self.assertEqual(AuditEvent.objects.count(), 1)
        self.assertEqual(event.result, AuditEvent.Result.SUCCESS)


class AuditApiTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="audit_api_admin", password="test-password")
        if hasattr(self.user, "role"):
            self.user.role = "ADMIN"
            self.user.save(update_fields=["role"])
        AuditService.system(
            module=AuditEvent.Module.SYSTEM,
            action=AuditEvent.Action.EXPIRE,
            event_type="BOOKING_EXPIRED",
            description="System expiration test event.",
            object_type="Booking",
            object_id="1",
        )
        self.client = APIClient()

    def test_requires_authentication(self):
        response = self.client.get("/api/audit/audit/events/")
        self.assertEqual(response.status_code, 401)
