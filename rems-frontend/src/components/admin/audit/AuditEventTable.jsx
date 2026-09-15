import React from "react";

import {
    BsEye,
    BsInbox,
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

    const date = new Date(
        value
    );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(
            value
        );
    }

    return date.toLocaleString();
};


const formatValue = (
    value,
    fallback = "—"
) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return fallback;
    }

    return String(
        value
    );
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


const getActionLabel = (
    action
) => {
    if (!action) {
        return "—";
    }

    return String(
        action
    )
        .replaceAll(
            "_",
            " "
        )
        .replace(
            /\b\w/g,
            (
                letter
            ) =>
                letter.toUpperCase()
        );
};


const getModuleLabel = (
    module
) => {
    if (!module) {
        return "—";
    }

    return String(
        module
    )
        .replaceAll(
            "_",
            " "
        )
        .replace(
            /\b\w/g,
            (
                letter
            ) =>
                letter.toUpperCase()
        );
};


const getActorName = (
    event
) => {
    return (
        event?.actor_name ||
        event?.user_name ||
        event?.actor?.full_name ||
        event?.actor?.username ||
        event?.user?.full_name ||
        event?.user?.username ||
        event?.actor ||
        event?.user ||
        "System"
    );
};


const getActorRole = (
    event
) => {
    return (
        event?.actor_role_display ||
        event?.actor_role ||
        event?.user_role_display ||
        event?.user_role ||
        event?.role ||
        "—"
    );
};


const getTargetLabel = (
    event
) => {
    const objectType =
        event?.object_type ||
        event?.target_type ||
        event?.subject_type ||
        "";

    const objectId =
        event?.object_id ??
        event?.target_id ??
        event?.subject_id ??
        "";

    const objectName =
        event?.object_name ||
        event?.target_name ||
        event?.subject_name ||
        "";

    if (
        objectName
    ) {
        return objectName;
    }

    if (
        objectType &&
        objectId !== ""
    ) {
        return `${objectType} #${objectId}`;
    }

    if (
        objectType
    ) {
        return objectType;
    }

    if (
        objectId !== ""
    ) {
        return `#${objectId}`;
    }

    return "—";
};


/* ============================================================
   COMPONENT
============================================================ */

export default function AuditEventTable({
    events = [],
    loading = false,
    onView,
}) {

    /* --------------------------------------------------------
       SAFETY
    -------------------------------------------------------- */

    const rows = Array.isArray(
        events
    )
        ? events
        : [];


    /* --------------------------------------------------------
       LOADING
    -------------------------------------------------------- */

    if (loading) {
        return (
            <div className="rems-glass-card">

                <div className="rems-loading-state py-5">

                    <div
                        className="spinner-border"
                        role="status"
                        aria-hidden="true"
                    />

                    <div className="mt-3">
                        Loading audit events...
                    </div>

                </div>

            </div>
        );
    }


    /* --------------------------------------------------------
       EMPTY
    -------------------------------------------------------- */

    if (
        rows.length === 0
    ) {
        return (
            <div className="rems-glass-card">

                <div className="rems-empty-state py-5">

                    <div className="rems-empty-icon">
                        <BsInbox />
                    </div>

                    <div className="rems-empty-title">
                        No audit events found
                    </div>

                    <div className="rems-empty-text">
                        There are no audit events matching
                        the current filters.
                    </div>

                </div>

            </div>
        );
    }


    /* --------------------------------------------------------
       TABLE
    -------------------------------------------------------- */

    return (
        <div className="rems-glass-card">

            <div
                className="rems-card-header"
                style={{
                    borderBottom:
                        "1px solid rgba(255,255,255,0.08)",
                }}
            >

                <div>

                    <div className="rems-page-eyebrow">
                        AUDIT TRAIL
                    </div>

                    <div className="rems-card-title">
                        Audit Events
                    </div>

                    <div className="rems-card-subtitle">
                        Recorded system activity and
                        administrative actions.
                    </div>

                </div>


                <div className="rems-table-secondary">
                    {rows.length}
                    {" "}
                    event
                    {rows.length === 1
                        ? ""
                        : "s"}
                </div>

            </div>


            <div className="rems-table-wrapper">

                <table className="table rems-table align-middle mb-0">

                    <thead>

                        <tr>

                            <th>
                                Date & Time
                            </th>

                            <th>
                                User
                            </th>

                            <th>
                                Role
                            </th>

                            <th>
                                Action
                            </th>

                            <th>
                                Module
                            </th>

                            <th>
                                Target
                            </th>

                            <th>
                                Severity
                            </th>

                            <th>
                                IP Address
                            </th>

                            <th>
                                Status
                            </th>

                            <th className="text-end">
                                Details
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {rows.map(
                            (
                                event,
                                index
                            ) => {

                                const severity =
                                    normalizeStatus(
                                        event?.severity
                                    );

                                const result =
                                    normalizeStatus(
                                        event?.result ||
                                        event?.status
                                    );

                                return (
                                    <tr
                                        key={
                                            event?.id ||
                                            event?.event_id ||
                                            `${event?.timestamp}-${index}`
                                        }
                                    >

                                        {/* DATE */}

                                        <td
                                            data-label="Date & Time"
                                        >
                                            <div className="rems-table-primary">

                                                {formatDateTime(
                                                    event?.timestamp ||
                                                    event?.created_at ||
                                                    event?.date
                                                )}

                                            </div>
                                        </td>


                                        {/* USER */}

                                        <td
                                            data-label="User"
                                        >
                                            <div className="rems-table-primary">

                                                {
                                                    getActorName(
                                                        event
                                                    )
                                                }

                                            </div>
                                        </td>


                                        {/* ROLE */}

                                        <td
                                            data-label="Role"
                                        >
                                            <span className="rems-status-badge rems-status-secondary">

                                                <span className="rems-status-dot" />

                                                {
                                                    getActorRole(
                                                        event
                                                    )
                                                }

                                            </span>
                                        </td>


                                        {/* ACTION */}

                                        <td
                                            data-label="Action"
                                        >
                                            <div className="rems-table-primary">

                                                {
                                                    getActionLabel(
                                                        event?.action
                                                    )
                                                }

                                            </div>

                                            {event?.event_type && (
                                                <div className="rems-table-secondary">

                                                    {
                                                        getActionLabel(
                                                            event.event_type
                                                        )
                                                    }

                                                </div>
                                            )}

                                        </td>


                                        {/* MODULE */}

                                        <td
                                            data-label="Module"
                                        >
                                            <div className="rems-table-primary">

                                                {
                                                    getModuleLabel(
                                                        event?.module
                                                    )
                                                }

                                            </div>
                                        </td>


                                        {/* TARGET */}

                                        <td
                                            data-label="Target"
                                        >
                                            <div className="rems-table-primary">

                                                {
                                                    getTargetLabel(
                                                        event
                                                    )
                                                }

                                            </div>

                                            {event?.object_type &&
                                                event?.object_id !==
                                                    undefined &&
                                                event?.object_id !==
                                                    null && (
                                                    <div className="rems-table-secondary">

                                                        {
                                                            event.object_type
                                                        }

                                                        {" #"}
                                                        {
                                                            event.object_id
                                                        }

                                                    </div>
                                                )}

                                        </td>


                                        {/* SEVERITY */}

                                        <td
                                            data-label="Severity"
                                        >

                                            <span
                                                className={`rems-status-badge ${getSeverityClass(
                                                    severity
                                                )}`}
                                            >

                                                <span className="rems-status-dot" />

                                                {
                                                    event?.severity_display ||
                                                    event?.severity ||
                                                    "Unknown"
                                                }

                                            </span>

                                        </td>


                                        {/* IP ADDRESS */}

                                        <td
                                            data-label="IP Address"
                                        >
                                            <code
                                                style={{
                                                    fontSize:
                                                        "0.78rem",
                                                    opacity:
                                                        0.8,
                                                }}
                                            >
                                                {
                                                    formatValue(
                                                        event?.ip_address
                                                    )
                                                }
                                            </code>
                                        </td>


                                        {/* RESULT */}

                                        <td
                                            data-label="Status"
                                        >

                                            <span
                                                className={`rems-status-badge ${getResultClass(
                                                    result
                                                )}`}
                                            >

                                                <span className="rems-status-dot" />

                                                {
                                                    event?.result_display ||
                                                    event?.status_display ||
                                                    event?.result ||
                                                    event?.status ||
                                                    "—"
                                                }

                                            </span>

                                        </td>


                                        {/* DETAILS */}

                                        <td
                                            data-label="Details"
                                            className="text-end"
                                        >

                                            <button
                                                type="button"
                                                className="rems-icon-button"
                                                title="View audit event details"
                                                aria-label={`View audit event ${
                                                    event?.event_id ||
                                                    event?.id ||
                                                    index + 1
                                                }`}
                                                onClick={() => {
                                                    if (
                                                        typeof onView ===
                                                        "function"
                                                    ) {
                                                        onView(
                                                            event
                                                        );
                                                    }
                                                }}
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
