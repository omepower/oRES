import React from "react";

import {
    BsCalendar3,
    BsFunnel,
    BsPerson,
    BsSearch,
    BsXCircle,
} from "react-icons/bs";


/* ============================================================
   AUDIT FILTERS
============================================================ */

export default function AuditFilters({
    filters = {},
    onChange,
    onReset,
}) {
    const updateFilter = (
        name,
        value
    ) => {
        if (
            typeof onChange ===
            "function"
        ) {
            onChange(
                name,
                value
            );
        }
    };


    const handleInputChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        updateFilter(
            name,
            value
        );
    };


    const hasActiveFilters =
        Object.values(
            filters
        ).some(
            (value) =>
                value !==
                    undefined &&
                value !==
                    null &&
                String(
                    value
                ).trim() !== ""
        );


    return (
        <div className="rems-glass-card mb-4">

            <div className="p-3 p-md-4">

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">

                    <div>

                        <div className="rems-page-eyebrow">
                            AUDIT & COMPLIANCE
                        </div>

                        <div className="rems-card-title">
                            Audit Event Filters
                        </div>

                        <div className="rems-card-subtitle">
                            Search and narrow system audit
                            activity by user, action, module,
                            severity, and date range.
                        </div>

                    </div>


                    {hasActiveFilters && (
                        <button
                            type="button"
                            className="rems-secondary-button"
                            onClick={
                                onReset
                            }
                        >
                            <BsXCircle />

                            Clear Filters
                        </button>
                    )}

                </div>


                {/* ==================================================
                    FILTERS
                ================================================== */}

                <div className="row g-3">

                    {/* =================================================
                        SEARCH
                    ================================================= */}

                    <div className="col-12 col-xl-4">

                        <label
                            htmlFor="audit-search"
                            className="rems-form-label"
                        >
                            Search
                        </label>

                        <div className="position-relative">

                            <BsSearch
                                className="position-absolute"
                                style={{
                                    left:
                                        "12px",
                                    top:
                                        "50%",
                                    transform:
                                        "translateY(-50%)",
                                    opacity:
                                        0.55,
                                    pointerEvents:
                                        "none",
                                }}
                            />

                            <input
                                id="audit-search"
                                type="search"
                                name="search"
                                className="form-control rems-form-control"
                                style={{
                                    paddingLeft:
                                        "36px",
                                }}
                                value={
                                    filters.search ||
                                    ""
                                }
                                onChange={
                                    handleInputChange
                                }
                                placeholder="Search audit events..."
                                autoComplete="off"
                            />

                        </div>

                    </div>


                    {/* =================================================
                        USER
                    ================================================= */}

                    <div className="col-12 col-md-6 col-xl-2">

                        <label
                            htmlFor="audit-user"
                            className="rems-form-label"
                        >
                            User
                        </label>

                        <div className="position-relative">

                            <BsPerson
                                className="position-absolute"
                                style={{
                                    left:
                                        "12px",
                                    top:
                                        "50%",
                                    transform:
                                        "translateY(-50%)",
                                    opacity:
                                        0.55,
                                    pointerEvents:
                                        "none",
                                }}
                            />

                            <input
                                id="audit-user"
                                type="text"
                                name="user"
                                className="form-control rems-form-control"
                                style={{
                                    paddingLeft:
                                        "36px",
                                }}
                                value={
                                    filters.user ||
                                    ""
                                }
                                onChange={
                                    handleInputChange
                                }
                                placeholder="Username / user ID"
                                autoComplete="off"
                            />

                        </div>

                    </div>


                    {/* =================================================
                        MODULE / APP
                    ================================================= */}

                    <div className="col-12 col-md-6 col-xl-2">

                        <label
                            htmlFor="audit-module"
                            className="rems-form-label"
                        >
                            Module
                        </label>

                        <select
                            id="audit-module"
                            name="module"
                            className="form-select rems-form-control"
                            value={
                                filters.module ||
                                ""
                            }
                            onChange={
                                handleInputChange
                            }
                        >

                            <option value="">
                                All Modules
                            </option>

                            <option value="accounts">
                                Accounts
                            </option>

                            <option value="residents">
                                Residents
                            </option>

                            <option value="properties">
                                Properties
                            </option>

                            <option value="vehicles">
                                Vehicles
                            </option>

                            <option value="visitors">
                                Visitors
                            </option>

                            <option value="security">
                                Security
                            </option>

                            <option value="facilities">
                                Facilities
                            </option>

                            <option value="notifications">
                                Notifications
                            </option>

                            <option value="announcements">
                                Announcements
                            </option>

                            <option value="audit">
                                Audit
                            </option>

                        </select>

                    </div>


                    {/* =================================================
                        ACTION
                    ================================================= */}

                    <div className="col-12 col-md-6 col-xl-2">

                        <label
                            htmlFor="audit-action"
                            className="rems-form-label"
                        >
                            Action
                        </label>

                        <select
                            id="audit-action"
                            name="action"
                            className="form-select rems-form-control"
                            value={
                                filters.action ||
                                ""
                            }
                            onChange={
                                handleInputChange
                            }
                        >

                            <option value="">
                                All Actions
                            </option>

                            <option value="CREATE">
                                Create
                            </option>

                            <option value="UPDATE">
                                Update
                            </option>

                            <option value="DELETE">
                                Delete
                            </option>

                            <option value="LOGIN">
                                Login
                            </option>

                            <option value="LOGOUT">
                                Logout
                            </option>

                            <option value="APPROVE">
                                Approve
                            </option>

                            <option value="REJECT">
                                Reject
                            </option>

                            <option value="VERIFY">
                                Verify
                            </option>

                            <option value="CANCEL">
                                Cancel
                            </option>

                            <option value="SECURITY">
                                Security
                            </option>

                        </select>

                    </div>


                    {/* =================================================
                        SEVERITY
                    ================================================= */}

                    <div className="col-12 col-md-6 col-xl-2">

                        <label
                            htmlFor="audit-severity"
                            className="rems-form-label"
                        >
                            Severity
                        </label>

                        <select
                            id="audit-severity"
                            name="severity"
                            className="form-select rems-form-control"
                            value={
                                filters.severity ||
                                ""
                            }
                            onChange={
                                handleInputChange
                            }
                        >

                            <option value="">
                                All Severities
                            </option>

                            <option value="INFO">
                                Info
                            </option>

                            <option value="WARNING">
                                Warning
                            </option>

                            <option value="ERROR">
                                Error
                            </option>

                            <option value="CRITICAL">
                                Critical
                            </option>

                        </select>

                    </div>


                    {/* =================================================
                        DATE FROM
                    ================================================= */}

                    <div className="col-12 col-md-6 col-xl-3">

                        <label
                            htmlFor="audit-date-from"
                            className="rems-form-label"
                        >
                            Date From
                        </label>

                        <div className="position-relative">

                            <BsCalendar3
                                className="position-absolute"
                                style={{
                                    left:
                                        "12px",
                                    top:
                                        "50%",
                                    transform:
                                        "translateY(-50%)",
                                    opacity:
                                        0.55,
                                    pointerEvents:
                                        "none",
                                }}
                            />

                            <input
                                id="audit-date-from"
                                type="date"
                                name="date_from"
                                className="form-control rems-form-control"
                                style={{
                                    paddingLeft:
                                        "36px",
                                }}
                                value={
                                    filters.date_from ||
                                    ""
                                }
                                onChange={
                                    handleInputChange
                                }
                            />

                        </div>

                    </div>


                    {/* =================================================
                        DATE TO
                    ================================================= */}

                    <div className="col-12 col-md-6 col-xl-3">

                        <label
                            htmlFor="audit-date-to"
                            className="rems-form-label"
                        >
                            Date To
                        </label>

                        <div className="position-relative">

                            <BsCalendar3
                                className="position-absolute"
                                style={{
                                    left:
                                        "12px",
                                    top:
                                        "50%",
                                    transform:
                                        "translateY(-50%)",
                                    opacity:
                                        0.55,
                                    pointerEvents:
                                        "none",
                                }}
                            />

                            <input
                                id="audit-date-to"
                                type="date"
                                name="date_to"
                                className="form-control rems-form-control"
                                style={{
                                    paddingLeft:
                                        "36px",
                                }}
                                value={
                                    filters.date_to ||
                                    ""
                                }
                                onChange={
                                    handleInputChange
                                }
                            />

                        </div>

                    </div>


                    {/* =================================================
                        OBJECT TYPE
                    ================================================= */}

                    <div className="col-12 col-md-6 col-xl-3">

                        <label
                            htmlFor="audit-object-type"
                            className="rems-form-label"
                        >
                            Object Type
                        </label>

                        <input
                            id="audit-object-type"
                            type="text"
                            name="object_type"
                            className="form-control rems-form-control"
                            value={
                                filters.object_type ||
                                ""
                            }
                            onChange={
                                handleInputChange
                            }
                            placeholder="e.g. Booking, Resident"
                            autoComplete="off"
                        />

                    </div>


                    {/* =================================================
                        REQUEST METHOD
                    ================================================= */}

                    <div className="col-12 col-md-6 col-xl-3">

                        <label
                            htmlFor="audit-method"
                            className="rems-form-label"
                        >
                            Request Method
                        </label>

                        <select
                            id="audit-method"
                            name="method"
                            className="form-select rems-form-control"
                            value={
                                filters.method ||
                                ""
                            }
                            onChange={
                                handleInputChange
                            }
                        >

                            <option value="">
                                All Methods
                            </option>

                            <option value="GET">
                                GET
                            </option>

                            <option value="POST">
                                POST
                            </option>

                            <option value="PATCH">
                                PATCH
                            </option>

                            <option value="PUT">
                                PUT
                            </option>

                            <option value="DELETE">
                                DELETE
                            </option>

                        </select>

                    </div>


                    {/* =================================================
                        FILTER ACTION
                    ================================================= */}

                    <div className="col-12">

                        <div
                            className="d-flex flex-wrap align-items-center gap-2 pt-2"
                        >

                            <div
                                className="small d-flex align-items-center gap-2"
                                style={{
                                    opacity:
                                        0.65,
                                }}
                            >
                                <BsFunnel />

                                Filters update the
                                audit event view.
                            </div>


                            {hasActiveFilters && (
                                <span
                                    className="rems-status-badge rems-status-warning"
                                >
                                    <span className="rems-status-dot" />

                                    Filters Active
                                </span>
                            )}

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}
