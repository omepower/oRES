import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    BsArrowClockwise,
    BsCalendar3,
    BsCheck2Circle,
    BsChevronRight,
    BsClockHistory,
    BsCreditCard,
    BsExclamationTriangle,
    BsFilter,
    BsPeople,
    BsSearch,
    BsShieldCheck,
    BsXCircle,
} from "react-icons/bs";

import {
    getMyFacilityBookings,
    cancelFacilityBooking,
} from "../../api/facilities";


/* =========================================================
   HELPERS
========================================================= */

const normalize = (
    response
) => {
    if (
        Array.isArray(
            response
        )
    ) {
        return response;
    }

    return (
        response?.results ||
        response?.bookings ||
        []
    );
};


const normalizeStatus = (
    status
) => {
    return String(
        status || ""
    )
        .trim()
        .toUpperCase();
};


const getErrorMessage = (
    error,
    fallback =
        "Unable to complete the request."
) => {
    const data =
        error?.response?.data;

    if (
        typeof data ===
        "string" &&
        data.trim()
    ) {
        return data;
    }

    if (
        data?.detail
    ) {
        return String(
            data.detail
        );
    }

    if (
        data &&
        typeof data ===
        "object"
    ) {
        const preferredFields = [
            "booking",
            "facility",
            "reason",
            "detail",
            "non_field_errors",
        ];

        for (
            const field
            of preferredFields
        ) {
            const value =
                data[field];

            if (
                Array.isArray(
                    value
                ) &&
                value.length
            ) {
                return String(
                    value[0]
                );
            }

            if (
                typeof value ===
                    "string" &&
                value.trim()
            ) {
                return value;
            }
        }

        const firstError =
            Object.values(
                data
            )
                .flat()
                .find(
                    (value) =>
                        value !==
                            null &&
                        value !==
                            undefined &&
                        String(
                            value
                        ).trim()
                );

        if (
            firstError
        ) {
            return String(
                firstError
            );
        }
    }

    if (
        error?.message
    ) {
        return String(
            error.message
        );
    }

    return fallback;
};


const getTodayString = () => {
    const date =
        new Date();

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


const formatMoney = (
    amount
) => {
    return `₱${Number(
        amount || 0
    ).toLocaleString(
        undefined,
        {
            minimumFractionDigits:
                2,
            maximumFractionDigits:
                2,
        }
    )}`;
};


const formatDuration = (
    startTime,
    endTime
) => {
    if (
        !startTime ||
        !endTime
    ) {
        return "—";
    }

    const startParts =
        String(
            startTime
        )
            .split(":")
            .map(Number);

    const endParts =
        String(
            endTime
        )
            .split(":")
            .map(Number);

    const start =
        (
            startParts[0] *
                60
        ) +
        startParts[1];

    const end =
        (
            endParts[0] *
                60
        ) +
        endParts[1];

    const minutes =
        end - start;

    if (
        minutes <= 0
    ) {
        return "—";
    }

    const hours =
        Math.floor(
            minutes / 60
        );

    const remainder =
        minutes % 60;

    if (
        hours &&
        remainder
    ) {
        return `${hours}h ${remainder}m`;
    }

    if (
        hours
    ) {
        return `${hours}h`;
    }

    return `${remainder}m`;
};


const formatHoldTime = (
    seconds
) => {
    const total =
        Math.max(
            0,
            Number(
                seconds || 0
            )
        );

    const minutes =
        Math.floor(
            total / 60
        );

    const remainder =
        total % 60;

    return `${String(
        minutes
    ).padStart(
        2,
        "0"
    )}:${String(
        remainder
    ).padStart(
        2,
        "0"
    )}`;
};


const getPencilRemainingSeconds = (
    booking
) => {
    if (
        normalizeStatus(
            booking?.status
        ) !==
        "PENCIL"
    ) {
        return null;
    }

    if (
        !booking?.pencil_expires_at
    ) {
        return null;
    }

    const expiry =
        new Date(
            booking.pencil_expires_at
        ).getTime();

    if (
        Number.isNaN(
            expiry
        )
    ) {
        return null;
    }

    return Math.max(
        0,
        Math.floor(
            (
                expiry -
                Date.now()
            ) / 1000
        )
    );
};


const isPencilExpired = (
    booking
) => {
    const status =
        normalizeStatus(
            booking?.status
        );

    if (
        status !==
        "PENCIL"
    ) {
        return false;
    }

    const remaining =
        getPencilRemainingSeconds(
            booking
        );

    if (
        remaining === null
    ) {
        return false;
    }

    return (
        remaining <= 0
    );
};


const getEffectiveDisplayStatus = (
    booking
) => {
    const status =
        normalizeStatus(
            booking?.status
        );

    if (
        status ===
        "PENCIL" &&
        isPencilExpired(
            booking
        )
    ) {
        return "EXPIRED";
    }

    return status;
};


const getStatusLabel = (
    booking
) => {
    const effectiveStatus =
        getEffectiveDisplayStatus(
            booking
        );

    if (
        effectiveStatus ===
        "EXPIRED"
    ) {
        return "Hold Expired";
    }

    return (
        booking?.status_display ||
        booking?.status ||
        "Unknown"
    );
};


const getStatusClass = (
    status
) => {
    switch (
        normalizeStatus(
            status
        )
    ) {
        case "PENCIL":
            return "rems-status-warning";

        case "PENDING":
            return "rems-status-warning";

        case "APPROVED":
            return "rems-status-success";

        case "IN_USE":
            return "rems-status-success";

        case "INSPECTION_PENDING":
            return "rems-status-warning";

        case "REFUND_PENDING":
            return "rems-status-warning";

        case "CLOSED":
            return "rems-status-secondary";

        case "COMPLETED":
            return "rems-status-success";

        case "REJECTED":
            return "rems-status-danger";

        case "CANCELLED":
            return "rems-status-danger";

        case "EXPIRED":
            return "rems-status-danger";

        default:
            return "rems-status-secondary";
    }
};


const getBookingFacilityName = (
    booking
) => {
    return (
        booking?.facility_name ||
        booking?.facility?.name ||
        "Facility"
    );
};


const getBookingEventType = (
    booking
) => {
    return (
        booking?.event_type_display ||
        booking?.event_type ||
        "Facility Reservation"
    );
};


const getBookingGuestCount = (
    booking
) => {
    if (
        booking?.guest_count !==
            undefined &&
        booking?.guest_count !==
            null
    ) {
        return Number(
            booking.guest_count
        );
    }

    return Number(
        booking?.estimated_guests ||
        0
    );
};


const getBookingTotal = (
    booking
) => {
    return Number(
        booking?.total_amount_due ||
        0
    );
};


const ACTIVE_STATUSES = [
    "PENCIL",
    "PENDING",
    "APPROVED",
    "IN_USE",
    "INSPECTION_PENDING",
    "REFUND_PENDING",
];


const CANCELLABLE_STATUSES = [
    "PENCIL",
    "PENDING",
    "APPROVED",
];


const TERMINAL_STATUSES = [
    "REJECTED",
    "CANCELLED",
    "CLOSED",
    "COMPLETED",
    "EXPIRED",
];


/* =========================================================
   COMPONENT
========================================================= */

export default function ResidentFacilityBookings() {
    const navigate =
        useNavigate();

    const portalPrefix =
        window.location.pathname.startsWith(
            "/tenant"
        )
            ? "/tenant"
            : "/homeowner";


    /* =====================================================
       DATA
    ===================================================== */

    const [
        bookings,
        setBookings,
    ] = useState([]);


    /* =====================================================
       PAGE STATE
    ===================================================== */

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        processingId,
        setProcessingId,
    ] = useState(null);


    /* =====================================================
       FILTER STATE
    ===================================================== */

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState(
        "ALL"
    );

    const [
        dateFilter,
        setDateFilter,
    ] = useState(
        "ALL"
    );


    /* =====================================================
       HOLD CLOCK
       
       This is display-only.
       
       It NEVER changes the backend booking status.
       Authoritative expiry remains handled by the
       booking/details workflow.
    ===================================================== */

    const [
        clockTick,
        setClockTick,
    ] = useState(
        Date.now()
    );


    /* =====================================================
       ERROR REF
    ===================================================== */

    const errorRef =
        useRef(null);


    /* =====================================================
       LOAD BOOKINGS
    ===================================================== */

    const load =
        useCallback(
            async (
                refresh = false
            ) => {
                if (
                    refresh
                ) {
                    setRefreshing(
                        true
                    );
                } else {
                    setLoading(
                        true
                    );
                }

                setError("");

                try {
                    const response =
                        await getMyFacilityBookings();

                    setBookings(
                        normalize(
                            response
                        )
                    );
                } catch (
                    err
                ) {
                    console.error(
                        "[Resident Facility Bookings] Load failed:",
                        err
                    );

                    setError(
                        getErrorMessage(
                            err,
                            "Unable to load your facility bookings."
                        )
                    );

                    setBookings(
                        []
                    );
                } finally {
                    setLoading(
                        false
                    );

                    setRefreshing(
                        false
                    );
                }
            },
            []
        );


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(
        () => {
            load();
        },
        [
            load,
        ]
    );


    /* =====================================================
       30-SECOND BACKEND REFRESH
    ===================================================== */

    useEffect(
        () => {
            const interval =
                window.setInterval(
                    () => {
                        load(
                            true
                        );
                    },
                    30000
                );

            return () => {
                window.clearInterval(
                    interval
                );
            };
        },
        [
            load,
        ]
    );


    /* =====================================================
       ONE-SECOND DISPLAY CLOCK
       
       Only required when one or more PENCIL bookings
       have an expiry timestamp.
    ===================================================== */

    useEffect(
        () => {
            const hasPencilHold =
                bookings.some(
                    (
                        booking
                    ) =>
                        normalizeStatus(
                            booking?.status
                        ) ===
                            "PENCIL" &&
                        booking?.pencil_expires_at
                );

            if (
                !hasPencilHold
            ) {
                return undefined;
            }

            const interval =
                window.setInterval(
                    () => {
                        setClockTick(
                            Date.now()
                        );
                    },
                    1000
                );

            return () => {
                window.clearInterval(
                    interval
                );
            };
        },
        [
            bookings,
        ]
    );


    /*
     * Reference clockTick so React knows the current
     * display time is intentionally part of rendering.
     */
    void clockTick;


    /* =====================================================
       AUTO-SCROLL TO ERROR
    ===================================================== */

    useEffect(
        () => {
            if (
                !error
            ) {
                return;
            }

            const timer =
                window.setTimeout(
                    () => {
                        if (
                            errorRef.current
                        ) {
                            errorRef.current.scrollIntoView(
                                {
                                    behavior:
                                        "smooth",
                                    block:
                                        "center",
                                }
                            );

                            try {
                                errorRef.current.focus(
                                    {
                                        preventScroll:
                                            true,
                                    }
                                );
                            } catch (
                                ignored
                            ) {
                                /*
                                 * Intentionally ignored.
                                 */
                            }
                        }
                    },
                    50
                );

            return () => {
                window.clearTimeout(
                    timer
                );
            };
        },
        [
            error,
        ]
    );


    /* =====================================================
       ENRICH BOOKINGS
    ===================================================== */

    const enrichedBookings =
        useMemo(
            () =>
                bookings.map(
                    (
                        booking
                    ) => {
                        const rawStatus =
                            normalizeStatus(
                                booking?.status
                            );

                        const effectiveStatus =
                            getEffectiveDisplayStatus(
                                booking
                            );

                        const remaining =
                            getPencilRemainingSeconds(
                                booking
                            );

                        return {
                            ...booking,

                            rawStatus,

                            effectiveStatus,

                            pencilRemainingSeconds:
                                remaining,

                            pencilExpired:
                                rawStatus ===
                                    "PENCIL" &&
                                remaining !==
                                    null &&
                                remaining <=
                                    0,
                        };
                    }
                ),
            [
                bookings,
                clockTick,
            ]
        );


    /* =====================================================
       STATISTICS
    ===================================================== */

    const statistics =
        useMemo(
            () => {
                const total =
                    enrichedBookings.length;

                const active =
                    enrichedBookings.filter(
                        (
                            booking
                        ) =>
                            ACTIVE_STATUSES.includes(
                                booking.rawStatus
                            )
                    ).length;

                const pencil =
                    enrichedBookings.filter(
                        (
                            booking
                        ) =>
                            booking.rawStatus ===
                            "PENCIL" &&
                            !booking.pencilExpired
                    ).length;

                const pending =
                    enrichedBookings.filter(
                        (
                            booking
                        ) =>
                            booking.rawStatus ===
                            "PENDING"
                    ).length;

                const approved =
                    enrichedBookings.filter(
                        (
                            booking
                        ) =>
                            booking.rawStatus ===
                            "APPROVED"
                    ).length;

                const inUse =
                    enrichedBookings.filter(
                        (
                            booking
                        ) =>
                            booking.rawStatus ===
                            "IN_USE"
                    ).length;

                const inspection =
                    enrichedBookings.filter(
                        (
                            booking
                        ) =>
                            booking.rawStatus ===
                            "INSPECTION_PENDING"
                    ).length;

                const refund =
                    enrichedBookings.filter(
                        (
                            booking
                        ) =>
                            booking.rawStatus ===
                            "REFUND_PENDING"
                    ).length;

                const completed =
                    enrichedBookings.filter(
                        (
                            booking
                        ) =>
                            [
                                "CLOSED",
                                "COMPLETED",
                            ].includes(
                                booking.rawStatus
                            )
                    ).length;

                const cancelled =
                    enrichedBookings.filter(
                        (
                            booking
                        ) =>
                            [
                                "CANCELLED",
                                "REJECTED",
                            ].includes(
                                booking.rawStatus
                            )
                    ).length;

                const expired =
                    enrichedBookings.filter(
                        (
                            booking
                        ) =>
                            booking.pencilExpired ||
                            booking.rawStatus ===
                            "EXPIRED"
                    ).length;

                return {
                    total,
                    active,
                    pencil,
                    pending,
                    approved,
                    inUse,
                    inspection,
                    refund,
                    completed,
                    cancelled,
                    expired,
                };
            },
            [
                enrichedBookings,
            ]
        );


    /* =====================================================
       SEARCH + FILTER
    ===================================================== */

    const filteredBookings =
        useMemo(
            () => {
                const query =
                    search
                        .trim()
                        .toLowerCase();

                const today =
                    getTodayString();

                return enrichedBookings
                    .filter(
                        (
                            booking
                        ) => {
                            if (
                                statusFilter !==
                                "ALL" &&
                                booking.effectiveStatus !==
                                    statusFilter
                            ) {
                                return false;
                            }

                            if (
                                dateFilter ===
                                "UPCOMING"
                            ) {
                                if (
                                    !booking.booking_date ||
                                    booking.booking_date <
                                        today
                                ) {
                                    return false;
                                }
                            }

                            if (
                                dateFilter ===
                                "PAST"
                            ) {
                                if (
                                    !booking.booking_date ||
                                    booking.booking_date >=
                                        today
                                ) {
                                    return false;
                                }
                            }

                            if (
                                dateFilter ===
                                "TODAY"
                            ) {
                                if (
                                    booking.booking_date !==
                                    today
                                ) {
                                    return false;
                                }
                            }

                            if (
                                !query
                            ) {
                                return true;
                            }

                            const searchable =
                                [
                                    getBookingFacilityName(
                                        booking
                                    ),
                                    getBookingEventType(
                                        booking
                                    ),
                                    booking?.booking_date,
                                    booking?.status_display,
                                    booking?.status,
                                    booking?.event_description,
                                ]
                                    .filter(
                                        Boolean
                                    )
                                    .join(
                                        " "
                                    )
                                    .toLowerCase();

                            return searchable.includes(
                                query
                            );
                        }
                    )
                    .sort(
                        (
                            a,
                            b
                        ) => {
                            const first =
                                `${a?.booking_date || ""} ${a?.start_time || ""}`;

                            const second =
                                `${b?.booking_date || ""} ${b?.start_time || ""}`;

                            return second.localeCompare(
                                first
                            );
                        }
                    );
            },
            [
                enrichedBookings,
                search,
                statusFilter,
                dateFilter,
            ]
        );


    /* =====================================================
       FILTER OPTIONS
    ===================================================== */

    const statusOptions =
        useMemo(
            () => [
                {
                    value:
                        "ALL",
                    label:
                        "All statuses",
                },
                {
                    value:
                        "PENCIL",
                    label:
                        "Pencil Hold",
                },
                {
                    value:
                        "PENDING",
                    label:
                        "Pending",
                },
                {
                    value:
                        "APPROVED",
                    label:
                        "Approved",
                },
                {
                    value:
                        "IN_USE",
                    label:
                        "In Use",
                },
                {
                    value:
                        "INSPECTION_PENDING",
                    label:
                        "Inspection Pending",
                },
                {
                    value:
                        "REFUND_PENDING",
                    label:
                        "Refund Pending",
                },
                {
                    value:
                        "CLOSED",
                    label:
                        "Closed",
                },
                {
                    value:
                        "COMPLETED",
                    label:
                        "Completed",
                },
                {
                    value:
                        "REJECTED",
                    label:
                        "Rejected",
                },
                {
                    value:
                        "CANCELLED",
                    label:
                        "Cancelled",
                },
                {
                    value:
                        "EXPIRED",
                    label:
                        "Hold Expired",
                },
            ],
            []
        );


    /* =====================================================
       CLEAR FILTERS
    ===================================================== */

    const clearFilters =
        () => {
            setSearch("");
            setStatusFilter(
                "ALL"
            );
            setDateFilter(
                "ALL"
            );
        };


    const hasFilters =
        Boolean(
            search.trim()
        ) ||
        statusFilter !==
            "ALL" ||
        dateFilter !==
            "ALL";


    /* =====================================================
       CANCEL BOOKING
    ===================================================== */

    const cancelBooking =
        async (
            booking
        ) => {
            const status =
                normalizeStatus(
                    booking?.status
                );

            /*
             * An expired PENCIL hold is not cancelled
             * through this generic resident action.
             *
             * Its authoritative expiry is handled by
             * the backend booking workflow.
             */
            if (
                status ===
                    "PENCIL" &&
                isPencilExpired(
                    booking
                )
            ) {
                setError(
                    "This Pencil reservation hold has already expired. Open the booking details to review its current status."
                );

                return;
            }

            if (
                !CANCELLABLE_STATUSES.includes(
                    status
                )
            ) {
                setError(
                    "This booking can no longer be cancelled from the resident portal."
                );

                return;
            }

            const facilityName =
                getBookingFacilityName(
                    booking
                );

            const bookingDate =
                booking?.booking_date ||
                "the selected date";

            const confirmed =
                window.confirm(
                    `Cancel the ${facilityName} reservation on ${bookingDate}?`
                );

            if (
                !confirmed
            ) {
                return;
            }

            setProcessingId(
                booking.id
            );

            setError("");

            try {
                await cancelFacilityBooking(
                    booking.id,
                    "Cancelled by resident."
                );

                await load(
                    true
                );
            } catch (
                err
            ) {
                console.error(
                    "[Resident Facility Bookings] Cancel failed:",
                    err
                );

                setError(
                    getErrorMessage(
                        err,
                        "Unable to cancel this facility booking."
                    )
                );
            } finally {
                setProcessingId(
                    null
                );
            }
        };


    /* =====================================================
       NAVIGATE TO DETAILS
    ===================================================== */

    const openBooking =
        (
            booking
        ) => {
            navigate(
                `${portalPrefix}/facilities/bookings/${booking.id}`
            );
        };


    /* =====================================================
       RESET WHEN NO RESULTS
    ===================================================== */

    const noResults =
        !loading &&
        filteredBookings.length ===
            0;

    const noBookings =
        !loading &&
        bookings.length ===
            0;


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="rems-page-content">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">
                        RESIDENT PORTAL
                    </div>

                    <h1 className="rems-page-title">
                        My Facility Bookings
                    </h1>

                    <p className="rems-page-description">
                        Track your facility reservations,
                        complete booking requirements,
                        monitor payments, and manage
                        reservation status.
                    </p>

                </div>


                <div className="d-flex gap-2">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() =>
                            navigate(
                                `${portalPrefix}/facilities`
                            )
                        }
                    >
                        <BsCalendar3 />

                        New Reservation
                    </button>


                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() =>
                            load(
                                true
                            )
                        }
                        disabled={
                            refreshing
                        }
                    >

                        <BsArrowClockwise />

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}

                    </button>

                </div>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div
                    ref={
                        errorRef
                    }
                    tabIndex={
                        -1
                    }
                    className="alert alert-danger rems-alert mb-4"
                    role="alert"
                >

                    <div className="d-flex align-items-start gap-2">

                        <BsExclamationTriangle
                            className="mt-1 flex-shrink-0"
                        />

                        <div>
                            {
                                error
                            }
                        </div>

                    </div>

                </div>
            )}


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="row g-3 mb-4">

                <div className="col-6 col-xl-3">

                    <div className="rems-stat-card h-100">

                        <div className="rems-stat-icon">
                            <BsCalendar3 />
                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Total Bookings
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.total
                                }
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-6 col-xl-3">

                    <div className="rems-stat-card h-100">

                        <div className="rems-stat-icon">
                            <BsClockHistory />
                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Active
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.active
                                }
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-6 col-xl-3">

                    <div className="rems-stat-card h-100">

                        <div className="rems-stat-icon">
                            <BsCheck2Circle />
                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Approved
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.approved
                                }
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-6 col-xl-3">

                    <div className="rems-stat-card h-100">

                        <div className="rems-stat-icon">
                            <BsCreditCard />
                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Completed
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.completed
                                }
                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                ACTIVE PENCIL NOTICE
            ================================================= */}

            {statistics.pencil >
                0 && (
                <div
                    className="alert alert-warning rems-alert mb-4"
                    role="alert"
                >

                    <div className="d-flex align-items-start gap-2">

                        <BsClockHistory
                            className="mt-1 flex-shrink-0"
                        />

                        <div>

                            <div className="fw-semibold">
                                Reservation hold in progress
                            </div>

                            <div className="small mt-1">
                                You have{" "}
                                <strong>
                                    {
                                        statistics.pencil
                                    }
                                </strong>{" "}
                                Pencil reservation
                                {statistics.pencil ===
                                1
                                    ? ""
                                    : "s"}{" "}
                                awaiting completion.
                                Open the booking to continue.
                            </div>

                        </div>

                    </div>

                </div>
            )}


            {/* =================================================
                SEARCH / FILTERS
            ================================================= */}

            <div className="rems-glass-card mb-4">

                <div className="p-3 p-md-4">

                    <div className="row g-3 align-items-end">

                        {/* Search */}

                        <div className="col-12 col-xl-5">

                            <label className="rems-form-label">
                                Search bookings
                            </label>

                            <div className="position-relative">

                                <BsSearch
                                    className="position-absolute"
                                    style={{
                                        left:
                                            "14px",
                                        top:
                                            "50%",
                                        transform:
                                            "translateY(-50%)",
                                        opacity:
                                            0.55,
                                        zIndex:
                                            2,
                                    }}
                                />

                                <input
                                    type="search"
                                    className="form-control rems-form-control ps-5"
                                    placeholder="Search facility, event, date, or status..."
                                    value={
                                        search
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSearch(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>

                        </div>


                        {/* Status */}

                        <div className="col-12 col-md-6 col-xl-3">

                            <label className="rems-form-label">
                                Status
                            </label>

                            <select
                                className="form-select rems-form-control"
                                value={
                                    statusFilter
                                }
                                onChange={(
                                    event
                                ) =>
                                    setStatusFilter(
                                        event.target.value
                                    )
                                }
                            >

                                {statusOptions.map(
                                    (
                                        option
                                    ) => (
                                        <option
                                            key={
                                                option.value
                                            }
                                            value={
                                                option.value
                                            }
                                        >
                                            {
                                                option.label
                                            }
                                        </option>
                                    )
                                )}

                            </select>

                        </div>


                        {/* Date */}

                        <div className="col-12 col-md-6 col-xl-3">

                            <label className="rems-form-label">
                                Date
                            </label>

                            <select
                                className="form-select rems-form-control"
                                value={
                                    dateFilter
                                }
                                onChange={(
                                    event
                                ) =>
                                    setDateFilter(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="ALL">
                                    All dates
                                </option>

                                <option value="TODAY">
                                    Today
                                </option>

                                <option value="UPCOMING">
                                    Upcoming
                                </option>

                                <option value="PAST">
                                    Past
                                </option>

                            </select>

                        </div>


                        {/* Clear */}

                        <div className="col-12 col-xl-1">

                            <button
                                type="button"
                                className="rems-secondary-button w-100"
                                onClick={
                                    clearFilters
                                }
                                disabled={
                                    !hasFilters
                                }
                                title="Clear filters"
                            >
                                <BsFilter />
                            </button>

                        </div>

                    </div>


                    {/* Filter summary */}

                    {hasFilters && (
                        <div className="small mt-3">

                            Showing{" "}
                            <strong>
                                {
                                    filteredBookings.length
                                }
                            </strong>
                            of{" "}
                            <strong>
                                {
                                    bookings.length
                                }</strong>
                            
                            booking
                            {bookings.length ===
                            1
                                ? ""
                                : "s"}.

                        </div>
                    )}

                </div>

            </div>


            {/* =================================================
                BOOKING TABLE
            ================================================= */}

            <div className="rems-glass-card">

                <div className="rems-card-header">

                    <div>

                        <div className="rems-card-title">
                            Reservation Registry
                        </div>

                        <div className="rems-card-subtitle">
                            Open any reservation to view
                            its complete workflow.
                        </div>

                    </div>

                </div>


                {loading ? (

                    <div className="rems-loading-state">

                        <div className="spinner-border" />

                        <div className="mt-3">
                            Loading bookings...
                        </div>

                    </div>

                ) : noBookings ? (

                    <div className="rems-empty-state">

                        <div className="rems-empty-icon">
                            <BsCalendar3 />
                        </div>

                        <div className="rems-empty-title">
                            No facility bookings
                        </div>

                        <div className="rems-empty-text">
                            You have not created any
                            facility reservations yet.
                        </div>

                        <button
                            type="button"
                            className="rems-primary-button mt-3"
                            onClick={() =>
                                navigate(
                                    `${portalPrefix}/facilities`
                                )
                            }
                        >
                            <BsCalendar3 />

                            Browse Facilities
                        </button>

                    </div>

                ) : noResults ? (

                    <div className="rems-empty-state">

                        <div className="rems-empty-icon">
                            <BsSearch />
                        </div>

                        <div className="rems-empty-title">
                            No matching bookings
                        </div>

                        <div className="rems-empty-text">
                            No reservation matches the
                            current search or filters.
                        </div>

                        <button
                            type="button"
                            className="rems-secondary-button mt-3"
                            onClick={
                                clearFilters
                            }
                        >
                            Clear Filters
                        </button>

                    </div>

                ) : (

                    <div className="rems-table-wrapper">

                        <table className="table rems-table align-middle mb-0">

                            <thead>

                                <tr>

                                    <th>
                                        Facility
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Time
                                    </th>

                                    <th>
                                        Guests
                                    </th>

                                    <th>
                                        Amount
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th className="text-end">
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredBookings.map(
                                    (
                                        booking
                                    ) => {

                                        const remaining =
                                            booking.pencilRemainingSeconds;

                                        const pencilActive =
                                            booking.rawStatus ===
                                                "PENCIL" &&
                                            remaining !==
                                                null &&
                                            remaining >
                                                0;

                                        const pencilExpired =
                                            booking.pencilExpired;

                                        const cancellable =
                                            CANCELLABLE_STATUSES.includes(
                                                booking.rawStatus
                                            ) &&
                                            !pencilExpired;

                                        const processing =
                                            processingId ===
                                            booking.id;

                                        return (
                                            <tr
                                                key={
                                                    booking.id
                                                }
                                            >

                                                {/* =================================================
                                                    FACILITY
                                                ================================================= */}

                                                <td data-label="Facility">

                                                    <div className="rems-table-primary">
                                                        {
                                                            getBookingFacilityName(
                                                                booking
                                                            )
                                                        }
                                                    </div>

                                                    <div className="rems-table-secondary">

                                                        {
                                                            getBookingEventType(
                                                                booking
                                                            )
                                                        }

                                                    </div>

                                                </td>


                                                {/* =================================================
                                                    DATE
                                                ================================================= */}

                                                <td data-label="Date">

                                                    <div className="rems-table-primary">

                                                        {
                                                            booking.booking_date ||
                                                            "—"
                                                        }

                                                    </div>

                                                </td>


                                                {/* =================================================
                                                    TIME
                                                ================================================= */}

                                                <td data-label="Time">

                                                    <div className="rems-table-primary">

                                                        {
                                                            booking.start_time ||
                                                            "—"
                                                        }

                                                        {" — "}

                                                        {
                                                            booking.end_time ||
                                                            "—"
                                                        }

                                                    </div>

                                                    <div className="rems-table-secondary">

                                                        {
                                                            formatDuration(
                                                                booking.start_time,
                                                                booking.end_time
                                                            )
                                                        }

                                                    </div>

                                                </td>


                                                {/* =================================================
                                                    GUESTS
                                                ================================================= */}

                                                <td data-label="Guests">

                                                    <div className="d-flex align-items-center gap-2">

                                                        <BsPeople />

                                                        <span>
                                                            {
                                                                getBookingGuestCount(
                                                                    booking
                                                                )
                                                            }
                                                        </span>

                                                    </div>

                                                </td>


                                                {/* =================================================
                                                    AMOUNT
                                                ================================================= */}

                                                <td data-label="Amount">

                                                    <div className="rems-table-primary">

                                                        {
                                                            formatMoney(
                                                                getBookingTotal(
                                                                    booking
                                                                )
                                                            )
                                                        }

                                                    </div>

                                                    {booking?.payment_verified && (
                                                        <div
                                                            className="small d-flex align-items-center gap-1 mt-1"
                                                            style={{
                                                                opacity:
                                                                    0.75,
                                                            }}
                                                        >

                                                            <BsCreditCard />

                                                            Payment verified

                                                        </div>
                                                    )}

                                                </td>


                                                {/* =================================================
                                                    STATUS
                                                ================================================= */}

                                                <td data-label="Status">

                                                    <div>

                                                        <span
                                                            className={`rems-status-badge ${getStatusClass(
                                                                booking.effectiveStatus
                                                            )}`}
                                                        >

                                                            <span className="rems-status-dot" />

                                                            {
                                                                getStatusLabel(
                                                                    booking
                                                                )
                                                            }

                                                        </span>

                                                    </div>


                                                    {/* PENCIL countdown */}

                                                    {pencilActive && (
                                                        <div
                                                            className="small mt-2 d-flex align-items-center gap-1"
                                                            style={{
                                                                fontWeight:
                                                                    600,
                                                            }}
                                                        >

                                                            <BsClockHistory />

                                                            Hold:{" "}
                                                            {
                                                                formatHoldTime(
                                                                    remaining
                                                                )
                                                            }

                                                        </div>
                                                    )}


                                                    {/* Expired hold */}

                                                    {pencilExpired && (
                                                        <div
                                                            className="small mt-2 d-flex align-items-center gap-1"
                                                            style={{
                                                                opacity:
                                                                    0.8,
                                                            }}
                                                        >

                                                            <BsXCircle />

                                                            Hold expired

                                                        </div>
                                                    )}


                                                    {/* Approved/security information */}

                                                    {booking.rawStatus ===
                                                        "APPROVED" &&
                                                        booking.security_clearance_completed && (
                                                            <div
                                                                className="small mt-2 d-flex align-items-center gap-1"
                                                                style={{
                                                                    opacity:
                                                                        0.8,
                                                                }}
                                                            >

                                                                <BsShieldCheck />

                                                                Security cleared

                                                            </div>
                                                        )}

                                                </td>


                                                {/* =================================================
                                                    ACTIONS
                                                ================================================= */}

                                                <td
                                                    data-label="Actions"
                                                    className="text-end"
                                                >

                                                    <div className="d-flex justify-content-end align-items-center gap-1">

                                                        {/* Continue / View */}

                                                        <button
                                                            type="button"
                                                            className="rems-icon-button"
                                                            title={
                                                                pencilActive
                                                                    ? "Continue reservation"
                                                                    : "View booking"
                                                            }
                                                            onClick={() =>
                                                                openBooking(
                                                                    booking
                                                                )
                                                            }
                                                        >

                                                            {pencilActive ? (
                                                                <BsChevronRight />
                                                            ) : (
                                                                <BsChevronRight />
                                                            )}

                                                        </button>


                                                        {/* Cancel */}

                                                        {cancellable && (
                                                            <button
                                                                type="button"
                                                                className="rems-icon-button rems-action-danger"
                                                                title="Cancel booking"
                                                                onClick={() =>
                                                                    cancelBooking(
                                                                        booking
                                                                    )
                                                                }
                                                                disabled={
                                                                    processing
                                                                }
                                                            >

                                                                {processing ? (
                                                                    <span
                                                                        className="spinner-border spinner-border-sm"
                                                                        style={{
                                                                            width:
                                                                                "0.9rem",
                                                                            height:
                                                                                "0.9rem",
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <BsXCircle />
                                                                )}

                                                            </button>
                                                        )}

                                                    </div>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* =================================================
                WORKFLOW SUMMARY
            ================================================= */}

            {bookings.length >
                0 && (
                <div className="rems-glass-card mt-4">

                    <div className="rems-card-header">

                        <div>

                            <div className="rems-card-title">
                                Booking Workflow
                            </div>

                            <div className="rems-card-subtitle">
                                Your reservation progresses through
                                the following stages.
                            </div>

                        </div>

                    </div>


                    <div className="p-3 p-md-4">

                        <div className="row g-3">

                            <div className="col-12 col-md-4 col-xl-2">

                                <div className="text-center p-3">

                                    <div className="rems-stat-icon mx-auto mb-2">
                                        <BsClockHistory />
                                    </div>

                                    <div className="fw-semibold">
                                        Pencil Hold
                                    </div>

                                    <div className="small mt-1">
                                        30-minute temporary reservation
                                    </div>

                                </div>

                            </div>


                            <div className="col-12 col-md-4 col-xl-2">

                                <div className="text-center p-3">

                                    <div className="rems-stat-icon mx-auto mb-2">
                                        <BsCalendar3 />
                                    </div>

                                    <div className="fw-semibold">
                                        Pending
                                    </div>

                                    <div className="small mt-1">
                                        Reservation submitted
                                    </div>

                                </div>

                            </div>


                            <div className="col-12 col-md-4 col-xl-2">

                                <div className="text-center p-3">

                                    <div className="rems-stat-icon mx-auto mb-2">
                                        <BsCheck2Circle />
                                    </div>

                                    <div className="fw-semibold">
                                        Approved
                                    </div>

                                    <div className="small mt-1">
                                        Administrative approval
                                    </div>

                                </div>

                            </div>


                            <div className="col-12 col-md-4 col-xl-2">

                                <div className="text-center p-3">

                                    <div className="rems-stat-icon mx-auto mb-2">
                                        <BsPeople />
                                    </div>

                                    <div className="fw-semibold">
                                        In Use
                                    </div>

                                    <div className="small mt-1">
                                        Facility usage
                                    </div>

                                </div>

                            </div>


                            <div className="col-12 col-md-4 col-xl-2">

                                <div className="text-center p-3">

                                    <div className="rems-stat-icon mx-auto mb-2">
                                        <BsShieldCheck />
                                    </div>

                                    <div className="fw-semibold">
                                        Inspection
                                    </div>

                                    <div className="small mt-1">
                                        Post-use inspection
                                    </div>

                                </div>

                            </div>


                            <div className="col-12 col-md-4 col-xl-2">

                                <div className="text-center p-3">

                                    <div className="rems-stat-icon mx-auto mb-2">
                                        <BsCreditCard />
                                    </div>

                                    <div className="fw-semibold">
                                        Closure
                                    </div>

                                    <div className="small mt-1">
                                        Refund and final closure
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}