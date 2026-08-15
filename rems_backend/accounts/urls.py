from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import (
    ChangePasswordAPIView,
    LoginAPIView,
    LogoutAPIView,
    ProfileAPIView,
    UserViewSet,
)


# ============================================================
# API ROUTER
# ============================================================

router = DefaultRouter()

router.register(
    "users",
    UserViewSet,
    basename="user",
)


# ============================================================
# URL PATTERNS
# ============================================================

urlpatterns = [

    # --------------------------------------------------------
    # Authentication
    # --------------------------------------------------------

    path(
        "login/",
        LoginAPIView.as_view(),
        name="login",
    ),

    path(
        "logout/",
        LogoutAPIView.as_view(),
        name="logout",
    ),

    path(
        "profile/",
        ProfileAPIView.as_view(),
        name="profile",
    ),

    path(
        "change-password/",
        ChangePasswordAPIView.as_view(),
        name="change-password",
    ),

    # --------------------------------------------------------
    # User API
    # --------------------------------------------------------

    path(
        "",
        include(router.urls),
    ),
]