from django.contrib import admin

from .models import (
    VisitorInvitation,
    VisitorVisit,
)


@admin.register(VisitorInvitation)
class VisitorInvitationAdmin(
    admin.ModelAdmin
):

    list_display = (
        "visitor_name",
        "host_name_snapshot",
        "property",
        "visit_date",
        "expected_time_in",
        "expected_time_out",
        "status",
        "qr_generated_at",
        "created_at",
    )

    list_filter = (
        "status",
        "visit_date",
        "host_type_snapshot",
        "created_at",
    )

    search_fields = (
        "visitor_name",
        "visitor_phone",
        "visitor_home_address",
        "host_name_snapshot",
        "host_phone_snapshot",
        "property__address",
        "invitation_code",
    )

    readonly_fields = (
        "invitation_code",
        "host_name_snapshot",
        "host_address_snapshot",
        "host_phone_snapshot",
        "host_type_snapshot",
        "qr_generated_at",
        "cancelled_at",
        "created_at",
        "updated_at",
    )

    ordering = (
        "-created_at",
    )


@admin.register(VisitorVisit)
class VisitorVisitAdmin(
    admin.ModelAdmin
):

    list_display = (
        "visitor_name",
        "host_name",
        "gate",
        "time_in",
        "time_out",
        "status",
        "scanned_by",
        "created_at",
    )

    list_filter = (
        "status",
        "gate",
        "created_at",
    )

    search_fields = (
        "invitation__visitor_name",
        "invitation__visitor_phone",
        "invitation__host_name_snapshot",
        "invitation__property__address",
        "scanned_by__username",
    )

    readonly_fields = (
        "time_in",
        "time_out",
        "scanned_by",
        "created_at",
        "updated_at",
    )

    ordering = (
        "-time_in",
    )

    def visitor_name(
        self,
        obj,
    ):
        return obj.invitation.visitor_name

    visitor_name.short_description = "Visitor"

    def host_name(
        self,
        obj,
    ):
        return obj.invitation.host_name_snapshot

    host_name.short_description = "Host"