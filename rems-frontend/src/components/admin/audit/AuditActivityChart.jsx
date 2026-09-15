import {
    useMemo,
} from "react";

import {
    BsActivity,
    BsBarChartLine,
} from "react-icons/bs";


/* ============================================================
   HELPERS
============================================================ */

const normalizeEvents = (
    events
) => {
    if (
        !Array.isArray(events)
    ) {
        return [];
    }

    return events;
};


const getEventTimestamp = (
    event
) => {
    return (
        event?.timestamp ||
        event?.created_at ||
        event?.date ||
        event?.datetime ||
        null
    );
};


const getDayKey = (
    value
) => {
    if (
        !value
    ) {
        return null;
    }

    const date =
        new Date(
            value
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;
};


const formatDayLabel = (
    key
) => {
    if (
        !key
    ) {
        return "";
    }

    const date =
        new Date(
            `${key}T00:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return key;
    }

    return date.toLocaleDateString(
        undefined,
        {
            month:
                "short",
            day:
                "numeric",
        }
    );
};


const formatTooltipDate = (
    key
) => {
    if (
        !key
    ) {
        return "";
    }

    const date =
        new Date(
            `${key}T00:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return key;
    }

    return date.toLocaleDateString(
        undefined,
        {
            year:
                "numeric",
            month:
                "long",
            day:
                "numeric",
        }
    );
};


/* ============================================================
   COMPONENT
============================================================ */

export default function AuditActivityChart({
    events = [],
    data = null,
    loading = false,
    error = "",
    days = 14,
    title = "Audit Activity Trend",
    subtitle = "Audit events recorded over time",
    height = 300,
}) {
    /*
     * The component accepts either:
     *
     * events:
     * [
     *   {
     *      timestamp: "...",
     *      ...
     *   }
     * ]
     *
     * OR already aggregated data:
     *
     * [
     *   {
     *      date: "2026-09-01",
     *      count: 12
     *   }
     * ]
     *
     * This keeps the chart independent from the API shape.
     */

    const chartData =
        useMemo(
            () => {
                /*
                 * ----------------------------------------------------
                 * CASE 1
                 * Pre-aggregated chart data supplied.
                 * ----------------------------------------------------
                 */

                if (
                    Array.isArray(
                        data
                    ) &&
                    data.length > 0
                ) {
                    return data
                        .map(
                            (
                                item
                            ) => {
                                const date =
                                    item?.date ||
                                    item?.day ||
                                    item?.label;

                                const count =
                                    Number(
                                        item?.count ??
                                        item?.value ??
                                        item?.events ??
                                        0
                                    );

                                return {
                                    key:
                                        date,

                                    label:
                                        formatDayLabel(
                                            date
                                        ),

                                    tooltip:
                                        formatTooltipDate(
                                            date
                                        ),

                                    count:
                                        Number.isFinite(
                                            count
                                        )
                                            ? count
                                            : 0,
                                };
                            }
                        )
                        .filter(
                            (
                                item
                            ) =>
                                item.key
                        );
                }


                /*
                 * ----------------------------------------------------
                 * CASE 2
                 * Raw audit events.
                 * ----------------------------------------------------
                 */

                const rows =
                    normalizeEvents(
                        events
                    );

                const grouped =
                    new Map();

                rows.forEach(
                    (
                        event
                    ) => {
                        const key =
                            getDayKey(
                                getEventTimestamp(
                                    event
                                )
                            );

                        if (
                            !key
                        ) {
                            return;
                        }

                        grouped.set(
                            key,
                            (
                                grouped.get(
                                    key
                                ) || 0
                            ) + 1
                        );
                    }
                );


                /*
                 * ----------------------------------------------------
                 * Build a continuous date range.
                 *
                 * Even days with zero activity remain visible.
                 * ----------------------------------------------------
                 */

                const result =
                    [];

                const today =
                    new Date();

                today.setHours(
                    0,
                    0,
                    0,
                    0
                );


                const safeDays =
                    Math.max(
                        2,
                        Number(
                            days
                        ) || 14
                    );


                for (
                    let index =
                        safeDays -
                        1;
                    index >= 0;
                    index -= 1
                ) {
                    const date =
                        new Date(
                            today
                        );

                    date.setDate(
                        today.getDate() -
                        index
                    );


                    const year =
                        date.getFullYear();

                    const month =
                        String(
                            date.getMonth() + 1
                        ).padStart(
                            2,
                            "0"
                        );

                    const day =
                        String(
                            date.getDate()
                        ).padStart(
                            2,
                            "0"
                        );

                    const key =
                        `${year}-${month}-${day}`;


                    result.push(
                        {
                            key,

                            label:
                                formatDayLabel(
                                    key
                                ),

                            tooltip:
                                formatTooltipDate(
                                    key
                                ),

                            count:
                                grouped.get(
                                    key
                                ) || 0,
                        }
                    );
                }

                return result;
            },
            [
                data,
                events,
                days,
            ]
        );


    /* ============================================================
       CHART DIMENSIONS
    ============================================================ */

    const chartWidth =
        900;

    const chartHeight =
        280;

    const paddingLeft =
        55;

    const paddingRight =
        20;

    const paddingTop =
        25;

    const paddingBottom =
        42;

    const drawableWidth =
        chartWidth -
        paddingLeft -
        paddingRight;

    const drawableHeight =
        chartHeight -
        paddingTop -
        paddingBottom;


    /* ============================================================
       MAXIMUM
    ============================================================ */

    const maxValue =
        useMemo(
            () => {
                const maximum =
                    Math.max(
                        0,
                        ...chartData.map(
                            (
                                item
                            ) =>
                                Number(
                                    item.count ||
                                    0
                                )
                        )
                    );

                if (
                    maximum <= 0
                ) {
                    return 1;
                }

                return maximum;
            },
            [
                chartData,
            ]
        );


    /* ============================================================
       SVG POINTS
    ============================================================ */

    const points =
        useMemo(
            () => {
                if (
                    chartData.length ===
                    0
                ) {
                    return [];
                }

                const divisor =
                    Math.max(
                        1,
                        chartData.length -
                            1
                    );

                return chartData.map(
                    (
                        item,
                        index
                    ) => {
                        const x =
                            paddingLeft +
                            (
                                index /
                                divisor
                            ) *
                                drawableWidth;

                        const value =
                            Number(
                                item.count ||
                                0
                            );

                        const y =
                            paddingTop +
                            drawableHeight -
                            (
                                value /
                                maxValue
                            ) *
                                drawableHeight;

                        return {
                            ...item,
                            x,
                            y,
                        };
                    }
                );
            },
            [
                chartData,
                drawableWidth,
                drawableHeight,
                maxValue,
            ]
        );


    /* ============================================================
       LINE PATH
    ============================================================ */

    const linePath =
        useMemo(
            () => {
                if (
                    points.length ===
                    0
                ) {
                    return "";
                }

                return points
                    .map(
                        (
                            point,
                            index
                        ) =>
                            `${
                                index ===
                                0
                                    ? "M"
                                    : "L"
                            } ${point.x} ${point.y}`
                    )
                    .join(
                        " "
                    );
            },
            [
                points,
            ]
        );


    /* ============================================================
       AREA PATH
    ============================================================ */

    const areaPath =
        useMemo(
            () => {
                if (
                    points.length ===
                    0
                ) {
                    return "";
                }

                const first =
                    points[0];

                const last =
                    points[
                        points.length -
                        1
                    ];

                const bottom =
                    paddingTop +
                    drawableHeight;

                return [
                    `M ${first.x} ${bottom}`,
                    `L ${first.x} ${first.y}`,

                    points
                        .slice(
                            1
                        )
                        .map(
                            (
                                point
                            ) =>
                                `L ${point.x} ${point.y}`
                        )
                        .join(
                            " "
                        ),

                    `L ${last.x} ${bottom}`,
                    "Z",
                ].join(
                    " "
                );
            },
            [
                points,
                drawableHeight,
            ]
        );


    /* ============================================================
       Y-AXIS LABELS
    ============================================================ */

    const yAxis =
        useMemo(
            () => {
                const steps =
                    4;

                return Array.from(
                    {
                        length:
                            steps +
                            1,
                    },
                    (
                        _,
                        index
                    ) => {
                        const value =
                            Math.round(
                                (
                                    maxValue *
                                    index
                                ) /
                                    steps
                            );

                        const y =
                            paddingTop +
                            drawableHeight -
                            (
                                index /
                                steps
                            ) *
                                drawableHeight;

                        return {
                            value,
                            y,
                        };
                    }
                );
            },
            [
                maxValue,
                drawableHeight,
            ]
        );


    /* ============================================================
       X-AXIS DISPLAY LABELS
    ============================================================ */

    const visibleXLabels =
        useMemo(
            () => {
                if (
                    points.length <=
                    7
                ) {
                    return points;
                }

                const lastIndex =
                    points.length -
                    1;

                const indexes =
                    [
                        0,
                        Math.round(
                            lastIndex *
                                0.25
                        ),
                        Math.round(
                            lastIndex *
                                0.5
                        ),
                        Math.round(
                            lastIndex *
                                0.75
                        ),
                        lastIndex,
                    ];

                return indexes
                    .map(
                        (
                            index
                        ) =>
                            points[
                                index
                            ]
                    )
                    .filter(
                        (
                            point,
                            index,
                            array
                        ) =>
                            array.findIndex(
                                (
                                    item
                                ) =>
                                    item.key ===
                                    point.key
                            ) ===
                            index
                    );
            },
            [
                points,
            ]
        );


    /* ============================================================
       TOTAL
    ============================================================ */

    const totalEvents =
        useMemo(
            () =>
                chartData.reduce(
                    (
                        total,
                        item
                    ) =>
                        total +
                        Number(
                            item.count ||
                            0
                        ),
                    0
                ),
            [
                chartData,
            ]
        );


    /* ============================================================
       RENDER
    ============================================================ */

    return (
        <div
            className="rems-glass-card h-100"
            style={{
                overflow:
                    "hidden",
            }}
        >

            {/* ====================================================
                HEADER
            ==================================================== */}

            <div
                className="rems-card-header"
                style={{
                    borderBottom:
                        "1px solid rgba(255,255,255,0.08)",
                }}
            >

                <div
                    className="d-flex align-items-start gap-3"
                >

                    <div
                        className="rems-stat-icon flex-shrink-0"
                        style={{
                            width:
                                "44px",
                            height:
                                "44px",
                            borderRadius:
                                "13px",
                            display:
                                "flex",
                            alignItems:
                                "center",
                            justifyContent:
                                "center",
                        }}
                    >
                        <BsActivity />
                    </div>


                    <div>

                        <div className="rems-page-eyebrow">
                            AUDIT MONITORING
                        </div>

                        <div className="rems-card-title">
                            {title}
                        </div>

                        <div className="rems-card-subtitle">
                            {subtitle}
                        </div>

                    </div>

                </div>


                <div
                    className="text-end"
                >

                    <div className="rems-table-secondary">
                        Events shown
                    </div>

                    <div
                        className="rems-table-primary"
                        style={{
                            fontSize:
                                "1.05rem",
                        }}
                    >
                        {
                            totalEvents.toLocaleString()
                        }
                    </div>

                </div>

            </div>


            {/* ====================================================
                BODY
            ==================================================== */}

            <div
                className="p-3 p-md-4"
                style={{
                    minHeight:
                        `${height}px`,
                }}
            >

                {loading ? (
                    <div
                        className="rems-loading-state"
                        style={{
                            minHeight:
                                `${height - 40}px`,
                        }}
                    >

                        <div
                            className="spinner-border"
                            role="status"
                            aria-hidden="true"
                        />

                        <div className="mt-3">
                            Loading audit activity...
                        </div>

                    </div>
                ) : error ? (
                    <div
                        className="alert alert-danger rems-alert"
                        role="alert"
                    >

                        <div className="d-flex align-items-start gap-2">

                            <BsActivity
                                className="mt-1 flex-shrink-0"
                            />

                            <div>

                                <div className="fw-semibold">
                                    Unable to load audit activity
                                </div>

                                <div className="small mt-1">
                                    {error}
                                </div>

                            </div>

                        </div>

                    </div>
                ) : chartData.length ===
                    0 ? (
                    <div
                        className="rems-empty-state"
                        style={{
                            minHeight:
                                `${height - 50}px`,
                        }}
                    >

                        <div className="rems-empty-icon">
                            <BsBarChartLine />
                        </div>

                        <div className="rems-empty-title">
                            No audit activity
                        </div>

                        <div className="rems-empty-text">
                            There are no audit events
                            available for the selected
                            period.
                        </div>

                    </div>
                ) : (
                    <div
                        style={{
                            width:
                                "100%",
                            overflowX:
                                "auto",
                        }}
                    >

                        <svg
                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                            width="100%"
                            height={height}
                            preserveAspectRatio="none"
                            role="img"
                            aria-label={
                                title
                            }
                        >

                            {/* ======================================
                                GRID
                            ====================================== */}

                            {yAxis.map(
                                (
                                    item
                                ) => (
                                    <g
                                        key={
                                            `grid-${item.value}`
                                        }
                                    >

                                        <line
                                            x1={
                                                paddingLeft
                                            }
                                            x2={
                                                chartWidth -
                                                paddingRight
                                            }
                                            y1={
                                                item.y
                                            }
                                            y2={
                                                item.y
                                            }
                                            stroke="currentColor"
                                            strokeOpacity="0.08"
                                            strokeDasharray="4 6"
                                        />

                                        <text
                                            x={
                                                paddingLeft -
                                                10
                                            }
                                            y={
                                                item.y +
                                                4
                                            }
                                            textAnchor="end"
                                            fontSize="11"
                                            fill="currentColor"
                                            opacity="0.55"
                                        >
                                            {
                                                item.value
                                            }
                                        </text>

                                    </g>
                                )
                            )}


                            {/* ======================================
                                AREA
                            ====================================== */}

                            {areaPath && (
                                <path
                                    d={
                                        areaPath
                                    }
                                    fill="currentColor"
                                    fillOpacity="0.07"
                                    stroke="none"
                                />
                            )}


                            {/* ======================================
                                LINE
                            ====================================== */}

                            {linePath && (
                                <path
                                    d={
                                        linePath
                                    }
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity="0.9"
                                />
                            )}


                            {/* ======================================
                                POINTS
                            ====================================== */}

                            {points.map(
                                (
                                    point
                                ) => (
                                    <g
                                        key={
                                            `point-${point.key}`
                                        }
                                    >

                                        <circle
                                            cx={
                                                point.x
                                            }
                                            cy={
                                                point.y
                                            }
                                            r="5"
                                            fill="currentColor"
                                            opacity="0.95"
                                        />

                                        <circle
                                            cx={
                                                point.x
                                            }
                                            cy={
                                                point.y
                                            }
                                            r="9"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeOpacity="0.12"
                                        />

                                    </g>
                                )
                            )}


                            {/* ======================================
                                X-AXIS
                            ====================================== */}

                            <line
                                x1={
                                    paddingLeft
                                }
                                x2={
                                    chartWidth -
                                    paddingRight
                                }
                                y1={
                                    paddingTop +
                                    drawableHeight
                                }
                                y2={
                                    paddingTop +
                                    drawableHeight
                                }
                                stroke="currentColor"
                                strokeOpacity="0.12"
                            />


                            {/* ======================================
                                X LABELS
                            ====================================== */}

                            {visibleXLabels.map(
                                (
                                    point
                                ) => (
                                    <text
                                        key={
                                            `label-${point.key}`
                                        }
                                        x={
                                            point.x
                                        }
                                        y={
                                            chartHeight -
                                            12
                                        }
                                        textAnchor="middle"
                                        fontSize="11"
                                        fill="currentColor"
                                        opacity="0.55"
                                    >
                                        {
                                            point.label
                                        }
                                    </text>
                                )
                            )}

                        </svg>


                        {/* =========================================
                            DETAIL TABLE BELOW CHART
                        ========================================= */}

                        <div
                            className="row g-2 mt-2"
                        >

                            {chartData
                                .slice(
                                    -5
                                )
                                .map(
                                    (
                                        item
                                    ) => (
                                        <div
                                            className="col-6 col-md"
                                            key={
                                                item.key
                                            }
                                        >

                                            <div
                                                className="p-2 rounded-3"
                                                style={{
                                                    background:
                                                        "rgba(255,255,255,0.025)",
                                                    border:
                                                        "1px solid rgba(255,255,255,0.06)",
                                                }}
                                            >

                                                <div className="rems-table-secondary">
                                                    {
                                                        item.label
                                                    }
                                                </div>

                                                <div
                                                    className="rems-table-primary"
                                                    style={{
                                                        fontWeight:
                                                            700,
                                                    }}
                                                >
                                                    {
                                                        Number(
                                                            item.count ||
                                                            0
                                                        ).toLocaleString()
                                                    }
                                                </div>

                                            </div>

                                        </div>
                                    )
                                )}

                        </div>

                    </div>
                )}

            </div>

        </div>
    );
}
