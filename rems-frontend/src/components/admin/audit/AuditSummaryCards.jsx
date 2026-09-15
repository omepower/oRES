import React from "react";

import {
    BsActivity,
    BsCalendarDay,
    BsExclamationOctagon,
    BsPersonCheck,
    BsShieldExclamation,
} from "react-icons/bs";


/* ============================================================
   HELPERS
============================================================ */

const safeNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
};


const formatCount = (value) => {
    return safeNumber(
        value
    ).toLocaleString();
};


/* ============================================================
   COMPONENT
============================================================ */

export default function AuditSummaryCards({
    metrics = {},
}) {

    const cards = [
        {
            key: "total_events",

            label:
                "Total Events",

            value:
                metrics.total_events ??
                metrics.totalEvents ??
                metrics.audit_events ??
                metrics.events ??
                0,

            description:
                "All recorded audit events.",

            icon:
                <BsActivity />,
        },

        {
            key: "today_events",

            label:
                "Today's Events",

            value:
                metrics.today_events ??
                metrics.todayEvents ??
                metrics.events_today ??
                0,

            description:
                "Audit activity recorded today.",

            icon:
                <BsCalendarDay />,
        },

        {
            key: "critical_events",

            label:
                "Critical Events",

            value:
                metrics.critical_events ??
                metrics.criticalEvents ??
                metrics.critical ??
                0,

            description:
                "Events requiring immediate attention.",

            icon:
                <BsExclamationOctagon />,
        },

        {
            key: "failed_actions",

            label:
                "Failed Actions",

            value:
                metrics.failed_actions ??
                metrics.failedActions ??
                metrics.failed ??
                0,

            description:
                "Actions recorded with a failed result.",

            icon:
                <BsShieldExclamation />,
        },

        {
            key: "admin_actions",

            label:
                "Administrative Actions",

            value:
                metrics.admin_actions ??
                metrics.adminActions ??
                metrics.administrative_actions ??
                0,

            description:
                "Actions performed by administrators.",

            icon:
                <BsPersonCheck />,
        },
    ];


    return (
        <div className="row g-3">

            {cards.map(
                (
                    card
                ) => (

                    <div
                        key={
                            card.key
                        }
                        className="col-12 col-sm-6 col-md-4 col-xl"
                    >

                        <div
                            className="rems-stat-card h-100"
                            style={{
                                minHeight:
                                    "128px",
                            }}
                        >

                            <div className="rems-stat-icon">

                                {
                                    card.icon
                                }

                            </div>


                            <div className="rems-stat-content">

                                <div className="rems-stat-label">

                                    {
                                        card.label
                                    }

                                </div>


                                <div className="rems-stat-value">

                                    {
                                        formatCount(
                                            card.value
                                        )
                                    }

                                </div>


                                <div
                                    className="small mt-1"
                                    style={{
                                        opacity:
                                            0.68,
                                        lineHeight:
                                            1.35,
                                    }}
                                >

                                    {
                                        card.description
                                    }

                                </div>

                            </div>

                        </div>

                    </div>

                )
            )}

        </div>
    );
}
