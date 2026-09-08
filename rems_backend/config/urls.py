
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path


urlpatterns = [

    # --------------------------------------------------
    # Django Administration
    # --------------------------------------------------

    path(
        "admin/",
        admin.site.urls,
    ),


    # --------------------------------------------------
    # Authentication
    # --------------------------------------------------

    path(
        "api/auth/",
        include(
            "accounts.urls"
        ),
    ),


    # --------------------------------------------------
    # Residents
    # --------------------------------------------------

    path(
        "api/residents/",
        include(
            "residents.urls"
        ),
    ),


    # --------------------------------------------------
    # Properties
    # --------------------------------------------------

    path(
        "api/properties/",
        include(
            "properties.urls"
        ),
    ),


    # --------------------------------------------------
    # Visitors
    # --------------------------------------------------

    path(
        "api/visitors/",
        include(
            "visitors.urls"
        ),
    ),


    # --------------------------------------------------
    # Security / Gates
    # --------------------------------------------------

    path(
        "api/security/",
        include(
            "security.urls"
        ),
    ),


    # --------------------------------------------------
    # Vehicles / Motorist Stickers
    # --------------------------------------------------

    path(
        "api/vehicles/",
        include(
            "vehicles.urls"
        ),
    ),


    # --------------------------------------------------
    # Notifications
    # --------------------------------------------------

    path(
        "api/",
        include(
            "notifications.urls"
        ),
    ),


    # --------------------------------------------------
    # Announcements
    # --------------------------------------------------

    path(
        "api/announcements/",
        include(
            "announcements.urls"
        ),
    ),


    # --------------------------------------------------
    # Facilities
    # --------------------------------------------------

    path(
        "api/facilities/",
        include(
            "facilities.urls"
        ),
    ),
]


if settings.DEBUG:

    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )



# from django.conf import settings
# from django.conf.urls.static import static
# from django.contrib import admin
# from django.urls import include, path


# urlpatterns = [

#     # --------------------------------------------------
#     # Django Administration
#     # --------------------------------------------------

#     path(
#         "admin/",
#         admin.site.urls,
#     ),

#     # --------------------------------------------------
#     # Authentication
#     # --------------------------------------------------

#     path(
#         "api/auth/",
#         include(
#             "accounts.urls"
#         ),
#     ),

#     # --------------------------------------------------
#     # Residents
#     # --------------------------------------------------

#     path(
#         "api/residents/",
#         include(
#             "residents.urls"
#         ),
#     ),

#     # --------------------------------------------------
#     # Properties
#     # --------------------------------------------------

#     path(
#         "api/properties/",
#         include(
#             "properties.urls"
#         ),
#     ),

#     # --------------------------------------------------
#     # Visitors
#     # --------------------------------------------------

#     path(
#         "api/visitors/",
#         include(
#             "visitors.urls"
#         ),
#     ),

#     # --------------------------------------------------
#     # Security / Gates
#     # --------------------------------------------------

#     path(
#         "api/security/",
#         include(
#             "security.urls"
#         ),
#     ),

#     # --------------------------------------------------
#     # Vehicles / Motorist Stickers
#     # --------------------------------------------------

#     path(
#         "api/vehicles/",
#         include(
#             "vehicles.urls"
#         ),
#     ),
    
#     path(
#         "api/",
#         include("notifications.urls"),
#     ),
    
#     path(
#         "api/announcements/",
#         include(
#             "announcements.urls"
#         ),
#     ),
    
#     path(
#         "api/",
#         include(
#             "facilities.urls"
#         ),
#     ),
# ]


# if settings.DEBUG:

#     urlpatterns += static(
#         settings.MEDIA_URL,
#         document_root=settings.MEDIA_ROOT,
#     )