
from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import (
    IsAdmin,
    IsAdminOrResident,
    IsAdminOrSecurity,
)

from .models import (
    VisitorInvitation,
    VisitorVisit,
)

from .serializers import (
    VisitorInvitationSerializer,
    VisitorVisitSerializer,
)


# ============================================================
# VISITOR INVITATIONS
# ============================================================

class VisitorInvitationViewSet(
    ModelViewSet
):

    queryset = (
        VisitorInvitation.objects
        .select_related(
            "host",
            "host__user",
            "property",
        )
        .all()
    )

    serializer_class = (
        VisitorInvitationSerializer
    )

    permission_classes = [
        IsAuthenticated,
        IsAdminOrResident,
    ]

    search_fields = [
        "visitor_name",
        "visitor_home_address",
        "visitor_phone",
        "host_name_snapshot",
        "host_address_snapshot",
        "host_phone_snapshot",
        "property__address",
        "property__block",
        "property__lot",
        "invitation_code",
    ]

    filterset_fields = [
        "status",
        "visit_date",
        "host",
        "property",
    ]

    ordering_fields = [
        "visit_date",
        "expected_time_in",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-created_at",
    ]


    def get_queryset(
        self,
    ):

        # Automatically expire overdue invitations
        # before returning results.
        VisitorInvitation.expire_overdue_pending()

        queryset = (
            VisitorInvitation.objects
            .select_related(
                "host",
                "host__user",
                "property",
            )
            .all()
        )

        user = self.request.user

        if user.role in [
            user.Roles.ADMIN,
            user.Roles.SECURITY,
        ]:

            return queryset

        return queryset.filter(
            host__user=user
        )


    # ========================================================
    # MY INVITATIONS
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="mine",
    )
    def my_invitations(
        self,
        request,
    ):

        invitations = (
            self.get_queryset()
            .filter(
                host__user=request.user
            )
        )

        serializer = self.get_serializer(
            invitations,
            many=True,
        )

        return Response(
            serializer.data
        )


    # ========================================================
    # PENDING
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="pending",
    )
    def pending(
        self,
        request,
    ):

        invitations = (
            self.get_queryset()
            .filter(
                status=(
                    VisitorInvitation.Status.PENDING
                )
            )
        )

        serializer = self.get_serializer(
            invitations,
            many=True,
        )

        return Response(
            serializer.data
        )


    # ========================================================
    # TODAY
    # Security + Admin only
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="today",
        permission_classes=[
            IsAuthenticated,
            IsAdminOrSecurity,
        ],
    )
    def today(
        self,
        request,
    ):

        invitations = (
            self.get_queryset()
            .filter(
                visit_date=timezone.localdate()
            )
        )

        serializer = self.get_serializer(
            invitations,
            many=True,
        )

        return Response(
            serializer.data
        )


    # ========================================================
    # CANCEL
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="cancel",
    )
    def cancel(
        self,
        request,
        pk=None,
    ):

        invitation = self.get_object()

        if invitation.status != (
            VisitorInvitation.Status.PENDING
        ):

            return Response(
                {
                    "detail":
                        "Only pending invitations can be cancelled."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitation.status = (
            VisitorInvitation.Status.CANCELLED
        )

        invitation.cancelled_at = (
            timezone.now()
        )

        invitation.save()

        serializer = self.get_serializer(
            invitation
        )

        return Response(
            serializer.data
        )


    # ========================================================
    # GENERATE QR
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="generate-qr",
    )
    def generate_qr(
        self,
        request,
        pk=None,
    ):

        invitation = self.get_object()

        if invitation.status != (
            VisitorInvitation.Status.PENDING
        ):

            return Response(
                {
                    "detail":
                        "A QR code can only be generated for a pending invitation."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if invitation.is_expired:

            invitation.status = (
                VisitorInvitation.Status.EXPIRED
            )

            invitation.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

            return Response(
                {
                    "detail":
                        "This invitation has expired."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitation.qr_generated_at = (
            timezone.now()
        )

        invitation.save(
            update_fields=[
                "qr_generated_at",
                "updated_at",
            ]
        )

        serializer = self.get_serializer(
            invitation
        )

        return Response(
            {
                "success": True,
                "invitation": serializer.data,
                "qr_value": str(
                    invitation.invitation_code
                ),
            }
        )


# ============================================================
# VISITOR VISITS
# ============================================================

class VisitorVisitViewSet(
    ModelViewSet
):

    queryset = (
        VisitorVisit.objects
        .select_related(
            "invitation",
            "invitation__host",
            "invitation__host__user",
            "invitation__property",
            "gate",
            "scanned_by",
        )
        .all()
    )

    serializer_class = (
        VisitorVisitSerializer
    )

    permission_classes = [
        IsAuthenticated,
        IsAdminOrSecurity,
    ]

    search_fields = [
        "invitation__visitor_name",
        "invitation__visitor_phone",
        "invitation__visitor_home_address",
        "invitation__host_name_snapshot",
        "invitation__property__address",
    ]

    filterset_fields = [
        "status",
        "gate",
        "invitation__property",
        "invitation__host",
    ]

    ordering_fields = [
        "time_in",
        "time_out",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-time_in",
    ]


    # ========================================================
    # QUERYSET VISIBILITY
    # ========================================================

    def get_queryset(
        self,
    ):

        queryset = super().get_queryset()

        user = self.request.user

        # Admin and Security can see all visitor visits.
        if user.role in [
            user.Roles.ADMIN,
            user.Roles.SECURITY,
        ]:

            return queryset

        # Resident access remains restricted to own visitors.
        return queryset.filter(
            invitation__host__user=user
        )


    # ========================================================
    # HISTORY
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="history",
    )
    def history(
        self,
        request,
    ):

        visits = (
            self.get_queryset()
            .select_related(
                "invitation",
                "invitation__host",
                "invitation__property",
                "gate",
                "scanned_by",
            )
            .order_by(
                "-time_in"
            )
        )

        serializer = self.get_serializer(
            visits,
            many=True,
        )

        return Response(
            serializer.data
        )


    # ========================================================
    # CURRENTLY INSIDE
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="inside",
    )
    def inside(
        self,
        request,
    ):

        visits = (
            self.get_queryset()
            .filter(
                status=(
                    VisitorVisit.Status.INSIDE
                )
            )
            .select_related(
                "invitation",
                "invitation__host",
                "invitation__property",
                "gate",
                "scanned_by",
            )
            .order_by(
                "time_in"
            )
        )

        serializer = self.get_serializer(
            visits,
            many=True,
        )

        return Response(
            serializer.data
        )


    # ========================================================
    # COMPLETED
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="completed",
    )
    def completed(
        self,
        request,
    ):

        visits = (
            self.get_queryset()
            .filter(
                status=(
                    VisitorVisit.Status.COMPLETED
                )
            )
            .select_related(
                "invitation",
                "invitation__host",
                "invitation__property",
                "gate",
                "scanned_by",
            )
            .order_by(
                "-time_out"
            )
        )

        serializer = self.get_serializer(
            visits,
            many=True,
        )

        return Response(
            serializer.data
        )


    # ========================================================
    # SCAN VISITOR QR
    #
    # Legacy endpoint retained for compatibility.
    # The Security portal should use:
    # /api/security/gates/visitor-scan/
    # ========================================================

    @action(
        detail=False,
        methods=["post"],
        url_path="scan",
        permission_classes=[
            IsAuthenticated,
            IsAdminOrSecurity,
        ],
    )
    def scan(
        self,
        request,
    ):

        qr_value = (
            request.data.get(
                "qr_value"
            )
            or request.data.get(
                "invitation_code"
            )
        )

        gate_id = (
            request.data.get(
                "gate"
            )
        )


        if not qr_value:

            return Response(
                {
                    "detail":
                        "QR value is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        # ----------------------------------------------------
        # FIND INVITATION
        # ----------------------------------------------------

        try:

            invitation = (
                VisitorInvitation.objects
                .select_related(
                    "host",
                    "host__user",
                    "property",
                )
                .get(
                    invitation_code=qr_value
                )
            )

        except VisitorInvitation.DoesNotExist:

            return Response(
                {
                    "allowed": False,
                    "reason": "INVALID",
                    "detail":
                        "This visitor QR code is not recognized.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )


        # ----------------------------------------------------
        # AUTOMATIC EXPIRATION
        # ----------------------------------------------------

        invitation.expire_if_needed()


        # Re-check after expiration.
        invitation.refresh_from_db()


        # ----------------------------------------------------
        # STATUS
        # ----------------------------------------------------

        if invitation.status == (
            VisitorInvitation.Status.CANCELLED
        ):

            return Response(
                {
                    "allowed": False,
                    "reason": "CANCELLED",
                    "detail":
                        "This visitor invitation has been cancelled.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )


        if invitation.status == (
            VisitorInvitation.Status.EXPIRED
        ):

            return Response(
                {
                    "allowed": False,
                    "reason": "EXPIRED",
                    "detail":
                        "This visitor invitation has expired.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )


        if invitation.status == (
            VisitorInvitation.Status.USED
        ):

            return Response(
                {
                    "allowed": False,
                    "reason": "USED",
                    "detail":
                        "This visitor invitation has already been used.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )


        # ----------------------------------------------------
        # DATE
        # ----------------------------------------------------

        if (
            invitation.visit_date
            != timezone.localdate()
        ):

            return Response(
                {
                    "allowed": False,
                    "reason": "WRONG_DATE",
                    "detail":
                        "This visitor invitation is not valid for today.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )


        # ----------------------------------------------------
        # TIME WINDOW
        # ----------------------------------------------------

        current_time = (
            timezone.localtime().time()
        )


        if (
            current_time
            < invitation.expected_time_in
        ):

            return Response(
                {
                    "allowed": False,
                    "reason": "TOO_EARLY",
                    "detail":
                        "This visitor invitation is not yet valid.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        if (
            current_time
            >= invitation.expected_time_out
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

            return Response(
                {
                    "allowed": False,
                    "reason": "EXPIRED",
                    "detail":
                        "The permitted visitor time has ended.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        # ----------------------------------------------------
        # GATE
        # ----------------------------------------------------

        from security.models import Gate


        gate = None


        if gate_id:

            gate = (
                Gate.objects
                .filter(
                    pk=gate_id,
                    is_active=True,
                )
                .first()
            )

            if not gate:

                return Response(
                    {
                        "detail":
                            "The selected gate is not active."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )


        if not gate:

            gate = (
                Gate.objects
                .filter(
                    is_active=True,
                )
                .order_by(
                    "-is_primary",
                    "id",
                )
                .first()
            )


        if not gate:

            return Response(
                {
                    "detail":
                        "No active gate is configured."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        # ----------------------------------------------------
        # CREATE VISIT
        # ----------------------------------------------------

        with transaction.atomic():

            invitation = (
                VisitorInvitation.objects
                .select_for_update()
                .select_related(
                    "host",
                    "host__user",
                    "property",
                )
                .get(
                    pk=invitation.pk
                )
            )


            if invitation.status != (
                VisitorInvitation.Status.PENDING
            ):

                return Response(
                    {
                        "allowed": False,
                        "reason": "USED",
                        "detail":
                            "This visitor invitation is no longer available.",
                    },
                    status=status.HTTP_409_CONFLICT,
                )


            if (
                VisitorVisit.objects
                .filter(
                    invitation=invitation
                )
                .exists()
            ):

                return Response(
                    {
                        "allowed": False,
                        "reason": "USED",
                        "detail":
                            "A gate visit already exists for this invitation.",
                    },
                    status=status.HTTP_409_CONFLICT,
                )


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


            invitation.status = (
                VisitorInvitation.Status.USED
            )

            invitation.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )


        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return Response(
            {
                "allowed": True,

                "message":
                    "Visitor authorized. Entry recorded.",

                "visitor_name":
                    invitation.visitor_name,

                "host_name":
                    invitation.host_name_snapshot,

                "property_address":
                    invitation.host_address_snapshot,

                "visit_date":
                    invitation.visit_date,

                "expected_time_in":
                    invitation.expected_time_in,

                "expected_time_out":
                    invitation.expected_time_out,

                "gate_name":
                    gate.name,

                "invitation":
                    VisitorInvitationSerializer(
                        invitation
                    ).data,

                "visit":
                    VisitorVisitSerializer(
                        visit
                    ).data,
            },
            status=status.HTTP_201_CREATED,
        )


    # ========================================================
    # CHECK OUT
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="checkout",
    )
    def checkout(
        self,
        request,
        pk=None,
    ):

        with transaction.atomic():

            visit = (
                self.get_queryset()
                .select_for_update()
                .select_related(
                    "invitation",
                    "gate",
                )
                .filter(
                    pk=pk
                )
                .first()
            )


            if not visit:

                return Response(
                    {
                        "detail":
                            "Visitor visit was not found."
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )


            if visit.status != (
                VisitorVisit.Status.INSIDE
            ):

                return Response(
                    {
                        "detail":
                            "Only visitors currently inside can be checked out."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )


            visit.time_out = (
                timezone.now()
            )

            visit.status = (
                VisitorVisit.Status.COMPLETED
            )

            visit.save(
                update_fields=[
                    "time_out",
                    "status",
                    "updated_at",
                ]
            )


        return Response(
            {
                "message":
                    "Visitor checked out successfully.",

                "visit":
                    self.get_serializer(
                        visit
                    ).data,
            }
        )


# from django.utils import timezone
# from django.db import transaction
# from rest_framework import status
# from rest_framework.decorators import action
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from rest_framework.viewsets import ModelViewSet

# from accounts.permissions import (
#     IsAdmin,
#     IsAdminOrResident,
#     IsAdminOrSecurity,
# )

# from .models import (
#     VisitorInvitation,
#     VisitorVisit,
# )

# from .serializers import (
#     VisitorInvitationSerializer,
#     VisitorVisitSerializer,
# )


# class VisitorInvitationViewSet(
#     ModelViewSet
# ):

#     queryset = (
#         VisitorInvitation.objects
#         .select_related(
#             "host",
#             "host__user",
#             "property",
#         )
#         .all()
#     )

#     serializer_class = (
#         VisitorInvitationSerializer
#     )

#     permission_classes = [
#         IsAuthenticated,
#         IsAdminOrResident,
#     ]

#     search_fields = [
#         "visitor_name",
#         "visitor_home_address",
#         "visitor_phone",
#         "host_name_snapshot",
#         "host_address_snapshot",
#         "host_phone_snapshot",
#         "property__address",
#         "property__block",
#         "property__lot",
#         "invitation_code",
#     ]

#     filterset_fields = [
#         "status",
#         "visit_date",
#         "host",
#         "property",
#     ]

#     ordering_fields = [
#         "visit_date",
#         "expected_time_in",
#         "created_at",
#         "updated_at",
#     ]

#     ordering = [
#         "-created_at"
#     ]

    
#     def get_queryset(self):

#         # ----------------------------------------------------
#         # Automatically expire overdue pending invitations
#         # before returning API results.
#         # ----------------------------------------------------

#         VisitorInvitation.expire_overdue_pending()


#         queryset = (
#             VisitorInvitation.objects
#             .select_related(
#                 "host",
#                 "host__user",
#                 "property",
#             )
#             .all()
#         )


#         user = self.request.user


#         if user.role == user.Roles.ADMIN:

#             return queryset


#         return queryset.filter(
#             host__user=user
#         )



#     @action(
#         detail=False,
#         methods=["get"],
#         url_path="mine",
#     )
#     def my_invitations(
#         self,
#         request,
#     ):

#         invitations = (
#             self.get_queryset()
#             .filter(
#                 host__user=request.user
#             )
#         )

#         serializer = self.get_serializer(
#             invitations,
#             many=True,
#         )

#         return Response(
#             serializer.data
#         )

#     @action(
#         detail=False,
#         methods=["get"],
#         url_path="pending",
#     )
#     def pending(
#         self,
#         request,
#     ):

#         invitations = (
#             self.get_queryset()
#             .filter(
#                 status=(
#                     VisitorInvitation.Status.PENDING
#                 )
#             )
#         )

#         serializer = self.get_serializer(
#             invitations,
#             many=True,
#         )

#         return Response(
#             serializer.data
#         )

#     @action(
#     detail=False,
#     methods=["get"],
#     url_path="today",
#     permission_classes=[
#             IsAuthenticated,
#             IsAdminOrSecurity,
#         ],
#     )
#     def today(
#         self,
#         request,
#     ):

#         invitations = (
#             self.get_queryset()
#             .filter(
#                 visit_date=timezone.localdate()
#             )
#         )

#         serializer = self.get_serializer(
#             invitations,
#             many=True,
#         )

#         return Response(
#             serializer.data
#         )

#     @action(
#         detail=True,
#         methods=["post"],
#         url_path="cancel",
#     )
#     def cancel(
#         self,
#         request,
#         pk=None,
#     ):

#         invitation = self.get_object()

#         if invitation.status != (
#             VisitorInvitation.Status.PENDING
#         ):
#             return Response(
#                 {
#                     "detail":
#                         "Only pending invitations can be cancelled."
#                 },
#                 status=(
#                     status.HTTP_400_BAD_REQUEST
#                 ),
#             )

#         invitation.status = (
#             VisitorInvitation.Status.CANCELLED
#         )

#         invitation.cancelled_at = (
#             timezone.now()
#         )

#         invitation.save()

#         serializer = self.get_serializer(
#             invitation
#         )

#         return Response(
#             serializer.data
#         )

#     @action(
#         detail=True,
#         methods=["post"],
#         url_path="generate-qr",
#     )
#     def generate_qr(
#         self,
#         request,
#         pk=None,
#     ):

#         invitation = self.get_object()

#         if invitation.status != (
#             VisitorInvitation.Status.PENDING
#         ):
#             return Response(
#                 {
#                     "detail":
#                         "A QR code can only be generated for a pending invitation."
#                 },
#                 status=(
#                     status.HTTP_400_BAD_REQUEST
#                 ),
#             )

#         if invitation.is_expired:

#             invitation.status = (
#                 VisitorInvitation.Status.EXPIRED
#             )

#             invitation.save()

#             return Response(
#                 {
#                     "detail":
#                         "This invitation has expired."
#                 },
#                 status=(
#                     status.HTTP_400_BAD_REQUEST
#                 ),
#             )

#         invitation.qr_generated_at = (
#             timezone.now()
#         )

#         invitation.save(
#             update_fields=[
#                 "qr_generated_at",
#                 "updated_at",
#             ]
#         )

#         serializer = self.get_serializer(
#             invitation
#         )

#         return Response(
#             {
#                 "success": True,
#                 "invitation": serializer.data,
#                 "qr_value": str(
#                     invitation.invitation_code
#                 ),
#             }
#         )


# class VisitorVisitViewSet(
#     ModelViewSet
# ):

#     queryset = (
#         VisitorVisit.objects
#         .select_related(
#             "invitation",
#             "invitation__host",
#             "invitation__host__user",
#             "invitation__property",
#             "gate",
#             "scanned_by",
#         )
#         .all()
#     )

#     serializer_class = (
#         VisitorVisitSerializer
#     )

    
#     permission_classes = [
#         IsAuthenticated,
#         IsAdminOrSecurity,
#     ]

#     search_fields = [
#         "invitation__visitor_name",
#         "invitation__visitor_phone",
#         "invitation__visitor_home_address",
#         "invitation__host_name_snapshot",
#         "invitation__property__address",
#     ]

#     filterset_fields = [
#         "status",
#         "gate",
#         "invitation__property",
#         "invitation__host",
#     ]

#     ordering = [
#         "-time_in"
#     ]

#     def get_queryset(self):

#         queryset = super().get_queryset()

#         user = self.request.user

#         if user.role == user.Roles.ADMIN:
#             return queryset

#         return queryset.filter(
#             invitation__host__user=user
#         )

#     @action(
#         detail=False,
#         methods=["get"],
#         url_path="history",
#     )
#     def history(
#         self,
#         request,
#     ):

#         visits = self.get_queryset()

#         serializer = self.get_serializer(
#             visits,
#             many=True,
#         )

#         return Response(
#             serializer.data
#         )

#     @action(
#         detail=False,
#         methods=["get"],
#         url_path="inside",
#     )
#     def inside(
#         self,
#         request,
#     ):

#         visits = (
#             self.get_queryset()
#             .filter(
#                 status=(
#                     VisitorVisit.Status.INSIDE
#                 )
#             )
#         )

#         serializer = self.get_serializer(
#             visits,
#             many=True,
#         )

#         return Response(
#             serializer.data
#         )

#     @action(
#         detail=False,
#         methods=["get"],
#         url_path="completed",
#     )
#     def completed(
#         self,
#         request,
#     ):

#         visits = (
#             self.get_queryset()
#             .filter(
#                 status=(
#                     VisitorVisit.Status.COMPLETED
#                 )
#             )
#         )

#         serializer = self.get_serializer(
#             visits,
#             many=True,
#         )

#         return Response(
#             serializer.data
#         )
    

#     # ============================================================
#     # SCAN VISITOR QR
#     # ============================================================

#     @action(
#         detail=False,
#         methods=["post"],
#         url_path="scan",
#     )
#     def scan(
#         self,
#         request,
#     ):

#         qr_value = (
#             request.data.get(
#                 "qr_value"
#             )
#         )

#         gate_id = (
#             request.data.get(
#                 "gate"
#             )
#         )


#         if not qr_value:

#             return Response(
#                 {
#                     "detail":
#                         "QR value is required."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST,
#             )


#         # --------------------------------------------------------
#         # FIND INVITATION
#         # --------------------------------------------------------

#         try:

#             invitation = (
#                 VisitorInvitation.objects
#                 .select_related(
#                     "host",
#                     "host__user",
#                     "property",
#                 )
#                 .get(
#                     invitation_code=qr_value
#                 )
#             )

#         except VisitorInvitation.DoesNotExist:

#             return Response(
#                 {
#                     "allowed": False,

#                     "reason":
#                         "INVALID",

#                     "detail":
#                         "This visitor QR code is not recognized.",
#                 },
#                 status=status.HTTP_404_NOT_FOUND,
#             )


#         # --------------------------------------------------------
#         # CHECK INVITATION STATUS
#         # --------------------------------------------------------

#         if invitation.status == (
#             VisitorInvitation.Status.CANCELLED
#         ):

#             return Response(
#                 {
#                     "allowed": False,

#                     "reason":
#                         "CANCELLED",

#                     "detail":
#                         "This visitor invitation has been cancelled.",
#                 },
#                 status=status.HTTP_403_FORBIDDEN,
#             )


#         if invitation.status == (
#             VisitorInvitation.Status.EXPIRED
#         ):

#             return Response(
#                 {
#                     "allowed": False,

#                     "reason":
#                         "EXPIRED",

#                     "detail":
#                         "This visitor invitation has expired.",
#                 },
#                 status=status.HTTP_403_FORBIDDEN,
#             )


#         if invitation.status == (
#             VisitorInvitation.Status.USED
#         ):

#             return Response(
#                 {
#                     "allowed": False,

#                     "reason":
#                         "USED",

#                     "detail":
#                         "This visitor invitation has already been used.",
#                 },
#                 status=status.HTTP_403_FORBIDDEN,
#             )


#         # --------------------------------------------------------
#         # SAFETY CHECK
#         # --------------------------------------------------------

#         if (
#             invitation.visit_date
#             != timezone.localdate()
#         ):

#             return Response(
#                 {
#                     "allowed": False,

#                     "reason":
#                         "WRONG_DATE",

#                     "detail":
#                         "This visitor invitation is not valid for today.",
#                 },
#                 status=status.HTTP_403_FORBIDDEN,
#             )


#         # --------------------------------------------------------
#         # GATE
#         # --------------------------------------------------------

#         from security.models import Gate


#         gate = None


#         if gate_id:

#             gate = (
#                 Gate.objects
#                 .filter(
#                     pk=gate_id,
#                     is_active=True,
#                 )
#                 .first()
#             )


#             if not gate:

#                 return Response(
#                     {
#                         "detail":
#                             "The selected gate is not active."
#                     },
#                     status=status.HTTP_400_BAD_REQUEST,
#                 )


#         if not gate:

#             gate = (
#                 Gate.objects
#                 .filter(
#                     is_active=True,
#                 )
#                 .order_by(
#                     "-is_primary",
#                     "id",
#                 )
#                 .first()
#             )


#         if not gate:

#             return Response(
#                 {
#                     "detail":
#                         "No active gate is configured."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST,
#             )


#         # --------------------------------------------------------
#         # CREATE VISITOR VISIT
#         # --------------------------------------------------------

#         with transaction.atomic():

#             visit = (
#                 VisitorVisit.objects
#                 .select_for_update()
#                 .filter(
#                     invitation=invitation
#                 )
#                 .first()
#             )


#             if visit:

#                 return Response(
#                     {
#                         "allowed": False,

#                         "reason":
#                             "USED",

#                         "detail":
#                             "A gate visit already exists for this invitation.",
#                     },
#                     status=status.HTTP_409_CONFLICT,
#                 )


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


#             # IMPORTANT:
#             # Invitation lifecycle becomes USED.
#             invitation.status = (
#                 VisitorInvitation.Status.USED
#             )

#             invitation.save(
#                 update_fields=[
#                     "status",
#                     "updated_at",
#                 ]
#             )


#         # --------------------------------------------------------
#         # RESPONSE
#         # --------------------------------------------------------

#         return Response(
#             {
#                 "allowed":
#                     True,

#                 "message":
#                     "Visitor authorized. Entry recorded.",

#                 "visitor_name":
#                     invitation.visitor_name,

#                 "host_name":
#                     invitation.host_name_snapshot,

#                 "property_address":
#                     invitation.host_address_snapshot,

#                 "visit_date":
#                     invitation.visit_date,

#                 "expected_time_in":
#                     invitation.expected_time_in,

#                 "expected_time_out":
#                     invitation.expected_time_out,

#                 "gate_name":
#                     gate.name,

#                 "invitation":
#                     VisitorInvitationSerializer(
#                         invitation
#                     ).data,

#                 "visit":
#                     VisitorVisitSerializer(
#                         visit
#                     ).data,
#             },

#             status=status.HTTP_201_CREATED,
#         )


#     # ============================================================
#     # VISITORS CURRENTLY INSIDE
#     # ============================================================

#     @action(
#         detail=False,
#         methods=["get"],
#         url_path="inside",
#     )
#     def inside(
#         self,
#         request,
#     ):

#         visits = (
#             self.get_queryset()
#             .filter(
#                 status=(
#                     VisitorVisit.Status.INSIDE
#                 )
#             )
#             .select_related(
#                 "invitation",
#                 "invitation__host",
#                 "invitation__property",
#                 "gate",
#                 "scanned_by",
#             )
#             .order_by(
#                 "time_in"
#             )
#         )


#         serializer = (
#             self.get_serializer(
#                 visits,
#                 many=True,
#             )
#         )


#         return Response(
#             serializer.data
#         )


#     # ============================================================
#     # CHECK OUT VISITOR
#     # ============================================================

#     @action(
#         detail=True,
#         methods=["post"],
#         url_path="checkout",
#     )
#     def checkout(
#         self,
#         request,
#         pk=None,
#     ):

#         with transaction.atomic():

#             visit = (
#                 self.get_queryset()
#                 .select_for_update()
#                 .select_related(
#                     "invitation",
#                     "gate",
#                 )
#                 .filter(
#                     pk=pk
#                 )
#                 .first()
#             )


#             if not visit:

#                 return Response(
#                     {
#                         "detail":
#                             "Visitor visit was not found."
#                     },
#                     status=status.HTTP_404_NOT_FOUND,
#                 )


#             if visit.status != (
#                 VisitorVisit.Status.INSIDE
#             ):

#                 return Response(
#                     {
#                         "detail":
#                             "Only visitors currently inside can be checked out."
#                     },
#                     status=status.HTTP_400_BAD_REQUEST,
#                 )


#             visit.time_out = (
#                 timezone.now()
#             )

#             visit.status = (
#                 VisitorVisit.Status.COMPLETED
#             )

#             visit.save(
#                 update_fields=[
#                     "time_out",
#                     "status",
#                     "updated_at",
#                 ]
#             )


#         return Response(
#             {
#                 "message":
#                     "Visitor checked out successfully.",

#                 "visit":
#                     self.get_serializer(
#                         visit
#                     ).data,
#             }
#         )


#     # ============================================================
#     # GATE HISTORY
#     # ============================================================

#     @action(
#         detail=False,
#         methods=["get"],
#         url_path="history",
#     )
#     def history(
#         self,
#         request,
#     ):

#         visits = (
#             self.get_queryset()
#             .select_related(
#                 "invitation",
#                 "invitation__host",
#                 "invitation__property",
#                 "gate",
#                 "scanned_by",
#             )
#             .order_by(
#                 "-time_in"
#             )
#         )


#         serializer = (
#             self.get_serializer(
#                 visits,
#                 many=True,
#             )
#         )


#         return Response(
#             serializer.data
#         )
