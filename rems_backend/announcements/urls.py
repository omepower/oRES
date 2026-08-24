from django.urls import (
    include,
    path,
)

from rest_framework.routers import (
    DefaultRouter,
)

from .views import (
    CommunityAnnouncementViewSet,
)


router = DefaultRouter()


router.register(
    "",
    CommunityAnnouncementViewSet,
    basename="community-announcement",
)


urlpatterns = [

    path(
        "",
        include(
            router.urls
        ),
    ),

]