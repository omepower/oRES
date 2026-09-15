import {
    BsArrowRight,
    BsCalendar3,
    BsClockHistory,
    BsCodeSquare,
    BsFileEarmarkText,
    BsGlobe,
    BsPerson,
    BsShieldCheck,
    BsXCircle,
} from "react-icons/bs";


/* ============================================================
   HELPERS
============================================================ */

const normalizeStatus = (
    value
) => {
    return String(
        value || ""
    )
        .trim()
        .toUpperCase();
};


const formatDateTime = (
    value
) => {
    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }

    return date.toLocaleString(
        undefined,
        {
            year: "numeric",
            month: "long",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }
    );
};


const formatValue = (
    value
) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    if (
        typeof value === "string"
    ) {
        return value;
    }

    if (
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return String(value);
    }

    try {
        return JSON.stringify(
            value,
            null,
            2
        );
    } catch {
        return String(value);
    }
};


const humanize = (
    value
) => {
    return String(
        value || ""
    )
        .replaceAll(
            "_",
            " "
        )
        .replaceAll(
            "-",
            " "
        )
        .replace(
            /\b\w/g,
            (
                letter
            ) =>
                letter.toUpperCase()
        )
        .trim() || "—";
};


const getSeverityClass = (
    severity
) => {
    switch (
        normalizeStatus(
            severity
        )
    ) {
        case "CRITICAL":
            return "rems-status-danger";

        case "HIGH":
            return "rems-status-danger";

        case "MEDIUM":
            return "rems-status-warning";

        case "LOW":
            return "rems-status-success";

        case "INFO":
            return "rems-status-secondary";

        default:
            return "rems-status-secondary";
    }
};


const getResultClass = (
    result
) => {
    switch (
        normalizeStatus(
            result
        )
    ) {
        case "SUCCESS":
            return "rems-status-success";

        case "FAILED":
            return "rems-status-danger";

        case "DENIED":
            return "rems-status-warning";

        default:
            return "rems-status-secondary";
    }
};


const getActorName = (
    event
) => {
    return (
        event?.actor_name ||
        event?.actor_full_name ||
        event?.actor_username ||
        event?.actor?.full_name ||
        event?.actor?.username ||
        event?.actor ||
        "System"
    );
};


const getSubjectLabel = (
    event
) => {
    const objectType =
        event?.object_type ||
        event?.subject_type;

    const objectId =
        event?.object_id ||
        event?.subject_id;

    if (
        objectType &&
        objectId
    ) {
        return `${humanize(objectType)} #${objectId}`;
    }

    if (
        event?.object_label
    ) {
        return String(
            event.object_label
        );
    }

    if (
        event?.subject
    ) {
        return String(
            event.subject
        );
    }

    return "—";
};


/* ============================================================
   JSON BLOCK
============================================================ */

function JsonBlock({
    value,
}) {
    const hasValue =
        value !== null &&
        value !== undefined &&
        value !== "";

    if (!hasValue) {
        return (
            <div
                className="small"
                style={{
                    opacity: 0.6,
                }}
            >
                No data recorded.
            </div>
        );
    }

    return (
        <pre
            className="mb-0 p-3 rounded-3"
            style={{
                whiteSpace:
                    "pre-wrap",
                wordBreak:
                    "break-word",
                background:
                    "rgba(0,0,0,0.18)",
                border:
                    "1px solid rgba(255,255,255,0.08)",
                color:
                    "inherit",
                fontSize:
                    "0.78rem",
                lineHeight:
                    1.55,
                maxHeight:
                    "280px",
                overflowY:
                    "auto",
            }}
        >
            {formatValue(
                value
            )}
        </pre>
    );
}


/* ============================================================
   COMPONENT
============================================================ */

export default function AuditEventDetailsModal({
    event,
    show,
    onClose,
}) {
    if (
        !show ||
        !event
    ) {
        return null;
    }


    const actorName =
        getActorName(
            event
        );

    const actorRole =
        event?.actor_role_display ||
        event?.actor_role ||
        "—";

    const moduleName =
        event?.module_display ||
        event?.module ||
        "—";

    const actionName =
        event?.action_display ||
        event?.action ||
        "—";

    const eventType =
        event?.event_type_display ||
        event?.event_type ||
        "—";

    const result =
        event?.result_display ||
        event?.result ||
        "—";

    const severity =
        event?.severity_display ||
        event?.severity ||
        "—";

    const timestamp =
        event?.timestamp ||
        event?.created_at;

    const eventId =
        event?.event_id ||
        event?.id ||
        "—";

    const description =
        event?.description ||
        event?.message ||
        "No description recorded.";

    const ipAddress =
        event?.ip_address ||
        "—";

    const userAgent =
        event?.user_agent ||
        "—";

    const objectType =
        event?.object_type ||
        "—";

    const objectId =
        event?.object_id ||
        "—";

    const beforeData =
        event?.before_data;

    const afterData =
        event?.after_data;

    const metadata =
        event?.metadata;


    return (
        <div
            className="rems-modal-backdrop"
            style={{
                zIndex:
                    4000,
                backdropFilter:
                    "blur(8px)",
            }}
            onMouseDown={(
                mouseEvent
            ) => {
                if (
                    mouseEvent.target ===
                    mouseEvent.currentTarget
                ) {
                    onClose?.();
                }
            }}
        >

            <div
                className="rems-modal rems-management-modal"
                style={{
                    position:
                        "relative",
                    zIndex:
                        4001,
                    width:
                        "min(100%, 1050px)",
                    maxHeight:
                        "92vh",
                    overflowY:
                        "auto",
                    borderRadius:
                        "20px",
                }}
                onMouseDown={(
                    mouseEvent
                ) =>
                    mouseEvent.stopPropagation()
                }
            >

                {/* =====================================================
                    HEADER
                ===================================================== */}

                <div
                    className="rems-modal-header"
                    style={{
                        position:
                            "sticky",
                        top:
                            0,
                        zIndex:
                            10,
                        backdropFilter:
                            "blur(18px)",
                    }}
                >

                    <div>

                        <div className="rems-page-eyebrow">
                            AUDIT & COMPLIANCE
                        </div>

                        <div className="rems-modal-title">
                            Audit Event Details
                        </div>

                        <div className="rems-modal-subtitle">
                            Event ID: {eventId}
                        </div>

                    </div>


                    <button
                        type="button"
                        className="rems-modal-close"
                        onClick={
                            onClose
                        }
                        aria-label="Close audit event details"
                    >
                        <BsXCircle />
                    </button>

                </div>


                {/* =====================================================
                    BODY
                ===================================================== */}

                <div className="rems-modal-body">

                    {/* =================================================
                        EVENT SUMMARY
                    ================================================= */}

                    <div className="rems-form-section mb-3">

                        <div className="rems-form-section-title">
                            <BsFileEarmarkText className="me-2" />
                            Event Summary
                        </div>


                        <div className="row g-3">

                            <div className="col-12 col-md-8">

                                <div className="rems-table-secondary">
                                    Description
                                </div>

                                <div
                                    className="rems-table-primary mt-1"
                                    style={{
                                        lineHeight:
                                            1.6,
                                    }}
                                >
                                    {description}
                                </div>

                            </div>


                            <div className="col-12 col-md-4">

                                <div className="rems-table-secondary">
                                    Event ID
                                </div>

                                <div className="rems-table-primary mt-1">
                                    {eventId}
                                </div>

                            </div>


                            <div className="col-6 col-lg-3">

                                <div className="rems-table-secondary">
                                    Module
                                </div>

                                <div className="rems-table-primary mt-1">
                                    {humanize(
                                        moduleName
                                    )}
                                </div>

                            </div>


                            <div className="col-6 col-lg-3">

                                <div className="rems-table-secondary">
                                    Action
                                </div>

                                <div className="rems-table-primary mt-1">
                                    {humanize(
                                        actionName
                                    )}
                                </div>

                            </div>


                            <div className="col-6 col-lg-3">

                                <div className="rems-table-secondary">
                                    Result
                                </div>

                                <div className="mt-1">

                                    <span
                                        className={`rems-status-badge ${getResultClass(
                                            result
                                        )}`}
                                    >
                                        <span className="rems-status-dot" />

                                        {humanize(
                                            result
                                        )}
                                    </span>

                                </div>

                            </div>


                            <div className="col-6 col-lg-3">

                                <div className="rems-table-secondary">
                                    Severity
                                </div>

                                <div className="mt-1">

                                    <span
                                        className={`rems-status-badge ${getSeverityClass(
                                            severity
                                        )}`}
                                    >
                                        <span className="rems-status-dot" />

                                        {humanize(
                                            severity
                                        )}
                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        ACTOR
                    ================================================= */}

                    <div className="rems-form-section mb-3">

                        <div className="rems-form-section-title">
                            <BsPerson className="me-2" />
                            Actor
                        </div>


                        <div className="row g-3">

                            <div className="col-12 col-md-6">

                                <div
                                    className="p-3 rounded-3 h-100"
                                    style={{
                                        background:
                                            "rgba(255,255,255,0.025)",
                                        border:
                                            "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >

                                    <div className="rems-table-secondary">
                                        Performed By
                                    </div>

                                    <div className="rems-table-primary mt-1">
                                        {actorName}
                                    </div>

                                </div>

                            </div>


                            <div className="col-12 col-md-6">

                                <div
                                    className="p-3 rounded-3 h-100"
                                    style={{
                                        background:
                                            "rgba(255,255,255,0.025)",
                                        border:
                                            "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >

                                    <div className="rems-table-secondary">
                                        Actor Role
                                    </div>

                                    <div className="rems-table-primary mt-1">
                                        {humanize(
                                            actorRole
                                        )}
                                    </div>

                                </div>

                            </div>


                            <div className="col-12">

                                <div
                                    className="p-3 rounded-3"
                                    style={{
                                        background:
                                            "rgba(255,255,255,0.025)",
                                        border:
                                            "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >

                                    <div className="d-flex align-items-center gap-2 mb-2">

                                        <BsShieldCheck />

                                        <div className="rems-table-secondary">
                                            Subject / Affected Object
                                        </div>

                                    </div>


                                    <div className="d-flex align-items-center flex-wrap gap-2">

                                        <span className="rems-status-badge rems-status-secondary">
                                            {humanize(
                                                objectType
                                            )}
                                        </span>

                                        <BsArrowRight
                                            style={{
                                                opacity:
                                                    0.55,
                                            }}
                                        />

                                        <span className="rems-table-primary">
                                            {getSubjectLabel(
                                                event
                                            )}
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        EVENT TYPE + TIME
                    ================================================= */}

                    <div className="rems-form-section mb-3">

                        <div className="rems-form-section-title">
                            Event Context
                        </div>


                        <div className="row g-3">

                            <div className="col-12 col-md-6">

                                <div
                                    className="d-flex align-items-start gap-3 p-3 rounded-3 h-100"
                                    style={{
                                        background:
                                            "rgba(255,255,255,0.025)",
                                        border:
                                            "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >

                                    <BsFileEarmarkText
                                        className="mt-1"
                                    />

                                    <div>

                                        <div className="rems-table-secondary">
                                            Event Type
                                        </div>

                                        <div className="rems-table-primary mt-1">
                                            {humanize(
                                                eventType
                                            )}
                                        </div>

                                    </div>

                                </div>

                            </div>


                            <div className="col-12 col-md-6">

                                <div
                                    className="d-flex align-items-start gap-3 p-3 rounded-3 h-100"
                                    style={{
                                        background:
                                            "rgba(255,255,255,0.025)",
                                        border:
                                            "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >

                                    <BsClockHistory
                                        className="mt-1"
                                    />

                                    <div>

                                        <div className="rems-table-secondary">
                                            Timestamp
                                        </div>

                                        <div className="rems-table-primary mt-1">
                                            {formatDateTime(
                                                timestamp
                                            )}
                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        REQUEST / DEVICE
                    ================================================= */}

                    <div className="rems-form-section mb-3">

                        <div className="rems-form-section-title">
                            Request Context
                        </div>


                        <div className="row g-3">

                            <div className="col-12 col-md-5">

                                <div
                                    className="p-3 rounded-3 h-100"
                                    style={{
                                        background:
                                            "rgba(255,255,255,0.025)",
                                        border:
                                            "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >

                                    <div className="d-flex align-items-center gap-2">

                                        <BsGlobe />

                                        <div className="rems-table-secondary">
                                            IP Address
                                        </div>

                                    </div>

                                    <div className="rems-table-primary mt-2">
                                        {ipAddress}
                                    </div>

                                </div>

                            </div>


                            <div className="col-12 col-md-7">

                                <div
                                    className="p-3 rounded-3 h-100"
                                    style={{
                                        background:
                                            "rgba(255,255,255,0.025)",
                                        border:
                                            "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >

                                    <div className="d-flex align-items-center gap-2">

                                        <BsCodeSquare />

                                        <div className="rems-table-secondary">
                                            User Agent / Device
                                        </div>

                                    </div>

                                    <div
                                        className="small mt-2"
                                        style={{
                                            wordBreak:
                                                "break-word",
                                            lineHeight:
                                                1.5,
                                        }}
                                    >
                                        {userAgent}
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        BEFORE / AFTER
                    ================================================= */}

                    <div className="rems-form-section mb-3">

                        <div className="rems-form-section-title">
                            State Change
                        </div>


                        <div className="row g-3">

                            <div className="col-12 col-lg-6">

                                <div
                                    className="p-3 rounded-3 h-100"
                                    style={{
                                        background:
                                            "rgba(255,255,255,0.025)",
                                        border:
                                            "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >

                                    <div className="d-flex align-items-center justify-content-between mb-2">

                                        <div className="fw-semibold small">
                                            Before
                                        </div>

                                        <span className="rems-status-badge rems-status-secondary">
                                            Previous State
                                        </span>

                                    </div>

                                    <JsonBlock
                                        value={
                                            beforeData
                                        }
                                    />

                                </div>

                            </div>


                            <div className="col-12 col-lg-6">

                                <div
                                    className="p-3 rounded-3 h-100"
                                    style={{
                                        background:
                                            "rgba(255,255,255,0.025)",
                                        border:
                                            "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >

                                    <div className="d-flex align-items-center justify-content-between mb-2">

                                        <div className="fw-semibold small">
                                            After
                                        </div>

                                        <span className="rems-status-badge rems-status-success">
                                            New State
                                        </span>

                                    </div>

                                    <JsonBlock
                                        value={
                                            afterData
                                        }
                                    />

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        METADATA
                    ================================================= */}

                    <div className="rems-form-section">

                        <div className="rems-form-section-title">
                            Metadata
                        </div>

                        <JsonBlock
                            value={
                                metadata
                            }
                        />

                    </div>

                </div>


                {/* =====================================================
                    FOOTER
                ===================================================== */}

                <div
                    className="rems-modal-footer"
                    style={{
                        position:
                            "sticky",
                        bottom:
                            0,
                        zIndex:
                            10,
                        backdropFilter:
                            "blur(18px)",
                    }}
                >

                    <div
                        className="small me-auto"
                        style={{
                            opacity:
                                0.65,
                        }}
                    >
                        Audit records are read-only investigation
                        records. This interface does not modify
                        the audit event.
                    </div>


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
