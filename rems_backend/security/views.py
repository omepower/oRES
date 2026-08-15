
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

from visitors.models import (
    VisitorInvitation,
    VisitorVisit,
)

from .models import Gate
from .serializers import (
    GateSerializer,
    VisitorScanSerializer,
)


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
    #
    # Security officers may READ gates and scan visitors.
    # Only administrators may modify gate configuration.
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

            except (
                VisitorInvitation.DoesNotExist
            ):

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


            # ------------------------------------------------
            # EXPIRE OVERDUE INVITATION
            # ------------------------------------------------

            invitation.expire_if_needed()


            # ------------------------------------------------
            # STATUS
            # ------------------------------------------------

            if invitation.status == (
                VisitorInvitation.Status.CANCELLED
            ):

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


            if invitation.status == (
                VisitorInvitation.Status.USED
            ):

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


            if invitation.status == (
                VisitorInvitation.Status.EXPIRED
            ):

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


            # ------------------------------------------------
            # VISIT DATE
            # ------------------------------------------------

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


            # ------------------------------------------------
            # VISIT TIME WINDOW
            # ------------------------------------------------

            current_time = (
                timezone.localtime().time()
            )


            if current_time < (
                invitation.expected_time_in
            ):

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


            # ------------------------------------------------
            # EXISTING VISIT
            # ------------------------------------------------

            if hasattr(
                invitation,
                "visit",
            ):

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


            # ------------------------------------------------
            # CREATE VISIT
            # ------------------------------------------------

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


            # ------------------------------------------------
            # CONSUME INVITATION
            # ------------------------------------------------

            invitation.status = (
                VisitorInvitation.Status.USED
            )


            invitation.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )


        # ====================================================
        # SUCCESS
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


# from rest_framework.decorators import action
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from rest_framework.viewsets import ModelViewSet

# from accounts.permissions import (
#     IsAdminOrSecurity,
# )

# from .models import Gate
# from .serializers import GateSerializer

# from django.db import transaction
# from django.utils import timezone

# from rest_framework import status
# from rest_framework.decorators import action

# from visitors.models import (
#     VisitorInvitation,
#     VisitorVisit,
# )


# class GateViewSet(ModelViewSet):

#     queryset = Gate.objects.all()

#     serializer_class = GateSerializer

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

#         serializer = self.get_serializer(
#             gate
#         )

#         return Response(
#             serializer.data
#         )

#     @action(
#         detail=False,
#         methods=["get"],
#         url_path="active",
#     )
#     def active(
#         self,
#         request,
#     ):

#         gates = Gate.objects.filter(
#             is_active=True,
#         )

#         serializer = self.get_serializer(
#             gates,
#             many=True,
#         )

#         return Response(
#             serializer.data
#         )
        
#     @action(
#     detail=False,
#     methods=["post"],
#     url_path="visitor-scan",
#     )
#     def visitor_scan(
#         self,
#         request,
#     ):

#         from .serializers import (
#             VisitorScanSerializer,
#         )

#         serializer = VisitorScanSerializer(
#             data=request.data
#         )

#         serializer.is_valid(
#             raise_exception=True
#         )

#         invitation_code = serializer.validated_data[
#             "invitation_code"
#         ]

#         gate = serializer.validated_data[
#             "gate"
#         ]

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
#                         invitation_code=invitation_code
#                     )
#                 )

#             except VisitorInvitation.DoesNotExist:

#                 return Response(
#                     {
#                         "success": False,
#                         "status": "DENIED",
#                         "reason":
#                             "Invalid visitor invitation."
#                     },
#                     status=(
#                         status.HTTP_404_NOT_FOUND
#                     ),
#                 )

#             # ------------------------------------------------
#             # Invitation status
#             # ------------------------------------------------

#             if invitation.status == (
#                 VisitorInvitation.Status.CANCELLED
#             ):

#                 return Response(
#                     {
#                         "success": False,
#                         "status": "DENIED",
#                         "reason":
#                             "This visitor invitation has been cancelled."
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
#                             "This visitor invitation has already been used."
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
#                             "This visitor invitation has expired."
#                     },
#                     status=(
#                         status.HTTP_400_BAD_REQUEST
#                     ),
#                 )

#             # ------------------------------------------------
#             # Visit date
#             # ------------------------------------------------

#             today = timezone.localdate()

#             if invitation.visit_date < today:

#                 invitation.status = (
#                     VisitorInvitation.Status.EXPIRED
#                 )

#                 invitation.save()

#                 return Response(
#                     {
#                         "success": False,
#                         "status": "DENIED",
#                         "reason":
#                             "This visitor invitation has expired."
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
#                             "This visitor invitation is scheduled for another date."
#                     },
#                     status=(
#                         status.HTTP_400_BAD_REQUEST
#                     ),
#                 )

#             # ------------------------------------------------
#             # Make sure this invitation has not already
#             # generated a visit.
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
#                             "This visitor invitation has already been used."
#                     },
#                     status=(
#                         status.HTTP_400_BAD_REQUEST
#                     ),
#                 )

#             # ------------------------------------------------
#             # Create actual visitor visit
#             # ------------------------------------------------

#             visit = VisitorVisit.objects.create(
#                 invitation=invitation,
#                 gate=gate,
#                 time_in=timezone.now(),
#                 status=(
#                     VisitorVisit.Status.INSIDE
#                 ),
#                 scanned_by=request.user,
#             )

#             # ------------------------------------------------
#             # Consume invitation
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
#             status=status.HTTP_201_CREATED,
#         )