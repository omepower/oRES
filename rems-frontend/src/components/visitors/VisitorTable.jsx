import {
    BsQrCode,
    BsEye,
} from "react-icons/bs";

import VisitorStatusBadge from "./VisitorStatusBadge";

const formatDate = (date) => {
    if (!date) {
        return "—";
    }

    return new Date(
        `${date}T00:00:00`
    ).toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        }
    );
};

const formatTime = (time) => {
    if (!time) {
        return "—";
    }

    const [
        hours,
        minutes,
    ] = time.split(":");

    const date =
        new Date();

    date.setHours(
        Number(hours),
        Number(minutes),
        0,
        0
    );

    return date.toLocaleTimeString(
        undefined,
        {
            hour: "numeric",
            minute: "2-digit",
        }
    );
};

export default function VisitorTable({
    invitations = [],
    visits = [],
    onView,
}) {
    const getVisitForInvitation =
        (invitationId) => {
            return visits.find(
                (visit) =>
                    visit.invitation ===
                    invitationId ||
                    visit.invitation?.id ===
                    invitationId
            );
        };

    if (!invitations.length) {
        return (
            <div className="rems-empty-state">
                <div className="rems-empty-icon">
                    <BsQrCode />
                </div>

                <h5>
                    No visitor invitations
                </h5>

                <p>
                    There are currently no
                    visitor invitation records
                    to display.
                </p>
            </div>
        );
    }

    return (
        <div className="rems-table-card">

            <div className="rems-table-wrapper">

                <table className="table rems-table align-middle mb-0">

                    <thead>
                        <tr>
                            <th>
                                Visitor
                            </th>

                            <th>
                                Host
                            </th>

                            <th>
                                Property
                            </th>

                            <th>
                                Visit Date
                            </th>

                            <th>
                                Expected Time
                            </th>

                            <th>
                                Invitation
                            </th>

                            <th>
                                Visit
                            </th>

                            <th className="text-end">
                                Action
                            </th>
                        </tr>
                    </thead>

                    <tbody>

                        {invitations.map(
                            (invitation) => {
                                const visit =
                                    getVisitForInvitation(
                                        invitation.id
                                    );

                                return (
                                    <tr
                                        key={
                                            invitation.id
                                        }
                                    >

                                        {/* Visitor */}
                                        <td>
                                            <div className="rems-table-primary">
                                                {
                                                    invitation.visitor_name
                                                }
                                            </div>

                                            <div className="rems-table-secondary">
                                                {
                                                    invitation.visitor_phone
                                                }
                                            </div>
                                        </td>

                                        {/* Host */}
                                        <td>
                                            <div className="rems-table-primary">
                                                {
                                                    invitation.host_name_snapshot ||
                                                    invitation.host?.full_name ||
                                                    invitation.host_name ||
                                                    "—"
                                                }
                                            </div>

                                            <div className="rems-table-secondary">
                                                {
                                                    invitation.host_phone_snapshot ||
                                                    invitation.host?.phone ||
                                                    ""
                                                }
                                            </div>
                                        </td>

                                        {/* Property */}
                                        <td>
                                            <div className="rems-table-primary">
                                                {
                                                    invitation.property?.address ||
                                                    invitation.property_address ||
                                                    invitation.host_address_snapshot ||
                                                    "—"
                                                }
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td>
                                            {
                                                formatDate(
                                                    invitation.visit_date
                                                )
                                            }
                                        </td>

                                        {/* Time */}
                                        <td>
                                            <div>
                                                {
                                                    formatTime(
                                                        invitation.expected_time_in
                                                    )
                                                }
                                            </div>

                                            <div className="rems-table-secondary">
                                                to{" "}
                                                {
                                                    formatTime(
                                                        invitation.expected_time_out
                                                    )
                                                }
                                            </div>
                                        </td>

                                        {/* Invitation */}
                                        <td>
                                            <VisitorStatusBadge
                                                status={
                                                    invitation.status
                                                }
                                            />
                                        </td>

                                        {/* Visit */}
                                        <td>
                                            {visit ? (
                                                <VisitorStatusBadge
                                                    status={
                                                        visit.status
                                                    }
                                                />
                                            ) : (
                                                <span className="text-muted small">
                                                    No visit
                                                </span>
                                            )}
                                        </td>

                                        {/* Action */}
                                        <td className="text-end">

                                            <button
                                                type="button"
                                                className="btn rems-table-action"
                                                onClick={() =>
                                                    onView(
                                                        invitation,
                                                        visit
                                                    )
                                                }
                                                title="View visitor details"
                                            >
                                                <BsEye />
                                            </button>

                                        </td>

                                    </tr>
                                );
                            }
                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}