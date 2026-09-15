from rest_framework.permissions import BasePermission


class IsAuditAdministrator(BasePermission):
    message = "Only authorized administrators may access the oRES Audit & Compliance Center."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "is_superuser", False):
            return True
        role = str(getattr(user, "role", "") or "").upper()
        return role == "ADMIN"
