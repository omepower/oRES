import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    BsArrowLeft,
    BsArrowClockwise,
    BsCheck2Circle,
    BsCloudUpload,
    BsCreditCard,
    BsExclamationTriangle,
    BsFileEarmarkSpreadsheet,
    BsClockHistory,
    BsPeople,
    BsShieldCheck,
    BsXCircle,
    BsPersonPlus,
    BsTrash,
} from "react-icons/bs";

import {
    getMyFacilityBookings,
    getBookingGuests,
    getBookingPayments,
    submitFacilityBooking,
    cancelFacilityBooking,
    importBookingGuestList,
    createBookingPayment,
    createBookingGuest,
    deleteBookingGuest,
} from "../../api/facilities";


/* =========================================================
   HELPERS
========================================================= */

const normalize = (response) => {
    if (Array.isArray(response)) {
        return response;
    }

    return (
        response?.results ||
        response?.bookings ||
        response?.guests ||
        response?.payments ||
        []
    );
};


const normalizeStatus = (status) => {
    return String(status || "")
        .trim()
        .toUpperCase();
};


const money = (value) => {
    const amount = Number(value || 0);

    return amount.toLocaleString(
        undefined,
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    );
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
            "file",
            "guests",
            "payments",
            "status",
            "detail",
        ];

        for (const field of preferredFields) {
            const value = data?.[field];

            if (Array.isArray(value) && value.length > 0) {
                return String(value[0]);
            }

            if (typeof value === "string" && value.trim()) {
                return value;
            }
        }

        const firstError = Object.values(data)
            .flat()
            .find((value) => Boolean(value));

        if (firstError) {
            return String(firstError);
        }
    }

    if (error?.message) {
        return String(error.message);
    }

    return fallback;
};


const getStatusClass = (status) => {
    switch (normalizeStatus(status)) {
        case "PENCIL":
        case "PENDING":
        case "INSPECTION_PENDING":
        case "REFUND_PENDING":
            return "rems-status-warning";

        case "APPROVED":
        case "IN_USE":
        case "COMPLETED":
            return "rems-status-success";

        case "CLOSED":
        case "EXPIRED":
            return "rems-status-secondary";

        case "REJECTED":
        case "CANCELLED":
            return "rems-status-danger";

        default:
            return "rems-status-secondary";
    }
};


/* =========================================================
   GUEST LIST EDITABILITY
========================================================= */

const GUEST_EDITABLE_STATUSES = [
    "PENCIL",
    "PENDING",
    "APPROVED",
];

const GUEST_LIST_TEMPLATE_URL = "/oRES_Guest_List_Template.xlsx";


const canEditGuestList = (booking) => {
    if (!booking) {
        return false;
    }

    if (booking.security_clearance_completed) {
        return false;
    }

    return GUEST_EDITABLE_STATUSES.includes(
        normalizeStatus(booking.status)
    );
};


const formatHoldTime = (totalSeconds) => {
    const seconds = Math.max(0, Number(totalSeconds || 0));
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};


/* =========================================================
   COMPONENT
========================================================= */

export default function ResidentFacilityBookingDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const portalPrefix = window.location.pathname.startsWith("/tenant")
        ? "/tenant"
        : "/homeowner";


    /* =====================================================
       DATA STATE
    ===================================================== */

    const [booking, setBooking] = useState(null);
    const [guests, setGuests] = useState([]);
    const [payments, setPayments] = useState([]);


    /* =====================================================
       PAGE STATE
    ===================================================== */

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");


    /* =====================================================
       GUEST FORM STATE
    ===================================================== */

    const [guestListFile, setGuestListFile] = useState(null);
    const [inlineGuest, setInlineGuest] = useState({
        full_name: "",
        vehicle_plate_number: "",
        vehicle_model: "",
    });


    /* =====================================================
       PAYMENT STATE
    ===================================================== */

    const [payment, setPayment] = useState({
        payment_method: "GCASH",
        reference_number: "",
        proof: null,
    });


    /* =====================================================
       REFS & TIMERS
    ===================================================== */

    const errorRef = useRef(null);
    const [pencilRemainingSeconds, setPencilRemainingSeconds] = useState(null);
    const pencilExpiryActionRef = useRef(false);
    const [pencilExpiryProcessing, setPencilExpiryProcessing] = useState(false);


    /* =====================================================
       LOAD BOOKING
    ===================================================== */

    const load = useCallback(
        async (refresh = false) => {
            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            try {
                const bookingResponse = await getMyFacilityBookings();
                const bookings = normalize(bookingResponse);
                const found = bookings.find(
                    (item) => String(item.id) === String(id)
                );

                if (!found) {
                    setBooking(null);
                    setGuests([]);
                    setPayments([]);
                    setError("The booking could not be found.");
                    return;
                }

                setBooking(found);

                // Fetch guests
                try {
                    const guestResponse = await getBookingGuests(found.id);
                    const guestRecords = normalize(guestResponse);

                    setGuests(
                        guestRecords.filter(
                            (guest) =>
                                String(guest?.booking) === String(found.id) ||
                                !guest?.booking
                        )
                    );
                } catch (guestError) {
                    console.error("[Facility Booking Details] Guest load failed:", guestError);
                    setGuests(Array.isArray(found?.guests) ? found.guests : []);
                }

                // Fetch payments
                try {
                    const paymentResponse = await getBookingPayments(found.id);
                    const paymentRecords = normalize(paymentResponse);

                    setPayments(
                        paymentRecords.filter(
                            (item) =>
                                String(item?.booking) === String(found.id) ||
                                !item?.booking
                        )
                    );
                } catch (paymentError) {
                    console.error("[Facility Booking Details] Payment load failed:", paymentError);
                    setPayments(Array.isArray(found?.payments) ? found.payments : []);
                }

            } catch (err) {
                console.error("[Facility Booking Details] Load failed:", err);
                setError(getErrorMessage(err, "Unable to load booking details."));
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [id]
    );


    useEffect(() => {
        load();
    }, [load]);


    /* =====================================================
       PENCIL HOLD TIMER
    ===================================================== */

    useEffect(() => {
        const status = normalizeStatus(booking?.status);

        if (status !== "PENCIL" || !booking?.pencil_expires_at) {
            setPencilRemainingSeconds(null);
            pencilExpiryActionRef.current = false;
            return undefined;
        }

        const getRemaining = () => {
            const expiry = new Date(booking.pencil_expires_at).getTime();
            if (Number.isNaN(expiry)) return null;
            return Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
        };

        const tick = async () => {
            const remaining = getRemaining();
            if (remaining === null) {
                setPencilRemainingSeconds(null);
                return;
            }

            setPencilRemainingSeconds(remaining);

            if (remaining > 0 || pencilExpiryActionRef.current) {
                return;
            }

            pencilExpiryActionRef.current = true;
            setPencilExpiryProcessing(true);
            setProcessing(true);
            setError("");

            try {
                await cancelFacilityBooking(
                    booking.id,
                    "Pencil booking hold expired before submission."
                );
                await load(true);
            } catch (err) {
                console.error("[Facility Booking Details] Hold expiration failed:", err);
                setPencilRemainingSeconds(0);
                setError(
                    getErrorMessage(
                        err,
                        "The 30-minute booking hold has expired. Please refresh the page."
                    )
                );
                pencilExpiryActionRef.current = false;
            } finally {
                setPencilExpiryProcessing(false);
                setProcessing(false);
            }
        };

        void tick();
        const interval = window.setInterval(() => void tick(), 1000);
        return () => window.clearInterval(interval);
    }, [booking, load]);


    /* =====================================================
       AUTO REFRESH & SCROLL
    ===================================================== */

    useEffect(() => {
        const interval = window.setInterval(() => load(true), 30000);
        return () => window.clearInterval(interval);
    }, [load]);

    useEffect(() => {
        if (!error) return;
        const timer = window.setTimeout(() => {
            errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
        return () => window.clearTimeout(timer);
    }, [error]);


    /* =====================================================
       ACTION RUNNER
    ===================================================== */

    const runAction = async (callback) => {
        setProcessing(true);
        setError("");
        try {
            await callback();
            await load(true);
        } catch (err) {
            console.error("[Facility Booking Details] Action failed:", err);
            setError(getErrorMessage(err, "Unable to complete the action."));
        } finally {
            setProcessing(false);
        }
    };


    /* =====================================================
       COMPUTED STATES
    ===================================================== */

    const pencilHoldActive =
        normalizeStatus(booking?.status) === "PENCIL" &&
        Number(pencilRemainingSeconds) > 0 &&
        !pencilExpiryProcessing;

    const pencilHoldExpired =
        normalizeStatus(booking?.status) === "PENCIL" &&
        Number(pencilRemainingSeconds) <= 0;

    const guestLimit = useMemo(
        () => Number(booking?.estimated_guests || 0),
        [booking]
    );

    const guestCount = guests.length;

    const isInlineMode = guestLimit <= 5;

    const guestListEditable = useMemo(
        () => canEditGuestList(booking) && !pencilHoldExpired,
        [booking, pencilHoldExpired]
    );

    const guestListLocked = Boolean(booking?.security_clearance_completed);


    /* =====================================================
       PAYMENT COMPUTATION
    ===================================================== */

    const bookingTotalPayments = useMemo(
        () => payments.filter((item) => normalizeStatus(item?.payment_type) === "BOOKING_TOTAL"),
        [payments]
    );

    const latestBookingPayment = useMemo(() => {
        if (bookingTotalPayments.length === 0) return null;
        return [...bookingTotalPayments].sort((a, b) =>
            String(b?.created_at || "").localeCompare(String(a?.created_at || ""))
        )[0];
    }, [bookingTotalPayments]);

    const paymentStatus = normalizeStatus(latestBookingPayment?.status);
    const paymentVerified = paymentStatus === "VERIFIED";
    const paymentPending = paymentStatus === "PENDING";
    const paymentRejected = paymentStatus === "REJECTED";


    /* =====================================================
       SUBMIT RESERVATION
    ===================================================== */

    const canSubmit = pencilHoldActive;

    const submitReservation = async () => {
        if (!booking?.id) return;

        if (!canSubmit) {
            setError("Only an active Pencil Book can be submitted for approval.");
            return;
        }

        if (guestCount <= 0) {
            setError("Please complete the guest list before submitting the reservation.");
            return;
        }

        if (guestLimit > 0 && guestCount > guestLimit) {
            setError("The guest list exceeds the number of guests requested for this booking.");
            return;
        }

        await runAction(async () => {
            await submitFacilityBooking(booking.id);
        });
    };


    /* =====================================================
       INLINE GUEST ADD / DELETE
    ===================================================== */

    const handleAddInlineGuest = async () => {
        if (!inlineGuest.full_name.trim()) {
            setError("Guest name is required.");
            return;
        }

        if (guestLimit > 0 && guestCount >= guestLimit) {
            setError(`You can only add up to ${guestLimit} guests for this booking.`);
            return;
        }

        // Calculate the next available row_number to satisfy the unique constraint
        const maxRowNumber = guests.reduce(
            (max, g) => Math.max(max, Number(g.row_number || 0)),
            0
        );
        const nextRowNumber = maxRowNumber + 1;

        await runAction(async () => {
            await createBookingGuest({
                booking: booking.id,
                row_number: nextRowNumber,
                full_name: inlineGuest.full_name.trim(),
                vehicle_plate_number: inlineGuest.vehicle_plate_number.trim(),
                vehicle_model: inlineGuest.vehicle_model.trim(),
            });

            setInlineGuest({
                full_name: "",
                vehicle_plate_number: "",
                vehicle_model: "",
            });
        });
    };

    const handleDeleteGuestItem = async (guestId) => {
        if (!guestId) return;

        const confirmed = window.confirm("Are you sure you want to remove this guest?");
        if (!confirmed) return;

        await runAction(async () => {
            await deleteBookingGuest(guestId);
        });
    };


    /* =====================================================
       XLSX GUEST UPLOAD
    ===================================================== */

    const handleGuestListFile = (event) => {
        setError("");
        const file = event.target.files?.[0] || null;

        if (!file) {
            setGuestListFile(null);
            return;
        }

        if (!file.name.toLowerCase().endsWith(".xlsx")) {
            setGuestListFile(null);
            event.target.value = "";
            setError("Only .xlsx guest list files are accepted.");
            return;
        }

        setGuestListFile(file);
    };

    const uploadGuestList = async () => {
        setError("");

        if (!booking?.id) {
            setError("The booking could not be identified.");
            return;
        }

        if (booking.security_clearance_completed) {
            setGuestListFile(null);
            setError("The guest list is locked because security clearance has already been completed.");
            return;
        }

        if (!GUEST_EDITABLE_STATUSES.includes(normalizeStatus(booking.status))) {
            setError("The guest list cannot be modified in the current booking status.");
            return;
        }

        if (!guestListFile) {
            setError("Please select an XLSX guest list file.");
            return;
        }

        const confirmed = window.confirm(
            guestCount > 0
                ? "Uploading this XLSX will replace the current guest list for this booking. Continue?"
                : "Upload this XLSX as the guest list for this booking?"
        );

        if (!confirmed) return;

        setProcessing(true);
        setError("");

        try {
            await importBookingGuestList(booking.id, guestListFile);
            setGuestListFile(null);
            await load(true);
        } catch (err) {
            console.error("[Facility Booking Details] Guest XLSX import failed:", err);
            setError(getErrorMessage(err, "Unable to upload the guest list."));
        } finally {
            setProcessing(false);
        }
    };


    /* =====================================================
       PAYMENT SUBMISSION
    ===================================================== */

    const submitPayment = async () => {
        if (!booking?.id) return;

        const totalDue = Number(booking?.total_amount_due || 0);

        if (totalDue <= 0) {
            setError("No booking payment is currently required.");
            return;
        }

        if (paymentVerified) {
            setError("The full booking payment has already been verified.");
            return;
        }

        if (!payment.reference_number.trim()) {
            setError("Payment reference number is required.");
            return;
        }

        if (!(payment.proof instanceof File)) {
            setError("Please upload your payment proof.");
            return;
        }

        await runAction(async () => {
            await createBookingPayment({
                booking: booking.id,
                payment_method: payment.payment_method,
                amount: totalDue,
                reference_number: payment.reference_number.trim(),
                proof: payment.proof,
            });

            setPayment({
                payment_method: "GCASH",
                reference_number: "",
                proof: null,
            });
        });
    };


    /* =====================================================
       CANCEL BOOKING
    ===================================================== */

    const canCancel =
        ["PENDING", "APPROVED"].includes(normalizeStatus(booking?.status)) ||
        (normalizeStatus(booking?.status) === "PENCIL" && pencilHoldActive);

    const cancelBooking = async () => {
        if (!booking?.id || !canCancel) return;

        const confirmed = window.confirm(
            `Cancel the ${booking.facility_name || "facility"} reservation on ${booking.booking_date || "the selected date"}?`
        );

        if (!confirmed) return;

        await runAction(async () => {
            await cancelFacilityBooking(booking.id, "Cancelled by resident.");
        });
    };

    const goBack = () => {
        navigate(`${portalPrefix}/facilities/bookings`);
    };


    /* =====================================================
       RENDER STATES
    ===================================================== */

    if (loading) {
        return (
            <div className="rems-page-content">
                <div className="rems-loading-state">
                    <div className="spinner-border" role="status" aria-hidden="true" />
                    <div className="mt-3">Loading booking...</div>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="rems-page-content">
                <button type="button" className="rems-secondary-button mb-3" onClick={goBack}>
                    <BsArrowLeft /> Back
                </button>
                <div className="rems-glass-card">
                    <div className="rems-empty-state">
                        <div className="rems-empty-title">Booking unavailable</div>
                        <div className="rems-empty-text">
                            {error || "The booking could not be found."}
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    /* =====================================================
       MAIN VIEW
    ===================================================== */

    return (
        <div className="rems-page-content">

            {/* HEADER */}
            <div className="rems-page-header">
                <div>
                    <div className="rems-page-eyebrow">FACILITY BOOKING</div>
                    <h1 className="rems-page-title">{booking.facility_name || "Facility Booking"}</h1>
                    <p className="rems-page-description">
                        Manage your reservation, guest list, payment, and security-clearance status.
                    </p>
                </div>

                <div className="rems-page-header-actions">
                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() => load(true)}
                        disabled={refreshing || processing}
                    >
                        {refreshing ? (
                            <span className="spinner-border spinner-border-sm" />
                        ) : (
                            <BsArrowClockwise />
                        )}
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>

                    <button type="button" className="rems-secondary-button" onClick={goBack}>
                        <BsArrowLeft /> Back
                    </button>
                </div>
            </div>


            {/* ERROR ALERT */}
            {error && (
                <div
                    ref={errorRef}
                    tabIndex={-1}
                    className="alert alert-danger rems-alert mb-4"
                    role="alert"
                    style={{ outline: "none", scrollMarginTop: "24px" }}
                >
                    <div className="d-flex align-items-start gap-2">
                        <BsExclamationTriangle className="mt-1 flex-shrink-0" />
                        <div className="flex-grow-1">
                            <div className="fw-semibold">Unable to complete the request</div>
                            <div className="mt-1">{error}</div>
                        </div>
                        <button
                            type="button"
                            className="btn-close"
                            aria-label="Close"
                            onClick={() => setError("")}
                        />
                    </div>
                </div>
            )}


            <div className="row g-3">
                <div className="col-12 col-xl-8">

                    {/* RESERVATION SUMMARY */}
                    <div className="rems-glass-card mb-3">
                        <div className="rems-card-header">
                            <div>
                                <div className="rems-card-title">Reservation Details</div>
                                <div className="rems-card-subtitle">
                                    {booking.booking_date} · {booking.start_time} — {booking.end_time}
                                </div>
                            </div>

                            <span className={`rems-status-badge ${getStatusClass(booking.status)}`}>
                                <span className="rems-status-dot" />
                                {booking.status_display || booking.status || "—"}
                            </span>
                        </div>

                        <div className="p-3">
                            <div className="row g-3">
                                <div className="col-6 col-md-3">
                                    <div className="rems-table-secondary">Guests Requested</div>
                                    <div className="rems-table-primary">{booking.estimated_guests || 0}</div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="rems-table-secondary">Guests Listed</div>
                                    <div className="rems-table-primary">{guestCount}</div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="rems-table-secondary">Rental</div>
                                    <div className="rems-table-primary">₱{money(booking.rental_fee)}</div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="rems-table-secondary">Total Due</div>
                                    <div className="rems-table-primary">₱{money(booking.total_amount_due)}</div>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* PENCIL HOLD TIMER */}
                    {normalizeStatus(booking.status) === "PENCIL" && (
                        <div className={`rems-glass-card mb-3 ${pencilHoldExpired ? "border border-danger" : ""}`}>
                            <div className="p-3">
                                <div className="d-flex align-items-start gap-3">
                                    {pencilHoldExpired ? (
                                        <BsXCircle className="mt-1 text-danger flex-shrink-0" />
                                    ) : (
                                        <BsClockHistory className="mt-1 flex-shrink-0" />
                                    )}

                                    <div className="flex-grow-1">
                                        <div className="fw-semibold">
                                            {pencilHoldExpired ? "Booking hold expired" : "Booking hold active"}
                                        </div>
                                        <div className="small text-muted mt-1">
                                            {pencilHoldExpired
                                                ? "The 30-minute Pencil hold has expired. This booking can no longer be submitted and the hold is being released."
                                                : "This facility is held for you for 30 minutes from booking creation. Submit the reservation before the timer reaches zero."}
                                            {pencilExpiryProcessing && " Updating booking status..."}
                                        </div>
                                    </div>

                                    <div className="text-end flex-shrink-0">
                                        <div className="small text-muted">{pencilHoldExpired ? "EXPIRED" : "TIME LEFT"}</div>
                                        <div className={`fw-bold ${pencilHoldExpired ? "text-danger" : ""}`} style={{ fontVariantNumeric: "tabular-nums" }}>
                                            {pencilHoldExpired ? "00:00" : formatHoldTime(pencilRemainingSeconds)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* SUBMIT BUTTON CARD */}
                    {canSubmit && (
                        <div className="rems-glass-card mb-3">
                            <div className="p-3">
                                <div className="rems-form-section-title">
                                    <BsCheck2Circle className="me-2" />
                                    Submit Reservation
                                </div>
                                <p className="small text-muted mb-3">
                                    Review your reservation details and complete the guest list before submitting it for HOA approval.
                                </p>
                                <button
                                    type="button"
                                    className="rems-primary-button"
                                    onClick={submitReservation}
                                    disabled={processing || guestCount === 0}
                                >
                                    {processing ? "Submitting..." : "Submit Reservation"}
                                </button>
                            </div>
                        </div>
                    )}


                    {/* GUEST LIST SECTION */}
                    <div className="rems-glass-card mb-3">
                        <div className="rems-card-header">
                            <div>
                                <div className="rems-card-title">Guest List</div>
                                <div className="rems-card-subtitle">
                                    Guest details for gate clearance. Max guests: {guestLimit}
                                </div>
                            </div>
                            <BsPeople />
                        </div>

                        <div className="p-3">

                            {/* EDITABLE NOTICE */}
                            {guestListEditable ? (
                                <div className="alert alert-info rems-alert mb-3">
                                    <div className="d-flex align-items-start gap-2">
                                        <BsShieldCheck className="mt-1 flex-shrink-0" />
                                        <div>
                                            <div className="fw-semibold">Guest list is editable</div>
                                            <div className="small mt-1">
                                                You may update your guest list while this booking is in{" "}
                                                <strong>{booking.status_display || booking.status}</strong> status. Changes are locked after security clearance.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : guestListLocked ? (
                                <div className="alert alert-success rems-alert mb-3">
                                    <div className="d-flex align-items-start gap-2">
                                        <BsShieldCheck className="mt-1 flex-shrink-0" />
                                        <div>
                                            <div className="fw-semibold">Guest list locked</div>
                                            <div className="small mt-1">
                                                Security clearance has been completed. The guest list can no longer be changed.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="alert alert-secondary rems-alert mb-3">
                                    <div className="d-flex align-items-start gap-2">
                                        <BsShieldCheck className="mt-1 flex-shrink-0" />
                                        <div>
                                            <div className="fw-semibold">Guest list unavailable for editing</div>
                                            <div className="small mt-1">
                                                Guest information cannot be modified in the current workflow status.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}


                            {/* GUEST INPUT MECHANISM (INLINE vs XLSX) */}
                            {guestListEditable && (
                                <>
                                    {isInlineMode ? (
                                        /* INLINE FORM (<= 5 GUESTS) */
                                        <div className="border rounded p-3 mb-3 bg-light-subtle">
                                            <div className="fw-semibold mb-2 d-flex align-items-center gap-2">
                                                <BsPersonPlus /> Add Guest Details ({guestCount}/{guestLimit})
                                            </div>

                                            {guestCount >= guestLimit ? (
                                                <div className="small text-muted">
                                                    Maximum allowed guests ({guestLimit}) reached. Remove a guest below to make changes.
                                                </div>
                                            ) : (
                                                <div className="row g-2">
                                                    <div className="col-12 col-md-4">
                                                        <label className="form-label small text-muted mb-1">Guest Name *</label>
                                                        <input
                                                            type="text"
                                                            className="form-control rems-form-control"
                                                            placeholder="Full Name"
                                                            value={inlineGuest.full_name}
                                                            onChange={(e) => setInlineGuest((prev) => ({ ...prev, full_name: e.target.value }))}
                                                            disabled={processing}
                                                        />
                                                    </div>

                                                    <div className="col-12 col-md-3">
                                                        <label className="form-label small text-muted mb-1">Plate Number</label>
                                                        <input
                                                            type="text"
                                                            className="form-control rems-form-control"
                                                            placeholder="Vehicle Plate"
                                                            value={inlineGuest.vehicle_plate_number}
                                                            onChange={(e) => setInlineGuest((prev) => ({ ...prev, vehicle_plate_number: e.target.value }))}
                                                            disabled={processing}
                                                        />
                                                    </div>

                                                    <div className="col-12 col-md-3">
                                                        <label className="form-label small text-muted mb-1">Vehicle Model</label>
                                                        <input
                                                            type="text"
                                                            className="form-control rems-form-control"
                                                            placeholder="Vehicle Model"
                                                            value={inlineGuest.vehicle_model}
                                                            onChange={(e) => setInlineGuest((prev) => ({ ...prev, vehicle_model: e.target.value }))}
                                                            disabled={processing}
                                                        />
                                                    </div>

                                                    <div className="col-12 col-md-2 d-flex align-items-end">
                                                        <button
                                                            type="button"
                                                            className="rems-primary-button w-100"
                                                            onClick={handleAddInlineGuest}
                                                            disabled={processing || !inlineGuest.full_name.trim()}
                                                        >
                                                            Add Guest
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* XLSX UPLOAD FORM (> 5 GUESTS) */
                                        <div className="border rounded p-3 mb-3">
                                            <div className="d-flex align-items-start gap-2 mb-3">
                                                <BsFileEarmarkSpreadsheet className="mt-1" />
                                                <div>
                                                    <div className="fw-semibold">Upload Guest List XLSX</div>
                                                    <div className="small text-muted">
                                                        Uploading a new XLSX replaces the complete current guest list.
                                                    </div>
                                                    <a
                                                        href={GUEST_LIST_TEMPLATE_URL}
                                                        download="oRES_Guest_List_Template.xlsx"
                                                        className="btn btn-sm btn-outline-secondary mt-2 d-inline-flex align-items-center gap-2"
                                                        title="Download template"
                                                    >
                                                        <BsFileEarmarkSpreadsheet /> Download template
                                                    </a>
                                                </div>
                                            </div>

                                            <div className="row g-2">
                                                <div className="col-12 col-md-8">
                                                    <input
                                                        type="file"
                                                        accept=".xlsx"
                                                        className="form-control rems-form-control"
                                                        onChange={handleGuestListFile}
                                                        disabled={processing}
                                                    />
                                                </div>

                                                <div className="col-12 col-md-4">
                                                    <button
                                                        type="button"
                                                        className="rems-primary-button w-100"
                                                        onClick={uploadGuestList}
                                                        disabled={processing || !guestListFile}
                                                    >
                                                        {processing ? (
                                                            <span className="spinner-border spinner-border-sm me-2" />
                                                        ) : (
                                                            <BsCloudUpload className="me-2" />
                                                        )}
                                                        {processing ? "Uploading..." : guestCount > 0 ? "Replace Guest List" : "Upload Guest List"}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="small text-muted mt-2">
                                                Required columns: <strong>Guest Name</strong>, <strong>Guest Vehicle Plate Number</strong>, <strong>Guest Vehicle Model</strong>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}


                            {/* GUEST TABLE */}
                            {guests.length === 0 ? (
                                <div className="rems-empty-state py-4">
                                    <div className="rems-empty-icon"><BsPeople /></div>
                                    <div className="rems-empty-title">No guests listed</div>
                                    <div className="rems-empty-text">
                                        {isInlineMode
                                            ? "Add guest details above for gate clearance."
                                            : "Upload an XLSX guest list to provide the guests who will require gate clearance."}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div className="fw-semibold">Current Guest List</div>
                                        <div className="small text-muted">{guests.length} {guests.length === 1 ? "guest" : "guests"}</div>
                                    </div>

                                    <div className="rems-table-wrapper">
                                        <table className="table rems-table align-middle mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Guest Name</th>
                                                    <th>Plate Number</th>
                                                    <th>Vehicle Model</th>
                                                    {guestListEditable && isInlineMode && <th className="text-end">Action</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {guests.map((guest, index) => (
                                                    <tr key={guest.id || index}>
                                                        <td data-label="#">{guest.row_number || index + 1}</td>
                                                        <td data-label="Guest Name">
                                                            <div className="rems-table-primary">{guest.full_name || "—"}</div>
                                                        </td>
                                                        <td data-label="Plate Number">{guest.vehicle_plate_number || "—"}</td>
                                                        <td data-label="Vehicle Model">{guest.vehicle_model || "—"}</td>
                                                        {guestListEditable && isInlineMode && (
                                                            <td data-label="Action" className="text-end">
                                                                <button
                                                                    type="button"
                                                                    className="rems-icon-button rems-action-danger"
                                                                    onClick={() => handleDeleteGuestItem(guest.id)}
                                                                    disabled={processing}
                                                                    title="Remove Guest"
                                                                >
                                                                    <BsTrash />
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>


                    {/* PAYMENT SECTION */}
                    {Number(booking.total_amount_due || 0) > 0 && (
                        <div className="rems-glass-card mb-3">
                            <div className="rems-card-header">
                                <div>
                                    <div className="rems-card-title">Booking Payment</div>
                                    <div className="rems-card-subtitle">Submit the full booking payment for HOA verification.</div>
                                </div>
                                <BsCreditCard />
                            </div>

                            <div className="p-3">
                                {paymentVerified && (
                                    <div className="alert alert-success rems-alert mb-3">
                                        <div className="d-flex align-items-start gap-2">
                                            <BsCheck2Circle className="mt-1" />
                                            <div>
                                                <div className="fw-semibold">Payment verified</div>
                                                <div className="small mt-1">Your full booking payment has been verified by HOA administration.</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {paymentPending && (
                                    <div className="alert alert-warning rems-alert mb-3">
                                        <div className="d-flex align-items-start gap-2">
                                            <BsClockHistory className="mt-1" />
                                            <div>
                                                <div className="fw-semibold">Payment awaiting verification</div>
                                                <div className="small mt-1">Your payment proof has been submitted and is waiting for HOA verification.</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {paymentRejected && (
                                    <div className="alert alert-danger rems-alert mb-3">
                                        <div className="d-flex align-items-start gap-2">
                                            <BsXCircle className="mt-1" />
                                            <div>
                                                <div className="fw-semibold">Payment rejected</div>
                                                <div className="small mt-1">Please submit the correct payment proof and reference number.</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!paymentVerified && !paymentPending && (
                                    <div className="row g-2">
                                        <div className="col-12 col-md-4">
                                            <label className="form-label small text-muted">Amount Due</label>
                                            <div className="form-control rems-form-control">₱{money(booking.total_amount_due)}</div>
                                        </div>

                                        <div className="col-12 col-md-4">
                                            <label className="form-label small text-muted">Payment Method</label>
                                            <select
                                                className="form-select rems-form-control"
                                                value={payment.payment_method}
                                                onChange={(e) => setPayment((prev) => ({ ...prev, payment_method: e.target.value }))}
                                                disabled={processing}
                                            >
                                                <option value="GCASH">GCash</option>
                                                <option value="MAYA">Maya</option>
                                                <option value="INSTAPAY_QR">InstaPay QR</option>
                                                <option value="CASH">Cash</option>
                                                <option value="CHECK">Check</option>
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-4">
                                            <label className="form-label small text-muted">Reference Number</label>
                                            <input
                                                type="text"
                                                className="form-control rems-form-control"
                                                value={payment.reference_number}
                                                onChange={(e) => setPayment((prev) => ({ ...prev, reference_number: e.target.value }))}
                                                disabled={processing}
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small text-muted">Payment Proof</label>
                                            <input
                                                type="file"
                                                className="form-control rems-form-control"
                                                onChange={(e) => setPayment((prev) => ({ ...prev, proof: e.target.files?.[0] || null }))}
                                                disabled={processing}
                                            />
                                        </div>

                                        <div className="col-12">
                                            <button
                                                type="button"
                                                className="rems-primary-button"
                                                onClick={submitPayment}
                                                disabled={processing}
                                            >
                                                {processing ? "Submitting..." : "Submit Full Booking Payment"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>


                {/* RIGHT COLUMN */}
                <div className="col-12 col-xl-4">

                    {/* FINANCIAL SUMMARY */}
                    <div className="rems-glass-card mb-3">
                        <div className="rems-card-header">
                            <div className="rems-card-title">Financial Summary</div>
                        </div>
                        <div className="p-3">
                            <div className="d-flex justify-content-between py-2">
                                <span>Rental Fee</span>
                                <strong>₱{money(booking.rental_fee)}</strong>
                            </div>
                            <div className="d-flex justify-content-between py-2">
                                <span>Resident Discount</span>
                                <strong>- ₱{money(booking.discount_amount)}</strong>
                            </div>
                            <div className="d-flex justify-content-between py-2">
                                <span>Security Deposit</span>
                                <strong>₱{money(booking.security_deposit)}</strong>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between py-2">
                                <strong>Total Due</strong>
                                <strong>₱{money(booking.total_amount_due)}</strong>
                            </div>
                        </div>
                    </div>

                    {/* SECURITY STATUS */}
                    <div className="rems-glass-card mb-3">
                        <div className="p-3">
                            <div className="rems-card-title mb-2">Security Clearance</div>
                            {guestListLocked ? (
                                <div className="alert alert-success rems-alert mb-0">
                                    <div className="d-flex align-items-start gap-2">
                                        <BsShieldCheck className="mt-1" />
                                        <div>
                                            <div className="fw-semibold">Clearance completed</div>
                                            <div className="small mt-1">The guest list is now permanently locked.</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="alert alert-secondary rems-alert mb-0">
                                    <div className="d-flex align-items-start gap-2">
                                        <BsShieldCheck className="mt-1" />
                                        <div>
                                            <div className="fw-semibold">Clearance pending</div>
                                            <div className="small mt-1">The guest list may still be updated until security clearance is completed.</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BOOKING ACTIONS */}
                    <div className="rems-glass-card">
                        <div className="p-3">
                            <div className="rems-card-title mb-2">Booking Actions</div>
                            {canCancel && (
                                <button
                                    type="button"
                                    className="rems-primary-button w-100 mb-2"
                                    onClick={cancelBooking}
                                    disabled={processing}
                                >
                                    {processing ? "Cancelling..." : "Cancel Booking"}
                                </button>
                            )}
                            <button type="button" className="rems-secondary-button w-100" onClick={goBack}>
                                <BsArrowLeft /> Back to Bookings
                            </button>
                        </div>
                    </div>

                </div>
            </div>


            {/* FOOTER NOTE */}
            <div className="mt-3" style={{ color: "#929baa", fontSize: "0.68rem" }}>
                <BsShieldCheck className="me-1" />
                Guest and vehicle information remains editable until security clearance is completed. Once security clearance is completed, the guest list becomes permanently locked.
            </div>

        </div>
    );
}


// import {
//     useCallback,
//     useEffect,
//     useMemo,
//     useRef,
//     useState,
// } from "react";

// import {
//     useNavigate,
//     useParams,
// } from "react-router-dom";

// import {
//     BsArrowLeft,
//     BsArrowClockwise,
//     BsCheck2Circle,
//     BsCloudUpload,
//     BsCreditCard,
//     BsExclamationTriangle,
//     BsFileEarmarkSpreadsheet,
//     BsClockHistory,
//     BsPeople,
//     BsShieldCheck,
//     BsXCircle,
// } from "react-icons/bs";

// import {
//     getMyFacilityBookings,
//     getBookingGuests,
//     getBookingPayments,
//     submitFacilityBooking,
//     cancelFacilityBooking,
//     importBookingGuestList,
//     createBookingPayment,
// } from "../../api/facilities";


// /* =========================================================
//    HELPERS
// ========================================================= */

// const normalize = (response) => {
//     if (Array.isArray(response)) {
//         return response;
//     }

//     return (
//         response?.results ||
//         response?.bookings ||
//         response?.guests ||
//         response?.payments ||
//         []
//     );
// };


// const normalizeStatus = (status) => {
//     return String(status || "")
//         .trim()
//         .toUpperCase();
// };


// const money = (value) => {
//     const amount = Number(value || 0);

//     return amount.toLocaleString(
//         undefined,
//         {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2,
//         }
//     );
// };


// const getErrorMessage = (
//     error,
//     fallback = "Unable to complete the request."
// ) => {
//     const data =
//         error?.response?.data;

//     if (
//         typeof data === "string"
//     ) {
//         return data;
//     }

//     if (
//         data?.detail
//     ) {
//         return String(
//             data.detail
//         );
//     }

//     if (
//         data?.message
//     ) {
//         return String(
//             data.message
//         );
//     }

//     if (
//         data &&
//         typeof data === "object"
//     ) {
//         const preferredFields = [
//             "booking",
//             "file",
//             "guests",
//             "payments",
//             "status",
//             "detail",
//         ];

//         for (
//             const field
//             of preferredFields
//         ) {
//             const value =
//                 data?.[field];

//             if (
//                 Array.isArray(value) &&
//                 value.length > 0
//             ) {
//                 return String(
//                     value[0]
//                 );
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
//                         Boolean(value)
//                 );

//         if (
//             firstError
//         ) {
//             return String(
//                 firstError
//             );
//         }
//     }

//     if (
//         error?.message
//     ) {
//         return String(
//             error.message
//         );
//     }

//     return fallback;
// };


// const getStatusClass = (
//     status
// ) => {
//     switch (
//         normalizeStatus(status)
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

//         case "COMPLETED":
//             return "rems-status-success";

//         case "CLOSED":
//             return "rems-status-secondary";

//         case "EXPIRED":
//             return "rems-status-secondary";

//         case "REJECTED":
//             return "rems-status-danger";

//         case "CANCELLED":
//             return "rems-status-danger";

//         default:
//             return "rems-status-secondary";
//     }
// };


// /* =========================================================
//    GUEST LIST EDITABILITY
// ========================================================= */

// /*
//  * Guest list may be modified while the booking is:
//  *
//  * PENCIL
//  * PENDING
//  * APPROVED
//  *
//  * Security clearance is the permanent locking point.
//  *
//  * Once security_clearance_completed === true:
//  *
//  * - XLSX import is disabled
//  * - guest creation is disabled
//  * - guest editing is disabled
//  * - guest deletion is disabled
//  *
//  * The backend independently enforces the same rule.
//  */

// const GUEST_EDITABLE_STATUSES = [
//     "PENCIL",
//     "PENDING",
//     "APPROVED",
// ];


// /* =========================================================
//    STORED GUEST TEMPLATE
// ========================================================= */

// const GUEST_LIST_TEMPLATE_URL =
//     "/oRES_Guest_List_Template.xlsx";


// const canEditGuestList = (
//     booking
// ) => {
//     if (
//         !booking
//     ) {
//         return false;
//     }

//     if (
//         booking.security_clearance_completed
//     ) {
//         return false;
//     }

//     return GUEST_EDITABLE_STATUSES.includes(
//         normalizeStatus(
//             booking.status
//         )
//     );
// };


// const formatHoldTime = (totalSeconds) => {
//     const seconds = Math.max(
//         0,
//         Number(totalSeconds || 0)
//     );

//     const minutes = Math.floor(
//         seconds / 60
//     );

//     const remainder = seconds % 60;

//     return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
// };


// /* =========================================================
//    COMPONENT
// ========================================================= */

// export default function ResidentFacilityBookingDetails() {
//     const {
//         id,
//     } = useParams();

//     const navigate =
//         useNavigate();

//     const portalPrefix =
//         window.location.pathname.startsWith(
//             "/tenant"
//         )
//             ? "/tenant"
//             : "/homeowner";


//     /* =====================================================
//        DATA
//     ===================================================== */

//     const [
//         booking,
//         setBooking,
//     ] = useState(null);

//     const [
//         guests,
//         setGuests,
//     ] = useState([]);

//     const [
//         payments,
//         setPayments,
//     ] = useState([]);


//     /* =====================================================
//        PAGE STATE
//     ===================================================== */

//     const [
//         loading,
//         setLoading,
//     ] = useState(true);

//     const [
//         refreshing,
//         setRefreshing,
//     ] = useState(false);

//     const [
//         processing,
//         setProcessing,
//     ] = useState(false);

//     const [
//         error,
//         setError,
//     ] = useState("");


//     /* =====================================================
//        XLSX STATE
//     ===================================================== */

//     const [
//         guestListFile,
//         setGuestListFile,
//     ] = useState(null);


//     /* =====================================================
//        PAYMENT STATE
//     ===================================================== */

//     const [
//         payment,
//         setPayment,
//     ] = useState({
//         payment_method: "GCASH",
//         reference_number: "",
//         proof: null,
//     });


//     /* =====================================================
//        ERROR REF
//     ===================================================== */

//     const errorRef =
//         useRef(null);


//     /* =====================================================
//        PENCIL HOLD STATE
//     ===================================================== */

//     const [
//         pencilRemainingSeconds,
//         setPencilRemainingSeconds,
//     ] = useState(null);

//     const pencilExpiryActionRef =
//         useRef(false);

//     const [
//         pencilExpiryProcessing,
//         setPencilExpiryProcessing,
//     ] = useState(false);


//     /* =====================================================
//        LOAD BOOKING
//     ===================================================== */

//     const load = useCallback(
//         async (
//             refresh = false
//         ) => {
//             if (
//                 refresh
//             ) {
//                 setRefreshing(
//                     true
//                 );
//             } else {
//                 setLoading(
//                     true
//                 );
//             }

//             setError("");

//             try {
//                 /*
//                  * Fetch the booking itself.
//                  */
//                 const bookingResponse =
//                     await getMyFacilityBookings();

//                 const bookings =
//                     normalize(
//                         bookingResponse
//                     );

//                 const found =
//                     bookings.find(
//                         (item) =>
//                             String(
//                                 item.id
//                             ) ===
//                             String(id)
//                     );

//                 if (
//                     !found
//                 ) {
//                     setBooking(
//                         null
//                     );

//                     setGuests(
//                         []
//                     );

//                     setPayments(
//                         []
//                     );

//                     setError(
//                         "The booking could not be found."
//                     );

//                     return;
//                 }

//                 setBooking(
//                     found
//                 );


//                 /*
//                  * Fetch guest records separately.
//                  *
//                  * This avoids relying on stale nested
//                  * serializer data.
//                  */
//                 try {
//                     const guestResponse =
//                         await getBookingGuests(
//                             found.id
//                         );

//                     const guestRecords =
//                         normalize(
//                             guestResponse
//                         );

//                     setGuests(
//                         guestRecords.filter(
//                             (guest) =>
//                                 String(
//                                     guest?.booking
//                                 ) ===
//                                     String(
//                                         found.id
//                                     ) ||
//                                 !guest?.booking
//                         )
//                     );
//                 } catch (
//                     guestError
//                 ) {
//                     console.error(
//                         "[Facility Booking Details] Guest load failed:",
//                         guestError
//                     );

//                     /*
//                      * If the booking serializer already
//                      * supplied guests, retain them.
//                      */
//                     setGuests(
//                         Array.isArray(
//                             found?.guests
//                         )
//                             ? found.guests
//                             : []
//                     );
//                 }


//                 /*
//                  * Fetch payments separately.
//                  */
//                 try {
//                     const paymentResponse =
//                         await getBookingPayments(
//                             found.id
//                         );

//                     const paymentRecords =
//                         normalize(
//                             paymentResponse
//                         );

//                     setPayments(
//                         paymentRecords.filter(
//                             (item) =>
//                                 String(
//                                     item?.booking
//                                 ) ===
//                                     String(
//                                         found.id
//                                     ) ||
//                                 !item?.booking
//                         )
//                     );
//                 } catch (
//                     paymentError
//                 ) {
//                     console.error(
//                         "[Facility Booking Details] Payment load failed:",
//                         paymentError
//                     );

//                     setPayments(
//                         Array.isArray(
//                             found?.payments
//                         )
//                             ? found.payments
//                             : []
//                     );
//                 }

//             } catch (
//                 err
//             ) {
//                 console.error(
//                     "[Facility Booking Details] Load failed:",
//                     err
//                 );

//                 setError(
//                     getErrorMessage(
//                         err,
//                         "Unable to load booking details."
//                     )
//                 );
//             } finally {
//                 setLoading(
//                     false
//                 );

//                 setRefreshing(
//                     false
//                 );
//             }
//         },
//         [id]
//     );


//     /* =====================================================
//        INITIAL LOAD
//     ===================================================== */

//     useEffect(
//         () => {
//             load();
//         },
//         [
//             load,
//         ]
//     );


//     /* =====================================================
//        EFFECTIVE 30-MINUTE PENCIL HOLD
//     ===================================================== */

//     useEffect(
//         () => {
//             const status = normalizeStatus(
//                 booking?.status
//             );

//             if (
//                 status !== "PENCIL" ||
//                 !booking?.pencil_expires_at
//             ) {
//                 setPencilRemainingSeconds(null);
//                 pencilExpiryActionRef.current = false;
//                 return undefined;
//             }

//             const getRemaining = () => {
//                 const expiry = new Date(
//                     booking.pencil_expires_at
//                 ).getTime();

//                 if (Number.isNaN(expiry)) {
//                     return null;
//                 }

//                 return Math.max(
//                     0,
//                     Math.ceil(
//                         (expiry - Date.now()) / 1000
//                     )
//                 );
//             };

//             const tick = async () => {
//                 const remaining = getRemaining();

//                 if (remaining === null) {
//                     setPencilRemainingSeconds(null);
//                     return;
//                 }

//                 setPencilRemainingSeconds(remaining);

//                 if (
//                     remaining > 0 ||
//                     pencilExpiryActionRef.current
//                 ) {
//                     return;
//                 }

//                 pencilExpiryActionRef.current = true;
//                 setPencilExpiryProcessing(true);
//                 setProcessing(true);
//                 setError("");

//                 try {
//                     await cancelFacilityBooking(
//                         booking.id,
//                         "Pencil booking hold expired before submission."
//                     );

//                     await load(true);
//                 } catch (err) {
//                     console.error(
//                         "[Facility Booking Details] Pencil hold expiration failed:",
//                         err
//                     );

//                     setPencilRemainingSeconds(0);
//                     setError(
//                         getErrorMessage(
//                             err,
//                             "The 30-minute booking hold has expired, but the booking status could not be updated. Please refresh the page."
//                         )
//                     );
//                     pencilExpiryActionRef.current = false;
//                 } finally {
//                     setPencilExpiryProcessing(false);
//                     setProcessing(false);
//                 }
//             };

//             void tick();

//             const interval = window.setInterval(
//                 () => {
//                     void tick();
//                 },
//                 1000
//             );

//             return () => {
//                 window.clearInterval(interval);
//             };
//         },
//         [
//             booking,
//             load,
//         ]
//     );


//     /* =====================================================
//        AUTO REFRESH
//     ===================================================== */

//     useEffect(
//         () => {
//             const interval =
//                 window.setInterval(
//                     () => {
//                         load(
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
//             load,
//         ]
//     );


//     /* =====================================================
//        AUTO-SCROLL ERROR
//     ===================================================== */

//     useEffect(
//         () => {
//             if (
//                 !error
//             ) {
//                 return;
//             }

//             const timer =
//                 window.setTimeout(
//                     () => {
//                         errorRef.current?.scrollIntoView(
//                             {
//                                 behavior:
//                                     "smooth",
//                                 block:
//                                     "center",
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


//     const pencilHoldActive =
//         normalizeStatus(
//             booking?.status
//         ) === "PENCIL" &&
//         Number(
//             pencilRemainingSeconds
//         ) > 0 &&
//         !pencilExpiryProcessing;


//     const pencilHoldExpired =
//         normalizeStatus(
//             booking?.status
//         ) === "PENCIL" &&
//         Number(
//             pencilRemainingSeconds
//         ) <= 0;


//     /* =====================================================
//        ACTION WRAPPER
//     ===================================================== */

//     const runAction =
//         async (
//             callback
//         ) => {
//             setProcessing(
//                 true
//             );

//             setError("");

//             try {
//                 await callback();

//                 await load(
//                     true
//                 );
//             } catch (
//                 err
//             ) {
//                 console.error(
//                     "[Facility Booking Details] Action failed:",
//                     err
//                 );

//                 setError(
//                     getErrorMessage(
//                         err,
//                         "Unable to complete the action."
//                     )
//                 );
//             } finally {
//                 setProcessing(
//                     false
//                 );
//             }
//         };


//     /* =====================================================
//        GUEST LIST STATE
//     ===================================================== */

//     const guestLimit =
//         useMemo(
//             () =>
//                 Number(
//                     booking?.estimated_guests ||
//                     0
//                 ),
//             [
//                 booking,
//             ]
//         );


//     const guestCount =
//         guests.length;


//     const guestListEditable =
//         useMemo(
//             () =>
//                 canEditGuestList(
//                     booking
//                 ) &&
//                 !pencilHoldExpired,
//             [
//                 booking,
//             ]
//         );


//     const guestListLocked =
//         Boolean(
//             booking?.security_clearance_completed
//         );


//     /* =====================================================
//        PAYMENT STATE
//     ===================================================== */

//     const bookingTotalPayments =
//         useMemo(
//             () =>
//                 payments.filter(
//                     (item) =>
//                         normalizeStatus(
//                             item?.payment_type
//                         ) ===
//                         "BOOKING_TOTAL"
//                 ),
//             [
//                 payments,
//             ]
//         );


//     const latestBookingPayment =
//         useMemo(
//             () => {
//                 if (
//                     bookingTotalPayments.length ===
//                     0
//                 ) {
//                     return null;
//                 }

//                 return [
//                     ...bookingTotalPayments,
//                 ].sort(
//                     (
//                         a,
//                         b
//                     ) =>
//                         String(
//                             b?.created_at ||
//                             ""
//                         ).localeCompare(
//                             String(
//                                 a?.created_at ||
//                                 ""
//                             )
//                         )
//                 )[0];
//             },
//             [
//                 bookingTotalPayments,
//             ]
//         );


//     const paymentStatus =
//         normalizeStatus(
//             latestBookingPayment?.status
//         );


//     const paymentVerified =
//         paymentStatus ===
//         "VERIFIED";


//     const paymentPending =
//         paymentStatus ===
//         "PENDING";


//     const paymentRejected =
//         paymentStatus ===
//         "REJECTED";


//     /* =====================================================
//        SUBMIT RESERVATION
//     ===================================================== */

//     const canSubmit =
//         pencilHoldActive;


//     const submitReservation =
//         async () => {
//             if (
//                 !booking?.id
//             ) {
//                 return;
//             }

//             if (
//                 !canSubmit
//             ) {
//                 setError(
//                     "Only an active Pencil Book can be submitted for approval."
//                 );

//                 return;
//             }

//             if (
//                 guestCount <=
//                 0
//             ) {
//                 setError(
//                     "Please complete the guest list before submitting the reservation."
//                 );

//                 return;
//             }

//             if (
//                 guestLimit > 0 &&
//                 guestCount >
//                     guestLimit
//             ) {
//                 setError(
//                     "The guest list exceeds the number of guests requested for this booking."
//                 );

//                 return;
//             }

//             await runAction(
//                 async () => {
//                     await submitFacilityBooking(
//                         booking.id
//                     );
//                 }
//             );
//         };


//     /* =====================================================
//        XLSX FILE SELECT
//     ===================================================== */

//     const handleGuestListFile =
//         (
//             event
//         ) => {
//             setError("");

//             const file =
//                 event.target.files?.[0] ||
//                 null;

//             if (
//                 !file
//             ) {
//                 setGuestListFile(
//                     null
//                 );

//                 return;
//             }

//             if (
//                 !file.name
//                     .toLowerCase()
//                     .endsWith(
//                         ".xlsx"
//                     )
//             ) {
//                 setGuestListFile(
//                     null
//                 );

//                 event.target.value =
//                     "";

//                 setError(
//                     "Only .xlsx guest list files are accepted."
//                 );

//                 return;
//             }

//             setGuestListFile(
//                 file
//             );
//         };


//     /* =====================================================
//        XLSX IMPORT
//     ===================================================== */

//     const uploadGuestList =
//         async () => {
//             setError("");

//             if (
//                 !booking?.id
//             ) {
//                 setError(
//                     "The booking could not be identified."
//                 );

//                 return;
//             }


//             /*
//              * Frontend protection.
//              *
//              * The backend performs the same validation,
//              * so this cannot be bypassed by simply
//              * manipulating the UI.
//              */
//             if (
//                 booking.security_clearance_completed
//             ) {
//                 setGuestListFile(
//                     null
//                 );

//                 setError(
//                     "The guest list is locked because security clearance has already been completed."
//                 );

//                 return;
//             }


//             if (
//                 !GUEST_EDITABLE_STATUSES.includes(
//                     normalizeStatus(
//                         booking.status
//                     )
//                 )
//             ) {
//                 setError(
//                     "The guest list cannot be modified in the current booking status."
//                 );

//                 return;
//             }


//             if (
//                 !guestListFile
//             ) {
//                 setError(
//                     "Please select an XLSX guest list file."
//                 );

//                 return;
//             }


//             if (
//                 !guestListFile.name
//                     .toLowerCase()
//                     .endsWith(
//                         ".xlsx"
//                     )
//             ) {
//                 setError(
//                     "Only .xlsx guest list files are accepted."
//                 );

//                 return;
//             }


//             /*
//              * Confirm replacement.
//              *
//              * The backend importer uses
//              * replace_existing=True.
//              *
//              * Therefore the uploaded XLSX becomes the
//              * complete new guest list.
//              */
//             const confirmed =
//                 window.confirm(
//                     guestCount > 0
//                         ? "Uploading this XLSX will replace the current guest list for this booking. Continue?"
//                         : "Upload this XLSX as the guest list for this booking?"
//                 );


//             if (
//                 !confirmed
//             ) {
//                 return;
//             }


//             setProcessing(
//                 true
//             );

//             setError("");


//             try {
//                 await importBookingGuestList(
//                     booking.id,
//                     guestListFile
//                 );


//                 setGuestListFile(
//                     null
//                 );


//                 /*
//                  * Refresh booking and guest data.
//                  *
//                  * This also retrieves the authoritative
//                  * security-clearance state.
//                  */
//                 await load(
//                     true
//                 );

//             } catch (
//                 err
//             ) {
//                 console.error(
//                     "[Facility Booking Details] Guest XLSX import failed:",
//                     err
//                 );

//                 setError(
//                     getErrorMessage(
//                         err,
//                         "Unable to upload the guest list."
//                     )
//                 );
//             } finally {
//                 setProcessing(
//                     false
//                 );
//             }
//         };


//     /* =====================================================
//        PAYMENT
//     ===================================================== */

//     const submitPayment =
//         async () => {
//             if (
//                 !booking?.id
//             ) {
//                 return;
//             }

//             const totalDue =
//                 Number(
//                     booking?.total_amount_due ||
//                     0
//                 );


//             if (
//                 totalDue <=
//                 0
//             ) {
//                 setError(
//                     "No booking payment is currently required."
//                 );

//                 return;
//             }


//             if (
//                 paymentVerified
//             ) {
//                 setError(
//                     "The full booking payment has already been verified."
//                 );

//                 return;
//             }


//             if (
//                 !payment.reference_number.trim()
//             ) {
//                 setError(
//                     "Payment reference number is required."
//                 );

//                 return;
//             }


//             if (
//                 !(payment.proof instanceof File)
//             ) {
//                 setError(
//                     "Please upload your payment proof."
//                 );

//                 return;
//             }


//             await runAction(
//                 async () => {
//                     await createBookingPayment(
//                         {
//                             booking:
//                                 booking.id,

//                             payment_method:
//                                 payment.payment_method,

//                             amount:
//                                 totalDue,

//                             reference_number:
//                                 payment.reference_number.trim(),

//                             proof:
//                                 payment.proof,
//                         }
//                     );


//                     setPayment(
//                         {
//                             payment_method:
//                                 "GCASH",

//                             reference_number:
//                                 "",

//                             proof:
//                                 null,
//                         }
//                     );
//                 }
//             );
//         };


//     /* =====================================================
//        CANCEL
//     ===================================================== */

//     const canCancel =
//         [
//             "PENDING",
//             "APPROVED",
//         ].includes(
//             normalizeStatus(
//                 booking?.status
//             )
//         ) ||
//         (
//             normalizeStatus(
//                 booking?.status
//             ) === "PENCIL" &&
//             pencilHoldActive
//         );


//     const cancelBooking =
//         async () => {
//             if (
//                 !booking?.id ||
//                 !canCancel
//             ) {
//                 return;
//             }


//             const confirmed =
//                 window.confirm(
//                     `Cancel the ${
//                         booking.facility_name ||
//                         "facility"
//                     } reservation on ${
//                         booking.booking_date ||
//                         "the selected date"
//                     }?`
//                 );


//             if (
//                 !confirmed
//             ) {
//                 return;
//             }


//             await runAction(
//                 async () => {
//                     await cancelFacilityBooking(
//                         booking.id,
//                         "Cancelled by resident."
//                     );
//                 }
//             );
//         };


//     /* =====================================================
//        BACK
//     ===================================================== */

//     const goBack =
//         () => {
//             navigate(
//                 `${portalPrefix}/facilities/bookings`
//             );
//         };


//     /* =====================================================
//        LOADING
//     ===================================================== */

//     if (
//         loading
//     ) {
//         return (
//             <div className="rems-page-content">

//                 <div className="rems-loading-state">

//                     <div
//                         className="spinner-border"
//                         role="status"
//                         aria-hidden="true"
//                     />

//                     <div className="mt-3">
//                         Loading booking...
//                     </div>

//                 </div>

//             </div>
//         );
//     }


//     /* =====================================================
//        BOOKING NOT FOUND
//     ===================================================== */

//     if (
//         !booking
//     ) {
//         return (
//             <div className="rems-page-content">

//                 <button
//                     type="button"
//                     className="rems-secondary-button mb-3"
//                     onClick={
//                         goBack
//                     }
//                 >
//                     <BsArrowLeft />
//                     Back
//                 </button>


//                 <div className="rems-glass-card">

//                     <div className="rems-empty-state">

//                         <div className="rems-empty-title">
//                             Booking unavailable
//                         </div>

//                         <div className="rems-empty-text">
//                             {
//                                 error ||
//                                 "The booking could not be found."
//                             }
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
//         <div className="rems-page-content">

//             {/* =================================================
//                 HEADER
//             ================================================= */}

//             <div className="rems-page-header">

//                 <div>

//                     <div className="rems-page-eyebrow">
//                         FACILITY BOOKING
//                     </div>

//                     <h1 className="rems-page-title">
//                         {
//                             booking.facility_name ||
//                             "Facility Booking"
//                         }
//                     </h1>

//                     <p className="rems-page-description">
//                         Manage your reservation,
//                         guest list, payment,
//                         and security-clearance status.
//                     </p>

//                 </div>


//                 <div className="rems-page-header-actions">

//                     <button
//                         type="button"
//                         className="rems-secondary-button"
//                         onClick={() =>
//                             load(
//                                 true
//                             )
//                         }
//                         disabled={
//                             refreshing ||
//                             processing
//                         }
//                     >

//                         {refreshing ? (
//                             <span className="spinner-border spinner-border-sm" />
//                         ) : (
//                             <BsArrowClockwise />
//                         )}

//                         {
//                             refreshing
//                                 ? "Refreshing..."
//                                 : "Refresh"
//                         }

//                     </button>


//                     <button
//                         type="button"
//                         className="rems-secondary-button"
//                         onClick={
//                             goBack
//                         }
//                     >
//                         <BsArrowLeft />
//                         Back
//                     </button>

//                 </div>

//             </div>


//             {/* =================================================
//                 ERROR
//             ================================================= */}

//             {error && (
//                 <div
//                     ref={
//                         errorRef
//                     }
//                     tabIndex={-1}
//                     className="alert alert-danger rems-alert mb-4"
//                     role="alert"
//                     style={{
//                         outline:
//                             "none",
//                         scrollMarginTop:
//                             "24px",
//                     }}
//                 >

//                     <div className="d-flex align-items-start gap-2">

//                         <BsExclamationTriangle
//                             className="mt-1 flex-shrink-0"
//                         />

//                         <div className="flex-grow-1">

//                             <div className="fw-semibold">
//                                 Unable to complete the request
//                             </div>

//                             <div className="mt-1">
//                                 {
//                                     error
//                                 }
//                             </div>

//                         </div>

//                         <button
//                             type="button"
//                             className="btn-close"
//                             aria-label="Close"
//                             onClick={() =>
//                                 setError(
//                                     ""
//                                 )
//                             }
//                         />

//                     </div>

//                 </div>
//             )}


//             {/* =================================================
//                 MAIN CONTENT
//             ================================================= */}

//             <div className="row g-3">

//                 <div className="col-12 col-xl-8">


//                     {/* =================================================
//                         RESERVATION DETAILS
//                     ================================================= */}

//                     <div className="rems-glass-card mb-3">

//                         <div className="rems-card-header">

//                             <div>

//                                 <div className="rems-card-title">
//                                     Reservation Details
//                                 </div>

//                                 <div className="rems-card-subtitle">
//                                     {
//                                         booking.booking_date
//                                     }
//                                     {" · "}
//                                     {
//                                         booking.start_time
//                                     }
//                                     {" — "}
//                                     {
//                                         booking.end_time
//                                     }
//                                 </div>

//                             </div>


//                             <span
//                                 className={`rems-status-badge ${getStatusClass(
//                                     booking.status
//                                 )}`}
//                             >

//                                 <span className="rems-status-dot" />

//                                 {
//                                     booking.status_display ||
//                                     booking.status ||
//                                     "—"
//                                 }

//                             </span>

//                         </div>


//                         <div className="p-3">

//                             <div className="row g-3">

//                                 <div className="col-6 col-md-3">

//                                     <div className="rems-table-secondary">
//                                         Guests Requested
//                                     </div>

//                                     <div className="rems-table-primary">
//                                         {
//                                             booking.estimated_guests ||
//                                             0
//                                         }
//                                     </div>

//                                 </div>


//                                 <div className="col-6 col-md-3">

//                                     <div className="rems-table-secondary">
//                                         Guests Listed
//                                     </div>

//                                     <div className="rems-table-primary">
//                                         {
//                                             guestCount
//                                         }
//                                     </div>

//                                 </div>


//                                 <div className="col-6 col-md-3">

//                                     <div className="rems-table-secondary">
//                                         Rental
//                                     </div>

//                                     <div className="rems-table-primary">
//                                         ₱
//                                         {
//                                             money(
//                                                 booking.rental_fee
//                                             )
//                                         }
//                                     </div>

//                                 </div>


//                                 <div className="col-6 col-md-3">

//                                     <div className="rems-table-secondary">
//                                         Total Due
//                                     </div>

//                                     <div className="rems-table-primary">
//                                         ₱
//                                         {
//                                             money(
//                                                 booking.total_amount_due
//                                             )
//                                         }
//                                     </div>

//                                 </div>

//                             </div>

//                         </div>

//                     </div>


//                     {/* =================================================
//                         PENCIL HOLD STATUS
//                     ================================================= */}

//                     {normalizeStatus(
//                         booking.status
//                     ) === "PENCIL" && (
//                         <div
//                             className={`rems-glass-card mb-3 ${
//                                 pencilHoldExpired
//                                     ? "border border-danger"
//                                     : ""
//                             }`}
//                         >
//                             <div className="p-3">
//                                 <div className="d-flex align-items-start gap-3">
//                                     {pencilHoldExpired ? (
//                                         <BsXCircle className="mt-1 text-danger flex-shrink-0" />
//                                     ) : (
//                                         <BsClockHistory className="mt-1 flex-shrink-0" />
//                                     )}

//                                     <div className="flex-grow-1">
//                                         <div className="fw-semibold">
//                                             {pencilHoldExpired
//                                                 ? "Booking hold expired"
//                                                 : "Booking hold active"}
//                                         </div>

//                                         <div className="small text-muted mt-1">
//                                             {pencilHoldExpired
//                                                 ? "The 30-minute Pencil hold has expired. This booking can no longer be submitted and the facility hold is being released."
//                                                 : "This facility is held for you for 30 minutes from booking creation. Submit the reservation before the timer reaches zero."}
//                                             {pencilExpiryProcessing && " Updating booking status..."}
//                                         </div>
//                                     </div>

//                                     <div className="text-end flex-shrink-0">
//                                         <div className="small text-muted">
//                                             {pencilHoldExpired ? "EXPIRED" : "TIME LEFT"}
//                                         </div>
//                                         <div
//                                             className={`fw-bold ${
//                                                 pencilHoldExpired ? "text-danger" : ""
//                                             }`}
//                                             style={{ fontVariantNumeric: "tabular-nums" }}
//                                         >
//                                             {pencilHoldExpired
//                                                 ? "00:00"
//                                                 : formatHoldTime(pencilRemainingSeconds)}
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}


//                     {/* =================================================
//                         SUBMIT RESERVATION
//                     ================================================= */}

//                     {canSubmit && (

//                         <div className="rems-glass-card mb-3">

//                             <div className="p-3">

//                                 <div className="rems-form-section-title">

//                                     <BsCheck2Circle className="me-2" />

//                                     Submit Reservation

//                                 </div>


//                                 <p className="small text-muted mb-3">

//                                     Review your reservation
//                                     details and complete the
//                                     guest list before submitting
//                                     it for HOA approval.

//                                 </p>


//                                 <button
//                                     type="button"
//                                     className="rems-primary-button"
//                                     onClick={
//                                         submitReservation
//                                     }
//                                     disabled={
//                                         processing ||
//                                         guestCount === 0
//                                     }
//                                 >

//                                     {
//                                         processing
//                                             ? "Submitting..."
//                                             : "Submit Reservation"
//                                     }

//                                 </button>

//                             </div>

//                         </div>

//                     )}


//                     {/* =================================================
//                         GUEST LIST
//                     ================================================= */}

//                     <div className="rems-glass-card mb-3">

//                         <div className="rems-card-header">

//                             <div>

//                                 <div className="rems-card-title">

//                                     Guest List

//                                 </div>


//                                 <div className="rems-card-subtitle">

//                                     Guest details for
//                                     gate clearance.
//                                     Maximum requested guests:

//                                     {" "}

//                                     {
//                                         guestLimit
//                                     }

//                                 </div>

//                             </div>


//                             <BsPeople />

//                         </div>


//                         <div className="p-3">


//                             {/* =================================================
//                                 EDITABLE STATE
//                             ================================================= */}

//                             {guestListEditable ? (

//                                 <>

//                                     <div className="alert alert-info rems-alert mb-3">

//                                         <div className="d-flex align-items-start gap-2">

//                                             <BsShieldCheck
//                                                 className="mt-1 flex-shrink-0"
//                                             />

//                                             <div>

//                                                 <div className="fw-semibold">

//                                                     Guest list is editable

//                                                 </div>

//                                                 <div className="small mt-1">

//                                                     You may update or
//                                                     replace your guest
//                                                     list while this
//                                                     booking is in{" "}

//                                                     <strong>
//                                                         {
//                                                             booking.status_display ||
//                                                             booking.status
//                                                         }
//                                                     </strong>

//                                                     status.

//                                                     Guest changes are
//                                                     permanently locked
//                                                     after security
//                                                     clearance.

//                                                 </div>

//                                             </div>

//                                         </div>

//                                     </div>


//                                     {/* =================================================
//                                         XLSX UPLOAD
//                                     ================================================= */}

//                                     <div className="border rounded p-3 mb-3">

//                                         <div className="d-flex align-items-start gap-2 mb-3">

//                                             <BsFileEarmarkSpreadsheet
//                                                 className="mt-1"
//                                             />

//                                             <div>

//                                                 <div className="fw-semibold">

//                                                     Upload Guest List XLSX

//                                                 </div>

//                                                 <div className="small text-muted">

//                                                     Uploading a new XLSX
//                                                     replaces the complete
//                                                     current guest list.

//                                                 </div>

//                                                 {guestLimit > 5 && (
//                                                     <a
//                                                         href={GUEST_LIST_TEMPLATE_URL}
//                                                         download="oRES_Guest_List_Template.xlsx"
//                                                         className="btn btn-sm btn-outline-secondary mt-2 d-inline-flex align-items-center gap-2"
//                                                         title="Download the oRES guest list template"
//                                                         aria-label="Download the oRES guest list template"
//                                                     >
//                                                         <BsFileEarmarkSpreadsheet />
//                                                         Download template
//                                                     </a>
//                                                 )}

//                                             </div>

//                                         </div>


//                                         <div className="row g-2">

//                                             <div className="col-12 col-md-8">

//                                                 <input
//                                                     type="file"
//                                                     accept=".xlsx"
//                                                     className="form-control rems-form-control"
//                                                     onChange={
//                                                         handleGuestListFile
//                                                     }
//                                                     disabled={
//                                                         processing
//                                                     }
//                                                 />

//                                             </div>


//                                             <div className="col-12 col-md-4">

//                                                 <button
//                                                     type="button"
//                                                     className="rems-primary-button w-100"
//                                                     onClick={
//                                                         uploadGuestList
//                                                     }
//                                                     disabled={
//                                                         processing ||
//                                                         !guestListFile
//                                                     }
//                                                 >

//                                                     {processing ? (
//                                                         <span className="spinner-border spinner-border-sm me-2" />
//                                                     ) : (
//                                                         <BsCloudUpload className="me-2" />
//                                                     )}

//                                                     {
//                                                         processing
//                                                             ? "Uploading..."
//                                                             : guestCount > 0
//                                                                 ? "Replace Guest List"
//                                                                 : "Upload Guest List"
//                                                     }

//                                                 </button>

//                                             </div>

//                                         </div>


//                                         <div className="small text-muted mt-2">

//                                             Required columns:

//                                             {" "}

//                                             <strong>
//                                                 Guest Name
//                                             </strong>
//                                             {", "}
//                                             <strong>
//                                                 Guest Vehicle Plate Number
//                                             </strong>
//                                             {", "}
//                                             <strong>
//                                                 Guest Vehicle Model
//                                             </strong>

//                                         </div>

//                                     </div>

//                                 </>

//                             ) : guestListLocked ? (

//                                 /* =================================================
//                                    LOCKED AFTER SECURITY CLEARANCE
//                                 ================================================= */

//                                 <div className="alert alert-success rems-alert mb-3">

//                                     <div className="d-flex align-items-start gap-2">

//                                         <BsShieldCheck
//                                             className="mt-1 flex-shrink-0"
//                                         />

//                                         <div>

//                                             <div className="fw-semibold">

//                                                 Guest list locked

//                                             </div>

//                                             <div className="small mt-1">

//                                                 Security clearance has
//                                                 been completed. The guest
//                                                 list can no longer be
//                                                 changed.

//                                             </div>

//                                         </div>

//                                     </div>

//                                 </div>

//                             ) : (

//                                 /* =================================================
//                                    NON-EDITABLE OTHER STATUS
//                                 ================================================= */

//                                 <div className="alert alert-secondary rems-alert mb-3">

//                                     <div className="d-flex align-items-start gap-2">

//                                         <BsShieldCheck
//                                             className="mt-1 flex-shrink-0"
//                                         />

//                                         <div>

//                                             <div className="fw-semibold">

//                                                 Guest list unavailable
//                                                 for editing

//                                             </div>

//                                             <div className="small mt-1">

//                                                 Guest information cannot
//                                                 be modified while this
//                                                 booking is in its current
//                                                 workflow status.

//                                             </div>

//                                         </div>

//                                     </div>

//                                 </div>

//                             )}


//                             {/* =================================================
//                                 CURRENT GUESTS
//                             ================================================= */}

//                             {guests.length === 0 ? (

//                                 <div className="rems-empty-state py-4">

//                                     <div className="rems-empty-icon">
//                                         <BsPeople />
//                                     </div>

//                                     <div className="rems-empty-title">
//                                         No guests listed
//                                     </div>

//                                     <div className="rems-empty-text">
//                                         Upload an XLSX guest list to
//                                         provide the guests who will
//                                         require gate clearance.
//                                     </div>

//                                 </div>

//                             ) : (

//                                 <div>

//                                     <div className="d-flex justify-content-between align-items-center mb-2">

//                                         <div className="fw-semibold">
//                                             Current Guest List
//                                         </div>

//                                         <div className="small text-muted">
//                                             {
//                                                 guests.length
//                                             }{" "}
//                                             {guests.length === 1
//                                                 ? "guest"
//                                                 : "guests"}
//                                         </div>

//                                     </div>


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
//                                                         Plate Number
//                                                     </th>

//                                                     <th>
//                                                         Vehicle Model
//                                                     </th>

//                                                 </tr>

//                                             </thead>


//                                             <tbody>

//                                                 {guests.map(
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

//                                                             <td
//                                                                 data-label="#"
//                                                             >
//                                                                 {
//                                                                     guest.row_number ||
//                                                                     index +
//                                                                     1
//                                                                 }
//                                                             </td>


//                                                             <td
//                                                                 data-label="Guest Name"
//                                                             >

//                                                                 <div className="rems-table-primary">

//                                                                     {
//                                                                         guest.full_name ||
//                                                                         "—"
//                                                                     }

//                                                                 </div>

//                                                             </td>


//                                                             <td
//                                                                 data-label="Plate Number"
//                                                             >

//                                                                 {
//                                                                     guest.vehicle_plate_number ||
//                                                                     "—"
//                                                                 }

//                                                             </td>


//                                                             <td
//                                                                 data-label="Vehicle Model"
//                                                             >

//                                                                 {
//                                                                     guest.vehicle_model ||
//                                                                     "—"
//                                                                 }

//                                                             </td>

//                                                         </tr>

//                                                     )
//                                                 )}

//                                             </tbody>

//                                         </table>

//                                     </div>

//                                 </div>

//                             )}

//                         </div>

//                     </div>


//                     {/* =================================================
//                         PAYMENT
//                     ================================================= */}

//                     {Number(
//                         booking.total_amount_due ||
//                         0
//                     ) > 0 && (

//                         <div className="rems-glass-card mb-3">

//                             <div className="rems-card-header">

//                                 <div>

//                                     <div className="rems-card-title">
//                                         Booking Payment
//                                     </div>

//                                     <div className="rems-card-subtitle">
//                                         Submit the full booking
//                                         payment for HOA verification.
//                                     </div>

//                                 </div>

//                                 <BsCreditCard />

//                             </div>


//                             <div className="p-3">


//                                 {/* =================================================
//                                     PAYMENT STATUS
//                                 ================================================= */}

//                                 {paymentVerified && (

//                                     <div className="alert alert-success rems-alert mb-3">

//                                         <div className="d-flex align-items-start gap-2">

//                                             <BsCheck2Circle
//                                                 className="mt-1"
//                                             />

//                                             <div>

//                                                 <div className="fw-semibold">
//                                                     Payment verified
//                                                 </div>

//                                                 <div className="small mt-1">
//                                                     Your full booking
//                                                     payment has been
//                                                     verified by HOA
//                                                     administration.
//                                                 </div>

//                                             </div>

//                                         </div>

//                                     </div>

//                                 )}


//                                 {paymentPending && (

//                                     <div className="alert alert-warning rems-alert mb-3">

//                                         <div className="d-flex align-items-start gap-2">

//                                             <BsClockHistory
//                                                 className="mt-1"
//                                             />

//                                             <div>

//                                                 <div className="fw-semibold">
//                                                     Payment awaiting verification
//                                                 </div>

//                                                 <div className="small mt-1">
//                                                     Your payment proof
//                                                     has been submitted
//                                                     and is waiting for
//                                                     HOA verification.
//                                                 </div>

//                                             </div>

//                                         </div>

//                                     </div>

//                                 )}


//                                 {paymentRejected && (

//                                     <div className="alert alert-danger rems-alert mb-3">

//                                         <div className="d-flex align-items-start gap-2">

//                                             <BsXCircle
//                                                 className="mt-1"
//                                             />

//                                             <div>

//                                                 <div className="fw-semibold">
//                                                     Payment rejected
//                                                 </div>

//                                                 <div className="small mt-1">
//                                                     Please submit the
//                                                     correct payment
//                                                     proof and reference
//                                                     number.
//                                                 </div>

//                                             </div>

//                                         </div>

//                                     </div>

//                                 )}


//                                 {!paymentVerified &&
//                                 !paymentPending && (

//                                     <>

//                                         <div className="row g-2">

//                                             <div className="col-12 col-md-4">

//                                                 <label className="form-label small text-muted">
//                                                     Amount Due
//                                                 </label>

//                                                 <div className="form-control rems-form-control">
//                                                     ₱
//                                                     {
//                                                         money(
//                                                             booking.total_amount_due
//                                                         )
//                                                     }
//                                                 </div>

//                                             </div>


//                                             <div className="col-12 col-md-4">

//                                                 <label className="form-label small text-muted">
//                                                     Payment Method
//                                                 </label>

//                                                 <select
//                                                     className="form-select rems-form-control"
//                                                     value={
//                                                         payment.payment_method
//                                                     }
//                                                     onChange={
//                                                         (event) =>
//                                                             setPayment(
//                                                                 (
//                                                                     previous
//                                                                 ) => ({
//                                                                     ...previous,
//                                                                     payment_method:
//                                                                         event.target.value,
//                                                                 })
//                                                             )
//                                                     }
//                                                     disabled={
//                                                         processing
//                                                     }
//                                                 >

//                                                     <option value="GCASH">
//                                                         GCash
//                                                     </option>

//                                                     <option value="MAYA">
//                                                         Maya
//                                                     </option>

//                                                     <option value="INSTAPAY_QR">
//                                                         InstaPay QR
//                                                     </option>

//                                                     <option value="CASH">
//                                                         Cash
//                                                     </option>

//                                                     <option value="CHECK">
//                                                         Check
//                                                     </option>

//                                                 </select>

//                                             </div>


//                                             <div className="col-12 col-md-4">

//                                                 <label className="form-label small text-muted">
//                                                     Reference Number
//                                                 </label>

//                                                 <input
//                                                     type="text"
//                                                     className="form-control rems-form-control"
//                                                     value={
//                                                         payment.reference_number
//                                                     }
//                                                     onChange={
//                                                         (event) =>
//                                                             setPayment(
//                                                                 (
//                                                                     previous
//                                                                 ) => ({
//                                                                     ...previous,
//                                                                     reference_number:
//                                                                         event.target.value,
//                                                                 })
//                                                             )
//                                                     }
//                                                     disabled={
//                                                         processing
//                                                     }
//                                                 />

//                                             </div>


//                                             <div className="col-12">

//                                                 <label className="form-label small text-muted">
//                                                     Payment Proof
//                                                 </label>

//                                                 <input
//                                                     type="file"
//                                                     className="form-control rems-form-control"
//                                                     onChange={
//                                                         (event) =>
//                                                             setPayment(
//                                                                 (
//                                                                     previous
//                                                                 ) => ({
//                                                                     ...previous,
//                                                                     proof:
//                                                                         event.target.files?.[0] ||
//                                                                         null,
//                                                                 })
//                                                             )
//                                                     }
//                                                     disabled={
//                                                         processing
//                                                     }
//                                                 />

//                                             </div>


//                                             <div className="col-12">

//                                                 <button
//                                                     type="button"
//                                                     className="rems-primary-button"
//                                                     onClick={
//                                                         submitPayment
//                                                     }
//                                                     disabled={
//                                                         processing
//                                                     }
//                                                 >

//                                                     {
//                                                         processing
//                                                             ? "Submitting..."
//                                                             : "Submit Full Booking Payment"
//                                                     }

//                                                 </button>

//                                             </div>

//                                         </div>

//                                     </>

//                                 )}

//                             </div>

//                         </div>

//                     )}

//                 </div>


//                 {/* =================================================
//                     RIGHT COLUMN
//                 ================================================= */}

//                 <div className="col-12 col-xl-4">


//                     {/* =================================================
//                         FINANCIAL SUMMARY
//                     ================================================= */}

//                     <div className="rems-glass-card mb-3">

//                         <div className="rems-card-header">

//                             <div className="rems-card-title">
//                                 Financial Summary
//                             </div>

//                         </div>


//                         <div className="p-3">

//                             <div className="d-flex justify-content-between py-2">

//                                 <span>
//                                     Rental Fee
//                                 </span>

//                                 <strong>
//                                     ₱
//                                     {
//                                         money(
//                                             booking.rental_fee
//                                         )
//                                     }
//                                 </strong>

//                             </div>


//                             <div className="d-flex justify-content-between py-2">

//                                 <span>
//                                     Resident Discount
//                                 </span>

//                                 <strong>
//                                     - ₱
//                                     {
//                                         money(
//                                             booking.discount_amount
//                                         )
//                                     }
//                                 </strong>

//                             </div>


//                             <div className="d-flex justify-content-between py-2">

//                                 <span>
//                                     Security Deposit
//                                 </span>

//                                 <strong>
//                                     ₱
//                                     {
//                                         money(
//                                             booking.security_deposit
//                                         )
//                                     }
//                                 </strong>

//                             </div>


//                             <hr />


//                             <div className="d-flex justify-content-between py-2">

//                                 <strong>
//                                     Total Due
//                                 </strong>

//                                 <strong>
//                                     ₱
//                                     {
//                                         money(
//                                             booking.total_amount_due
//                                         )
//                                     }
//                                 </strong>

//                             </div>

//                         </div>

//                     </div>


//                     {/* =================================================
//                         SECURITY STATUS
//                     ================================================= */}

//                     <div className="rems-glass-card mb-3">

//                         <div className="p-3">

//                             <div className="rems-card-title mb-2">
//                                 Security Clearance
//                             </div>


//                             {guestListLocked ? (

//                                 <div className="alert alert-success rems-alert mb-0">

//                                     <div className="d-flex align-items-start gap-2">

//                                         <BsShieldCheck
//                                             className="mt-1"
//                                         />

//                                         <div>

//                                             <div className="fw-semibold">
//                                                 Clearance completed
//                                             </div>

//                                             <div className="small mt-1">
//                                                 The guest list is now
//                                                 permanently locked.
//                                             </div>

//                                         </div>

//                                     </div>

//                                 </div>

//                             ) : (

//                                 <div className="alert alert-secondary rems-alert mb-0">

//                                     <div className="d-flex align-items-start gap-2">

//                                         <BsShieldCheck
//                                             className="mt-1"
//                                         />

//                                         <div>

//                                             <div className="fw-semibold">
//                                                 Clearance pending
//                                             </div>

//                                             <div className="small mt-1">
//                                                 The guest list may still
//                                                 be updated until security
//                                                 clearance is completed.
//                                             </div>

//                                         </div>

//                                     </div>

//                                 </div>

//                             )}

//                         </div>

//                     </div>


//                     {/* =================================================
//                         BOOKING ACTIONS
//                     ================================================= */}

//                     <div className="rems-glass-card">

//                         <div className="p-3">

//                             <div className="rems-card-title mb-2">
//                                 Booking Actions
//                             </div>


//                             {canCancel && (

//                                 <button
//                                     type="button"
//                                     className="rems-primary-button w-100 mb-2"
//                                     onClick={
//                                         cancelBooking
//                                     }
//                                     disabled={
//                                         processing
//                                     }
//                                 >

//                                     {
//                                         processing
//                                             ? "Cancelling..."
//                                             : "Cancel Booking"
//                                     }

//                                 </button>

//                             )}


//                             <button
//                                 type="button"
//                                 className="rems-secondary-button w-100"
//                                 onClick={
//                                     goBack
//                                 }
//                             >
//                                 <BsArrowLeft />
//                                 Back to Bookings
//                             </button>

//                         </div>

//                     </div>

//                 </div>

//             </div>


//             {/* =================================================
//                 FOOTER NOTE
//             ================================================= */}

//             <div
//                 className="mt-3"
//                 style={{
//                     color:
//                         "#929baa",
//                     fontSize:
//                         "0.68rem",
//                 }}
//             >

//                 <BsShieldCheck className="me-1" />

//                 Guest and vehicle information remains
//                 editable until security clearance is completed.

//                 {" "}

//                 Once security clearance is completed,
//                 the guest list becomes permanently locked.

//                 {" "}

//                 Uploading a new XLSX guest list replaces
//                 the complete existing guest list.

//             </div>

//         </div>
//     );
// }