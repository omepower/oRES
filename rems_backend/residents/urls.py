from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import ResidentViewSet


router = DefaultRouter()

router.register(
    "residents",
    ResidentViewSet,
    basename="resident",
)


urlpatterns = [
    path(
        "",
        include(router.urls),
    ),
]