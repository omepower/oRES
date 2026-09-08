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
    BsClockHistory,
    BsExclamationTriangle,
    BsHouse,
    BsInfoCircle,
    BsPeople,
    BsPlusLg,
    BsShieldCheck,
    BsXCircle,
    BsWater,
    BsChevronRight,
    BsPencilSquare,  
    BsHouseDoor, 
} from "react-icons/bs";

import {
    getActiveFacilities,
    getMyFacilityBookings,
    checkFacilityAvailability,
    createFacilityBooking,
} from "../../api/facilities";


/* =========================================================
   GENERAL HELPERS
========================================================= */

const normalize = (response) => {
    if (Array.isArray(response)) {
        return response;
    }

    return (
        response?.results ||
        response?.facilities ||
        response?.bookings ||
        []
    );
};


const normalizeStatus = (status) => {
    return String(status || "")
        .trim()
        .toUpperCase();
};


const todayISO = () => {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};


const formatMoney = (amount) => {
    const numericAmount = Number(
        amount || 0
    );

    return `₱${numericAmount.toLocaleString(
        undefined,
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
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

    const startParts = String(
        startTime
    )
        .split(":")
        .map(Number);

    const endParts = String(
        endTime
    )
        .split(":")
        .map(Number);

    if (
        startParts.length < 2 ||
        endParts.length < 2 ||
        Number.isNaN(startParts[0]) ||
        Number.isNaN(startParts[1]) ||
        Number.isNaN(endParts[0]) ||
        Number.isNaN(endParts[1])
    ) {
        return "—";
    }

    const startMinutes =
        startParts[0] * 60 +
        startParts[1];

    const endMinutes =
        endParts[0] * 60 +
        endParts[1];

    const minutes =
        endMinutes -
        startMinutes;

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
        hours > 0 &&
        remainder > 0
    ) {
        return `${hours}h ${remainder}m`;
    }

    if (
        hours > 0
    ) {
        return `${hours}h`;
    }

    return `${remainder}m`;
};


/* =========================================================
   COMPLETE DRF ERROR NORMALIZER
========================================================= */

const prettifyFieldName = (
    field
) => {
    const value = String(
        field || ""
    )
        .replaceAll(
            "_",
            " "
        )
        .replaceAll(
            "-",
            " "
        )
        .trim();

    if (
        !value
    ) {
        return "Booking";
    }

    return value.replace(
        /\b\w/g,
        (letter) =>
            letter.toUpperCase()
    );
};


const collectErrors = (
    value,
    fieldName = ""
) => {
    const errors = [];

    if (
        value === null ||
        value === undefined
    ) {
        return errors;
    }

    if (
        typeof value === "string"
    ) {
        const message =
            value.trim();

        if (
            message
        ) {
            errors.push({
                field:
                    fieldName,
                message,
            });
        }

        return errors;
    }

    if (
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        errors.push({
            field:
                fieldName,
            message:
                String(value),
        });

        return errors;
    }

    if (
        Array.isArray(value)
    ) {
        value.forEach(
            (
                item
            ) => {
                errors.push(
                    ...collectErrors(
                        item,
                        fieldName
                    )
                );
            }
        );

        return errors;
    }

    if (
        typeof value === "object"
    ) {
        Object.entries(
            value
        ).forEach(
            ([
                key,
                childValue,
            ]) => {
                const childField =
                    key ===
                    "non_field_errors"
                        ? ""
                        : fieldName
                            ? `${fieldName}.${key}`
                            : key;

                errors.push(
                    ...collectErrors(
                        childValue,
                        childField
                    )
                );
            }
        );
    }

    return errors;
};


const uniqueErrors = (
    errors
) => {
    const seen =
        new Set();

    return errors.filter(
        (
            error
        ) => {
            const key =
                `${error.field}|${error.message}`;

            if (
                seen.has(key)
            ) {
                return false;
            }

            seen.add(key);

            return true;
        }
    );
};


const normalizeApiErrors = (
    error
) => {
    const responseData =
        error?.response?.data;

    let errors = [];

    if (
        typeof responseData ===
        "string"
    ) {
        errors = collectErrors(
            responseData
        );
    } else if (
        responseData
    ) {
        errors = collectErrors(
            responseData
        );
    }

    if (
        errors.length === 0 &&
        error?.message
    ) {
        errors = [
            {
                field: "",
                message:
                    String(
                        error.message
                    ),
            },
        ];
    }

    return uniqueErrors(
        errors
    );
};


const getPrimaryErrorMessage = (
    error,
    fallback
) => {
    const errors =
        normalizeApiErrors(
            error
        );

    if (
        errors.length > 0
    ) {
        return errors[0].message;
    }

    return fallback;
};


const getStatusMessage = (
    error,
    fallback
) => {
    const status =
        error?.response?.status;

    switch (
        status
    ) {
        case 400:
            return "The booking request was rejected because one or more reservation details are invalid.";
        case 401:
            return "Your session has expired. Please sign in again before creating a facility reservation.";
        case 403:
            return "You are not authorized to create a facility reservation.";
        case 404:
            return "The selected facility or booking service could not be found.";
        case 409:
            return "The booking could not be created because the facility reservation conflicts with another booking or current booking state.";
        case 422:
            return "The booking information failed server-side validation.";
        case 429:
            return "Too many booking requests were made. Please wait a moment and try again.";
        case 500:
            return "The facility booking server encountered an internal error.";
        case 502:
            return "The facility booking service is temporarily unavailable.";
        case 503:
            return "The facility booking service is currently unavailable.";
        case 504:
            return "The facility booking service took too long to respond.";
        default:
            if (
                !error?.response
            ) {
                return "Unable to reach the facility booking service. Please check your internet connection and try again.";
            }
            return fallback;
    }
};


/* =========================================================
   FACILITY HELPERS
========================================================= */

const iconFor = (
    type
) => {
    switch (
        String(type || "")
            .trim()
            .toUpperCase()
    ) {
        case "SWIMMING_POOL":
            return <BsWater />;

        case "CLUBHOUSE":
            return <BsHouse />;

        case "BASKETBALL_COURT":
            return <BsPeople />;

        case "CHILDREN_PARK":
            return <BsPeople />;

        case "CAR_PARKING":
            return <BsHouse />;

        default:
            return <BsCalendar3 />;
    }
};


const getFacilityTypeLabel = (
    facility
) => {
    return (
        facility?.facility_type_display ||
        String(
            facility?.facility_type ||
            "COMMUNITY FACILITY"
        )
            .replaceAll(
                "_",
                " "
            )
            .replace(
                /\b\w/g,
                (letter) =>
                    letter.toUpperCase()
            )
    );
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


const getBookingStatusClass = (
    status
) => {
    switch (
        normalizeStatus(status)
    ) {
        case "PENCIL":
        case "PENDING":
            return "rems-status-warning";

        case "APPROVED":
        case "IN_USE":
            return "rems-status-success";

        case "INSPECTION_PENDING":
        case "REFUND_PENDING":
            return "rems-status-warning";

        case "CLOSED":
        case "COMPLETED":
            return "rems-status-secondary";

        case "REJECTED":
        case "CANCELLED":
        case "EXPIRED":
            return "rems-status-danger";

        default:
            return "rems-status-secondary";
    }
};


/* =========================================================
   FORM
========================================================= */

const createInitialForm = (
    facilityId = ""
) => ({
    facility:
        facilityId,
    booking_date:
        todayISO(),
    start_time:
        "",
    end_time:
        "",
    event_type:
        "PERSONAL",
    event_description:
        "",
    estimated_guests:
        1,
    has_external_supplier:
        false,
    supplier_details:
        "",
});


/* =========================================================
   COMPONENT
========================================================= */

export default function ResidentFacilities() {
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

    const [facilities, setFacilities] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState(null);


    /* =====================================================
       FORM
    ===================================================== */

    const [form, setForm] = useState(createInitialForm());


    /* =====================================================
       ERRORS
    ===================================================== */

    const [error, setError] = useState("");
    const [bookingError, setBookingError] = useState("");
    const [bookingErrorDetails, setBookingErrorDetails] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});


    /* =====================================================
       PAGE STATE
    ===================================================== */

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showSupplier, setShowSupplier] = useState(false);
    const [showAllErrors, setShowAllErrors] = useState(true);


    /* =====================================================
       REFS
    ===================================================== */

    const bookingErrorRef = useRef(null);
    const mountedRef = useRef(true);


    /* =====================================================
       CLEANUP
    ===================================================== */

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);


    /* =====================================================
       LOAD DATA
    ===================================================== */

    const load = useCallback(
        async (refresh = false) => {
            mountedRef.current = true;

            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            try {
                const [facilitiesResponse, bookingsResponse] = await Promise.all([
                    getActiveFacilities(),
                    getMyFacilityBookings(),
                ]);

                if (!mountedRef.current) return;

                setFacilities(normalize(facilitiesResponse));
                setBookings(normalize(bookingsResponse));
            } catch (err) {
                console.error("[Resident Facilities] Load failed:", err);
                if (!mountedRef.current) return;

                const errors = normalizeApiErrors(err);
                setError(
                    errors.length > 0
                        ? errors.map((item) => item.message).join(" ")
                        : getStatusMessage(err, "Unable to load the facility reservation page.")
                );
            } finally {
                if (mountedRef.current) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        []
    );

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            load(true);
        }, 30000);

        return () => {
            window.clearInterval(interval);
        };
    }, [load]);


    /* =====================================================
       OPEN/CLOSE BOOKING
    ===================================================== */

    const openBooking = (facility) => {
        setSelectedFacility(facility);
        setForm(createInitialForm(String(facility?.id || "")));
        setBookingError("");
        setBookingErrorDetails([]);
        setValidationErrors({});
        setError("");
        setShowSupplier(false);
        setShowAllErrors(true);
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setSelectedFacility(null);
        setBookingError("");
        setBookingErrorDetails([]);
        setValidationErrors({});
        setShowSupplier(false);
        setForm(createInitialForm());
    };


    /* =====================================================
       FORM CHANGE
    ===================================================== */

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value,
        }));

        setBookingError("");
        setBookingErrorDetails([]);
        setError("");
        setValidationErrors((previous) => {
            const next = { ...previous };
            delete next[name];
            return next;
        });

        if (name === "has_external_supplier" && !checked) {
            setShowSupplier(false);
            setForm((previous) => ({
                ...previous,
                supplier_details: "",
            }));
        }
    };


    /* =====================================================
       CLIENT VALIDATION
    ===================================================== */

    const validateForm = () => {
        const errors = {};
        const guestCount = Number(form.estimated_guests);

        if (!form.facility) {
            errors.facility = "Please select a facility.";
        }

        if (!form.booking_date) {
            errors.booking_date = "A valid reservation date is required.";
        } else if (form.booking_date < todayISO()) {
            errors.booking_date = "The reservation date cannot be in the past.";
        }

        if (!form.start_time) {
            errors.start_time = "A valid start time is required.";
        }

        if (!form.end_time) {
            errors.end_time = "A valid end time is required.";
        }

        if (form.start_time && form.end_time) {
            const start = form.start_time.split(":").map(Number);
            const end = form.end_time.split(":").map(Number);

            const startMinutes = start[0] * 60 + start[1];
            const endMinutes = end[0] * 60 + end[1];

            if (endMinutes <= startMinutes) {
                errors.end_time = "The end time must be later than the start time.";
            }
        }

        if (!Number.isInteger(guestCount) || guestCount <= 0) {
            errors.estimated_guests = "The estimated number of guests must be greater than zero.";
        } else if (selectedFacility?.capacity && guestCount > Number(selectedFacility.capacity)) {
            errors.estimated_guests = `The guest count exceeds the maximum capacity of ${selectedFacility.capacity}.`;
        }

        setValidationErrors(errors);

        return Object.keys(errors).length === 0;
    };


    /* =====================================================
       CREATE PENCIL BOOKING (INTEGRATED AVAILABILITY CHECK)
    ===================================================== */

    const createBooking = async (event) => {
        event.preventDefault();

        setBookingError("");
        setBookingErrorDetails([]);
        setValidationErrors({});
        setError("");

        const valid = validateForm();

        if (!valid) {
            setBookingError(
                "We cannot process your reservation request. Please ensure your reservation date, start and end times are set correctly, and the estimated guest count is greater than zero."
            );

            window.setTimeout(() => {
                bookingErrorRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }, 80);

            return;
        }

        const facilityId = Number(form.facility);

        if (!facilityId || facilityId !== Number(selectedFacility?.id)) {
            setBookingError(
                "The selected facility could not be verified. Please close this reservation window, refresh the page, and try again."
            );
            return;
        }

        setSaving(true);

        try {
            const availabilityResponse = await checkFacilityAvailability({
                facility: facilityId,
                booking_date: form.booking_date,
                start_time: form.start_time,
                end_time: form.end_time,
                estimated_guests: Number(form.estimated_guests),
            });

            const availability =
                availabilityResponse?.data || availabilityResponse;

            if (!availability?.available) {
                setBookingError(
                    availability?.reason ||
                    "The selected facility and time are not available."
                );

                const details = normalizeApiErrors({
                    response: { data: availability },
                });
                
                setBookingErrorDetails(details);
                setShowAllErrors(true);

                window.setTimeout(() => {
                    bookingErrorRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }, 80);

                setSaving(false);
                return;
            }

            const response = await createFacilityBooking({
                facility: facilityId,
                booking_date: form.booking_date,
                start_time: form.start_time,
                end_time: form.end_time,
                event_type: form.event_type,
                event_description: form.event_description.trim(),
                estimated_guests: Number(form.estimated_guests),
                has_external_supplier: Boolean(form.has_external_supplier),
                supplier_details: form.has_external_supplier
                    ? form.supplier_details.trim()
                    : "",
            });

            const booking =
                response?.data?.id
                    ? response.data
                    : response?.id
                        ? response
                        : response?.data?.booking?.id
                            ? response.data.booking
                            : response?.booking?.id
                                ? response.booking
                                : null;

            if (!booking?.id) {
                console.error("[Resident Facilities] Booking response contained no booking ID:", response);
                setBookingError(
                    "The booking service returned an incomplete response. The Pencil booking could not be confirmed. Please refresh your bookings before trying again."
                );
                return;
            }

            setShowModal(false);
            setSelectedFacility(null);
            setBookingError("");
            setBookingErrorDetails([]);
            setValidationErrors({});
            setShowSupplier(false);
            setForm(createInitialForm());

            await load(true);
            navigate(`${portalPrefix}/facilities/bookings/${booking.id}`);
        } catch (err) {
            console.error("[Resident Facilities] Pencil Book creation failed:", err);
            if (!mountedRef.current) return;

            const details = normalizeApiErrors(err);
            setBookingErrorDetails(details);

            const serverFieldErrors = {};
            details.forEach((item) => {
                if (item.field) {
                    const rootField = item.field.split(".")[0];
                    if (!serverFieldErrors[rootField]) {
                        serverFieldErrors[rootField] = item.message;
                    }
                }
            });

            setValidationErrors(serverFieldErrors);
            setBookingError(
                getStatusMessage(err, getPrimaryErrorMessage(err, "Unable to create the Pencil facility booking."))
            );
            setShowAllErrors(true);

            window.setTimeout(() => {
                bookingErrorRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }, 100);
        } finally {
            if (mountedRef.current) {
                setSaving(false);
            }
        }
    };


    const stats = useMemo(() => {
        const counts = {
            pencil: 0,
            pending: 0,
            approved: 0,
            inUse: 0,
            inspection: 0,
        };

        bookings.forEach((booking) => {
            const status = normalizeStatus(booking?.status);
            if (status === "PENCIL") counts.pencil++;
            else if (status === "PENDING") counts.pending++;
            else if (status === "APPROVED") counts.approved++;
            else if (status === "IN_USE") counts.inUse++;
            else if (status === "INSPECTION_PENDING" || status === "REFUND_PENDING" || status?.includes("INSPECTION")) {
                counts.inspection++;
            }
        });

        return counts;
    }, [bookings]);



    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="rems-page-content">

            {/* PAGE HEADER */}
            <div className="rems-page-header" style={{ marginBottom: "1.5rem" }}>
                <div>
                    <div className="rems-page-eyebrow">RESIDENT PORTAL</div>
                    <h1 className="rems-page-title">Facilities & Amenities</h1>
                    <p className="rems-page-description">
                        Reserve community facilities, check availability, and manage your reservation requirements.
                    </p>
                </div>

                <button
                    type="button"
                    className="rems-secondary-button"
                    onClick={() => load(true)}
                    disabled={refreshing}
                >
                    {refreshing ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    ) : (
                        <BsArrowClockwise />
                    )}
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {/* PAGE ERROR */}
            {error && (
                <div className="alert alert-danger rems-alert mb-4" role="alert">
                    <div className="d-flex align-items-start gap-3">
                        <BsExclamationTriangle className="mt-1 flex-shrink-0" />
                        <div>
                            <div className="fw-semibold mb-1">Facility service error</div>
                            <div>{error}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================
                STATISTICS GRID (REPLACES ALERT BANNER)
            ================================================= */}
            <div className="row g-3 mb-4">

                <div className="col-6 col-md-4 col-xl">
                    <div className="rems-stat-card h-100">
                        <div className="rems-stat-icon">
                            <BsPencilSquare />
                        </div>
                        <div className="rems-stat-content">
                            <div className="rems-stat-label">Pencil Booking</div>
                            <div className="rems-stat-value">{stats.pencil}</div>
                        </div>
                    </div>
                </div>

                <div className="col-6 col-md-4 col-xl">
                    <div className="rems-stat-card h-100">
                        <div className="rems-stat-icon">
                            <BsClockHistory />
                        </div>
                        <div className="rems-stat-content">
                            <div className="rems-stat-label">Pending Approval</div>
                            <div className="rems-stat-value">{stats.pending}</div>
                        </div>
                    </div>
                </div>

                <div className="col-6 col-md-4 col-xl">
                    <div className="rems-stat-card h-100">
                        <div className="rems-stat-icon">
                            <BsCheck2Circle />
                        </div>
                        <div className="rems-stat-content">
                            <div className="rems-stat-label">Approved</div>
                            <div className="rems-stat-value">{stats.approved}</div>
                        </div>
                    </div>
                </div>

                <div className="col-6 col-md-4 col-xl">
                    <div className="rems-stat-card h-100">
                        <div className="rems-stat-icon">
                            <BsHouseDoor />
                        </div>
                        <div className="rems-stat-content">
                            <div className="rems-stat-label">In Use</div>
                            <div className="rems-stat-value">{stats.inUse}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FACILITIES */}
            <div className="rems-glass-card mb-4" style={{ overflow: "hidden" }}>
                <div className="rems-card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div>
                        <div className="rems-page-eyebrow">COMMUNITY AMENITIES</div>
                        <div className="rems-card-title">Available Facilities</div>
                        <div className="rems-card-subtitle">Select a facility to request a reservation time.</div>
                    </div>
                </div>

                <div className="p-3 p-md-4">
                    {loading ? (
                        <div className="rems-loading-state">
                            <div className="spinner-border" role="status" aria-hidden="true" />
                            <div className="mt-3">Loading community facilities...</div>
                        </div>
                    ) : facilities.length === 0 ? (
                        <div className="rems-empty-state">
                            <div className="rems-empty-icon"><BsHouse /></div>
                            <div className="rems-empty-title">No bookable facilities</div>
                            <div className="rems-empty-text">There are currently no active facilities available for resident reservations.</div>
                        </div>
                    ) : (
                        <div className="row g-3">
                            {facilities.map((facility) => {
                                const capacity = Number(facility?.capacity || 0);
                                const rentalFee = Number(facility?.rental_fee || 0);
                                const deposit = Number(facility?.security_deposit_amount || 0);

                                return (
                                    <div className="col-12 col-md-6 col-xl-4" key={facility.id}>
                                        <div className="rems-glass-card h-100" style={{ overflow: "hidden", transition: "transform 180ms ease, box-shadow 180ms ease" }}>
                                            <div className="p-3 p-md-4">
                                                <div className="d-flex align-items-start gap-3">
                                                    <div className="rems-stat-icon flex-shrink-0" style={{ width: "48px", height: "48px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                                                        {iconFor(facility?.facility_type)}
                                                    </div>
                                                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                        <div className="rems-page-eyebrow" style={{ marginBottom: "0.25rem" }}>
                                                            {getFacilityTypeLabel(facility)}
                                                        </div>
                                                        <div className="rems-card-title">{facility?.name}</div>
                                                    </div>
                                                </div>

                                                <div className="small mt-3" style={{ minHeight: "44px", opacity: 0.78 }}>
                                                    {facility?.description || "Community facility available for resident reservation."}
                                                </div>

                                                <div className="row g-2 mt-2">
                                                    <div className="col-6">
                                                        <div className="p-2 rounded-3" style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                                            <div className="rems-table-secondary">Capacity</div>
                                                            <div className="rems-table-primary">{capacity > 0 ? `${capacity} guest${capacity === 1 ? "" : "s"}` : "—"}</div>
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div className="p-2 rounded-3" style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                                            <div className="rems-table-secondary">Fixed Rental</div>
                                                            <div className="rems-table-primary" style={{ fontWeight: 700 }}>{formatMoney(rentalFee)}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {facility?.requires_security_deposit && deposit > 0 && (
                                                    <div className="small mt-2 d-flex align-items-center gap-2" style={{ opacity: 0.72 }}>
                                                        <BsShieldCheck /> Security deposit: {formatMoney(deposit)}
                                                    </div>
                                                )}

                                                <button type="button" className="rems-primary-button w-100 mt-3" onClick={() => openBooking(facility)}>
                                                    <BsPlusLg /> Request Reservation
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* RECENT BOOKINGS */}
            <div className="rems-glass-card">
                <div className="rems-card-header">
                    <div>
                        <div className="rems-page-eyebrow">RESERVATION ACTIVITY</div>
                        <div className="rems-card-title">My Recent Bookings</div>
                        <div className="rems-card-subtitle">Monitor your facility reservations, approvals, payments, and completion.</div>
                    </div>
                    <button type="button" className="rems-secondary-button" onClick={() => navigate(`${portalPrefix}/facilities/bookings`)}>
                        View all
                    </button>
                </div>

                <div className="p-3">
                    {bookings.length === 0 ? (
                        <div className="rems-empty-state py-4">
                            <div className="rems-empty-icon"><BsClockHistory /></div>
                            <div className="rems-empty-title">No bookings yet</div>
                            <div className="rems-empty-text">Your facility reservations will appear here.</div>
                        </div>
                    ) : (
                        bookings.slice(0, 5).map((booking) => (
                            <button key={booking.id} type="button" className="w-100 border-0 text-start p-3 mb-2 rounded-3" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }} onClick={() => navigate(`${portalPrefix}/facilities/bookings/${booking.id}`)}>
                                <div className="d-flex justify-content-between align-items-start gap-3">
                                    <div style={{ minWidth: 0 }}>
                                        <div className="rems-table-primary">{getBookingFacilityName(booking)}</div>
                                        <div className="rems-table-secondary mt-1">
                                            {booking?.booking_date || "—"} {" · "} {booking?.start_time || "—"} {" — "} {booking?.end_time || "—"}
                                        </div>
                                    </div>
                                    <span className={`rems-status-badge ${getBookingStatusClass(booking?.status)}`}>
                                        <span className="rems-status-dot" />
                                        {booking?.status_display || booking?.status || "Unknown"}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* BOOKING MODAL */}
            {showModal && (
                <div className="rems-modal-backdrop" style={{ zIndex: 3000, backdropFilter: "blur(8px)" }} onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) { closeModal(); } }}>
                    <div className="rems-modal rems-management-modal" style={{ position: "relative", zIndex: 3001, width: "min(100%, 920px)", maxHeight: "92vh", overflow: "auto", borderRadius: "20px" }} onMouseDown={(event) => event.stopPropagation()}>
                        
                        <div className="rems-modal-header" style={{ position: "sticky", top: 0, zIndex: 5, backdropFilter: "blur(18px)" }}>
                            <div>
                                <div className="rems-page-eyebrow">oRES FACILITY RESERVATION</div>
                                <div className="rems-modal-title">{selectedFacility?.name || "Facility Reservation"}</div>
                                <div className="rems-modal-subtitle">Check availability and create your temporary Pencil reservation hold.</div>
                            </div>
                            <button type="button" className="rems-modal-close" onClick={closeModal} disabled={saving} aria-label="Close reservation">
                                <BsXCircle />
                            </button>
                        </div>

                        <form onSubmit={createBooking}>
                            <div className="rems-modal-body">
                                
                                {bookingError && (
                                    <div ref={bookingErrorRef} className="alert alert-danger rems-alert mb-4" role="alert" style={{ borderRadius: "16px", background: "rgba(220,53,69,0.09)", border: "1px solid rgba(220,53,69,0.25)" }}>
                                        <div className="d-flex align-items-start gap-3">
                                            <div className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(220,53,69,0.14)" }}>
                                                <BsExclamationTriangle />
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="fw-semibold fs-6">Pencil Book could not be completed</div>
                                                <div className="small mt-1">{bookingError}</div>


                                                {bookingErrorDetails.length === 0 && (
                                                    <div className="small mt-3" style={{ opacity: 0.72 }}>The server did not return additional field-level information.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="rems-form-section mb-4" style={{ borderRadius: "16px" }}>
                                    <div className="rems-form-section-title"><BsHouse className="me-2" /> Selected Facility</div>
                                    <div className="row g-3">
                                        <div className="col-12 col-md-7">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="rems-stat-icon flex-shrink-0" style={{ width: "52px", height: "52px", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    {iconFor(selectedFacility?.facility_type)}
                                                </div>
                                                <div>
                                                    <div className="rems-table-secondary">{getFacilityTypeLabel(selectedFacility)}</div>
                                                    <div className="rems-table-primary">{selectedFacility?.name || "—"}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6 col-md-2">
                                            <div className="rems-table-secondary">Capacity</div>
                                            <div className="rems-table-primary">{selectedFacility?.capacity || "—"}</div>
                                        </div>
                                        <div className="col-6 col-md-3">
                                            <div className="rems-table-secondary">Fixed Rental</div>
                                            <div className="rems-table-primary" style={{ fontWeight: 700 }}>{formatMoney(selectedFacility?.rental_fee)}</div>
                                        </div>
                                    </div>
                                    <div className="small mt-3 d-flex align-items-start gap-2" style={{ opacity: 0.72 }}>
                                        <BsInfoCircle className="mt-1 flex-shrink-0" />
                                        <span>This rental price is fixed by oRES and cannot be changed from the resident portal. Final financial values are calculated by the backend.</span>
                                    </div>
                                </div>

                                <div className="rems-form-section mb-4">
                                    <div className="rems-form-section-title"><BsCalendar3 className="me-2" /> Reservation Schedule</div>
                                    <div className="row g-3">
                                        <div className="col-12 col-md-4">
                                            <label className="rems-form-label">Reservation Date</label>
                                            <input type="date" name="booking_date" className={`form-control rems-form-control ${validationErrors.booking_date ? "is-invalid" : ""}`} value={form.booking_date} onChange={handleChange} min={todayISO()} disabled={saving} required />
                                            {validationErrors.booking_date && <div className="invalid-feedback">{validationErrors.booking_date}</div>}
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <label className="rems-form-label">Start Time</label>
                                            <input type="time" name="start_time" className={`form-control rems-form-control ${validationErrors.start_time ? "is-invalid" : ""}`} value={form.start_time} onChange={handleChange} disabled={saving} required />
                                            {validationErrors.start_time && <div className="invalid-feedback">{validationErrors.start_time}</div>}
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <label className="rems-form-label">End Time</label>
                                            <input type="time" name="end_time" className={`form-control rems-form-control ${validationErrors.end_time ? "is-invalid" : ""}`} value={form.end_time} onChange={handleChange} disabled={saving} required />
                                            {validationErrors.end_time && <div className="invalid-feedback">{validationErrors.end_time}</div>}
                                        </div>
                                        
                                        {form.start_time && form.end_time && (
                                            <div className="col-12">
                                                <div className="small d-flex align-items-center gap-2" style={{ opacity: 0.72 }}>
                                                    <BsClockHistory /> Requested duration: <strong>{formatDuration(form.start_time, form.end_time)}</strong>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rems-form-section mb-4">
                                    <div className="rems-form-section-title"><BsPeople className="me-2" /> Event Information</div>
                                    <div className="row g-3">
                                        <div className="col-12 col-md-4">
                                            <label className="rems-form-label">Event Type</label>
                                            <select name="event_type" className={`form-select rems-form-control ${validationErrors.event_type ? "is-invalid" : ""}`} value={form.event_type} onChange={handleChange} disabled={saving}>
                                                <option value="PERSONAL">Personal</option>
                                                <option value="FAMILY">Family</option>
                                                <option value="BIRTHDAY">Birthday</option>
                                                <option value="MEETING">Meeting</option>
                                                <option value="COMMUNITY_EVENT">Community Event</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                            {validationErrors.event_type && <div className="invalid-feedback">{validationErrors.event_type}</div>}
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <label className="rems-form-label">Estimated Guests</label>
                                            <input type="number" min="1" max={selectedFacility?.capacity || undefined} name="estimated_guests" className={`form-control rems-form-control ${validationErrors.estimated_guests ? "is-invalid" : ""}`} value={form.estimated_guests} onChange={handleChange} disabled={saving} required />
                                            {validationErrors.estimated_guests && <div className="invalid-feedback">{validationErrors.estimated_guests}</div>}
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <label className="rems-form-label">External Supplier</label>
                                            <div className="p-2 rounded-3" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                                <div className="form-check form-switch">
                                                    <input type="checkbox" name="has_external_supplier" id="has_external_supplier" className="form-check-input" checked={form.has_external_supplier} onChange={handleChange} disabled={saving} />
                                                    <label className="form-check-label" htmlFor="has_external_supplier">External supplier required</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <label className="rems-form-label">Event Description</label>
                                            <textarea name="event_description" rows="3" className={`form-control rems-form-control ${validationErrors.event_description ? "is-invalid" : ""}`} value={form.event_description} onChange={handleChange} disabled={saving} placeholder="Briefly describe the purpose of your reservation..." />
                                            {validationErrors.event_description && <div className="invalid-feedback">{validationErrors.event_description}</div>}
                                        </div>
                                        
                                        {form.has_external_supplier && (
                                            <div className="col-12">
                                                <div className="p-3 rounded-3" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <div className="rems-form-label mb-1">Supplier Details</div>
                                                            <div className="small" style={{ opacity: 0.65 }}>Enter supplier information when required.</div>
                                                        </div>
                                                        <button type="button" className="rems-secondary-button" onClick={() => setShowSupplier((previous) => !previous)} disabled={saving}>
                                                            {showSupplier ? "Hide form" : "Show form"}
                                                        </button>
                                                    </div>
                                                    {showSupplier && (
                                                        <div className="mt-3">
                                                            <textarea name="supplier_details" rows="3" className={`form-control rems-form-control ${validationErrors.supplier_details ? "is-invalid" : ""}`} value={form.supplier_details} onChange={handleChange} disabled={saving} placeholder="Supplier/company name, service, contact details, setup requirements..." />
                                                            {validationErrors.supplier_details && <div className="invalid-feedback">{validationErrors.supplier_details}</div>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-3 rounded-4" style={{ background: "rgba(255,193,7,0.055)", border: "1px solid rgba(255,193,7,0.14)" }}>
                                    <div className="d-flex align-items-start gap-3">
                                        <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: "40px", height: "40px", background: "rgba(255,193,7,0.12)" }}>
                                            <BsClockHistory />
                                        </div>
                                        <div>
                                            <div className="fw-semibold">30-minute Pencil Hold</div>
                                            <div className="small mt-1" style={{ opacity: 0.72 }}>A successful Pencil Book temporarily holds the facility reservation for 30 minutes while you complete the remaining booking requirements.</div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="rems-modal-footer" style={{ position: "sticky", bottom: 0, zIndex: 5, backdropFilter: "blur(18px)" }}>
                                <button type="button" className="rems-secondary-button" onClick={closeModal} disabled={saving}>Cancel</button>
                                <button type="submit" className="rems-primary-button" disabled={saving}>
                                    {saving ? (
                                        <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> Creating Pencil Booking...</>
                                    ) : (
                                        <><BsClockHistory /> Pencil Book</>
                                    )}
                                </button>
                            </div>
                        </form>
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
//     useNavigate,
// } from "react-router-dom";

// import {
//     BsArrowClockwise,
//     BsCalendar3,
//     BsCheck2Circle,
//     BsClockHistory,
//     BsExclamationTriangle,
//     BsHouse,
//     BsInfoCircle,
//     BsPeople,
//     BsPlusLg,
//     BsShieldCheck,
//     BsWater,
// } from "react-icons/bs";

// import {
//     getActiveFacilities,
//     getMyFacilityBookings,
//     checkFacilityAvailability,
//     createFacilityBooking,
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
//         response?.facilities ||
//         response?.bookings ||
//         []
//     );
// };


// const getErrorMessage = (
//     error,
//     fallback = "Unable to complete the request."
// ) => {
//     const data = error?.response?.data;

//     if (typeof data === "string" && data.trim()) {
//         return data;
//     }

//     if (data?.detail) {
//         return String(data.detail);
//     }

//     if (data && typeof data === "object") {
//         const preferredFields = [
//             "facility",
//             "booking_date",
//             "start_time",
//             "end_time",
//             "estimated_guests",
//             "event_type",
//             "event_description",
//             "supplier_details",
//             "non_field_errors",
//         ];

//         for (const field of preferredFields) {
//             const value = data[field];

//             if (Array.isArray(value) && value.length > 0) {
//                 return String(value[0]);
//             }

//             if (
//                 typeof value === "string" &&
//                 value.trim()
//             ) {
//                 return value;
//             }
//         }

//         const firstError = Object.values(data)
//             .flat()
//             .find(
//                 (value) =>
//                     value !== null &&
//                     value !== undefined &&
//                     String(value).trim()
//             );

//         if (firstError) {
//             return String(firstError);
//         }
//     }

//     if (error?.message) {
//         return String(error.message);
//     }

//     return fallback;
// };


// const getTodayString = () => {
//     const date = new Date();

//     const year = date.getFullYear();

//     const month = String(
//         date.getMonth() + 1
//     ).padStart(2, "0");

//     const day = String(
//         date.getDate()
//     ).padStart(2, "0");

//     return `${year}-${month}-${day}`;
// };


// const getCurrentTimeString = () => {
//     const date = new Date();

//     const hours = String(
//         date.getHours()
//     ).padStart(2, "0");

//     const minutes = String(
//         date.getMinutes()
//     ).padStart(2, "0");

//     return `${hours}:${minutes}`;
// };


// const getMaximumBookingDate = (
//     advanceBookingDays
// ) => {
//     if (
//         advanceBookingDays === undefined ||
//         advanceBookingDays === null ||
//         advanceBookingDays === ""
//     ) {
//         return undefined;
//     }

//     const date = new Date();

//     date.setHours(
//         0,
//         0,
//         0,
//         0
//     );

//     date.setDate(
//         date.getDate() +
//         Number(advanceBookingDays)
//     );

//     const year = date.getFullYear();

//     const month = String(
//         date.getMonth() + 1
//     ).padStart(2, "0");

//     const day = String(
//         date.getDate()
//     ).padStart(2, "0");

//     return `${year}-${month}-${day}`;
// };


// const calculateDurationMinutes = (
//     startTime,
//     endTime
// ) => {
//     if (
//         !startTime ||
//         !endTime
//     ) {
//         return 0;
//     }

//     const [
//         startHour,
//         startMinute,
//     ] = String(startTime)
//         .split(":")
//         .map(Number);

//     const [
//         endHour,
//         endMinute,
//     ] = String(endTime)
//         .split(":")
//         .map(Number);

//     return (
//         (
//             endHour * 60 +
//             endMinute
//         ) -
//         (
//             startHour * 60 +
//             startMinute
//         )
//     );
// };


// const formatDuration = (
//     minutes
// ) => {
//     const value = Number(minutes || 0);

//     if (!value || value < 0) {
//         return "—";
//     }

//     const hours = Math.floor(
//         value / 60
//     );

//     const remainingMinutes =
//         value % 60;

//     if (
//         hours > 0 &&
//         remainingMinutes > 0
//     ) {
//         return `${hours}h ${remainingMinutes}m`;
//     }

//     if (hours > 0) {
//         return `${hours}h`;
//     }

//     return `${remainingMinutes}m`;
// };


// const formatMoney = (
//     amount
// ) => {
//     return `₱${Number(
//         amount || 0
//     ).toLocaleString(
//         undefined,
//         {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2,
//         }
//     )}`;
// };


// const normalizeStatus = (
//     status
// ) => {
//     return String(
//         status || ""
//     )
//         .trim()
//         .toUpperCase();
// };


// const iconFor = (
//     type
// ) => {
//     switch (
//         String(type || "")
//             .trim()
//             .toUpperCase()
//     ) {
//         case "SWIMMING_POOL":
//             return <BsWater />;

//         case "CLUBHOUSE":
//             return <BsHouse />;

//         case "BASKETBALL_COURT":
//             return <BsPeople />;

//         case "CHILDREN_PARK":
//             return <BsPeople />;

//         case "CAR_PARKING":
//             return (
//                 <i className="bi bi-car-front" />
//             );

//         default:
//             return <BsCalendar3 />;
//     }
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
//             return "rems-status-primary";

//         case "APPROVED":
//             return "rems-status-success";

//         case "IN_USE":
//             return "rems-status-info";

//         case "INSPECTION_PENDING":
//             return "rems-status-warning";

//         case "REFUND_PENDING":
//             return "rems-status-warning";

//         case "CLOSED":
//         case "COMPLETED":
//             return "rems-status-success";

//         case "REJECTED":
//         case "CANCELLED":
//         case "EXPIRED":
//             return "rems-status-danger";

//         default:
//             return "rems-status-secondary";
//     }
// };


// const getStatusLabel = (
//     booking
// ) => {
//     return (
//         booking?.status_display ||
//         booking?.status ||
//         "Unknown"
//     );
// };


// /* =========================================================
//    INITIAL FORM
// ========================================================= */

// const createInitialForm = (
//     facilityId = ""
// ) => ({
//     facility: facilityId
//         ? String(facilityId)
//         : "",

//     booking_date:
//         getTodayString(),

//     start_time: "",

//     end_time: "",

//     event_type:
//         "PERSONAL",

//     event_description:
//         "",

//     estimated_guests:
//         1,

//     has_external_supplier:
//         false,

//     supplier_details:
//         "",
// });


// /* =========================================================
//    ACTIVE BOOKING STATUSES
// ========================================================= */

// const ACTIVE_BOOKING_STATUSES = [
//     "PENCIL",
//     "PENDING",
//     "APPROVED",
//     "IN_USE",
//     "INSPECTION_PENDING",
//     "REFUND_PENDING",
// ];


// /* =========================================================
//    COMPONENT
// ========================================================= */

// export default function ResidentFacilities() {
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
//         facilities,
//         setFacilities,
//     ] = useState([]);

//     const [
//         bookings,
//         setBookings,
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
//         error,
//         setError,
//     ] = useState("");


//     /* =====================================================
//        BOOKING MODAL STATE
//     ===================================================== */

//     const [
//         showModal,
//         setShowModal,
//     ] = useState(false);

//     const [
//         selectedFacility,
//         setSelectedFacility,
//     ] = useState(null);

//     const [
//         form,
//         setForm,
//     ] = useState(
//         createInitialForm()
//     );


//     /* =====================================================
//        AVAILABILITY STATE
//     ===================================================== */

//     const [
//         availability,
//         setAvailability,
//     ] = useState(null);

//     const [
//         checkingAvailability,
//         setCheckingAvailability,
//     ] = useState(false);


//     /* =====================================================
//        BOOKING STATE
//     ===================================================== */

//     const [
//         creatingBooking,
//         setCreatingBooking,
//     ] = useState(false);

//     const [
//         validationError,
//         setValidationError,
//     ] = useState("");


//     /* =====================================================
//        LOAD DATA
//     ===================================================== */

//     const load = useCallback(
//         async (
//             refresh = false
//         ) => {
//             if (refresh) {
//                 setRefreshing(true);
//             } else {
//                 setLoading(true);
//             }

//             setError("");

//             try {
//                 const [
//                     facilitiesResponse,
//                     bookingsResponse,
//                 ] = await Promise.all([
//                     getActiveFacilities(),
//                     getMyFacilityBookings(),
//                 ]);

//                 setFacilities(
//                     normalize(
//                         facilitiesResponse
//                     )
//                 );

//                 setBookings(
//                     normalize(
//                         bookingsResponse
//                     )
//                 );
//             } catch (err) {
//                 console.error(
//                     "[Resident Facilities] Load failed:",
//                     err
//                 );

//                 setError(
//                     getErrorMessage(
//                         err,
//                         "Unable to load facilities and bookings."
//                     )
//                 );
//             } finally {
//                 setLoading(false);
//                 setRefreshing(false);
//             }
//         },
//         []
//     );


//     /* =====================================================
//        INITIAL LOAD
//     ===================================================== */

//     useEffect(
//         () => {
//             load();
//         },
//         [load]
//     );


//     /* =====================================================
//        AUTO REFRESH
//        Keeps availability / booking status reasonably current.
//     ===================================================== */

//     useEffect(
//         () => {
//             const interval =
//                 window.setInterval(
//                     () => {
//                         load(true);
//                     },
//                     30000
//                 );

//             return () => {
//                 window.clearInterval(
//                     interval
//                 );
//             };
//         },
//         [load]
//     );


//     /* =====================================================
//        DERIVED STATISTICS
//     ===================================================== */

//     const normalizedBookings =
//         useMemo(
//             () =>
//                 bookings.map(
//                     (booking) => ({
//                         ...booking,
//                         normalizedStatus:
//                             normalizeStatus(
//                                 booking?.status
//                             ),
//                     })
//                 ),
//             [bookings]
//         );


//     const activeBookings =
//         useMemo(
//             () =>
//                 normalizedBookings.filter(
//                     (booking) =>
//                         ACTIVE_BOOKING_STATUSES.includes(
//                             booking.normalizedStatus
//                         )
//                 ),
//             [normalizedBookings]
//         );


//     const pendingBookings =
//         useMemo(
//             () =>
//                 normalizedBookings.filter(
//                     (booking) =>
//                         booking.normalizedStatus ===
//                         "PENDING"
//                 ),
//             [normalizedBookings]
//         );


//     const completedBookings =
//         useMemo(
//             () =>
//                 normalizedBookings.filter(
//                     (booking) =>
//                         [
//                             "COMPLETED",
//                             "CLOSED",
//                         ].includes(
//                             booking.normalizedStatus
//                         )
//                 ),
//             [normalizedBookings]
//         );


//     const upcomingBookings =
//         useMemo(
//             () => {
//                 const today =
//                     getTodayString();

//                 return [
//                     ...normalizedBookings,
//                 ]
//                     .filter(
//                         (booking) => {
//                             const status =
//                                 booking.normalizedStatus;

//                             return (
//                                 booking?.booking_date >=
//                                     today &&
//                                 [
//                                     "PENCIL",
//                                     "PENDING",
//                                     "APPROVED",
//                                 ].includes(
//                                     status
//                                 )
//                             );
//                         }
//                     )
//                     .sort(
//                         (a, b) => {
//                             const first =
//                                 `${a?.booking_date || ""} ${a?.start_time || ""}`;

//                             const second =
//                                 `${b?.booking_date || ""} ${b?.start_time || ""}`;

//                             return first.localeCompare(
//                                 second
//                             );
//                         }
//                     );
//             },
//             [normalizedBookings]
//         );


//     /* =====================================================
//        CURRENT FORM FACILITY
//     ===================================================== */

//     const currentFacility =
//         useMemo(
//             () => {
//                 if (!form.facility) {
//                     return selectedFacility;
//                 }

//                 return (
//                     facilities.find(
//                         (facility) =>
//                             String(
//                                 facility.id
//                             ) ===
//                             String(
//                                 form.facility
//                             )
//                     ) ||
//                     selectedFacility
//                 );
//             },
//             [
//                 facilities,
//                 form.facility,
//                 selectedFacility,
//             ]
//         );


//     /* =====================================================
//        FORM RULES
//     ===================================================== */

//     const minimumBookingMinutes =
//         Number(
//             currentFacility?.minimum_booking_minutes ??
//             60
//         );

//     const maximumBookingMinutes =
//         Number(
//             currentFacility?.maximum_booking_minutes ??
//             480
//         );

//     const facilityCapacity =
//         Number(
//             currentFacility?.capacity ??
//             0
//         );

//     const advanceBookingDays =
//         currentFacility?.advance_booking_days;

//     const maximumBookingDate =
//         getMaximumBookingDate(
//             advanceBookingDays
//         );


//     const durationMinutes =
//         useMemo(
//             () =>
//                 calculateDurationMinutes(
//                     form.start_time,
//                     form.end_time
//                 ),
//             [
//                 form.start_time,
//                 form.end_time,
//             ]
//         );


//     /* =====================================================
//        OPEN BOOKING MODAL
//     ===================================================== */

//     const openBooking = (
//         facility
//     ) => {
//         if (!facility) {
//             return;
//         }

//         if (
//             facility.is_active === false ||
//             facility.is_bookable === false
//         ) {
//             return;
//         }

//         setSelectedFacility(
//             facility
//         );

//         setForm(
//             createInitialForm(
//                 facility.id
//             )
//         );

//         setAvailability(null);
//         setValidationError("");
//         setError("");
//         setShowModal(true);
//     };


//     /* =====================================================
//        CLOSE MODAL
//     ===================================================== */

//     const closeModal = () => {
//         if (
//             creatingBooking ||
//             checkingAvailability
//         ) {
//             return;
//         }

//         setShowModal(false);
//         setSelectedFacility(null);
//         setAvailability(null);
//         setValidationError("");
//         setForm(
//             createInitialForm()
//         );
//     };


//     /* =====================================================
//        FORM CHANGE
//     ===================================================== */

//     const handleChange = (
//         event
//     ) => {
//         const {
//             name,
//             value,
//             type,
//             checked,
//         } = event.target;

//         setForm(
//             (previous) => ({
//                 ...previous,

//                 [name]:
//                     type === "checkbox"
//                         ? checked
//                         : value,
//             })
//         );

//         /*
//          * Any schedule / guest / event modification
//          * invalidates the previous availability result.
//          */
//         setAvailability(null);

//         setValidationError("");
//         setError("");
//     };


//     /* =====================================================
//        CLIENT VALIDATION
//     ===================================================== */

//     const validateForm = () => {
//         if (!currentFacility) {
//             return "Please select a facility.";
//         }

//         if (
//             !form.booking_date
//         ) {
//             return "Please select a booking date.";
//         }

//         const today =
//             getTodayString();

//         if (
//             form.booking_date < today
//         ) {
//             return "The booking date cannot be in the past.";
//         }

//         if (
//             maximumBookingDate &&
//             form.booking_date >
//                 maximumBookingDate
//         ) {
//             return `This facility can only be booked up to ${advanceBookingDays} day(s) in advance.`;
//         }

//         if (
//             !form.start_time ||
//             !form.end_time
//         ) {
//             return "Please select both a start time and an end time.";
//         }

//         if (
//             form.booking_date === today &&
//             form.start_time <
//                 getCurrentTimeString()
//         ) {
//             return "The start time cannot be in the past.";
//         }

//         if (
//             durationMinutes <= 0
//         ) {
//             return "The end time must be later than the start time.";
//         }

//         if (
//             durationMinutes <
//             minimumBookingMinutes
//         ) {
//             return `The minimum booking duration is ${formatDuration(minimumBookingMinutes)}.`;
//         }

//         if (
//             durationMinutes >
//             maximumBookingMinutes
//         ) {
//             return `The maximum booking duration is ${formatDuration(maximumBookingMinutes)}.`;
//         }

//         const guests =
//             Number(
//                 form.estimated_guests
//             );

//         if (
//             !Number.isInteger(
//                 guests
//             ) ||
//             guests < 1
//         ) {
//             return "Estimated guests must be at least 1.";
//         }

//         if (
//             facilityCapacity > 0 &&
//             guests >
//                 facilityCapacity
//         ) {
//             return `This facility has a maximum capacity of ${facilityCapacity} guest(s).`;
//         }

//         if (
//             !form.event_type
//         ) {
//             return "Please select an event type.";
//         }

//         if (
//             !String(
//                 form.event_description || ""
//             ).trim()
//         ) {
//             return "Please provide an event description.";
//         }

//         if (
//             form.has_external_supplier &&
//             !String(
//                 form.supplier_details || ""
//             ).trim()
//         ) {
//             return "Please provide the external supplier details.";
//         }

//         return "";
//     };


//     /* =====================================================
//        CHECK AVAILABILITY
//     ===================================================== */

//     const checkAvailability = async () => {
//         const validation =
//             validateForm();

//         if (validation) {
//             setValidationError(
//                 validation
//             );

//             return;
//         }

//         setCheckingAvailability(
//             true
//         );

//         setAvailability(null);
//         setValidationError("");
//         setError("");

//         try {
//             const response =
//                 await checkFacilityAvailability({
//                     facility:
//                         Number(
//                             form.facility
//                         ),

//                     booking_date:
//                         form.booking_date,

//                     start_time:
//                         form.start_time,

//                     end_time:
//                         form.end_time,

//                     estimated_guests:
//                         Number(
//                             form.estimated_guests
//                         ),
//                 });

//             setAvailability(
//                 response
//             );
//         } catch (err) {
//             console.error(
//                 "[Resident Facilities] Availability check failed:",
//                 err
//             );

//             setAvailability(null);

//             setError(
//                 getErrorMessage(
//                     err,
//                     "Unable to check facility availability."
//                 )
//             );
//         } finally {
//             setCheckingAvailability(
//                 false
//             );
//         }
//     };


//     /* =====================================================
//        CREATE PENCIL BOOKING
       
//        IMPORTANT:
//        createFacilityBooking() already creates the booking
//        as PENCIL on the backend.

//        DO NOT call pencilFacilityBooking() afterward.
//     ===================================================== */

//     const createBooking = async (
//         event
//     ) => {
//         event.preventDefault();

//         const validation =
//             validateForm();

//         if (validation) {
//             setValidationError(
//                 validation
//             );

//             return;
//         }

//         /*
//          * Availability must have been confirmed first.
//          */
//         if (
//             !availability?.available
//         ) {
//             setValidationError(
//                 "Please check availability before starting the reservation."
//             );

//             return;
//         }

//         setCreatingBooking(
//             true
//         );

//         setValidationError("");
//         setError("");

//         try {
//             /*
//              * Recheck availability immediately before creation.
//              *
//              * This prevents the UI from relying on a stale
//              * availability result if another booking was made
//              * between the original check and this submission.
//              */
//             const latestAvailability =
//                 await checkFacilityAvailability({
//                     facility:
//                         Number(
//                             form.facility
//                         ),

//                     booking_date:
//                         form.booking_date,

//                     start_time:
//                         form.start_time,

//                     end_time:
//                         form.end_time,

//                     estimated_guests:
//                         Number(
//                             form.estimated_guests
//                         ),
//                 });

//             if (
//                 !latestAvailability?.available
//             ) {
//                 setAvailability(
//                     latestAvailability
//                 );

//                 setValidationError(
//                     latestAvailability?.reason ||
//                     "The selected time block is no longer available."
//                 );

//                 return;
//             }

//             setAvailability(
//                 latestAvailability
//             );

//             /*
//              * Backend creates the booking directly as PENCIL.
//              */
//             const booking =
//                 await createFacilityBooking({
//                     facility:
//                         Number(
//                             form.facility
//                         ),

//                     booking_date:
//                         form.booking_date,

//                     start_time:
//                         form.start_time,

//                     end_time:
//                         form.end_time,

//                     event_type:
//                         form.event_type,

//                     event_description:
//                         String(
//                             form.event_description || ""
//                         ).trim(),

//                     estimated_guests:
//                         Number(
//                             form.estimated_guests
//                         ),

//                     has_external_supplier:
//                         Boolean(
//                             form.has_external_supplier
//                         ),

//                     supplier_details:
//                         form.has_external_supplier
//                             ? String(
//                                 form.supplier_details || ""
//                             ).trim()
//                             : "",
//                 });

//             if (
//                 !booking?.id
//             ) {
//                 throw new Error(
//                     "The reservation was created, but the server did not return a booking ID."
//                 );
//             }

//             /*
//              * Close the modal before navigating.
//              */
//             setShowModal(false);
//             setSelectedFacility(null);
//             setAvailability(null);
//             setValidationError("");
//             setForm(
//                 createInitialForm()
//             );

//             await load(true);

//             /*
//              * Continue directly to the booking details page.
//              *
//              * The details page is responsible for the
//              * 30-minute PENCIL hold countdown and the
//              * remaining booking requirements.
//              */
//             navigate(
//                 `${portalPrefix}/facilities/bookings/${booking.id}`
//             );
//         } catch (err) {
//             console.error(
//                 "[Resident Facilities] Pencil booking failed:",
//                 err
//             );

//             setError(
//                 getErrorMessage(
//                     err,
//                     "The reservation could not be created. Please review the selected facility, date, time, and booking information."
//                 )
//             );
//         } finally {
//             setCreatingBooking(
//                 false
//             );
//         }
//     };


//     /* =====================================================
//        RECENT BOOKINGS
//     ===================================================== */

//     const recentBookings =
//         useMemo(
//             () =>
//                 [
//                     ...normalizedBookings,
//                 ]
//                     .sort(
//                         (a, b) => {
//                             const first =
//                                 `${a?.booking_date || ""} ${a?.start_time || ""}`;

//                             const second =
//                                 `${b?.booking_date || ""} ${b?.start_time || ""}`;

//                             return second.localeCompare(
//                                 first
//                             );
//                         }
//                     )
//                     .slice(
//                         0,
//                         5
//                     ),
//             [normalizedBookings]
//         );


//     /* =====================================================
//        FACILITY CARD PRICE
//     ===================================================== */

//     const getFacilityRental =
//         (facility) =>
//             Number(
//                 facility?.rental_fee || 0
//             );


//     /* =====================================================
//        RENDER
//     ===================================================== */

//     return (
//         <div className="rems-page-content">

//             {/* =================================================
//                 PAGE HEADER
//             ================================================= */}

//             <div className="rems-page-header">

//                 <div>
//                     <div className="rems-page-eyebrow">
//                         RESIDENT PORTAL
//                     </div>

//                     <h1 className="rems-page-title">
//                         Facilities & Amenities
//                     </h1>

//                     <p className="rems-page-description">
//                         Check availability, start a reservation,
//                         and complete your facility booking requirements.
//                     </p>
//                 </div>

//                 <button
//                     type="button"
//                     className="rems-secondary-button"
//                     onClick={() => load(true)}
//                     disabled={
//                         refreshing ||
//                         loading
//                     }
//                 >
//                     <BsArrowClockwise />

//                     {refreshing
//                         ? "Refreshing..."
//                         : "Refresh"}
//                 </button>
//             </div>


//             {/* =================================================
//                 GLOBAL ERROR
//             ================================================= */}

//             {error && (
//                 <div
//                     className="alert alert-danger rems-alert mb-4"
//                     role="alert"
//                 >
//                     <div className="d-flex align-items-start gap-2">
//                         <BsExclamationTriangle
//                             className="mt-1 flex-shrink-0"
//                         />

//                         <div>
//                             {error}
//                         </div>
//                     </div>
//                 </div>
//             )}


//             {/* =================================================
//                 STATISTICS
//             ================================================= */}

//             <div className="row g-3 mb-4">

//                 <div className="col-12 col-md-6 col-xl-3">
//                     <div className="rems-stat-card h-100">

//                         <div className="rems-stat-icon">
//                             <BsHouse />
//                         </div>

//                         <div className="rems-stat-content">

//                             <div className="rems-stat-label">
//                                 Bookable Facilities
//                             </div>

//                             <div className="rems-stat-value">
//                                 {facilities.length}
//                             </div>

//                         </div>
//                     </div>
//                 </div>


//                 <div className="col-12 col-md-6 col-xl-3">
//                     <div className="rems-stat-card h-100">

//                         <div className="rems-stat-icon">
//                             <BsCalendar3 />
//                         </div>

//                         <div className="rems-stat-content">

//                             <div className="rems-stat-label">
//                                 Active Bookings
//                             </div>

//                             <div className="rems-stat-value">
//                                 {activeBookings.length}
//                             </div>

//                         </div>
//                     </div>
//                 </div>


//                 <div className="col-12 col-md-6 col-xl-3">
//                     <div className="rems-stat-card h-100">

//                         <div className="rems-stat-icon">
//                             <BsClockHistory />
//                         </div>

//                         <div className="rems-stat-content">

//                             <div className="rems-stat-label">
//                                 Awaiting Approval
//                             </div>

//                             <div className="rems-stat-value">
//                                 {pendingBookings.length}
//                             </div>

//                         </div>
//                     </div>
//                 </div>


//                 <div className="col-12 col-md-6 col-xl-3">
//                     <div className="rems-stat-card h-100">

//                         <div className="rems-stat-icon">
//                             <BsCheck2Circle />
//                         </div>

//                         <div className="rems-stat-content">

//                             <div className="rems-stat-label">
//                                 Completed
//                             </div>

//                             <div className="rems-stat-value">
//                                 {completedBookings.length}
//                             </div>

//                         </div>
//                     </div>
//                 </div>

//             </div>


//             {/* =================================================
//                 UPCOMING BOOKINGS
//             ================================================= */}

//             {upcomingBookings.length > 0 && (
//                 <div className="rems-glass-card mb-4">

//                     <div className="rems-card-header">

//                         <div>
//                             <div className="rems-card-title">
//                                 Upcoming Reservations
//                             </div>

//                             <div className="rems-card-subtitle">
//                                 Your current and upcoming facility reservations.
//                             </div>
//                         </div>

//                         <button
//                             type="button"
//                             className="rems-secondary-button"
//                             onClick={() =>
//                                 navigate(
//                                     `${portalPrefix}/facilities/bookings`
//                                 )
//                             }
//                         >
//                             View all
//                         </button>

//                     </div>


//                     <div className="p-3">

//                         <div className="row g-3">

//                             {upcomingBookings
//                                 .slice(
//                                     0,
//                                     3
//                                 )
//                                 .map(
//                                     (booking) => (
//                                         <div
//                                             className="col-12 col-md-4"
//                                             key={
//                                                 booking.id
//                                             }
//                                         >

//                                             <button
//                                                 type="button"
//                                                 className="w-100 border-0 bg-transparent text-start p-0"
//                                                 onClick={() =>
//                                                     navigate(
//                                                         `${portalPrefix}/facilities/bookings/${booking.id}`
//                                                     )
//                                                 }
//                                             >

//                                                 <div
//                                                     className="p-3 rounded-3"
//                                                     style={{
//                                                         border:
//                                                             "1px solid rgba(0,0,0,0.08)",
//                                                         background:
//                                                             "rgba(255,255,255,0.45)",
//                                                     }}
//                                                 >

//                                                     <div className="d-flex justify-content-between align-items-start gap-2">

//                                                         <div className="min-width-0">

//                                                             <div className="rems-table-primary text-truncate">
//                                                                 {
//                                                                     booking.facility_name ||
//                                                                     booking.facility?.name ||
//                                                                     "Facility"
//                                                                 }
//                                                             </div>

//                                                             <div className="rems-table-secondary">
//                                                                 {
//                                                                     booking.booking_date
//                                                                 }
//                                                             </div>

//                                                         </div>

//                                                         <span
//                                                             className={`rems-status-badge ${getStatusClass(
//                                                                 booking.status
//                                                             )}`}
//                                                         >
//                                                             <span className="rems-status-dot" />

//                                                             {getStatusLabel(
//                                                                 booking
//                                                             )}
//                                                         </span>

//                                                     </div>


//                                                     <div className="small mt-3">

//                                                         <strong>
//                                                             {booking.start_time}
//                                                         </strong>

//                                                         {" — "}

//                                                         <strong>
//                                                             {booking.end_time}
//                                                         </strong>

//                                                     </div>

//                                                 </div>

//                                             </button>

//                                         </div>
//                                     )
//                                 )}

//                         </div>

//                     </div>

//                 </div>
//             )}


//             {/* =================================================
//                 FACILITIES
//             ================================================= */}

//             <div className="rems-glass-card mb-4">

//                 <div className="rems-card-header">

//                     <div>
//                         <div className="rems-card-title">
//                             Community Facilities
//                         </div>

//                         <div className="rems-card-subtitle">
//                             Choose an amenity and request an available time block.
//                         </div>
//                     </div>

//                 </div>


//                 <div className="p-3 p-md-4">

//                     {loading ? (

//                         <div className="rems-loading-state">

//                             <div className="spinner-border" />

//                             <div className="mt-3">
//                                 Loading facilities...
//                             </div>

//                         </div>

//                     ) : facilities.length === 0 ? (

//                         <div className="rems-empty-state">

//                             <div className="rems-empty-icon">
//                                 <BsHouse />
//                             </div>

//                             <div className="rems-empty-title">
//                                 No bookable facilities
//                             </div>

//                             <div className="rems-empty-text">
//                                 The HOA has not configured any bookable amenities yet.
//                             </div>

//                         </div>

//                     ) : (

//                         <div className="row g-3">

//                             {facilities.map(
//                                 (facility) => {

//                                     const rental =
//                                         getFacilityRental(
//                                             facility
//                                         );

//                                     const deposit =
//                                         Number(
//                                             facility.security_deposit_amount ||
//                                             facility.security_deposit ||
//                                             0
//                                         );

//                                     const minDuration =
//                                         Number(
//                                             facility.minimum_booking_minutes ||
//                                             60
//                                         );

//                                     const maxDuration =
//                                         Number(
//                                             facility.maximum_booking_minutes ||
//                                             480
//                                         );

//                                     return (
//                                         <div
//                                             className="col-12 col-md-6 col-xl-4"
//                                             key={
//                                                 facility.id
//                                             }
//                                         >

//                                             <div className="rems-glass-card h-100">

//                                                 <div className="p-3 p-md-4">

//                                                     {/* Facility title */}

//                                                     <div className="d-flex align-items-start gap-3">

//                                                         <div className="rems-stat-icon flex-shrink-0">
//                                                             {
//                                                                 iconFor(
//                                                                     facility.facility_type
//                                                                 )
//                                                             }
//                                                         </div>

//                                                         <div className="min-width-0 flex-grow-1">

//                                                             <div className="rems-card-title">
//                                                                 {
//                                                                     facility.name
//                                                                 }
//                                                             </div>

//                                                             <div className="rems-card-subtitle">
//                                                                 {
//                                                                     facility.facility_type_display ||
//                                                                     facility.facility_type ||
//                                                                     "Community Facility"
//                                                                 }
//                                                             </div>

//                                                         </div>

//                                                     </div>


//                                                     {/* Description */}

//                                                     <div
//                                                         className="small mt-3"
//                                                         style={{
//                                                             minHeight:
//                                                                 "42px",
//                                                             opacity:
//                                                                 0.8,
//                                                         }}
//                                                     >
//                                                         {
//                                                             facility.description ||
//                                                             "Community facility available for resident reservations."
//                                                         }
//                                                     </div>


//                                                     {/* Core information */}

//                                                     <div className="row g-2 mt-3">

//                                                         <div className="col-6">

//                                                             <div className="rems-table-secondary">
//                                                                 Capacity
//                                                             </div>

//                                                             <div className="rems-table-primary">
//                                                                 {
//                                                                     facility.capacity ||
//                                                                     "—"
//                                                                 }
//                                                             </div>

//                                                         </div>


//                                                         <div className="col-6">

//                                                             <div className="rems-table-secondary">
//                                                                 Rental Fee
//                                                             </div>

//                                                             <div className="rems-table-primary">
//                                                                 {
//                                                                     formatMoney(
//                                                                         rental
//                                                                     )
//                                                                 }
//                                                             </div>

//                                                         </div>


//                                                         <div className="col-6">

//                                                             <div className="rems-table-secondary">
//                                                                 Minimum
//                                                             </div>

//                                                             <div className="rems-table-primary">
//                                                                 {
//                                                                     formatDuration(
//                                                                         minDuration
//                                                                     )
//                                                                 }
//                                                             </div>

//                                                         </div>


//                                                         <div className="col-6">

//                                                             <div className="rems-table-secondary">
//                                                                 Maximum
//                                                             </div>

//                                                             <div className="rems-table-primary">
//                                                                 {
//                                                                     formatDuration(
//                                                                         maxDuration
//                                                                     )
//                                                                 }
//                                                             </div>

//                                                         </div>

//                                                     </div>


//                                                     {/* Deposit */}

//                                                     {facility.requires_security_deposit && (
//                                                         <div
//                                                             className="small mt-3 d-flex align-items-center gap-2"
//                                                             style={{
//                                                                 opacity:
//                                                                     0.8,
//                                                             }}
//                                                         >
//                                                             <BsShieldCheck />

//                                                             <span>
//                                                                 Security deposit:{" "}
//                                                                 <strong>
//                                                                     {
//                                                                         formatMoney(
//                                                                             deposit
//                                                                         )
//                                                                     }
//                                                                 </strong>
//                                                             </span>

//                                                         </div>
//                                                     )}


//                                                     {/* Approval */}

//                                                     {facility.requires_approval !== false && (
//                                                         <div
//                                                             className="small mt-2 d-flex align-items-center gap-2"
//                                                             style={{
//                                                                 opacity:
//                                                                     0.8,
//                                                             }}
//                                                         >
//                                                             <BsInfoCircle />

//                                                             <span>
//                                                                 Reservation requires administrative approval.
//                                                             </span>

//                                                         </div>
//                                                     )}


//                                                     {/* Action */}

//                                                     <button
//                                                         type="button"
//                                                         className="rems-primary-button w-100 mt-4"
//                                                         onClick={() =>
//                                                             openBooking(
//                                                                 facility
//                                                             )
//                                                         }
//                                                         disabled={
//                                                             facility.is_active === false ||
//                                                             facility.is_bookable === false
//                                                         }
//                                                     >
//                                                         <BsPlusLg />

//                                                         Request Reservation
//                                                     </button>

//                                                 </div>

//                                             </div>

//                                         </div>
//                                     );
//                                 }
//                             )}

//                         </div>

//                     )}

//                 </div>

//             </div>


//             {/* =================================================
//                 BOOKING HISTORY
//             ================================================= */}

//             <div className="rems-glass-card">

//                 <div className="rems-card-header">

//                     <div>

//                         <div className="rems-card-title">
//                             My Booking History
//                         </div>

//                         <div className="rems-card-subtitle">
//                             Track reservations, payments, clearances,
//                             inspections, and booking status.
//                         </div>

//                     </div>

//                     <button
//                         type="button"
//                         className="rems-secondary-button"
//                         onClick={() =>
//                             navigate(
//                                 `${portalPrefix}/facilities/bookings`
//                             )
//                         }
//                     >
//                         View all
//                     </button>

//                 </div>


//                 <div className="p-3">

//                     {recentBookings.length === 0 ? (

//                         <div className="rems-empty-state py-4">

//                             <div className="rems-empty-icon">
//                                 <BsClockHistory />
//                             </div>

//                             <div className="rems-empty-title">
//                                 No bookings yet
//                             </div>

//                             <div className="rems-empty-text">
//                                 Your facility reservations will appear here.
//                             </div>

//                         </div>

//                     ) : (

//                         recentBookings.map(
//                             (booking) => (
//                                 <button
//                                     type="button"
//                                     key={
//                                         booking.id
//                                     }
//                                     className="w-100 border-0 text-start bg-transparent p-3 rounded-3 mb-1"
//                                     onClick={() =>
//                                         navigate(
//                                             `${portalPrefix}/facilities/bookings/${booking.id}`
//                                         )
//                                     }
//                                 >

//                                     <div className="d-flex justify-content-between align-items-start gap-3">

//                                         <div className="min-width-0">

//                                             <div className="rems-table-primary text-truncate">
//                                                 {
//                                                     booking.facility_name ||
//                                                     booking.facility?.name ||
//                                                     "Facility"
//                                                 }
//                                             </div>

//                                             <div className="rems-table-secondary">

//                                                 {
//                                                     booking.booking_date
//                                                 }

//                                                 {" · "}

//                                                 {
//                                                     booking.start_time
//                                                 }

//                                                 {" — "}

//                                                 {
//                                                     booking.end_time
//                                                 }

//                                             </div>

//                                         </div>


//                                         <span
//                                             className={`rems-status-badge flex-shrink-0 ${getStatusClass(
//                                                 booking.status
//                                             )}`}
//                                         >

//                                             <span className="rems-status-dot" />

//                                             {
//                                                 getStatusLabel(
//                                                     booking
//                                                 )
//                                             }

//                                         </span>

//                                     </div>

//                                 </button>
//                             )
//                         )

//                     )}

//                 </div>

//             </div>


//             {/* =================================================
//                 BOOKING MODAL
//             ================================================= */}

//             {showModal && (

//                 <div
//                     className="rems-modal-backdrop"
//                     style={{
//                         zIndex: 3000,
//                     }}
//                     onMouseDown={
//                         (event) => {
//                             if (
//                                 event.target ===
//                                 event.currentTarget &&
//                                 !creatingBooking &&
//                                 !checkingAvailability
//                             ) {
//                                 closeModal();
//                             }
//                         }
//                     }
//                 >

//                     <div
//                         className="rems-modal rems-management-modal"
//                         style={{
//                             position:
//                                 "relative",

//                             zIndex:
//                                 3001,

//                             width:
//                                 "min(100%, 900px)",
//                         }}
//                         onMouseDown={
//                             (event) =>
//                                 event.stopPropagation()
//                         }
//                     >

//                         {/* =================================================
//                             MODAL HEADER
//                         ================================================= */}

//                         <div className="rems-modal-header">

//                             <div>

//                                 <div className="rems-page-eyebrow">
//                                     FACILITY RESERVATION
//                                 </div>

//                                 <div className="rems-modal-title">
//                                     {
//                                         selectedFacility?.name ||
//                                         "Facility Reservation"
//                                     }
//                                 </div>

//                                 <div className="rems-modal-subtitle">
//                                     Check availability first,
//                                     then start your reservation.
//                                 </div>

//                             </div>


//                             <button
//                                 type="button"
//                                 className="rems-modal-close"
//                                 onClick={
//                                     closeModal
//                                 }
//                                 disabled={
//                                     creatingBooking ||
//                                     checkingAvailability
//                                 }
//                             >
//                                 <i className="bi bi-x-lg" />
//                             </button>

//                         </div>


//                         {/* =================================================
//                             FORM
//                         ================================================= */}

//                         <form
//                             onSubmit={
//                                 createBooking
//                             }
//                         >

//                             <div className="rems-modal-body">

//                                 {/* =================================================
//                                     VALIDATION ERROR
//                                 ================================================= */}

//                                 {validationError && (
//                                     <div
//                                         className="alert alert-warning rems-alert"
//                                         role="alert"
//                                     >

//                                         <div className="d-flex align-items-start gap-2">

//                                             <BsExclamationTriangle
//                                                 className="mt-1 flex-shrink-0"
//                                             />

//                                             <div>
//                                                 {
//                                                     validationError
//                                                 }
//                                             </div>

//                                         </div>

//                                     </div>
//                                 )}


//                                 {/* =================================================
//                                     FACILITY RULES
//                                 ================================================= */}

//                                 {currentFacility && (
//                                     <div
//                                         className="p-3 rounded-3 mb-4"
//                                         style={{
//                                             border:
//                                                 "1px solid rgba(0,0,0,0.08)",
//                                             background:
//                                                 "rgba(255,255,255,0.42)",
//                                         }}
//                                     >

//                                         <div className="d-flex align-items-start gap-3">

//                                             <div className="rems-stat-icon flex-shrink-0">
//                                                 {
//                                                     iconFor(
//                                                         currentFacility.facility_type
//                                                     )
//                                                 }
//                                             </div>

//                                             <div className="flex-grow-1">

//                                                 <div className="rems-card-title">
//                                                     {
//                                                         currentFacility.name
//                                                     }
//                                                 </div>

//                                                 <div className="rems-card-subtitle">
//                                                     Facility booking rules
//                                                 </div>

//                                             </div>

//                                         </div>


//                                         <div className="row g-3 mt-1">

//                                             <div className="col-6 col-md-3">

//                                                 <div className="rems-table-secondary">
//                                                     Capacity
//                                                 </div>

//                                                 <div className="rems-table-primary">
//                                                     {
//                                                         facilityCapacity ||
//                                                         "—"
//                                                     }
//                                                 </div>

//                                             </div>


//                                             <div className="col-6 col-md-3">

//                                                 <div className="rems-table-secondary">
//                                                     Minimum
//                                                 </div>

//                                                 <div className="rems-table-primary">
//                                                     {
//                                                         formatDuration(
//                                                             minimumBookingMinutes
//                                                         )
//                                                     }
//                                                 </div>

//                                             </div>


//                                             <div className="col-6 col-md-3">

//                                                 <div className="rems-table-secondary">
//                                                     Maximum
//                                                 </div>

//                                                 <div className="rems-table-primary">
//                                                     {
//                                                         formatDuration(
//                                                             maximumBookingMinutes
//                                                         )
//                                                     }
//                                                 </div>

//                                             </div>


//                                             <div className="col-6 col-md-3">

//                                                 <div className="rems-table-secondary">
//                                                     Advance Booking
//                                                 </div>

//                                                 <div className="rems-table-primary">

//                                                     {advanceBookingDays ===
//                                                     undefined ||
//                                                     advanceBookingDays ===
//                                                     null
//                                                         ? "—"
//                                                         : `${advanceBookingDays} day(s)`}

//                                                 </div>

//                                             </div>

//                                         </div>

//                                     </div>
//                                 )}


//                                 {/* =================================================
//                                     RESERVATION SCHEDULE
//                                 ================================================= */}

//                                 <div className="rems-form-section">

//                                     <div className="rems-form-section-title">

//                                         <BsCalendar3 className="me-2" />

//                                         Reservation Schedule

//                                     </div>


//                                     <div className="row g-3">

//                                         {/* Date */}

//                                         <div className="col-12 col-md-4">

//                                             <label className="rems-form-label">
//                                                 Date
//                                             </label>

//                                             <input
//                                                 type="date"
//                                                 name="booking_date"
//                                                 className="form-control rems-form-control"
//                                                 value={
//                                                     form.booking_date
//                                                 }
//                                                 onChange={
//                                                     handleChange
//                                                 }
//                                                 min={
//                                                     getTodayString()
//                                                 }
//                                                 max={
//                                                     maximumBookingDate
//                                                 }
//                                                 required
//                                             />

//                                             {maximumBookingDate && (
//                                                 <div className="form-text">
//                                                     Bookable through{" "}
//                                                     {
//                                                         maximumBookingDate
//                                                     }
//                                                 </div>
//                                             )}

//                                         </div>


//                                         {/* Start */}

//                                         <div className="col-12 col-md-4">

//                                             <label className="rems-form-label">
//                                                 Start
//                                             </label>

//                                             <input
//                                                 type="time"
//                                                 name="start_time"
//                                                 className="form-control rems-form-control"
//                                                 value={
//                                                     form.start_time
//                                                 }
//                                                 onChange={
//                                                     handleChange
//                                                 }
//                                                 min={
//                                                     form.booking_date ===
//                                                     getTodayString()
//                                                         ? getCurrentTimeString()
//                                                         : undefined
//                                                 }
//                                                 required
//                                             />

//                                         </div>


//                                         {/* End */}

//                                         <div className="col-12 col-md-4">

//                                             <label className="rems-form-label">
//                                                 End
//                                             </label>

//                                             <input
//                                                 type="time"
//                                                 name="end_time"
//                                                 className="form-control rems-form-control"
//                                                 value={
//                                                     form.end_time
//                                                 }
//                                                 onChange={
//                                                     handleChange
//                                                 }
//                                                 min={
//                                                     form.start_time ||
//                                                     undefined
//                                                 }
//                                                 required
//                                             />

//                                         </div>


//                                         {/* Duration */}

//                                         <div className="col-12">

//                                             <div
//                                                 className="p-3 rounded-3"
//                                                 style={{
//                                                     border:
//                                                         "1px solid rgba(0,0,0,0.08)",
//                                                     background:
//                                                         "rgba(255,255,255,0.35)",
//                                                 }}
//                                             >

//                                                 <div className="d-flex justify-content-between align-items-center gap-3">

//                                                     <div>

//                                                         <div className="rems-table-secondary">
//                                                             Requested Duration
//                                                         </div>

//                                                         <div className="rems-table-primary">
//                                                             {
//                                                                 durationMinutes >
//                                                                 0
//                                                                     ? formatDuration(
//                                                                         durationMinutes
//                                                                     )
//                                                                     : "Not selected"
//                                                             }
//                                                         </div>

//                                                     </div>


//                                                     <div className="text-end">

//                                                         <div className="small">
//                                                             Allowed range
//                                                         </div>

//                                                         <div className="small fw-semibold">
//                                                             {
//                                                                 formatDuration(
//                                                                     minimumBookingMinutes
//                                                                 )
//                                                             }

//                                                             {" — "}

//                                                             {
//                                                                 formatDuration(
//                                                                     maximumBookingMinutes
//                                                                 )
//                                                             }

//                                                         </div>

//                                                     </div>

//                                                 </div>

//                                             </div>

//                                         </div>


//                                         {/* Availability */}

//                                         <div className="col-12">

//                                             <button
//                                                 type="button"
//                                                 className="rems-secondary-button"
//                                                 onClick={
//                                                     checkAvailability
//                                                 }
//                                                 disabled={
//                                                     checkingAvailability ||
//                                                     creatingBooking
//                                                 }
//                                             >

//                                                 {checkingAvailability ? (
//                                                     <>
//                                                         <span className="spinner-border spinner-border-sm" />
//                                                         Checking...
//                                                     </>
//                                                 ) : (
//                                                     <>
//                                                         <BsCheck2Circle />
//                                                         Check Availability
//                                                     </>
//                                                 )}

//                                             </button>

//                                         </div>


//                                         {/* Availability result */}

//                                         {availability && (
//                                             <div className="col-12">

//                                                 <div
//                                                     className={`alert rems-alert ${
//                                                         availability.available
//                                                             ? "alert-success"
//                                                             : "alert-warning"
//                                                     }`}
//                                                 >

//                                                     <div className="d-flex align-items-start gap-2">

//                                                         {availability.available ? (
//                                                             <BsCheck2Circle
//                                                                 className="mt-1 flex-shrink-0"
//                                                             />
//                                                         ) : (
//                                                             <BsExclamationTriangle
//                                                                 className="mt-1 flex-shrink-0"
//                                                             />
//                                                         )}

//                                                         <div className="flex-grow-1">

//                                                             <div className="fw-semibold">

//                                                                 {
//                                                                     availability.available
//                                                                         ? "Time block available"
//                                                                         : "Time block unavailable"
//                                                                 }

//                                                             </div>

//                                                             <div className="mt-1">

//                                                                 {
//                                                                     availability.reason ||
//                                                                     (
//                                                                         availability.available
//                                                                             ? "The requested facility schedule is currently available."
//                                                                             : "The requested facility schedule is not available."
//                                                                     )
//                                                                 }

//                                                             </div>


//                                                             {availability.available && (
//                                                                 <div className="mt-3 small">

//                                                                     <strong>
//                                                                         Rental:
//                                                                     </strong>{" "}

//                                                                     {
//                                                                         formatMoney(
//                                                                             availability.rental_fee ??
//                                                                             currentFacility?.rental_fee
//                                                                         )
//                                                                     }

//                                                                     {" · "}

//                                                                     <strong>
//                                                                         Deposit:
//                                                                     </strong>{" "}

//                                                                     {
//                                                                         formatMoney(
//                                                                             availability.security_deposit ??
//                                                                             currentFacility?.security_deposit_amount ??
//                                                                             0
//                                                                         )
//                                                                     }

//                                                                 </div>
//                                                             )}

//                                                         </div>

//                                                     </div>

//                                                 </div>

//                                             </div>
//                                         )}

//                                     </div>

//                                 </div>


//                                 {/* =================================================
//                                     EVENT INFORMATION
//                                 ================================================= */}

//                                 <div className="rems-form-section">

//                                     <div className="rems-form-section-title">

//                                         <BsPeople className="me-2" />

//                                         Event Information

//                                     </div>


//                                     <div className="row g-3">

//                                         {/* Event Type */}

//                                         <div className="col-12 col-md-4">

//                                             <label className="rems-form-label">
//                                                 Event Type
//                                             </label>

//                                             <select
//                                                 name="event_type"
//                                                 className="form-select rems-form-control"
//                                                 value={
//                                                     form.event_type
//                                                 }
//                                                 onChange={
//                                                     handleChange
//                                                 }
//                                                 required
//                                             >

//                                                 <option value="PERSONAL">
//                                                     Personal
//                                                 </option>

//                                                 <option value="FAMILY">
//                                                     Family
//                                                 </option>

//                                                 <option value="BIRTHDAY">
//                                                     Birthday
//                                                 </option>

//                                                 <option value="MEETING">
//                                                     Meeting
//                                                 </option>

//                                                 <option value="COMMUNITY_EVENT">
//                                                     Community Event
//                                                 </option>

//                                                 <option value="OTHER">
//                                                     Other
//                                                 </option>

//                                             </select>

//                                         </div>


//                                         {/* Estimated guests */}

//                                         <div className="col-12 col-md-4">

//                                             <label className="rems-form-label">
//                                                 Estimated Guests
//                                             </label>

//                                             <input
//                                                 type="number"
//                                                 min="1"
//                                                 max={
//                                                     facilityCapacity ||
//                                                     undefined
//                                                 }
//                                                 name="estimated_guests"
//                                                 className="form-control rems-form-control"
//                                                 value={
//                                                     form.estimated_guests
//                                                 }
//                                                 onChange={
//                                                     handleChange
//                                                 }
//                                                 required
//                                             />

//                                             {facilityCapacity > 0 && (
//                                                 <div className="form-text">
//                                                     Maximum capacity:{" "}
//                                                     {
//                                                         facilityCapacity
//                                                     }
//                                                 </div>
//                                             )}

//                                         </div>


//                                         {/* External supplier */}

//                                         <div className="col-12 col-md-4">

//                                             <label className="rems-form-label">
//                                                 External Supplier
//                                             </label>

//                                             <div className="form-check form-switch mt-2">

//                                                 <input
//                                                     type="checkbox"
//                                                     name="has_external_supplier"
//                                                     className="form-check-input"
//                                                     checked={
//                                                         form.has_external_supplier
//                                                     }
//                                                     onChange={
//                                                         handleChange
//                                                     }
//                                                 />

//                                                 <label className="form-check-label">
//                                                     Caterer / sound / lights / etc.
//                                                 </label>

//                                             </div>

//                                         </div>


//                                         {/* Event description */}

//                                         <div className="col-12">

//                                             <label className="rems-form-label">
//                                                 Event Description
//                                             </label>

//                                             <textarea
//                                                 name="event_description"
//                                                 rows="3"
//                                                 className="form-control rems-form-control"
//                                                 value={
//                                                     form.event_description
//                                                 }
//                                                 onChange={
//                                                     handleChange
//                                                 }
//                                                 placeholder="Describe the purpose of your reservation."
//                                                 required
//                                             />

//                                         </div>


//                                         {/* Supplier details */}

//                                         {form.has_external_supplier && (
//                                             <div className="col-12">

//                                                 <label className="rems-form-label">
//                                                     Supplier Details
//                                                 </label>

//                                                 <textarea
//                                                     name="supplier_details"
//                                                     rows="3"
//                                                     className="form-control rems-form-control"
//                                                     value={
//                                                         form.supplier_details
//                                                     }
//                                                     onChange={
//                                                         handleChange
//                                                     }
//                                                     placeholder="Provide supplier / contractor name and relevant details."
//                                                     required
//                                                 />

//                                             </div>
//                                         )}

//                                     </div>

//                                 </div>


//                                 {/* =================================================
//                                     PENCIL HOLD INFORMATION
//                                 ================================================= */}

//                                 <div
//                                     className="p-3 rounded-3 mt-3"
//                                     style={{
//                                         border:
//                                             "1px solid rgba(0,0,0,0.08)",
//                                         background:
//                                             "rgba(255,255,255,0.35)",
//                                     }}
//                                 >

//                                     <div className="d-flex align-items-start gap-3">

//                                         <div className="rems-stat-icon flex-shrink-0">
//                                             <BsClockHistory />
//                                         </div>

//                                         <div>

//                                             <div className="rems-card-title">
//                                                 30-Minute Reservation Hold
//                                             </div>

//                                             <div className="rems-card-subtitle mt-1">

//                                                 Starting the reservation creates
//                                                 a temporary PENCIL booking.
//                                                 You must complete the required
//                                                 booking steps within the hold
//                                                 period shown on the booking details page.

//                                             </div>

//                                         </div>

//                                     </div>

//                                 </div>

//                             </div>


//                             {/* =================================================
//                                 MODAL FOOTER
//                             ================================================= */}

//                             <div className="rems-modal-footer">

//                                 <button
//                                     type="button"
//                                     className="rems-secondary-button"
//                                     onClick={
//                                         closeModal
//                                     }
//                                     disabled={
//                                         creatingBooking ||
//                                         checkingAvailability
//                                     }
//                                 >
//                                     Cancel
//                                 </button>


//                                 <button
//                                     type="submit"
//                                     className="rems-primary-button"
//                                     disabled={
//                                         creatingBooking ||
//                                         checkingAvailability ||
//                                         !availability?.available
//                                     }
//                                 >

//                                     {creatingBooking ? (
//                                         <>
//                                             <span className="spinner-border spinner-border-sm" />
//                                             Starting...
//                                         </>
//                                     ) : (
//                                         <>
//                                             <BsPlusLg />
//                                             Start Reservation
//                                         </>
//                                     )}

//                                 </button>

//                             </div>

//                         </form>

//                     </div>

//                 </div>

//             )}

//         </div>
//     );
// }