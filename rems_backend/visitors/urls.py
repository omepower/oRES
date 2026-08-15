from django.urls import (
    include,
    path,
)

from rest_framework.routers import (
    DefaultRouter,
)

from .views import (
    VisitorInvitationViewSet,
    VisitorVisitViewSet,
)


router = DefaultRouter()


# ============================================================
# EXISTING VISITOR ROUTES
# ============================================================

router.register(
    "visitor-invitations",
    VisitorInvitationViewSet,
    basename="visitor-invitation",
)


router.register(
    "visitor-visits",
    VisitorVisitViewSet,
    basename="visitor-visit",
)


urlpatterns = [

    # ========================================================
    # RESIDENT VISITOR INVITATIONS
    # /api/visitors/mine/
    # ========================================================

    path(
        "mine/",
        VisitorInvitationViewSet.as_view(
            {
                "get": "my_invitations",
            }
        ),
        name="visitor-invitations-mine",
    ),

    # ========================================================
    # EXISTING ROUTER
    # ========================================================

    path(
        "",
        include(
            router.urls
        ),
    ),
]


# from django.urls import include, path

# from rest_framework.routers import DefaultRouter

# from .views import (
#     VisitorInvitationViewSet,
#     VisitorVisitViewSet,
# )


# router = DefaultRouter()

# router.register(
#     "visitor-invitations",
#     VisitorInvitationViewSet,
#     basename="visitor-invitation",
# )

# router.register(
#     "visitor-visits",
#     VisitorVisitViewSet,
#     basename="visitor-visit",
# )


# urlpatterns = [
#     path(
#         "",
#         include(router.urls),
#     ),
# ]