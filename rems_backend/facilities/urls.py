from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    FacilityViewSet,
    BookingViewSet,
    BookingGuestViewSet,
    BookingPaymentViewSet,
    BookingInspectionViewSet,
)

router = DefaultRouter()

# 1. Register specific sub-routes FIRST
router.register(r"bookings", BookingViewSet, basename="facility-booking")
router.register(r"booking-guests", BookingGuestViewSet, basename="booking-guest")
router.register(r"payments", BookingPaymentViewSet, basename="booking-payment")
router.register(r"inspections", BookingInspectionViewSet, basename="booking-inspection")

# 2. Register the base empty route LAST
router.register(r"", FacilityViewSet, basename="facility")

urlpatterns = [
    path("", include(router.urls)),
]

# from django.urls import include, path

# from rest_framework.routers import DefaultRouter

# from .views import (
#     FacilityViewSet,
#     BookingViewSet,
#     BookingGuestViewSet,
#     BookingPaymentViewSet,
#     BookingInspectionViewSet,
# )


# router = DefaultRouter()


# router.register(
#     r"facilities",
#     FacilityViewSet,
#     basename="facility",
# )


# router.register(
#     r"facilities/bookings",
#     BookingViewSet,
#     basename="facility-booking",
# )


# router.register(
#     r"facilities/booking-guests",
#     BookingGuestViewSet,
#     basename="booking-guest",
# )


# router.register(
#     r"facilities/payments",
#     BookingPaymentViewSet,
#     basename="booking-payment",
# )


# router.register(
#     r"facilities/inspections",
#     BookingInspectionViewSet,
#     basename="booking-inspection",
# )


# urlpatterns = [
#     path(
#         "",
#         include(router.urls),
#     ),
# ]
