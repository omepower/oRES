
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Allows access only to authenticated
    administration users.
    """

    message = (
        "Administration access is required."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            == request.user.Roles.ADMIN
        )


class IsResident(BasePermission):
    """
    Allows access to authenticated
    homeowners and tenants.
    """

    message = (
        "Homeowner or tenant access is required."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if not (
            request.user
            and request.user.is_authenticated
        ):
            return False

        return request.user.role in [
            request.user.Roles.HOMEOWNER,
            request.user.Roles.TENANT,
        ]


class IsAdminOrResident(BasePermission):
    """
    Allows access to authenticated
    administrators, homeowners, and tenants.
    """

    message = (
        "Authenticated administration or "
        "resident access is required."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if not (
            request.user
            and request.user.is_authenticated
        ):
            return False

        return request.user.role in [
            request.user.Roles.ADMIN,
            request.user.Roles.HOMEOWNER,
            request.user.Roles.TENANT,
        ]


class IsAdminOrSecurity(BasePermission):
    """
    Allows access to authenticated
    administrators and security officers.
    """

    message = (
        "Administration or security access is required."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        if not (
            request.user
            and request.user.is_authenticated
        ):
            return False

        return request.user.role in [
            request.user.Roles.ADMIN,
            request.user.Roles.SECURITY,
        ]


class IsSecurity(BasePermission):
    """
    Allows access only to authenticated
    security officers.
    """

    message = (
        "Security officer access is required."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            == request.user.Roles.SECURITY
        )


class IsHomeowner(BasePermission):
    """
    Allows access only to homeowners.
    """

    message = (
        "Homeowner access is required."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            == request.user.Roles.HOMEOWNER
        )


class IsTenant(BasePermission):
    """
    Allows access only to tenants.
    """

    message = (
        "Tenant access is required."
    )

    def has_permission(
        self,
        request,
        view,
    ):

        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            == request.user.Roles.TENANT
        )




# from rest_framework.permissions import BasePermission


# class IsAdmin(BasePermission):
#     """
#     Allows access only to authenticated
#     administration users.
#     """

#     message = (
#         "Administration access is required."
#     )

#     def has_permission(
#         self,
#         request,
#         view,
#     ):

#         return bool(
#             request.user
#             and request.user.is_authenticated
#             and request.user.role
#             == request.user.Roles.ADMIN
#         )


# class IsResident(BasePermission):
#     """
#     Allows access to authenticated
#     homeowners and tenants.
#     """

#     message = (
#         "Homeowner or tenant access is required."
#     )

#     def has_permission(
#         self,
#         request,
#         view,
#     ):

#         if not (
#             request.user
#             and request.user.is_authenticated
#         ):
#             return False

#         return request.user.role in [
#             request.user.Roles.HOMEOWNER,
#             request.user.Roles.TENANT,
#         ]


# class IsAdminOrResident(BasePermission):
#     """
#     Allows access to authenticated
#     administrators, homeowners, and tenants.
#     """

#     message = (
#         "Authenticated administration or "
#         "resident access is required."
#     )

#     def has_permission(
#         self,
#         request,
#         view,
#     ):

#         if not (
#             request.user
#             and request.user.is_authenticated
#         ):
#             return False

#         return request.user.role in [
#             request.user.Roles.ADMIN,
#             request.user.Roles.HOMEOWNER,
#             request.user.Roles.TENANT,
#         ]


# class IsHomeowner(BasePermission):
#     """
#     Allows access only to homeowners.
#     """

#     message = (
#         "Homeowner access is required."
#     )

#     def has_permission(
#         self,
#         request,
#         view,
#     ):

#         return bool(
#             request.user
#             and request.user.is_authenticated
#             and request.user.role
#             == request.user.Roles.HOMEOWNER
#         )


# class IsTenant(BasePermission):
#     """
#     Allows access only to tenants.
#     """

#     message = (
#         "Tenant access is required."
#     )

#     def has_permission(
#         self,
#         request,
#         view,
#     ):

#         return bool(
#             request.user
#             and request.user.is_authenticated
#             and request.user.role
#             == request.user.Roles.TENANT
#         )