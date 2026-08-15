from django.urls import (
    include,
    path,
)

from rest_framework.routers import (
    DefaultRouter,
)

from .views import (
    PropertyViewSet,
    PropertyOwnershipViewSet,
    PropertyOccupancyViewSet,
)


router = DefaultRouter()


# ============================================================
# EXISTING PROPERTY ROUTES
# ============================================================

router.register(
    "properties",
    PropertyViewSet,
    basename="property",
)


router.register(
    "property-ownerships",
    PropertyOwnershipViewSet,
    basename="property-ownership",
)


router.register(
    "property-occupancies",
    PropertyOccupancyViewSet,
    basename="property-occupancy",
)


urlpatterns = [

    # ========================================================
    # RESIDENT PROPERTY ENDPOINT
    # /api/properties/mine/
    # ========================================================

    path(
        "mine/",
        PropertyViewSet.as_view(
            {
                "get": "mine",
            }
        ),
        name="property-mine",
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
#     PropertyViewSet,
#     PropertyOwnershipViewSet,
#     PropertyOccupancyViewSet,
# )


# router = DefaultRouter()

# router.register(
#     "properties",
#     PropertyViewSet,
#     basename="property",
# )

# router.register(
#     "property-ownerships",
#     PropertyOwnershipViewSet,
#     basename="property-ownership",
# )

# router.register(
#     "property-occupancies",
#     PropertyOccupancyViewSet,
#     basename="property-occupancy",
# )


# urlpatterns = [
#     path(
#         "",
#         include(router.urls),
#     ),
# ]