import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsCheck2Circle,
    BsClockHistory,
    BsEye,
    BsFileEarmarkSpreadsheet,
    BsLock,
    BsPeople,
    BsPersonCheck,
    BsShieldCheck,
    BsXCircle,
    BsExclamationTriangle,
    BsCashStack,
    BsClipboardCheck,
} from "react-icons/bs";

import {
    getFacilityBookings,
    getBookingGuests,
    getBookingPayments,
    approveFacilityBooking,
    rejectFacilityBooking,
    startFacilityUse,
    completeFacilityBooking,
    completeFacilitySecurityClearance,
    inspectFacilityBooking,
    refundFacilityDeposit,
    verifyBookingPayment,
} from "../../api/facilities";


/* ============================================================
   HELPERS
============================================================ */

const normalize = (response) => {
    if (Array.isArray(response)) {
        return response;
    }

    return response?.results || [];
};


const normalizeStatus = (value) => {
    return String(value || "")
        .trim()
        .toUpperCase();
};


const money = (value) => {
    const amount = Number(value || 0);

    if (!Number.isFinite(amount)) {
        return "0.00";
    }

    return amount.toLocaleString(
        undefined,
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    );
};


const formatDateTime = (value) => {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString();
};


const getErrorMessage = (
    error,
    fallback = "Unable to complete the request."
) => {
    const data = error?.response?.data;

    if (typeof data === "string") {
        return data;
    }

    if (data?.detail) {
        return String(data.detail);
    }

    if (data?.message) {
        return String(data.message);
    }

    if (data && typeof data === "object") {
        const preferredFields = [
            "booking",
            "guest",
            "full_name",
            "vehicle_plate_number",
            "vehicle_model",
            "payment",
            "amount",
            "reference_number",
            "proof",
            "result",
            "notes",
            "deduction_amount",
        ];

        for (const field of preferredFields) {
            const value = data?.[field];

            if (
                Array.isArray(value) &&
                value.length > 0
            ) {
                return String(value[0]);
            }

            if (
                typeof value === "string" &&
                value.trim()
            ) {
                return value;
            }
        }

        const firstError =
            Object.values(data)
                .flat()
                .find(
                    (value) =>
                        value !== null &&
                        value !== undefined &&
                        String(value).trim()
                );

        if (firstError) {
            return String(firstError);
        }
    }

    if (error?.message) {
        return String(error.message);
    }

    return fallback;
};


const getStatusClass = (value) => {
    switch (
        normalizeStatus(value)
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

        case "REJECTED":
            return "rems-status-danger";

        case "CANCELLED":
            return "rems-status-danger";

        case "EXPIRED":
            return "rems-status-secondary";

        default:
            return "rems-status-secondary";
    }
};


const statusLabel = (value) => {
    const normalized =
        normalizeStatus(value);

    const labels = {
        PENCIL: "Pencil",
        PENDING: "Pending Approval",
        APPROVED: "Approved",
        IN_USE: "In Use",
        INSPECTION_PENDING: "Inspection Pending",
        REFUND_PENDING: "Refund Pending",
        CLOSED: "Closed",
        REJECTED: "Rejected",
        CANCELLED: "Cancelled",
        EXPIRED: "Expired",
    };

    return (
        labels[normalized] ||
        value ||
        "—"
    );
};


const isBookingOverdue = (booking) => {
    if (!booking) {
        return false;
    }

    if (
        !booking.booking_date ||
        !booking.end_time
    ) {
        return false;
    }

    const end = new Date(
        `${booking.booking_date}T${booking.end_time}`
    );

    if (
        Number.isNaN(
            end.getTime()
        )
    ) {
        return false;
    }

    return (
        Date.now() >
        end.getTime()
    );
};


/* ============================================================
   COMPONENT
============================================================ */

export default function FacilityBookings() {

    /* ========================================================
       BOOKING COLLECTION
    ======================================================== */

    const [
        bookings,
        setBookings,
    ] = useState([]);


    /* ========================================================
       PAGE STATE
    ======================================================== */

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
        selected,
        setSelected,
    ] = useState(null);


    const [
        processingId,
        setProcessingId,
    ] = useState(null);


    const [
        search,
        setSearch,
    ] = useState("");


    const [
        statusFilter,
        setStatusFilter,
    ] = useState("ALL");


    const errorRef =
        useRef(null);


    /* ========================================================
       INSPECTION FORM
    ======================================================== */

    const [
        inspection,
        setInspection,
    ] = useState({
        result: "PASSED",
        notes: "",
        deduction_amount: "0",
    });


    /* ========================================================
       LOAD BOOKINGS
    ======================================================== */

    const loadBookings =
        useCallback(
            async (
                refresh = false
            ) => {
                if (refresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                try {
                    const response =
                        await getFacilityBookings();

                    const rows =
                        normalize(
                            response
                        );

                    setBookings(
                        rows
                    );

                    /*
                     * Keep the selected booking synchronized
                     * with the latest server response.
                     */
                    if (
                        selected?.id
                    ) {
                        const updated =
                            rows.find(
                                (item) =>
                                    String(
                                        item.id
                                    ) ===
                                    String(
                                        selected.id
                                    )
                            );

                        if (
                            updated
                        ) {
                            setSelected(
                                updated
                            );
                        }
                    }
                } catch (err) {
                    console.error(
                        "[Admin Facility Bookings] Load:",
                        err
                    );

                    setError(
                        getErrorMessage(
                            err,
                            "Unable to load facility bookings."
                        )
                    );
                } finally {
                    setLoading(false);
                    setRefreshing(false);
                }
            },
            [
                selected?.id,
            ]
        );


    /* ========================================================
       INITIAL LOAD
    ======================================================== */

    useEffect(
        () => {
            loadBookings();
        },
        [
            loadBookings,
        ]
    );


    /* ========================================================
       AUTO REFRESH
       Keeps admin status current without requiring a manual
       refresh, especially when a Pencil booking expires.
    ======================================================== */

    useEffect(
        () => {
            const interval =
                window.setInterval(
                    () => {
                        loadBookings(
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
            loadBookings,
        ]
    );


    /* ========================================================
       AUTO-SCROLL ERROR
    ======================================================== */

    useEffect(
        () => {
            if (!error) {
                return undefined;
            }

            const timer =
                window.setTimeout(
                    () => {
                        errorRef.current?.scrollIntoView(
                            {
                                behavior: "smooth",
                                block: "center",
                            }
                        );
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


    /* ========================================================
       REFRESH SELECTED BOOKING
    ======================================================== */

    const refreshSelected =
        async () => {
            if (
                !selected?.id
            ) {
                return;
            }

            setError("");

            try {
                const [
                    bookingsResponse,
                    guestsResponse,
                    paymentsResponse,
                ] = await Promise.all([
                    getFacilityBookings(),
                    getBookingGuests(
                        selected.id
                    ),
                    getBookingPayments(
                        selected.id
                    ),
                ]);

                const rows =
                    normalize(
                        bookingsResponse
                    );

                setBookings(
                    rows
                );

                const updated =
                    rows.find(
                        (item) =>
                            String(
                                item.id
                            ) ===
                            String(
                                selected.id
                            )
                    );

                if (!updated) {
                    setSelected(
                        null
                    );

                    return;
                }

                const bookingId =
                    String(
                        updated.id
                    );

                const guests =
                    normalize(
                        guestsResponse
                    ).filter(
                        (item) =>
                            String(
                                item?.booking
                            ) ===
                            bookingId
                    );

                const payments =
                    normalize(
                        paymentsResponse
                    ).filter(
                        (item) =>
                            String(
                                item?.booking
                            ) ===
                            bookingId
                    );

                setSelected({
                    ...updated,
                    guests,
                    payments,
                });
            } catch (err) {
                console.error(
                    "[Admin Facility Bookings] Refresh selected:",
                    err
                );

                setError(
                    getErrorMessage(
                        err,
                        "Unable to refresh booking details."
                    )
                );
            }
        };


    /* ========================================================
       OPEN BOOKING
    ======================================================== */

    const openBooking =
        async (
            booking
        ) => {
            setError("");

            /*
             * Clear previous booking details first.
             *
             * This prevents guests/payments from booking A
             * appearing while booking B is being loaded.
             */
            setSelected({
                ...booking,
                guests: [],
                payments: [],
            });

            setInspection({
                result: "PASSED",
                notes: "",
                deduction_amount: "0",
            });

            try {
                const [
                    guestsResponse,
                    paymentsResponse,
                ] = await Promise.all([
                    getBookingGuests(
                        booking.id
                    ),
                    getBookingPayments(
                        booking.id
                    ),
                ]);

                const bookingId =
                    String(
                        booking.id
                    );

                const guests =
                    normalize(
                        guestsResponse
                    ).filter(
                        (item) =>
                            String(
                                item?.booking
                            ) ===
                            bookingId
                    );

                const payments =
                    normalize(
                        paymentsResponse
                    ).filter(
                        (item) =>
                            String(
                                item?.booking
                            ) ===
                            bookingId
                    );

                setSelected(
                    {
                        ...booking,
                        guests,
                        payments,
                    }
                );
            } catch (err) {
                console.error(
                    "[Admin Facility Bookings] Open booking:",
                    err
                );

                setError(
                    getErrorMessage(
                        err,
                        "Unable to load booking details."
                    )
                );
            }
        };


    /* ========================================================
       GENERIC ACTION
    ======================================================== */

    const runAction =
        async (
            id,
            action,
            payload,
            keepSelected = false
        ) => {
            if (
                processingId
            ) {
                return;
            }

            setProcessingId(
                id
            );

            setError("");

            try {
                const updated =
                    await action(
                        id,
                        payload
                    );

                if (
                    keepSelected &&
                    updated
                ) {
                    setSelected(
                        updated
                    );
                }

                await loadBookings(
                    true
                );

                if (
                    keepSelected
                ) {
                    await refreshSelected();
                } else {
                    setSelected(
                        null
                    );
                }
            } catch (err) {
                console.error(
                    "[Admin Facility Booking] Action:",
                    err
                );

                setError(
                    getErrorMessage(
                        err,
                        "Unable to complete the action."
                    )
                );
            } finally {
                setProcessingId(
                    null
                );
            }
        };


    /* ========================================================
       APPROVE PAYMENT
    ======================================================== */

    const approvePayment =
        async (
            payment
        ) => {
            if (
                !selected?.id ||
                !payment?.id
            ) {
                return;
            }

            setProcessingId(
                selected.id
            );

            setError("");

            try {
                await verifyBookingPayment(
                    payment.id
                );

                await loadBookings(
                    true
                );

                await refreshSelected();
            } catch (err) {
                console.error(
                    "[Admin Facility Bookings] Payment verification:",
                    err
                );

                setError(
                    getErrorMessage(
                        err,
                        "Unable to verify payment."
                    )
                );
            } finally {
                setProcessingId(
                    null
                );
            }
        };


    /* ========================================================
       SECURITY CLEARANCE
    ======================================================== */

    const completeSecurityClearance =
        async () => {
            if (
                !selected?.id
            ) {
                return;
            }

            const selectedStatus =
                normalizeStatus(
                    selected.status
                );

            if (
                selectedStatus !==
                "APPROVED"
            ) {
                setError(
                    "Security clearance can only be completed after the booking has been approved."
                );

                return;
            }

            if (
                selected.security_clearance_completed
            ) {
                setError(
                    "Security clearance has already been completed for this booking."
                );

                return;
            }

            /*
             * Do not block security clearance based on the
             * scheduled booking end time in the frontend.
             * The backend is authoritative for this action
             * and will enforce all actual clearance rules.
             */
            await runAction(
                selected.id,
                completeFacilitySecurityClearance,
                undefined,
                true
            );
        };


    /* ========================================================
       INSPECTION
    ======================================================== */

    const inspect =
        async () => {
            if (
                !selected?.id
            ) {
                return;
            }

            const deduction =
                Number(
                    inspection.deduction_amount ||
                    0
                );

            if (
                !Number.isFinite(
                    deduction
                ) ||
                deduction < 0
            ) {
                setError(
                    "Inspection deduction must be a valid non-negative amount."
                );

                return;
            }

            await runAction(
                selected.id,
                inspectFacilityBooking,
                {
                    result:
                        inspection.result,

                    notes:
                        String(
                            inspection.notes ||
                            ""
                        ).trim(),

                    deduction_amount:
                        deduction,
                },
                true
            );

            setInspection({
                result: "PASSED",
                notes: "",
                deduction_amount: "0",
            });
        };


    /* ========================================================
       FILTERED BOOKINGS
    ======================================================== */

    const filteredBookings =
        useMemo(
            () => {
                const query =
                    String(
                        search ||
                        ""
                    )
                        .trim()
                        .toLowerCase();

                const selectedStatus =
                    normalizeStatus(
                        statusFilter
                    );

                return bookings.filter(
                    (booking) => {
                        const bookingStatus =
                            normalizeStatus(
                                booking?.status
                            );

                        if (
                            selectedStatus !==
                                "ALL" &&
                            bookingStatus !==
                                selectedStatus
                        ) {
                            return false;
                        }

                        if (!query) {
                            return true;
                        }

                        const searchable =
                            [
                                booking?.id,
                                booking?.resident_name,
                                booking?.facility_name,
                                booking?.booking_date,
                                booking?.start_time,
                                booking?.end_time,
                                booking?.event_type,
                                booking?.event_type_display,
                                booking?.event_description,
                                bookingStatus,
                            ]
                                .filter(Boolean)
                                .join(" ")
                                .toLowerCase();

                        return searchable.includes(
                            query
                        );
                    }
                );
            },
            [
                bookings,
                search,
                statusFilter,
            ]
        );


    /* ========================================================
       STATISTICS
    ======================================================== */

    const stats =
        useMemo(
            () => {
                const rows =
                    bookings.map(
                        (booking) => ({
                            ...booking,
                            status:
                                normalizeStatus(
                                    booking?.status
                                ),
                        })
                    );

                return {
                    pencil:
                        rows.filter(
                            (item) =>
                                item.status ===
                                "PENCIL"
                        ).length,

                    pending:
                        rows.filter(
                            (item) =>
                                item.status ===
                                "PENDING"
                        ).length,

                    approved:
                        rows.filter(
                            (item) =>
                                item.status ===
                                "APPROVED"
                        ).length,

                    inUse:
                        rows.filter(
                            (item) =>
                                item.status ===
                                "IN_USE"
                        ).length,

                    inspection:
                        rows.filter(
                            (item) =>
                                item.status ===
                                "INSPECTION_PENDING"
                        ).length,

                    refunds:
                        rows.filter(
                            (item) =>
                                item.status ===
                                "REFUND_PENDING"
                        ).length,

                    closed:
                        rows.filter(
                            (item) =>
                                item.status ===
                                "CLOSED"
                        ).length,

                    rejected:
                        rows.filter(
                            (item) =>
                                item.status ===
                                "REJECTED"
                        ).length,

                    cancelled:
                        rows.filter(
                            (item) =>
                                item.status ===
                                "CANCELLED"
                        ).length,
                };
            },
            [
                bookings,
            ]
        );


    /* ========================================================
       SELECTED DERIVED DATA
    ======================================================== */

    const selectedStatus =
        normalizeStatus(
            selected?.status
        );


    const selectedGuests =
        Array.isArray(
            selected?.guests
        )
            ? selected.guests
            : [];


    const selectedPayments =
        Array.isArray(
            selected?.payments
        )
            ? selected.payments
            : [];


    const bookingTotalPayments =
        selectedPayments.filter(
            (payment) =>
                normalizeStatus(
                    payment?.payment_type
                ) ===
                "BOOKING_TOTAL"
        );


    const latestBookingPayment =
        bookingTotalPayments.length > 0
            ? bookingTotalPayments[
                bookingTotalPayments.length - 1
            ]
            : null;


    const verifiedBookingPayment =
        bookingTotalPayments.find(
            (payment) =>
                normalizeStatus(
                    payment?.status
                ) ===
                "VERIFIED"
        );


    const pendingBookingPayment =
        bookingTotalPayments.find(
            (payment) =>
                normalizeStatus(
                    payment?.status
                ) ===
                "PENDING"
        );


    const totalDue =
        Number(
            selected?.total_amount_due ||
            0
        );


    const verifiedAmount =
        bookingTotalPayments
            .filter(
                (payment) =>
                    normalizeStatus(
                        payment?.status
                    ) ===
                    "VERIFIED"
            )
            .reduce(
                (
                    total,
                    payment
                ) =>
                    total +
                    Number(
                        payment?.amount ||
                        0
                    ),
                0
            );


    const guestLimit =
        Number(
            selected?.estimated_guests ||
            0
        );


    const guestCount =
        selectedGuests.length;


    const securityCleared =
        Boolean(
            selected?.security_clearance_completed
        );


    const processingSelected =
        processingId ===
        selected?.id;


    /* ========================================================
       APPROVAL READINESS
    ======================================================== */

    const approvalIssues =
        useMemo(
            () => {
                if (
                    selectedStatus !==
                    "PENDING"
                ) {
                    return [];
                }

                const issues = [];

                if (
                    totalDue > 0 &&
                    !verifiedBookingPayment
                ) {
                    if (
                        pendingBookingPayment
                    ) {
                        issues.push(
                            "Full booking payment is submitted but has not yet been verified."
                        );
                    } else {
                        issues.push(
                            "Full booking payment must be verified before approval."
                        );
                    }
                }

                if (
                    guestCount <= 0
                ) {
                    issues.push(
                        "A guest list is required before approval."
                    );
                }

                if (
                    guestLimit > 0 &&
                    guestCount >
                    guestLimit
                ) {
                    issues.push(
                        "The guest list exceeds the booking guest limit."
                    );
                }

                return issues;
            },
            [
                selectedStatus,
                totalDue,
                verifiedBookingPayment,
                pendingBookingPayment,
                guestCount,
                guestLimit,
            ]
        );


    const canApprove =
        selectedStatus ===
            "PENDING" &&
        approvalIssues.length ===
            0 &&
        !securityCleared;


    /* ========================================================
       RENDER
    ======================================================== */

    return (
        <div className="rems-page-content">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="rems-page-header">

                <div>
                    <div className="rems-page-eyebrow">
                        ADMINISTRATION
                    </div>

                    <h1 className="rems-page-title">
                        Facility Bookings
                    </h1>

                    <p className="rems-page-description">
                        Review resident facility reservations,
                        verify payments, review guest lists,
                        complete security clearance, manage facility
                        use, inspections, and security-deposit refunds.
                    </p>
                </div>


                <button
                    type="button"
                    className="rems-secondary-button"
                    onClick={() =>
                        loadBookings(true)
                    }
                    disabled={
                        refreshing ||
                        Boolean(processingId)
                    }
                >
                    <BsArrowClockwise />

                    {refreshing
                        ? "Refreshing..."
                        : "Refresh"}
                </button>

            </div>


            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
                <div
                    ref={errorRef}
                    tabIndex={-1}
                    className="alert alert-danger rems-alert mb-4"
                    role="alert"
                    style={{
                        outline: "none",
                        scrollMarginTop: "24px",
                    }}
                >
                    <div className="d-flex align-items-start gap-2">

                        <BsExclamationTriangle className="mt-1 flex-shrink-0" />

                        <div className="flex-grow-1">
                            <div className="fw-semibold">
                                Facility Booking Error
                            </div>

                            <div className="small mt-1">
                                {error}
                            </div>
                        </div>

                        <button
                            type="button"
                            className="btn-close"
                            aria-label="Close"
                            onClick={() =>
                                setError("")
                            }
                        />

                    </div>
                </div>
            )}


            {/* ==================================================
                STATISTICS
            ================================================== */}

            <div className="row g-3 mb-4">

                {[
                    [
                        "Pencil Holds",
                        stats.pencil,
                    ],
                    [
                        "Pending Approval",
                        stats.pending,
                    ],
                    [
                        "Approved",
                        stats.approved,
                    ],
                    [
                        "In Use",
                        stats.inUse,
                    ],
                    [
                        "Inspection Pending",
                        stats.inspection,
                    ],
                    [
                        "Refund Pending",
                        stats.refunds,
                    ],
                ].map(
                    ([
                        label,
                        value,
                    ]) => (
                        <div
                            className="col-6 col-md-4 col-xl-2"
                            key={label}
                        >
                            <div className="rems-stat-card h-100">

                                <div className="rems-stat-content">

                                    <div className="rems-stat-label">
                                        {label}
                                    </div>

                                    <div className="rems-stat-value">
                                        {value}
                                    </div>

                                </div>

                            </div>
                        </div>
                    )
                )}

            </div>


            {/* ==================================================
                FILTER BAR
            ================================================== */}

            <div className="rems-glass-card mb-3">

                <div className="p-3">

                    <div className="row g-2">

                        <div className="col-12 col-lg-8">

                            <label className="rems-form-label">
                                Search Bookings
                            </label>

                            <input
                                type="search"
                                className="form-control rems-form-control"
                                placeholder="Search resident, facility, booking date, event, or status..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                            />

                        </div>


                        <div className="col-12 col-lg-4">

                            <label className="rems-form-label">
                                Status
                            </label>

                            <select
                                className="form-select rems-form-control"
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="ALL">
                                    All Statuses
                                </option>

                                <option value="PENCIL">
                                    Pencil
                                </option>

                                <option value="PENDING">
                                    Pending Approval
                                </option>

                                <option value="APPROVED">
                                    Approved
                                </option>

                                <option value="IN_USE">
                                    In Use
                                </option>

                                <option value="INSPECTION_PENDING">
                                    Inspection Pending
                                </option>

                                <option value="REFUND_PENDING">
                                    Refund Pending
                                </option>

                                <option value="CLOSED">
                                    Closed
                                </option>

                                <option value="REJECTED">
                                    Rejected
                                </option>

                                <option value="CANCELLED">
                                    Cancelled
                                </option>
                            </select>

                        </div>

                    </div>

                </div>

            </div>


            {/* ==================================================
                BOOKING TABLE
            ================================================== */}

            <div className="rems-glass-card">

                {loading ? (

                    <div className="rems-loading-state">

                        <div
                            className="spinner-border"
                            role="status"
                        />

                        <div className="mt-3">
                            Loading facility bookings...
                        </div>

                    </div>

                ) : filteredBookings.length === 0 ? (

                    <div className="rems-empty-state py-5">

                        <div className="rems-empty-icon">
                            <BsClipboardCheck />
                        </div>

                        <div className="rems-empty-title">
                            No facility bookings found
                        </div>

                        <div className="rems-empty-text">
                            No bookings match the current
                            search or status filter.
                        </div>

                    </div>

                ) : (

                    <div className="rems-table-wrapper">

                        <table className="table rems-table align-middle mb-0">

                            <thead>

                                <tr>
                                    <th>Resident</th>
                                    <th>Facility</th>
                                    <th>Schedule</th>
                                    <th>Guests</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th className="text-end">
                                        Actions
                                    </th>
                                </tr>

                            </thead>


                            <tbody>

                                {filteredBookings.map(
                                    (booking) => {

                                        const bookingStatus =
                                            normalizeStatus(
                                                booking?.status
                                            );

                                        const bookingPaymentStatus =
                                            booking?.payment_verified
                                                ? "VERIFIED"
                                                : booking?.payment_submitted
                                                    ? "PENDING"
                                                    : "NOT_SUBMITTED";

                                        return (
                                            <tr
                                                key={
                                                    booking.id
                                                }
                                            >

                                                {/* RESIDENT */}

                                                <td data-label="Resident">

                                                    <div className="rems-table-primary">
                                                        {booking.resident_name ||
                                                            "Unknown Resident"}
                                                    </div>

                                                    <div className="rems-table-secondary">
                                                        Booking #
                                                        {booking.id}
                                                    </div>

                                                </td>


                                                {/* FACILITY */}

                                                <td data-label="Facility">

                                                    <div className="rems-table-primary">
                                                        {booking.facility_name ||
                                                            "—"}
                                                    </div>

                                                    <div className="rems-table-secondary">
                                                        {booking.event_type_display ||
                                                            booking.event_type ||
                                                            "Facility Booking"}
                                                    </div>

                                                </td>


                                                {/* SCHEDULE */}

                                                <td data-label="Schedule">

                                                    <div className="rems-table-primary">
                                                        {booking.booking_date ||
                                                            "—"}
                                                    </div>

                                                    <div className="rems-table-secondary">
                                                        {booking.start_time ||
                                                            "—"}

                                                        {" — "}

                                                        {booking.end_time ||
                                                            "—"}
                                                    </div>

                                                </td>


                                                {/* GUESTS */}

                                                <td data-label="Guests">

                                                    <div className="rems-table-primary">
                                                        {booking.guest_count ??
                                                            booking.estimated_guests ??
                                                            0}
                                                    </div>

                                                    <div className="rems-table-secondary">
                                                        /
                                                        {" "}
                                                        {booking.estimated_guests ||
                                                            0}
                                                    </div>

                                                </td>


                                                {/* PAYMENT */}

                                                <td data-label="Payment">

                                                    {bookingPaymentStatus ===
                                                    "VERIFIED" ? (

                                                        <span className="rems-status-badge rems-status-success">
                                                            <span className="rems-status-dot" />
                                                            Verified
                                                        </span>

                                                    ) : bookingPaymentStatus ===
                                                    "PENDING" ? (

                                                        <span className="rems-status-badge rems-status-warning">
                                                            <span className="rems-status-dot" />
                                                            Pending
                                                        </span>

                                                    ) : (

                                                        <span className="rems-status-badge rems-status-secondary">
                                                            <span className="rems-status-dot" />
                                                            Not Submitted
                                                        </span>

                                                    )}

                                                </td>


                                                {/* STATUS */}

                                                <td data-label="Status">

                                                    <span
                                                        className={`rems-status-badge ${getStatusClass(
                                                            bookingStatus
                                                        )}`}
                                                    >
                                                        <span className="rems-status-dot" />

                                                        {statusLabel(
                                                            booking.status_display ||
                                                            bookingStatus
                                                        )}
                                                    </span>

                                                </td>


                                                {/* ACTIONS */}

                                                <td data-label="Actions">

                                                    <div className="d-flex justify-content-end gap-1">

                                                        <button
                                                            type="button"
                                                            className="rems-icon-button"
                                                            title="Review Booking"
                                                            onClick={() =>
                                                                openBooking(
                                                                    booking
                                                                )
                                                            }
                                                        >
                                                            <BsEye />
                                                        </button>


                                                        {bookingStatus ===
                                                            "PENDING" && (
                                                            <button
                                                                type="button"
                                                                className="rems-icon-button"
                                                                title="Approve"
                                                                onClick={() =>
                                                                    openBooking(
                                                                        booking
                                                                    )
                                                                }
                                                            >
                                                                <BsCheck2Circle />
                                                            </button>
                                                        )}


                                                        {[
                                                            "PENCIL",
                                                            "PENDING",
                                                        ].includes(
                                                            bookingStatus
                                                        ) && (
                                                            <button
                                                                type="button"
                                                                className="rems-icon-button rems-action-danger"
                                                                title="Reject"
                                                                onClick={async () => {
                                                                    const reason =
                                                                        window.prompt(
                                                                            "Reason for rejection:"
                                                                        );

                                                                    if (
                                                                        reason ===
                                                                        null
                                                                    ) {
                                                                        return;
                                                                    }

                                                                    await runAction(
                                                                        booking.id,
                                                                        rejectFacilityBooking,
                                                                        reason
                                                                    );
                                                                }}
                                                                disabled={
                                                                    processingId ===
                                                                    booking.id
                                                                }
                                                            >
                                                                <BsXCircle />
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


            {/* ==================================================
                REVIEW MODAL
            ================================================== */}

            {selected && (

                <div
                    className="rems-modal-backdrop"
                    style={{
                        zIndex: 3000,
                    }}
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setSelected(
                                null
                            );
                        }
                    }}
                >

                    <div
                        className="rems-modal rems-management-modal"
                        style={{
                            position: "relative",
                            zIndex: 3001,
                            width: "min(100%, 1050px)",
                            maxHeight: "92vh",
                            overflowY: "auto",
                        }}
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        {/* ==================================================
                            MODAL HEADER
                        ================================================== */}

                        <div className="rems-modal-header">

                            <div>

                                <div className="rems-page-eyebrow">
                                    FACILITY BOOKING REVIEW
                                </div>

                                <div className="rems-modal-title">
                                    {selected.facility_name ||
                                        "Facility Booking"}
                                </div>

                                <div className="rems-modal-subtitle">
                                    {selected.resident_name ||
                                        "Unknown Resident"}

                                    {" · "}

                                    Booking #
                                    {selected.id}
                                </div>

                            </div>


                            <div className="d-flex align-items-center gap-2">

                                <span
                                    className={`rems-status-badge ${getStatusClass(
                                        selectedStatus
                                    )}`}
                                >
                                    <span className="rems-status-dot" />

                                    {statusLabel(
                                        selected.status_display ||
                                        selectedStatus
                                    )}
                                </span>


                                <button
                                    type="button"
                                    className="rems-modal-close"
                                    onClick={() =>
                                        setSelected(
                                            null
                                        )
                                    }
                                    aria-label="Close"
                                >
                                    ×
                                </button>

                            </div>

                        </div>


                        {/* ==================================================
                            MODAL BODY
                        ================================================== */}

                        <div className="rems-modal-body">

                            {/* =================================================
                                BOOKING SUMMARY
                            ================================================= */}

                            <div className="rems-form-section mb-3">

                                <div className="rems-form-section-title">
                                    Reservation Details
                                </div>

                                <div className="row g-3">

                                    <div className="col-12 col-md-3">

                                        <div className="rems-table-secondary">
                                            Date
                                        </div>

                                        <div className="rems-table-primary">
                                            {selected.booking_date ||
                                                "—"}
                                        </div>

                                    </div>


                                    <div className="col-12 col-md-3">

                                        <div className="rems-table-secondary">
                                            Time
                                        </div>

                                        <div className="rems-table-primary">
                                            {selected.start_time ||
                                                "—"}

                                            {" — "}

                                            {selected.end_time ||
                                                "—"}
                                        </div>

                                    </div>


                                    <div className="col-12 col-md-3">

                                        <div className="rems-table-secondary">
                                            Guest Limit
                                        </div>

                                        <div className="rems-table-primary">
                                            {guestCount}
                                            {" / "}
                                            {guestLimit}
                                        </div>

                                    </div>


                                    <div className="col-12 col-md-3">

                                        <div className="rems-table-secondary">
                                            Security Clearance
                                        </div>

                                        <div className="rems-table-primary">
                                            {securityCleared
                                                ? "Completed"
                                                : "Pending"}
                                        </div>

                                    </div>

                                </div>


                                {selected.event_description && (
                                    <div className="mt-3">

                                        <div className="rems-table-secondary">
                                            Event Description
                                        </div>

                                        <div className="small mt-1">
                                            {selected.event_description}
                                        </div>

                                    </div>
                                )}


                                {selected.supplier_details && (
                                    <div className="mt-3">

                                        <div className="rems-table-secondary">
                                            Supplier Details
                                        </div>

                                        <div className="small mt-1">
                                            {selected.supplier_details}
                                        </div>

                                    </div>
                                )}

                            </div>


                            {/* =================================================
                                PENCIL INFORMATION
                            ================================================= */}

                            {selectedStatus ===
                                "PENCIL" && (
                                <div className="alert alert-warning rems-alert mb-3">

                                    <BsClockHistory className="me-2" />

                                    <strong>
                                        Temporary Pencil Hold
                                    </strong>

                                    {selected.pencil_expires_at && (
                                        <div className="small mt-1">
                                            Hold expires at:
                                            {" "}
                                            {formatDateTime(
                                                selected.pencil_expires_at
                                            )}
                                        </div>
                                    )}

                                    <div className="small mt-1">
                                        The browser must not
                                        manually cancel the
                                        booking. Server-side
                                        expiration remains authoritative.
                                    </div>

                                </div>
                            )}


                            {/* =================================================
                                APPROVAL
                            ================================================= */}

                            {selectedStatus ===
                                "PENDING" && (
                                <div className="rems-form-section mb-3">

                                    <div className="rems-form-section-title">
                                        Approval Review
                                    </div>


                                    {approvalIssues.length > 0 && (
                                        <div className="alert alert-warning rems-alert mb-3">

                                            <div className="fw-semibold">
                                                <BsExclamationTriangle className="me-2" />
                                                Approval requirements
                                            </div>

                                            <ul className="small mb-0 mt-2">
                                                {approvalIssues.map(
                                                    (issue) => (
                                                        <li
                                                            key={
                                                                issue
                                                            }
                                                        >
                                                            {issue}
                                                        </li>
                                                    )
                                                )}
                                            </ul>

                                        </div>
                                    )}


                                    <div className="d-flex flex-wrap gap-2">

                                        <button
                                            type="button"
                                            className="rems-primary-button"
                                            onClick={() =>
                                                runAction(
                                                    selected.id,
                                                    approveFacilityBooking
                                                )
                                            }
                                            disabled={
                                                !canApprove ||
                                                processingSelected
                                            }
                                        >
                                            {processingSelected ? (
                                                <>
                                                    <span
                                                        className="spinner-border spinner-border-sm me-2"
                                                        aria-hidden="true"
                                                    />

                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <BsCheck2Circle />
                                                    Approve Booking
                                                </>
                                            )}
                                        </button>


                                        <button
                                            type="button"
                                            className="rems-secondary-button"
                                            onClick={async () => {
                                                const reason =
                                                    window.prompt(
                                                        "Reason for rejection:"
                                                    );

                                                if (
                                                    reason ===
                                                    null
                                                ) {
                                                    return;
                                                }

                                                await runAction(
                                                    selected.id,
                                                    rejectFacilityBooking,
                                                    reason
                                                );
                                            }}
                                            disabled={
                                                processingSelected
                                            }
                                        >
                                            <BsXCircle />
                                            Reject
                                        </button>

                                    </div>

                                </div>
                            )}


                            {/* =================================================
                                SECURITY CLEARANCE
                            ================================================= */}

                            {selectedStatus ===
                                "APPROVED" &&
                                !securityCleared && (
                                    <div className="rems-form-section mb-3">

                                        <div className="rems-form-section-title">
                                            Security Clearance
                                        </div>

                                        <div className="alert alert-info rems-alert mb-3">

                                            <BsShieldCheck className="me-2" />

                                            Complete security clearance
                                            only after confirming the
                                            guest list.

                                            <div className="small mt-1">
                                                Once completed, the guest
                                                list is permanently locked.
                                            </div>

                                        </div>

                                        <button
                                            type="button"
                                            className="rems-primary-button"
                                            onClick={
                                                completeSecurityClearance
                                            }
                                            disabled={
                                                processingSelected
                                            }
                                        >
                                            {processingSelected ? (
                                                <>
                                                    <span
                                                        className="spinner-border spinner-border-sm me-2"
                                                        aria-hidden="true"
                                                    />

                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <BsShieldCheck />
                                                    Complete Security Clearance
                                                </>
                                            )}
                                        </button>

                                    </div>
                                )}


                            {securityCleared && (
                                <div className="alert alert-success rems-alert mb-3">

                                    <BsLock className="me-2" />

                                    <strong>
                                        Security Cleared
                                    </strong>

                                    <div className="small mt-1">
                                        The guest list is now locked
                                        and cannot be modified.
                                    </div>

                                </div>
                            )}


                            {/* =================================================
                                GUEST LIST
                            ================================================= */}

                            <div className="rems-form-section mb-3">

                                <div className="d-flex justify-content-between align-items-center gap-3 mb-2">

                                    <div className="rems-form-section-title mb-0">
                                        Guest List
                                    </div>

                                    <div className="d-flex align-items-center gap-2">

                                        <BsPeople />

                                        <span className="small text-muted">
                                            {guestCount}
                                            {" / "}
                                            {guestLimit}
                                        </span>

                                    </div>

                                </div>


                                {securityCleared && (
                                    <div className="small text-muted mb-3">
                                        <BsLock className="me-1" />
                                        Guest list locked after
                                        security clearance.
                                    </div>
                                )}


                                {selectedGuests.length ===
                                0 ? (

                                    <div className="rems-empty-state py-4">

                                        <div className="rems-empty-icon">
                                            <BsPeople />
                                        </div>

                                        <div className="rems-empty-title">
                                            No guests registered
                                        </div>

                                        <div className="rems-empty-text">
                                            This booking does not
                                            currently have guest records.
                                        </div>

                                    </div>

                                ) : (

                                    <div className="rems-table-wrapper">

                                        <table className="table rems-table align-middle mb-0">

                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Guest Name</th>
                                                    <th>Vehicle Plate</th>
                                                    <th>Vehicle Model</th>
                                                </tr>
                                            </thead>

                                            <tbody>

                                                {selectedGuests.map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (
                                                        <tr
                                                            key={
                                                                item?.id ||
                                                                `${selected.id}-${item?.row_number}-${index}`
                                                            }
                                                        >

                                                            <td>
                                                                {item?.row_number ||
                                                                    index +
                                                                    1}
                                                            </td>

                                                            <td>
                                                                <div className="rems-table-primary">
                                                                    {item?.full_name ||
                                                                        "—"}
                                                                </div>
                                                            </td>

                                                            <td>
                                                                {item?.vehicle_plate_number ||
                                                                    "—"}
                                                            </td>

                                                            <td>
                                                                {item?.vehicle_model ||
                                                                    "—"}
                                                            </td>

                                                        </tr>
                                                    )
                                                )}

                                            </tbody>

                                        </table>

                                    </div>

                                )}

                            </div>


                            {/* =================================================
                                PAYMENT
                            ================================================= */}

                            <div className="rems-form-section mb-3">

                                <div className="d-flex justify-content-between align-items-center gap-3 mb-3">

                                    <div className="rems-form-section-title mb-0">
                                        Booking Payment
                                    </div>

                                    <BsCashStack />

                                </div>


                                <div className="row g-3 mb-3">

                                    <div className="col-12 col-md-4">

                                        <div className="rems-table-secondary">
                                            Total Due
                                        </div>

                                        <div className="rems-table-primary">
                                            ₱{money(
                                                totalDue
                                            )}
                                        </div>

                                    </div>


                                    <div className="col-12 col-md-4">

                                        <div className="rems-table-secondary">
                                            Verified Amount
                                        </div>

                                        <div className="rems-table-primary">
                                            ₱{money(
                                                verifiedAmount
                                            )}
                                        </div>

                                    </div>


                                    <div className="col-12 col-md-4">

                                        <div className="rems-table-secondary">
                                            Payment Status
                                        </div>

                                        <div className="mt-1">

                                            {verifiedBookingPayment ? (
                                                <span className="rems-status-badge rems-status-success">
                                                    <span className="rems-status-dot" />
                                                    Verified
                                                </span>
                                            ) : pendingBookingPayment ? (
                                                <span className="rems-status-badge rems-status-warning">
                                                    <span className="rems-status-dot" />
                                                    Pending Verification
                                                </span>
                                            ) : latestBookingPayment ? (
                                                <span className="rems-status-badge rems-status-danger">
                                                    <span className="rems-status-dot" />
                                                    {statusLabel(
                                                        latestBookingPayment.status
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="rems-status-badge rems-status-secondary">
                                                    <span className="rems-status-dot" />
                                                    Not Submitted
                                                </span>
                                            )}

                                        </div>

                                    </div>

                                </div>


                                {selectedPayments.length ===
                                0 ? (

                                    <div className="rems-empty-state py-4">

                                        <div className="rems-empty-icon">
                                            <BsCashStack />
                                        </div>

                                        <div className="rems-empty-title">
                                            No payment submitted
                                        </div>

                                        <div className="rems-empty-text">
                                            The resident has not
                                            submitted a booking payment.
                                        </div>

                                    </div>

                                ) : (

                                    <div>

                                        {selectedPayments.map(
                                            (
                                                payment
                                            ) => (

                                                <div
                                                    key={
                                                        payment.id
                                                    }
                                                    className="d-flex justify-content-between align-items-center gap-3 py-3 border-bottom"
                                                >

                                                    <div>

                                                        <div className="rems-table-primary">
                                                            ₱{money(
                                                                payment.amount
                                                            )}
                                                        </div>

                                                        <div className="rems-table-secondary">

                                                            {payment.payment_method_display ||
                                                                payment.payment_method ||
                                                                "Payment"}

                                                            {" · "}

                                                            {payment.payment_type_display ||
                                                                payment.payment_type ||
                                                                "BOOKING_TOTAL"}

                                                        </div>

                                                        {payment.reference_number && (
                                                            <div className="small text-muted mt-1">
                                                                Reference:
                                                                {" "}
                                                                {
                                                                    payment.reference_number
                                                                }
                                                            </div>
                                                        )}

                                                        {payment.created_at && (
                                                            <div className="small text-muted">
                                                                Submitted:
                                                                {" "}
                                                                {formatDateTime(
                                                                    payment.created_at
                                                                )}
                                                            </div>
                                                        )}

                                                    </div>


                                                    <div className="d-flex align-items-center gap-2">

                                                        {payment.proof && (
                                                            <a
                                                                href={
                                                                    payment.proof
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="rems-secondary-button"
                                                            >
                                                                View Proof
                                                            </a>
                                                        )}


                                                        <span
                                                            className={`rems-status-badge ${getStatusClass(
                                                                payment.status
                                                            )}`}
                                                        >
                                                            <span className="rems-status-dot" />

                                                            {statusLabel(
                                                                payment.status_display ||
                                                                payment.status
                                                            )}
                                                        </span>


                                                        {normalizeStatus(
                                                            payment.status
                                                        ) ===
                                                            "PENDING" &&
                                                            normalizeStatus(
                                                                payment.payment_type
                                                            ) ===
                                                                "BOOKING_TOTAL" && (
                                                                <button
                                                                    type="button"
                                                                    className="rems-primary-button"
                                                                    onClick={() =>
                                                                        approvePayment(
                                                                            payment
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        processingSelected
                                                                    }
                                                                >
                                                                    {processingSelected ? (
                                                                        <>
                                                                            <span
                                                                                className="spinner-border spinner-border-sm me-2"
                                                                                aria-hidden="true"
                                                                            />

                                                                            Verifying...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <BsCheck2Circle />
                                                                            Verify
                                                                        </>
                                                                    )}
                                                                </button>
                                                            )}

                                                    </div>

                                                </div>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>


                            {/* =================================================
                                FACILITY USE
                            ================================================= */}

                            {selectedStatus ===
                                "APPROVED" &&
                                securityCleared && (
                                    <div className="rems-form-section mb-3">

                                        <div className="rems-form-section-title">
                                            Facility Use
                                        </div>

                                        <div className="alert alert-success rems-alert mb-3">

                                            <BsPersonCheck className="me-2" />

                                            Booking approved and security
                                            clearance completed.

                                        </div>

                                        <button
                                            type="button"
                                            className="rems-primary-button"
                                            onClick={() =>
                                                runAction(
                                                    selected.id,
                                                    startFacilityUse
                                                )
                                            }
                                            disabled={
                                                processingSelected
                                            }
                                        >
                                            {processingSelected ? (
                                                <>
                                                    <span
                                                        className="spinner-border spinner-border-sm me-2"
                                                        aria-hidden="true"
                                                    />

                                                    Starting...
                                                </>
                                            ) : (
                                                <>
                                                    <BsCheck2Circle />
                                                    Start Facility Use
                                                </>
                                            )}
                                        </button>

                                    </div>
                                )}


                            {/* =================================================
                                IN USE
                            ================================================= */}

                            {selectedStatus ===
                                "IN_USE" && (
                                <div className="rems-form-section mb-3">

                                    <div className="rems-form-section-title">
                                        Facility Use
                                    </div>

                                    <div className="alert alert-info rems-alert mb-3">
                                        The facility booking is
                                        currently in use.
                                    </div>

                                    <button
                                        type="button"
                                        className="rems-primary-button"
                                        onClick={() =>
                                            runAction(
                                                selected.id,
                                                completeFacilityBooking
                                            )
                                        }
                                        disabled={
                                            processingSelected
                                        }
                                    >
                                        {processingSelected ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    aria-hidden="true"
                                                />

                                                Completing...
                                            </>
                                        ) : (
                                            <>
                                                <BsCheck2Circle />
                                                Complete Facility Use
                                            </>
                                        )}
                                    </button>

                                </div>
                            )}


                            {/* =================================================
                                INSPECTION
                            ================================================= */}

                            {selectedStatus ===
                                "INSPECTION_PENDING" && (
                                <div className="rems-form-section mb-3">

                                    <div className="rems-form-section-title">
                                        Post-Event Inspection
                                    </div>

                                    <div className="row g-3">

                                        <div className="col-12 col-md-4">

                                            <label className="rems-form-label">
                                                Inspection Result
                                            </label>

                                            <select
                                                className="form-select rems-form-control"
                                                value={
                                                    inspection.result
                                                }
                                                onChange={(event) =>
                                                    setInspection(
                                                        (
                                                            previous
                                                        ) => ({
                                                            ...previous,
                                                            result:
                                                                event.target.value,
                                                        })
                                                    )
                                                }
                                                disabled={
                                                    processingSelected
                                                }
                                            >
                                                <option value="PASSED">
                                                    Passed
                                                </option>

                                                <option value="DAMAGE_FOUND">
                                                    Damage Found
                                                </option>

                                                <option value="CLEANUP_REQUIRED">
                                                    Cleanup Required
                                                </option>
                                            </select>

                                        </div>


                                        <div className="col-12 col-md-4">

                                            <label className="rems-form-label">
                                                Deposit Deduction
                                            </label>

                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="form-control rems-form-control"
                                                value={
                                                    inspection.deduction_amount
                                                }
                                                onChange={(event) =>
                                                    setInspection(
                                                        (
                                                            previous
                                                        ) => ({
                                                            ...previous,
                                                            deduction_amount:
                                                                event.target.value,
                                                        })
                                                    )
                                                }
                                                disabled={
                                                    processingSelected
                                                }
                                            />

                                        </div>


                                        <div className="col-12 col-md-4 d-flex align-items-end">

                                            <button
                                                type="button"
                                                className="rems-primary-button w-100"
                                                onClick={
                                                    inspect
                                                }
                                                disabled={
                                                    processingSelected
                                                }
                                            >
                                                {processingSelected ? (
                                                    <>
                                                        <span
                                                            className="spinner-border spinner-border-sm me-2"
                                                            aria-hidden="true"
                                                        />

                                                        Recording...
                                                    </>
                                                ) : (
                                                    <>
                                                        <BsClipboardCheck />
                                                        Record Inspection
                                                    </>
                                                )}
                                            </button>

                                        </div>


                                        <div className="col-12">

                                            <label className="rems-form-label">
                                                Inspection Notes
                                            </label>

                                            <textarea
                                                rows="4"
                                                className="form-control rems-form-control"
                                                placeholder="Enter inspection findings, cleanup notes, damage details, or other relevant information..."
                                                value={
                                                    inspection.notes
                                                }
                                                onChange={(event) =>
                                                    setInspection(
                                                        (
                                                            previous
                                                        ) => ({
                                                            ...previous,
                                                            notes:
                                                                event.target.value,
                                                        })
                                                    )
                                                }
                                                disabled={
                                                    processingSelected
                                                }
                                            />

                                        </div>

                                    </div>

                                </div>
                            )}


                            {/* =================================================
                                INSPECTION SUMMARY
                            ================================================= */}

                            {selected.inspection && (
                                <div className="rems-form-section mb-3">

                                    <div className="rems-form-section-title">
                                        Inspection Record
                                    </div>

                                    <div className="row g-3">

                                        <div className="col-12 col-md-4">

                                            <div className="rems-table-secondary">
                                                Result
                                            </div>

                                            <div className="rems-table-primary">
                                                {selected.inspection.result_display ||
                                                    selected.inspection.result ||
                                                    "—"}
                                            </div>

                                        </div>


                                        <div className="col-12 col-md-4">

                                            <div className="rems-table-secondary">
                                                Refund Amount
                                            </div>

                                            <div className="rems-table-primary">
                                                ₱{money(
                                                    selected.inspection.refund_amount
                                                )}
                                            </div>

                                        </div>


                                        <div className="col-12 col-md-4">

                                            <div className="rems-table-secondary">
                                                Deduction
                                            </div>

                                            <div className="rems-table-primary">
                                                ₱{money(
                                                    selected.inspection.deduction_amount
                                                )}
                                            </div>

                                        </div>


                                        {selected.inspection.notes && (
                                            <div className="col-12">

                                                <div className="rems-table-secondary">
                                                    Notes
                                                </div>

                                                <div className="small mt-1">
                                                    {
                                                        selected.inspection.notes
                                                    }
                                                </div>

                                            </div>
                                        )}

                                    </div>

                                </div>
                            )}


                            {/* =================================================
                                REFUND
                            ================================================= */}

                            {selectedStatus ===
                                "REFUND_PENDING" && (
                                <div className="rems-form-section mb-3">

                                    <div className="rems-form-section-title">
                                        Security Deposit Refund
                                    </div>

                                    <div className="row g-3 align-items-end">

                                        <div className="col-12 col-md-6">

                                            <div className="rems-table-secondary">
                                                Refund Amount
                                            </div>

                                            <div className="rems-table-primary">
                                                ₱{money(
                                                    selected.inspection?.refund_amount
                                                )}
                                            </div>

                                        </div>


                                        <div className="col-12 col-md-6">

                                            <button
                                                type="button"
                                                className="rems-primary-button w-100"
                                                onClick={() =>
                                                    runAction(
                                                        selected.id,
                                                        refundFacilityDeposit,
                                                        {
                                                            payment_method:
                                                                "CASH",
                                                        }
                                                    )
                                                }
                                                disabled={
                                                    processingSelected
                                                }
                                            >
                                                {processingSelected ? (
                                                    <>
                                                        <span
                                                            className="spinner-border spinner-border-sm me-2"
                                                            aria-hidden="true"
                                                        />

                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <BsCashStack />
                                                        Record Deposit Refund
                                                    </>
                                                )}
                                            </button>

                                        </div>

                                    </div>

                                </div>
                            )}


                            {/* =================================================
                                CLOSED
                            ================================================= */}

                            {selectedStatus ===
                                "CLOSED" && (
                                <div className="alert alert-success rems-alert">

                                    <BsCheck2Circle className="me-2" />

                                    <strong>
                                        Booking Closed
                                    </strong>

                                    <div className="small mt-1">
                                        This facility booking has
                                        completed its lifecycle.
                                    </div>

                                </div>
                            )}


                            {/* =================================================
                                REJECTED
                            ================================================= */}

                            {selectedStatus ===
                                "REJECTED" && (
                                <div className="alert alert-danger rems-alert">

                                    <BsXCircle className="me-2" />

                                    <strong>
                                        Booking Rejected
                                    </strong>

                                    {selected.rejection_reason && (
                                        <div className="small mt-1">
                                            {
                                                selected.rejection_reason
                                            }
                                        </div>
                                    )}

                                </div>
                            )}


                            {/* =================================================
                                CANCELLED
                            ================================================= */}

                            {selectedStatus ===
                                "CANCELLED" && (
                                <div className="alert alert-secondary rems-alert">

                                    <BsLock className="me-2" />

                                    <strong>
                                        Booking Cancelled
                                    </strong>

                                    {selected.cancellation_reason && (
                                        <div className="small mt-1">
                                            {
                                                selected.cancellation_reason
                                            }
                                        </div>
                                    )}

                                </div>
                            )}

                        </div>


                        {/* ==================================================
                            MODAL FOOTER
                        ================================================== */}

                        <div className="rems-modal-footer">

                            <button
                                type="button"
                                className="rems-secondary-button"
                                onClick={
                                    refreshSelected
                                }
                                disabled={
                                    processingSelected
                                }
                            >
                                <BsArrowClockwise />
                                Refresh Details
                            </button>


                            <button
                                type="button"
                                className="rems-secondary-button"
                                onClick={() =>
                                    setSelected(
                                        null
                                    )
                                }
                                disabled={
                                    processingSelected
                                }
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}


// import {
//     useCallback,
//     useEffect,
//     useMemo,
//     useState,
// } from "react";

// import {
//     BsArrowClockwise,
//     BsCheck2Circle,
//     BsEye,
//     BsShieldCheck,
//     BsXCircle,
// } from "react-icons/bs";

// import {
//     getFacilityBookings,
//     getFacilityBooking,
//     getBookingGuests,
//     approveFacilityBooking,
//     rejectFacilityBooking,
//     startFacilityUse,
//     completeFacilityBooking,
//     completeFacilitySecurityClearance,
//     inspectFacilityBooking,
//     refundFacilityDeposit,
//     verifyBookingPayment,
// } from "../../api/facilities";


// const normalize = (response) =>
//     Array.isArray(response)
//         ? response
//         : response?.results || [];


// const normalizeStatus = (value) =>
//     String(value || "")
//         .trim()
//         .toUpperCase();


// const money = (value) =>
//     Number(value || 0).toLocaleString(
//         undefined,
//         {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2,
//         }
//     );


// const getErrorMessage = (
//     error,
//     fallback = "Unable to complete the action."
// ) => {
//     return (
//         error?.response?.data?.detail ||
//         error?.response?.data?.message ||
//         error?.response?.data?.error ||
//         fallback
//     );
// };


// export default function FacilityBookings() {
//     const [bookings, setBookings] = useState([]);

//     const [loading, setLoading] =
//         useState(true);

//     const [refreshing, setRefreshing] =
//         useState(false);

//     const [error, setError] =
//         useState("");

//     const [selected, setSelected] =
//         useState(null);

//     const [processingId, setProcessingId] =
//         useState(null);

//     const [inspection, setInspection] =
//         useState({
//             result: "PASSED",
//             notes: "",
//             deduction_amount: 0,
//         });


//     /* =====================================================
//        LOAD BOOKINGS
//     ===================================================== */

//     const loadBookings = useCallback(
//         async (refresh = false) => {
//             if (refresh) {
//                 setRefreshing(true);
//             } else {
//                 setLoading(true);
//             }

//             setError("");

//             try {
//                 const response =
//                     await getFacilityBookings();

//                 setBookings(
//                     normalize(response)
//                 );
//             } catch (err) {
//                 console.error(
//                     "[Admin Facility Bookings]",
//                     err
//                 );

//                 setError(
//                     getErrorMessage(
//                         err,
//                         "Unable to load facility bookings."
//                     )
//                 );
//             } finally {
//                 setLoading(false);
//                 setRefreshing(false);
//             }
//         },
//         []
//     );


//     useEffect(() => {
//         loadBookings();
//     }, [loadBookings]);


//     /* =====================================================
//        LOAD SELECTED BOOKING
//     ===================================================== */

//     const openBooking = async (
//         booking
//     ) => {
//         if (!booking?.id) {
//             return;
//         }

//         setError("");

//         try {
//             const [
//                 bookingResponse,
//                 guestsResponse,
//             ] = await Promise.all([
//                 getFacilityBooking(
//                     booking.id
//                 ),
//                 getBookingGuests(
//                     booking.id
//                 ),
//             ]);

//             const detail =
//                 bookingResponse || booking;

//             const guests =
//                 normalize(
//                     guestsResponse
//                 );

//             setSelected({
//                 ...booking,
//                 ...detail,
//                 guests,
//             });

//         } catch (err) {
//             console.error(
//                 "[Admin Facility Bookings] Open:",
//                 err
//             );

//             setError(
//                 getErrorMessage(
//                     err,
//                     "Unable to load booking details."
//                 )
//             );
//         }
//     };


//     /* =====================================================
//        REFRESH SELECTED BOOKING
//     ===================================================== */

//     const refreshSelected = async () => {
//         if (!selected?.id) {
//             return;
//         }

//         try {
//             const [
//                 bookingResponse,
//                 guestsResponse,
//             ] = await Promise.all([
//                 getFacilityBooking(
//                     selected.id
//                 ),
//                 getBookingGuests(
//                     selected.id
//                 ),
//             ]);

//             const updatedBooking =
//                 bookingResponse || selected;

//             const guests =
//                 normalize(
//                     guestsResponse
//                 );

//             setSelected({
//                 ...selected,
//                 ...updatedBooking,
//                 guests,
//             });

//             await loadBookings(true);

//         } catch (err) {
//             console.error(
//                 "[Admin Facility Bookings] Refresh:",
//                 err
//             );

//             setError(
//                 getErrorMessage(
//                     err,
//                     "Unable to refresh booking details."
//                 )
//             );
//         }
//     };


//     /* =====================================================
//        GENERIC ACTION
//     ===================================================== */

//     const runAction = async (
//         id,
//         action,
//         payload,
//         keepSelected = false
//     ) => {
//         setProcessingId(id);
//         setError("");

//         try {
//             const updated =
//                 await action(
//                     id,
//                     payload
//                 );

//             await loadBookings(true);

//             if (keepSelected) {
//                 if (updated) {
//                     setSelected(
//                         updated
//                     );
//                 } else {
//                     await refreshSelected();
//                 }
//             } else {
//                 setSelected(null);
//             }

//         } catch (err) {
//             console.error(
//                 "[Admin Facility Booking]",
//                 err
//             );

//             setError(
//                 getErrorMessage(
//                     err,
//                     "Unable to complete the action."
//                 )
//             );
//         } finally {
//             setProcessingId(null);
//         }
//     };


//     /* =====================================================
//        PAYMENT VERIFICATION
//     ===================================================== */

//     const verifyPayment = async (
//         payment
//     ) => {
//         if (
//             !selected?.id ||
//             !payment?.id
//         ) {
//             return;
//         }

//         setProcessingId(
//             selected.id
//         );

//         setError("");

//         try {
//             await verifyBookingPayment(
//                 payment.id
//             );

//             await refreshSelected();

//         } catch (err) {
//             console.error(
//                 "[Admin Facility Bookings] Payment verification:",
//                 err
//             );

//             setError(
//                 getErrorMessage(
//                     err,
//                     "Unable to verify payment."
//                 )
//             );
//         } finally {
//             setProcessingId(null);
//         }
//     };


//     /* =====================================================
//        SECURITY CLEARANCE
//     ===================================================== */

//     const completeSecurityClearance =
//         async () => {
//             if (!selected?.id) {
//                 return;
//             }

//             const status =
//                 normalizeStatus(
//                     selected.status
//                 );

//             if (
//                 status !==
//                 "APPROVED"
//             ) {
//                 setError(
//                     "Security clearance can only be completed after the booking has been approved."
//                 );

//                 return;
//             }

//             if (
//                 selected.security_clearance_completed
//             ) {
//                 setError(
//                     "Security clearance has already been completed."
//                 );

//                 return;
//             }

//             await runAction(
//                 selected.id,
//                 completeFacilitySecurityClearance,
//                 undefined,
//                 true
//             );
//         };


//     /* =====================================================
//        INSPECTION
//     ===================================================== */

//     const inspect = async () => {
//         if (!selected?.id) {
//             return;
//         }

//         await runAction(
//             selected.id,
//             inspectFacilityBooking,
//             inspection,
//             true
//         );

//         setInspection({
//             result: "PASSED",
//             notes: "",
//             deduction_amount: 0,
//         });
//     };


//     /* =====================================================
//        STATISTICS
//     ===================================================== */

//     const stats = useMemo(
//         () => {
//             const rows =
//                 bookings.map(
//                     (booking) => ({
//                         ...booking,
//                         status:
//                             normalizeStatus(
//                                 booking?.status
//                             ),
//                     })
//                 );

//             return {
//                 pending:
//                     rows.filter(
//                         (item) =>
//                             item.status ===
//                             "PENDING"
//                     ).length,

//                 approved:
//                     rows.filter(
//                         (item) =>
//                             item.status ===
//                             "APPROVED"
//                     ).length,

//                 inUse:
//                     rows.filter(
//                         (item) =>
//                             item.status ===
//                             "IN_USE"
//                     ).length,

//                 inspection:
//                     rows.filter(
//                         (item) =>
//                             item.status ===
//                             "INSPECTION_PENDING"
//                     ).length,

//                 refunds:
//                     rows.filter(
//                         (item) =>
//                             item.status ===
//                             "REFUND_PENDING"
//                     ).length,

//                 expired:
//                     rows.filter(
//                         (item) =>
//                             item.status ===
//                             "EXPIRED"
//                     ).length,
//             };
//         },
//         [bookings]
//     );


//     /* =====================================================
//        LOADING
//     ===================================================== */

//     if (loading) {
//         return (
//             <div className="rems-page-content">
//                 <div className="rems-loading-state">
//                     <div
//                         className="spinner-border"
//                         role="status"
//                         aria-hidden="true"
//                     />

//                     <div className="mt-3">
//                         Loading facility bookings...
//                     </div>
//                 </div>
//             </div>
//         );
//     }


//     /* =====================================================
//        RENDER
//     ===================================================== */

//     return (
//         <div className="rems-page-content">

//             {/* =================================================
//                 HEADER
//             ================================================= */}

//             <div className="rems-page-header">

//                 <div>
//                     <div className="rems-page-eyebrow">
//                         ADMINISTRATION
//                     </div>

//                     <h1 className="rems-page-title">
//                         Facility Bookings
//                     </h1>

//                     <p className="rems-page-description">
//                         Review reservations, payments,
//                         guest access, security clearance,
//                         inspections, and security deposits.
//                     </p>
//                 </div>

//                 <button
//                     type="button"
//                     className="rems-secondary-button"
//                     onClick={() =>
//                         loadBookings(true)
//                     }
//                     disabled={refreshing}
//                 >
//                     <BsArrowClockwise />

//                     {refreshing
//                         ? "Refreshing..."
//                         : "Refresh"}
//                 </button>
//             </div>


//             {/* =================================================
//                 ERROR
//             ================================================= */}

//             {error && (
//                 <div className="alert alert-danger rems-alert mb-4">
//                     {error}
//                 </div>
//             )}


//             {/* =================================================
//                 STATISTICS
//             ================================================= */}

//             <div className="row g-3 mb-4">

//                 {[
//                     [
//                         "Pending Approval",
//                         stats.pending,
//                     ],
//                     [
//                         "Approved",
//                         stats.approved,
//                     ],
//                     [
//                         "In Use",
//                         stats.inUse,
//                     ],
//                     [
//                         "Inspection Pending",
//                         stats.inspection,
//                     ],
//                     [
//                         "Deposit Refunds",
//                         stats.refunds,
//                     ],
//                     [
//                         "Expired",
//                         stats.expired,
//                     ],
//                 ].map(
//                     ([label, value]) => (
//                         <div
//                             className="col-6 col-md-4 col-xl-2"
//                             key={label}
//                         >
//                             <div className="rems-stat-card h-100">
//                                 <div className="rems-stat-content">

//                                     <div className="rems-stat-label">
//                                         {label}
//                                     </div>

//                                     <div className="rems-stat-value">
//                                         {value}
//                                     </div>

//                                 </div>
//                             </div>
//                         </div>
//                     )
//                 )}

//             </div>


//             {/* =================================================
//                 BOOKINGS TABLE
//             ================================================= */}

//             <div className="rems-glass-card">

//                 {bookings.length === 0 ? (
//                     <div className="rems-empty-state">

//                         <div className="rems-empty-title">
//                             No facility bookings
//                         </div>

//                         <div className="rems-empty-text">
//                             Resident booking requests will appear here.
//                         </div>

//                     </div>
//                 ) : (
//                     <div className="rems-table-wrapper">

//                         <table className="table rems-table align-middle mb-0">

//                             <thead>
//                                 <tr>
//                                     <th>
//                                         Resident
//                                     </th>

//                                     <th>
//                                         Facility
//                                     </th>

//                                     <th>
//                                         Schedule
//                                     </th>

//                                     <th>
//                                         Guests
//                                     </th>

//                                     <th>
//                                         Status
//                                     </th>

//                                     <th className="text-end">
//                                         Actions
//                                     </th>
//                                 </tr>
//                             </thead>


//                             <tbody>

//                                 {bookings.map(
//                                     (booking) => {

//                                         const status =
//                                             normalizeStatus(
//                                                 booking.status
//                                             );

//                                         return (
//                                             <tr
//                                                 key={
//                                                     booking.id
//                                                 }
//                                             >

//                                                 <td data-label="Resident">
//                                                     <div className="rems-table-primary">
//                                                         {
//                                                             booking.resident_name ||
//                                                             "Resident"
//                                                         }
//                                                     </div>
//                                                 </td>


//                                                 <td data-label="Facility">
//                                                     <div className="rems-table-primary">
//                                                         {
//                                                             booking.facility_name ||
//                                                             "Facility"
//                                                         }
//                                                     </div>
//                                                 </td>


//                                                 <td data-label="Schedule">

//                                                     <div className="rems-table-primary">
//                                                         {
//                                                             booking.booking_date ||
//                                                             "—"
//                                                         }
//                                                     </div>

//                                                     <div className="rems-table-secondary">
//                                                         {
//                                                             booking.start_time ||
//                                                             "—"
//                                                         }

//                                                         {" — "}

//                                                         {
//                                                             booking.end_time ||
//                                                             "—"
//                                                         }
//                                                     </div>

//                                                 </td>


//                                                 <td data-label="Guests">

//                                                     <div className="rems-table-primary">
//                                                         {
//                                                             booking.estimated_guests ??
//                                                             0
//                                                         }
//                                                     </div>

//                                                     <div className="rems-table-secondary">
//                                                         estimated
//                                                     </div>

//                                                 </td>


//                                                 <td data-label="Status">

//                                                     <span className="rems-status-badge rems-status-secondary">
//                                                         <span className="rems-status-dot" />

//                                                         {
//                                                             booking.status_display ||
//                                                             booking.status ||
//                                                             "Unknown"
//                                                         }
//                                                     </span>

//                                                 </td>


//                                                 <td data-label="Actions">

//                                                     <div className="d-flex justify-content-end gap-1">

//                                                         <button
//                                                             type="button"
//                                                             className="rems-icon-button"
//                                                             title="Review booking"
//                                                             onClick={() =>
//                                                                 openBooking(
//                                                                     booking
//                                                                 )
//                                                             }
//                                                         >
//                                                             <BsEye />
//                                                         </button>


//                                                         {status ===
//                                                             "PENDING" && (
//                                                             <button
//                                                                 type="button"
//                                                                 className="rems-icon-button"
//                                                                 title="Approve booking"
//                                                                 onClick={() =>
//                                                                     runAction(
//                                                                         booking.id,
//                                                                         approveFacilityBooking
//                                                                     )
//                                                                 }
//                                                                 disabled={
//                                                                     processingId ===
//                                                                     booking.id
//                                                                 }
//                                                             >
//                                                                 <BsCheck2Circle />
//                                                             </button>
//                                                         )}


//                                                         {[
//                                                             "PENDING",
//                                                             "PENCIL",
//                                                         ].includes(
//                                                             status
//                                                         ) && (
//                                                             <button
//                                                                 type="button"
//                                                                 className="rems-icon-button rems-action-danger"
//                                                                 title="Reject booking"
//                                                                 onClick={async () => {

//                                                                     const reason =
//                                                                         window.prompt(
//                                                                             "Reason for rejection:"
//                                                                         );

//                                                                     if (
//                                                                         reason ===
//                                                                         null
//                                                                     ) {
//                                                                         return;
//                                                                     }

//                                                                     await runAction(
//                                                                         booking.id,
//                                                                         rejectFacilityBooking,
//                                                                         reason
//                                                                     );
//                                                                 }}
//                                                                 disabled={
//                                                                     processingId ===
//                                                                     booking.id
//                                                                 }
//                                                             >
//                                                                 <BsXCircle />
//                                                             </button>
//                                                         )}

//                                                     </div>

//                                                 </td>

//                                             </tr>
//                                         );
//                                     }
//                                 )}

//                             </tbody>

//                         </table>

//                     </div>
//                 )}

//             </div>


//             {/* =================================================
//                 REVIEW MODAL
//             ================================================= */}

//             {selected && (
//                 <div
//                     className="rems-modal-backdrop"
//                     style={{
//                         zIndex: 3000,
//                     }}
//                     onMouseDown={(event) => {
//                         if (
//                             event.target ===
//                             event.currentTarget
//                         ) {
//                             setSelected(null);
//                         }
//                     }}
//                 >

//                     <div
//                         className="rems-modal rems-management-modal"
//                         style={{
//                             position: "relative",
//                             zIndex: 3001,
//                             width: "min(100%, 1040px)",
//                         }}
//                         onMouseDown={(event) =>
//                             event.stopPropagation()
//                         }
//                     >

//                         {/* =================================================
//                             MODAL HEADER
//                         ================================================= */}

//                         <div className="rems-modal-header">

//                             <div>

//                                 <div className="rems-page-eyebrow">
//                                     FACILITY REVIEW
//                                 </div>

//                                 <div className="rems-modal-title">
//                                     {
//                                         selected.facility_name ||
//                                         "Facility Booking"
//                                     }
//                                 </div>

//                                 <div className="rems-modal-subtitle">
//                                     {
//                                         selected.resident_name ||
//                                         "Resident"
//                                     }
//                                 </div>

//                             </div>


//                             <button
//                                 type="button"
//                                 className="rems-modal-close"
//                                 onClick={() =>
//                                     setSelected(null)
//                                 }
//                                 aria-label="Close"
//                             >
//                                 <i className="bi bi-x-lg" />
//                             </button>

//                         </div>


//                         {/* =================================================
//                             MODAL BODY
//                         ================================================= */}

//                         <div className="rems-modal-body">

//                             {/* =================================================
//                                 BOOKING SUMMARY
//                             ================================================= */}

//                             <div className="row g-3 mb-4">

//                                 <div className="col-12 col-md-3">

//                                     <div className="rems-table-secondary">
//                                         Date
//                                     </div>

//                                     <div className="rems-table-primary">
//                                         {
//                                             selected.booking_date ||
//                                             "—"
//                                         }
//                                     </div>

//                                 </div>


//                                 <div className="col-12 col-md-3">

//                                     <div className="rems-table-secondary">
//                                         Time
//                                     </div>

//                                     <div className="rems-table-primary">
//                                         {
//                                             selected.start_time ||
//                                             "—"
//                                         }

//                                         {" — "}

//                                         {
//                                             selected.end_time ||
//                                             "—"
//                                         }
//                                     </div>

//                                 </div>


//                                 <div className="col-12 col-md-3">

//                                     <div className="rems-table-secondary">
//                                         Estimated Guests
//                                     </div>

//                                     <div className="rems-table-primary">
//                                         {
//                                             selected.estimated_guests ??
//                                             0
//                                         }
//                                     </div>

//                                 </div>


//                                 <div className="col-12 col-md-3">

//                                     <div className="rems-table-secondary">
//                                         Status
//                                     </div>

//                                     <div className="rems-table-primary">
//                                         {
//                                             selected.status_display ||
//                                             selected.status ||
//                                             "—"
//                                         }
//                                     </div>

//                                 </div>

//                             </div>


//                             {/* =================================================
//                                 EVENT DETAILS
//                             ================================================= */}

//                             {(selected.event_type ||
//                                 selected.event_description) && (
//                                 <div className="rems-form-section mb-3">

//                                     <div className="rems-form-section-title">
//                                         Event Details
//                                     </div>

//                                     {selected.event_type && (
//                                         <div className="mb-2">

//                                             <div className="rems-table-secondary">
//                                                 Event Type
//                                             </div>

//                                             <div className="rems-table-primary">
//                                                 {
//                                                     selected.event_type_display ||
//                                                     selected.event_type
//                                                 }
//                                             </div>

//                                         </div>
//                                     )}


//                                     {selected.event_description && (
//                                         <div>

//                                             <div className="rems-table-secondary">
//                                                 Description
//                                             </div>

//                                             <div className="rems-table-primary">
//                                                 {
//                                                     selected.event_description
//                                                 }
//                                             </div>

//                                         </div>
//                                     )}

//                                 </div>
//                             )}


//                             {/* =================================================
//                                 APPROVAL
//                             ================================================= */}

//                             {normalizeStatus(
//                                 selected.status
//                             ) ===
//                                 "PENDING" && (
//                                 <div className="rems-form-section mb-3">

//                                     <div className="rems-form-section-title">
//                                         Booking Approval
//                                     </div>

//                                     <div className="d-flex flex-wrap gap-2">

//                                         <button
//                                             type="button"
//                                             className="rems-primary-button"
//                                             onClick={() =>
//                                                 runAction(
//                                                     selected.id,
//                                                     approveFacilityBooking
//                                                 )
//                                             }
//                                             disabled={
//                                                 processingId ===
//                                                 selected.id
//                                             }
//                                         >
//                                             <BsCheck2Circle />

//                                             Approve
//                                         </button>


//                                         <button
//                                             type="button"
//                                             className="rems-secondary-button"
//                                             onClick={async () => {

//                                                 const reason =
//                                                     window.prompt(
//                                                         "Reason for rejection:"
//                                                     );

//                                                 if (
//                                                     reason ===
//                                                     null
//                                                 ) {
//                                                     return;
//                                                 }

//                                                 await runAction(
//                                                     selected.id,
//                                                     rejectFacilityBooking,
//                                                     reason
//                                                 );
//                                             }}
//                                             disabled={
//                                                 processingId ===
//                                                 selected.id
//                                             }
//                                         >
//                                             <BsXCircle />

//                                             Reject
//                                         </button>

//                                     </div>

//                                 </div>
//                             )}


//                             {/* =================================================
//                                 SECURITY CLEARANCE
//                             ================================================= */}

//                             {normalizeStatus(
//                                 selected.status
//                             ) ===
//                                 "APPROVED" && (
//                                 <div className="rems-form-section mb-3">

//                                     <div className="rems-form-section-title">
//                                         Security Clearance
//                                     </div>

//                                     <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">

//                                         <div>

//                                             <div className="rems-table-primary">
//                                                 {selected.security_clearance_completed
//                                                     ? "Completed"
//                                                     : "Pending"}
//                                             </div>

//                                             <div className="rems-table-secondary">
//                                                 Guest and vehicle access
//                                                 information is reviewed
//                                                 at the booking level.
//                                             </div>

//                                         </div>


//                                         {!selected.security_clearance_completed && (
//                                             <button
//                                                 type="button"
//                                                 className="rems-primary-button"
//                                                 onClick={
//                                                     completeSecurityClearance
//                                                 }
//                                                 disabled={
//                                                     processingId ===
//                                                     selected.id
//                                                 }
//                                             >
//                                                 <BsShieldCheck />

//                                                 Complete Clearance
//                                             </button>
//                                         )}

//                                     </div>

//                                 </div>
//                             )}


//                             {/* =================================================
//                                 GUEST LIST
//                             ================================================= */}

//                             <div className="rems-form-section mb-3">

//                                 <div className="rems-form-section-title">
//                                     Guest List
//                                 </div>

//                                 <div className="rems-table-secondary mb-3">
//                                     Guest information submitted by the
//                                     resident for facility access.
//                                 </div>


//                                 {!selected.guests?.length ? (
//                                     <div className="rems-empty-state py-3">

//                                         <div className="rems-empty-title">
//                                             No guests recorded
//                                         </div>

//                                         <div className="rems-empty-text">
//                                             No guest rows are currently
//                                             attached to this booking.
//                                         </div>

//                                     </div>
//                                 ) : (
//                                     <div className="rems-table-wrapper">

//                                         <table className="table rems-table align-middle mb-0">

//                                             <thead>
//                                                 <tr>
//                                                     <th>
//                                                         #
//                                                     </th>

//                                                     <th>
//                                                         Guest Name
//                                                     </th>

//                                                     <th>
//                                                         Vehicle Plate
//                                                     </th>

//                                                     <th>
//                                                         Vehicle Model
//                                                     </th>
//                                                 </tr>
//                                             </thead>


//                                             <tbody>

//                                                 {selected.guests.map(
//                                                     (
//                                                         guest,
//                                                         index
//                                                     ) => (
//                                                         <tr
//                                                             key={
//                                                                 guest.id ||
//                                                                 index
//                                                             }
//                                                         >

//                                                             <td data-label="#">
//                                                                 {
//                                                                     guest.row_number ||
//                                                                     index +
//                                                                     1
//                                                                 }
//                                                             </td>


//                                                             <td data-label="Guest Name">
//                                                                 <div className="rems-table-primary">
//                                                                     {
//                                                                         guest.full_name ||
//                                                                         "—"
//                                                                     }
//                                                                 </div>
//                                                             </td>


//                                                             <td data-label="Vehicle Plate">
//                                                                 <div className="rems-table-primary">
//                                                                     {
//                                                                         guest.vehicle_plate_number ||
//                                                                         "—"
//                                                                     }
//                                                                 </div>
//                                                             </td>


//                                                             <td data-label="Vehicle Model">
//                                                                 <div className="rems-table-primary">
//                                                                     {
//                                                                         guest.vehicle_model ||
//                                                                         "—"
//                                                                     }
//                                                                 </div>
//                                                             </td>

//                                                         </tr>
//                                                     )
//                                                 )}

//                                             </tbody>

//                                         </table>

//                                     </div>
//                                 )}

//                             </div>


//                             {/* =================================================
//                                 PAYMENTS
//                             ================================================= */}

//                             {selected.payments?.length > 0 && (
//                                 <div className="rems-form-section mb-3">

//                                     <div className="rems-form-section-title">
//                                         Payments
//                                     </div>


//                                     {selected.payments.map(
//                                         (payment) => {

//                                             const status =
//                                                 normalizeStatus(
//                                                     payment.status
//                                                 );

//                                             const type =
//                                                 normalizeStatus(
//                                                     payment.payment_type
//                                                 );

//                                             const isRefund =
//                                                 status ===
//                                                     "REFUNDED" &&
//                                                 type ===
//                                                     "SECURITY_DEPOSIT";

//                                             const title =
//                                                 isRefund
//                                                     ? "Security Deposit Refund"
//                                                     : type ===
//                                                       "BOOKING_TOTAL"
//                                                     ? "Facility Booking Payment"
//                                                     : (
//                                                         payment.payment_type_display ||
//                                                         payment.payment_type ||
//                                                         "Payment"
//                                                     );

//                                             return (
//                                                 <div
//                                                     key={
//                                                         payment.id
//                                                     }
//                                                     className="d-flex justify-content-between align-items-center py-3 border-bottom gap-3"
//                                                 >

//                                                     <div>

//                                                         <div className="rems-table-primary">

//                                                             <span
//                                                                 className={
//                                                                     isRefund
//                                                                         ? "text-success"
//                                                                         : ""
//                                                                 }
//                                                             >
//                                                                 {isRefund
//                                                                     ? "+"
//                                                                     : ""}

//                                                                 ₱
//                                                                 {money(
//                                                                     payment.amount
//                                                                 )}
//                                                             </span>

//                                                         </div>


//                                                         <div className="rems-table-secondary">
//                                                             {title}

//                                                             {" · "}

//                                                             {
//                                                                 payment.payment_method_display ||
//                                                                 payment.payment_method ||
//                                                                 "—"
//                                                             }

//                                                             {" · "}

//                                                             {
//                                                                 payment.status_display ||
//                                                                 payment.status ||
//                                                                 "—"
//                                                             }
//                                                         </div>


//                                                         {payment.reference_number && (
//                                                             <div className="rems-table-secondary mt-1">
//                                                                 Reference:
//                                                                 {" "}
//                                                                 {
//                                                                     payment.reference_number
//                                                                 }
//                                                             </div>
//                                                         )}

//                                                     </div>


//                                                     <div className="d-flex flex-wrap gap-2">

//                                                         {payment.proof && (
//                                                             <a
//                                                                 href={
//                                                                     payment.proof
//                                                                 }
//                                                                 target="_blank"
//                                                                 rel="noreferrer"
//                                                                 className="rems-secondary-button"
//                                                             >
//                                                                 Proof
//                                                             </a>
//                                                         )}


//                                                         {status ===
//                                                             "PENDING" &&
//                                                             !isRefund && (
//                                                                 <button
//                                                                     type="button"
//                                                                     className="rems-primary-button"
//                                                                     onClick={() =>
//                                                                         verifyPayment(
//                                                                             payment
//                                                                         )
//                                                                     }
//                                                                     disabled={
//                                                                         processingId ===
//                                                                         selected.id
//                                                                     }
//                                                                 >
//                                                                     Verify
//                                                                 </button>
//                                                             )}

//                                                     </div>

//                                                 </div>
//                                             );
//                                         }
//                                     )}

//                                 </div>
//                             )}


//                             {/* =================================================
//                                 FACILITY USE
//                             ================================================= */}

//                             {normalizeStatus(
//                                 selected.status
//                             ) ===
//                                 "APPROVED" &&
//                                 selected.security_clearance_completed && (
//                                     <div className="rems-form-section mb-3">

//                                         <div className="rems-form-section-title">
//                                             Facility Use
//                                         </div>

//                                         <button
//                                             type="button"
//                                             className="rems-primary-button"
//                                             onClick={() =>
//                                                 runAction(
//                                                     selected.id,
//                                                     startFacilityUse
//                                                 )
//                                             }
//                                             disabled={
//                                                 processingId ===
//                                                 selected.id
//                                             }
//                                         >
//                                             Start Use
//                                         </button>

//                                     </div>
//                                 )}


//                             {/* =================================================
//                                 COMPLETE EVENT
//                             ================================================= */}

//                             {normalizeStatus(
//                                 selected.status
//                             ) ===
//                                 "IN_USE" && (
//                                 <div className="rems-form-section mb-3">

//                                     <div className="rems-form-section-title">
//                                         Complete Event
//                                     </div>

//                                     <button
//                                         type="button"
//                                         className="rems-primary-button"
//                                         onClick={() =>
//                                             runAction(
//                                                 selected.id,
//                                                 completeFacilityBooking
//                                             )
//                                         }
//                                         disabled={
//                                             processingId ===
//                                             selected.id
//                                         }
//                                     >
//                                         Complete Booking
//                                     </button>

//                                 </div>
//                             )}


//                             {/* =================================================
//                                 INSPECTION
//                             ================================================= */}

//                             {normalizeStatus(
//                                 selected.status
//                             ) ===
//                                 "INSPECTION_PENDING" && (
//                                 <div className="rems-form-section mb-3">

//                                     <div className="rems-form-section-title">
//                                         Post-Event Inspection
//                                     </div>

//                                     <div className="row g-3">

//                                         <div className="col-12 col-md-4">

//                                             <label className="rems-form-label">
//                                                 Result
//                                             </label>

//                                             <select
//                                                 className="form-select rems-form-control"
//                                                 value={
//                                                     inspection.result
//                                                 }
//                                                 onChange={(event) =>
//                                                     setInspection(
//                                                         (
//                                                             previous
//                                                         ) => ({
//                                                             ...previous,
//                                                             result:
//                                                                 event
//                                                                     .target
//                                                                     .value,
//                                                         })
//                                                     )
//                                                 }
//                                                 disabled={
//                                                     processingId ===
//                                                     selected.id
//                                                 }
//                                             >
//                                                 <option value="PASSED">
//                                                     Passed
//                                                 </option>

//                                                 <option value="DAMAGE_FOUND">
//                                                     Damage Found
//                                                 </option>

//                                                 <option value="CLEANUP_REQUIRED">
//                                                     Cleanup Required
//                                                 </option>
//                                             </select>

//                                         </div>


//                                         <div className="col-12 col-md-4">

//                                             <label className="rems-form-label">
//                                                 Deduction
//                                             </label>

//                                             <input
//                                                 type="number"
//                                                 min="0"
//                                                 step="0.01"
//                                                 className="form-control rems-form-control"
//                                                 value={
//                                                     inspection.deduction_amount
//                                                 }
//                                                 onChange={(event) =>
//                                                     setInspection(
//                                                         (
//                                                             previous
//                                                         ) => ({
//                                                             ...previous,
//                                                             deduction_amount:
//                                                                 event
//                                                                     .target
//                                                                     .value,
//                                                         })
//                                                     )
//                                                 }
//                                                 disabled={
//                                                     processingId ===
//                                                     selected.id
//                                                 }
//                                             />

//                                         </div>


//                                         <div className="col-12 col-md-4 d-flex align-items-end">

//                                             <button
//                                                 type="button"
//                                                 className="rems-primary-button w-100"
//                                                 onClick={
//                                                     inspect
//                                                 }
//                                                 disabled={
//                                                     processingId ===
//                                                     selected.id
//                                                 }
//                                             >
//                                                 Record Inspection
//                                             </button>

//                                         </div>


//                                         <div className="col-12">

//                                             <label className="rems-form-label">
//                                                 Inspection Notes
//                                             </label>

//                                             <textarea
//                                                 rows="3"
//                                                 className="form-control rems-form-control"
//                                                 placeholder="Inspection notes"
//                                                 value={
//                                                     inspection.notes
//                                                 }
//                                                 onChange={(event) =>
//                                                     setInspection(
//                                                         (
//                                                             previous
//                                                         ) => ({
//                                                             ...previous,
//                                                             notes:
//                                                                 event
//                                                                     .target
//                                                                     .value,
//                                                         })
//                                                     )
//                                                 }
//                                                 disabled={
//                                                     processingId ===
//                                                     selected.id
//                                                 }
//                                             />

//                                         </div>

//                                     </div>

//                                 </div>
//                             )}


//                             {/* =================================================
//                                 REFUND
//                             ================================================= */}

//                             {normalizeStatus(
//                                 selected.status
//                             ) ===
//                                 "REFUND_PENDING" && (
//                                 <div className="rems-form-section mb-3">

//                                     <div className="rems-form-section-title">
//                                         Security Deposit Refund
//                                     </div>


//                                     <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">

//                                         <div>

//                                             <div className="rems-table-secondary">
//                                                 Refund Amount
//                                             </div>

//                                             <div className="rems-table-primary">
//                                                 ₱
//                                                 {money(
//                                                     selected.inspection?.refund_amount
//                                                 )}
//                                             </div>

//                                         </div>


//                                         <button
//                                             type="button"
//                                             className="rems-primary-button"
//                                             onClick={() =>
//                                                 runAction(
//                                                     selected.id,
//                                                     refundFacilityDeposit,
//                                                     {
//                                                         payment_method:
//                                                             "CASH",
//                                                     }
//                                                 )
//                                             }
//                                             disabled={
//                                                 processingId ===
//                                                 selected.id
//                                             }
//                                         >
//                                             Refund Deposit
//                                         </button>

//                                     </div>

//                                 </div>
//                             )}


//                         </div>


//                         {/* =================================================
//                             MODAL FOOTER
//                         ================================================= */}

//                         <div className="rems-modal-footer">

//                             <button
//                                 type="button"
//                                 className="rems-secondary-button"
//                                 onClick={
//                                     refreshSelected
//                                 }
//                                 disabled={
//                                     processingId ===
//                                     selected.id
//                                 }
//                             >
//                                 <BsArrowClockwise />

//                                 Refresh Details
//                             </button>


//                             <button
//                                 type="button"
//                                 className="rems-secondary-button"
//                                 onClick={() =>
//                                     setSelected(
//                                         null
//                                     )
//                                 }
//                             >
//                                 Close
//                             </button>

//                         </div>

//                     </div>

//                 </div>
//             )}

//         </div>
//     );
// }


// import {
//     useCallback,
//     useEffect,
//     useMemo,
//     useRef,
//     useState,
// } from "react";

// import {
//     BsArrowClockwise,
//     BsCheck2Circle,
//     BsClockHistory,
//     BsEye,
//     BsFileEarmarkSpreadsheet,
//     BsLock,
//     BsPeople,
//     BsPersonCheck,
//     BsShieldCheck,
//     BsXCircle,
//     BsExclamationTriangle,
//     BsCashStack,
//     BsClipboardCheck,
// } from "react-icons/bs";

// import {
//     getFacilityBookings,
//     getBookingGuests,
//     getBookingPayments,
//     approveFacilityBooking,
//     rejectFacilityBooking,
//     startFacilityUse,
//     completeFacilityBooking,
//     completeFacilitySecurityClearance,
//     inspectFacilityBooking,
//     refundFacilityDeposit,
//     verifyBookingPayment,
// } from "../../api/facilities";


// /* ============================================================
//    HELPERS
// ============================================================ */

// const normalize = (response) => {
//     if (Array.isArray(response)) {
//         return response;
//     }

//     return response?.results || [];
// };


// const normalizeStatus = (value) => {
//     return String(value || "")
//         .trim()
//         .toUpperCase();
// };


// const money = (value) => {
//     const amount = Number(value || 0);

//     if (!Number.isFinite(amount)) {
//         return "0.00";
//     }

//     return amount.toLocaleString(
//         undefined,
//         {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2,
//         }
//     );
// };


// const formatDateTime = (value) => {
//     if (!value) {
//         return "—";
//     }

//     const date = new Date(value);

//     if (Number.isNaN(date.getTime())) {
//         return String(value);
//     }

//     return date.toLocaleString();
// };


// const getErrorMessage = (
//     error,
//     fallback = "Unable to complete the request."
// ) => {
//     const data = error?.response?.data;

//     if (typeof data === "string") {
//         return data;
//     }

//     if (data?.detail) {
//         return String(data.detail);
//     }

//     if (data?.message) {
//         return String(data.message);
//     }

//     if (data && typeof data === "object") {
//         const preferredFields = [
//             "booking",
//             "guest",
//             "full_name",
//             "vehicle_plate_number",
//             "vehicle_model",
//             "payment",
//             "amount",
//             "reference_number",
//             "proof",
//             "result",
//             "notes",
//             "deduction_amount",
//         ];

//         for (const field of preferredFields) {
//             const value = data?.[field];

//             if (
//                 Array.isArray(value) &&
//                 value.length > 0
//             ) {
//                 return String(value[0]);
//             }

//             if (
//                 typeof value === "string" &&
//                 value.trim()
//             ) {
//                 return value;
//             }
//         }

//         const firstError =
//             Object.values(data)
//                 .flat()
//                 .find(
//                     (value) =>
//                         value !== null &&
//                         value !== undefined &&
//                         String(value).trim()
//                 );

//         if (firstError) {
//             return String(firstError);
//         }
//     }

//     if (error?.message) {
//         return String(error.message);
//     }

//     return fallback;
// };


// const getStatusClass = (value) => {
//     switch (
//         normalizeStatus(value)
//     ) {
//         case "PENCIL":
//             return "rems-status-warning";

//         case "PENDING":
//             return "rems-status-warning";

//         case "APPROVED":
//             return "rems-status-success";

//         case "IN_USE":
//             return "rems-status-success";

//         case "INSPECTION_PENDING":
//             return "rems-status-warning";

//         case "REFUND_PENDING":
//             return "rems-status-warning";

//         case "CLOSED":
//             return "rems-status-secondary";

//         case "REJECTED":
//             return "rems-status-danger";

//         case "CANCELLED":
//             return "rems-status-danger";

//         case "EXPIRED":
//             return "rems-status-secondary";

//         default:
//             return "rems-status-secondary";
//     }
// };


// const statusLabel = (value) => {
//     const normalized =
//         normalizeStatus(value);

//     const labels = {
//         PENCIL: "Pencil",
//         PENDING: "Pending Approval",
//         APPROVED: "Approved",
//         IN_USE: "In Use",
//         INSPECTION_PENDING: "Inspection Pending",
//         REFUND_PENDING: "Refund Pending",
//         CLOSED: "Closed",
//         REJECTED: "Rejected",
//         CANCELLED: "Cancelled",
//         EXPIRED: "Expired",
//     };

//     return (
//         labels[normalized] ||
//         value ||
//         "—"
//     );
// };


// const isBookingOverdue = (booking) => {
//     if (!booking) {
//         return false;
//     }

//     if (
//         !booking.booking_date ||
//         !booking.end_time
//     ) {
//         return false;
//     }

//     const end = new Date(
//         `${booking.booking_date}T${booking.end_time}`
//     );

//     if (
//         Number.isNaN(
//             end.getTime()
//         )
//     ) {
//         return false;
//     }

//     return (
//         Date.now() >
//         end.getTime()
//     );
// };


// /* ============================================================
//    COMPONENT
// ============================================================ */

// export default function FacilityBookings() {

//     /* ========================================================
//        BOOKING COLLECTION
//     ======================================================== */

//     const [
//         bookings,
//         setBookings,
//     ] = useState([]);


//     /* ========================================================
//        PAGE STATE
//     ======================================================== */

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
//         selected,
//         setSelected,
//     ] = useState(null);


//     const [
//         processingId,
//         setProcessingId,
//     ] = useState(null);


//     const [
//         search,
//         setSearch,
//     ] = useState("");


//     const [
//         statusFilter,
//         setStatusFilter,
//     ] = useState("ALL");


//     const errorRef =
//         useRef(null);


//     /* ========================================================
//        INSPECTION FORM
//     ======================================================== */

//     const [
//         inspection,
//         setInspection,
//     ] = useState({
//         result: "PASSED",
//         notes: "",
//         deduction_amount: "0",
//     });


//     /* ========================================================
//        LOAD BOOKINGS
//     ======================================================== */

//     const loadBookings =
//         useCallback(
//             async (
//                 refresh = false
//             ) => {
//                 if (refresh) {
//                     setRefreshing(true);
//                 } else {
//                     setLoading(true);
//                 }

//                 setError("");

//                 try {
//                     const response =
//                         await getFacilityBookings();

//                     const rows =
//                         normalize(
//                             response
//                         );

//                     setBookings(
//                         rows
//                     );

//                     /*
//                      * Keep the selected booking synchronized
//                      * with the latest server response.
//                      */
//                     if (
//                         selected?.id
//                     ) {
//                         const updated =
//                             rows.find(
//                                 (item) =>
//                                     String(
//                                         item.id
//                                     ) ===
//                                     String(
//                                         selected.id
//                                     )
//                             );

//                         if (
//                             updated
//                         ) {
//                             setSelected(
//                                 updated
//                             );
//                         }
//                     }
//                 } catch (err) {
//                     console.error(
//                         "[Admin Facility Bookings] Load:",
//                         err
//                     );

//                     setError(
//                         getErrorMessage(
//                             err,
//                             "Unable to load facility bookings."
//                         )
//                     );
//                 } finally {
//                     setLoading(false);
//                     setRefreshing(false);
//                 }
//             },
//             [
//                 selected?.id,
//             ]
//         );


//     /* ========================================================
//        INITIAL LOAD
//     ======================================================== */

//     useEffect(
//         () => {
//             loadBookings();
//         },
//         [
//             loadBookings,
//         ]
//     );


//     /* ========================================================
//        AUTO REFRESH
//        Keeps admin status current without requiring a manual
//        refresh, especially when a Pencil booking expires.
//     ======================================================== */

//     useEffect(
//         () => {
//             const interval =
//                 window.setInterval(
//                     () => {
//                         loadBookings(
//                             true
//                         );
//                     },
//                     30000
//                 );

//             return () => {
//                 window.clearInterval(
//                     interval
//                 );
//             };
//         },
//         [
//             loadBookings,
//         ]
//     );


//     /* ========================================================
//        AUTO-SCROLL ERROR
//     ======================================================== */

//     useEffect(
//         () => {
//             if (!error) {
//                 return undefined;
//             }

//             const timer =
//                 window.setTimeout(
//                     () => {
//                         errorRef.current?.scrollIntoView(
//                             {
//                                 behavior: "smooth",
//                                 block: "center",
//                             }
//                         );
//                     },
//                     50
//                 );

//             return () => {
//                 window.clearTimeout(
//                     timer
//                 );
//             };
//         },
//         [
//             error,
//         ]
//     );


//     /* ========================================================
//        REFRESH SELECTED BOOKING
//     ======================================================== */

//     const refreshSelected =
//         async () => {
//             if (
//                 !selected?.id
//             ) {
//                 return;
//             }

//             setError("");

//             try {
//                 const [
//                     bookingsResponse,
//                     guestsResponse,
//                     paymentsResponse,
//                 ] = await Promise.all([
//                     getFacilityBookings(),
//                     getBookingGuests(
//                         selected.id
//                     ),
//                     getBookingPayments(
//                         selected.id
//                     ),
//                 ]);

//                 const rows =
//                     normalize(
//                         bookingsResponse
//                     );

//                 setBookings(
//                     rows
//                 );

//                 const updated =
//                     rows.find(
//                         (item) =>
//                             String(
//                                 item.id
//                             ) ===
//                             String(
//                                 selected.id
//                             )
//                     );

//                 if (!updated) {
//                     setSelected(
//                         null
//                     );

//                     return;
//                 }

//                 const bookingId =
//                     String(
//                         updated.id
//                     );

//                 const guests =
//                     normalize(
//                         guestsResponse
//                     ).filter(
//                         (item) =>
//                             String(
//                                 item?.booking
//                             ) ===
//                             bookingId
//                     );

//                 const payments =
//                     normalize(
//                         paymentsResponse
//                     ).filter(
//                         (item) =>
//                             String(
//                                 item?.booking
//                             ) ===
//                             bookingId
//                     );

//                 setSelected({
//                     ...updated,
//                     guests,
//                     payments,
//                 });
//             } catch (err) {
//                 console.error(
//                     "[Admin Facility Bookings] Refresh selected:",
//                     err
//                 );

//                 setError(
//                     getErrorMessage(
//                         err,
//                         "Unable to refresh booking details."
//                     )
//                 );
//             }
//         };


//     /* ========================================================
//        OPEN BOOKING
//     ======================================================== */

//     const openBooking =
//         async (
//             booking
//         ) => {
//             setError("");

//             /*
//              * Clear previous booking details first.
//              *
//              * This prevents guests/payments from booking A
//              * appearing while booking B is being loaded.
//              */
//             setSelected({
//                 ...booking,
//                 guests: [],
//                 payments: [],
//             });

//             setInspection({
//                 result: "PASSED",
//                 notes: "",
//                 deduction_amount: "0",
//             });

//             try {
//                 const [
//                     guestsResponse,
//                     paymentsResponse,
//                 ] = await Promise.all([
//                     getBookingGuests(
//                         booking.id
//                     ),
//                     getBookingPayments(
//                         booking.id
//                     ),
//                 ]);

//                 const bookingId =
//                     String(
//                         booking.id
//                     );

//                 const guests =
//                     normalize(
//                         guestsResponse
//                     ).filter(
//                         (item) =>
//                             String(
//                                 item?.booking
//                             ) ===
//                             bookingId
//                     );

//                 const payments =
//                     normalize(
//                         paymentsResponse
//                     ).filter(
//                         (item) =>
//                             String(
//                                 item?.booking
//                             ) ===
//                             bookingId
//                     );

//                 setSelected(
//                     {
//                         ...booking,
//                         guests,
//                         payments,
//                     }
//                 );
//             } catch (err) {
//                 console.error(
//                     "[Admin Facility Bookings] Open booking:",
//                     err
//                 );

//                 setError(
//                     getErrorMessage(
//                         err,
//                         "Unable to load booking details."
//                     )
//                 );
//             }
//         };


//     /* ========================================================
//        GENERIC ACTION
//     ======================================================== */

//     const runAction =
//         async (
//             id,
//             action,
//             payload,
//             keepSelected = false
//         ) => {
//             if (
//                 processingId
//             ) {
//                 return;
//             }

//             setProcessingId(
//                 id
//             );

//             setError("");

//             try {
//                 const updated =
//                     await action(
//                         id,
//                         payload
//                     );

//                 if (
//                     keepSelected &&
//                     updated
//                 ) {
//                     setSelected(
//                         updated
//                     );
//                 }

//                 await loadBookings(
//                     true
//                 );

//                 if (
//                     keepSelected
//                 ) {
//                     await refreshSelected();
//                 } else {
//                     setSelected(
//                         null
//                     );
//                 }
//             } catch (err) {
//                 console.error(
//                     "[Admin Facility Booking] Action:",
//                     err
//                 );

//                 setError(
//                     getErrorMessage(
//                         err,
//                         "Unable to complete the action."
//                     )
//                 );
//             } finally {
//                 setProcessingId(
//                     null
//                 );
//             }
//         };


//     /* ========================================================
//        APPROVE PAYMENT
//     ======================================================== */

//     const approvePayment =
//         async (
//             payment
//         ) => {
//             if (
//                 !selected?.id ||
//                 !payment?.id
//             ) {
//                 return;
//             }

//             setProcessingId(
//                 selected.id
//             );

//             setError("");

//             try {
//                 await verifyBookingPayment(
//                     payment.id
//                 );

//                 await loadBookings(
//                     true
//                 );

//                 await refreshSelected();
//             } catch (err) {
//                 console.error(
//                     "[Admin Facility Bookings] Payment verification:",
//                     err
//                 );

//                 setError(
//                     getErrorMessage(
//                         err,
//                         "Unable to verify payment."
//                     )
//                 );
//             } finally {
//                 setProcessingId(
//                     null
//                 );
//             }
//         };


//     /* ========================================================
//        SECURITY CLEARANCE
//     ======================================================== */

//     const completeSecurityClearance =
//         async () => {
//             if (
//                 !selected?.id
//             ) {
//                 return;
//             }

//             const selectedStatus =
//                 normalizeStatus(
//                     selected.status
//                 );

//             if (
//                 selectedStatus !==
//                 "APPROVED"
//             ) {
//                 setError(
//                     "Security clearance can only be completed after the booking has been approved."
//                 );

//                 return;
//             }

//             if (
//                 selected.security_clearance_completed
//             ) {
//                 setError(
//                     "Security clearance has already been completed for this booking."
//                 );

//                 return;
//             }

//             if (
//                 isBookingOverdue(
//                     selected
//                 )
//             ) {
//                 setError(
//                     "Security clearance cannot be completed because the booking has already passed its scheduled end time."
//                 );

//                 return;
//             }

//             await runAction(
//                 selected.id,
//                 completeFacilitySecurityClearance,
//                 undefined,
//                 true
//             );
//         };


//     /* ========================================================
//        INSPECTION
//     ======================================================== */

//     const inspect =
//         async () => {
//             if (
//                 !selected?.id
//             ) {
//                 return;
//             }

//             const deduction =
//                 Number(
//                     inspection.deduction_amount ||
//                     0
//                 );

//             if (
//                 !Number.isFinite(
//                     deduction
//                 ) ||
//                 deduction < 0
//             ) {
//                 setError(
//                     "Inspection deduction must be a valid non-negative amount."
//                 );

//                 return;
//             }

//             await runAction(
//                 selected.id,
//                 inspectFacilityBooking,
//                 {
//                     result:
//                         inspection.result,

//                     notes:
//                         String(
//                             inspection.notes ||
//                             ""
//                         ).trim(),

//                     deduction_amount:
//                         deduction,
//                 },
//                 true
//             );

//             setInspection({
//                 result: "PASSED",
//                 notes: "",
//                 deduction_amount: "0",
//             });
//         };


//     /* ========================================================
//        FILTERED BOOKINGS
//     ======================================================== */

//     const filteredBookings =
//         useMemo(
//             () => {
//                 const query =
//                     String(
//                         search ||
//                         ""
//                     )
//                         .trim()
//                         .toLowerCase();

//                 const selectedStatus =
//                     normalizeStatus(
//                         statusFilter
//                     );

//                 return bookings.filter(
//                     (booking) => {
//                         const bookingStatus =
//                             normalizeStatus(
//                                 booking?.status
//                             );

//                         if (
//                             selectedStatus !==
//                                 "ALL" &&
//                             bookingStatus !==
//                                 selectedStatus
//                         ) {
//                             return false;
//                         }

//                         if (!query) {
//                             return true;
//                         }

//                         const searchable =
//                             [
//                                 booking?.id,
//                                 booking?.resident_name,
//                                 booking?.facility_name,
//                                 booking?.booking_date,
//                                 booking?.start_time,
//                                 booking?.end_time,
//                                 booking?.event_type,
//                                 booking?.event_type_display,
//                                 booking?.event_description,
//                                 bookingStatus,
//                             ]
//                                 .filter(Boolean)
//                                 .join(" ")
//                                 .toLowerCase();

//                         return searchable.includes(
//                             query
//                         );
//                     }
//                 );
//             },
//             [
//                 bookings,
//                 search,
//                 statusFilter,
//             ]
//         );


//     /* ========================================================
//        STATISTICS
//     ======================================================== */

//     const stats =
//         useMemo(
//             () => {
//                 const rows =
//                     bookings.map(
//                         (booking) => ({
//                             ...booking,
//                             status:
//                                 normalizeStatus(
//                                     booking?.status
//                                 ),
//                         })
//                     );

//                 return {
//                     pencil:
//                         rows.filter(
//                             (item) =>
//                                 item.status ===
//                                 "PENCIL"
//                         ).length,

//                     pending:
//                         rows.filter(
//                             (item) =>
//                                 item.status ===
//                                 "PENDING"
//                         ).length,

//                     approved:
//                         rows.filter(
//                             (item) =>
//                                 item.status ===
//                                 "APPROVED"
//                         ).length,

//                     inUse:
//                         rows.filter(
//                             (item) =>
//                                 item.status ===
//                                 "IN_USE"
//                         ).length,

//                     inspection:
//                         rows.filter(
//                             (item) =>
//                                 item.status ===
//                                 "INSPECTION_PENDING"
//                         ).length,

//                     refunds:
//                         rows.filter(
//                             (item) =>
//                                 item.status ===
//                                 "REFUND_PENDING"
//                         ).length,

//                     closed:
//                         rows.filter(
//                             (item) =>
//                                 item.status ===
//                                 "CLOSED"
//                         ).length,

//                     rejected:
//                         rows.filter(
//                             (item) =>
//                                 item.status ===
//                                 "REJECTED"
//                         ).length,

//                     cancelled:
//                         rows.filter(
//                             (item) =>
//                                 item.status ===
//                                 "CANCELLED"
//                         ).length,
//                 };
//             },
//             [
//                 bookings,
//             ]
//         );


//     /* ========================================================
//        SELECTED DERIVED DATA
//     ======================================================== */

//     const selectedStatus =
//         normalizeStatus(
//             selected?.status
//         );


//     const selectedGuests =
//         Array.isArray(
//             selected?.guests
//         )
//             ? selected.guests
//             : [];


//     const selectedPayments =
//         Array.isArray(
//             selected?.payments
//         )
//             ? selected.payments
//             : [];


//     const bookingTotalPayments =
//         selectedPayments.filter(
//             (payment) =>
//                 normalizeStatus(
//                     payment?.payment_type
//                 ) ===
//                 "BOOKING_TOTAL"
//         );


//     const latestBookingPayment =
//         bookingTotalPayments.length > 0
//             ? bookingTotalPayments[
//                 bookingTotalPayments.length - 1
//             ]
//             : null;


//     const verifiedBookingPayment =
//         bookingTotalPayments.find(
//             (payment) =>
//                 normalizeStatus(
//                     payment?.status
//                 ) ===
//                 "VERIFIED"
//         );


//     const pendingBookingPayment =
//         bookingTotalPayments.find(
//             (payment) =>
//                 normalizeStatus(
//                     payment?.status
//                 ) ===
//                 "PENDING"
//         );


//     const totalDue =
//         Number(
//             selected?.total_amount_due ||
//             0
//         );


//     const verifiedAmount =
//         bookingTotalPayments
//             .filter(
//                 (payment) =>
//                     normalizeStatus(
//                         payment?.status
//                     ) ===
//                     "VERIFIED"
//             )
//             .reduce(
//                 (
//                     total,
//                     payment
//                 ) =>
//                     total +
//                     Number(
//                         payment?.amount ||
//                         0
//                     ),
//                 0
//             );


//     const guestLimit =
//         Number(
//             selected?.estimated_guests ||
//             0
//         );


//     const guestCount =
//         selectedGuests.length;


//     const securityCleared =
//         Boolean(
//             selected?.security_clearance_completed
//         );


//     const processingSelected =
//         processingId ===
//         selected?.id;


//     /* ========================================================
//        APPROVAL READINESS
//     ======================================================== */

//     const approvalIssues =
//         useMemo(
//             () => {
//                 if (
//                     selectedStatus !==
//                     "PENDING"
//                 ) {
//                     return [];
//                 }

//                 const issues = [];

//                 if (
//                     totalDue > 0 &&
//                     !verifiedBookingPayment
//                 ) {
//                     if (
//                         pendingBookingPayment
//                     ) {
//                         issues.push(
//                             "Full booking payment is submitted but has not yet been verified."
//                         );
//                     } else {
//                         issues.push(
//                             "Full booking payment must be verified before approval."
//                         );
//                     }
//                 }

//                 if (
//                     guestCount <= 0
//                 ) {
//                     issues.push(
//                         "A guest list is required before approval."
//                     );
//                 }

//                 if (
//                     guestLimit > 0 &&
//                     guestCount >
//                     guestLimit
//                 ) {
//                     issues.push(
//                         "The guest list exceeds the booking guest limit."
//                     );
//                 }

//                 return issues;
//             },
//             [
//                 selectedStatus,
//                 totalDue,
//                 verifiedBookingPayment,
//                 pendingBookingPayment,
//                 guestCount,
//                 guestLimit,
//             ]
//         );


//     const canApprove =
//         selectedStatus ===
//             "PENDING" &&
//         approvalIssues.length ===
//             0 &&
//         !securityCleared;


//     /* ========================================================
//        RENDER
//     ======================================================== */

//     return (
//         <div className="rems-page-content">

//             {/* ==================================================
//                 HEADER
//             ================================================== */}

//             <div className="rems-page-header">

//                 <div>
//                     <div className="rems-page-eyebrow">
//                         ADMINISTRATION
//                     </div>

//                     <h1 className="rems-page-title">
//                         Facility Bookings
//                     </h1>

//                     <p className="rems-page-description">
//                         Review resident facility reservations,
//                         verify payments, review guest lists,
//                         complete security clearance, manage facility
//                         use, inspections, and security-deposit refunds.
//                     </p>
//                 </div>


//                 <button
//                     type="button"
//                     className="rems-secondary-button"
//                     onClick={() =>
//                         loadBookings(true)
//                     }
//                     disabled={
//                         refreshing ||
//                         Boolean(processingId)
//                     }
//                 >
//                     <BsArrowClockwise />

//                     {refreshing
//                         ? "Refreshing..."
//                         : "Refresh"}
//                 </button>

//             </div>


//             {/* ==================================================
//                 ERROR
//             ================================================== */}

//             {error && (
//                 <div
//                     ref={errorRef}
//                     tabIndex={-1}
//                     className="alert alert-danger rems-alert mb-4"
//                     role="alert"
//                     style={{
//                         outline: "none",
//                         scrollMarginTop: "24px",
//                     }}
//                 >
//                     <div className="d-flex align-items-start gap-2">

//                         <BsExclamationTriangle className="mt-1 flex-shrink-0" />

//                         <div className="flex-grow-1">
//                             <div className="fw-semibold">
//                                 Facility Booking Error
//                             </div>

//                             <div className="small mt-1">
//                                 {error}
//                             </div>
//                         </div>

//                         <button
//                             type="button"
//                             className="btn-close"
//                             aria-label="Close"
//                             onClick={() =>
//                                 setError("")
//                             }
//                         />

//                     </div>
//                 </div>
//             )}


//             {/* ==================================================
//                 STATISTICS
//             ================================================== */}

//             <div className="row g-3 mb-4">

//                 {[
//                     [
//                         "Pencil Holds",
//                         stats.pencil,
//                     ],
//                     [
//                         "Pending Approval",
//                         stats.pending,
//                     ],
//                     [
//                         "Approved",
//                         stats.approved,
//                     ],
//                     [
//                         "In Use",
//                         stats.inUse,
//                     ],
//                     [
//                         "Inspection Pending",
//                         stats.inspection,
//                     ],
//                     [
//                         "Refund Pending",
//                         stats.refunds,
//                     ],
//                 ].map(
//                     ([
//                         label,
//                         value,
//                     ]) => (
//                         <div
//                             className="col-6 col-md-4 col-xl-2"
//                             key={label}
//                         >
//                             <div className="rems-stat-card h-100">

//                                 <div className="rems-stat-content">

//                                     <div className="rems-stat-label">
//                                         {label}
//                                     </div>

//                                     <div className="rems-stat-value">
//                                         {value}
//                                     </div>

//                                 </div>

//                             </div>
//                         </div>
//                     )
//                 )}

//             </div>


//             {/* ==================================================
//                 FILTER BAR
//             ================================================== */}

//             <div className="rems-glass-card mb-3">

//                 <div className="p-3">

//                     <div className="row g-2">

//                         <div className="col-12 col-lg-8">

//                             <label className="rems-form-label">
//                                 Search Bookings
//                             </label>

//                             <input
//                                 type="search"
//                                 className="form-control rems-form-control"
//                                 placeholder="Search resident, facility, booking date, event, or status..."
//                                 value={search}
//                                 onChange={(event) =>
//                                     setSearch(
//                                         event.target.value
//                                     )
//                                 }
//                             />

//                         </div>


//                         <div className="col-12 col-lg-4">

//                             <label className="rems-form-label">
//                                 Status
//                             </label>

//                             <select
//                                 className="form-select rems-form-control"
//                                 value={statusFilter}
//                                 onChange={(event) =>
//                                     setStatusFilter(
//                                         event.target.value
//                                     )
//                                 }
//                             >
//                                 <option value="ALL">
//                                     All Statuses
//                                 </option>

//                                 <option value="PENCIL">
//                                     Pencil
//                                 </option>

//                                 <option value="PENDING">
//                                     Pending Approval
//                                 </option>

//                                 <option value="APPROVED">
//                                     Approved
//                                 </option>

//                                 <option value="IN_USE">
//                                     In Use
//                                 </option>

//                                 <option value="INSPECTION_PENDING">
//                                     Inspection Pending
//                                 </option>

//                                 <option value="REFUND_PENDING">
//                                     Refund Pending
//                                 </option>

//                                 <option value="CLOSED">
//                                     Closed
//                                 </option>

//                                 <option value="REJECTED">
//                                     Rejected
//                                 </option>

//                                 <option value="CANCELLED">
//                                     Cancelled
//                                 </option>
//                             </select>

//                         </div>

//                     </div>

//                 </div>

//             </div>


//             {/* ==================================================
//                 BOOKING TABLE
//             ================================================== */}

//             <div className="rems-glass-card">

//                 {loading ? (

//                     <div className="rems-loading-state">

//                         <div
//                             className="spinner-border"
//                             role="status"
//                         />

//                         <div className="mt-3">
//                             Loading facility bookings...
//                         </div>

//                     </div>

//                 ) : filteredBookings.length === 0 ? (

//                     <div className="rems-empty-state py-5">

//                         <div className="rems-empty-icon">
//                             <BsClipboardCheck />
//                         </div>

//                         <div className="rems-empty-title">
//                             No facility bookings found
//                         </div>

//                         <div className="rems-empty-text">
//                             No bookings match the current
//                             search or status filter.
//                         </div>

//                     </div>

//                 ) : (

//                     <div className="rems-table-wrapper">

//                         <table className="table rems-table align-middle mb-0">

//                             <thead>

//                                 <tr>
//                                     <th>Resident</th>
//                                     <th>Facility</th>
//                                     <th>Schedule</th>
//                                     <th>Guests</th>
//                                     <th>Payment</th>
//                                     <th>Status</th>
//                                     <th className="text-end">
//                                         Actions
//                                     </th>
//                                 </tr>

//                             </thead>


//                             <tbody>

//                                 {filteredBookings.map(
//                                     (booking) => {

//                                         const bookingStatus =
//                                             normalizeStatus(
//                                                 booking?.status
//                                             );

//                                         const bookingPaymentStatus =
//                                             booking?.payment_verified
//                                                 ? "VERIFIED"
//                                                 : booking?.payment_submitted
//                                                     ? "PENDING"
//                                                     : "NOT_SUBMITTED";

//                                         return (
//                                             <tr
//                                                 key={
//                                                     booking.id
//                                                 }
//                                             >

//                                                 {/* RESIDENT */}

//                                                 <td data-label="Resident">

//                                                     <div className="rems-table-primary">
//                                                         {booking.resident_name ||
//                                                             "Unknown Resident"}
//                                                     </div>

//                                                     <div className="rems-table-secondary">
//                                                         Booking #
//                                                         {booking.id}
//                                                     </div>

//                                                 </td>


//                                                 {/* FACILITY */}

//                                                 <td data-label="Facility">

//                                                     <div className="rems-table-primary">
//                                                         {booking.facility_name ||
//                                                             "—"}
//                                                     </div>

//                                                     <div className="rems-table-secondary">
//                                                         {booking.event_type_display ||
//                                                             booking.event_type ||
//                                                             "Facility Booking"}
//                                                     </div>

//                                                 </td>


//                                                 {/* SCHEDULE */}

//                                                 <td data-label="Schedule">

//                                                     <div className="rems-table-primary">
//                                                         {booking.booking_date ||
//                                                             "—"}
//                                                     </div>

//                                                     <div className="rems-table-secondary">
//                                                         {booking.start_time ||
//                                                             "—"}

//                                                         {" — "}

//                                                         {booking.end_time ||
//                                                             "—"}
//                                                     </div>

//                                                 </td>


//                                                 {/* GUESTS */}

//                                                 <td data-label="Guests">

//                                                     <div className="rems-table-primary">
//                                                         {booking.guest_count ??
//                                                             booking.estimated_guests ??
//                                                             0}
//                                                     </div>

//                                                     <div className="rems-table-secondary">
//                                                         /
//                                                         {" "}
//                                                         {booking.estimated_guests ||
//                                                             0}
//                                                     </div>

//                                                 </td>


//                                                 {/* PAYMENT */}

//                                                 <td data-label="Payment">

//                                                     {bookingPaymentStatus ===
//                                                     "VERIFIED" ? (

//                                                         <span className="rems-status-badge rems-status-success">
//                                                             <span className="rems-status-dot" />
//                                                             Verified
//                                                         </span>

//                                                     ) : bookingPaymentStatus ===
//                                                     "PENDING" ? (

//                                                         <span className="rems-status-badge rems-status-warning">
//                                                             <span className="rems-status-dot" />
//                                                             Pending
//                                                         </span>

//                                                     ) : (

//                                                         <span className="rems-status-badge rems-status-secondary">
//                                                             <span className="rems-status-dot" />
//                                                             Not Submitted
//                                                         </span>

//                                                     )}

//                                                 </td>


//                                                 {/* STATUS */}

//                                                 <td data-label="Status">

//                                                     <span
//                                                         className={`rems-status-badge ${getStatusClass(
//                                                             bookingStatus
//                                                         )}`}
//                                                     >
//                                                         <span className="rems-status-dot" />

//                                                         {statusLabel(
//                                                             booking.status_display ||
//                                                             bookingStatus
//                                                         )}
//                                                     </span>

//                                                 </td>


//                                                 {/* ACTIONS */}

//                                                 <td data-label="Actions">

//                                                     <div className="d-flex justify-content-end gap-1">

//                                                         <button
//                                                             type="button"
//                                                             className="rems-icon-button"
//                                                             title="Review Booking"
//                                                             onClick={() =>
//                                                                 openBooking(
//                                                                     booking
//                                                                 )
//                                                             }
//                                                         >
//                                                             <BsEye />
//                                                         </button>


//                                                         {bookingStatus ===
//                                                             "PENDING" && (
//                                                             <button
//                                                                 type="button"
//                                                                 className="rems-icon-button"
//                                                                 title="Approve"
//                                                                 onClick={() =>
//                                                                     openBooking(
//                                                                         booking
//                                                                     )
//                                                                 }
//                                                             >
//                                                                 <BsCheck2Circle />
//                                                             </button>
//                                                         )}


//                                                         {[
//                                                             "PENCIL",
//                                                             "PENDING",
//                                                         ].includes(
//                                                             bookingStatus
//                                                         ) && (
//                                                             <button
//                                                                 type="button"
//                                                                 className="rems-icon-button rems-action-danger"
//                                                                 title="Reject"
//                                                                 onClick={async () => {
//                                                                     const reason =
//                                                                         window.prompt(
//                                                                             "Reason for rejection:"
//                                                                         );

//                                                                     if (
//                                                                         reason ===
//                                                                         null
//                                                                     ) {
//                                                                         return;
//                                                                     }

//                                                                     await runAction(
//                                                                         booking.id,
//                                                                         rejectFacilityBooking,
//                                                                         reason
//                                                                     );
//                                                                 }}
//                                                                 disabled={
//                                                                     processingId ===
//                                                                     booking.id
//                                                                 }
//                                                             >
//                                                                 <BsXCircle />
//                                                             </button>
//                                                         )}

//                                                     </div>

//                                                 </td>

//                                             </tr>
//                                         );
//                                     }
//                                 )}

//                             </tbody>

//                         </table>

//                     </div>

//                 )}

//             </div>


//             {/* ==================================================
//                 REVIEW MODAL
//             ================================================== */}

//             {selected && (

//                 <div
//                     className="rems-modal-backdrop"
//                     style={{
//                         zIndex: 3000,
//                     }}
//                     onMouseDown={(event) => {
//                         if (
//                             event.target ===
//                             event.currentTarget
//                         ) {
//                             setSelected(
//                                 null
//                             );
//                         }
//                     }}
//                 >

//                     <div
//                         className="rems-modal rems-management-modal"
//                         style={{
//                             position: "relative",
//                             zIndex: 3001,
//                             width: "min(100%, 1050px)",
//                             maxHeight: "92vh",
//                             overflowY: "auto",
//                         }}
//                         onMouseDown={(event) =>
//                             event.stopPropagation()
//                         }
//                     >

//                         {/* ==================================================
//                             MODAL HEADER
//                         ================================================== */}

//                         <div className="rems-modal-header">

//                             <div>

//                                 <div className="rems-page-eyebrow">
//                                     FACILITY BOOKING REVIEW
//                                 </div>

//                                 <div className="rems-modal-title">
//                                     {selected.facility_name ||
//                                         "Facility Booking"}
//                                 </div>

//                                 <div className="rems-modal-subtitle">
//                                     {selected.resident_name ||
//                                         "Unknown Resident"}

//                                     {" · "}

//                                     Booking #
//                                     {selected.id}
//                                 </div>

//                             </div>


//                             <div className="d-flex align-items-center gap-2">

//                                 <span
//                                     className={`rems-status-badge ${getStatusClass(
//                                         selectedStatus
//                                     )}`}
//                                 >
//                                     <span className="rems-status-dot" />

//                                     {statusLabel(
//                                         selected.status_display ||
//                                         selectedStatus
//                                     )}
//                                 </span>


//                                 <button
//                                     type="button"
//                                     className="rems-modal-close"
//                                     onClick={() =>
//                                         setSelected(
//                                             null
//                                         )
//                                     }
//                                     aria-label="Close"
//                                 >
//                                     ×
//                                 </button>

//                             </div>

//                         </div>


//                         {/* ==================================================
//                             MODAL BODY
//                         ================================================== */}

//                         <div className="rems-modal-body">

//                             {/* =================================================
//                                 BOOKING SUMMARY
//                             ================================================= */}

//                             <div className="rems-form-section mb-3">

//                                 <div className="rems-form-section-title">
//                                     Reservation Details
//                                 </div>

//                                 <div className="row g-3">

//                                     <div className="col-12 col-md-3">

//                                         <div className="rems-table-secondary">
//                                             Date
//                                         </div>

//                                         <div className="rems-table-primary">
//                                             {selected.booking_date ||
//                                                 "—"}
//                                         </div>

//                                     </div>


//                                     <div className="col-12 col-md-3">

//                                         <div className="rems-table-secondary">
//                                             Time
//                                         </div>

//                                         <div className="rems-table-primary">
//                                             {selected.start_time ||
//                                                 "—"}

//                                             {" — "}

//                                             {selected.end_time ||
//                                                 "—"}
//                                         </div>

//                                     </div>


//                                     <div className="col-12 col-md-3">

//                                         <div className="rems-table-secondary">
//                                             Guest Limit
//                                         </div>

//                                         <div className="rems-table-primary">
//                                             {guestCount}
//                                             {" / "}
//                                             {guestLimit}
//                                         </div>

//                                     </div>


//                                     <div className="col-12 col-md-3">

//                                         <div className="rems-table-secondary">
//                                             Security Clearance
//                                         </div>

//                                         <div className="rems-table-primary">
//                                             {securityCleared
//                                                 ? "Completed"
//                                                 : "Pending"}
//                                         </div>

//                                     </div>

//                                 </div>


//                                 {selected.event_description && (
//                                     <div className="mt-3">

//                                         <div className="rems-table-secondary">
//                                             Event Description
//                                         </div>

//                                         <div className="small mt-1">
//                                             {selected.event_description}
//                                         </div>

//                                     </div>
//                                 )}


//                                 {selected.supplier_details && (
//                                     <div className="mt-3">

//                                         <div className="rems-table-secondary">
//                                             Supplier Details
//                                         </div>

//                                         <div className="small mt-1">
//                                             {selected.supplier_details}
//                                         </div>

//                                     </div>
//                                 )}

//                             </div>


//                             {/* =================================================
//                                 PENCIL INFORMATION
//                             ================================================= */}

//                             {selectedStatus ===
//                                 "PENCIL" && (
//                                 <div className="alert alert-warning rems-alert mb-3">

//                                     <BsClockHistory className="me-2" />

//                                     <strong>
//                                         Temporary Pencil Hold
//                                     </strong>

//                                     {selected.pencil_expires_at && (
//                                         <div className="small mt-1">
//                                             Hold expires at:
//                                             {" "}
//                                             {formatDateTime(
//                                                 selected.pencil_expires_at
//                                             )}
//                                         </div>
//                                     )}

//                                     <div className="small mt-1">
//                                         The browser must not
//                                         manually cancel the
//                                         booking. Server-side
//                                         expiration remains authoritative.
//                                     </div>

//                                 </div>
//                             )}


//                             {/* =================================================
//                                 APPROVAL
//                             ================================================= */}

//                             {selectedStatus ===
//                                 "PENDING" && (
//                                 <div className="rems-form-section mb-3">

//                                     <div className="rems-form-section-title">
//                                         Approval Review
//                                     </div>


//                                     {approvalIssues.length > 0 && (
//                                         <div className="alert alert-warning rems-alert mb-3">

//                                             <div className="fw-semibold">
//                                                 <BsExclamationTriangle className="me-2" />
//                                                 Approval requirements
//                                             </div>

//                                             <ul className="small mb-0 mt-2">
//                                                 {approvalIssues.map(
//                                                     (issue) => (
//                                                         <li
//                                                             key={
//                                                                 issue
//                                                             }
//                                                         >
//                                                             {issue}
//                                                         </li>
//                                                     )
//                                                 )}
//                                             </ul>

//                                         </div>
//                                     )}


//                                     <div className="d-flex flex-wrap gap-2">

//                                         <button
//                                             type="button"
//                                             className="rems-primary-button"
//                                             onClick={() =>
//                                                 runAction(
//                                                     selected.id,
//                                                     approveFacilityBooking
//                                                 )
//                                             }
//                                             disabled={
//                                                 !canApprove ||
//                                                 processingSelected
//                                             }
//                                         >
//                                             {processingSelected ? (
//                                                 <>
//                                                     <span
//                                                         className="spinner-border spinner-border-sm me-2"
//                                                         aria-hidden="true"
//                                                     />

//                                                     Processing...
//                                                 </>
//                                             ) : (
//                                                 <>
//                                                     <BsCheck2Circle />
//                                                     Approve Booking
//                                                 </>
//                                             )}
//                                         </button>


//                                         <button
//                                             type="button"
//                                             className="rems-secondary-button"
//                                             onClick={async () => {
//                                                 const reason =
//                                                     window.prompt(
//                                                         "Reason for rejection:"
//                                                     );

//                                                 if (
//                                                     reason ===
//                                                     null
//                                                 ) {
//                                                     return;
//                                                 }

//                                                 await runAction(
//                                                     selected.id,
//                                                     rejectFacilityBooking,
//                                                     reason
//                                                 );
//                                             }}
//                                             disabled={
//                                                 processingSelected
//                                             }
//                                         >
//                                             <BsXCircle />
//                                             Reject
//                                         </button>

//                                     </div>

//                                 </div>
//                             )}


//                             {/* =================================================
//                                 SECURITY CLEARANCE
//                             ================================================= */}

//                             {selectedStatus ===
//                                 "APPROVED" &&
//                                 !securityCleared && (
//                                     <div className="rems-form-section mb-3">

//                                         <div className="rems-form-section-title">
//                                             Security Clearance
//                                         </div>

//                                         <div className="alert alert-info rems-alert mb-3">

//                                             <BsShieldCheck className="me-2" />

//                                             Complete security clearance
//                                             only after confirming the
//                                             guest list.

//                                             <div className="small mt-1">
//                                                 Once completed, the guest
//                                                 list is permanently locked.
//                                             </div>

//                                         </div>

//                                         <button
//                                             type="button"
//                                             className="rems-primary-button"
//                                             onClick={
//                                                 completeSecurityClearance
//                                             }
//                                             disabled={
//                                                 processingSelected ||
//                                                 isBookingOverdue(
//                                                     selected
//                                                 )
//                                             }
//                                         >
//                                             {processingSelected ? (
//                                                 <>
//                                                     <span
//                                                         className="spinner-border spinner-border-sm me-2"
//                                                         aria-hidden="true"
//                                                     />

//                                                     Processing...
//                                                 </>
//                                             ) : (
//                                                 <>
//                                                     <BsShieldCheck />
//                                                     Complete Security Clearance
//                                                 </>
//                                             )}
//                                         </button>

//                                     </div>
//                                 )}


//                             {securityCleared && (
//                                 <div className="alert alert-success rems-alert mb-3">

//                                     <BsLock className="me-2" />

//                                     <strong>
//                                         Security Cleared
//                                     </strong>

//                                     <div className="small mt-1">
//                                         The guest list is now locked
//                                         and cannot be modified.
//                                     </div>

//                                 </div>
//                             )}


//                             {/* =================================================
//                                 GUEST LIST
//                             ================================================= */}

//                             <div className="rems-form-section mb-3">

//                                 <div className="d-flex justify-content-between align-items-center gap-3 mb-2">

//                                     <div className="rems-form-section-title mb-0">
//                                         Guest List
//                                     </div>

//                                     <div className="d-flex align-items-center gap-2">

//                                         <BsPeople />

//                                         <span className="small text-muted">
//                                             {guestCount}
//                                             {" / "}
//                                             {guestLimit}
//                                         </span>

//                                     </div>

//                                 </div>


//                                 {securityCleared && (
//                                     <div className="small text-muted mb-3">
//                                         <BsLock className="me-1" />
//                                         Guest list locked after
//                                         security clearance.
//                                     </div>
//                                 )}


//                                 {selectedGuests.length ===
//                                 0 ? (

//                                     <div className="rems-empty-state py-4">

//                                         <div className="rems-empty-icon">
//                                             <BsPeople />
//                                         </div>

//                                         <div className="rems-empty-title">
//                                             No guests registered
//                                         </div>

//                                         <div className="rems-empty-text">
//                                             This booking does not
//                                             currently have guest records.
//                                         </div>

//                                     </div>

//                                 ) : (

//                                     <div className="rems-table-wrapper">

//                                         <table className="table rems-table align-middle mb-0">

//                                             <thead>
//                                                 <tr>
//                                                     <th>#</th>
//                                                     <th>Guest Name</th>
//                                                     <th>Vehicle Plate</th>
//                                                     <th>Vehicle Model</th>
//                                                 </tr>
//                                             </thead>

//                                             <tbody>

//                                                 {selectedGuests.map(
//                                                     (
//                                                         item,
//                                                         index
//                                                     ) => (
//                                                         <tr
//                                                             key={
//                                                                 item?.id ||
//                                                                 `${selected.id}-${item?.row_number}-${index}`
//                                                             }
//                                                         >

//                                                             <td>
//                                                                 {item?.row_number ||
//                                                                     index +
//                                                                     1}
//                                                             </td>

//                                                             <td>
//                                                                 <div className="rems-table-primary">
//                                                                     {item?.full_name ||
//                                                                         "—"}
//                                                                 </div>
//                                                             </td>

//                                                             <td>
//                                                                 {item?.vehicle_plate_number ||
//                                                                     "—"}
//                                                             </td>

//                                                             <td>
//                                                                 {item?.vehicle_model ||
//                                                                     "—"}
//                                                             </td>

//                                                         </tr>
//                                                     )
//                                                 )}

//                                             </tbody>

//                                         </table>

//                                     </div>

//                                 )}

//                             </div>


//                             {/* =================================================
//                                 PAYMENT
//                             ================================================= */}

//                             <div className="rems-form-section mb-3">

//                                 <div className="d-flex justify-content-between align-items-center gap-3 mb-3">

//                                     <div className="rems-form-section-title mb-0">
//                                         Booking Payment
//                                     </div>

//                                     <BsCashStack />

//                                 </div>


//                                 <div className="row g-3 mb-3">

//                                     <div className="col-12 col-md-4">

//                                         <div className="rems-table-secondary">
//                                             Total Due
//                                         </div>

//                                         <div className="rems-table-primary">
//                                             ₱{money(
//                                                 totalDue
//                                             )}
//                                         </div>

//                                     </div>


//                                     <div className="col-12 col-md-4">

//                                         <div className="rems-table-secondary">
//                                             Verified Amount
//                                         </div>

//                                         <div className="rems-table-primary">
//                                             ₱{money(
//                                                 verifiedAmount
//                                             )}
//                                         </div>

//                                     </div>


//                                     <div className="col-12 col-md-4">

//                                         <div className="rems-table-secondary">
//                                             Payment Status
//                                         </div>

//                                         <div className="mt-1">

//                                             {verifiedBookingPayment ? (
//                                                 <span className="rems-status-badge rems-status-success">
//                                                     <span className="rems-status-dot" />
//                                                     Verified
//                                                 </span>
//                                             ) : pendingBookingPayment ? (
//                                                 <span className="rems-status-badge rems-status-warning">
//                                                     <span className="rems-status-dot" />
//                                                     Pending Verification
//                                                 </span>
//                                             ) : latestBookingPayment ? (
//                                                 <span className="rems-status-badge rems-status-danger">
//                                                     <span className="rems-status-dot" />
//                                                     {statusLabel(
//                                                         latestBookingPayment.status
//                                                     )}
//                                                 </span>
//                                             ) : (
//                                                 <span className="rems-status-badge rems-status-secondary">
//                                                     <span className="rems-status-dot" />
//                                                     Not Submitted
//                                                 </span>
//                                             )}

//                                         </div>

//                                     </div>

//                                 </div>


//                                 {selectedPayments.length ===
//                                 0 ? (

//                                     <div className="rems-empty-state py-4">

//                                         <div className="rems-empty-icon">
//                                             <BsCashStack />
//                                         </div>

//                                         <div className="rems-empty-title">
//                                             No payment submitted
//                                         </div>

//                                         <div className="rems-empty-text">
//                                             The resident has not
//                                             submitted a booking payment.
//                                         </div>

//                                     </div>

//                                 ) : (

//                                     <div>

//                                         {selectedPayments.map(
//                                             (
//                                                 payment
//                                             ) => (

//                                                 <div
//                                                     key={
//                                                         payment.id
//                                                     }
//                                                     className="d-flex justify-content-between align-items-center gap-3 py-3 border-bottom"
//                                                 >

//                                                     <div>

//                                                         <div className="rems-table-primary">
//                                                             ₱{money(
//                                                                 payment.amount
//                                                             )}
//                                                         </div>

//                                                         <div className="rems-table-secondary">

//                                                             {payment.payment_method_display ||
//                                                                 payment.payment_method ||
//                                                                 "Payment"}

//                                                             {" · "}

//                                                             {payment.payment_type_display ||
//                                                                 payment.payment_type ||
//                                                                 "BOOKING_TOTAL"}

//                                                         </div>

//                                                         {payment.reference_number && (
//                                                             <div className="small text-muted mt-1">
//                                                                 Reference:
//                                                                 {" "}
//                                                                 {
//                                                                     payment.reference_number
//                                                                 }
//                                                             </div>
//                                                         )}

//                                                         {payment.created_at && (
//                                                             <div className="small text-muted">
//                                                                 Submitted:
//                                                                 {" "}
//                                                                 {formatDateTime(
//                                                                     payment.created_at
//                                                                 )}
//                                                             </div>
//                                                         )}

//                                                     </div>


//                                                     <div className="d-flex align-items-center gap-2">

//                                                         {payment.proof && (
//                                                             <a
//                                                                 href={
//                                                                     payment.proof
//                                                                 }
//                                                                 target="_blank"
//                                                                 rel="noreferrer"
//                                                                 className="rems-secondary-button"
//                                                             >
//                                                                 View Proof
//                                                             </a>
//                                                         )}


//                                                         <span
//                                                             className={`rems-status-badge ${getStatusClass(
//                                                                 payment.status
//                                                             )}`}
//                                                         >
//                                                             <span className="rems-status-dot" />

//                                                             {statusLabel(
//                                                                 payment.status_display ||
//                                                                 payment.status
//                                                             )}
//                                                         </span>


//                                                         {normalizeStatus(
//                                                             payment.status
//                                                         ) ===
//                                                             "PENDING" &&
//                                                             normalizeStatus(
//                                                                 payment.payment_type
//                                                             ) ===
//                                                                 "BOOKING_TOTAL" && (
//                                                                 <button
//                                                                     type="button"
//                                                                     className="rems-primary-button"
//                                                                     onClick={() =>
//                                                                         approvePayment(
//                                                                             payment
//                                                                         )
//                                                                     }
//                                                                     disabled={
//                                                                         processingSelected
//                                                                     }
//                                                                 >
//                                                                     {processingSelected ? (
//                                                                         <>
//                                                                             <span
//                                                                                 className="spinner-border spinner-border-sm me-2"
//                                                                                 aria-hidden="true"
//                                                                             />

//                                                                             Verifying...
//                                                                         </>
//                                                                     ) : (
//                                                                         <>
//                                                                             <BsCheck2Circle />
//                                                                             Verify
//                                                                         </>
//                                                                     )}
//                                                                 </button>
//                                                             )}

//                                                     </div>

//                                                 </div>

//                                             )
//                                         )}

//                                     </div>

//                                 )}

//                             </div>


//                             {/* =================================================
//                                 FACILITY USE
//                             ================================================= */}

//                             {selectedStatus ===
//                                 "APPROVED" &&
//                                 securityCleared && (
//                                     <div className="rems-form-section mb-3">

//                                         <div className="rems-form-section-title">
//                                             Facility Use
//                                         </div>

//                                         <div className="alert alert-success rems-alert mb-3">

//                                             <BsPersonCheck className="me-2" />

//                                             Booking approved and security
//                                             clearance completed.

//                                         </div>

//                                         <button
//                                             type="button"
//                                             className="rems-primary-button"
//                                             onClick={() =>
//                                                 runAction(
//                                                     selected.id,
//                                                     startFacilityUse
//                                                 )
//                                             }
//                                             disabled={
//                                                 processingSelected
//                                             }
//                                         >
//                                             {processingSelected ? (
//                                                 <>
//                                                     <span
//                                                         className="spinner-border spinner-border-sm me-2"
//                                                         aria-hidden="true"
//                                                     />

//                                                     Starting...
//                                                 </>
//                                             ) : (
//                                                 <>
//                                                     <BsCheck2Circle />
//                                                     Start Facility Use
//                                                 </>
//                                             )}
//                                         </button>

//                                     </div>
//                                 )}


//                             {/* =================================================
//                                 IN USE
//                             ================================================= */}

//                             {selectedStatus ===
//                                 "IN_USE" && (
//                                 <div className="rems-form-section mb-3">

//                                     <div className="rems-form-section-title">
//                                         Facility Use
//                                     </div>

//                                     <div className="alert alert-info rems-alert mb-3">
//                                         The facility booking is
//                                         currently in use.
//                                     </div>

//                                     <button
//                                         type="button"
//                                         className="rems-primary-button"
//                                         onClick={() =>
//                                             runAction(
//                                                 selected.id,
//                                                 completeFacilityBooking
//                                             )
//                                         }
//                                         disabled={
//                                             processingSelected
//                                         }
//                                     >
//                                         {processingSelected ? (
//                                             <>
//                                                 <span
//                                                     className="spinner-border spinner-border-sm me-2"
//                                                     aria-hidden="true"
//                                                 />

//                                                 Completing...
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <BsCheck2Circle />
//                                                 Complete Facility Use
//                                             </>
//                                         )}
//                                     </button>

//                                 </div>
//                             )}


//                             {/* =================================================
//                                 INSPECTION
//                             ================================================= */}

//                             {selectedStatus ===
//                                 "INSPECTION_PENDING" && (
//                                 <div className="rems-form-section mb-3">

//                                     <div className="rems-form-section-title">
//                                         Post-Event Inspection
//                                     </div>

//                                     <div className="row g-3">

//                                         <div className="col-12 col-md-4">

//                                             <label className="rems-form-label">
//                                                 Inspection Result
//                                             </label>

//                                             <select
//                                                 className="form-select rems-form-control"
//                                                 value={
//                                                     inspection.result
//                                                 }
//                                                 onChange={(event) =>
//                                                     setInspection(
//                                                         (
//                                                             previous
//                                                         ) => ({
//                                                             ...previous,
//                                                             result:
//                                                                 event.target.value,
//                                                         })
//                                                     )
//                                                 }
//                                                 disabled={
//                                                     processingSelected
//                                                 }
//                                             >
//                                                 <option value="PASSED">
//                                                     Passed
//                                                 </option>

//                                                 <option value="DAMAGE_FOUND">
//                                                     Damage Found
//                                                 </option>

//                                                 <option value="CLEANUP_REQUIRED">
//                                                     Cleanup Required
//                                                 </option>
//                                             </select>

//                                         </div>


//                                         <div className="col-12 col-md-4">

//                                             <label className="rems-form-label">
//                                                 Deposit Deduction
//                                             </label>

//                                             <input
//                                                 type="number"
//                                                 min="0"
//                                                 step="0.01"
//                                                 className="form-control rems-form-control"
//                                                 value={
//                                                     inspection.deduction_amount
//                                                 }
//                                                 onChange={(event) =>
//                                                     setInspection(
//                                                         (
//                                                             previous
//                                                         ) => ({
//                                                             ...previous,
//                                                             deduction_amount:
//                                                                 event.target.value,
//                                                         })
//                                                     )
//                                                 }
//                                                 disabled={
//                                                     processingSelected
//                                                 }
//                                             />

//                                         </div>


//                                         <div className="col-12 col-md-4 d-flex align-items-end">

//                                             <button
//                                                 type="button"
//                                                 className="rems-primary-button w-100"
//                                                 onClick={
//                                                     inspect
//                                                 }
//                                                 disabled={
//                                                     processingSelected
//                                                 }
//                                             >
//                                                 {processingSelected ? (
//                                                     <>
//                                                         <span
//                                                             className="spinner-border spinner-border-sm me-2"
//                                                             aria-hidden="true"
//                                                         />

//                                                         Recording...
//                                                     </>
//                                                 ) : (
//                                                     <>
//                                                         <BsClipboardCheck />
//                                                         Record Inspection
//                                                     </>
//                                                 )}
//                                             </button>

//                                         </div>


//                                         <div className="col-12">

//                                             <label className="rems-form-label">
//                                                 Inspection Notes
//                                             </label>

//                                             <textarea
//                                                 rows="4"
//                                                 className="form-control rems-form-control"
//                                                 placeholder="Enter inspection findings, cleanup notes, damage details, or other relevant information..."
//                                                 value={
//                                                     inspection.notes
//                                                 }
//                                                 onChange={(event) =>
//                                                     setInspection(
//                                                         (
//                                                             previous
//                                                         ) => ({
//                                                             ...previous,
//                                                             notes:
//                                                                 event.target.value,
//                                                         })
//                                                     )
//                                                 }
//                                                 disabled={
//                                                     processingSelected
//                                                 }
//                                             />

//                                         </div>

//                                     </div>

//                                 </div>
//                             )}


//                             {/* =================================================
//                                 INSPECTION SUMMARY
//                             ================================================= */}

//                             {selected.inspection && (
//                                 <div className="rems-form-section mb-3">

//                                     <div className="rems-form-section-title">
//                                         Inspection Record
//                                     </div>

//                                     <div className="row g-3">

//                                         <div className="col-12 col-md-4">

//                                             <div className="rems-table-secondary">
//                                                 Result
//                                             </div>

//                                             <div className="rems-table-primary">
//                                                 {selected.inspection.result_display ||
//                                                     selected.inspection.result ||
//                                                     "—"}
//                                             </div>

//                                         </div>


//                                         <div className="col-12 col-md-4">

//                                             <div className="rems-table-secondary">
//                                                 Refund Amount
//                                             </div>

//                                             <div className="rems-table-primary">
//                                                 ₱{money(
//                                                     selected.inspection.refund_amount
//                                                 )}
//                                             </div>

//                                         </div>


//                                         <div className="col-12 col-md-4">

//                                             <div className="rems-table-secondary">
//                                                 Deduction
//                                             </div>

//                                             <div className="rems-table-primary">
//                                                 ₱{money(
//                                                     selected.inspection.deduction_amount
//                                                 )}
//                                             </div>

//                                         </div>


//                                         {selected.inspection.notes && (
//                                             <div className="col-12">

//                                                 <div className="rems-table-secondary">
//                                                     Notes
//                                                 </div>

//                                                 <div className="small mt-1">
//                                                     {
//                                                         selected.inspection.notes
//                                                     }
//                                                 </div>

//                                             </div>
//                                         )}

//                                     </div>

//                                 </div>
//                             )}


//                             {/* =================================================
//                                 REFUND
//                             ================================================= */}

//                             {selectedStatus ===
//                                 "REFUND_PENDING" && (
//                                 <div className="rems-form-section mb-3">

//                                     <div className="rems-form-section-title">
//                                         Security Deposit Refund
//                                     </div>

//                                     <div className="row g-3 align-items-end">

//                                         <div className="col-12 col-md-6">

//                                             <div className="rems-table-secondary">
//                                                 Refund Amount
//                                             </div>

//                                             <div className="rems-table-primary">
//                                                 ₱{money(
//                                                     selected.inspection?.refund_amount
//                                                 )}
//                                             </div>

//                                         </div>


//                                         <div className="col-12 col-md-6">

//                                             <button
//                                                 type="button"
//                                                 className="rems-primary-button w-100"
//                                                 onClick={() =>
//                                                     runAction(
//                                                         selected.id,
//                                                         refundFacilityDeposit,
//                                                         {
//                                                             payment_method:
//                                                                 "CASH",
//                                                         }
//                                                     )
//                                                 }
//                                                 disabled={
//                                                     processingSelected
//                                                 }
//                                             >
//                                                 {processingSelected ? (
//                                                     <>
//                                                         <span
//                                                             className="spinner-border spinner-border-sm me-2"
//                                                             aria-hidden="true"
//                                                         />

//                                                         Processing...
//                                                     </>
//                                                 ) : (
//                                                     <>
//                                                         <BsCashStack />
//                                                         Record Deposit Refund
//                                                     </>
//                                                 )}
//                                             </button>

//                                         </div>

//                                     </div>

//                                 </div>
//                             )}


//                             {/* =================================================
//                                 CLOSED
//                             ================================================= */}

//                             {selectedStatus ===
//                                 "CLOSED" && (
//                                 <div className="alert alert-success rems-alert">

//                                     <BsCheck2Circle className="me-2" />

//                                     <strong>
//                                         Booking Closed
//                                     </strong>

//                                     <div className="small mt-1">
//                                         This facility booking has
//                                         completed its lifecycle.
//                                     </div>

//                                 </div>
//                             )}


//                             {/* =================================================
//                                 REJECTED
//                             ================================================= */}

//                             {selectedStatus ===
//                                 "REJECTED" && (
//                                 <div className="alert alert-danger rems-alert">

//                                     <BsXCircle className="me-2" />

//                                     <strong>
//                                         Booking Rejected
//                                     </strong>

//                                     {selected.rejection_reason && (
//                                         <div className="small mt-1">
//                                             {
//                                                 selected.rejection_reason
//                                             }
//                                         </div>
//                                     )}

//                                 </div>
//                             )}


//                             {/* =================================================
//                                 CANCELLED
//                             ================================================= */}

//                             {selectedStatus ===
//                                 "CANCELLED" && (
//                                 <div className="alert alert-secondary rems-alert">

//                                     <BsLock className="me-2" />

//                                     <strong>
//                                         Booking Cancelled
//                                     </strong>

//                                     {selected.cancellation_reason && (
//                                         <div className="small mt-1">
//                                             {
//                                                 selected.cancellation_reason
//                                             }
//                                         </div>
//                                     )}

//                                 </div>
//                             )}

//                         </div>


//                         {/* ==================================================
//                             MODAL FOOTER
//                         ================================================== */}

//                         <div className="rems-modal-footer">

//                             <button
//                                 type="button"
//                                 className="rems-secondary-button"
//                                 onClick={
//                                     refreshSelected
//                                 }
//                                 disabled={
//                                     processingSelected
//                                 }
//                             >
//                                 <BsArrowClockwise />
//                                 Refresh Details
//                             </button>


//                             <button
//                                 type="button"
//                                 className="rems-secondary-button"
//                                 onClick={() =>
//                                     setSelected(
//                                         null
//                                     )
//                                 }
//                                 disabled={
//                                     processingSelected
//                                 }
//                             >
//                                 Close
//                             </button>

//                         </div>

//                     </div>

//                 </div>

//             )}

//         </div>
//     );
// }
