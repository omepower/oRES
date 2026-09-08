import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsBuilding,
    BsCheck2Circle,
    BsChevronRight,
    BsClockHistory,
    BsExclamationTriangle,
    BsPencil,
    BsPlusLg,
    BsShieldCheck,
    BsCashStack,
    BsXCircle,
} from "react-icons/bs";

import {
    getFacilities,
    createFacility,
    updateFacility,
} from "../../api/facilities";


/* =========================================================
   INITIAL FORM
========================================================= */

const initialForm = {

    name:
        "",

    facility_type:
        "CLUBHOUSE",

    description:
        "",

    location:
        "",

    capacity:
        1,

    parking_capacity:
        "",

    minimum_booking_minutes:
        60,

    maximum_booking_minutes:
        480,

    advance_booking_days:
        30,

    requires_approval:
        true,

    requires_security_deposit:
        false,

    security_deposit_amount:
        0,

    rental_fee:
        0,

    resident_discount_percent:
        0,

    is_active:
        true,

    is_bookable:
        true,

};


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
        response?.facilities ||
        []
    );

};


const normalizeStatus = (
    value
) => {

    return String(
        value ||
        ""
    )
        .trim()
        .toUpperCase();

};


const money = (
    value
) => {

    return Number(
        value || 0
    ).toLocaleString(
        undefined,
        {
            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2,
        }
    );

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
        "string"
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
        data?.message
    ) {

        return String(
            data.message
        );

    }


    if (
        data &&
        typeof data ===
        "object"
    ) {

        const preferredFields = [

            "name",

            "facility_type",

            "capacity",

            "parking_capacity",

            "minimum_booking_minutes",

            "maximum_booking_minutes",

            "advance_booking_days",

            "security_deposit_amount",

            "rental_fee",

            "resident_discount_percent",

            "detail",

        ];


        for (
            const field
            of preferredFields
        ) {

            const value =
                data?.[field];


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
                    value =>
                        Boolean(
                            value
                        )
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


/* =========================================================
   FACILITY TYPES
========================================================= */

const FACILITY_TYPES = [

    {
        value:
            "CLUBHOUSE",

        label:
            "Clubhouse",
    },

    {
        value:
            "BASKETBALL_COURT",

        label:
            "Basketball Court",
    },

    {
        value:
            "SWIMMING_POOL",

        label:
            "Swimming Pool",
    },

    {
        value:
            "CHILDREN_PARK",

        label:
            "Children's Park",
    },

    {
        value:
            "CAR_PARKING",

        label:
            "Car Parking",
    },

];


/* =========================================================
   COMPONENT
========================================================= */

export default function Facilities() {


    /* =====================================================
       DATA
    ===================================================== */

    const [
        facilities,
        setFacilities,
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
        saving,
        setSaving,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState("");


    const [
        showForm,
        setShowForm,
    ] = useState(false);


    const [
        editingId,
        setEditingId,
    ] = useState(null);


    const [
        form,
        setForm,
    ] = useState(
        initialForm
    );


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


    const errorRef =
        useRef(null);


    /* =====================================================
       LOAD FACILITIES
    ===================================================== */

    const loadFacilities =
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
                        await getFacilities();


                    setFacilities(
                        normalize(
                            response
                        )
                    );

                } catch (
                    err
                ) {

                    console.error(
                        "[ORES Admin Facilities]",
                        err
                    );


                    setError(
                        getErrorMessage(
                            err,
                            "Unable to load facilities."
                        )
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

            loadFacilities();

        },
        [
            loadFacilities,
        ]
    );


    /* =====================================================
       ERROR AUTO SCROLL
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

                        errorRef.current?.scrollIntoView(
                            {
                                behavior:
                                    "smooth",

                                block:
                                    "center",
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


    /* =====================================================
       OPEN CREATE
    ===================================================== */

    const openCreate =
        () => {

            setEditingId(
                null
            );


            setForm(
                {
                    ...initialForm,
                }
            );


            setError(
                ""
            );


            setShowForm(
                true
            );

        };


    /* =====================================================
       OPEN EDIT
    ===================================================== */

    const openEdit =
        (
            facility
        ) => {

            setEditingId(
                facility.id
            );


            setForm({

                name:
                    facility.name ||
                    "",

                facility_type:
                    facility.facility_type ||
                    "CLUBHOUSE",

                description:
                    facility.description ||
                    "",

                location:
                    facility.location ||
                    "",

                capacity:
                    facility.capacity ||
                    1,

                parking_capacity:
                    facility.parking_capacity ??
                    "",

                minimum_booking_minutes:
                    facility.minimum_booking_minutes ||
                    60,

                maximum_booking_minutes:
                    facility.maximum_booking_minutes ||
                    480,

                advance_booking_days:
                    facility.advance_booking_days ??
                    30,

                requires_approval:
                    facility.requires_approval !==
                    false,

                requires_security_deposit:
                    facility.requires_security_deposit ===
                    true,

                security_deposit_amount:
                    facility.security_deposit_amount ||
                    0,

                rental_fee:
                    facility.rental_fee ||
                    0,

                resident_discount_percent:
                    facility.resident_discount_percent ||
                    0,

                is_active:
                    facility.is_active !==
                    false,

                is_bookable:
                    facility.is_bookable !==
                    false,

            });


            setError(
                ""
            );


            setShowForm(
                true
            );

        };


    /* =====================================================
       HANDLE CHANGE
    ===================================================== */

    const handleChange =
        (
            event
        ) => {

            const {
                name,
                value,
                type,
                checked,
            } = event.target;


            setForm(
                previous => ({

                    ...previous,

                    [name]:
                        type ===
                        "checkbox"

                            ? checked

                            : value,

                })
            );

        };


    /* =====================================================
       CALCULATED FINANCIALS
    ===================================================== */

    const rentalFee =
        Number(
            form.rental_fee ||
            0
        );


    const discountPercent =
        Number(
            form.resident_discount_percent ||
            0
        );


    const securityDeposit =
        form.requires_security_deposit

            ? Number(
                form.security_deposit_amount ||
                0
            )

            : 0;


    const discountAmount =
        rentalFee *
        discountPercent /
        100;


    const discountedRental =
        Math.max(
            0,
            rentalFee -
            discountAmount
        );


    const totalPayable =
        discountedRental +
        securityDeposit;


    /* =====================================================
       FILTERED FACILITIES
    ===================================================== */

    const filteredFacilities =
        useMemo(
            () => {

                const text =
                    search
                        .trim()
                        .toLowerCase();


                return facilities.filter(
                    facility => {

                        const name =
                            String(
                                facility?.name ||
                                ""
                            )
                                .toLowerCase();


                        const type =
                            String(
                                facility?.facility_type_display ||
                                facility?.facility_type ||
                                ""
                            )
                                .toLowerCase();


                        const location =
                            String(
                                facility?.location ||
                                ""
                            )
                                .toLowerCase();


                        const isActive =
                            facility?.is_active !==
                            false;


                        const isBookable =
                            facility?.is_bookable ===
                            true;


                        const matchesSearch =
                            !text ||

                            name.includes(
                                text
                            ) ||

                            type.includes(
                                text
                            ) ||

                            location.includes(
                                text
                            );


                        let matchesStatus =
                            true;


                        if (
                            statusFilter ===
                            "ACTIVE"
                        ) {

                            matchesStatus =
                                isActive;

                        }


                        if (
                            statusFilter ===
                            "INACTIVE"
                        ) {

                            matchesStatus =
                                !isActive;

                        }


                        if (
                            statusFilter ===
                            "BOOKABLE"
                        ) {

                            matchesStatus =
                                isActive &&
                                isBookable;

                        }


                        if (
                            statusFilter ===
                            "UNAVAILABLE"
                        ) {

                            matchesStatus =
                                !isBookable;

                        }


                        return (
                            matchesSearch &&
                            matchesStatus
                        );

                    }
                );

            },
            [
                facilities,
                search,
                statusFilter,
            ]
        );


    /* =====================================================
       STATISTICS
    ===================================================== */

    const statistics =
        useMemo(
            () => {

                const total =
                    facilities.length;


                const active =
                    facilities.filter(
                        facility =>
                            facility?.is_active !==
                            false
                    ).length;


                const bookable =
                    facilities.filter(
                        facility =>
                            facility?.is_active !==
                            false &&
                            facility?.is_bookable ===
                            true
                    ).length;


                const deposits =
                    facilities.filter(
                        facility =>
                            facility?.requires_security_deposit ===
                            true
                    ).length;


                return {

                    total,

                    active,

                    bookable,

                    deposits,

                };

            },
            [
                facilities,
            ]
        );


    /* =====================================================
       VALIDATE FORM
    ===================================================== */

    const validateForm =
        () => {

            const name =
                String(
                    form.name ||
                    ""
                ).trim();


            if (
                !name
            ) {

                return "Facility name is required.";

            }


            const capacity =
                Number(
                    form.capacity
                );


            if (
                !Number.isFinite(
                    capacity
                ) ||
                capacity <
                1
            ) {

                return "Facility capacity must be at least 1.";

            }


            const minimumMinutes =
                Number(
                    form.minimum_booking_minutes
                );


            if (
                !Number.isFinite(
                    minimumMinutes
                ) ||
                minimumMinutes <
                1
            ) {

                return "Minimum booking duration must be at least 1 minute.";

            }


            const maximumMinutes =
                Number(
                    form.maximum_booking_minutes
                );


            if (
                !Number.isFinite(
                    maximumMinutes
                ) ||
                maximumMinutes <
                minimumMinutes
            ) {

                return "Maximum booking duration must be greater than or equal to the minimum booking duration.";

            }


            const advanceDays =
                Number(
                    form.advance_booking_days
                );


            if (
                !Number.isFinite(
                    advanceDays
                ) ||
                advanceDays <
                0
            ) {

                return "Advance booking days cannot be negative.";

            }


            const rental =
                Number(
                    form.rental_fee
                );


            if (
                !Number.isFinite(
                    rental
                ) ||
                rental <
                0
            ) {

                return "Rental fee cannot be negative.";

            }


            const discount =
                Number(
                    form.resident_discount_percent
                );


            if (
                !Number.isFinite(
                    discount
                ) ||
                discount <
                0 ||
                discount >
                100
            ) {

                return "Resident discount must be between 0% and 100%.";

            }


            const deposit =
                Number(
                    form.security_deposit_amount
                );


            if (
                form.requires_security_deposit &&
                (
                    !Number.isFinite(
                        deposit
                    ) ||
                    deposit <
                    0
                )
            ) {

                return "Security deposit amount cannot be negative.";

            }


            if (
                form.parking_capacity !==
                ""
            ) {

                const parkingCapacity =
                    Number(
                        form.parking_capacity
                    );


                if (
                    !Number.isFinite(
                        parkingCapacity
                    ) ||
                    parkingCapacity <
                    0
                ) {

                    return "Parking capacity cannot be negative.";

                }

            }


            return "";

        };


    /* =====================================================
       SUBMIT FORM
    ===================================================== */

    const handleSubmit =
        async (
            event
        ) => {

            event.preventDefault();


            setError("");


            const validationError =
                validateForm();


            if (
                validationError
            ) {

                setError(
                    validationError
                );

                return;

            }


            setSaving(
                true
            );


            const payload = {

                ...form,

                name:
                    String(
                        form.name
                    ).trim(),

                description:
                    String(
                        form.description ||
                        ""
                    ).trim(),

                location:
                    String(
                        form.location ||
                        ""
                    ).trim(),

                capacity:
                    Number(
                        form.capacity
                    ),

                parking_capacity:
                    form.parking_capacity ===
                    ""
                        ? null
                        : Number(
                            form.parking_capacity
                        ),

                minimum_booking_minutes:
                    Number(
                        form.minimum_booking_minutes
                    ),

                maximum_booking_minutes:
                    Number(
                        form.maximum_booking_minutes
                    ),

                advance_booking_days:
                    Number(
                        form.advance_booking_days
                    ),

                security_deposit_amount:
                    form.requires_security_deposit
                        ? Number(
                            form.security_deposit_amount ||
                            0
                        )
                        : 0,

                rental_fee:
                    Number(
                        form.rental_fee ||
                        0
                    ),

                resident_discount_percent:
                    Number(
                        form.resident_discount_percent ||
                        0
                    ),

            };


            try {

                if (
                    editingId
                ) {

                    await updateFacility(
                        editingId,
                        payload
                    );

                } else {

                    await createFacility(
                        payload
                    );

                }


                setShowForm(
                    false
                );


                setEditingId(
                    null
                );


                setForm(
                    {
                        ...initialForm,
                    }
                );


                await loadFacilities(
                    true
                );

            } catch (
                err
            ) {

                console.error(
                    "[ORES Admin Facilities] Save",
                    err
                );


                setError(
                    getErrorMessage(
                        err,
                        "Unable to save facility."
                    )
                );

            } finally {

                setSaving(
                    false
                );

            }

        };


    /* =====================================================
       CLOSE FORM
    ===================================================== */

    const closeForm =
        () => {

            if (
                saving
            ) {

                return;

            }


            setShowForm(
                false
            );


            setEditingId(
                null
            );


            setForm(
                {
                    ...initialForm,
                }
            );


            setError(
                ""
            );

        };


    /* =====================================================
       LOADING
    ===================================================== */

    if (
        loading
    ) {

        return (

            <div className="rems-page-content">

                <div className="rems-loading-state">

                    <div
                        className="spinner-border"
                        role="status"
                        aria-hidden="true"
                    />

                    <div className="mt-3">

                        Loading facilities...

                    </div>

                </div>

            </div>

        );

    }


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className="rems-page-content">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">

                        ADMINISTRATION

                    </div>


                    <h1 className="rems-page-title">

                        Facilities & Amenities

                    </h1>


                    <p className="rems-page-description">

                        Configure community facilities,
                        capacities, booking rules, pricing,
                        resident discounts, and security deposits.

                    </p>

                </div>


                <div className="rems-page-header-actions">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() =>
                            loadFacilities(
                                true
                            )
                        }
                        disabled={
                            refreshing
                        }
                    >

                        {refreshing ? (

                            <span
                                className="spinner-border spinner-border-sm"
                                aria-hidden="true"
                            />

                        ) : (

                            <BsArrowClockwise />

                        )}


                        {
                            refreshing
                                ? "Refreshing..."
                                : "Refresh"
                        }

                    </button>


                    <button
                        type="button"
                        className="rems-primary-button"
                        onClick={
                            openCreate
                        }
                    >

                        <BsPlusLg />

                        Add Facility

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
                    tabIndex={-1}
                    className="alert alert-danger rems-alert mb-4"
                    role="alert"
                    aria-live="assertive"
                    style={{
                        outline:
                            "none",

                        scrollMarginTop:
                            "24px",
                    }}
                >

                    <div className="d-flex align-items-start gap-2">

                        <BsExclamationTriangle
                            className="mt-1 flex-shrink-0"
                        />


                        <div className="flex-grow-1">

                            <div className="fw-semibold">

                                Unable to complete the request

                            </div>


                            <div className="mt-1">

                                {
                                    error
                                }

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


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="row g-3 mb-4">


                <div className="col-6 col-xl-3">

                    <div className="rems-stat-card h-100">

                        <div className="rems-stat-icon">

                            <BsBuilding />

                        </div>


                        <div className="rems-stat-content">

                            <div className="rems-stat-label">

                                Total Facilities

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

                            <BsCheck2Circle />

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

                            <BsCalendar3Fallback />

                        </div>


                        <div className="rems-stat-content">

                            <div className="rems-stat-label">

                                Bookable

                            </div>


                            <div className="rems-stat-value">

                                {
                                    statistics.bookable
                                }

                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-6 col-xl-3">

                    <div className="rems-stat-card h-100">

                        <div className="rems-stat-icon">

                            <BsShieldCheck />

                        </div>


                        <div className="rems-stat-content">

                            <div className="rems-stat-label">

                                Require Deposit

                            </div>


                            <div className="rems-stat-value">

                                {
                                    statistics.deposits
                                }

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                REGISTRY
            ================================================= */}

            <div className="rems-glass-card">


                <div className="rems-card-header">

                    <div>

                        <div className="rems-card-title">

                            Facility Registry

                        </div>


                        <div className="rems-card-subtitle">

                            Community facilities configured
                            for resident reservations.

                        </div>

                    </div>


                    <BsBuilding />

                </div>


                {/* =================================================
                    FILTER BAR
                ================================================= */}

                <div className="rems-filter-bar">


                    <div className="rems-search-box">

                        <i className="bi bi-search" />


                        <input
                            type="search"
                            className="form-control"
                            placeholder="Search facility, type, or location..."
                            value={
                                search
                            }
                            onChange={
                                event =>
                                    setSearch(
                                        event.target.value
                                    )
                            }
                        />

                    </div>


                    <select
                        className="form-select rems-filter-select"
                        value={
                            statusFilter
                        }
                        onChange={
                            event =>
                                setStatusFilter(
                                    event.target.value
                                )
                        }
                    >

                        <option value="ALL">

                            All Facilities

                        </option>


                        <option value="ACTIVE">

                            Active

                        </option>


                        <option value="BOOKABLE">

                            Bookable

                        </option>


                        <option value="INACTIVE">

                            Inactive

                        </option>


                        <option value="UNAVAILABLE">

                            Not Bookable

                        </option>

                    </select>


                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() => {

                            setSearch("");

                            setStatusFilter(
                                "ALL"
                            );

                        }}
                    >

                        Reset

                    </button>

                </div>


                {/* =================================================
                    RESULT TOOLBAR
                ================================================= */}

                <div className="rems-table-toolbar">

                    <div>

                        <div className="rems-card-title">

                            Configured Facilities

                        </div>


                        <div className="rems-card-subtitle">

                            {
                                filteredFacilities.length
                            }

                            {" "}

                            {
                                filteredFacilities.length ===
                                1
                                    ? "facility"
                                    : "facilities"
                            }

                            {" found"}

                        </div>

                    </div>


                    <div className="small text-muted">

                        {
                            search ||
                            statusFilter !==
                            "ALL"
                                ? "Filtered"
                                : "All records"
                        }

                    </div>

                </div>


                {/* =================================================
                    TABLE
                ================================================= */}

                {filteredFacilities.length ===
                0 ? (

                    <div className="rems-empty-state py-5">

                        <div className="rems-empty-icon">

                            <BsBuilding />

                        </div>


                        <div className="rems-empty-title">

                            No facilities found

                        </div>


                        <div className="rems-empty-text">

                            {
                                facilities.length ===
                                0

                                    ? "Create your first community facility."

                                    : "Try changing the search or filter."
                            }

                        </div>


                        {facilities.length >
                        0 && (

                            <button
                                type="button"
                                className="rems-secondary-button mt-3"
                                onClick={() => {

                                    setSearch("");

                                    setStatusFilter(
                                        "ALL"
                                    );

                                }}
                            >

                                Reset Filters

                            </button>

                        )}

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

                                        Capacity

                                    </th>


                                    <th>

                                        Booking Rules

                                    </th>


                                    <th>

                                        Resident Fee

                                    </th>


                                    <th>

                                        Deposit

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

                                {filteredFacilities.map(
                                    facility => {

                                        const rental =
                                            Number(
                                                facility?.rental_fee ||
                                                0
                                            );


                                        const discount =
                                            Number(
                                                facility?.resident_discount_percent ||
                                                0
                                            );


                                        const discountedRental =
                                            Math.max(
                                                0,
                                                rental -
                                                (
                                                    rental *
                                                    discount /
                                                    100
                                                )
                                            );


                                        const deposit =
                                            facility?.requires_security_deposit
                                                ? Number(
                                                    facility?.security_deposit_amount ||
                                                    0
                                                )
                                                : 0;


                                        const total =
                                            discountedRental +
                                            deposit;


                                        return (

                                            <tr
                                                key={
                                                    facility.id
                                                }
                                            >

                                                {/* FACILITY */}

                                                <td
                                                    data-label="Facility"
                                                >

                                                    <div className="rems-table-primary">

                                                        {
                                                            facility.name
                                                        }

                                                    </div>


                                                    <div className="rems-table-secondary">

                                                        {
                                                            facility.facility_type_display ||
                                                            facility.facility_type
                                                        }


                                                        {facility.location && (

                                                            <>
                                                                {" · "}
                                                                {
                                                                    facility.location
                                                                }
                                                            </>

                                                        )}

                                                    </div>

                                                </td>


                                                {/* CAPACITY */}

                                                <td
                                                    data-label="Capacity"
                                                >

                                                    <div className="rems-table-primary">

                                                        {
                                                            facility.capacity ||
                                                            0
                                                        }

                                                    </div>


                                                    <div className="rems-table-secondary">

                                                        guests

                                                    </div>


                                                    {facility.parking_capacity !==
                                                        null &&
                                                        facility.parking_capacity !==
                                                        undefined &&
                                                        facility.parking_capacity !==
                                                        "" && (

                                                        <div className="rems-table-secondary mt-1">

                                                            {
                                                                facility.parking_capacity
                                                            }

                                                            {" parking"}

                                                        </div>

                                                    )}

                                                </td>


                                                {/* BOOKING RULES */}

                                                <td
                                                    data-label="Booking Rules"
                                                >

                                                    <div className="rems-table-primary">

                                                        {
                                                            facility.minimum_booking_minutes
                                                        }

                                                        {"–"}

                                                        {
                                                            facility.maximum_booking_minutes
                                                        }

                                                        {" min"}

                                                    </div>


                                                    <div className="rems-table-secondary">

                                                        {
                                                            facility.advance_booking_days
                                                        }

                                                        {" days advance"}

                                                    </div>

                                                </td>


                                                {/* RESIDENT FEE */}

                                                <td
                                                    data-label="Resident Fee"
                                                >

                                                    <div className="rems-table-primary">

                                                        ₱{
                                                            money(
                                                                discountedRental
                                                            )
                                                        }

                                                    </div>


                                                    {discount >
                                                    0 && (

                                                        <div className="rems-table-secondary">

                                                            {
                                                                discount
                                                            }
                                                            % resident discount

                                                        </div>

                                                    )}

                                                </td>


                                                {/* DEPOSIT */}

                                                <td
                                                    data-label="Deposit"
                                                >

                                                    {facility.requires_security_deposit ? (

                                                        <>

                                                            <div className="rems-table-primary">

                                                                ₱{
                                                                    money(
                                                                        deposit
                                                                    )
                                                                }

                                                            </div>


                                                            <div className="rems-table-secondary">

                                                                Total:

                                                                {" "}

                                                                ₱{
                                                                    money(
                                                                        total
                                                                    )
                                                                }

                                                            </div>

                                                        </>

                                                    ) : (

                                                        <span className="small text-muted">

                                                            None

                                                        </span>

                                                    )}

                                                </td>


                                                {/* STATUS */}

                                                <td
                                                    data-label="Status"
                                                >

                                                    <div className="d-flex flex-column gap-1">


                                                        <span
                                                            className={`rems-status-badge ${
                                                                facility.is_active
                                                                    ? "rems-status-success"
                                                                    : "rems-status-secondary"
                                                            }`}
                                                        >

                                                            <span className="rems-status-dot" />

                                                            {
                                                                facility.is_active
                                                                    ? "Active"
                                                                    : "Inactive"
                                                            }

                                                        </span>


                                                        <span
                                                            className={`rems-status-badge ${
                                                                facility.is_bookable
                                                                    ? "rems-status-success"
                                                                    : "rems-status-secondary"
                                                            }`}
                                                        >

                                                            <span className="rems-status-dot" />

                                                            {
                                                                facility.is_bookable
                                                                    ? "Bookable"
                                                                    : "Not Bookable"
                                                            }

                                                        </span>

                                                    </div>

                                                </td>


                                                {/* ACTION */}

                                                <td
                                                    data-label="Actions"
                                                >

                                                    <div className="d-flex justify-content-end gap-1">

                                                        <button
                                                            type="button"
                                                            className="rems-icon-button"
                                                            title="Edit facility"
                                                            onClick={() =>
                                                                openEdit(
                                                                    facility
                                                                )
                                                            }
                                                        >

                                                            <BsPencil />

                                                        </button>


                                                        <button
                                                            type="button"
                                                            className="rems-icon-button"
                                                            title="Open facility"
                                                            onClick={() =>
                                                                openEdit(
                                                                    facility
                                                                )
                                                            }
                                                        >

                                                            <BsChevronRight />

                                                        </button>

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
                FACILITY FORM MODAL
            ================================================= */}

            {showForm && (

                <div
                    className="rems-modal-backdrop"
                    style={{
                        zIndex:
                            3000,
                    }}
                    onMouseDown={
                        event => {

                            if (
                                event.target ===
                                event.currentTarget &&
                                !saving
                            ) {

                                closeForm();

                            }

                        }
                    }
                >

                    <div
                        className="rems-modal rems-management-modal"
                        style={{
                            position:
                                "relative",

                            zIndex:
                                3001,

                            width:
                                "min(100%, 1040px)",

                            maxHeight:
                                "92vh",

                            display:
                                "flex",

                            flexDirection:
                                "column",
                        }}
                        onMouseDown={
                            event =>
                                event.stopPropagation()
                        }
                    >


                        {/* =================================================
                            HEADER
                        ================================================= */}

                        <div className="rems-modal-header">

                            <div>

                                <div className="rems-page-eyebrow">

                                    FACILITY CONFIGURATION

                                </div>


                                <div className="rems-modal-title">

                                    {
                                        editingId
                                            ? "Edit Facility"
                                            : "Add Facility"
                                    }

                                </div>


                                <div className="rems-modal-subtitle">

                                    Configure the facility before
                                    making it available to residents.

                                </div>

                            </div>


                            <button
                                type="button"
                                className="rems-modal-close"
                                onClick={
                                    closeForm
                                }
                                disabled={
                                    saving
                                }
                            >

                                <i className="bi bi-x-lg" />

                            </button>

                        </div>


                        {/* =================================================
                            FORM
                        ================================================= */}

                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div
                                className="rems-modal-body"
                                style={{
                                    overflowY:
                                        "auto",
                                }}
                            >


                                {/* =================================================
                                    BASIC INFORMATION
                                ================================================= */}

                                <div className="rems-form-section mb-4">

                                    <div className="rems-form-section-title">

                                        <BsBuilding className="me-2" />

                                        Basic Information

                                    </div>


                                    <div className="row g-3">


                                        <div className="col-12 col-md-7">

                                            <label className="rems-form-label">

                                                Facility Name

                                                <span className="text-danger ms-1">
                                                    *
                                                </span>

                                            </label>


                                            <input
                                                type="text"
                                                name="name"
                                                className="form-control rems-form-control"
                                                value={
                                                    form.name
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="e.g. Clubhouse"
                                                required
                                            />

                                        </div>


                                        <div className="col-12 col-md-5">

                                            <label className="rems-form-label">

                                                Facility Type

                                            </label>


                                            <select
                                                name="facility_type"
                                                className="form-select rems-form-control"
                                                value={
                                                    form.facility_type
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            >

                                                {FACILITY_TYPES.map(
                                                    type => (

                                                        <option
                                                            key={
                                                                type.value
                                                            }
                                                            value={
                                                                type.value
                                                            }
                                                        >

                                                            {
                                                                type.label
                                                            }

                                                        </option>

                                                    )
                                                )}

                                            </select>

                                        </div>


                                        <div className="col-12">

                                            <label className="rems-form-label">

                                                Description

                                            </label>


                                            <textarea
                                                name="description"
                                                rows="3"
                                                className="form-control rems-form-control"
                                                value={
                                                    form.description
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Describe the facility, its purpose, and any resident-facing information."
                                            />

                                        </div>


                                        <div className="col-12">

                                            <label className="rems-form-label">

                                                Location

                                            </label>


                                            <input
                                                type="text"
                                                name="location"
                                                className="form-control rems-form-control"
                                                value={
                                                    form.location
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="e.g. Phase 1 Clubhouse"
                                            />

                                        </div>

                                    </div>

                                </div>


                                {/* =================================================
                                    CAPACITY
                                ================================================= */}

                                <div className="rems-form-section mb-4">

                                    <div className="rems-form-section-title">

                                        <BsPeopleFallback className="me-2" />

                                        Capacity & Scheduling

                                    </div>


                                    <div className="row g-3">


                                        <div className="col-12 col-md-4">

                                            <label className="rems-form-label">

                                                Guest Capacity

                                            </label>


                                            <input
                                                type="number"
                                                min="1"
                                                name="capacity"
                                                className="form-control rems-form-control"
                                                value={
                                                    form.capacity
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                required
                                            />

                                        </div>


                                        <div className="col-12 col-md-4">

                                            <label className="rems-form-label">

                                                Parking Capacity

                                            </label>


                                            <input
                                                type="number"
                                                min="0"
                                                name="parking_capacity"
                                                className="form-control rems-form-control"
                                                value={
                                                    form.parking_capacity
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Optional"
                                            />

                                        </div>


                                        <div className="col-12 col-md-4">

                                            <label className="rems-form-label">

                                                Advance Booking Days

                                            </label>


                                            <input
                                                type="number"
                                                min="0"
                                                name="advance_booking_days"
                                                className="form-control rems-form-control"
                                                value={
                                                    form.advance_booking_days
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />

                                        </div>


                                        <div className="col-12 col-md-6">

                                            <label className="rems-form-label">

                                                Minimum Booking Duration

                                            </label>


                                            <div className="input-group">

                                                <input
                                                    type="number"
                                                    min="1"
                                                    name="minimum_booking_minutes"
                                                    className="form-control rems-form-control"
                                                    value={
                                                        form.minimum_booking_minutes
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                />


                                                <span className="input-group-text">

                                                    minutes

                                                </span>

                                            </div>

                                        </div>


                                        <div className="col-12 col-md-6">

                                            <label className="rems-form-label">

                                                Maximum Booking Duration

                                            </label>


                                            <div className="input-group">

                                                <input
                                                    type="number"
                                                    min="1"
                                                    name="maximum_booking_minutes"
                                                    className="form-control rems-form-control"
                                                    value={
                                                        form.maximum_booking_minutes
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                />


                                                <span className="input-group-text">

                                                    minutes

                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                </div>


                                {/* =================================================
                                    FINANCIAL CONFIGURATION
                                ================================================= */}

                                <div className="rems-form-section mb-4">

                                    <div className="rems-form-section-title">

                                        <BsCashStack className="me-2" />

                                        Pricing & Payment

                                    </div>


                                    <div className="row g-3">


                                        <div className="col-12 col-md-4">

                                            <label className="rems-form-label">

                                                Standard Rental Fee

                                            </label>


                                            <div className="input-group">

                                                <span className="input-group-text">

                                                    ₱

                                                </span>


                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    name="rental_fee"
                                                    className="form-control rems-form-control"
                                                    value={
                                                        form.rental_fee
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                />

                                            </div>

                                        </div>


                                        <div className="col-12 col-md-4">

                                            <label className="rems-form-label">

                                                Resident Discount

                                            </label>


                                            <div className="input-group">

                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    name="resident_discount_percent"
                                                    className="form-control rems-form-control"
                                                    value={
                                                        form.resident_discount_percent
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                />


                                                <span className="input-group-text">

                                                    %

                                                </span>

                                            </div>

                                        </div>


                                        <div className="col-12 col-md-4">

                                            <label className="rems-form-label">

                                                Security Deposit

                                            </label>


                                            <div className="input-group">

                                                <span className="input-group-text">

                                                    ₱

                                                </span>


                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    name="security_deposit_amount"
                                                    className="form-control rems-form-control"
                                                    value={
                                                        form.security_deposit_amount
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    disabled={
                                                        !form.requires_security_deposit
                                                    }
                                                />

                                            </div>

                                        </div>


                                        {/* =================================================
                                            PAYMENT PREVIEW
                                        ================================================= */}

                                        <div className="col-12">

                                            <div className="alert alert-info rems-alert mb-0">

                                                <div className="fw-semibold mb-2">

                                                    Resident Payment Preview

                                                </div>


                                                <div className="row g-3">


                                                    <div className="col-12 col-md-4">

                                                        <div className="rems-table-secondary">

                                                            Rental Fee

                                                        </div>


                                                        <div className="rems-table-primary">

                                                            ₱{
                                                                money(
                                                                    rentalFee
                                                                )
                                                            }

                                                        </div>

                                                    </div>


                                                    <div className="col-12 col-md-4">

                                                        <div className="rems-table-secondary">

                                                            Resident Discount

                                                        </div>


                                                        <div className="rems-table-primary">

                                                            - ₱{
                                                                money(
                                                                    discountAmount
                                                                )
                                                            }

                                                        </div>

                                                    </div>


                                                    <div className="col-12 col-md-4">

                                                        <div className="rems-table-secondary">

                                                            Discounted Rental

                                                        </div>


                                                        <div className="rems-table-primary">

                                                            ₱{
                                                                money(
                                                                    discountedRental
                                                                )
                                                            }

                                                        </div>

                                                    </div>


                                                    <div className="col-12 col-md-4">

                                                        <div className="rems-table-secondary">

                                                            Security Deposit

                                                        </div>


                                                        <div className="rems-table-primary">

                                                            ₱{
                                                                money(
                                                                    securityDeposit
                                                                )
                                                            }

                                                        </div>

                                                    </div>


                                                    <div className="col-12 col-md-4">

                                                        <div className="rems-table-secondary">

                                                            Payment Method

                                                        </div>


                                                        <div className="rems-table-primary">

                                                            One consolidated payment

                                                        </div>

                                                    </div>


                                                    <div className="col-12 col-md-4">

                                                        <div className="rems-table-secondary">

                                                            Total Payable

                                                        </div>


                                                        <div className="rems-table-primary">

                                                            ₱{
                                                                money(
                                                                    totalPayable
                                                                )
                                                            }

                                                        </div>

                                                    </div>

                                                </div>


                                                <div className="small mt-3">

                                                    Residents will submit one
                                                    payment covering the discounted
                                                    rental fee plus the applicable
                                                    security deposit.

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>


                                {/* =================================================
                                    BOOKING CONTROL
                                ================================================= */}

                                <div className="rems-form-section">

                                    <div className="rems-form-section-title">

                                        <BsShieldCheck className="me-2" />

                                        Booking Controls

                                    </div>


                                    <div className="row g-3">


                                        <div className="col-12 col-md-4">

                                            <div className="border rounded-3 p-3 h-100">

                                                <div className="form-check form-switch">

                                                    <input
                                                        type="checkbox"
                                                        name="requires_approval"
                                                        className="form-check-input"
                                                        checked={
                                                            form.requires_approval
                                                        }
                                                        onChange={
                                                            handleChange
                                                        }
                                                    />


                                                    <label className="form-check-label fw-semibold">

                                                        Requires Approval

                                                    </label>

                                                </div>


                                                <div className="small text-muted mt-2">

                                                    Resident reservations remain
                                                    pending until an administrator
                                                    approves them.

                                                </div>

                                            </div>

                                        </div>


                                        <div className="col-12 col-md-4">

                                            <div className="border rounded-3 p-3 h-100">

                                                <div className="form-check form-switch">

                                                    <input
                                                        type="checkbox"
                                                        name="requires_security_deposit"
                                                        className="form-check-input"
                                                        checked={
                                                            form.requires_security_deposit
                                                        }
                                                        onChange={
                                                            handleChange
                                                        }
                                                    />


                                                    <label className="form-check-label fw-semibold">

                                                        Requires Security Deposit

                                                    </label>

                                                </div>


                                                <div className="small text-muted mt-2">

                                                    The deposit becomes part of
                                                    the resident's single consolidated
                                                    payment and may later be refunded
                                                    after inspection.

                                                </div>

                                            </div>

                                        </div>


                                        <div className="col-12 col-md-4">

                                            <div className="border rounded-3 p-3 h-100">

                                                <div className="form-check form-switch">

                                                    <input
                                                        type="checkbox"
                                                        name="is_bookable"
                                                        className="form-check-input"
                                                        checked={
                                                            form.is_bookable
                                                        }
                                                        onChange={
                                                            handleChange
                                                        }
                                                    />


                                                    <label className="form-check-label fw-semibold">

                                                        Available for Booking

                                                    </label>

                                                </div>


                                                <div className="small text-muted mt-2">

                                                    Disable this when residents
                                                    should temporarily be prevented
                                                    from creating new reservations.

                                                </div>

                                            </div>

                                        </div>


                                        <div className="col-12">

                                            <div className="border rounded-3 p-3">

                                                <div className="form-check form-switch">

                                                    <input
                                                        type="checkbox"
                                                        name="is_active"
                                                        className="form-check-input"
                                                        checked={
                                                            form.is_active
                                                        }
                                                        onChange={
                                                            handleChange
                                                        }
                                                    />


                                                    <label className="form-check-label fw-semibold">

                                                        Facility Active

                                                    </label>

                                                </div>


                                                <div className="small text-muted mt-2">

                                                    Inactive facilities remain in
                                                    the registry but cannot be used
                                                    for new reservations.

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>


                            {/* =================================================
                                FOOTER
                            ================================================= */}

                            <div className="rems-modal-footer">


                                <button
                                    type="button"
                                    className="rems-secondary-button"
                                    onClick={
                                        closeForm
                                    }
                                    disabled={
                                        saving
                                    }
                                >

                                    <BsXCircle />

                                    Cancel

                                </button>


                                <button
                                    type="submit"
                                    className="rems-primary-button"
                                    disabled={
                                        saving
                                    }
                                >

                                    {saving ? (

                                        <>

                                            <span
                                                className="spinner-border spinner-border-sm"
                                                aria-hidden="true"
                                            />

                                            Saving...

                                        </>

                                    ) : (

                                        <>

                                            <BsCheck2Circle />

                                            {
                                                editingId
                                                    ? "Save Changes"
                                                    : "Create Facility"
                                            }

                                        </>

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


/* =========================================================
   SAFE ICON FALLBACKS
========================================================= */

/*
 * These aliases keep the component self-contained in case
 * the project does not currently expose those exact icon
 * names from react-icons/bootstrap.
 */

function BsCalendar3Fallback(
    props
) {

    return (
        <BsClockHistory
            {...props}
        />
    );

}


function BsPeopleFallback(
    props
) {

    return (
        <BsBuilding
            {...props}
        />
    );

}

// import { useCallback, useEffect, useState } from "react";
// import { BsArrowClockwise, BsPencil, BsPlusLg } from "react-icons/bs";
// import { getFacilities, createFacility, updateFacility } from "../../api/facilities";

// const initialForm = {
//     name: "",
//     facility_type: "CLUBHOUSE",
//     description: "",
//     location: "",
//     capacity: 1,
//     parking_capacity: "",
//     minimum_booking_minutes: 60,
//     maximum_booking_minutes: 480,
//     advance_booking_days: 30,
//     requires_approval: true,
//     requires_security_deposit: false,
//     security_deposit_amount: 0,
//     rental_fee: 0,
//     resident_discount_percent: 0,
//     is_active: true,
//     is_bookable: true,
// };

// const normalize = (response) =>
//     Array.isArray(response) ? response : response?.results || [];

// export default function Facilities() {
//     const [facilities, setFacilities] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);
//     const [saving, setSaving] = useState(false);
//     const [error, setError] = useState("");
//     const [showForm, setShowForm] = useState(false);
//     const [editingId, setEditingId] = useState(null);
//     const [form, setForm] = useState(initialForm);

//     const loadFacilities = useCallback(async (refresh = false) => {
//         refresh ? setRefreshing(true) : setLoading(true);
//         setError("");
//         try {
//             const response = await getFacilities();
//             setFacilities(normalize(response));
//         } catch (err) {
//             console.error("[Admin Facilities]", err);
//             setError(
//                 err?.response?.data?.detail ||
//                 "Unable to load facilities."
//             );
//         } finally {
//             setLoading(false);
//             setRefreshing(false);
//         }
//     }, []);

//     useEffect(() => {
//         loadFacilities();
//     }, [loadFacilities]);

//     const openCreate = () => {
//         setEditingId(null);
//         setForm(initialForm);
//         setError("");
//         setShowForm(true);
//     };

//     const openEdit = (facility) => {
//         setEditingId(facility.id);
//         setForm({
//             name: facility.name || "",
//             facility_type: facility.facility_type || "CLUBHOUSE",
//             description: facility.description || "",
//             location: facility.location || "",
//             capacity: facility.capacity || 1,
//             parking_capacity: facility.parking_capacity ?? "",
//             minimum_booking_minutes: facility.minimum_booking_minutes || 60,
//             maximum_booking_minutes: facility.maximum_booking_minutes || 480,
//             advance_booking_days: facility.advance_booking_days || 30,
//             requires_approval: facility.requires_approval !== false,
//             requires_security_deposit: facility.requires_security_deposit === true,
//             security_deposit_amount: facility.security_deposit_amount || 0,
//             rental_fee: facility.rental_fee || 0,
//             resident_discount_percent: facility.resident_discount_percent || 0,
//             is_active: facility.is_active !== false,
//             is_bookable: facility.is_bookable !== false,
//         });
//         setError("");
//         setShowForm(true);
//     };

//     const handleChange = (event) => {
//         const { name, value, type, checked } = event.target;
//         setForm((previous) => ({
//             ...previous,
//             [name]: type === "checkbox" ? checked : value,
//         }));
//     };

//     const handleSubmit = async (event) => {
//         event.preventDefault();
//         setSaving(true);
//         setError("");

//         const payload = {
//             ...form,
//             capacity: Number(form.capacity),
//             parking_capacity:
//                 form.parking_capacity === "" ? null : Number(form.parking_capacity),
//             minimum_booking_minutes: Number(form.minimum_booking_minutes),
//             maximum_booking_minutes: Number(form.maximum_booking_minutes),
//             advance_booking_days: Number(form.advance_booking_days),
//             security_deposit_amount: Number(form.security_deposit_amount),
//             rental_fee: Number(form.rental_fee),
//             resident_discount_percent: Number(form.resident_discount_percent),
//         };

//         try {
//             if (editingId) {
//                 await updateFacility(editingId, payload);
//             } else {
//                 await createFacility(payload);
//             }

//             setShowForm(false);
//             setEditingId(null);
//             setForm(initialForm);
//             await loadFacilities(true);
//         } catch (err) {
//             console.error("[Admin Facilities] Save", err);
//             const data = err?.response?.data;
//             setError(
//                 typeof data === "string"
//                     ? data
//                     : data?.detail || "Unable to save facility."
//             );
//         } finally {
//             setSaving(false);
//         }
//     };

//     return (
//         <div className="rems-page-content">
//             <div className="rems-page-header">
//                 <div>
//                     <div className="rems-page-eyebrow">ADMINISTRATION</div>
//                     <h1 className="rems-page-title">Facilities & Amenities</h1>
//                     <p className="rems-page-description">
//                         Configure amenities, capacities, booking rules, fees,
//                         discounts, and security deposits.
//                     </p>
//                 </div>

//                 <div className="rems-page-header-actions">
//                     <button
//                         type="button"
//                         className="rems-secondary-button"
//                         onClick={() => loadFacilities(true)}
//                         disabled={refreshing}
//                     >
//                         <BsArrowClockwise />
//                         {refreshing ? "Refreshing..." : "Refresh"}
//                     </button>

//                     <button
//                         type="button"
//                         className="rems-primary-button"
//                         onClick={openCreate}
//                     >
//                         <BsPlusLg />
//                         Add Facility
//                     </button>
//                 </div>
//             </div>

//             {error && (
//                 <div className="alert alert-danger rems-alert mb-4">
//                     {error}
//                 </div>
//             )}

//             <div className="rems-glass-card">
//                 {loading ? (
//                     <div className="rems-loading-state">
//                         <div className="spinner-border" />
//                         <div className="mt-3">Loading facilities...</div>
//                     </div>
//                 ) : (
//                     <div className="rems-table-wrapper">
//                         <table className="table rems-table align-middle mb-0">
//                             <thead>
//                                 <tr>
//                                     <th>Facility</th>
//                                     <th>Capacity</th>
//                                     <th>Rental</th>
//                                     <th>Deposit</th>
//                                     <th>Booking</th>
//                                     <th className="text-end">Actions</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {facilities.map((facility) => (
//                                     <tr key={facility.id}>
//                                         <td data-label="Facility">
//                                             <div className="rems-table-primary">
//                                                 {facility.name}
//                                             </div>
//                                             <div className="rems-table-secondary">
//                                                 {facility.facility_type_display ||
//                                                     facility.facility_type}
//                                             </div>
//                                         </td>

//                                         <td data-label="Capacity">
//                                             {facility.capacity}
//                                         </td>

//                                         <td data-label="Rental">
//                                             ₱
//                                             {Number(
//                                                 facility.rental_fee || 0
//                                             ).toLocaleString(undefined, {
//                                                 minimumFractionDigits: 2,
//                                             })}
//                                         </td>

//                                         <td data-label="Deposit">
//                                             ₱
//                                             {Number(
//                                                 facility.security_deposit_amount || 0
//                                             ).toLocaleString(undefined, {
//                                                 minimumFractionDigits: 2,
//                                             })}
//                                         </td>

//                                         <td data-label="Booking">
//                                             <span
//                                                 className={`rems-status-badge ${
//                                                     facility.is_bookable
//                                                         ? "rems-status-success"
//                                                         : "rems-status-secondary"
//                                                 }`}
//                                             >
//                                                 <span className="rems-status-dot" />
//                                                 {facility.is_bookable
//                                                     ? "Bookable"
//                                                     : "Unavailable"}
//                                             </span>
//                                         </td>

//                                         <td data-label="Actions">
//                                             <div className="d-flex justify-content-end">
//                                                 <button
//                                                     type="button"
//                                                     className="rems-icon-button"
//                                                     title="Edit facility"
//                                                     onClick={() => openEdit(facility)}
//                                                 >
//                                                     <BsPencil />
//                                                 </button>
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>
//                 )}
//             </div>

//             {showForm && (
//                 <div
//                     className="rems-modal-backdrop"
//                     style={{ zIndex: 3000 }}
//                     onMouseDown={(event) => {
//                         if (
//                             event.target === event.currentTarget &&
//                             !saving
//                         ) {
//                             setShowForm(false);
//                         }
//                     }}
//                 >
//                     <div
//                         className="rems-modal rems-management-modal"
//                         style={{
//                             position: "relative",
//                             zIndex: 3001,
//                             width: "min(100%, 960px)",
//                         }}
//                         onMouseDown={(event) => event.stopPropagation()}
//                     >
//                         <div className="rems-modal-header">
//                             <div>
//                                 <div className="rems-page-eyebrow">
//                                     FACILITY CONFIGURATION
//                                 </div>
//                                 <div className="rems-modal-title">
//                                     {editingId ? "Edit Facility" : "Add Facility"}
//                                 </div>
//                             </div>

//                             <button
//                                 type="button"
//                                 className="rems-modal-close"
//                                 onClick={() => setShowForm(false)}
//                                 disabled={saving}
//                             >
//                                 <i className="bi bi-x-lg" />
//                             </button>
//                         </div>

//                         <form onSubmit={handleSubmit}>
//                             <div className="rems-modal-body">
//                                 <div className="row g-3">
//                                     <div className="col-12 col-md-6">
//                                         <label className="rems-form-label">
//                                             Facility Name
//                                         </label>
//                                         <input
//                                             type="text"
//                                             name="name"
//                                             className="form-control rems-form-control"
//                                             value={form.name}
//                                             onChange={handleChange}
//                                             required
//                                         />
//                                     </div>

//                                     <div className="col-12 col-md-6">
//                                         <label className="rems-form-label">
//                                             Facility Type
//                                         </label>
//                                         <select
//                                             name="facility_type"
//                                             className="form-select rems-form-control"
//                                             value={form.facility_type}
//                                             onChange={handleChange}
//                                         >
//                                             <option value="CLUBHOUSE">Clubhouse</option>
//                                             <option value="BASKETBALL_COURT">
//                                                 Basketball Court
//                                             </option>
//                                             <option value="SWIMMING_POOL">
//                                                 Swimming Pool
//                                             </option>
//                                             <option value="CHILDREN_PARK">
//                                                 Children's Park
//                                             </option>
//                                             <option value="CAR_PARKING">
//                                                 Car Parking
//                                             </option>
//                                         </select>
//                                     </div>

//                                     <div className="col-12">
//                                         <label className="rems-form-label">
//                                             Description
//                                         </label>
//                                         <textarea
//                                             name="description"
//                                             rows="3"
//                                             className="form-control rems-form-control"
//                                             value={form.description}
//                                             onChange={handleChange}
//                                         />
//                                     </div>

//                                     <div className="col-12">
//                                         <label className="rems-form-label">
//                                             Location
//                                         </label>
//                                         <input
//                                             type="text"
//                                             name="location"
//                                             className="form-control rems-form-control"
//                                             value={form.location}
//                                             onChange={handleChange}
//                                         />
//                                     </div>

//                                     <div className="col-12 col-md-4">
//                                         <label className="rems-form-label">
//                                             Capacity
//                                         </label>
//                                         <input
//                                             type="number"
//                                             min="1"
//                                             name="capacity"
//                                             className="form-control rems-form-control"
//                                             value={form.capacity}
//                                             onChange={handleChange}
//                                             required
//                                         />
//                                     </div>

//                                     <div className="col-12 col-md-4">
//                                         <label className="rems-form-label">
//                                             Parking Capacity
//                                         </label>
//                                         <input
//                                             type="number"
//                                             min="0"
//                                             name="parking_capacity"
//                                             className="form-control rems-form-control"
//                                             value={form.parking_capacity}
//                                             onChange={handleChange}
//                                         />
//                                     </div>

//                                     <div className="col-12 col-md-4">
//                                         <label className="rems-form-label">
//                                             Advance Booking Days
//                                         </label>
//                                         <input
//                                             type="number"
//                                             min="0"
//                                             name="advance_booking_days"
//                                             className="form-control rems-form-control"
//                                             value={form.advance_booking_days}
//                                             onChange={handleChange}
//                                         />
//                                     </div>

//                                     <div className="col-12 col-md-4">
//                                         <label className="rems-form-label">
//                                             Minimum Minutes
//                                         </label>
//                                         <input
//                                             type="number"
//                                             min="1"
//                                             name="minimum_booking_minutes"
//                                             className="form-control rems-form-control"
//                                             value={form.minimum_booking_minutes}
//                                             onChange={handleChange}
//                                         />
//                                     </div>

//                                     <div className="col-12 col-md-4">
//                                         <label className="rems-form-label">
//                                             Maximum Minutes
//                                         </label>
//                                         <input
//                                             type="number"
//                                             min="1"
//                                             name="maximum_booking_minutes"
//                                             className="form-control rems-form-control"
//                                             value={form.maximum_booking_minutes}
//                                             onChange={handleChange}
//                                         />
//                                     </div>

//                                     <div className="col-12 col-md-4">
//                                         <label className="rems-form-label">
//                                             Rental Fee
//                                         </label>
//                                         <input
//                                             type="number"
//                                             min="0"
//                                             step="0.01"
//                                             name="rental_fee"
//                                             className="form-control rems-form-control"
//                                             value={form.rental_fee}
//                                             onChange={handleChange}
//                                         />
//                                     </div>

//                                     <div className="col-12 col-md-4">
//                                         <label className="rems-form-label">
//                                             Resident Discount %
//                                         </label>
//                                         <input
//                                             type="number"
//                                             min="0"
//                                             max="100"
//                                             step="0.01"
//                                             name="resident_discount_percent"
//                                             className="form-control rems-form-control"
//                                             value={form.resident_discount_percent}
//                                             onChange={handleChange}
//                                         />
//                                     </div>

//                                     <div className="col-12 col-md-4">
//                                         <label className="rems-form-label">
//                                             Security Deposit
//                                         </label>
//                                         <input
//                                             type="number"
//                                             min="0"
//                                             step="0.01"
//                                             name="security_deposit_amount"
//                                             className="form-control rems-form-control"
//                                             value={form.security_deposit_amount}
//                                             onChange={handleChange}
//                                         />
//                                     </div>

//                                     <div className="col-12">
//                                         <div className="row g-3">
//                                             <div className="col-12 col-md-4">
//                                                 <div className="form-check form-switch">
//                                                     <input
//                                                         type="checkbox"
//                                                         name="requires_approval"
//                                                         className="form-check-input"
//                                                         checked={form.requires_approval}
//                                                         onChange={handleChange}
//                                                     />
//                                                     <label className="form-check-label">
//                                                         Requires approval
//                                                     </label>
//                                                 </div>
//                                             </div>

//                                             <div className="col-12 col-md-4">
//                                                 <div className="form-check form-switch">
//                                                     <input
//                                                         type="checkbox"
//                                                         name="requires_security_deposit"
//                                                         className="form-check-input"
//                                                         checked={
//                                                             form.requires_security_deposit
//                                                         }
//                                                         onChange={handleChange}
//                                                     />
//                                                     <label className="form-check-label">
//                                                         Requires security deposit
//                                                     </label>
//                                                 </div>
//                                             </div>

//                                             <div className="col-12 col-md-4">
//                                                 <div className="form-check form-switch">
//                                                     <input
//                                                         type="checkbox"
//                                                         name="is_bookable"
//                                                         className="form-check-input"
//                                                         checked={form.is_bookable}
//                                                         onChange={handleChange}
//                                                     />
//                                                     <label className="form-check-label">
//                                                         Available for booking
//                                                     </label>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="rems-modal-footer">
//                                 <button
//                                     type="button"
//                                     className="rems-secondary-button"
//                                     onClick={() => setShowForm(false)}
//                                     disabled={saving}
//                                 >
//                                     Cancel
//                                 </button>

//                                 <button
//                                     type="submit"
//                                     className="rems-primary-button"
//                                     disabled={saving}
//                                 >
//                                     {saving
//                                         ? "Saving..."
//                                         : editingId
//                                             ? "Save Changes"
//                                             : "Create Facility"}
//                                 </button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }
