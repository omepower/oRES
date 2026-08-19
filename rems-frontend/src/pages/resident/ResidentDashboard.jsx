
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    BsArrowClockwise,
    BsBuilding,
    BsCarFront,
    BsChevronRight,
    BsClockHistory,
    BsPeople,
    BsPersonCheck,
    BsPlusLg,
    BsShieldCheck,
    BsHouseDoor,
    BsExclamationCircle,
} from "react-icons/bs";

import {
    getMyVehicles,
    getMotoristStickersMine,
} from "../../api/vehicles";

import {
    getMyProperties,
} from "../../api/properties";

import {
    getMyVisitorInvitations,
} from "../../api/visitors";


export default function ResidentDashboard() {

    const navigate =
        useNavigate();


    // ========================================================
    // STATE
    // ========================================================

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
        user,
        setUser,
    ] = useState(null);

    const [
        properties,
        setProperties,
    ] = useState([]);

    const [
        vehicles,
        setVehicles,
    ] = useState([]);

    const [
        stickers,
        setStickers,
    ] = useState([]);

    const [
        visitors,
        setVisitors,
    ] = useState([]);


    // ========================================================
    // USER
    // ========================================================

    useEffect(() => {

        try {

            const storedUser =
                localStorage.getItem(
                    "user"
                );

            if (storedUser) {

                setUser(
                    JSON.parse(
                        storedUser
                    )
                );

            }

        } catch (err) {

            console.error(
                "[Resident Dashboard] Unable to read user:",
                err
            );

        }

    }, []);


    const role =
        String(
            user?.role ||
            localStorage.getItem("role") ||
            ""
        ).toUpperCase();


    const isHomeowner =
        role === "HOMEOWNER";


    const isTenant =
        role === "TENANT";


    const roleLabel =
        isHomeowner
            ? "Homeowner"
            : isTenant
                ? "Tenant"
                : "Resident";


    const displayName =
        user?.full_name ||
        user?.name ||
        [
            user?.first_name,
            user?.last_name,
        ]
            .filter(Boolean)
            .join(" ") ||
        user?.username ||
        "Resident";


    const firstName =
        user?.first_name ||
        displayName.split(" ")[0] ||
        "Resident";


    const portalPrefix =
        isHomeowner
            ? "/homeowner"
            : "/tenant";


    // ========================================================
    // NORMALIZE
    // ========================================================

    const normalize = (
        response,
        keys = []
    ) => {

        if (Array.isArray(response)) {
            return response;
        }

        if (
            Array.isArray(
                response?.results
            )
        ) {

            return response.results;

        }

        for (
            const key of keys
        ) {

            if (
                Array.isArray(
                    response?.[key]
                )
            ) {

                return response[key];

            }

        }

        return [];

    };


    // ========================================================
    // LOAD DASHBOARD
    // ========================================================

    const loadDashboard =
        useCallback(
            async (
                isRefresh = false
            ) => {

                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                try {

                    const [
                        vehiclesResponse,
                        stickersResponse,
                        propertiesResponse,
                        visitorsResponse,
                    ] = await Promise.allSettled([

                        getMyVehicles(),

                        getMotoristStickersMine(),

                        getMyProperties(),

                        getMyVisitorInvitations(),

                    ]);


                    let vehicleData = [];
                    let stickerData = [];
                    let propertyData = [];
                    let visitorData = [];


                    if (
                        vehiclesResponse.status ===
                        "fulfilled"
                    ) {

                        vehicleData =
                            normalize(
                                vehiclesResponse.value,
                                ["vehicles"]
                            );

                    }


                    if (
                        stickersResponse.status ===
                        "fulfilled"
                    ) {

                        stickerData =
                            normalize(
                                stickersResponse.value,
                                ["stickers"]
                            );

                    }


                    if (
                        propertiesResponse.status ===
                        "fulfilled"
                    ) {

                        propertyData =
                            normalize(
                                propertiesResponse.value,
                                ["properties"]
                            );

                    }


                    if (
                        visitorsResponse.status ===
                        "fulfilled"
                    ) {

                        visitorData =
                            normalize(
                                visitorsResponse.value,
                                [
                                    "invitations",
                                    "visitors",
                                ]
                            );

                    }


                    setVehicles(
                        vehicleData
                    );

                    setStickers(
                        stickerData
                    );

                    setProperties(
                        propertyData
                    );

                    setVisitors(
                        visitorData
                    );

                } catch (err) {

                    console.error(
                        "[Resident Dashboard] Failed:",
                        err
                    );

                    setError(
                        err?.response?.data?.detail ||
                        "Unable to load your resident dashboard."
                    );

                } finally {

                    setLoading(false);
                    setRefreshing(false);

                }

            },
            []
        );


    useEffect(() => {

        loadDashboard();

    }, [
        loadDashboard,
    ]);


    // ========================================================
    // STATISTICS
    // ========================================================

    const statistics =
        useMemo(
            () => {

                const activeVehicles =
                    vehicles.filter(
                        (vehicle) =>
                            vehicle?.is_active !== false
                    ).length;


                const activeStickers =
                    stickers.filter(
                        (sticker) =>
                            String(
                                sticker?.status ||
                                ""
                            ).toUpperCase() ===
                            "ACTIVE"
                    ).length;


                const pendingStickers =
                    stickers.filter(
                        (sticker) =>
                            String(
                                sticker?.status ||
                                ""
                            ).toUpperCase() ===
                            "PENDING"
                    ).length;


                const activeVisitors =
                    visitors.filter(
                        (visitor) => {

                            const status =
                                String(
                                    visitor?.status ||
                                    ""
                                ).toUpperCase();

                            return [
                                "APPROVED",
                                "EXPECTED",
                                "INSIDE",
                                "ACTIVE",
                            ].includes(
                                status
                            );

                        }
                    ).length;


                return {

                    properties:
                        properties.length,

                    vehicles:
                        vehicles.length,

                    activeVehicles,

                    stickers:
                        stickers.length,

                    activeStickers,

                    pendingStickers,

                    visitors:
                        visitors.length,

                    activeVisitors,

                };

            },
            [
                properties,
                vehicles,
                stickers,
                visitors,
            ]
        );


    // ========================================================
    // PROPERTY
    // ========================================================

    const primaryProperty =
        properties[0] || null;


    const propertyName =
        primaryProperty?.address ||
        primaryProperty?.property_name ||
        primaryProperty?.name ||
        "My Property";


    // ========================================================
    // RECENT VISITORS
    // ========================================================

    const recentVisitors =
        useMemo(
            () => {

                return [
                    ...visitors,
                ]
                    .sort(
                        (
                            a,
                            b
                        ) => {

                            const dateA =
                                new Date(
                                    a?.created_at ||
                                    a?.visit_date ||
                                    a?.date ||
                                    0
                                ).getTime();

                            const dateB =
                                new Date(
                                    b?.created_at ||
                                    b?.visit_date ||
                                    b?.date ||
                                    0
                                ).getTime();

                            return (
                                dateB -
                                dateA
                            );

                        }
                    )
                    .slice(
                        0,
                        5
                    );

            },
            [
                visitors,
            ]
        );


    // ========================================================
    // QUICK ACTIONS
    // ========================================================

    const quickActions =
        useMemo(
            () => [

                {
                    label:
                        "Register Vehicle",

                    description:
                        "Add a vehicle",

                    icon:
                        <BsCarFront />,

                    path:
                        `${portalPrefix}/vehicles`,
                },

                {
                    label:
                        "Invite Visitor",

                    description:
                        "Authorize a visitor",

                    icon:
                        <BsPeople />,

                    path:
                        `${portalPrefix}/visitors`,
                },

                {
                    label:
                        "Request Sticker",

                    description:
                        "Vehicle access",

                    icon:
                        <BsShieldCheck />,

                    path:
                        `${portalPrefix}/stickers`,
                },

            ],
            [
                portalPrefix,
            ]
        );


    // ========================================================
    // STATUS
    // ========================================================

    const getVisitorStatus =
        (
            visitor
        ) => {

            const status =
                String(
                    visitor?.status ||
                    ""
                ).toUpperCase();


            if (
                [
                    "APPROVED",
                    "EXPECTED",
                    "INSIDE",
                    "ACTIVE",
                ].includes(
                    status
                )
            ) {

                return (
                    <span className="rems-status-badge rems-status-success">

                        <span className="rems-status-dot" />

                        {status}

                    </span>
                );

            }


            if (
                status === "PENDING"
            ) {

                return (
                    <span className="rems-status-badge rems-status-warning">

                        <span className="rems-status-dot" />

                        Pending

                    </span>
                );

            }


            if (
                [
                    "REJECTED",
                    "CANCELLED",
                ].includes(
                    status
                )
            ) {

                return (
                    <span className="rems-status-badge rems-status-danger">

                        <span className="rems-status-dot" />

                        {status}

                    </span>
                );

            }


            return (
                <span className="rems-status-badge rems-status-secondary">

                    <span className="rems-status-dot" />

                    {status || "Unknown"}

                </span>
            );

        };


    const getStickerStatus =
        (
            status
        ) => {

            const normalized =
                String(
                    status ||
                    ""
                ).toUpperCase();


            if (
                normalized ===
                "ACTIVE"
            ) {

                return (
                    <span className="rems-status-badge rems-status-success">

                        <span className="rems-status-dot" />

                        Active

                    </span>
                );

            }


            if (
                normalized ===
                "PENDING"
            ) {

                return (
                    <span className="rems-status-badge rems-status-warning">

                        <span className="rems-status-dot" />

                        Pending

                    </span>
                );

            }


            if (
                normalized ===
                "REVOKED"
            ) {

                return (
                    <span className="rems-status-badge rems-status-danger">

                        <span className="rems-status-dot" />

                        Revoked

                    </span>
                );

            }


            return (
                <span className="rems-status-badge rems-status-secondary">

                    <span className="rems-status-dot" />

                    {
                        normalized === "EXPIRED"
                            ? "Expired"
                            : normalized || "Unknown"
                    }

                </span>
            );

        };


    // ========================================================
    // LOADING
    // ========================================================

    if (
        loading
    ) {

        return (

            <div className="rems-page-content">

                <div className="rems-page-header">

                    <div>

                        <div className="rems-page-eyebrow">
                            {roleLabel.toUpperCase()}
                        </div>

                        <h1 className="rems-page-title">
                            Resident Dashboard
                        </h1>

                        <p className="rems-page-description">
                            Loading your community information...
                        </p>

                    </div>

                </div>


                <div className="rems-loading-state">

                    <div
                        className="spinner-border"
                        role="status"
                    />

                    <div className="mt-2">
                        Loading resident dashboard...
                    </div>

                </div>

            </div>

        );

    }


    return (

        <div className="rems-page-content">


            {/* =================================================
                COMPACT LOCAL DASHBOARD CSS
            ================================================= */}

            <style>
                {`

                    .rems-resident-dashboard-grid {
                        display: grid;
                        gap: 14px;
                    }

                    .rems-resident-compact-card {
                        padding: 14px !important;
                    }

                    .rems-resident-stat-card {
                        min-height: 92px !important;
                        padding: 14px !important;
                        gap: 11px !important;
                    }

                    .rems-resident-stat-card .rems-stat-icon {
                        width: 38px !important;
                        height: 38px !important;
                        min-width: 38px !important;
                        border-radius: 10px !important;
                        font-size: 15px !important;
                    }

                    .rems-resident-stat-card .rems-stat-value {
                        font-size: 21px !important;
                    }

                    .rems-resident-property-item {
                        min-height: 64px !important;
                        padding: 10px 11px !important;
                        gap: 10px !important;
                    }

                    .rems-resident-property-item .rems-property-detail-icon {
                        width: 36px !important;
                        height: 36px !important;
                        flex: 0 0 36px !important;
                        border-radius: 10px !important;
                    }

                    .rems-resident-action {
                        min-height: 68px !important;
                        padding: 11px !important;
                        gap: 10px !important;
                    }

                    .rems-resident-action .rems-action-icon {
                        width: 36px !important;
                        height: 36px !important;
                        border-radius: 10px !important;
                    }

                    .rems-resident-access-item {
                        min-height: 0 !important;
                        padding: 10px 11px !important;
                    }

                    .rems-resident-table td,
                    .rems-resident-table th {
                        padding: 10px 12px !important;
                    }

                    @media (max-width: 767.98px) {

                        .rems-page-content {
                            padding: 14px 12px 22px !important;
                        }

                        .rems-page-header {
                            gap: 14px !important;
                            margin-bottom: 18px !important;
                        }

                        .rems-page-title {
                            font-size: 21px !important;
                        }

                        .rems-page-description {
                            margin-top: 5px !important;
                            font-size: 11px !important;
                            line-height: 1.45 !important;
                        }

                        .rems-page-header-actions {
                            gap: 7px !important;
                        }

                        .rems-page-header-actions > * {
                            min-height: 38px !important;
                        }

                        .rems-card-header {
                            padding: 14px !important;
                            gap: 10px !important;
                        }

                        .rems-card-title {
                            font-size: 13px !important;
                        }

                        .rems-card-subtitle {
                            font-size: 10px !important;
                        }

                        .rems-resident-compact-card {
                            padding: 11px !important;
                        }

                        .rems-resident-stat-card {
                            min-height: 84px !important;
                            padding: 11px !important;
                        }

                        .rems-resident-stat-card .rems-stat-value {
                            font-size: 19px !important;
                        }

                        .rems-resident-property-item {
                            min-height: 58px !important;
                            padding: 9px !important;
                        }

                        .rems-resident-action {
                            min-height: 60px !important;
                            padding: 9px !important;
                        }

                        .rems-resident-table {
                            min-width: 620px;
                        }

                        .rems-resident-table td,
                        .rems-resident-table th {
                            padding: 9px 10px !important;
                            font-size: 11px !important;
                        }

                        .rems-status-badge {
                            min-height: 23px !important;
                            padding: 3px 7px !important;
                            font-size: 9px !important;
                        }

                    }

                    @media (max-width: 575.98px) {

                        .rems-page-content {
                            padding: 12px 10px 18px !important;
                        }

                        .rems-page-title {
                            font-size: 19px !important;
                        }

                        .rems-page-description {
                            font-size: 10px !important;
                        }

                        .rems-resident-stat-card {
                            min-height: 78px !important;
                            padding: 10px !important;
                        }

                        .rems-resident-stat-card .rems-stat-icon {
                            width: 34px !important;
                            height: 34px !important;
                            min-width: 34px !important;
                            font-size: 14px !important;
                        }

                        .rems-resident-stat-card .rems-stat-value {
                            font-size: 18px !important;
                        }

                        .rems-resident-stat-card .rems-stat-label {
                            font-size: 10px !important;
                        }

                        .rems-resident-property-item {
                            padding: 8px !important;
                        }

                        .rems-resident-action {
                            padding: 8px !important;
                        }

                        .rems-property-info-card {
                            min-height: 60px !important;
                            padding: 9px !important;
                            gap: 9px !important;
                        }

                        .rems-resident-access-item {
                            padding: 9px !important;
                        }

                    }

                `}
            </style>


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">
                        {roleLabel.toUpperCase()}
                    </div>

                    <h1 className="rems-page-title">
                        Hello! {firstName}
                    </h1>

                    <p className="rems-page-description">
                        Manage your residence, vehicles,
                        visitors, and access.
                    </p>

                </div>


                <div className="rems-page-header-actions">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() =>
                            loadDashboard(true)
                        }
                        disabled={
                            refreshing
                        }
                    >

                        <BsArrowClockwise />

                        {
                            refreshing
                                ? "Refreshing..."
                                : "Refresh"
                        }

                    </button>

                </div>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="alert alert-danger rems-alert mb-3">

                    <BsExclamationCircle className="me-2" />

                    {error}

                </div>

            )}


            {/* =================================================
                PROPERTY CONTEXT
            ================================================= */}

            <div className="rems-glass-card rems-resident-compact-card mb-3">

                <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">

                    <div className="d-flex align-items-center gap-2 min-width-0">

                        <div className="rems-stat-icon">

                            {
                                isHomeowner
                                    ? <BsBuilding />
                                    : <BsHouseDoor />
                            }

                        </div>


                        <div className="min-width-0">

                            <div className="rems-page-eyebrow mb-1">
                                CURRENT RESIDENCE
                            </div>

                            <div className="rems-card-title text-truncate">
                                {propertyName}
                            </div>

                            <div className="rems-card-subtitle text-truncate">

                                {
                                    isHomeowner
                                        ? "Properties under your ownership"
                                        : "Your current authorized residence"
                                }

                            </div>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() =>
                            navigate(
                                isHomeowner
                                    ? "/homeowner/properties"
                                    : "/tenant/property"
                            )
                        }
                    >

                        View

                        <BsChevronRight />

                    </button>

                </div>

            </div>


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="row g-2 mb-3">


                <div className="col-6 col-xl-3">

                    <div className="rems-stat-card rems-resident-stat-card">

                        <div className="rems-stat-icon">
                            <BsBuilding />
                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                {
                                    isHomeowner
                                        ? "Properties"
                                        : "Property"
                                }
                            </div>

                            <div className="rems-stat-value">
                                {statistics.properties}
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-6 col-xl-3">

                    <div className="rems-stat-card rems-resident-stat-card">

                        <div className="rems-stat-icon">
                            <BsCarFront />
                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Vehicles
                            </div>

                            <div className="rems-stat-value">
                                {statistics.vehicles}
                            </div>

                            <div className="small text-muted">
                                {statistics.activeVehicles} active
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-6 col-xl-3">

                    <div className="rems-stat-card rems-resident-stat-card">

                        <div className="rems-stat-icon">
                            <BsShieldCheck />
                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Stickers
                            </div>

                            <div className="rems-stat-value">
                                {statistics.stickers}
                            </div>

                            <div className="small text-muted">
                                {statistics.activeStickers} active
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-6 col-xl-3">

                    <div className="rems-stat-card rems-resident-stat-card">

                        <div className="rems-stat-icon">
                            <BsPeople />
                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Visitors
                            </div>

                            <div className="rems-stat-value">
                                {statistics.visitors}
                            </div>

                            <div className="small text-muted">
                                {statistics.activeVisitors} active
                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                ACTIONS + STICKERS
            ================================================= */}

            <div className="row g-3 mb-3">


                <div className="col-12 col-xl-7">

                    <div className="rems-glass-card h-100">

                        <div className="rems-card-header">

                            <div>

                                <div className="rems-page-eyebrow">
                                    QUICK ACTIONS
                                </div>

                                <div className="rems-card-title">
                                    Manage Your Residence
                                </div>

                            </div>

                        </div>


                        <div className="p-2 p-md-3">

                            <div className="row g-2">

                                {quickActions.map(
                                    (
                                        action
                                    ) => (

                                        <div
                                            className="col-12 col-md-4"
                                            key={
                                                action.path
                                            }
                                        >

                                            <button
                                                type="button"
                                                className="w-100 text-start border-0 bg-transparent p-0"
                                                onClick={() =>
                                                    navigate(
                                                        action.path
                                                    )
                                                }
                                            >

                                                <div className="rems-action-card rems-resident-action">

                                                    <div className="rems-action-icon">

                                                        {
                                                            action.icon
                                                        }

                                                    </div>


                                                    <div className="min-width-0">

                                                        <div className="rems-table-primary text-truncate">
                                                            {
                                                                action.label
                                                            }
                                                        </div>

                                                        <div className="rems-table-secondary text-truncate">
                                                            {
                                                                action.description
                                                            }
                                                        </div>

                                                    </div>

                                                </div>

                                            </button>

                                        </div>

                                    )
                                )}

                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-12 col-xl-5">

                    <div className="rems-glass-card h-100">

                        <div className="rems-card-header">

                            <div>

                                <div className="rems-page-eyebrow">
                                    VEHICLE ACCESS
                                </div>

                                <div className="rems-card-title">
                                    Motorist Stickers
                                </div>

                            </div>


                            <button
                                type="button"
                                className="rems-secondary-button"
                                onClick={() =>
                                    navigate(
                                        `${portalPrefix}/stickers`
                                    )
                                }
                            >

                                View all

                                <BsChevronRight className="ms-1" />

                            </button>

                        </div>


                        <div className="p-2 p-md-3">

                            {stickers.length === 0 ? (

                                <div className="rems-empty-state py-3">

                                    <div className="rems-empty-icon">
                                        <BsShieldCheck />
                                    </div>

                                    <div className="rems-empty-title">
                                        No stickers
                                    </div>

                                    <div className="rems-empty-text">
                                        Request one for a registered vehicle.
                                    </div>

                                </div>

                            ) : (

                                <div className="d-flex flex-column gap-1">

                                    {stickers
                                        .slice(0, 4)
                                        .map(
                                            (
                                                sticker
                                            ) => (

                                                <div
                                                    key={
                                                        sticker.id
                                                    }
                                                    className="d-flex align-items-center justify-content-between gap-2 p-2 rounded-3"
                                                    style={{
                                                        background:
                                                            "rgba(15,23,42,.025)",
                                                    }}
                                                >

                                                    <div className="d-flex align-items-center gap-2 min-width-0">

                                                        <div className="rems-action-icon">

                                                            <BsShieldCheck />

                                                        </div>


                                                        <div className="min-width-0">

                                                            <div className="rems-table-primary text-truncate">
                                                                {
                                                                    sticker.sticker_number ||
                                                                    sticker.number ||
                                                                    "Motorist Sticker"
                                                                }
                                                            </div>

                                                            <div className="rems-table-secondary text-truncate">
                                                                {
                                                                    sticker.vehicle_plate_number ||
                                                                    sticker.vehicle?.plate_number ||
                                                                    sticker.plate_number ||
                                                                    "Vehicle"
                                                                }
                                                            </div>

                                                        </div>

                                                    </div>


                                                    {
                                                        getStickerStatus(
                                                            sticker.status
                                                        )
                                                    }

                                                </div>

                                            )
                                        )}

                                </div>

                            )}

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                RECENT VISITORS
            ================================================= */}

            <div className="rems-glass-card mb-3">

                <div className="rems-card-header">

                    <div>

                        <div className="rems-page-eyebrow">
                            SECURITY
                        </div>

                        <div className="rems-card-title">
                            Recent Visitors
                        </div>

                        <div className="rems-card-subtitle">
                            Recent visitor activity.
                        </div>

                    </div>


                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() =>
                            navigate(
                                `${portalPrefix}/visitors`
                            )
                        }
                    >

                        Manage

                        <BsChevronRight />

                    </button>

                </div>


                {recentVisitors.length === 0 ? (

                    <div className="rems-empty-state py-4">

                        <div className="rems-empty-icon">
                            <BsPeople />
                        </div>

                        <div className="rems-empty-title">
                            No recent visitors
                        </div>

                        <div className="rems-empty-text">
                            Visitor authorizations will appear here.
                        </div>

                        <button
                            type="button"
                            className="rems-primary-button mt-2"
                            onClick={() =>
                                navigate(
                                    `${portalPrefix}/visitors`
                                )
                            }
                        >

                            <BsPlusLg />

                            Invite Visitor

                        </button>

                    </div>

                ) : (

                    <div className="rems-table-wrapper">

                        <table className="table rems-table rems-resident-table align-middle mb-0">

                            <thead>

                                <tr>

                                    <th>
                                        Visitor
                                    </th>

                                    <th>
                                        Date
                                    </th>


                                    <th>
                                        Status
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {recentVisitors.map(
                                    (
                                        visitor
                                    ) => (

                                        <tr
                                            key={
                                                visitor.id
                                            }
                                        >

                                            <td data-label="visitor">

                                                <div className="rems-table-primary">
                                                    {
                                                        visitor.name ||
                                                        visitor.visitor_name ||
                                                        [
                                                            visitor.first_name,
                                                            visitor.last_name,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(" ") ||
                                                        "Visitor"
                                                    }
                                                </div>

                                            </td>


                                            <td data-label="visit date">

                                                {
                                                    visitor.visit_date ||
                                                    visitor.date ||
                                                    visitor.scheduled_date ||
                                                    "—"
                                                }

                                            </td>




                                            <td data-label="status">

                                                {
                                                    getVisitorStatus(
                                                        visitor
                                                    )
                                                }

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
                PROPERTY + ACCESS
            ================================================= */}

            <div className="row g-3">


                <div className="col-12 col-lg-7">

                    <div className="rems-glass-card h-100">

                        <div className="rems-card-header">

                            <div>

                                <div className="rems-page-eyebrow">
                                    RESIDENCE
                                </div>

                                <div className="rems-card-title">
                                    Property Information
                                </div>

                            </div>

                        </div>


                        <div className="p-2 p-md-3">

                            {primaryProperty ? (

                                <div className="row g-2">


                                    <div className="col-12">

                                        <div className="rems-property-info-card rems-resident-property-item">

                                            <div className="rems-property-detail-icon">

                                                <BsBuilding />

                                            </div>


                                            <div className="min-width-0">

                                                <div className="rems-table-secondary">
                                                    Property
                                                </div>

                                                <div className="rems-table-primary text-truncate">
                                                    {propertyName}
                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-4">

                                        <div className="rems-property-info-card rems-resident-property-item">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Block
                                                </div>

                                                <div className="rems-table-primary">
                                                    {
                                                        primaryProperty.block ||
                                                        "—"
                                                    }
                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-4">

                                        <div className="rems-property-info-card rems-resident-property-item">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Lot
                                                </div>

                                                <div className="rems-table-primary">
                                                    {
                                                        primaryProperty.lot ||
                                                        "—"
                                                    }
                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-4">

                                        <div className="rems-property-info-card rems-resident-property-item">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Status
                                                </div>

                                                <div className="rems-table-primary text-truncate">

                                                    {
                                                        primaryProperty.status_display ||
                                                        String(
                                                            primaryProperty.status ||
                                                            ""
                                                        )
                                                            .replace(
                                                                /_/g,
                                                                " "
                                                            ) ||
                                                        "—"
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12 d-flex justify-content-end">

                                        <button
                                            type="button"
                                            className="rems-secondary-button"
                                            onClick={() =>
                                                navigate(
                                                    isHomeowner
                                                        ? "/homeowner/properties"
                                                        : "/tenant/property"
                                                )
                                            }
                                        >

                                            View Details

                                            <BsChevronRight />

                                        </button>

                                    </div>

                                </div>

                            ) : (

                                <div className="rems-empty-state py-3">

                                    <div className="rems-empty-icon">
                                        <BsBuilding />
                                    </div>

                                    <div className="rems-empty-title">
                                        Property unavailable
                                    </div>

                                    <div className="rems-empty-text">
                                        No authorized property is currently
                                        associated with your account.
                                    </div>

                                </div>

                            )}

                        </div>

                    </div>

                </div>


                <div className="col-12 col-lg-5">

                    <div className="rems-glass-card h-100">

                        <div className="rems-card-header">

                            <div>

                                <div className="rems-page-eyebrow">
                                    COMMUNITY ACCESS
                                </div>

                                <div className="rems-card-title">
                                    Access & Security
                                </div>

                            </div>

                        </div>


                        <div className="p-2 p-md-3">

                            <div className="d-flex flex-column gap-2">


                                <div className="rems-property-info-card rems-resident-access-item">

                                    <div className="rems-property-detail-icon">

                                        <BsShieldCheck />

                                    </div>

                                    <div className="min-width-0">

                                        <div className="rems-table-primary">
                                            Motorist Access
                                        </div>

                                        <div className="rems-table-secondary">
                                            Active stickers authorize vehicle access.
                                        </div>

                                    </div>

                                </div>


                                <div className="rems-property-info-card rems-resident-access-item">

                                    <div className="rems-property-detail-icon">

                                        <BsPersonCheck />

                                    </div>

                                    <div className="min-width-0">

                                        <div className="rems-table-primary">
                                            Visitor Authorization
                                        </div>

                                        <div className="rems-table-secondary">
                                            Register visitors before arrival.
                                        </div>

                                    </div>

                                </div>


                                <div className="rems-property-info-card rems-resident-access-item">

                                    <div className="rems-property-detail-icon">

                                        <BsClockHistory />

                                    </div>

                                    <div className="min-width-0">

                                        <div className="rems-table-primary">
                                            Access Status
                                        </div>

                                        <div className="rems-table-secondary">
                                            Records stay synchronized with security.
                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}
