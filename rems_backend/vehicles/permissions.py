from rest_framework.permissions import BasePermission


class IsAdminOrResident(BasePermission):

    allowed_roles = {
        "ADMIN",
        "HOMEOWNER",
        "TENANT",
    }

    def has_permission(
        self,
        request,
        view,
    ):

        user = request.user

        if not user or not user.is_authenticated:
            return False

        return (
            user.role in self.allowed_roles
            or user.is_superuser
        )


class IsAdmin(BasePermission):

    def has_permission(
        self,
        request,
        view,
    ):

        user = request.user

        return (
            user.is_authenticated
            and (
                user.role == "ADMIN"
                or user.is_superuser
            )
        )