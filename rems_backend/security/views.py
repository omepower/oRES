from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import (
    IsAdmin,
    IsAdminOrSecurity,
)

from notifications.models import Notification

from notifications.services import (
    NotificationService,
)

from visitors.models import (
    VisitorInvitation,
    VisitorVisit,
)

from .models import Gate

from .serializers import (
    GateSerializer,
    VisitorScanSerializer,
)


User = get_user_model()


class GateViewSet(
    ModelViewSet
):

    queryset = (
        Gate.objects
        .all()
    )

    serializer_class = (
        GateSerializer
    )

    permission_classes = [
        IsAuthenticated,
        IsAdminOrSecurity,
    ]

    search_fields = [
        "name",
        "location",
    ]

    filterset_fields = [
        "gate_type",
        "is_primary",
        "is_active",
    ]

    ordering_fields = [
        "name",
        "gate_type",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "name",
    ]


    # ========================================================
    # SECURITY ROLE CONTROL
    # ========================================================

    def get_permissions(
        self,
    ):

        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
        ]:

            permission_classes = [
                IsAuthenticated,
                IsAdmin,
            ]

        else:

            permission_classes = [
                IsAuthenticated,
                IsAdminOrSecurity,
            ]

        return [
            permission()
            for permission in permission_classes
        ]


    # ========================================================
    # PRIMARY GATE
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="primary",
    )
    def primary(
        self,
        request,
    ):

        gate = (
            Gate.objects
            .filter(
                is_primary=True,
                is_active=True,
            )
            .first()
        )


        if not gate:

            return Response(
                {
                    "detail":
                        "No active primary gate has been configured."
                }
            )


        serializer = (
            self.get_serializer(
                gate
            )
        )


        return Response(
            serializer.data
        )


    # ========================================================
    # ACTIVE GATES
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="active",
    )
    def active(
        self,
        request,
    ):

        gates = (
            Gate.objects
            .filter(
                is_active=True,
            )
            .order_by(
                "-is_primary",
                "name",
            )
        )


        serializer = (
            self.get_serializer(
                gates,
                many=True,
            )
        )


        return Response(
            serializer.data
        )


    # ========================================================
    # HELPERS
    # ========================================================

    def _resident_visitors_url(
        self,
        resident,
    ):

        role = str(
            getattr(
                resident.user,
                "role",
                "",
            )
        ).strip().upper()


        if role == "TENANT":

            return "/tenant/visitors"


        return "/homeowner/visitors"


    def _notify_security_users(
        self,
        *,
        title,
        message,
        actor,
        metadata=None,
        priority=Notification.Priority.WARNING,
    ):

        recipients = (
            User.objects
            .filter(
                role__in=[
                    User.Roles.ADMIN,
                    User.Roles.SECURITY,
                ],
                is_active=True,
            )
        )


        for recipient in recipients:

            NotificationService.security(

                recipient=recipient,

                actor=actor,

                title=title,

                message=message,

                action_url="/security/history",

                metadata=metadata or {},

                priority=priority,

            )


    # ========================================================
    # VISITOR QR SCAN
    # ========================================================

    @action(
        detail=False,
        methods=["post"],
        url_path="visitor-scan",
        permission_classes=[
            IsAuthenticated,
            IsAdminOrSecurity,
        ],
    )
    def visitor_scan(
        self,
        request,
    ):

        serializer = (
            VisitorScanSerializer(
                data=request.data
            )
        )


        serializer.is_valid(
            raise_exception=True
        )


        invitation_code = (
            serializer.validated_data[
                "invitation_code"
            ]
        )


        gate = (
            serializer.validated_data[
                "gate"
            ]
        )


        # ====================================================
        # FIND / LOCK INVITATION
        # ====================================================

        with transaction.atomic():

            try:

                invitation = (
                    VisitorInvitation.objects
                    .select_for_update()
                    .select_related(
                        "host",
                        "host__user",
                        "property",
                    )
                    .get(
                        invitation_code=(
                            invitation_code
                        )
                    )
                )

            except VisitorInvitation.DoesNotExist:

                transaction.set_rollback(
                    False
                )


                self._notify_security_users(

                    title="Invalid Visitor QR Scan",

                    message=(
                        "A visitor QR code was scanned "
                        "but the invitation could not "
                        "be found."
                    ),

                    actor=request.user,

                    metadata={
                        "event":
                            "VISITOR_QR_INVALID",

                        "invitation_code":
                            str(
                                invitation_code
                            ),

                        "scanner_id":
                            request.user.id,
                    },

                    priority=(
                        Notification.Priority.DANGER
                    ),
                )


                return Response(
                    {
                        "success": False,
                        "status": "DENIED",
                        "reason":
                            "Invalid visitor invitation.",
                    },
                    status=(
                        status.HTTP_404_NOT_FOUND
                    ),
                )


            # =================================================
            # EXPIRE OVERDUE
            # =================================================

            invitation.expire_if_needed()


            # =================================================
            # CANCELLED
            # =================================================

            if invitation.status == (
                VisitorInvitation.Status.CANCELLED
            ):

                def notify_cancelled():

                    self._notify_security_users(

                        title="Cancelled Visitor QR Scan",

                        message=(
                            f"{invitation.visitor_name} "
                            f"attempted to enter using "
                            f"a cancelled visitor invitation."
                        ),

                        actor=request.user,

                        metadata={

                            "event":
                                "VISITOR_QR_CANCELLED",

                            "invitation_id":
                                invitation.id,

                            "visitor_name":
                                invitation.visitor_name,

                            "gate_id":
                                gate.id,

                            "gate_name":
                                gate.name,
                        },

                        priority=(
                            Notification.Priority.WARNING
                        ),
                    )


                transaction.on_commit(
                    notify_cancelled
                )


                return Response(
                    {
                        "success": False,
                        "status": "DENIED",
                        "reason":
                            "This visitor invitation has been cancelled.",
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )


            # =================================================
            # USED
            # =================================================

            if invitation.status == (
                VisitorInvitation.Status.USED
            ):

                def notify_used():

                    self._notify_security_users(

                        title="Used Visitor QR Scan",

                        message=(
                            f"{invitation.visitor_name} "
                            f"attempted to reuse a visitor "
                            f"QR code that has already been used."
                        ),

                        actor=request.user,

                        metadata={

                            "event":
                                "VISITOR_QR_REUSED",

                            "invitation_id":
                                invitation.id,

                            "visitor_name":
                                invitation.visitor_name,

                            "gate_id":
                                gate.id,

                            "gate_name":
                                gate.name,
                        },

                        priority=(
                            Notification.Priority.WARNING
                        ),
                    )


                transaction.on_commit(
                    notify_used
                )


                return Response(
                    {
                        "success": False,
                        "status": "DENIED",
                        "reason":
                            "This visitor invitation has already been used.",
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )


            # =================================================
            # EXPIRED
            # =================================================

            if invitation.status == (
                VisitorInvitation.Status.EXPIRED
            ):

                def notify_expired():

                    self._notify_security_users(

                        title="Expired Visitor QR Scan",

                        message=(
                            f"{invitation.visitor_name} "
                            f"attempted to enter using "
                            f"an expired visitor invitation."
                        ),

                        actor=request.user,

                        metadata={

                            "event":
                                "VISITOR_QR_EXPIRED",

                            "invitation_id":
                                invitation.id,

                            "visitor_name":
                                invitation.visitor_name,

                            "gate_id":
                                gate.id,

                            "gate_name":
                                gate.name,
                        },

                        priority=(
                            Notification.Priority.WARNING
                        ),
                    )


                transaction.on_commit(
                    notify_expired
                )


                return Response(
                    {
                        "success": False,
                        "status": "DENIED",
                        "reason":
                            "This visitor invitation has expired.",
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )


            # =================================================
            # DATE
            # =================================================

            today = (
                timezone.localdate()
            )


            if invitation.visit_date < today:

                invitation.status = (
                    VisitorInvitation.Status.EXPIRED
                )

                invitation.save(
                    update_fields=[
                        "status",
                        "updated_at",
                    ]
                )


                def notify_past_date():

                    self._notify_security_users(

                        title="Expired Visitor QR Scan",

                        message=(
                            f"{invitation.visitor_name} "
                            f"attempted to enter using "
                            f"an invitation from a previous date."
                        ),

                        actor=request.user,

                        metadata={

                            "event":
                                "VISITOR_QR_PAST_DATE",

                            "invitation_id":
                                invitation.id,

                            "visitor_name":
                                invitation.visitor_name,

                            "visit_date":
                                str(
                                    invitation.visit_date
                                ),

                            "gate_id":
                                gate.id,

                            "gate_name":
                                gate.name,
                        },

                        priority=(
                            Notification.Priority.WARNING
                        ),
                    )


                transaction.on_commit(
                    notify_past_date
                )


                return Response(
                    {
                        "success": False,
                        "status": "DENIED",
                        "reason":
                            "This visitor invitation has expired.",
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )


            if invitation.visit_date > today:

                def notify_future_date():

                    self._notify_security_users(

                        title="Early Visitor QR Scan",

                        message=(
                            f"{invitation.visitor_name} "
                            f"attempted to enter before "
                            f"the scheduled visit date."
                        ),

                        actor=request.user,

                        metadata={

                            "event":
                                "VISITOR_QR_WRONG_DATE",

                            "invitation_id":
                                invitation.id,

                            "visitor_name":
                                invitation.visitor_name,

                            "visit_date":
                                str(
                                    invitation.visit_date
                                ),

                            "gate_id":
                                gate.id,

                            "gate_name":
                                gate.name,
                        },

                        priority=(
                            Notification.Priority.WARNING
                        ),
                    )


                transaction.on_commit(
                    notify_future_date
                )


                return Response(
                    {
                        "success": False,
                        "status": "DENIED",
                        "reason":
                            "This visitor invitation is scheduled for another date.",
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )


            # =================================================
            # TIME WINDOW
            # =================================================

            current_time = (
                timezone.localtime().time()
            )


            if current_time < (
                invitation.expected_time_in
            ):

                def notify_too_early():

                    self._notify_security_users(

                        title="Early Visitor QR Scan",

                        message=(
                            f"{invitation.visitor_name} "
                            f"attempted to enter before "
                            f"the permitted visitor time."
                        ),

                        actor=request.user,

                        metadata={

                            "event":
                                "VISITOR_QR_TOO_EARLY",

                            "invitation_id":
                                invitation.id,

                            "visitor_name":
                                invitation.visitor_name,

                            "expected_time_in":
                                str(
                                    invitation.expected_time_in
                                ),

                            "gate_id":
                                gate.id,

                            "gate_name":
                                gate.name,
                        },

                        priority=(
                            Notification.Priority.INFO
                        ),
                    )


                transaction.on_commit(
                    notify_too_early
                )


                return Response(
                    {
                        "success": False,
                        "status": "DENIED",
                        "reason":
                            "This visitor invitation is not yet valid.",
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )


            if current_time >= (
                invitation.expected_time_out
            ):

                invitation.status = (
                    VisitorInvitation.Status.EXPIRED
                )

                invitation.save(
                    update_fields=[
                        "status",
                        "updated_at",
                    ]
                )


                def notify_time_expired():

                    self._notify_security_users(

                        title="Expired Visitor QR Scan",

                        message=(
                            f"{invitation.visitor_name} "
                            f"attempted to enter after "
                            f"the permitted visitor time."
                        ),

                        actor=request.user,

                        metadata={

                            "event":
                                "VISITOR_QR_TIME_EXPIRED",

                            "invitation_id":
                                invitation.id,

                            "visitor_name":
                                invitation.visitor_name,

                            "gate_id":
                                gate.id,

                            "gate_name":
                                gate.name,
                        },

                        priority=(
                            Notification.Priority.WARNING
                        ),
                    )


                transaction.on_commit(
                    notify_time_expired
                )


                return Response(
                    {
                        "success": False,
                        "status": "DENIED",
                        "reason":
                            "The permitted visitor time has ended.",
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )


            # =================================================
            # EXISTING VISIT
            # =================================================

            if hasattr(
                invitation,
                "visit",
            ):

                def notify_duplicate():

                    self._notify_security_users(

                        title="Duplicate Visitor QR Scan",

                        message=(
                            f"{invitation.visitor_name} "
                            f"attempted to enter again, "
                            f"but a gate visit already exists."
                        ),

                        actor=request.user,

                        metadata={

                            "event":
                                "VISITOR_QR_DUPLICATE",

                            "invitation_id":
                                invitation.id,

                            "visitor_name":
                                invitation.visitor_name,

                            "existing_visit_id":
                                invitation.visit.id
                                if invitation.visit
                                else None,

                            "gate_id":
                                gate.id,

                            "gate_name":
                                gate.name,
                        },

                        priority=(
                            Notification.Priority.WARNING
                        ),
                    )


                transaction.on_commit(
                    notify_duplicate
                )


                return Response(
                    {
                        "success": False,
                        "status": "DENIED",
                        "reason":
                            "This visitor invitation has already been used.",
                    },
                    status=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                )


            # =================================================
            # CREATE VISIT
            # =================================================

            visit = (
                VisitorVisit.objects
                .create(
                    invitation=invitation,
                    gate=gate,
                    time_in=timezone.now(),
                    status=(
                        VisitorVisit.Status.INSIDE
                    ),
                    scanned_by=request.user,
                )
            )


            # =================================================
            # CONSUME INVITATION
            # =================================================

            invitation.status = (
                VisitorInvitation.Status.USED
            )


            invitation.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )


            # =================================================
            # RESIDENT SUCCESS NOTIFICATION
            # =================================================

            resident = (
                invitation.host
            )

            resident_user = (
                resident.user
            )

            action_url = (
                self._resident_visitors_url(
                    resident
                )
            )


            def notify_success():

                NotificationService.security(

                    recipient=resident_user,

                    actor=request.user,

                    title=(
                        "Visitor Entered Community"
                    ),

                    message=(
                        f"{invitation.visitor_name} "
                        f"has entered the community "
                        f"through {gate.name}."
                    ),

                    action_url=(
                        action_url
                    ),

                    metadata={

                        "event":
                            "VISITOR_ENTERED",

                        "type":
                            "visitor_gate_entry",

                        "visit_id":
                            visit.id,

                        "invitation_id":
                            invitation.id,

                        "visitor_name":
                            invitation.visitor_name,

                        "gate_id":
                            gate.id,

                        "gate_name":
                            gate.name,

                        "time_in":
                            (
                                visit.time_in.isoformat()
                                if visit.time_in
                                else None
                            ),
                    },

                    priority=(
                        Notification.Priority.INFO
                    ),
                )


            transaction.on_commit(
                notify_success
            )


        # ====================================================
        # SUCCESS RESPONSE
        # ====================================================

        return Response(
            {
                "success": True,

                "status": "APPROVED",

                "message":
                    "Visitor entry approved.",

                "visitor": {

                    "name":
                        invitation.visitor_name,

                    "phone":
                        invitation.visitor_phone,

                    "home_address":
                        invitation.visitor_home_address,

                },

                "host": {

                    "name":
                        invitation.host_name_snapshot,

                    "address":
                        invitation.host_address_snapshot,

                    "phone":
                        invitation.host_phone_snapshot,

                    "type":
                        invitation.host_type_snapshot,

                },

                "property": {

                    "address":
                        invitation.property.address,

                },

                "gate": {

                    "id":
                        gate.id,

                    "name":
                        gate.name,

                    "type":
                        gate.gate_type,

                },

                "visit_id":
                    visit.id,

                "time_in":
                    visit.time_in,

            },

            status=(
                status.HTTP_201_CREATED
            ),
        )
        
# from django.db import transaction
# from django.utils import timezone

# from rest_framework import status
# from rest_framework.decorators import action
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from rest_framework.viewsets import ModelViewSet

# from accounts.permissions import (
#     IsAdmin,
#     IsAdminOrSecurity,
# )

# from visitors.models import (
#     VisitorInvitation,
#     VisitorVisit,
# )

# from .models import Gate
# from .serializers import (
#     GateSerializer,
#     VisitorScanSerializer,
# )


# class GateViewSet(
#     ModelViewSet
# ):

#     queryset = (
#         Gate.objects
#         .all()
#     )

#     serializer_class = (
#         GateSerializer
#     )

#     permission_classes = [
#         IsAuthenticated,
#         IsAdminOrSecurity,
#     ]

#     search_fields = [
#         "name",
#         "location",
#     ]

#     filterset_fields = [
#         "gate_type",
#         "is_primary",
#         "is_active",
#     ]

#     ordering_fields = [
#         "name",
#         "gate_type",
#         "created_at",
#         "updated_at",
#     ]

#     ordering = [
#         "name",
#     ]


#     # ========================================================
#     # SECURITY ROLE CONTROL
#     #
#     # Security officers may READ gates and scan visitors.
#     # Only administrators may modify gate configuration.
#     # ========================================================

#     def get_permissions(
#         self,
#     ):

#         if self.action in [
#             "create",
#             "update",
#             "partial_update",
#             "destroy",
#         ]:

#             permission_classes = [
#                 IsAuthenticated,
#                 IsAdmin,
#             ]

#         else:

#             permission_classes = [
#                 IsAuthenticated,
#                 IsAdminOrSecurity,
#             ]

#         return [
#             permission()
#             for permission in permission_classes
#         ]


#     # ========================================================
#     # PRIMARY GATE
#     # ========================================================

#     @action(
#         detail=False,
#         methods=["get"],
#         url_path="primary",
#     )
#     def primary(
#         self,
#         request,
#     ):

#         gate = (
#             Gate.objects
#             .filter(
#                 is_primary=True,
#                 is_active=True,
#             )
#             .first()
#         )


#         if not gate:

#             return Response(
#                 {
#                     "detail":
#                         "No active primary gate has been configured."
#                 }
#             )


#         serializer = (
#             self.get_serializer(
#                 gate
#             )
#         )


#         return Response(
#             serializer.data
#         )


#     # ========================================================
#     # ACTIVE GATES
#     # ========================================================

#     @action(
#         detail=False,
#         methods=["get"],
#         url_path="active",
#     )
#     def active(
#         self,
#         request,
#     ):

#         gates = (
#             Gate.objects
#             .filter(
#                 is_active=True,
#             )
#             .order_by(
#                 "-is_primary",
#                 "name",
#             )
#         )


#         serializer = (
#             self.get_serializer(
#                 gates,
#                 many=True,
#             )
#         )


#         return Response(
#             serializer.data
#         )


#     # ========================================================
#     # VISITOR QR SCAN
#     # ========================================================

#     @action(
#         detail=False,
#         methods=["post"],
#         url_path="visitor-scan",
#         permission_classes=[
#             IsAuthenticated,
#             IsAdminOrSecurity,
#         ],
#     )
#     def visitor_scan(
#         self,
#         request,
#     ):

#         serializer = (
#             VisitorScanSerializer(
#                 data=request.data
#             )
#         )


#         serializer.is_valid(
#             raise_exception=True
#         )


#         invitation_code = (
#             serializer.validated_data[
#                 "invitation_code"
#             ]
#         )


#         gate = (
#             serializer.validated_data[
#                 "gate"
#             ]
#         )


#         with transaction.atomic():

#             try:

#                 invitation = (
#                     VisitorInvitation.objects
#                     .select_for_update()
#                     .select_related(
#                         "host",
#                         "host__user",
#                         "property",
#                     )
#                     .get(
#                         invitation_code=(
#                             invitation_code
#                         )
#                     )
#                 )

#             except (
#                 VisitorInvitation.DoesNotExist
#             ):

#                 return Response(
#                     {
#                         "success": False,
#                         "status": "DENIED",
#                         "reason":
#                             "Invalid visitor invitation.",
#                     },
#                     status=(
#                         status.HTTP_404_NOT_FOUND
#                     ),
#                 )


#             # ------------------------------------------------
#             # EXPIRE OVERDUE INVITATION
#             # ------------------------------------------------

#             invitation.expire_if_needed()


#             # ------------------------------------------------
#             # STATUS
#             # ------------------------------------------------

#             if invitation.status == (
#                 VisitorInvitation.Status.CANCELLED
#             ):

#                 return Response(
#                     {
#                         "success": False,
#                         "status": "DENIED",
#                         "reason":
#                             "This visitor invitation has been cancelled.",
#                     },
#                     status=(
#                         status.HTTP_400_BAD_REQUEST
#                     ),
#                 )


#             if invitation.status == (
#                 VisitorInvitation.Status.USED
#             ):

#                 return Response(
#                     {
#                         "success": False,
#                         "status": "DENIED",
#                         "reason":
#                             "This visitor invitation has already been used.",
#                     },
#                     status=(
#                         status.HTTP_400_BAD_REQUEST
#                     ),
#                 )


#             if invitation.status == (
#                 VisitorInvitation.Status.EXPIRED
#             ):

#                 return Response(
#                     {
#                         "success": False,
#                         "status": "DENIED",
#                         "reason":
#                             "This visitor invitation has expired.",
#                     },
#                     status=(
#                         status.HTTP_400_BAD_REQUEST
#                     ),
#                 )


#             # ------------------------------------------------
#             # VISIT DATE
#             # ------------------------------------------------

#             today = (
#                 timezone.localdate()
#             )


#             if invitation.visit_date < today:

#                 invitation.status = (
#                     VisitorInvitation.Status.EXPIRED
#                 )

#                 invitation.save(
#                     update_fields=[
#                         "status",
#                         "updated_at",
#                     ]
#                 )


#                 return Response(
#                     {
#                         "success": False,
#                         "status": "DENIED",
#                         "reason":
#                             "This visitor invitation has expired.",
#                     },
#                     status=(
#                         status.HTTP_400_BAD_REQUEST
#                     ),
#                 )


#             if invitation.visit_date > today:

#                 return Response(
#                     {
#                         "success": False,
#                         "status": "DENIED",
#                         "reason":
#                             "This visitor invitation is scheduled for another date.",
#                     },
#                     status=(
#                         status.HTTP_400_BAD_REQUEST
#                     ),
#                 )


#             # ------------------------------------------------
#             # VISIT TIME WINDOW
#             # ------------------------------------------------

#             current_time = (
#                 timezone.localtime().time()
#             )


#             if current_time < (
#                 invitation.expected_time_in
#             ):

#                 return Response(
#                     {
#                         "success": False,
#                         "status": "DENIED",
#                         "reason":
#                             "This visitor invitation is not yet valid.",
#                     },
#                     status=(
#                         status.HTTP_400_BAD_REQUEST
#                     ),
#                 )


#             if current_time >= (
#                 invitation.expected_time_out
#             ):

#                 invitation.status = (
#                     VisitorInvitation.Status.EXPIRED
#                 )

#                 invitation.save(
#                     update_fields=[
#                         "status",
#                         "updated_at",
#                     ]
#                 )


#                 return Response(
#                     {
#                         "success": False,
#                         "status": "DENIED",
#                         "reason":
#                             "The permitted visitor time has ended.",
#                     },
#                     status=(
#                         status.HTTP_400_BAD_REQUEST
#                     ),
#                 )


#             # ------------------------------------------------
#             # EXISTING VISIT
#             # ------------------------------------------------

#             if hasattr(
#                 invitation,
#                 "visit",
#             ):

#                 return Response(
#                     {
#                         "success": False,
#                         "status": "DENIED",
#                         "reason":
#                             "This visitor invitation has already been used.",
#                     },
#                     status=(
#                         status.HTTP_400_BAD_REQUEST
#                     ),
#                 )


#             # ------------------------------------------------
#             # CREATE VISIT
#             # ------------------------------------------------

#             visit = (
#                 VisitorVisit.objects
#                 .create(
#                     invitation=invitation,
#                     gate=gate,
#                     time_in=timezone.now(),
#                     status=(
#                         VisitorVisit.Status.INSIDE
#                     ),
#                     scanned_by=request.user,
#                 )
#             )


#             # ------------------------------------------------
#             # CONSUME INVITATION
#             # ------------------------------------------------

#             invitation.status = (
#                 VisitorInvitation.Status.USED
#             )


#             invitation.save(
#                 update_fields=[
#                     "status",
#                     "updated_at",
#                 ]
#             )


#         # ====================================================
#         # SUCCESS
#         # ====================================================

#         return Response(
#             {
#                 "success": True,

#                 "status": "APPROVED",

#                 "message":
#                     "Visitor entry approved.",

#                 "visitor": {

#                     "name":
#                         invitation.visitor_name,

#                     "phone":
#                         invitation.visitor_phone,

#                     "home_address":
#                         invitation.visitor_home_address,

#                 },

#                 "host": {

#                     "name":
#                         invitation.host_name_snapshot,

#                     "address":
#                         invitation.host_address_snapshot,

#                     "phone":
#                         invitation.host_phone_snapshot,

#                     "type":
#                         invitation.host_type_snapshot,

#                 },

#                 "property": {

#                     "address":
#                         invitation.property.address,

#                 },

#                 "gate": {

#                     "id":
#                         gate.id,

#                     "name":
#                         gate.name,

#                     "type":
#                         gate.gate_type,

#                 },

#                 "visit_id":
#                     visit.id,

#                 "time_in":
#                     visit.time_in,

#             },

#             status=(
#                 status.HTTP_201_CREATED
#             ),
#         )

