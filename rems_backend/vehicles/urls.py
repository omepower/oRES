from rest_framework.routers import DefaultRouter

from .views import (
    VehicleViewSet,
    MotoristStickerViewSet,
)


router = DefaultRouter()

router.register(
    r"vehicles",
    VehicleViewSet,
    basename="vehicle",
)

router.register(
    r"motorist-stickers",
    MotoristStickerViewSet,
    basename="motorist-sticker",
)


urlpatterns = router.urls