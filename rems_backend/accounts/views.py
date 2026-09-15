import logging
from django.contrib.auth import authenticate
from django.contrib.auth import update_session_auth_hash

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)

from audit.models import AuditEvent
from audit.services import AuditService

from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from rest_framework_simplejwt.tokens import RefreshToken

from accounts.permissions import IsAdmin



from .models import User
from .serializers import (
    LoginSerializer,
    UserSerializer,
    ChangePasswordSerializer,
)


# ============================================================
# USER VIEWSET
# ============================================================

class UserViewSet(ReadOnlyModelViewSet):

    queryset = User.objects.all()

    serializer_class = UserSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]

    search_fields = [
        "username",
        "first_name",
        "last_name",
        "email",
        "phone",
    ]

    ordering_fields = [
        "username",
        "first_name",
        "last_name",
        "date_joined",
        "created_at",
    ]

    ordering = [
        "last_name",
        "first_name",
    ]

    def get_queryset(self):

        queryset = super().get_queryset()

        # ----------------------------------------------------
        # Only resident accounts are relevant to Resident
        # management.
        #
        # This prevents ADMIN accounts from appearing in the
        # Add Resident user selector.
        # ----------------------------------------------------

        queryset = queryset.filter(
            role__in=[
                User.Roles.HOMEOWNER,
                User.Roles.TENANT,
            ]
        )

        return queryset

    @action(
        detail=False,
        methods=["get"],
        url_path="resident-accounts",
    )
    def resident_accounts(
        self,
        request,
    ):

        users = self.get_queryset().filter(
            is_active=True,
        )

        serializer = self.get_serializer(
            users,
            many=True,
        )

        return Response(
            serializer.data
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="homeowners",
    )
    def homeowners(
        self,
        request,
    ):

        users = self.get_queryset().filter(
            role=User.Roles.HOMEOWNER,
            is_active=True,
        )

        serializer = self.get_serializer(
            users,
            many=True,
        )

        return Response(
            serializer.data
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="tenants",
    )
    def tenants(
        self,
        request,
    ):

        users = self.get_queryset().filter(
            role=User.Roles.TENANT,
            is_active=True,
        )

        serializer = self.get_serializer(
            users,
            many=True,
        )

        return Response(
            serializer.data
        )


# ============================================================
# LOGIN
# ============================================================

logger = logging.getLogger(__name__)


class LoginAPIView(APIView):

    permission_classes = [
        AllowAny
    ]

    def _audit_login_success(
        self,
        request,
        user,
    ):
        """
        Record a successful authentication event.

        Audit failure must not prevent a valid user
        from completing the login process.
        """

        try:

            AuditService.success(
                module=AuditEvent.Module.ACCOUNTS,

                action=AuditEvent.Action.LOGIN,

                event_type="LOGIN_SUCCESS",

                description=(
                    f"User '{user.username}' "
                    f"logged in successfully."
                ),

                user=user,

                request=request,

                object_type="User",

                object_id=user.id,

                severity=(
                    AuditEvent.Severity.INFO
                ),

                before_data={},

                after_data={
                    "authenticated": True,
                },

                metadata={
                    "username":
                        user.username,

                    "role":
                        getattr(
                            user,
                            "role",
                            None,
                        ),

                    "authentication_method":
                        "password",
                },
            )

        except Exception:

            logger.exception(
                "[Audit] Failed to record LOGIN_SUCCESS event."
            )


    def _audit_login_failed(
        self,
        request,
        username,
        reason,
        user=None,
    ):
        """
        Record a failed authentication attempt.

        No password is ever stored.
        """

        try:

            failed_method = getattr(
                AuditService,
                "failed",
                None,
            )

            if failed_method is None:

                failed_method = getattr(
                    AuditService,
                    "failure",
                    None,
                )

            if failed_method is None:

                raise AttributeError(
                    "AuditService must provide "
                    "failed(...) or failure(...)."
                )


            failed_method(
                module=AuditEvent.Module.ACCOUNTS,

                action=AuditEvent.Action.LOGIN,

                event_type="LOGIN_FAILED",

                description=(
                    f"Login failed for username "
                    f"'{username}'. Reason: {reason}"
                ),

                user=user,

                request=request,

                object_type=(
                    "User"
                    if user
                    else "Authentication"
                ),

                object_id=(
                    user.id
                    if user
                    else None
                ),

                severity=(
                    AuditEvent.Severity.MEDIUM
                ),

                before_data={},

                after_data={
                    "authenticated": False,
                },

                metadata={
                    "username":
                        username,

                    "reason":
                        reason,

                    "authentication_method":
                        "password",
                },
            )

        except Exception:

            logger.exception(
                "[Audit] Failed to record LOGIN_FAILED event."
            )


    def post(
        self,
        request,
    ):

        serializer = LoginSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        username = (
            serializer.validated_data[
                "username"
            ]
        )

        password = (
            serializer.validated_data[
                "password"
            ]
        )

        user = authenticate(
            request=request,

            username=username,

            password=password,
        )


        # ========================================================
        # INVALID CREDENTIALS
        # ========================================================

        if user is None:

            self._audit_login_failed(
                request=request,

                username=username,

                reason=(
                    "Invalid username or password."
                ),
            )

            return Response(
                {
                    "success": False,

                    "detail":
                        "Invalid username or password.",
                },

                status=(
                    status.HTTP_401_UNAUTHORIZED
                ),
            )


        # ========================================================
        # INACTIVE ACCOUNT
        # ========================================================

        if not user.is_active:

            self._audit_login_failed(
                request=request,

                username=username,

                reason=(
                    "Account is inactive."
                ),

                user=user,
            )

            return Response(
                {
                    "success": False,

                    "detail":
                        "This account is inactive.",
                },

                status=(
                    status.HTTP_403_FORBIDDEN
                ),
            )


        # ========================================================
        # CREATE JWT TOKENS
        # ========================================================

        refresh = RefreshToken.for_user(
            user
        )


        # ========================================================
        # LOGIN SUCCESS AUDIT
        #
        # Only record success after authentication
        # and token creation have succeeded.
        # ========================================================

        self._audit_login_success(
            request=request,

            user=user,
        )


        # ========================================================
        # RESPONSE
        # ========================================================

        return Response(
            {
                "success": True,

                "access":
                    str(
                        refresh.access_token
                    ),

                "refresh":
                    str(
                        refresh
                    ),

                "user":
                    UserSerializer(
                        user
                    ).data,
            },

            status=status.HTTP_200_OK,
        )



# class LoginAPIView(APIView):

#     permission_classes = [
#         AllowAny
#     ]

#     def post(
#         self,
#         request,
#     ):

#         serializer = LoginSerializer(
#             data=request.data
#         )

#         serializer.is_valid(
#             raise_exception=True
#         )

#         username = (
#             serializer.validated_data[
#                 "username"
#             ]
#         )

#         password = (
#             serializer.validated_data[
#                 "password"
#             ]
#         )

#         user = authenticate(
#             username=username,
#             password=password,
#         )

#         if user is None:

#             return Response(
#                 {
#                     "success": False,
#                     "detail":
#                         "Invalid username or password.",
#                 },
#                 status=(
#                     status.HTTP_401_UNAUTHORIZED
#                 ),
#             )

#         if not user.is_active:

#             return Response(
#                 {
#                     "success": False,
#                     "detail":
#                         "This account is inactive.",
#                 },
#                 status=(
#                     status.HTTP_403_FORBIDDEN
#                 ),
#             )

#         refresh = RefreshToken.for_user(
#             user
#         )

#         return Response(
#             {
#                 "success": True,
#                 "access": str(
#                     refresh.access_token
#                 ),
#                 "refresh": str(
#                     refresh
#                 ),
#                 "user": UserSerializer(
#                     user
#                 ).data,
#             },
#             status=status.HTTP_200_OK,
#         )


# ============================================================
# LOGOUT
# ============================================================

class LogoutAPIView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
    ):

        refresh_token = request.data.get(
            "refresh"
        )

        if refresh_token:

            try:

                token = RefreshToken(
                    refresh_token
                )

                token.blacklist()

            except Exception:

                pass

        return Response(
            {
                "success": True,
                "detail":
                    "Successfully logged out.",
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# PROFILE
# ============================================================

class ProfileAPIView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
    ):

        serializer = UserSerializer(
            request.user
        )

        return Response(
            serializer.data
        )

    def patch(
        self,
        request,
    ):

        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            serializer.data
        )


# ============================================================
# CHANGE PASSWORD
# ============================================================

class ChangePasswordAPIView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
    ):

        serializer = ChangePasswordSerializer(
            data=request.data,
            context={
                "request": request
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        request.user.set_password(
            serializer.validated_data[
                "new_password"
            ]
        )

        request.user.save()

        update_session_auth_hash(
            request,
            request.user,
        )

        return Response(
            {
                "success": True,
                "detail":
                    "Password changed successfully.",
            },
            status=status.HTTP_200_OK,
        )