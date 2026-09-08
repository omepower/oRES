import {
    Link,
} from "react-router-dom";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import useAuth from "../../hooks/useAuth";

import {
    getProperties,
} from "../../api/properties";

import {
    getResidents,
} from "../../api/residents";

import {
    getVisitorInvitations,
    getVisitorVisits,
} from "../../api/visitors";

import {
    getVehicles,
    getMotoristStickers,
} from "../../api/vehicles";

import {
    getGates,
} from "../../api/security";

import {
    getFacilityBookings,
} from "../../api/facilities";


/* =========================================================
   HELPERS
========================================================= */

const normalize = (
    response,
    keys = []
) => {
    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response?.results)) {
        return response.results;
    }

    for (const key of keys) {
        if (Array.isArray(response?.[key])) {
            return response[key];
        }
    }

    return [];
};


const normalizeStatus = (
    value
) => {
    return String(value || "")
        .trim()
        .toUpperCase();
};


const isPropertyOccupied = (
    property,
    residentsList = []
) => {
    if (!property) return false;

    const status = normalizeStatus(property.status || property.occupancy_status);

    // Explicit boolean flags
    if (property.is_occupied === true) return true;

    // Status strings matching occupied / homeowner / tenant states
    const occupiedStatuses = [
        "OCCUPIED",
        "HOMEOWNER",
        "HOMEOWNER_OCCUPIED",
        "OWNER_OCCUPIED",
        "TENANT_OCCUPIED",
        "RENTED",
    ];

    if (
        occupiedStatuses.includes(status) ||
        status.includes("OCCUPIED") ||
        status.includes("HOMEOWNER")
    ) {
        return true;
    }

    // Direct property occupant or resident counts
    if (Number(property.resident_count || property.residents_count || 0) > 0) {
        return true;
    }

    if (Array.isArray(property.residents) && property.residents.length > 0) {
        return true;
    }

    if (Array.isArray(property.occupants) && property.occupants.length > 0) {
        return true;
    }

    // Cross-reference with loaded residents dataset
    if (Array.isArray(residentsList) && residentsList.length > 0) {
        const propId = String(property.id || property.property_id || "");
        if (propId) {
            const hasLinkedResident = residentsList.some((res) => {
                const resPropId = String(
                    res.property_id || res.property?.id || res.property || ""
                );
                return resPropId === propId;
            });

            if (hasLinkedResident) return true;
        }
    }

    return false;
};


const getDateKey = (
    value
) => {
    if (!value) {
        return null;
    }

    const text = String(value);

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return text;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};


const getLast7Days = () => {
    const result = [];
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    for (let index = 6; index >= 0; index--) {
        const date = new Date(today);
        date.setDate(today.getDate() - index);

        result.push({
            key: getDateKey(date),
            label: date.toLocaleDateString(undefined, { weekday: "short" }),
            display: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        });
    }

    return result;
};


const buildTrend = (
    records,
    dateGetter,
    days
) => {
    const counts = {};

    days.forEach((day) => {
        counts[day.key] = 0;
    });

    records.forEach((record) => {
        const key = dateGetter(record);
        if (key && Object.prototype.hasOwnProperty.call(counts, key)) {
            counts[key] += 1;
        }
    });

    return days.map((day) => counts[day.key] || 0);
};


const formatNumber = (
    value
) => {
    return Number(value || 0).toLocaleString();
};


const formatPercentage = (
    value,
    total
) => {
    if (!total) {
        return "0%";
    }

    return `${Math.round((value / total) * 100)}%`;
};


const formatTime = (
    value
) => {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
};


/* =========================================================
   INLINE TREND LINE
========================================================= */

function TrendChart({
    labels,
    values,
}) {
    const width = 760;
    const height = 280;

    const left = 42;
    const right = 18;
    const top = 20;
    const bottom = 44;

    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    const max = Math.max(1, ...values);

    const points = values.map((value, index) => {
        const x =
            values.length === 1
                ? left + plotWidth / 2
                : left + (index / (values.length - 1)) * plotWidth;

        const y = top + plotHeight - (value / max) * plotHeight;

        return { x, y, value };
    });

    const line = points.map((point) => `${point.x},${point.y}`).join(" ");

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-100"
            role="img"
            aria-label="Trend chart"
        >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = top + plotHeight - ratio * plotHeight;

                return (
                    <g key={ratio}>
                        <line
                            x1={left}
                            x2={width - right}
                            y1={y}
                            y2={y}
                            stroke="rgba(148,163,184,.17)"
                            strokeWidth="1"
                        />
                        <text
                            x={left - 8}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="#8e98a5"
                        >
                            {Math.round(max * ratio)}
                        </text>
                    </g>
                );
            })}

            <polyline
                points={line}
                fill="none"
                stroke="#6f8f7a"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {points.map((point, index) => (
                <g key={`${point.x}-${index}`}>
                    <circle
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="#ffffff"
                        stroke="#6f8f7a"
                        strokeWidth="2"
                    />
                    <text
                        x={point.x}
                        y={height - 14}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#8e98a5"
                    >
                        {labels[index]}
                    </text>
                </g>
            ))}
        </svg>
    );
}


/* =========================================================
   RESIDENT COMPOSITION DOUGHNUT
========================================================= */

function ResidentCompositionChart({
    homeowners,
    tenants,
}) {
    const total = homeowners + tenants;
    const homeownerPercent = total > 0 ? (homeowners / total) * 100 : 0;
    const split = homeownerPercent * 3.6;

    const background =
        total > 0
            ? `conic-gradient(#6f8f7a 0deg ${split}deg, #aeb8c2 ${split}deg 360deg)`
            : "conic-gradient(#d9dee4 0deg 360deg)";

    return (
        <div
            style={{
                minHeight: "260px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "32px",
                flexWrap: "wrap",
            }}
        >
            <div
                style={{
                    width: "180px",
                    height: "180px",
                    borderRadius: "50%",
                    background,
                    display: "grid",
                    placeItems: "center",
                    flex: "0 0 180px",
                }}
            >
                <div
                    style={{
                        width: "112px",
                        height: "112px",
                        borderRadius: "50%",
                        background: "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <strong style={{ fontSize: "1.55rem", color: "#273245" }}>
                        {formatNumber(total)}
                    </strong>
                    <span style={{ fontSize: "0.62rem", color: "#929ca8" }}>
                        Residents
                    </span>
                </div>
            </div>

            <div style={{ minWidth: "190px" }}>
                <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                    <span
                        className="d-flex align-items-center gap-2"
                        style={{ fontSize: "0.70rem", color: "#667284" }}
                    >
                        <span
                            style={{
                                width: "9px",
                                height: "9px",
                                borderRadius: "50%",
                                background: "#6f8f7a",
                            }}
                        />
                        Homeowners
                    </span>
                    <strong style={{ color: "#344052" }}>
                        {formatNumber(homeowners)}{" "}
                        <small style={{ color: "#9aa2ad" }}>
                            ({formatPercentage(homeowners, total)})
                        </small>
                    </strong>
                </div>

                <div className="d-flex align-items-center justify-content-between gap-3">
                    <span
                        className="d-flex align-items-center gap-2"
                        style={{ fontSize: "0.70rem", color: "#667284" }}
                    >
                        <span
                            style={{
                                width: "9px",
                                height: "9px",
                                borderRadius: "50%",
                                background: "#aeb8c2",
                            }}
                        />
                        Tenants
                    </span>
                    <strong style={{ color: "#344052" }}>
                        {formatNumber(tenants)}{" "}
                        <small style={{ color: "#9aa2ad" }}>
                            ({formatPercentage(tenants, total)})
                        </small>
                    </strong>
                </div>
            </div>
        </div>
    );
}


/* =========================================================
   PROPERTY OCCUPANCY BAR CHART
========================================================= */

function PropertyOccupancyChart({
    occupied,
    vacant,
}) {
    const total = occupied + vacant;
    const max = Math.max(1, occupied, vacant);

    const occupiedHeight = total > 0 ? (occupied / max) * 100 : 0;
    const vacantHeight = total > 0 ? (vacant / max) * 100 : 0;

    return (
        <div
            style={{
                minHeight: "220px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                paddingTop: "12px",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    gap: "42px",
                    height: "150px",
                }}
            >
                {/* Occupied Bar */}
                <div
                    className="d-flex flex-column align-items-center gap-2"
                    style={{ height: "100%", justifyContent: "flex-end", width: "60px" }}
                >
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#344052" }}>
                        {formatNumber(occupied)}
                    </span>
                    <div
                        style={{
                            width: "100%",
                            height: `${occupiedHeight}%`,
                            minHeight: occupied > 0 ? "8px" : "0px",
                            background: "#6f8f7a",
                            borderRadius: "8px 8px 0 0",
                            transition: "height 0.3s ease",
                        }}
                    />
                    <span style={{ fontSize: "0.68rem", color: "#667284", fontWeight: 600 }}>
                        Occupied
                    </span>
                </div>

                {/* Vacant Bar */}
                <div
                    className="d-flex flex-column align-items-center gap-2"
                    style={{ height: "100%", justifyContent: "flex-end", width: "60px" }}
                >
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#344052" }}>
                        {formatNumber(vacant)}
                    </span>
                    <div
                        style={{
                            width: "100%",
                            height: `${vacantHeight}%`,
                            minHeight: vacant > 0 ? "8px" : "0px",
                            background: "#c4cbd4",
                            borderRadius: "8px 8px 0 0",
                            transition: "height 0.3s ease",
                        }}
                    />
                    <span style={{ fontSize: "0.68rem", color: "#667284", fontWeight: 600 }}>
                        Vacant
                    </span>
                </div>
            </div>

            <div
                className="d-flex justify-content-center gap-4 pt-3 mt-2 border-top"
                style={{ borderColor: "rgba(148,163,184,.12)" }}
            >
                <div style={{ fontSize: "0.68rem", color: "#758092" }}>
                    Total Units: <strong style={{ color: "#344052" }}>{formatNumber(total)}</strong>
                </div>
                <div style={{ fontSize: "0.68rem", color: "#758092" }}>
                    Occupancy Rate:{" "}
                    <strong style={{ color: "#6f8f7a" }}>
                        {formatPercentage(occupied, total)}
                    </strong>
                </div>
            </div>
        </div>
    );
}


/* =========================================================
   100% ACTIVE / INACTIVE BAR
========================================================= */

function ResidentActivityChart({
    active,
    inactive,
}) {
    const total = active + inactive;
    const activeWidth = total > 0 ? (active / total) * 100 : 0;

    return (
        <div>
            <div
                style={{
                    width: "100%",
                    height: "34px",
                    display: "flex",
                    overflow: "hidden",
                    borderRadius: "999px",
                    background: "#edf0f3",
                }}
            >
                <div
                    style={{
                        width: `${activeWidth}%`,
                        background: "#6f8f7a",
                        transition: "width .25s ease",
                    }}
                />
                <div style={{ flex: 1, background: "#b8c1ca" }} />
            </div>

            <div className="d-flex justify-content-between flex-wrap gap-3 mt-3">
                <div className="d-flex align-items-center gap-2">
                    <span
                        style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#6f8f7a",
                        }}
                    />
                    <span style={{ fontSize: "0.68rem", color: "#758092" }}>
                        Active
                    </span>
                    <strong>{formatNumber(active)}</strong>
                    <small style={{ color: "#9ba3ae" }}>
                        {formatPercentage(active, total)}
                    </small>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <span
                        style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#b8c1ca",
                        }}
                    />
                    <span style={{ fontSize: "0.68rem", color: "#758092" }}>
                        Inactive
                    </span>
                    <strong>{formatNumber(inactive)}</strong>
                    <small style={{ color: "#9ba3ae" }}>
                        {formatPercentage(inactive, total)}
                    </small>
                </div>
            </div>
        </div>
    );
}


/* =========================================================
   STICKER HORIZONTAL BARS
========================================================= */

function StickerStatusChart({
    items,
}) {
    if (items.length === 0) {
        return (
            <div
                className="text-center"
                style={{
                    padding: "60px 20px",
                    color: "#99a2ad",
                    fontSize: "0.70rem",
                }}
            >
                No motorist sticker records available.
            </div>
        );
    }

    const max = Math.max(1, ...items.map((item) => item.value));

    return (
        <div className="d-flex flex-column gap-3">
            {items.map((item) => (
                <div key={item.key}>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                        <span
                            style={{
                                color: "#667284",
                                fontSize: "0.68rem",
                                textTransform: "capitalize",
                            }}
                        >
                            {item.label}
                        </span>
                        <strong style={{ color: "#344052", fontSize: "0.70rem" }}>
                            {formatNumber(item.value)}
                        </strong>
                    </div>

                    <div
                        style={{
                            height: "9px",
                            overflow: "hidden",
                            borderRadius: "999px",
                            background: "#edf0f3",
                        }}
                    >
                        <div
                            style={{
                                width: `${(item.value / max) * 100}%`,
                                height: "100%",
                                borderRadius: "999px",
                                background: "#6f8f7a",
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}


/* =========================================================
   METRIC CARD WRAPPER FOR CHARTS
========================================================= */

function MetricCard({
    title,
    subtitle,
    children,
    wide = false,
    fullWidth = false,
}) {
    return (
        <section
            style={{
                gridColumn: fullWidth ? "span 12" : wide ? "span 7" : "span 5",
                minWidth: 0,
                overflow: "hidden",
                border: "1px solid var(--ores-border, rgba(148,163,184,.14))",
                borderRadius: "18px",
                background: "var(--ores-card, rgba(255,255,255,.72))",
                boxShadow: "var(--ores-shadow, 0 10px 30px rgba(15,23,42,.045))",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
            }}
        >
            <div
                style={{
                    padding: "18px 20px 14px",
                    borderBottom: "1px solid var(--ores-border-light, rgba(148,163,184,.10))",
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        color: "#293446",
                        fontSize: "0.87rem",
                        fontWeight: 700,
                    }}
                >
                    {title}
                </h2>
                <p
                    style={{
                        margin: "4px 0 0",
                        color: "#98a0ac",
                        fontSize: "0.64rem",
                        lineHeight: 1.5,
                    }}
                >
                    {subtitle}
                </p>
            </div>

            <div style={{ padding: "18px 20px 20px" }}>{children}</div>
        </section>
    );
}


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

export default function AdminDashboard() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [moduleErrors, setModuleErrors] = useState([]);

    const [data, setData] = useState({
        properties: [],
        residents: [],
        invitations: [],
        visits: [],
        vehicles: [],
        stickers: [],
        gates: [],
        bookings: [],
    });

    const adminName = user?.first_name || user?.username || "Administrator";

    /* =========================================================
       LOCAL STYLES
    ========================================================= */

    const dashboardStyles = `
        .ores-admin-dashboard {
            --ores-text: #1d2737;
            --ores-text-soft: #566274;
            --ores-text-muted: #929baa;
            --ores-border: rgba(148, 163, 184, 0.14);
            --ores-border-light: rgba(148, 163, 184, 0.09);
            --ores-card: rgba(255, 255, 255, 0.72);
            --ores-card-strong: rgba(255, 255, 255, 0.86);
            --ores-shadow: 0 10px 30px rgba(15, 23, 42, 0.045);
            --ores-shadow-hover: 0 18px 42px rgba(15, 23, 42, 0.08);
            width: 100%;
            max-width: 1580px;
            margin: 0 auto;
            padding: 28px 30px 42px;
            box-sizing: border-box;
        }

        .ores-admin-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 28px;
        }

        .ores-admin-header-copy {
            min-width: 0;
            max-width: 780px;
        }

        .ores-admin-eyebrow {
            margin-bottom: 8px;
            color: #7e8795;
            font-size: 0.70rem;
            font-weight: 800;
            letter-spacing: 0.14em;
            text-transform: uppercase;
        }

        .ores-admin-title {
            margin: 0;
            color: var(--ores-text);
            font-size: clamp(1.85rem, 2.7vw, 2.35rem);
            font-weight: 730;
            line-height: 1.15;
            letter-spacing: -0.04em;
        }

        .ores-admin-description {
            max-width: 680px;
            margin: 9px 0 0;
            color: var(--ores-text-muted);
            font-size: 0.80rem;
            line-height: 1.65;
        }

        .ores-admin-refresh {
            display: flex;
            align-items: center;
            gap: 11px;
            min-width: 200px;
            padding: 10px 13px;
            border: 1px solid var(--ores-border);
            border-radius: 13px;
            color: inherit;
            background: rgba(255, 255, 255, 0.60);
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.035);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
        }

        .ores-admin-refresh-icon {
            width: 38px;
            height: 38px;
            flex: 0 0 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            color: #596678;
            background: #f0f3f7;
        }

        .ores-admin-refresh-copy {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .ores-admin-refresh-label {
            color: #9aa3ae;
            font-size: 0.65rem;
            font-weight: 700;
            letter-spacing: 0.10em;
            text-transform: uppercase;
        }

        .ores-admin-refresh-copy strong {
            color: #354152;
            font-size: 0.80rem;
            font-weight: 650;
            white-space: nowrap;
        }

        .ores-admin-section {
            margin-bottom: 26px;
        }

        .ores-admin-section-heading {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 13px;
        }

        .ores-admin-section-heading h2 {
            margin: 0;
            color: #253043;
            font-size: 1rem;
            font-weight: 700;
        }

        .ores-admin-section-heading p {
            margin: 4px 0 0;
            color: #929baa;
            font-size: 0.70rem;
            line-height: 1.5;
        }

        .ores-metric-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
        }

        .ores-metric-card {
            min-width: 0;
            min-height: 148px;
            display: flex;
            flex-direction: column;
            padding: 16px;
            border: 1px solid var(--ores-border);
            border-radius: 16px;
            color: inherit;
            text-decoration: none;
            background: var(--ores-card);
            box-shadow: var(--ores-shadow);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .ores-metric-card:hover {
            color: inherit;
            text-decoration: none;
            transform: translateY(-2px);
            box-shadow: var(--ores-shadow-hover);
        }

        .ores-metric-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 14px;
        }

        .ores-metric-icon {
            width: 39px;
            height: 39px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            color: #586576;
            background: #f0f3f7;
            font-size: 0.88rem;
        }

        .ores-metric-arrow {
            color: #b2b9c4;
            font-size: 0.72rem;
        }

        .ores-metric-value {
            color: #1d2737;
            font-size: 1.75rem;
            font-weight: 730;
            line-height: 1;
            letter-spacing: -0.045em;
        }

        .ores-metric-label {
            margin-top: 5px;
            color: #394556;
            font-size: 0.80rem;
            font-weight: 680;
        }

        .ores-metric-detail {
            margin-top: auto;
            padding-top: 8px;
            color: #969fac;
            font-size: 0.65rem;
            line-height: 1.45;
        }

        .ores-panel-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.28fr) minmax(330px, 0.72fr);
            gap: 16px;
            align-items: stretch;
        }

        .ores-charts-grid {
            display: grid;
            grid-template-columns: repeat(12, minmax(0, 1fr));
            gap: 18px;
        }

        .ores-panel {
            min-width: 0;
            overflow: hidden;
            border: 1px solid var(--ores-border);
            border-radius: 17px;
            background: var(--ores-card);
            box-shadow: var(--ores-shadow);
            backdrop-filter: blur(17px);
            -webkit-backdrop-filter: blur(17px);
        }

        .ores-panel-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
            padding: 17px 18px 14px;
            border-bottom: 1px solid var(--ores-border-light);
        }

        .ores-panel-title {
            margin: 0;
            color: #293446;
            font-size: 0.90rem;
            font-weight: 700;
        }

        .ores-panel-subtitle {
            margin: 4px 0 0;
            color: #98a0ac;
            font-size: 0.67rem;
            line-height: 1.5;
        }

        .ores-panel-icon {
            width: 34px;
            height: 34px;
            flex: 0 0 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 9px;
            color: #6a7687;
            background: #f0f3f7;
            font-size: 0.80rem;
        }

        .ores-actions-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 9px;
            padding: 14px 16px 16px;
        }

        .ores-action-card {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 10px;
            min-height: 66px;
            padding: 10px;
            border: 1px solid rgba(148, 163, 184, 0.10);
            border-radius: 12px;
            color: inherit;
            background: rgba(248, 250, 252, 0.54);
            text-decoration: none;
            transition: transform 160ms ease, box-shadow 160ms ease;
        }

        .ores-action-card:hover {
            color: inherit;
            text-decoration: none;
            transform: translateY(-1px);
            box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
        }

        .ores-action-icon {
            width: 34px;
            height: 34px;
            flex: 0 0 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 9px;
            color: #647083;
            background: #edf1f5;
        }

        .ores-action-copy {
            min-width: 0;
            flex: 1;
        }

        .ores-action-title {
            overflow: hidden;
            color: #354152;
            font-size: 0.68rem;
            font-weight: 680;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .ores-action-description {
            margin-top: 3px;
            overflow: hidden;
            color: #989faa;
            font-size: 0.59rem;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .ores-action-arrow {
            color: #b5bcc6;
            font-size: 0.63rem;
        }

        .ores-table-wrapper {
            width: 100%;
            overflow: hidden;
        }

        .ores-table {
            width: 100%;
            margin: 0;
            border-collapse: separate;
            border-spacing: 0;
        }

        .ores-table thead th {
            padding: 10px 16px;
            color: #98a1ad;
            background: rgba(248, 250, 252, 0.55);
            border-bottom: 1px solid rgba(148, 163, 184, 0.09);
            font-size: 0.60rem;
            font-weight: 800;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            white-space: nowrap;
        }

        .ores-table tbody td {
            padding: 11px 16px;
            color: #6d7785;
            border-bottom: 1px solid rgba(148, 163, 184, 0.07);
            font-size: 0.70rem;
            vertical-align: middle;
        }

        .ores-table strong {
            color: #394455;
            font-weight: 680;
        }

        .ores-table-subtext {
            margin-top: 2px;
            color: #a0a7b2;
            font-size: 0.60rem;
        }

        .ores-status {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            min-height: 22px;
            padding: 4px 8px;
            border-radius: 999px;
            color: #677284;
            background: rgba(100, 116, 139, 0.08);
            font-size: 0.58rem;
            font-weight: 700;
            white-space: nowrap;
        }

        .ores-health-body {
            padding: 16px;
        }

        .ores-health-list {
            display: flex;
            flex-direction: column;
            gap: 7px;
        }

        .ores-health-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 8px 10px;
            border-radius: 999px;
            background: rgba(248, 250, 252, 0.55);
        }

        .ores-health-row span {
            color: #8993a1;
            font-size: 0.62rem;
        }

        .ores-health-row strong {
            color: #384354;
            font-size: 0.68rem;
            font-weight: 700;
        }

        .ores-admin-error {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 18px;
            padding: 10px 12px;
            border: 1px solid rgba(245, 158, 11, 0.12);
            border-radius: 10px;
            color: #956a18;
            background: rgba(245, 158, 11, 0.06);
            font-size: 0.68rem;
            line-height: 1.45;
        }

        .ores-empty {
            padding: 28px 18px;
            text-align: center;
        }

        .ores-empty-icon {
            width: 40px;
            height: 40px;
            margin: 0 auto 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            color: #8c96a3;
            background: #f0f3f7;
        }

        .ores-empty h3 {
            margin: 0;
            color: #4a5566;
            font-size: 0.78rem;
            font-weight: 700;
        }

        .ores-empty p {
            max-width: 360px;
            margin: 5px auto 0;
            color: #969fac;
            font-size: 0.65rem;
            line-height: 1.5;
        }

        @media (max-width: 1199.98px) {
            .ores-admin-dashboard { padding: 24px; }
            .ores-metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .ores-panel-grid { grid-template-columns: 1fr; }
            .ores-charts-grid { grid-template-columns: 1fr; }
            .ores-charts-grid section, .ores-charts-grid > div { grid-column: span 12 !important; }
        }

        @media (max-width: 767.98px) {
            .ores-admin-dashboard { padding: 18px 14px 24px; }
            .ores-admin-header { align-items: stretch; flex-direction: column; gap: 15px; margin-bottom: 21px; }
            .ores-admin-title { font-size: 1.70rem; }
            .ores-admin-refresh { width: 100%; }
            .ores-metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
            .ores-actions-grid { grid-template-columns: 1fr; }
            .ores-table-wrapper { overflow-x: auto; }
            .ores-table { min-width: 620px; }
        }
    `;

    /* =========================================================
       LOAD DATA
    ========================================================= */

    const loadDashboard = useCallback(async (silent = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");
        setModuleErrors([]);

        const safeRequest = async (name, request) => {
            try {
                return {
                    name,
                    success: true,
                    data: await request(),
                };
            } catch (err) {
                console.error(`[oRES Dashboard] ${name} failed:`, err);
                return {
                    name,
                    success: false,
                    data: null,
                    error: err,
                };
            }
        };

        const [
            propertiesResult,
            residentsResult,
            invitationsResult,
            visitsResult,
            vehiclesResult,
            stickersResult,
            gatesResult,
            bookingsResult,
        ] = await Promise.all([
            safeRequest("Properties", getProperties),
            safeRequest("Residents", getResidents),
            safeRequest("Visitor Invitations", getVisitorInvitations),
            safeRequest("Visitor Visits", getVisitorVisits),
            safeRequest("Vehicles", getVehicles),
            safeRequest("Motorist Stickers", getMotoristStickers),
            safeRequest("Gates", getGates),
            safeRequest("Facility Bookings", getFacilityBookings),
        ]);

        const properties = normalize(propertiesResult.data, ["properties"]);
        const residents = normalize(residentsResult.data, ["residents"]);
        const invitations = normalize(invitationsResult.data, ["invitations"]);
        const visits = normalize(visitsResult.data, ["visits"]);
        const vehicles = normalize(vehiclesResult.data, ["vehicles"]);
        const stickers = normalize(stickersResult.data, ["stickers"]);
        const gates = normalize(gatesResult.data, ["gates"]);
        const bookings = normalize(bookingsResult.data, ["bookings"]);

        setData({
            properties,
            residents,
            invitations,
            visits,
            vehicles,
            stickers,
            gates,
            bookings,
        });

        const failedModules = [
            propertiesResult,
            residentsResult,
            invitationsResult,
            visitsResult,
            vehiclesResult,
            stickersResult,
            gatesResult,
            bookingsResult,
        ]
            .filter((item) => !item.success)
            .map((item) => item.name);

        setModuleErrors(failedModules);

        if (failedModules.length) {
            setError(`Unable to load: ${failedModules.join(", ")}.`);
        }

        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    /* =========================================================
       CALCULATED / DERIVED METRICS
    ========================================================= */

    const days = useMemo(() => getLast7Days(), []);

    // Date today ISO
    const todayString = useMemo(() => getDateKey(new Date()), []);

    // Properties breakdown
    const occupiedProperties = useMemo(
        () => data.properties.filter((p) => isPropertyOccupied(p, data.residents)),
        [data.properties, data.residents]
    );

    const vacantProperties = useMemo(
        () => data.properties.filter((p) => !isPropertyOccupied(p, data.residents)),
        [data.properties, data.residents]
    );

    // Residents breakdown
    const homeowners = useMemo(
        () => data.residents.filter((r) => normalizeStatus(r?.resident_type) === "HOMEOWNER"),
        [data.residents]
    );

    const tenants = useMemo(
        () => data.residents.filter((r) => normalizeStatus(r?.resident_type) === "TENANT"),
        [data.residents]
    );

    const activeResidents = useMemo(
        () => data.residents.filter((r) => r?.is_active === true),
        [data.residents]
    );

    const inactiveResidents = useMemo(
        () => data.residents.filter((r) => r?.is_active !== true),
        [data.residents]
    );

    // Visitors breakdown
    const visitorsToday = useMemo(
        () =>
            data.invitations.filter(
                (inv) =>
                    normalizeStatus(inv?.status) === "USED" &&
                    getDateKey(inv?.visit_date) === todayString
            ),
        [data.invitations, todayString]
    );

    const pendingVisitors = useMemo(
        () => data.invitations.filter((inv) => normalizeStatus(inv?.status) === "PENDING"),
        [data.invitations]
    );

    const visitorsInside = useMemo(
        () => data.visits.filter((v) => normalizeStatus(v?.status) === "INSIDE"),
        [data.visits]
    );

    // Vehicles breakdown
    const activeVehicles = useMemo(
        () => data.vehicles.filter((v) => v?.is_active === true),
        [data.vehicles]
    );

    const inactiveVehicles = useMemo(
        () => data.vehicles.filter((v) => v?.is_active !== true),
        [data.vehicles]
    );

    // Stickers breakdown
    const activeStickers = useMemo(
        () => data.stickers.filter((s) => normalizeStatus(s?.status) === "ACTIVE"),
        [data.stickers]
    );

    const pendingStickers = useMemo(
        () => data.stickers.filter((s) => normalizeStatus(s?.status) === "PENDING"),
        [data.stickers]
    );

    const revokedStickers = useMemo(
        () => data.stickers.filter((s) => normalizeStatus(s?.status) === "REVOKED"),
        [data.stickers]
    );

    // Gates breakdown
    const activeGates = useMemo(
        () => data.gates.filter((g) => g?.is_active === true),
        [data.gates]
    );

    const inactiveGates = useMemo(
        () => data.gates.filter((g) => g?.is_active !== true),
        [data.gates]
    );

    // Facility bookings approved
    const facilityApproved = useMemo(
        () => data.bookings.filter((b) => normalizeStatus(b?.status) === "APPROVED"),
        [data.bookings]
    );

    // Recent Visits
    const recentVisits = useMemo(() => {
        return [...data.visits]
            .sort((first, second) => {
                const firstDate = new Date(first?.time_in || first?.created_at || 0).getTime();
                const secondDate = new Date(second?.time_in || second?.created_at || 0).getTime();
                return secondDate - firstDate;
            })
            .slice(0, 6);
    }, [data.visits]);

    // Trends for SVG Charts
    const visitorTrend = useMemo(
        () =>
            buildTrend(
                data.visits,
                (visit) => getDateKey(visit?.time_in || visit?.created_at),
                days
            ),
        [data.visits, days]
    );

    const bookingTrend = useMemo(
        () =>
            buildTrend(
                data.bookings,
                (booking) => getDateKey(booking?.booking_date || booking?.created_at),
                days
            ),
        [data.bookings, days]
    );

    // Sticker Statuses Chart list
    const stickerStatuses = useMemo(() => {
        const grouped = new Map();
        data.stickers.forEach((sticker) => {
            const status = normalizeStatus(sticker?.status) || "UNKNOWN";
            grouped.set(status, (grouped.get(status) || 0) + 1);
        });

        const preferredOrder = [
            "ACTIVE",
            "PENDING",
            "REJECTED",
            "REVOKED",
            "EXPIRED",
            "CANCELLED",
        ];

        return Array.from(grouped.entries())
            .sort(([a], [b]) => {
                const aIndex = preferredOrder.indexOf(a);
                const bIndex = preferredOrder.indexOf(b);
                if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
            })
            .map(([key, value]) => ({
                key,
                value,
                label: key.replaceAll("_", " ").toLowerCase(),
            }));
    }, [data.stickers]);

    // Current Date
    const currentDate = new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    /* =========================================================
       METRICS CARDS DATA
    ========================================================= */

    const overviewMetrics = [
        {
            label: "Visitors Today",
            value: visitorsToday.length,
            detail: `${visitorsInside.length} currently inside`,
            icon: "bi-person-walking",
            route: "/admin/visitors",
        },
        {
            label: "Pending Visitors",
            value: pendingVisitors.length,
            detail: "Waiting for entry",
            icon: "bi-person-vcard",
            route: "/admin/visitors",
        },
        {
            label: "Approved Facilities",
            value: facilityApproved.length,
            detail: `${facilityApproved.length} approved bookings`,
            icon: "bi-calendar-check",
            route: "/admin/facility-bookings",
        },
        {
            label: "Security Gates",
            value: data.gates.length,
            detail: `${activeGates.length} operational`,
            icon: "bi-door-open",
            route: "/admin/gates",
        },
    ];

    /* =========================================================
       QUICK ACTIONS DATA
    ========================================================= */

    const quickActions = [
        {
            title: "Manage Residents",
            description: `${activeResidents.length} active profiles`,
            icon: "bi-people",
            route: "/admin/residents",
        },
        {
            title: "Manage Properties",
            description: `${data.properties.length} registered properties`,
            icon: "bi-buildings",
            route: "/admin/properties",
        },
        {
            title: "Manage Visitors",
            description: `${pendingVisitors.length} pending • ${visitorsInside.length} inside`,
            icon: "bi-person-vcard",
            route: "/admin/visitors",
        },
        {
            title: "Manage Vehicles",
            description: `${activeVehicles.length} active vehicles`,
            icon: "bi-car-front",
            route: "/admin/vehicles",
        },
        {
            title: "Motorist Stickers",
            description: `${activeStickers.length} active • ${pendingStickers.length} pending`,
            icon: "bi-shield-check",
            route: "/admin/stickers",
        },
        {
            title: "Gate Management",
            description: `${activeGates.length} of ${data.gates.length} operational`,
            icon: "bi-door-open",
            route: "/admin/gates",
        },
    ];

    /* =========================================================
       LOADING RENDER
    ========================================================= */

    if (loading) {
        return (
            <>
                <style>{dashboardStyles}</style>
                <div className="ores-admin-dashboard">
                    <div
                        className="d-flex align-items-center justify-content-center"
                        style={{ minHeight: "60vh" }}
                    >
                        <div className="text-center">
                            <div className="spinner-border" role="status" aria-hidden="true" />
                            <div className="mt-3 text-muted small">
                                Loading live oRES data...
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    /* =========================================================
       MAIN RENDER
    ========================================================= */

    return (
        <>
            <style>{dashboardStyles}</style>

            <div className="ores-admin-dashboard">
                {/* =================================================
                    HEADER
                ================================================= */}
                <section className="ores-admin-header">
                    <div className="ores-admin-header-copy">
                        <div className="ores-admin-eyebrow">ADMINISTRATION</div>
                        <h1 className="ores-admin-title">Hello! {adminName}</h1>
                        <p className="ores-admin-description">
                            Monitor residents, properties, facilities, visitor movement, vehicle access, motorist
                            stickers, and gate operations.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="ores-admin-refresh border-0"
                        onClick={() => loadDashboard(true)}
                        disabled={refreshing}
                    >
                        <div className="ores-admin-refresh-icon">
                            {refreshing ? (
                                <span className="spinner-border spinner-border-sm" />
                            ) : (
                                <i className="bi bi-arrow-clockwise" />
                            )}
                        </div>
                        <div className="ores-admin-refresh-copy">
                            <span className="ores-admin-refresh-label">Today is</span>
                            <strong>{refreshing ? "Refreshing..." : currentDate}</strong>
                        </div>
                    </button>
                </section>

                {/* =================================================
                    ERROR NOTICE
                ================================================= */}
                {error && (
                    <div className="ores-admin-error">
                        <i className="bi bi-exclamation-triangle" />
                        <span>{error}</span>
                    </div>
                )}

                {/* =================================================
                    VISUAL ANALYTICS & CHARTS
                ================================================= */}
                <section className="ores-admin-section">
                    <div className="ores-admin-section-heading">
                        <div>
                            <h2>System Overview</h2>
                            <p>Interactive metric breakdowns, operational counts, and profile distributions.</p>
                        </div>
                    </div>

                    <div className="ores-charts-grid">
                        {/* FIRST SECTION OF CHARTS */}

                        {/* 1. VISITOR ACTIVITY TREND — LINE */}
                        <MetricCard
                            wide
                            title="Visitor Activity Trend"
                            subtitle="Visitor visit records over the last 7 days."
                        >
                            {data.visits.length === 0 ? (
                                <div
                                    className="text-center"
                                    style={{
                                        minHeight: "220px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#98a1ad",
                                        fontSize: "0.70rem",
                                    }}
                                >
                                    No visitor activity records available.
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="mb-2"
                                        style={{
                                            color: "#7e8998",
                                            fontSize: "0.61rem",
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.08em",
                                        }}
                                    >
                                        Daily visitor visits
                                    </div>

                                    <TrendChart
                                        labels={days.map((item) => item.display)}
                                        values={visitorTrend}
                                    />
                                </>
                            )}
                        </MetricCard>

                        {/* 2. RESIDENT COMPOSITION — DOUGHNUT */}
                        <MetricCard
                            title="Resident Homeowner/Tenant Composition"
                            subtitle="Current resident profile composition."
                        >
                            <ResidentCompositionChart
                                homeowners={homeowners.length}
                                tenants={tenants.length}
                            />
                        </MetricCard>

                        {/* STAT CARDS — POSITIONED DIRECTLY BENEATH THE FIRST SECTION OF CHARTS */}
                        <div style={{ gridColumn: "span 12", margin: "2px 0" }}>
                            <div className="ores-metric-grid">
                                {overviewMetrics.map((metric) => (
                                    <Link key={metric.label} to={metric.route} className="ores-metric-card">
                                        <div className="ores-metric-top">
                                            <div className="ores-metric-icon">
                                                <i className={`bi ${metric.icon}`} />
                                            </div>
                                            <i className="bi bi-arrow-up-right ores-metric-arrow" />
                                        </div>
                                        <div className="ores-metric-value">{metric.value}</div>
                                        <div className="ores-metric-label">{metric.label}</div>
                                        <div className="ores-metric-detail">{metric.detail}</div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* SECOND SECTION OF CHARTS */}

                        {/* 3. RESIDENT ACTIVE/INACTIVE — BAR */}
                        <MetricCard
                            title="Resident Active/Inactive"
                            subtitle="Current active status across resident profiles."
                        >
                            <div
                                className="mb-3"
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "baseline",
                                }}
                            >
                                <strong style={{ color: "#1f2b3c", fontSize: "1.55rem" }}>
                                    {formatNumber(data.residents.length)}
                                </strong>
                                <span style={{ color: "#959eaa", fontSize: "0.64rem" }}>
                                    Total Residents
                                </span>
                            </div>

                            <ResidentActivityChart
                                active={activeResidents.length}
                                inactive={inactiveResidents.length}
                            />
                        </MetricCard>

                        {/* 4. MOTORIST STICKER STATUS — HORIZONTAL BARS */}
                        <MetricCard
                            wide
                            title="Motorist Sticker Status"
                            subtitle="Current sticker records grouped by status."
                        >
                            <div
                                className="mb-3"
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "baseline",
                                }}
                            >
                                <strong style={{ color: "#1f2b3c", fontSize: "1.55rem" }}>
                                    {formatNumber(data.stickers.length)}
                                </strong>
                                <span style={{ color: "#959eaa", fontSize: "0.64rem" }}>
                                    Total Stickers
                                </span>
                            </div>

                            <StickerStatusChart items={stickerStatuses} />
                        </MetricCard>

                        {/* THIRD SECTION OF CHARTS — SIDE-BY-SIDE */}

                        {/* 5. FACILITY BOOKING TREND — LINE (7 COLUMNS) */}
                        <MetricCard
                            wide
                            title="Facility Booking Trend"
                            subtitle="Facility booking records by booking date over the last 7 days."
                        >
                            {data.bookings.length === 0 ? (
                                <div
                                    className="text-center"
                                    style={{
                                        minHeight: "220px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#98a1ad",
                                        fontSize: "0.70rem",
                                    }}
                                >
                                    No facility booking records available.
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="mb-2"
                                        style={{
                                            color: "#7e8998",
                                            fontSize: "0.61rem",
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.08em",
                                        }}
                                    >
                                        Daily facility bookings
                                    </div>

                                    <TrendChart
                                        labels={days.map((item) => item.display)}
                                        values={bookingTrend}
                                    />
                                </>
                            )}
                        </MetricCard>

                        {/* 6. PROPERTY OCCUPANCY STATUS — VERTICAL BAR CHART (5 COLUMNS) */}
                        <MetricCard
                            title="Property Occupancy Status"
                            subtitle="Occupied vs vacant property units."
                        >
                            <PropertyOccupancyChart
                                occupied={occupiedProperties.length}
                                vacant={vacantProperties.length}
                            />
                        </MetricCard>
                    </div>
                </section>

                {/* =================================================
                    QUICK ACTIONS
                ================================================= */}
                <section className="ores-admin-section">
                    <div className="ores-admin-section-heading">
                        <div>
                            <h2>Administration</h2>
                            <p>Frequently used oRES management modules.</p>
                        </div>
                    </div>

                    <section className="ores-panel">
                        <div className="ores-panel-header">
                            <div>
                                <h2 className="ores-panel-title">Quick Actions</h2>
                                <p className="ores-panel-subtitle">
                                    Open the main management areas directly.
                                </p>
                            </div>
                            <div className="ores-panel-icon">
                                <i className="bi bi-lightning-charge" />
                            </div>
                        </div>

                        <div className="ores-actions-grid">
                            {quickActions.map((action) => (
                                <Link
                                    key={action.title}
                                    to={action.route}
                                    className="ores-action-card"
                                >
                                    <div className="ores-action-icon">
                                        <i className={`bi ${action.icon}`} />
                                    </div>
                                    <div className="ores-action-copy">
                                        <div className="ores-action-title">{action.title}</div>
                                        <div className="ores-action-description">
                                            {action.description}
                                        </div>
                                    </div>
                                    <i className="bi bi-chevron-right ores-action-arrow" />
                                </Link>
                            ))}
                        </div>
                    </section>
                </section>

                {/* =================================================
                    RECENT ACTIVITY & ATTENTION REQUIRED
                ================================================= */}
                <section className="ores-admin-section mb-0">
                    <div className="ores-panel-grid">
                        <section className="ores-panel">
                            <div className="ores-panel-header">
                                <div>
                                    <h2 className="ores-panel-title">Recent Visitor Activity</h2>
                                    <p className="ores-panel-subtitle">
                                        Latest recorded gate movements.
                                    </p>
                                </div>
                                <div className="ores-panel-icon">
                                    <i className="bi bi-clock-history" />
                                </div>
                            </div>

                            {recentVisits.length === 0 ? (
                                <div className="ores-empty">
                                    <div className="ores-empty-icon">
                                        <i className="bi bi-inbox" />
                                    </div>
                                    <h3>No recent visitor activity</h3>
                                    <p>
                                        Visitor visit records will appear here as activity is recorded.
                                    </p>
                                </div>
                            ) : (
                                <div className="ores-table-wrapper">
                                    <table className="ores-table">
                                        <thead>
                                            <tr>
                                                <th>Visitor</th>
                                                <th>Host</th>
                                                <th>Time In</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentVisits.map((visit) => (
                                                <tr key={visit.id || visit.created_at}>
                                                    <td>
                                                        <strong>{visit.visitor_name || "—"}</strong>
                                                        {visit.visitor_phone && (
                                                            <div className="ores-table-subtext">
                                                                {visit.visitor_phone}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>{visit.host_name || "—"}</td>
                                                    <td>{formatTime(visit.time_in)}</td>
                                                    <td>
                                                        <span className="ores-status">
                                                            <span>●</span>
                                                            {visit.status_display ||
                                                                visit.status ||
                                                                "—"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        {/* STATUS SUMMARY */}
                        <section className="ores-panel">
                            <div className="ores-panel-header">
                                <div>
                                    <h2 className="ores-panel-title">Attention Required</h2>
                                    <p className="ores-panel-subtitle">
                                        Items that may need administrative action.
                                    </p>
                                </div>
                                <div className="ores-panel-icon">
                                    <i className="bi bi-exclamation-circle" />
                                </div>
                            </div>

                            <div className="ores-health-body">
                                <div className="ores-health-list">
                                    <div className="ores-health-row">
                                        <span>Pending visitors</span>
                                        <strong>{pendingVisitors.length}</strong>
                                    </div>
                                    <div className="ores-health-row">
                                        <span>Pending stickers</span>
                                        <strong>{pendingStickers.length}</strong>
                                    </div>
                                    <div className="ores-health-row">
                                        <span>Inactive residents</span>
                                        <strong>{inactiveResidents.length}</strong>
                                    </div>
                                    <div className="ores-health-row">
                                        <span>Inactive vehicles</span>
                                        <strong>{inactiveVehicles.length}</strong>
                                    </div>
                                    <div className="ores-health-row">
                                        <span>Revoked stickers</span>
                                        <strong>{revokedStickers.length}</strong>
                                    </div>
                                    <div className="ores-health-row">
                                        <span>Inactive gates</span>
                                        <strong>{inactiveGates.length}</strong>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </section>
            </div>
        </>
    );
}

// import {
//     useCallback,
//     useEffect,
//     useMemo,
//     useState,
// } from "react";

// import useAuth from "../../hooks/useAuth";

// import {
//     getResidents,
// } from "../../api/residents";

// import {
//     getVisitorVisits,
// } from "../../api/visitors";

// import {
//     getMotoristStickers,
// } from "../../api/vehicles";

// import {
//     getFacilityBookings,
// } from "../../api/facilities";


// /* =========================================================
//    HELPERS
// ========================================================= */

// const normalize = (
//     response,
//     keys = []
// ) => {
//     if (
//         Array.isArray(response)
//     ) {
//         return response;
//     }

//     if (
//         Array.isArray(
//             response?.results
//         )
//     ) {
//         return response.results;
//     }

//     for (
//         const key of keys
//     ) {
//         if (
//             Array.isArray(
//                 response?.[key]
//             )
//         ) {
//             return response[key];
//         }
//     }

//     return [];
// };


// const normalizeStatus = (
//     value
// ) => {
//     return String(
//         value || ""
//     )
//         .trim()
//         .toUpperCase();
// };


// const getDateKey = (
//     value
// ) => {
//     if (
//         !value
//     ) {
//         return null;
//     }

//     const text =
//         String(value);

//     if (
//         /^\d{4}-\d{2}-\d{2}$/.test(
//             text
//         )
//     ) {
//         return text;
//     }

//     const date =
//         new Date(value);

//     if (
//         Number.isNaN(
//             date.getTime()
//         )
//     ) {
//         return null;
//     }

//     const year =
//         date.getFullYear();

//     const month =
//         String(
//             date.getMonth() + 1
//         ).padStart(
//             2,
//             "0"
//         );

//     const day =
//         String(
//             date.getDate()
//         ).padStart(
//             2,
//             "0"
//         );

//     return `${year}-${month}-${day}`;
// };


// const getLast7Days = () => {
//     const result = [];
//     const today = new Date();

//     today.setHours(
//         0,
//         0,
//         0,
//         0
//     );

//     for (
//         let index = 6;
//         index >= 0;
//         index--
//     ) {
//         const date =
//             new Date(
//                 today
//             );

//         date.setDate(
//             today.getDate() -
//             index
//         );

//         result.push({
//             key:
//                 getDateKey(
//                     date
//                 ),

//             label:
//                 date.toLocaleDateString(
//                     undefined,
//                     {
//                         weekday:
//                             "short",
//                     }
//                 ),

//             display:
//                 date.toLocaleDateString(
//                     undefined,
//                     {
//                         month:
//                             "short",
//                         day:
//                             "numeric",
//                     }
//                 ),
//         });
//     }

//     return result;
// };


// const buildTrend = (
//     records,
//     dateGetter,
//     days
// ) => {
//     const counts =
//         {};

//     days.forEach(
//         (
//             day
//         ) => {
//             counts[
//                 day.key
//             ] = 0;
//         }
//     );

//     records.forEach(
//         (
//             record
//         ) => {
//             const key =
//                 dateGetter(
//                     record
//                 );

//             if (
//                 key &&
//                 Object.prototype.hasOwnProperty.call(
//                     counts,
//                     key
//                 )
//             ) {
//                 counts[key] += 1;
//             }
//         }
//     );

//     return days.map(
//         (
//             day
//         ) =>
//             counts[
//                 day.key
//             ] || 0
//     );
// };


// const formatNumber = (
//     value
// ) => {
//     return Number(
//         value || 0
//     ).toLocaleString();
// };


// const formatPercentage = (
//     value,
//     total
// ) => {
//     if (
//         !total
//     ) {
//         return "0%";
//     }

//     return `${Math.round(
//         (
//             value /
//             total
//         ) * 100
//     )}%`;
// };


// /* =========================================================
//    INLINE TREND LINE
// ========================================================= */

// function TrendChart({
//     labels,
//     values,
// }) {
//     const width = 760;
//     const height = 280;

//     const left = 42;
//     const right = 18;
//     const top = 20;
//     const bottom = 44;

//     const plotWidth =
//         width -
//         left -
//         right;

//     const plotHeight =
//         height -
//         top -
//         bottom;

//     const max =
//         Math.max(
//             1,
//             ...values
//         );

//     const points =
//         values.map(
//             (
//                 value,
//                 index
//             ) => {
//                 const x =
//                     values.length === 1
//                         ? left +
//                           plotWidth /
//                               2
//                         : left +
//                           (
//                               index /
//                               (
//                                   values.length -
//                                   1
//                               )
//                           ) *
//                           plotWidth;

//                 const y =
//                     top +
//                     plotHeight -
//                     (
//                         value /
//                         max
//                     ) *
//                     plotHeight;

//                 return {
//                     x,
//                     y,
//                     value,
//                 };
//             }
//         );

//     const line =
//         points
//             .map(
//                 (
//                     point
//                 ) =>
//                     `${point.x},${point.y}`
//             )
//             .join(" ");

//     return (
//         <svg
//             viewBox={`0 0 ${width} ${height}`}
//             className="w-100"
//             role="img"
//             aria-label="Trend chart"
//         >

//             {[0, 0.25, 0.5, 0.75, 1].map(
//                 (
//                     ratio
//                 ) => {
//                     const y =
//                         top +
//                         plotHeight -
//                         ratio *
//                             plotHeight;

//                     return (
//                         <g
//                             key={
//                                 ratio
//                             }
//                         >

//                             <line
//                                 x1={
//                                     left
//                                 }
//                                 x2={
//                                     width -
//                                     right
//                                 }
//                                 y1={
//                                     y
//                                 }
//                                 y2={
//                                     y
//                                 }
//                                 stroke="rgba(148,163,184,.17)"
//                                 strokeWidth="1"
//                             />

//                             <text
//                                 x={
//                                     left -
//                                     8
//                                 }
//                                 y={
//                                     y +
//                                     4
//                                 }
//                                 textAnchor="end"
//                                 fontSize="10"
//                                 fill="#8e98a5"
//                             >
//                                 {
//                                     Math.round(
//                                         max *
//                                             ratio
//                                     )
//                                 }
//                             </text>

//                         </g>
//                     );
//                 }
//             )}


//             <polyline
//                 points={
//                     line
//                 }
//                 fill="none"
//                 stroke="#6f8f7a"
//                 strokeWidth="3"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//             />


//             {points.map(
//                 (
//                     point,
//                     index
//                 ) => (
//                     <g
//                         key={
//                             `${point.x}-${index}`
//                         }
//                     >

//                         <circle
//                             cx={
//                                 point.x
//                             }
//                             cy={
//                                 point.y
//                             }
//                             r="4"
//                             fill="#ffffff"
//                             stroke="#6f8f7a"
//                             strokeWidth="2"
//                         />

//                         <text
//                             x={
//                                 point.x
//                             }
//                             y={
//                                 height -
//                                 14
//                             }
//                             textAnchor="middle"
//                             fontSize="10"
//                             fill="#8e98a5"
//                         >
//                             {
//                                 labels[
//                                     index
//                                 ]
//                             }
//                         </text>

//                     </g>
//                 )
//             )}

//         </svg>
//     );
// }


// /* =========================================================
//    DOUGHNUT
// ========================================================= */

// function ResidentCompositionChart({
//     homeowners,
//     tenants,
// }) {
//     const total =
//         homeowners +
//         tenants;

//     const homeownerPercent =
//         total > 0
//             ? (
//                   homeowners /
//                   total
//               ) * 100
//             : 0;

//     const split =
//         homeownerPercent *
//         3.6;

//     const background =
//         total > 0
//             ? `conic-gradient(#6f8f7a 0deg ${split}deg, #aeb8c2 ${split}deg 360deg)`
//             : "conic-gradient(#d9dee4 0deg 360deg)";

//     return (
//         <div
//             style={{
//                 minHeight:
//                     "260px",
//                 display:
//                     "flex",
//                 alignItems:
//                     "center",
//                 justifyContent:
//                     "center",
//                 gap:
//                     "32px",
//                 flexWrap:
//                     "wrap",
//             }}
//         >

//             <div
//                 style={{
//                     width:
//                         "180px",
//                     height:
//                         "180px",
//                     borderRadius:
//                         "50%",
//                     background,
//                     display:
//                         "grid",
//                     placeItems:
//                         "center",
//                     flex:
//                         "0 0 180px",
//                 }}
//             >

//                 <div
//                     style={{
//                         width:
//                             "112px",
//                         height:
//                             "112px",
//                         borderRadius:
//                             "50%",
//                         background:
//                             "#ffffff",
//                         display:
//                             "flex",
//                         flexDirection:
//                             "column",
//                         alignItems:
//                             "center",
//                         justifyContent:
//                             "center",
//                     }}
//                 >

//                     <strong
//                         style={{
//                             fontSize:
//                                 "1.55rem",
//                             color:
//                                 "#273245",
//                         }}
//                     >
//                         {
//                             formatNumber(
//                                 total
//                             )
//                         }
//                     </strong>

//                     <span
//                         style={{
//                             fontSize:
//                                 "0.62rem",
//                             color:
//                                 "#929ca8",
//                         }}
//                     >
//                         Residents
//                     </span>

//                 </div>

//             </div>


//             <div
//                 style={{
//                     minWidth:
//                         "190px",
//                 }}
//             >

//                 <div
//                     className="d-flex align-items-center justify-content-between gap-3 mb-3"
//                 >

//                     <span
//                         className="d-flex align-items-center gap-2"
//                         style={{
//                             fontSize:
//                                 "0.70rem",
//                             color:
//                                 "#667284",
//                         }}
//                     >

//                         <span
//                             style={{
//                                 width:
//                                     "9px",
//                                 height:
//                                     "9px",
//                                 borderRadius:
//                                     "50%",
//                                 background:
//                                     "#6f8f7a",
//                             }}
//                         />

//                         Homeowners

//                     </span>

//                     <strong
//                         style={{
//                             color:
//                                 "#344052",
//                         }}
//                     >
//                         {
//                             formatNumber(
//                                 homeowners
//                             )
//                         }
//                         {" "}
//                         <small
//                             style={{
//                                 color:
//                                     "#9aa2ad",
//                             }}
//                         >
//                             (
//                             {
//                                 formatPercentage(
//                                     homeowners,
//                                     total
//                                 )
//                             }
//                             )
//                         </small>
//                     </strong>

//                 </div>


//                 <div
//                     className="d-flex align-items-center justify-content-between gap-3"
//                 >

//                     <span
//                         className="d-flex align-items-center gap-2"
//                         style={{
//                             fontSize:
//                                 "0.70rem",
//                             color:
//                                 "#667284",
//                         }}
//                     >

//                         <span
//                             style={{
//                                 width:
//                                     "9px",
//                                 height:
//                                     "9px",
//                                 borderRadius:
//                                     "50%",
//                                 background:
//                                     "#aeb8c2",
//                             }}
//                         />

//                         Tenants

//                     </span>

//                     <strong
//                         style={{
//                             color:
//                                 "#344052",
//                         }}
//                     >
//                         {
//                             formatNumber(
//                                 tenants
//                             )
//                         }
//                         {" "}
//                         <small
//                             style={{
//                                 color:
//                                     "#9aa2ad",
//                             }}
//                         >
//                             (
//                             {
//                                 formatPercentage(
//                                     tenants,
//                                     total
//                                 )
//                             }
//                             )
//                         </small>
//                     </strong>

//                 </div>

//             </div>

//         </div>
//     );
// }


// /* =========================================================
//    100% ACTIVE / INACTIVE BAR
// ========================================================= */

// function ResidentActivityChart({
//     active,
//     inactive,
// }) {
//     const total =
//         active +
//         inactive;

//     const activeWidth =
//         total > 0
//             ? (
//                   active /
//                   total
//               ) * 100
//             : 0;

//     return (
//         <div>

//             <div
//                 style={{
//                     width:
//                         "100%",
//                     height:
//                         "34px",
//                     display:
//                         "flex",
//                     overflow:
//                         "hidden",
//                     borderRadius:
//                         "999px",
//                     background:
//                         "#edf0f3",
//                 }}
//             >

//                 <div
//                     style={{
//                         width:
//                             `${activeWidth}%`,
//                         background:
//                             "#6f8f7a",
//                         transition:
//                             "width .25s ease",
//                     }}
//                 />

//                 <div
//                     style={{
//                         flex:
//                             1,
//                         background:
//                             "#b8c1ca",
//                     }}
//                 />

//             </div>


//             <div
//                 className="d-flex justify-content-between flex-wrap gap-3 mt-3"
//             >

//                 <div
//                     className="d-flex align-items-center gap-2"
//                 >

//                     <span
//                         style={{
//                             width:
//                                 "8px",
//                             height:
//                                 "8px",
//                             borderRadius:
//                                 "50%",
//                             background:
//                                 "#6f8f7a",
//                         }}
//                     />

//                     <span
//                         style={{
//                             fontSize:
//                                 "0.68rem",
//                             color:
//                                 "#758092",
//                         }}
//                     >
//                         Active
//                     </span>

//                     <strong>
//                         {
//                             formatNumber(
//                                 active
//                             )
//                         }
//                     </strong>

//                     <small
//                         style={{
//                             color:
//                                 "#9ba3ae",
//                         }}
//                     >
//                         {
//                             formatPercentage(
//                                 active,
//                                 total
//                             )
//                         }
//                     </small>

//                 </div>


//                 <div
//                     className="d-flex align-items-center gap-2"
//                 >

//                     <span
//                         style={{
//                             width:
//                                 "8px",
//                             height:
//                                 "8px",
//                             borderRadius:
//                                 "50%",
//                             background:
//                                 "#b8c1ca",
//                         }}
//                     />

//                     <span
//                         style={{
//                             fontSize:
//                                 "0.68rem",
//                             color:
//                                 "#758092",
//                         }}
//                     >
//                         Inactive
//                     </span>

//                     <strong>
//                         {
//                             formatNumber(
//                                 inactive
//                             )
//                         }
//                     </strong>

//                     <small
//                         style={{
//                             color:
//                                 "#9ba3ae",
//                         }}
//                     >
//                         {
//                             formatPercentage(
//                                 inactive,
//                                 total
//                             )
//                         }
//                     </small>

//                 </div>

//             </div>

//         </div>
//     );
// }


// /* =========================================================
//    STICKER HORIZONTAL BARS
// ========================================================= */

// function StickerStatusChart({
//     items,
// }) {
//     if (
//         items.length === 0
//     ) {
//         return (
//             <div
//                 className="text-center"
//                 style={{
//                     padding:
//                         "60px 20px",
//                     color:
//                         "#99a2ad",
//                     fontSize:
//                         "0.70rem",
//                 }}
//             >
//                 No motorist sticker records available.
//             </div>
//         );
//     }

//     const max =
//         Math.max(
//             1,
//             ...items.map(
//                 (
//                     item
//                 ) =>
//                     item.value
//             )
//         );

//     return (
//         <div
//             className="d-flex flex-column gap-3"
//         >

//             {items.map(
//                 (
//                     item
//                 ) => (
//                     <div
//                         key={
//                             item.key
//                         }
//                     >

//                         <div
//                             className="d-flex align-items-center justify-content-between mb-1"
//                         >

//                             <span
//                                 style={{
//                                     color:
//                                         "#667284",
//                                     fontSize:
//                                         "0.68rem",
//                                     textTransform:
//                                         "capitalize",
//                                 }}
//                             >
//                                 {
//                                     item.label
//                                 }
//                             </span>

//                             <strong
//                                 style={{
//                                     color:
//                                         "#344052",
//                                     fontSize:
//                                         "0.70rem",
//                                 }}
//                             >
//                                 {
//                                     formatNumber(
//                                         item.value
//                                     )
//                                 }
//                             </strong>

//                         </div>


//                         <div
//                             style={{
//                                 height:
//                                     "9px",
//                                 overflow:
//                                     "hidden",
//                                 borderRadius:
//                                     "999px",
//                                 background:
//                                     "#edf0f3",
//                             }}
//                         >

//                             <div
//                                 style={{
//                                     width:
//                                         `${(
//                                             item.value /
//                                             max
//                                         ) * 100}%`,
//                                     height:
//                                         "100%",
//                                     borderRadius:
//                                         "999px",
//                                     background:
//                                         "#6f8f7a",
//                                 }}
//                             />

//                         </div>

//                     </div>
//                 )
//             )}

//         </div>
//     );
// }


// /* =========================================================
//    METRIC CARD
// ========================================================= */

// function MetricCard({
//     title,
//     subtitle,
//     children,
//     wide = false,
// }) {
//     return (
//         <section
//             style={{
//                 gridColumn:
//                     wide
//                         ? "span 7"
//                         : "span 5",

//                 minWidth:
//                     0,

//                 overflow:
//                     "hidden",

//                 border:
//                     "1px solid rgba(148,163,184,.14)",

//                 borderRadius:
//                     "18px",

//                 background:
//                     "rgba(255,255,255,.72)",

//                 boxShadow:
//                     "0 10px 30px rgba(15,23,42,.045)",

//                 backdropFilter:
//                     "blur(18px)",

//                 WebkitBackdropFilter:
//                     "blur(18px)",
//             }}
//         >

//             <div
//                 style={{
//                     padding:
//                         "18px 20px 14px",

//                     borderBottom:
//                         "1px solid rgba(148,163,184,.10)",
//                 }}
//             >

//                 <h2
//                     style={{
//                         margin:
//                             0,

//                         color:
//                             "#293446",

//                         fontSize:
//                             "0.87rem",

//                         fontWeight:
//                             700,
//                     }}
//                 >
//                     {
//                         title
//                     }
//                 </h2>

//                 <p
//                     style={{
//                         margin:
//                             "4px 0 0",

//                         color:
//                             "#98a0ac",

//                         fontSize:
//                             "0.64rem",

//                         lineHeight:
//                             1.5,
//                     }}
//                 >
//                     {
//                         subtitle
//                     }
//                 </p>

//             </div>


//             <div
//                 style={{
//                     padding:
//                         "18px 20px 20px",
//                 }}
//             >
//                 {
//                     children
//                 }
//             </div>

//         </section>
//     );
// }


// /* =========================================================
//    ADMIN DASHBOARD
// ========================================================= */

// export default function AdminDashboard() {
//     const {
//         user,
//     } = useAuth();

//     const [
//         loading,
//         setLoading,
//     ] = useState(true);

//     const [
//         refreshing,
//         setRefreshing,
//     ] = useState(false);

//     const [
//         error,
//         setError,
//     ] = useState("");

//     const [
//         moduleErrors,
//         setModuleErrors,
//     ] = useState([]);

//     const [
//         data,
//         setData,
//     ] = useState({
//         residents: [],
//         visits: [],
//         stickers: [],
//         bookings: [],
//     });


//     const adminName =
//         user?.first_name ||
//         user?.username ||
//         "Administrator";


//     /* =====================================================
//        LOAD
//     ===================================================== */

//     const loadDashboard =
//         useCallback(
//             async (
//                 refresh = false
//             ) => {
//                 if (
//                     refresh
//                 ) {
//                     setRefreshing(
//                         true
//                     );
//                 } else {
//                     setLoading(
//                         true
//                     );
//                 }

//                 setError("");
//                 setModuleErrors([]);


//                 const safeRequest =
//                     async (
//                         name,
//                         request
//                     ) => {
//                         try {
//                             return {
//                                 name,
//                                 success:
//                                     true,
//                                 data:
//                                     await request(),
//                             };
//                         } catch (
//                             err
//                         ) {
//                             console.error(
//                                 `[oRES Dashboard] ${name} failed:`,
//                                 err
//                             );

//                             return {
//                                 name,
//                                 success:
//                                     false,
//                                 data:
//                                     null,
//                                 error:
//                                     err,
//                             };
//                         }
//                     };


//                 try {
//                     const [
//                         residentsResult,
//                         visitsResult,
//                         stickersResult,
//                         bookingsResult,
//                     ] = await Promise.all([
//                         safeRequest(
//                             "Residents",
//                             getResidents
//                         ),

//                         safeRequest(
//                             "Visitor Visits",
//                             getVisitorVisits
//                         ),

//                         safeRequest(
//                             "Motorist Stickers",
//                             getMotoristStickers
//                         ),

//                         safeRequest(
//                             "Facility Bookings",
//                             getFacilityBookings
//                         ),
//                     ]);


//                     const residents =
//                         normalize(
//                             residentsResult.data,
//                             [
//                                 "residents",
//                             ]
//                         );

//                     const visits =
//                         normalize(
//                             visitsResult.data,
//                             [
//                                 "visits",
//                             ]
//                         );

//                     const stickers =
//                         normalize(
//                             stickersResult.data,
//                             [
//                                 "stickers",
//                             ]
//                         );

//                     const bookings =
//                         normalize(
//                             bookingsResult.data,
//                             [
//                                 "bookings",
//                             ]
//                         );


//                     setData({
//                         residents,
//                         visits,
//                         stickers,
//                         bookings,
//                     });


//                     const failed =
//                         [
//                             residentsResult,
//                             visitsResult,
//                             stickersResult,
//                             bookingsResult,
//                         ]
//                             .filter(
//                                 (
//                                     item
//                                 ) =>
//                                     !item.success
//                             )
//                             .map(
//                                 (
//                                     item
//                                 ) =>
//                                     item.name
//                             );

//                     setModuleErrors(
//                         failed
//                     );

//                     if (
//                         failed.length > 0
//                     ) {
//                         setError(
//                             `Some metrics could not be loaded: ${failed.join(", ")}.`
//                         );
//                     }
//                 } catch (
//                     err
//                 ) {
//                     console.error(
//                         "[oRES Dashboard]",
//                         err
//                     );

//                     setError(
//                         err?.response?.data?.detail ||
//                         err?.response?.data?.message ||
//                         "Unable to load the administration dashboard."
//                     );
//                 } finally {
//                     setLoading(
//                         false
//                     );

//                     setRefreshing(
//                         false
//                     );
//                 }
//             },
//             []
//         );


//     useEffect(
//         () => {
//             loadDashboard();
//         },
//         [
//             loadDashboard,
//         ]
//     );


//     /* =====================================================
//        TREND DATA
//     ===================================================== */

//     const days =
//         useMemo(
//             () =>
//                 getLast7Days(),
//             []
//         );


//     const visitorTrend =
//         useMemo(
//             () =>
//                 buildTrend(
//                     data.visits,
//                     (
//                         visit
//                     ) =>
//                         getDateKey(
//                             visit?.time_in ||
//                             visit?.created_at
//                         ),
//                     days
//                 ),
//             [
//                 data.visits,
//                 days,
//             ]
//         );


//     const bookingTrend =
//         useMemo(
//             () =>
//                 buildTrend(
//                     data.bookings,
//                     (
//                         booking
//                     ) =>
//                         getDateKey(
//                             booking?.booking_date ||
//                             booking?.created_at
//                         ),
//                     days
//                 ),
//             [
//                 data.bookings,
//                 days,
//             ]
//         );


//     /* =====================================================
//        RESIDENT COMPOSITION
//     ===================================================== */

//     const homeownerCount =
//         useMemo(
//             () =>
//                 data.residents.filter(
//                     (
//                         resident
//                     ) =>
//                         normalizeStatus(
//                             resident?.resident_type
//                         ) ===
//                         "HOMEOWNER"
//                 ).length,
//             [
//                 data.residents,
//             ]
//         );


//     const tenantCount =
//         useMemo(
//             () =>
//                 data.residents.filter(
//                     (
//                         resident
//                     ) =>
//                         normalizeStatus(
//                             resident?.resident_type
//                         ) ===
//                         "TENANT"
//                 ).length,
//             [
//                 data.residents,
//             ]
//         );


//     const activeResidentCount =
//         useMemo(
//             () =>
//                 data.residents.filter(
//                     (
//                         resident
//                     ) =>
//                         resident?.is_active ===
//                         true
//                 ).length,
//             [
//                 data.residents,
//             ]
//         );


//     const inactiveResidentCount =
//         Math.max(
//             0,
//             data.residents.length -
//                 activeResidentCount
//         );


//     /* =====================================================
//        STICKERS
//     ===================================================== */

//     const stickerStatuses =
//         useMemo(
//             () => {
//                 const grouped =
//                     new Map();

//                 data.stickers.forEach(
//                     (
//                         sticker
//                     ) => {
//                         const status =
//                             normalizeStatus(
//                                 sticker?.status
//                             ) ||
//                             "UNKNOWN";

//                         grouped.set(
//                             status,
//                             (
//                                 grouped.get(
//                                     status
//                                 ) ||
//                                 0
//                             ) + 1
//                         );
//                     }
//                 );


//                 const preferredOrder = [
//                     "ACTIVE",
//                     "PENDING",
//                     "REJECTED",
//                     "REVOKED",
//                     "EXPIRED",
//                     "CANCELLED",
//                 ];


//                 return Array.from(
//                     grouped.entries()
//                 )
//                     .sort(
//                         (
//                             [a],
//                             [b]
//                         ) => {
//                             const aIndex =
//                                 preferredOrder.indexOf(
//                                     a
//                                 );

//                             const bIndex =
//                                 preferredOrder.indexOf(
//                                     b
//                                 );

//                             if (
//                                 aIndex ===
//                                 -1 &&
//                                 bIndex ===
//                                 -1
//                             ) {
//                                 return a.localeCompare(
//                                     b
//                                 );
//                             }

//                             if (
//                                 aIndex ===
//                                 -1
//                             ) {
//                                 return 1;
//                             }

//                             if (
//                                 bIndex ===
//                                 -1
//                             ) {
//                                 return -1;
//                             }

//                             return (
//                                 aIndex -
//                                 bIndex
//                             );
//                         }
//                     )
//                     .map(
//                         ([
//                             key,
//                             value,
//                         ]) => ({
//                             key,
//                             value,
//                             label:
//                                 key
//                                     .replaceAll(
//                                         "_",
//                                         " "
//                                     )
//                                     .toLowerCase(),
//                         })
//                     );
//             },
//             [
//                 data.stickers,
//             ]
//         );


//     /* =====================================================
//        LOADING
//     ===================================================== */

//     if (
//         loading
//     ) {
//         return (
//             <div className="rems-page-content">

//                 <div
//                     className="d-flex align-items-center justify-content-center"
//                     style={{
//                         minHeight:
//                             "60vh",
//                     }}
//                 >

//                     <div className="text-center">

//                         <div
//                             className="spinner-border"
//                             role="status"
//                             aria-hidden="true"
//                         />

//                         <div
//                             className="mt-3"
//                             style={{
//                                 color:
//                                     "#929baa",
//                                 fontSize:
//                                     "0.70rem",
//                             }}
//                         >
//                             Loading live oRES metrics...
//                         </div>

//                     </div>

//                 </div>

//             </div>
//         );
//     }


//     /* =====================================================
//        RENDER
//     ===================================================== */

//     return (
//         <div
//             className="rems-page-content"
//         >

//             <div
//                 className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4"
//             >

//                 <div>

//                     <div className="rems-page-eyebrow">
//                         ADMINISTRATION
//                     </div>

//                     <h1 className="rems-page-title">
//                         Hello! {adminName}
//                     </h1>

//                     <p className="rems-page-description">
//                         Core operational metrics for
//                         visitors, residents, motorists,
//                         and facility bookings.
//                     </p>

//                 </div>


//                 <button
//                     type="button"
//                     className="rems-secondary-button"
//                     onClick={() =>
//                         loadDashboard(
//                             true
//                         )
//                     }
//                     disabled={
//                         refreshing
//                     }
//                 >

//                     {refreshing ? (
//                         <span
//                             className="spinner-border spinner-border-sm"
//                             aria-hidden="true"
//                         />
//                     ) : (
//                         <span>
//                             ↻
//                         </span>
//                     )}

//                     {
//                         refreshing
//                             ? "Refreshing..."
//                             : "Refresh"
//                     }

//                 </button>

//             </div>


//             {error && (
//                 <div
//                     className="alert alert-warning rems-alert mb-4"
//                     role="alert"
//                 >

//                     <strong>
//                         Dashboard data notice
//                     </strong>

//                     <div className="small mt-1">
//                         {
//                             error
//                         }
//                     </div>

//                     {moduleErrors.length >
//                         0 && (
//                         <div
//                             className="small mt-2"
//                             style={{
//                                 opacity:
//                                     0.8,
//                             }}
//                         >
//                             Failed modules:{" "}
//                             {
//                                 moduleErrors.join(
//                                     ", "
//                                 )
//                             }
//                         </div>
//                     )}

//                 </div>
//             )}


//             <div
//                 style={{
//                     display:
//                         "grid",
//                     gridTemplateColumns:
//                         "repeat(12, minmax(0, 1fr))",
//                     gap:
//                         "18px",
//                 }}
//             >

//                 {/* =================================================
//                     1. VISITOR ACTIVITY TREND — LINE
//                 ================================================= */}

//                 <MetricCard
//                     wide
//                     title="Visitor Activity Trend"
//                     subtitle="Visitor visit records over the last 7 days."
//                 >

//                     {data.visits.length ===
//                     0 ? (
//                         <div
//                             className="text-center"
//                             style={{
//                                 minHeight:
//                                     "220px",
//                                 display:
//                                     "flex",
//                                 alignItems:
//                                     "center",
//                                 justifyContent:
//                                     "center",
//                                 color:
//                                     "#98a1ad",
//                                 fontSize:
//                                     "0.70rem",
//                             }}
//                         >
//                             No visitor activity records available.
//                         </div>
//                     ) : (
//                         <>
//                             <div
//                                 className="mb-2"
//                                 style={{
//                                     color:
//                                         "#7e8998",
//                                     fontSize:
//                                         "0.61rem",
//                                     fontWeight:
//                                         700,
//                                     textTransform:
//                                         "uppercase",
//                                     letterSpacing:
//                                         "0.08em",
//                                 }}
//                             >
//                                 Daily visitor visits
//                             </div>

//                             <TrendChart
//                                 labels={
//                                     days.map(
//                                         (
//                                             item
//                                         ) =>
//                                             item.display
//                                     )
//                                 }
//                                 values={
//                                     visitorTrend
//                                 }
//                             />
//                         </>
//                     )}

//                 </MetricCard>


//                 {/* =================================================
//                     3. RESIDENT HOMEOWNER/TENANT COMPOSITION
//                        — DOUGHNUT
//                 ================================================= */}

//                 <MetricCard
//                     title="Resident Homeowner/Tenant Composition"
//                     subtitle="Current resident profile composition."
//                 >

//                     <ResidentCompositionChart
//                         homeowners={
//                             homeownerCount
//                         }
//                         tenants={
//                             tenantCount
//                         }
//                     />

//                 </MetricCard>


//                 {/* =================================================
//                     4. RESIDENT ACTIVE/INACTIVE — 100%
//                 ================================================= */}

//                 <MetricCard
//                     title="Resident Active/Inactive"
//                     subtitle="Current active status across resident profiles."
//                 >

//                     <div
//                         className="mb-3"
//                         style={{
//                             display:
//                                 "flex",
//                             justifyContent:
//                                 "space-between",
//                             alignItems:
//                                 "baseline",
//                         }}
//                     >

//                         <strong
//                             style={{
//                                 color:
//                                     "#1f2b3c",
//                                 fontSize:
//                                     "1.55rem",
//                             }}
//                         >
//                             {
//                                 formatNumber(
//                                     data.residents.length
//                                 )
//                             }
//                         </strong>

//                         <span
//                             style={{
//                                 color:
//                                     "#959eaa",
//                                 fontSize:
//                                     "0.64rem",
//                             }}
//                         >
//                             Total Residents
//                         </span>

//                     </div>


//                     <ResidentActivityChart
//                         active={
//                             activeResidentCount
//                         }
//                         inactive={
//                             inactiveResidentCount
//                         }
//                     />

//                 </MetricCard>


//                 {/* =================================================
//                     5. MOTORIST STICKER STATUS
//                        — HORIZONTAL BAR
//                 ================================================= */}

//                 <MetricCard
//                     title="Motorist Sticker Status"
//                     subtitle="Current sticker records grouped by status."
//                 >

//                     <div
//                         className="mb-3"
//                         style={{
//                             display:
//                                 "flex",
//                             justifyContent:
//                                 "space-between",
//                             alignItems:
//                                 "baseline",
//                         }}
//                     >

//                         <strong
//                             style={{
//                                 color:
//                                     "#1f2b3c",
//                                 fontSize:
//                                     "1.55rem",
//                             }}
//                         >
//                             {
//                                 formatNumber(
//                                     data.stickers.length
//                                 )
//                             }
//                         </strong>

//                         <span
//                             style={{
//                                 color:
//                                     "#959eaa",
//                                 fontSize:
//                                     "0.64rem",
//                             }}
//                         >
//                             Total Stickers
//                         </span>

//                     </div>


//                     <StickerStatusChart
//                         items={
//                             stickerStatuses
//                         }
//                     />

//                 </MetricCard>


//                 {/* =================================================
//                     9. FACILITY BOOKING TREND — LINE
//                 ================================================= */}

//                 <MetricCard
//                     wide
//                     title="Facility Booking Trend"
//                     subtitle="Facility booking records by booking date over the last 7 days."
//                 >

//                     {data.bookings.length ===
//                     0 ? (
//                         <div
//                             className="text-center"
//                             style={{
//                                 minHeight:
//                                     "220px",
//                                 display:
//                                     "flex",
//                                 alignItems:
//                                     "center",
//                                 justifyContent:
//                                     "center",
//                                 color:
//                                     "#98a1ad",
//                                 fontSize:
//                                     "0.70rem",
//                             }}
//                         >
//                             No facility booking records available.
//                         </div>
//                     ) : (
//                         <>
//                             <div
//                                 className="mb-2"
//                                 style={{
//                                     color:
//                                         "#7e8998",
//                                     fontSize:
//                                         "0.61rem",
//                                     fontWeight:
//                                         700,
//                                     textTransform:
//                                         "uppercase",
//                                     letterSpacing:
//                                         "0.08em",
//                                 }}
//                             >
//                                 Daily facility bookings
//                             </div>

//                             <TrendChart
//                                 labels={
//                                     days.map(
//                                         (
//                                             item
//                                         ) =>
//                                             item.display
//                                     )
//                                 }
//                                 values={
//                                     bookingTrend
//                                 }
//                             />
//                         </>
//                     )}

//                 </MetricCard>

//             </div>

//         </div>
//     );
// }






































// import {
//     Link,
// } from "react-router-dom";

// import {
//     useCallback,
//     useEffect,
//     useMemo,
//     useState,
// } from "react";

// import useAuth from "../../hooks/useAuth";

// import {
//     getProperties,
// } from "../../api/properties";

// import {
//     getResidents,
// } from "../../api/residents";

// import {
//     getVisitorInvitations,
//     getVisitorVisits,
// } from "../../api/visitors";

// import {
//     getVehicles,
//     getMotoristStickers,
// } from "../../api/vehicles";

// import {
//     getGates,
// } from "../../api/security";

// import {
//     getFacilityBookings,
// } from "../../api/facilities";


// export default function AdminDashboard() {

//     const {
//         user,
//     } = useAuth();


//     /* =========================================================
//        STATE
//     ========================================================= */

//     const [
//         loading,
//         setLoading,
//     ] = useState(true);


//     const [
//         refreshing,
//         setRefreshing,
//     ] = useState(false);


//     const [
//         error,
//         setError,
//     ] = useState("");


//     const [
//         data,
//         setData,
//     ] = useState({

//         properties:
//             0,

//         residents:
//             0,

//         homeowners:
//             0,

//         tenants:
//             0,

//         activeResidents:
//             0,

//         inactiveResidents:
//             0,

//         visitorsToday:
//             0,

//         pendingVisitors:
//             0,

//         visitorsInside:
//             0,

//         completedVisitors:
//             0,

//         vehicles:
//             0,

//         activeVehicles:
//             0,

//         inactiveVehicles:
//             0,

//         stickers:
//             0,

//         activeStickers:
//             0,

//         pendingStickers:
//             0,

//         revokedStickers:
//             0,

//         gates:
//             0,

//         activeGates:
//             0,

//         inactiveGates:
//             0,

//         primaryGate:
//             null,

//         recentVisits:
//             [],
        
//         facilityApproved: 0,

//     });


//     const adminName =
//         user?.first_name ||
//         user?.username ||
//         "Administrator";


//     /* =========================================================
//        LOCAL STYLES
//     ========================================================= */

//     const dashboardStyles = `

//         .ores-admin-dashboard {

//             --ores-text:
//                 #1d2737;

//             --ores-text-soft:
//                 #566274;

//             --ores-text-muted:
//                 #929baa;

//             --ores-border:
//                 rgba(
//                     148,
//                     163,
//                     184,
//                     0.14
//                 );

//             --ores-border-light:
//                 rgba(
//                     148,
//                     163,
//                     184,
//                     0.09
//                 );

//             --ores-card:
//                 rgba(
//                     255,
//                     255,
//                     255,
//                     0.72
//                 );

//             --ores-card-strong:
//                 rgba(
//                     255,
//                     255,
//                     255,
//                     0.86
//                 );

//             --ores-shadow:
//                 0 10px 30px
//                 rgba(
//                     15,
//                     23,
//                     42,
//                     0.045
//                 );

//             --ores-shadow-hover:
//                 0 18px 42px
//                 rgba(
//                     15,
//                     23,
//                     42,
//                     0.08
//                 );

//             width:
//                 100%;

//             max-width:
//                 1580px;

//             margin:
//                 0 auto;

//             padding:
//                 28px 30px 42px;

//             box-sizing:
//                 border-box;
//         }


//         /* =====================================================
//            HEADER
//         ===================================================== */

//         .ores-admin-header {

//             display:
//                 flex;

//             align-items:
//                 flex-end;

//             justify-content:
//                 space-between;

//             gap:
//                 24px;

//             margin-bottom:
//                 28px;
//         }


//         .ores-admin-header-copy {

//             min-width:
//                 0;

//             max-width:
//                 780px;
//         }


//         .ores-admin-eyebrow {

//             margin-bottom:
//                 8px;

//             color:
//                 #7e8795;

//             font-size:
//                 0.70rem;

//             font-weight:
//                 800;

//             letter-spacing:
//                 0.14em;

//             text-transform:
//                 uppercase;
//         }


//         .ores-admin-title {

//             margin:
//                 0;

//             color:
//                 var(--ores-text);

//             font-size:
//                 clamp(
//                     1.85rem,
//                     2.7vw,
//                     2.35rem
//                 );

//             font-weight:
//                 730;

//             line-height:
//                 1.15;

//             letter-spacing:
//                 -0.04em;
//         }


//         .ores-admin-description {

//             max-width:
//                 680px;

//             margin:
//                 9px 0 0;

//             color:
//                 var(--ores-text-muted);

//             font-size:
//                 0.80rem;

//             line-height:
//                 1.65;
//         }


//         .ores-admin-refresh {

//             display:
//                 flex;

//             align-items:
//                 center;

//             gap:
//                 11px;

//             min-width:
//                 200px;

//             padding:
//                 10px 13px;

//             border:
//                 1px solid
//                 var(--ores-border);

//             border-radius:
//                 13px;

//             color:
//                 inherit;

//             background:
//                 rgba(
//                     255,
//                     255,
//                     255,
//                     0.60
//                 );

//             box-shadow:
//                 0 8px 24px
//                 rgba(
//                     15,
//                     23,
//                     42,
//                     0.035
//                 );

//             backdrop-filter:
//                 blur(14px);

//             -webkit-backdrop-filter:
//                 blur(14px);
//         }


//         .ores-admin-refresh-icon {

//             width:
//                 38px;

//             height:
//                 38px;

//             flex:
//                 0 0 38px;

//             display:
//                 flex;

//             align-items:
//                 center;

//             justify-content:
//                 center;

//             border-radius:
//                 10px;

//             color:
//                 #596678;

//             background:
//                 #f0f3f7;
//         }


//         .ores-admin-refresh-copy {

//             min-width:
//                 0;

//             display:
//                 flex;

//             flex-direction:
//                 column;

//             gap:
//                 2px;
//         }


//         .ores-admin-refresh-label {

//             color:
//                 #9aa3ae;

//             font-size:
//                 0.65rem;

//             font-weight:
//                 700;

//             letter-spacing:
//                 0.10em;

//             text-transform:
//                 uppercase;
//         }


//         .ores-admin-refresh-copy strong {

//             color:
//                 #354152;

//             font-size:
//                 0.80rem;

//             font-weight:
//                 650;

//             white-space:
//                 nowrap;
//         }


//         /* =====================================================
//            SECTION
//         ===================================================== */

//         .ores-admin-section {

//             margin-bottom:
//                 26px;
//         }


//         .ores-admin-section-heading {

//             display:
//                 flex;

//             align-items:
//                 flex-end;

//             justify-content:
//                 space-between;

//             gap:
//                 18px;

//             margin-bottom:
//                 13px;
//         }


//         .ores-admin-section-heading h2 {

//             margin:
//                 0;

//             color:
//                 #253043;

//             font-size:
//                 1rem;

//             font-weight:
//                 700;
//         }


//         .ores-admin-section-heading p {

//             margin:
//                 4px 0 0;

//             color:
//                 #929baa;

//             font-size:
//                 0.70rem;

//             line-height:
//                 1.5;
//         }


//         .ores-live-badge {

//             display:
//                 inline-flex;

//             align-items:
//                 center;

//             gap:
//                 6px;

//             min-height:
//                 27px;

//             padding:
//                 5px 10px;

//             border:
//                 1px solid
//                 rgba(
//                     93,
//                     155,
//                     114,
//                     0.10
//                 );

//             border-radius:
//                 999px;

//             color:
//                 #64826f;

//             background:
//                 rgba(
//                     93,
//                     155,
//                     114,
//                     0.06
//                 );

//             font-size:
//                 0.62rem;

//             font-weight:
//                 700;

//             white-space:
//                 nowrap;
//         }


//         .ores-live-badge span {

//             width:
//                 6px;

//             height:
//                 6px;

//             border-radius:
//                 50%;

//             background:
//                 #5d9b72;
//         }


//         /* =====================================================
//            METRIC GRID
//         ===================================================== */

//         .ores-metric-grid {

//             display:
//                 grid;

//             grid-template-columns:
//                 repeat(
//                     4,
//                     minmax(
//                         0,
//                         1fr
//                     )
//                 );

//             gap:
//                 12px;
//         }


//         .ores-metric-card {

//             min-width:
//                 0;

//             min-height:
//                 148px;

//             display:
//                 flex;

//             flex-direction:
//                 column;

//             padding:
//                 16px;

//             border:
//                 1px solid
//                 var(--ores-border);

//             border-radius:
//                 16px;

//             color:
//                 inherit;

//             text-decoration:
//                 none;

//             background:
//                 var(--ores-card);

//             box-shadow:
//                 var(--ores-shadow);

//             backdrop-filter:
//                 blur(16px);

//             -webkit-backdrop-filter:
//                 blur(16px);

//             transition:
//                 transform 180ms ease,
//                 box-shadow 180ms ease;
//         }


//         .ores-metric-card:hover {

//             color:
//                 inherit;

//             text-decoration:
//                 none;

//             transform:
//                 translateY(-2px);

//             box-shadow:
//                 var(--ores-shadow-hover);
//         }


//         .ores-metric-top {

//             display:
//                 flex;

//             align-items:
//                 center;

//             justify-content:
//                 space-between;

//             gap:
//                 10px;

//             margin-bottom:
//                 14px;
//         }


//         .ores-metric-icon {

//             width:
//                 39px;

//             height:
//                 39px;

//             display:
//                 flex;

//             align-items:
//                 center;

//             justify-content:
//                 center;

//             border-radius:
//                 10px;

//             color:
//                 #586576;

//             background:
//                 #f0f3f7;

//             font-size:
//                 0.88rem;
//         }


//         .ores-metric-arrow {

//             color:
//                 #b2b9c4;

//             font-size:
//                 0.72rem;
//         }


//         .ores-metric-value {

//             color:
//                 #1d2737;

//             font-size:
//                 1.75rem;

//             font-weight:
//                 730;

//             line-height:
//                 1;

//             letter-spacing:
//                 -0.045em;
//         }


//         .ores-metric-label {

//             margin-top:
//                 5px;

//             color:
//                 #394556;

//             font-size:
//                 0.80rem;

//             font-weight:
//                 680;
//         }


//         .ores-metric-detail {

//             margin-top:
//                 auto;

//             padding-top:
//                 8px;

//             color:
//                 #969fac;

//             font-size:
//                 0.65rem;

//             line-height:
//                 1.45;
//         }


//         /* =====================================================
//            DASHBOARD PANELS
//         ===================================================== */

//         .ores-panel-grid {

//             display:
//                 grid;

//             grid-template-columns:
//                 minmax(
//                     0,
//                     1.28fr
//                 )
//                 minmax(
//                     330px,
//                     0.72fr
//                 );

//             gap:
//                 16px;

//             align-items:
//                 stretch;
//         }


//         .ores-panel {

//             min-width:
//                 0;

//             overflow:
//                 hidden;

//             border:
//                 1px solid
//                 var(--ores-border);

//             border-radius:
//                 17px;

//             background:
//                 var(--ores-card);

//             box-shadow:
//                 var(--ores-shadow);

//             backdrop-filter:
//                 blur(17px);

//             -webkit-backdrop-filter:
//                 blur(17px);
//         }


//         .ores-panel-header {

//             display:
//                 flex;

//             align-items:
//                 flex-start;

//             justify-content:
//                 space-between;

//             gap:
//                 14px;

//             padding:
//                 17px 18px 14px;

//             border-bottom:
//                 1px solid
//                 var(--ores-border-light);
//         }


//         .ores-panel-title {

//             margin:
//                 0;

//             color:
//                 #293446;

//             font-size:
//                 0.90rem;

//             font-weight:
//                 700;
//         }


//         .ores-panel-subtitle {

//             margin:
//                 4px 0 0;

//             color:
//                 #98a0ac;

//             font-size:
//                 0.67rem;

//             line-height:
//                 1.5;
//         }


//         .ores-panel-icon {

//             width:
//                 34px;

//             height:
//                 34px;

//             flex:
//                 0 0 34px;

//             display:
//                 flex;

//             align-items:
//                 center;

//             justify-content:
//                 center;

//             border-radius:
//                 9px;

//             color:
//                 #6a7687;

//             background:
//                 #f0f3f7;

//             font-size:
//                 0.80rem;
//         }


//         /* =====================================================
//            OPERATIONAL METRICS
//         ===================================================== */

//         .ores-operational-grid {

//             display:
//                 grid;

//             grid-template-columns:
//                 repeat(
//                     2,
//                     minmax(
//                         0,
//                         1fr
//                     )
//                 );

//             gap:
//                 10px;

//             padding:
//                 14px 16px 16px;
//         }


//         .ores-operation-item {

//             display:
//                 flex;

//             align-items:
//                 center;

//             justify-content:
//                 space-between;

//             gap:
//                 10px;

//             min-height:
//                 58px;

//             padding:
//                 10px 12px;

//             border:
//                 1px solid
//                 rgba(
//                     148,
//                     163,
//                     184,
//                     0.10
//                 );

//             border-radius:
//                 11px;

//             background:
//                 rgba(
//                     248,
//                     250,
//                     252,
//                     0.55
//                 );
//         }


//         .ores-operation-copy {

//             min-width:
//                 0;
//         }


//         .ores-operation-copy span {

//             display:
//                 block;

//             overflow:
//                 hidden;

//             color:
//                 #8e97a4;

//             font-size:
//                 0.63rem;

//             text-overflow:
//                 ellipsis;

//             white-space:
//                 nowrap;
//         }


//         .ores-operation-copy strong {

//             display:
//                 block;

//             margin-top:
//                 2px;

//             color:
//                 #354152;

//             font-size:
//                 0.80rem;

//             font-weight:
//                 700;
//         }


//         .ores-operation-value {

//             flex:
//                 0 0 auto;

//             width:
//                 32px;

//             height:
//                 32px;

//             display:
//                 flex;

//             align-items:
//                 center;

//             justify-content:
//                 center;

//             border-radius:
//                 9px;

//             color:
//                 #5d6879;

//             background:
//                 #edf1f5;

//             font-size:
//                 0.72rem;

//             font-weight:
//                 750;
//         }


//         /* =====================================================
//            SECURITY STATUS
//         ===================================================== */

//         .ores-security-body {

//             padding:
//                 15px 17px 17px;
//         }


//         .ores-gate-summary {

//             display:
//                 flex;

//             align-items:
//                 center;

//             gap:
//                 11px;

//             padding-bottom:
//                 13px;
//         }


//         .ores-gate-icon {

//             width:
//                 40px;

//             height:
//                 40px;

//             flex:
//                 0 0 40px;

//             display:
//                 flex;

//             align-items:
//                 center;

//             justify-content:
//                 center;

//             border-radius:
//                 10px;

//             color:
//                 #5f9273;

//             background:
//                 #edf5ef;
//         }


//         .ores-gate-copy {

//             min-width:
//                 0;

//             flex:
//                 1;
//         }


//         .ores-gate-copy span {

//             display:
//                 block;

//             color:
//                 #8e97a4;

//             font-size:
//                 0.63rem;
//         }


//         .ores-gate-copy strong {

//             display:
//                 block;

//             margin-top:
//                 2px;

//             color:
//                 #394456;

//             font-size:
//                 0.80rem;

//             font-weight:
//                 700;
//         }


//         .ores-operational-pill {

//             display:
//                 inline-flex;

//             align-items:
//                 center;

//             gap:
//                 5px;

//             min-height:
//                 23px;

//             padding:
//                 4px 8px;

//             border-radius:
//                 999px;

//             color:
//                 #5f806d;

//             background:
//                 rgba(
//                     93,
//                     155,
//                     114,
//                     0.08
//                 );

//             font-size:
//                 0.59rem;

//             font-weight:
//                 700;
//         }


//         .ores-operational-pill::before {

//             content:
//                 "";

//             width:
//                 5px;

//             height:
//                 5px;

//             border-radius:
//                 50%;

//             background:
//                 currentColor;
//         }


//         .ores-security-row {

//             display:
//                 flex;

//             align-items:
//                 center;

//             justify-content:
//                 space-between;

//             gap:
//                 12px;

//             padding:
//                 10px 0;

//             border-top:
//                 1px solid
//                 rgba(
//                     148,
//                     163,
//                     184,
//                     0.08
//                 );
//         }


//         .ores-security-row span {

//             color:
//                 #7f8997;

//             font-size:
//                 0.67rem;
//         }


//         .ores-security-row strong {

//             color:
//                 #364153;

//             font-size:
//                 0.78rem;

//             font-weight:
//                 720;
//         }


//         .ores-security-link {

//             display:
//                 flex;

//             align-items:
//                 center;

//             justify-content:
//                 space-between;

//             gap:
//                 10px;

//             margin-top:
//                 5px;

//             padding-top:
//                 12px;

//             border-top:
//                 1px solid
//                 rgba(
//                     148,
//                     163,
//                     184,
//                     0.09
//                 );

//             color:
//                 #677285;

//             font-size:
//                 0.65rem;

//             font-weight:
//                 650;

//             text-decoration:
//                 none;
//         }


//         /* =====================================================
//            QUICK ACTIONS
//         ===================================================== */

//         .ores-actions-grid {

//             display:
//                 grid;

//             grid-template-columns:
//                 repeat(
//                     3,
//                     minmax(
//                         0,
//                         1fr
//                     )
//                 );

//             gap:
//                 9px;

//             padding:
//                 14px 16px 16px;
//         }


//         .ores-action-card {

//             min-width:
//                 0;

//             display:
//                 flex;

//             align-items:
//                 center;

//             gap:
//                 10px;

//             min-height:
//                 66px;

//             padding:
//                 10px;

//             border:
//                 1px solid
//                 rgba(
//                     148,
//                     163,
//                     184,
//                     0.10
//                 );

//             border-radius:
//                 12px;

//             color:
//                 inherit;

//             background:
//                 rgba(
//                     248,
//                     250,
//                     252,
//                     0.54
//                 );

//             text-decoration:
//                 none;

//             transition:
//                 transform 160ms ease,
//                 box-shadow 160ms ease;
//         }


//         .ores-action-card:hover {

//             color:
//                 inherit;

//             text-decoration:
//                 none;

//             transform:
//                 translateY(-1px);

//             box-shadow:
//                 0 8px 20px
//                 rgba(
//                     15,
//                     23,
//                     42,
//                     0.06
//                 );
//         }


//         .ores-action-icon {

//             width:
//                 34px;

//             height:
//                 34px;

//             flex:
//                 0 0 34px;

//             display:
//                 flex;

//             align-items:
//                 center;

//             justify-content:
//                 center;

//             border-radius:
//                 9px;

//             color:
//                 #647083;

//             background:
//                 #edf1f5;
//         }


//         .ores-action-copy {

//             min-width:
//                 0;

//             flex:
//                 1;
//         }


//         .ores-action-title {

//             overflow:
//                 hidden;

//             color:
//                 #354152;

//             font-size:
//                 0.68rem;

//             font-weight:
//                 680;

//             text-overflow:
//                 ellipsis;

//             white-space:
//                 nowrap;
//         }


//         .ores-action-description {

//             margin-top:
//                 3px;

//             overflow:
//                 hidden;

//             color:
//                 #989faa;

//             font-size:
//                 0.59rem;

//             text-overflow:
//                 ellipsis;

//             white-space:
//                 nowrap;
//         }


//         .ores-action-arrow {

//             color:
//                 #b5bcc6;

//             font-size:
//                 0.63rem;
//         }


//         /* =====================================================
//            TABLE
//         ===================================================== */

//         .ores-table-wrapper {

//             width:
//                 100%;

//             overflow:
//                 hidden;
//         }


//         .ores-table {

//             width:
//                 100%;

//             margin:
//                 0;

//             border-collapse:
//                 separate;

//             border-spacing:
//                 0;
//         }


//         .ores-table thead th {

//             padding:
//                 10px 16px;

//             color:
//                 #98a1ad;

//             background:
//                 rgba(
//                     248,
//                     250,
//                     252,
//                     0.55
//                 );

//             border-bottom:
//                 1px solid
//                 rgba(
//                     148,
//                     163,
//                     184,
//                     0.09
//                 );

//             font-size:
//                 0.60rem;

//             font-weight:
//                 800;

//             letter-spacing:
//                 0.07em;

//             text-transform:
//                 uppercase;

//             white-space:
//                 nowrap;
//         }


//         .ores-table tbody td {

//             padding:
//                 11px 16px;

//             color:
//                 #6d7785;

//             border-bottom:
//                 1px solid
//                 rgba(
//                     148,
//                     163,
//                     184,
//                     0.07
//                 );

//             font-size:
//                 0.70rem;

//             vertical-align:
//                 middle;
//         }


//         .ores-table strong {

//             color:
//                 #394455;

//             font-weight:
//                 680;
//         }


//         .ores-table-subtext {

//             margin-top:
//                 2px;

//             color:
//                 #a0a7b2;

//             font-size:
//                 0.60rem;
//         }


//         .ores-status {

//             display:
//                 inline-flex;

//             align-items:
//                 center;

//             gap:
//                 5px;

//             min-height:
//                 22px;

//             padding:
//                 4px 8px;

//             border-radius:
//                 999px;

//             color:
//                 #677284;

//             background:
//                 rgba(
//                     100,
//                     116,
//                     139,
//                     0.08
//                 );

//             font-size:
//                 0.58rem;

//             font-weight:
//                 700;

//             white-space:
//                 nowrap;
//         }


//         /* =====================================================
//            DATABASE HEALTH
//         ===================================================== */

//         .ores-health-body {

//             padding:
//                 16px;
//         }


//         .ores-health-header {

//             display:
//                 flex;

//             align-items:
//                 center;

//             gap:
//                 11px;

//             margin-bottom:
//                 14px;
//         }


//         .ores-health-icon {

//             width:
//                 40px;

//             height:
//                 40px;

//             display:
//                 flex;

//             align-items:
//                 center;

//             justify-content:
//                 center;

//             border-radius:
//                 10px;

//             color:
//                 #667386;

//             background:
//                 #eef1f5;
//         }


//         .ores-health-copy {

//             min-width:
//                 0;
//         }


//         .ores-health-copy strong {

//             display:
//                 block;

//             color:
//                 #354152;

//             font-size:
//                 0.80rem;

//             font-weight:
//                 700;
//         }


//         .ores-health-copy span {

//             display:
//                 block;

//             margin-top:
//                 2px;

//             color:
//                 #979faa;

//             font-size:
//                 0.61rem;
//         }


//         .ores-health-list {

//             display:
//                 flex;

//             flex-direction:
//                 column;

//             gap:
//                 7px;
//         }


//         .ores-health-row {

//             display:
//                 flex;

//             align-items:
//                 center;

//             justify-content:
//                 space-between;

//             gap:
//                 8px;

//             padding:
//                 8px 10px;

//             border-radius:
//                 9px;

//             background:
//                 rgba(
//                     248,
//                     250,
//                     252,
//                     0.55
//                 );
//         }


//         .ores-health-row span {

//             color:
//                 #8993a1;

//             font-size:
//                 0.62rem;
//         }


//         .ores-health-row strong {

//             color:
//                 #384354;

//             font-size:
//                 0.68rem;

//             font-weight:
//                 700;
//         }


//         /* =====================================================
//            ERROR
//         ===================================================== */

//         .ores-admin-error {

//             display:
//                 flex;

//             align-items:
//                 center;

//             gap:
//                 8px;

//             margin-bottom:
//                 18px;

//             padding:
//                 10px 12px;

//             border:
//                 1px solid
//                 rgba(
//                     245,
//                     158,
//                     11,
//                     0.12
//                 );

//             border-radius:
//                 10px;

//             color:
//                 #956a18;

//             background:
//                 rgba(
//                     245,
//                     158,
//                     11,
//                     0.06
//                 );

//             font-size:
//                 0.68rem;

//             line-height:
//                 1.45;
//         }


//         /* =====================================================
//            EMPTY
//         ===================================================== */

//         .ores-empty {

//             padding:
//                 28px 18px;

//             text-align:
//                 center;
//         }


//         .ores-empty-icon {

//             width:
//                 40px;

//             height:
//                 40px;

//             margin:
//                 0 auto 10px;

//             display:
//                 flex;

//             align-items:
//                 center;

//             justify-content:
//                 center;

//             border-radius:
//                 10px;

//             color:
//                 #8c96a3;

//             background:
//                 #f0f3f7;
//         }


//         .ores-empty h3 {

//             margin:
//                 0;

//             color:
//                 #4a5566;

//             font-size:
//                 0.78rem;

//             font-weight:
//                 700;
//         }


//         .ores-empty p {

//             max-width:
//                 360px;

//             margin:
//                 5px auto 0;

//             color:
//                 #969fac;

//             font-size:
//                 0.65rem;

//             line-height:
//                 1.5;
//         }


//         /* =====================================================
//            TABLET
//         ===================================================== */

//         @media (max-width: 1199.98px) {

//             .ores-admin-dashboard {

//                 padding:
//                     24px;
//             }


//             .ores-metric-grid {

//                 grid-template-columns:
//                     repeat(
//                         2,
//                         minmax(
//                             0,
//                             1fr
//                         )
//                     );
//             }


//             .ores-panel-grid {

//                 grid-template-columns:
//                     1fr;
//             }

//         }


//         /* =====================================================
//            MOBILE
//         ===================================================== */

//         @media (max-width: 767.98px) {

//             .ores-admin-dashboard {

//                 padding:
//                     18px 14px 24px;
//             }


//             .ores-admin-header {

//                 align-items:
//                     stretch;

//                 flex-direction:
//                     column;

//                 gap:
//                     15px;

//                 margin-bottom:
//                     21px;
//             }


//             .ores-admin-title {

//                 font-size:
//                     1.70rem;
//             }


//             .ores-admin-description {

//                 font-size:
//                     0.76rem;
//             }


//             .ores-admin-refresh {

//                 width:
//                     100%;
//             }


//             .ores-metric-grid {

//                 grid-template-columns:
//                     repeat(
//                         2,
//                         minmax(
//                             0,
//                             1fr
//                         )
//                     );

//                 gap:
//                     9px;
//             }


//             .ores-metric-card {

//                 min-height:
//                     136px;

//                 padding:
//                     13px;
//             }


//             .ores-metric-value {

//                 font-size:
//                     1.52rem;
//             }


//             .ores-metric-label {

//                 font-size:
//                     0.74rem;
//             }


//             .ores-metric-detail {

//                 font-size:
//                     0.60rem;
//             }


//             .ores-operational-grid {

//                 grid-template-columns:
//                     1fr;
//             }


//             .ores-actions-grid {

//                 grid-template-columns:
//                     1fr;
//             }


//             .ores-panel-header {

//                 padding:
//                     14px;
//             }


//             .ores-panel-title {

//                 font-size:
//                     0.85rem;
//             }


//             .ores-panel-subtitle {

//                 font-size:
//                     0.63rem;
//             }


//             .ores-table-wrapper {

//                 overflow-x:
//                     auto;
//             }


//             .ores-table {

//                 min-width:
//                     620px;
//             }

//         }


//         /* =====================================================
//            SMALL PHONE
//         ===================================================== */

//         @media (max-width: 575.98px) {

//             .ores-admin-dashboard {

//                 padding:
//                     15px 10px 22px;
//             }


//             .ores-admin-title {

//                 font-size:
//                     1.52rem;
//             }


//             .ores-admin-description {

//                 font-size:
//                     0.72rem;
//             }


//             .ores-metric-card {

//                 min-height:
//                     126px;

//                 padding:
//                     11px;
//             }


//             .ores-metric-icon {

//                 width:
//                     35px;

//                 height:
//                     35px;
//             }


//             .ores-metric-value {

//                 font-size:
//                     1.35rem;
//             }


//             .ores-metric-label {

//                 font-size:
//                     0.70rem;
//             }


//             .ores-metric-detail {

//                 font-size:
//                     0.57rem;
//             }

//         }

//     `;


//     /* =========================================================
//        NORMALIZE
//     ========================================================= */

//     const normalize = (
//         response
//     ) => {

//         if (
//             Array.isArray(
//                 response
//             )
//         ) {

//             return response;

//         }


//         if (
//             response &&
//             Array.isArray(
//                 response.results
//             )
//         ) {

//             return response.results;

//         }


//         return [];

//     };


//     /* =========================================================
//        SAFE REQUEST
//     ========================================================= */

//     const safeRequest =
//         async (
//             name,
//             request
//         ) => {

//             try {

//                 const response =
//                     await request();


//                 return {

//                     success:
//                         true,

//                     data:
//                         response,

//                     error:
//                         null,

//                     name,

//                 };

//             } catch (
//                 err
//             ) {

//                 console.error(
//                     `[oRES Dashboard] ${name} failed:`,
//                     err
//                 );


//                 return {

//                     success:
//                         false,

//                     data:
//                         null,

//                     error:
//                         err,

//                     name,

//                 };

//             }

//         };


//     /* =========================================================
//        LOAD DASHBOARD
//     ========================================================= */

//     const loadDashboard =
//         useCallback(
//             async (
//                 silent = false
//             ) => {

//                 if (
//                     silent
//                 ) {

//                     setRefreshing(
//                         true
//                     );

//                 } else {

//                     setLoading(
//                         true
//                     );

//                 }


//                 setError("");


//                 const [

//                     propertiesResult,

//                     residentsResult,

//                     invitationsResult,

//                     visitsResult,

//                     vehiclesResult,

//                     stickersResult,

//                     gatesResult,

//                     facilityBookingsResult,

//                 ] =
//                     await Promise.all([

//                         safeRequest(
//                             "Properties",
//                             getProperties
//                         ),

//                         safeRequest(
//                             "Residents",
//                             getResidents
//                         ),

//                         safeRequest(
//                             "Visitor Invitations",
//                             getVisitorInvitations
//                         ),

//                         safeRequest(
//                             "Visitor Visits",
//                             getVisitorVisits
//                         ),

//                         safeRequest(
//                             "Vehicles",
//                             getVehicles
//                         ),

//                         safeRequest(
//                             "Motorist Stickers",
//                             getMotoristStickers
//                         ),

//                         safeRequest(
//                             "Gates",
//                             getGates
//                         ),

//                         safeRequest(
//                             "Facility Bookings",
//                             getFacilityBookings
//                         ),

//                     ]);


//                 const properties =
//                     normalize(
//                         propertiesResult.data
//                     );


//                 const residents =
//                     normalize(
//                         residentsResult.data
//                     );


//                 const invitations =
//                     normalize(
//                         invitationsResult.data
//                     );


//                 const visits =
//                     normalize(
//                         visitsResult.data
//                     );


//                 const vehicles =
//                     normalize(
//                         vehiclesResult.data
//                     );


//                 const stickers =
//                     normalize(
//                         stickersResult.data
//                     );


//                 const gates =
//                     normalize(
//                         gatesResult.data
//                     );

//                 const facilityBookings =
//                     normalize(
//                         facilityBookingsResult.data
//                     );


//                 /* =================================================
//                    RESIDENTS
//                 ================================================= */

//                 const homeowners =
//                     residents.filter(
//                         resident =>
//                             String(
//                                 resident?.resident_type ||
//                                 ""
//                             )
//                                 .toUpperCase() ===
//                             "HOMEOWNER"
//                     );


//                 const tenants =
//                     residents.filter(
//                         resident =>
//                             String(
//                                 resident?.resident_type ||
//                                 ""
//                             )
//                                 .toUpperCase() ===
//                             "TENANT"
//                     );


//                 const activeResidents =
//                     residents.filter(
//                         resident =>
//                             resident?.is_active ===
//                             true
//                     );


//                 const inactiveResidents =
//                     residents.filter(
//                         resident =>
//                             resident?.is_active !==
//                             true
//                     );


//                 /* =================================================
//                    TODAY
//                 ================================================= */

//                 const today =
//                     new Date();


//                 const todayString =
//                     [

//                         today.getFullYear(),

//                         String(
//                             today.getMonth() + 1
//                         )
//                             .padStart(
//                                 2,
//                                 "0"
//                             ),

//                         String(
//                             today.getDate()
//                         )
//                             .padStart(
//                                 2,
//                                 "0"
//                             ),

//                     ].join("-");


//                 /* =================================================
//                    VISITORS
//                 ================================================= */

//                 const visitorsToday =
//                     invitations.filter(
//                         invitation =>
//                             normalize(
//                                 invitation?.status
//                             ) ===
//                             "USED"
//                             &&
//                             String(
//                                 invitation?.visit_date ||
//                                 ""
//                             ) ===
//                             todayString
//                     );


//                 const pendingVisitors =
//                     invitations.filter(
//                         invitation =>
//                             normalize(
//                                 invitation?.status
//                             ) ===
//                             "PENDING"
//                     );


//                 const visitorsInside =
//                     visits.filter(
//                         visit =>
//                             normalize(
//                                 visit?.status
//                             ) ===
//                             "INSIDE"
//                     );


//                 const completedVisitors =
//                     visits.filter(
//                         visit =>
//                             normalize(
//                                 visit?.status
//                             ) ===
//                             "COMPLETED"
//                     );


//                 /* =================================================
//                    VEHICLES
//                 ================================================= */

//                 const activeVehicles =
//                     vehicles.filter(
//                         vehicle =>
//                             vehicle?.is_active ===
//                             true
//                     );


//                 const inactiveVehicles =
//                     vehicles.filter(
//                         vehicle =>
//                             vehicle?.is_active !==
//                             true
//                     );


//                 /* =================================================
//                    STICKERS
//                 ================================================= */

//                 const activeStickers =
//                     stickers.filter(
//                         sticker =>
//                             normalize(
//                                 sticker?.status
//                             ) ===
//                             "ACTIVE"
//                     );


//                 const pendingStickers =
//                     stickers.filter(
//                         sticker =>
//                             normalize(
//                                 sticker?.status
//                             ) ===
//                             "PENDING"
//                     );


//                 const revokedStickers =
//                     stickers.filter(
//                         sticker =>
//                             normalize(
//                                 sticker?.status
//                             ) ===
//                             "REVOKED"
//                     );


//                 /* =================================================
//                    GATES
//                 ================================================= */

//                 const activeGates =
//                     gates.filter(
//                         gate =>
//                             gate?.is_active ===
//                             true
//                     );


//                 const inactiveGates =
//                     gates.filter(
//                         gate =>
//                             gate?.is_active !==
//                             true
//                     );


//                 const primaryGate =
//                     gates.find(
//                         gate =>
//                             gate?.is_primary ===
//                             true
//                     )
//                     ||
//                     gates[0]
//                     ||
//                     null;

//                 /* =====================================================
//                 FACILITY BOOKING COUNTS
//                 ===================================================== */

//                 const normalizedFacilityBookings =
//                     facilityBookings.map(
//                         booking => ({

//                             ...booking,

//                             normalizedStatus:
//                                 String(
//                                     booking?.status ||
//                                     ""
//                                 )
//                                     .trim()
//                                     .toUpperCase(),

//                         })
//                     );
                
//                 const facilityApproved =
//                     normalizedFacilityBookings.filter(
//                         booking =>
//                             booking.normalizedStatus ===
//                             "APPROVED"
//                     );


//                 /* =================================================
//                    RECENT VISITS
//                 ================================================= */

//                 const recentVisits =
//                     [...visits]
//                         .sort(
//                             (
//                                 first,
//                                 second
//                             ) => {

//                                 const firstDate =
//                                     new Date(
//                                         first?.time_in ||
//                                         first?.created_at ||
//                                         0
//                                     )
//                                         .getTime();


//                                 const secondDate =
//                                     new Date(
//                                         second?.time_in ||
//                                         second?.created_at ||
//                                         0
//                                     )
//                                         .getTime();


//                                 return (
//                                     secondDate -
//                                     firstDate
//                                 );

//                             }
//                         )
//                         .slice(
//                             0,
//                             6
//                         );


//                 /* =================================================
//                    SET DATA
//                 ================================================= */

//                 setData({

//                     properties:
//                         properties.length,

//                     residents:
//                         residents.length,

//                     homeowners:
//                         homeowners.length,

//                     tenants:
//                         tenants.length,

//                     activeResidents:
//                         activeResidents.length,

//                     inactiveResidents:
//                         inactiveResidents.length,

//                     visitorsToday:
//                         visitorsToday.length,

//                     pendingVisitors:
//                         pendingVisitors.length,

//                     visitorsInside:
//                         visitorsInside.length,

//                     completedVisitors:
//                         completedVisitors.length,

//                     vehicles:
//                         vehicles.length,

//                     activeVehicles:
//                         activeVehicles.length,

//                     inactiveVehicles:
//                         inactiveVehicles.length,

//                     stickers:
//                         stickers.length,

//                     activeStickers:
//                         activeStickers.length,

//                     pendingStickers:
//                         pendingStickers.length,

//                     revokedStickers:
//                         revokedStickers.length,

//                     gates:
//                         gates.length,

//                     activeGates:
//                         activeGates.length,

//                     inactiveGates:
//                         inactiveGates.length,

//                     primaryGate,

//                     recentVisits,

//                     facilityApproved:
//                         facilityApproved.length,

//                 });


//                 const failedModules =
//                     [

//                         propertiesResult,

//                         residentsResult,

//                         invitationsResult,

//                         visitsResult,

//                         vehiclesResult,

//                         stickersResult,

//                         gatesResult,

//                         facilityBookingsResult,

//                     ]
//                         .filter(
//                             result =>
//                                 !result.success
//                         )
//                         .map(
//                             result =>
//                                 result.name
//                         );


//                 if (
//                     failedModules.length
//                 ) {

//                     setError(
//                         `Unable to load: ${failedModules.join(
//                             ", "
//                         )}.`
//                     );

//                 }


//                 setLoading(
//                     false
//                 );

//                 setRefreshing(
//                     false
//                 );

//             },
//             []
//         );


//     /* =========================================================
//        INITIAL LOAD
//     ========================================================= */

//     useEffect(
//         () => {

//             loadDashboard();

//         },
//         [
//             loadDashboard,
//         ]
//     );


//     /* =========================================================
//        DERIVED METRICS
//     ========================================================= */

//     const residentActivationRate =
//         useMemo(
//             () => {

//                 if (
//                     !data.residents
//                 ) {

//                     return 0;

//                 }


//                 return Math.round(
//                     (
//                         data.activeResidents /
//                         data.residents
//                     ) *
//                     100
//                 );

//             },
//             [
//                 data.residents,
//                 data.activeResidents,
//             ]
//         );


//     const vehicleActivationRate =
//         useMemo(
//             () => {

//                 if (
//                     !data.vehicles
//                 ) {

//                     return 0;

//                 }


//                 return Math.round(
//                     (
//                         data.activeVehicles /
//                         data.vehicles
//                     ) *
//                     100
//                 );

//             },
//             [
//                 data.vehicles,
//                 data.activeVehicles,
//             ]
//         );


//     const stickerActivationRate =
//         useMemo(
//             () => {

//                 if (
//                     !data.stickers
//                 ) {

//                     return 0;

//                 }


//                 return Math.round(
//                     (
//                         data.activeStickers /
//                         data.stickers
//                     ) *
//                     100
//                 );

//             },
//             [
//                 data.stickers,
//                 data.activeStickers,
//             ]
//         );


//     const gateAvailabilityRate =
//         useMemo(
//             () => {

//                 if (
//                     !data.gates
//                 ) {

//                     return 0;

//                 }


//                 return Math.round(
//                     (
//                         data.activeGates /
//                         data.gates
//                     ) *
//                     100
//                 );

//             },
//             [
//                 data.gates,
//                 data.activeGates,
//             ]
//         );


//     /* =========================================================
//        CURRENT DATE
//     ========================================================= */

//     const currentDate =
//         new Date()
//             .toLocaleDateString(
//                 undefined,
//                 {
//                     weekday:
//                         "long",

//                     month:
//                         "short",

//                     day:
//                         "numeric",

//                     year:
//                         "numeric",
//                 }
//             );


//     /* =========================================================
//        OVERVIEW METRICS
//     ========================================================= */

//     const overviewMetrics = [

//         {

//             label:
//                 "Properties",

//             value:
//                 data.properties,

//             detail:
//                 "Registered properties",

//             icon:
//                 "bi-buildings",

//             route:
//                 "/admin/properties",

//         },

//         {

//             label:
//                 "Residents",

//             value:
//                 data.residents,

//             detail:
//                 `${data.homeowners} homeowners • ${data.tenants} tenants`,

//             icon:
//                 "bi-people",

//             route:
//                 "/admin/residents",

//         },

//         {

//             label:
//                 "Active Residents",

//             value:
//                 data.activeResidents,

//             detail:
//                 `${residentActivationRate}% of resident profiles active`,

//             icon:
//                 "bi-person-check",

//             route:
//                 "/admin/residents",

//         },

//         {

//             label:
//                 "Visitors Today",

//             value:
//                 data.visitorsToday,

//             detail:
//                 `${data.visitorsInside} currently inside`,

//             icon:
//                 "bi-person-walking",

//             route:
//                 "/admin/visitors",

//         },

//         {

//             label:
//                 "Pending Visitors",

//             value:
//                 data.pendingVisitors,

//             detail:
//                 "Waiting for entry",

//             icon:
//                 "bi-person-vcard",

//             route:
//                 "/admin/visitors",

//         },

//          {
//             label:
//                 "Approved Facilities",

//             value:
//                 data.facilityApproved,

//             description:
//                 `${data.facilityUpcomingApproved} upcoming approved`,

//             icon:
//                 "bi-calendar-check",

//             route:
//                 "/admin/facility-bookings",

//         },


//         {

//             label:
//                 "Motorist Stickers",

//             value:
//                 data.stickers,

//             detail:
//                 `${data.activeStickers} active • ${data.pendingStickers} pending`,

//             icon:
//                 "bi-shield-check",

//             route:
//                 "/admin/stickers",

//         },

//         {

//             label:
//                 "Security Gates",

//             value:
//                 data.gates,

//             detail:
//                 `${data.activeGates} operational`,

//             icon:
//                 "bi-door-open",

//             route:
//                 "/admin/gates",

//         },

//     ];


//     /* =========================================================
//        QUICK ACTIONS
//     ========================================================= */

//     const quickActions = [

//         {

//             title:
//                 "Manage Residents",

//             description:
//                 `${data.activeResidents} active profiles`,

//             icon:
//                 "bi-people",

//             route:
//                 "/admin/residents",

//         },

//         {

//             title:
//                 "Manage Properties",

//             description:
//                 `${data.properties} registered properties`,

//             icon:
//                 "bi-buildings",

//             route:
//                 "/admin/properties",

//         },

//         {

//             title:
//                 "Manage Visitors",

//             description:
//                 `${data.pendingVisitors} pending • ${data.visitorsInside} inside`,

//             icon:
//                 "bi-person-vcard",

//             route:
//                 "/admin/visitors",

//         },

//         {

//             title:
//                 "Manage Vehicles",

//             description:
//                 `${data.activeVehicles} active vehicles`,

//             icon:
//                 "bi-car-front",

//             route:
//                 "/admin/vehicles",

//         },

//         {

//             title:
//                 "Motorist Stickers",

//             description:
//                 `${data.activeStickers} active • ${data.pendingStickers} pending`,

//             icon:
//                 "bi-shield-check",

//             route:
//                 "/admin/stickers",

//         },

//         {

//             title:
//                 "Gate Management",

//             description:
//                 `${data.activeGates} of ${data.gates} operational`,

//             icon:
//                 "bi-door-open",

//             route:
//                 "/admin/gates",

//         },

//     ];


//     /* =========================================================
//        FORMAT TIME
//     ========================================================= */

//     const formatTime =
//         (
//             value
//         ) => {

//             if (
//                 !value
//             ) {

//                 return "—";

//             }


//             const date =
//                 new Date(
//                     value
//                 );


//             if (
//                 Number.isNaN(
//                     date.getTime()
//                 )
//             ) {

//                 return "—";

//             }


//             return date.toLocaleTimeString(
//                 [],
//                 {
//                     hour:
//                         "2-digit",

//                     minute:
//                         "2-digit",
//                 }
//             );

//         };


//     /* =========================================================
//        LOADING
//     ========================================================= */

//     if (
//         loading
//     ) {

//         return (

//             <>

//                 <style>
//                     {
//                         dashboardStyles
//                             .replace(
//                                 /rems-admin/g,
//                                 "ores-admin"
//                             )
//                     }
//                 </style>


//                 <div className="ores-admin-dashboard">

//                     <div
//                         className="d-flex align-items-center justify-content-center"
//                         style={{
//                             minHeight:
//                                 "60vh",
//                         }}
//                     >

//                         <div className="text-center">

//                             <div
//                                 className="spinner-border"
//                                 role="status"
//                                 aria-hidden="true"
//                             />


//                             <div className="mt-3 text-muted small">

//                                 Loading live oRES data...

//                             </div>

//                         </div>

//                     </div>

//                 </div>

//             </>

//         );

//     }


//     /* =========================================================
//        RENDER
//     ========================================================= */

//     return (

//         <>

//             <style>
//                 {
//                     dashboardStyles
//                         .replace(
//                             /rems-admin/g,
//                             "ores-admin"
//                         )
//                 }
//             </style>


//             <div className="ores-admin-dashboard">


//                 {/* =================================================
//                     HEADER
//                 ================================================= */}

//                 <section className="ores-admin-header">

//                     <div className="ores-admin-header-copy">

//                         <div className="ores-admin-eyebrow">

//                             ADMINISTRATION

//                         </div>


//                         <h1 className="ores-admin-title">

//                             Hello! {adminName}

//                         </h1>


//                         <p className="ores-admin-description">

//                             Monitor residents, properties,
//                             visitor movement, vehicle access,
//                             motorist stickers, and gate operations
//                             from one administrative overview.

//                         </p>

//                     </div>


//                     <button
//                         type="button"
//                         className="ores-admin-refresh border-0"
//                         onClick={() =>
//                             loadDashboard(
//                                 true
//                             )
//                         }
//                         disabled={
//                             refreshing
//                         }
//                     >

//                         <div className="ores-admin-refresh-icon">

//                             {
//                                 refreshing

//                                     ? (
//                                         <span className="spinner-border spinner-border-sm" />
//                                     )

//                                     : (
//                                         <i className="bi bi-arrow-clockwise" />
//                                     )
//                             }

//                         </div>


//                         <div className="ores-admin-refresh-copy">

//                             <span className="ores-admin-refresh-label">

//                                 Today is 

//                             </span>


//                             <strong>

//                                 {
//                                     refreshing
//                                         ? "Refreshing..."
//                                         : currentDate
//                                 }

//                             </strong>

//                         </div>

//                     </button>

//                 </section>


//                 {/* =================================================
//                     ERROR
//                 ================================================= */}

//                 {error && (

//                     <div className="ores-admin-error">

//                         <i className="bi bi-exclamation-triangle" />

//                         <span>

//                             {
//                                 error
//                             }

//                         </span>

//                     </div>

//                 )}


//                 {/* =================================================
//                     SYSTEM OVERVIEW
//                 ================================================= */}

//                 <section className="ores-admin-section">

//                     <div className="ores-admin-section-heading">

//                         <div>

//                             <h2>

//                                 System Overview

//                             </h2>


//                             <p>

//                                 Core oRES records and
//                                 operational counts.

//                             </p>

//                         </div>

//                     </div>


//                     <div className="ores-metric-grid">

//                         {
//                             overviewMetrics.map(
//                                 metric => (

//                                     <Link
//                                         key={
//                                             metric.label
//                                         }
//                                         to={
//                                             metric.route
//                                         }
//                                         className="ores-metric-card"
//                                     >

//                                         <div className="ores-metric-top">

//                                             <div className="ores-metric-icon">

//                                                 <i
//                                                     className={`bi ${metric.icon}`}
//                                                 />

//                                             </div>


//                                             <i className="bi bi-arrow-up-right ores-metric-arrow" />

//                                         </div>


//                                         <div className="ores-metric-value">

//                                             {
//                                                 metric.value
//                                             }

//                                         </div>


//                                         <div className="ores-metric-label">

//                                             {
//                                                 metric.label
//                                             }

//                                         </div>


//                                         <div className="ores-metric-detail">

//                                             {
//                                                 metric.detail
//                                             }

//                                         </div>

//                                     </Link>

//                                 )
//                             )
//                         }

//                     </div>

//                 </section>


//                 {/* =================================================
//                     OPERATIONAL SNAPSHOT
//                 ================================================= */}

//                 <section className="ores-admin-section">

//                     <div className="ores-admin-section-heading">

//                         <div>

//                             <h2>

//                                 Operational Snapshot

//                             </h2>


//                             <p>

//                                 Current access and registration
//                                 activity across the community.

//                             </p>

//                         </div>

//                     </div>


//                     <div className="ores-panel-grid">


//                         {/* =========================================
//                             ACTIVITY
//                         ========================================= */}

//                         <section className="ores-panel">

//                             <div className="ores-panel-header">

//                                 <div>

//                                     <h2 className="ores-panel-title">

//                                         Community Activity

//                                     </h2>


//                                     <p className="ores-panel-subtitle">

//                                         Current resident, vehicle,
//                                         sticker, and visitor activity.

//                                     </p>

//                                 </div>


//                                 <div className="ores-panel-icon">

//                                     <i className="bi bi-activity" />

//                                 </div>

//                             </div>


//                             <div className="ores-operational-grid">


//                                 <div className="ores-operation-item">

//                                     <div className="ores-operation-copy">

//                                         <span>
//                                             Active Residents
//                                         </span>

//                                         <strong>
//                                             {data.activeResidents}
//                                         </strong>

//                                     </div>


//                                     <div className="ores-operation-value">

//                                         {
//                                             residentActivationRate
//                                         }%

//                                     </div>

//                                 </div>


//                                 <div className="ores-operation-item">

//                                     <div className="ores-operation-copy">

//                                         <span>
//                                             Vehicles Active
//                                         </span>

//                                         <strong>
//                                             {data.activeVehicles}
//                                         </strong>

//                                     </div>


//                                     <div className="ores-operation-value">

//                                         {
//                                             vehicleActivationRate
//                                         }%

//                                     </div>

//                                 </div>


//                                 <div className="ores-operation-item">

//                                     <div className="ores-operation-copy">

//                                         <span>
//                                             Active Stickers
//                                         </span>

//                                         <strong>
//                                             {data.activeStickers}
//                                         </strong>

//                                     </div>


//                                     <div className="ores-operation-value">

//                                         {
//                                             stickerActivationRate
//                                         }%

//                                     </div>

//                                 </div>


//                                 <div className="ores-operation-item">

//                                     <div className="ores-operation-copy">

//                                         <span>
//                                             Gates Operational
//                                         </span>

//                                         <strong>
//                                             {data.activeGates}
//                                         </strong>

//                                     </div>


//                                     <div className="ores-operation-value">

//                                         {
//                                             gateAvailabilityRate
//                                         }%

//                                     </div>

//                                 </div>


//                                 <div className="ores-operation-item">

//                                     <div className="ores-operation-copy">

//                                         <span>
//                                             Visitors Inside
//                                         </span>

//                                         <strong>
//                                             {data.visitorsInside}
//                                         </strong>

//                                     </div>


//                                     <div className="ores-operation-value">

//                                         <i className="bi bi-person-walking" />

//                                     </div>

//                                 </div>


//                                 <div className="ores-operation-item">

//                                     <div className="ores-operation-copy">

//                                         <span>
//                                             Pending Visitor Invitations
//                                         </span>

//                                         <strong>
//                                             {data.pendingVisitors}
//                                         </strong>

//                                     </div>


//                                     <div className="ores-operation-value">

//                                         <i className="bi bi-hourglass-split" />

//                                     </div>

//                                 </div>


//                             </div>

//                         </section>


//                         {/* =========================================
//                             SECURITY
//                         ========================================= */}

//                         <section className="ores-panel">

//                             <div className="ores-panel-header">

//                                 <div>

//                                     <h2 className="ores-panel-title">

//                                         Security Status

//                                     </h2>


//                                     <p className="ores-panel-subtitle">

//                                         Gate operations and
//                                         visitor movement.

//                                     </p>

//                                 </div>


//                                 <div className="ores-panel-icon">

//                                     <i className="bi bi-shield-check" />

//                                 </div>

//                             </div>


//                             <div className="ores-security-body">


//                                 <div className="ores-gate-summary">

//                                     <div className="ores-gate-icon">

//                                         <i className="bi bi-door-open" />

//                                     </div>


//                                     <div className="ores-gate-copy">

//                                         <span>

//                                             {
//                                                 data.primaryGate?.name ||
//                                                 "Primary Gate"
//                                             }

//                                         </span>


//                                         <strong>

//                                             {
//                                                 data.activeGates > 0
//                                                     ? "Operational"
//                                                     : "No active gate"
//                                             }

//                                         </strong>

//                                     </div>


//                                     <span className="ores-operational-pill">

//                                         {
//                                             data.activeGates
//                                         }

//                                         /
//                                         {data.gates}

//                                     </span>

//                                 </div>


//                                 <div className="ores-security-row">

//                                     <span>
//                                         Visitors currently inside
//                                     </span>

//                                     <strong>
//                                         {data.visitorsInside}
//                                     </strong>

//                                 </div>


//                                 <div className="ores-security-row">

//                                     <span>
//                                         Visitors today
//                                     </span>

//                                     <strong>
//                                         {data.visitorsToday}
//                                     </strong>

//                                 </div>


//                                 <div className="ores-security-row">

//                                     <span>
//                                         Completed visits
//                                     </span>

//                                     <strong>
//                                         {data.completedVisitors}
//                                     </strong>

//                                 </div>


//                                 <div className="ores-security-row">

//                                     <span>
//                                         Pending invitations
//                                     </span>

//                                     <strong>
//                                         {data.pendingVisitors}
//                                     </strong>

//                                 </div>


//                                 <Link
//                                     to="/admin/visitors"
//                                     className="ores-security-link"
//                                 >

//                                     <span>

//                                         View visitor activity

//                                     </span>


//                                     <i className="bi bi-arrow-right" />

//                                 </Link>

//                             </div>

//                         </section>

//                     </div>

//                 </section>


//                 {/* =================================================
//                     QUICK ACTIONS
//                 ================================================= */}

//                 <section className="ores-admin-section">

//                     <div className="ores-admin-section-heading">

//                         <div>

//                             <h2>

//                                 Administration

//                             </h2>


//                             <p>

//                                 Frequently used oRES management
//                                 modules.

//                             </p>

//                         </div>

//                     </div>


//                     <section className="ores-panel">

//                         <div className="ores-panel-header">

//                             <div>

//                                 <h2 className="ores-panel-title">

//                                     Quick Actions

//                                 </h2>


//                                 <p className="ores-panel-subtitle">

//                                     Open the main management
//                                     areas directly.

//                                 </p>

//                             </div>


//                             <div className="ores-panel-icon">

//                                 <i className="bi bi-lightning-charge" />

//                             </div>

//                         </div>


//                         <div className="ores-actions-grid">

//                             {
//                                 quickActions.map(
//                                     action => (

//                                         <Link
//                                             key={
//                                                 action.title
//                                             }
//                                             to={
//                                                 action.route
//                                             }
//                                             className="ores-action-card"
//                                         >

//                                             <div className="ores-action-icon">

//                                                 <i
//                                                     className={`bi ${action.icon}`}
//                                                 />

//                                             </div>


//                                             <div className="ores-action-copy">

//                                                 <div className="ores-action-title">

//                                                     {
//                                                         action.title
//                                                     }

//                                                 </div>


//                                                 <div className="ores-action-description">

//                                                     {
//                                                         action.description
//                                                     }

//                                                 </div>

//                                             </div>


//                                             <i className="bi bi-chevron-right ores-action-arrow" />

//                                         </Link>

//                                     )
//                                 )
//                             }

//                         </div>

//                     </section>

//                 </section>


//                 {/* =================================================
//                     RECENT VISITOR ACTIVITY
//                 ================================================= */}

//                 <section className="ores-admin-section">

//                     <div className="ores-admin-section-heading">

//                         <div>

//                             <h2>

//                                 Recent Activity

//                             </h2>


//                             <p>

//                                 Latest visitor movements
//                                 recorded by oRES.

//                             </p>

//                         </div>

//                     </div>


//                     <section className="ores-panel">

//                         <div className="ores-panel-header">

//                             <div>

//                                 <h2 className="ores-panel-title">

//                                     Recent Visitor Activity

//                                 </h2>


//                                 <p className="ores-panel-subtitle">

//                                     Latest recorded gate
//                                     movements.

//                                 </p>

//                             </div>


//                             <div className="ores-panel-icon">

//                                 <i className="bi bi-clock-history" />

//                             </div>

//                         </div>


//                         {
//                             data.recentVisits.length ===
//                             0

//                                 ? (

//                                     <div className="ores-empty">

//                                         <div className="ores-empty-icon">

//                                             <i className="bi bi-inbox" />

//                                         </div>


//                                         <h3>

//                                             No recent visitor activity

//                                         </h3>


//                                         <p>

//                                             Visitor visit records
//                                             will appear here as
//                                             activity is recorded.

//                                         </p>

//                                     </div>

//                                 )

//                                 : (

//                                     <div className="ores-table-wrapper">

//                                         <table className="ores-table">

//                                             <thead>

//                                                 <tr>

//                                                     <th>
//                                                         Visitor
//                                                     </th>

//                                                     <th>
//                                                         Host
//                                                     </th>

//                                                     <th>
//                                                         Time In
//                                                     </th>

//                                                     <th>
//                                                         Status
//                                                     </th>

//                                                 </tr>

//                                             </thead>


//                                             <tbody>

//                                                 {
//                                                     data.recentVisits.map(
//                                                         visit => (

//                                                             <tr
//                                                                 key={
//                                                                     visit.id
//                                                                 }
//                                                             >

//                                                                 <td>

//                                                                     <strong>

//                                                                         {
//                                                                             visit.visitor_name ||
//                                                                             "—"
//                                                                         }

//                                                                     </strong>


//                                                                     {
//                                                                         visit.visitor_phone && (

//                                                                             <div className="ores-table-subtext">

//                                                                                 {
//                                                                                     visit.visitor_phone
//                                                                                 }

//                                                                             </div>

//                                                                         )
//                                                                     }

//                                                                 </td>


//                                                                 <td>

//                                                                     {
//                                                                         visit.host_name ||
//                                                                         "—"
//                                                                     }

//                                                                 </td>


//                                                                 <td>

//                                                                     {
//                                                                         formatTime(
//                                                                             visit.time_in
//                                                                         )
//                                                                     }

//                                                                 </td>


//                                                                 <td>

//                                                                     <span className="ores-status">

//                                                                         <span>

//                                                                             ●

//                                                                         </span>


//                                                                         {
//                                                                             visit.status_display ||
//                                                                             visit.status ||
//                                                                             "—"
//                                                                         }

//                                                                     </span>

//                                                                 </td>

//                                                             </tr>

//                                                         )
//                                                     )
//                                                 }

//                                             </tbody>

//                                         </table>

//                                     </div>

//                                 )
//                         }

//                     </section>

//                 </section>


//                 {/* =================================================
//                     SYSTEM HEALTH
//                 ================================================= */}

//                 <section className="ores-admin-section mb-0">

//                     <div className="ores-panel-grid">


//                         {/* =========================================
//                             DATA HEALTH
//                         ========================================= */}

//                         <section className="ores-panel">

//                             <div className="ores-panel-header">

//                                 <div>

//                                     <h2 className="ores-panel-title">

//                                         System Health

//                                     </h2>


//                                     <p className="ores-panel-subtitle">

//                                         Quick data and registration
//                                         health indicators.

//                                     </p>

//                                 </div>


//                                 <div className="ores-panel-icon">

//                                     <i className="bi bi-heart-pulse" />

//                                 </div>

//                             </div>


//                             <div className="ores-health-body">

//                                 <div className="ores-health-header">

//                                     <div className="ores-health-icon">

//                                         <i className="bi bi-database-check" />

//                                     </div>


//                                     <div className="ores-health-copy">

//                                         <strong>

//                                             oRES Community Snapshot

//                                         </strong>


//                                         <span>

//                                             Current records available
//                                             through the Admin portal.

//                                         </span>

//                                     </div>

//                                 </div>


//                                 <div className="ores-health-list">


//                                     <div className="ores-health-row">

//                                         <span>
//                                             Properties
//                                         </span>

//                                         <strong>
//                                             {data.properties}
//                                         </strong>

//                                     </div>


//                                     <div className="ores-health-row">

//                                         <span>
//                                             Residents
//                                         </span>

//                                         <strong>
//                                             {data.residents}
//                                         </strong>

//                                     </div>


//                                     <div className="ores-health-row">

//                                         <span>
//                                             Vehicles
//                                         </span>

//                                         <strong>
//                                             {data.vehicles}
//                                         </strong>

//                                     </div>


//                                     <div className="ores-health-row">

//                                         <span>
//                                             Motorist Stickers
//                                         </span>

//                                         <strong>
//                                             {data.stickers}
//                                         </strong>

//                                     </div>


//                                     <div className="ores-health-row">

//                                         <span>
//                                             Visitor Visits
//                                         </span>

//                                         <strong>
//                                             {data.completedVisitors}
//                                         </strong>

//                                     </div>


//                                     <div className="ores-health-row">

//                                         <span>
//                                             Security Gates
//                                         </span>

//                                         <strong>
//                                             {data.activeGates}
//                                             {" / "}
//                                             {data.gates}
//                                         </strong>

//                                     </div>


//                                 </div>

//                             </div>

//                         </section>


//                         {/* =========================================
//                             STATUS SUMMARY
//                         ========================================= */}

//                         <section className="ores-panel">

//                             <div className="ores-panel-header">

//                                 <div>

//                                     <h2 className="ores-panel-title">

//                                         Attention Required

//                                     </h2>


//                                     <p className="ores-panel-subtitle">

//                                         Items that may need
//                                         administrative action.

//                                     </p>

//                                 </div>


//                                 <div className="ores-panel-icon">

//                                     <i className="bi bi-exclamation-circle" />

//                                 </div>

//                             </div>


//                             <div className="ores-health-body">

//                                 <div className="ores-health-list">


//                                     <div className="ores-health-row">

//                                         <span>
//                                             Pending visitors
//                                         </span>

//                                         <strong>
//                                             {data.pendingVisitors}
//                                         </strong>

//                                     </div>


//                                     <div className="ores-health-row">

//                                         <span>
//                                             Pending stickers
//                                         </span>

//                                         <strong>
//                                             {data.pendingStickers}
//                                         </strong>

//                                     </div>


//                                     <div className="ores-health-row">

//                                         <span>
//                                             Inactive residents
//                                         </span>

//                                         <strong>
//                                             {data.inactiveResidents}
//                                         </strong>

//                                     </div>


//                                     <div className="ores-health-row">

//                                         <span>
//                                             Inactive vehicles
//                                         </span>

//                                         <strong>
//                                             {data.inactiveVehicles}
//                                         </strong>

//                                     </div>


//                                     <div className="ores-health-row">

//                                         <span>
//                                             Revoked stickers
//                                         </span>

//                                         <strong>
//                                             {data.revokedStickers}
//                                         </strong>

//                                     </div>


//                                     <div className="ores-health-row">

//                                         <span>
//                                             Inactive gates
//                                         </span>

//                                         <strong>
//                                             {data.inactiveGates}
//                                         </strong>

//                                     </div>


//                                 </div>

//                             </div>

//                         </section>

//                     </div>

//                 </section>

//             </div>

//         </>

//     );

// }

