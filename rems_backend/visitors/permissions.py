from rest_framework.permissions import BasePermission


class IsAdminOrResident(BasePermission):
    """
    Allows ADMIN, HOMEOWNER, and TENANT users.
    """

    allowed_roles = {
        "ADMIN",
        "HOMEOWNER",
        "TENANT",
    }

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return user.role in self.allowed_roles


class IsAdmin(BasePermission):
    """
    Allows administrators only.
    """

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return (
            user.role == "ADMIN"
            or user.is_superuser
        )