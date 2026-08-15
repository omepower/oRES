
import {
    BsPerson,
    BsHouse,
    BsTelephone,
    BsCalendar,
    BsClock,
    BsQrCode,
    BsDoorOpen,
} from "react-icons/bs";

import VisitorStatusBadge
    from "./VisitorStatusBadge";


const formatDate = (
    date
) => {

    if (!date) {
        return "—";
    }

    return new Date(
        `${date}T00:00:00`
    ).toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "long",
            day: "numeric",
        }
    );
};


const formatDateTime = (
    value
) => {

    if (!value) {
        return "—";
    }

    return new Date(
        value
    ).toLocaleString(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short",
        }
    );
};


const DetailItem = ({
    icon: Icon,
    label,
    value,
}) => (

    <div className="rems-detail-item">

        <div className="rems-detail-icon">

            <Icon />

        </div>


        <div>

            <div className="rems-detail-label">
                {label}
            </div>

            <div className="rems-detail-value">
                {value || "—"}
            </div>

        </div>

    </div>
);


export default function VisitorDetailsModal({
    invitation,
    visit,
    onClose,
}) {

    if (!invitation) {
        return null;
    }


    return (

        <div
            className="rems-modal-backdrop"
            style={{
                zIndex: 3000,
            }}
            onMouseDown={(
                event
            ) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    onClose();

                }

            }}
        >

            <div
                className="rems-modal rems-management-modal"
                style={{
                    position:
                        "relative",
                    zIndex:
                        3001,
                    width:
                        "min(100%, 820px)",
                }}
                onMouseDown={(
                    event
                ) =>
                    event.stopPropagation()
                }
            >


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="rems-modal-header">

                    <div>

                        <div className="rems-page-eyebrow">
                            VISITOR INVITATION
                        </div>


                        <div className="rems-modal-title">

                            {
                                invitation.visitor_name ||
                                "Visitor"
                            }

                        </div>


                        <div className="rems-modal-subtitle">

                            Invitation details and
                            community access information.

                        </div>

                    </div>


                    <button
                        type="button"
                        className="rems-modal-close"
                        onClick={
                            onClose
                        }
                        aria-label="Close"
                    >

                        <i className="bi bi-x-lg" />

                    </button>

                </div>


                {/* =================================================
                    BODY
                ================================================= */}

                <div className="rems-modal-body">


                    {/* =================================================
                        VISITOR
                    ================================================= */}

                    <div className="rems-form-section">

                        <div className="rems-form-section-title">

                            <i className="bi bi-person me-2" />

                            Visitor Information

                        </div>


                        <div className="row g-3">


                            <div className="col-12 col-md-6">

                                <DetailItem
                                    icon={BsPerson}
                                    label="Visitor Name"
                                    value={
                                        invitation.visitor_name
                                    }
                                />

                            </div>


                            <div className="col-12 col-md-6">

                                <DetailItem
                                    icon={BsTelephone}
                                    label="Phone Number"
                                    value={
                                        invitation.visitor_phone
                                    }
                                />

                            </div>


                            <div className="col-12">

                                <DetailItem
                                    icon={BsHouse}
                                    label="Visitor Home Address"
                                    value={
                                        invitation.visitor_home_address
                                    }
                                />

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        HOST
                    ================================================= */}

                    <div className="rems-form-section">

                        <div className="rems-form-section-title">

                            <i className="bi bi-house me-2" />

                            Host Information

                        </div>


                        <div className="row g-3">


                            <div className="col-12 col-md-6">

                                <DetailItem
                                    icon={BsPerson}
                                    label="Host"
                                    value={
                                        invitation.host_name ||
                                        invitation.host_name_snapshot
                                    }
                                />

                            </div>


                            <div className="col-12 col-md-6">

                                <DetailItem
                                    icon={BsTelephone}
                                    label="Host Phone"
                                    value={
                                        invitation.host_phone ||
                                        invitation.host_phone_snapshot
                                    }
                                />

                            </div>


                            <div className="col-12">

                                <DetailItem
                                    icon={BsHouse}
                                    label="Property"
                                    value={
                                        invitation.property_address ||
                                        invitation.host_address_snapshot
                                    }
                                />

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        VISIT
                    ================================================= */}

                    <div className="rems-form-section">

                        <div className="rems-form-section-title">

                            <i className="bi bi-calendar-event me-2" />

                            Visit Information

                        </div>


                        <div className="row g-3">


                            <div className="col-12 col-md-6">

                                <DetailItem
                                    icon={BsCalendar}
                                    label="Visit Date"
                                    value={
                                        formatDate(
                                            invitation.visit_date
                                        )
                                    }
                                />

                            </div>


                            <div className="col-12 col-md-6">

                                <DetailItem
                                    icon={BsClock}
                                    label="Expected Time"
                                    value={
                                        `${invitation.expected_time_in || "—"} - ${invitation.expected_time_out || "—"}`
                                    }
                                />

                            </div>


                            <div className="col-12 col-md-6">

                                <div className="rems-detail-item">

                                    <div className="rems-detail-icon">

                                        <BsQrCode />

                                    </div>


                                    <div>

                                        <div className="rems-detail-label">
                                            Invitation Status
                                        </div>

                                        <VisitorStatusBadge
                                            status={
                                                invitation.status
                                            }
                                        />

                                    </div>

                                </div>

                            </div>


                            <div className="col-12 col-md-6">

                                <div className="rems-detail-item">

                                    <div className="rems-detail-icon">

                                        <BsDoorOpen />

                                    </div>


                                    <div>

                                        <div className="rems-detail-label">
                                            Visit Status
                                        </div>


                                        {visit ? (

                                            <VisitorStatusBadge
                                                status={
                                                    visit.status
                                                }
                                            />

                                        ) : (

                                            <span className="text-muted">
                                                No gate visit
                                            </span>

                                        )}

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        GATE RECORD
                    ================================================= */}

                    {visit && (

                        <div className="rems-form-section">

                            <div className="rems-form-section-title">

                                <i className="bi bi-door-open me-2" />

                                Gate Record

                            </div>


                            <div className="row g-3">


                                <div className="col-12 col-md-6">

                                    <DetailItem
                                        icon={BsDoorOpen}
                                        label="Gate"
                                        value={
                                            visit.gate?.name ||
                                            visit.gate_name
                                        }
                                    />

                                </div>


                                <div className="col-12 col-md-6">

                                    <DetailItem
                                        icon={BsPerson}
                                        label="Scanned By"
                                        value={
                                            visit.scanned_by?.username ||
                                            visit.scanned_by_name
                                        }
                                    />

                                </div>


                                <div className="col-12 col-md-6">

                                    <DetailItem
                                        icon={BsClock}
                                        label="Time In"
                                        value={
                                            formatDateTime(
                                                visit.time_in
                                            )
                                        }
                                    />

                                </div>


                                <div className="col-12 col-md-6">

                                    <DetailItem
                                        icon={BsClock}
                                        label="Time Out"
                                        value={
                                            formatDateTime(
                                                visit.time_out
                                            )
                                        }
                                    />

                                </div>

                            </div>

                        </div>

                    )}


                </div>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="rems-modal-footer">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={
                            onClose
                        }
                    >

                        Close

                    </button>

                </div>

            </div>

        </div>
    );
}
