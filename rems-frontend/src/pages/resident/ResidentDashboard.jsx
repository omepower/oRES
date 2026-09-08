
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
    BsChevronDown,
    BsChevronRight,
    BsChevronUp,
    BsClockHistory,
    BsPeople,
    BsPersonCheck,
    BsPlusLg,
    BsShieldCheck,
    BsHouseDoor,
    BsExclamationCircle,
    BsMegaphone,
    BsHouses,
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

import {
    getAnnouncementFeed,
} from "../../api/announcements";


/* =========================================================
   HELPERS
========================================================= */

const normalize = (
    response,
    keys = []
) => {

    if (
        Array.isArray(
            response
        )
    ) {

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


/* =========================================================
   STATUS HELPERS
========================================================= */

const normalizeStatus = (
    status
) => {

    return String(
        status || ""
    )
        .trim()
        .toUpperCase();

};


const getVisitorStatus = (
    visitor
) => {

    const status =
        normalizeStatus(
            visitor?.status
        );


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

                {
                    status
                }

            </span>
        );

    }


    if (
        status ===
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

                {
                    status
                }

            </span>
        );

    }


    return (
        <span className="rems-status-badge rems-status-secondary">

            <span className="rems-status-dot" />

            {
                status ||
                "Unknown"
            }

        </span>
    );

};


const getStickerStatus = (
    status
) => {

    const normalized =
        normalizeStatus(
            status
        );


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
        [
            "REVOKED",
            "CANCELLED",
        ].includes(
            normalized
        )
    ) {

        return (
            <span className="rems-status-badge rems-status-danger">

                <span className="rems-status-dot" />

                {
                    normalized
                }

            </span>
        );

    }


    return (
        <span className="rems-status-badge rems-status-secondary">

            <span className="rems-status-dot" />

            {
                normalized ===
                "EXPIRED"

                    ? "Expired"

                    : normalized ||
                        "Unknown"
            }

        </span>
    );

};


/* =========================================================
   COMPONENT
========================================================= */

export default function ResidentDashboard() {

    const navigate =
        useNavigate();


    /* =====================================================
       USER
    ===================================================== */

    const [
        user,
        setUser,
    ] = useState(null);


    /* =====================================================
       STATE
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


    const [
        announcements,
        setAnnouncements,
    ] = useState([]);


    /* =====================================================
       COLLAPSIBLE SECTIONS
    ===================================================== */

    const [
        expandedSections,
        setExpandedSections,
    ] = useState({

        announcements:
            false,

        visitors:
            false,

        property:
            false,

        access:
            false,

    });


    const toggleSection = (
        section
    ) => {

        setExpandedSections(
            previous => ({

                ...previous,

                [section]:
                    !previous[section],

            })
        );

    };


    /* =====================================================
       USER LOAD
    ===================================================== */

    useEffect(
        () => {

            try {

                const storedUser =
                    localStorage.getItem(
                        "user"
                    );


                if (
                    storedUser
                ) {

                    setUser(
                        JSON.parse(
                            storedUser
                        )
                    );

                }

            } catch (
                err
            ) {

                console.error(
                    "[Resident Dashboard] Unable to read user:",
                    err
                );

            }

        },
        []
    );


    /* =====================================================
       ROLE
    ===================================================== */

    const role =
        String(
            user?.role ||
            localStorage.getItem(
                "role"
            ) ||
            ""
        )
            .toUpperCase();


    const isHomeowner =
        role ===
        "HOMEOWNER";


    const isTenant =
        role ===
        "TENANT";


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
        displayName
            .split(" ")[0] ||
        "Resident";


    const portalPrefix =
        isHomeowner
            ? "/homeowner"
            : "/tenant";


    /* =====================================================
       LOAD DASHBOARD
    ===================================================== */

    const loadDashboard =
        useCallback(
            async (
                isRefresh = false
            ) => {

                if (
                    isRefresh
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

                    const [

                        vehiclesResponse,

                        stickersResponse,

                        propertiesResponse,

                        visitorsResponse,

                        announcementsResponse,

                    ] =
                        await Promise.allSettled([

                            getMyVehicles(),

                            getMotoristStickersMine(),

                            getMyProperties(),

                            getMyVisitorInvitations(),

                            getAnnouncementFeed(),

                        ]);


                    let vehicleData = [];

                    let stickerData = [];

                    let propertyData = [];

                    let visitorData = [];

                    let announcementData = [];


                    if (
                        vehiclesResponse.status ===
                        "fulfilled"
                    ) {

                        vehicleData =
                            normalize(
                                vehiclesResponse.value,
                                [
                                    "vehicles",
                                ]
                            );

                    }


                    if (
                        stickersResponse.status ===
                        "fulfilled"
                    ) {

                        stickerData =
                            normalize(
                                stickersResponse.value,
                                [
                                    "stickers",
                                ]
                            );

                    }


                    if (
                        propertiesResponse.status ===
                        "fulfilled"
                    ) {

                        propertyData =
                            normalize(
                                propertiesResponse.value,
                                [
                                    "properties",
                                ]
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


                    if (
                        announcementsResponse.status ===
                        "fulfilled"
                    ) {

                        announcementData =
                            normalize(
                                announcementsResponse.value
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

                    setAnnouncements(
                        announcementData
                    );

                } catch (
                    err
                ) {

                    console.error(
                        "[Resident Dashboard] Failed:",
                        err
                    );


                    setError(
                        err?.response?.data?.detail ||
                        "Unable to load your resident dashboard."
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


    useEffect(
        () => {

            loadDashboard();

        },
        [
            loadDashboard,
        ]
    );


    /* =====================================================
       STATISTICS
    ===================================================== */

    const statistics =
        useMemo(
            () => {

                const activeVehicles =
                    vehicles.filter(
                        vehicle =>
                            vehicle?.is_active !==
                            false
                    ).length;


                const activeStickers =
                    stickers.filter(
                        sticker =>
                            normalizeStatus(
                                sticker?.status
                            ) ===
                            "ACTIVE"
                    ).length;


                const pendingStickers =
                    stickers.filter(
                        sticker =>
                            normalizeStatus(
                                sticker?.status
                            ) ===
                            "PENDING"
                    ).length;


                const usedVisitors =
                    visitors.filter(
                        visitor =>
                            normalizeStatus(
                                visitor?.status
                            ) ===
                            "USED"
                    );


                const activeVisitors =
                    visitors.filter(
                        visitor =>
                            normalizeStatus(
                                visitor?.status
                            ) ===
                            "INSIDE"
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
                        usedVisitors.length,

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


    /* =====================================================
       PROPERTY
    ===================================================== */

    const primaryProperty =
        properties[0] ||
        null;


    const propertyName =
        primaryProperty?.address ||
        primaryProperty?.property_name ||
        primaryProperty?.name ||
        "My Property";


    /* =====================================================
       RECENT VISITORS
    ===================================================== */

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
                                )
                                    .getTime();


                            const dateB =
                                new Date(
                                    b?.created_at ||
                                    b?.visit_date ||
                                    b?.date ||
                                    0
                                )
                                    .getTime();


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


    /* =====================================================
       QUICK ACTIONS
    ===================================================== */

    const quickActions =
        useMemo(
            () => [



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
                        "Facility Bookings",

                    description:
                        "menity hiring",

                    icon:
                        <BsHouses />,

                    path:
                        `${portalPrefix}/facilities`,

                },

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


    /* =====================================================
       LOADING
    ===================================================== */

    if (
        loading
    ) {

        return (

            <div className="rems-page-content">

                <div className="rems-page-header">

                    <div>

                        <div className="rems-page-eyebrow">

                            {
                                roleLabel.toUpperCase()
                            }

                        </div>


                        <h1 className="rems-page-title">

                            Resident Dashboard

                        </h1>


                        <p className="rems-page-description">

                            Loading your community
                            information...

                        </p>

                    </div>

                </div>


                <div className="rems-loading-state">

                    <div
                        className="spinner-border"
                        role="status"
                        aria-hidden="true"
                    />


                    <div className="mt-2">

                        Loading resident dashboard...

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
                COMPACT DASHBOARD CSS
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

                    .rems-resident-action {
                        min-height: 68px !important;
                        padding: 11px !important;
                        gap: 10px !important;
                    }

                    .rems-resident-access-item {
                        min-height: 0 !important;
                        padding: 10px 11px !important;
                    }

                    .rems-resident-table td,
                    .rems-resident-table th {
                        padding: 10px 12px !important;
                    }

                    .rems-resident-collapse-button {
                        border: 0;
                        background: transparent;
                        padding: 0;
                        margin: 0;
                        color: inherit;
                    }

                    .rems-resident-collapse-icon {
                        width: 34px;
                        height: 34px;
                        min-width: 34px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 9px;
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

                    }

                `}
            </style>


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">

                        {
                            roleLabel.toUpperCase()
                        }

                    </div>


                    <h1 className="rems-page-title">

                        Hello! {firstName}

                    </h1>


                    <p className="rems-page-description">

                        Manage your residence,
                        vehicles, visitors,
                        and access.

                    </p>

                </div>


                <div className="rems-page-header-actions">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() =>
                            loadDashboard(
                                true
                            )
                        }
                        disabled={
                            refreshing
                        }
                    >

                        {
                            refreshing
                                ? (
                                    <span className="spinner-border spinner-border-sm" />
                                )
                                : (
                                    <BsArrowClockwise />
                                )
                        }


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

                    {
                        error
                    }

                </div>

            )}


            {/* =================================================
                CURRENT RESIDENCE
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

                                {
                                    propertyName
                                }

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

                                {
                                    statistics.properties
                                }

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

                                {
                                    statistics.vehicles
                                }

                            </div>


                            <div className="small text-muted">

                                {
                                    statistics.activeVehicles
                                }
                                {" "}
                                active

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

                                {
                                    statistics.stickers
                                }

                            </div>


                            <div className="small text-muted">

                                {
                                    statistics.activeStickers
                                }
                                {" "}
                                active

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

                                Total Visitors

                            </div>


                            <div className="rems-stat-value">

                                {
                                    statistics.visitors
                                }

                            </div>


                            <div className="small text-muted">

                                {
                                    statistics.activeVisitors
                                }
                                {" "}
                                active

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                QUICK ACTIONS + STICKERS
            ================================================= */}

            <div className="row g-3 mb-3">


                <div className="col-12 col-xl-12">

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

                                {
                                    quickActions.map(
                                        action => (

                                            <div
                                                className="col-12 col-md-3"
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
                                    )
                                }

                            </div>

                        </div>

                    </div>

                </div>


            </div>


            {/* =================================================
                COMMUNITY ANNOUNCEMENTS — COLLAPSIBLE
            ================================================= */}
            

            <div className="rems-glass-card mb-3">

                <div className="rems-card-header">

                    <div className="d-flex align-items-center gap-2 min-width-0">

                        <div className="rems-action-icon">

                            <BsMegaphone />

                        </div>


                        <div className="min-width-0">

                            <div className="rems-page-eyebrow">

                                COMMUNITY

                            </div>


                            <div className="rems-card-title">

                                Community Announcements

                            </div>


                            <div className="rems-card-subtitle">

                                Important notices and community updates.

                            </div>

                        </div>

                    </div>


                    <div className="d-flex align-items-center gap-2">

                        <button
                            type="button"
                            className="rems-secondary-button"
                            onClick={() =>
                                navigate(
                                    `${portalPrefix}/announcements`
                                )
                            }
                        >

                            View all

                            <BsChevronRight />

                        </button>


                        <button
                            type="button"
                            className="rems-icon-button rems-resident-collapse-button"
                            aria-expanded={
                                expandedSections.announcements
                            }
                            aria-label={
                                expandedSections.announcements
                                    ? "Collapse announcements"
                                    : "Expand announcements"
                            }
                            onClick={() =>
                                toggleSection(
                                    "announcements"
                                )
                            }
                        >

                            <span className="rems-resident-collapse-icon">

                                {
                                    expandedSections.announcements
                                        ? <BsChevronUp />
                                        : <BsChevronDown />
                                }

                            </span>

                        </button>

                    </div>

                </div>


                {
                    expandedSections.announcements && (

                        <div className="p-2 p-md-3">

                            {
                                announcements.length ===
                                0
                                    ? (

                                        <div className="rems-empty-state py-3">

                                            <div className="rems-empty-icon">

                                                <BsMegaphone />

                                            </div>


                                            <div className="rems-empty-title">

                                                No announcements

                                            </div>


                                            <div className="rems-empty-text">

                                                Community notices will appear here.

                                            </div>

                                        </div>

                                    )
                                    : (

                                        <div className="d-flex flex-column gap-2">

                                            {
                                                announcements
                                                    .slice(
                                                        0,
                                                        3
                                                    )
                                                    .map(
                                                        announcement => (

                                                            <button
                                                                key={
                                                                    announcement.id
                                                                }
                                                                type="button"
                                                                className="w-100 border-0 text-start rounded-3 p-3"
                                                                style={{
                                                                    background:
                                                                        "rgba(15,23,42,.025)",
                                                                }}
                                                                onClick={() =>
                                                                    navigate(
                                                                        `${portalPrefix}/announcements/${announcement.id}`
                                                                    )
                                                                }
                                                            >

                                                                <div className="d-flex align-items-start gap-3">

                                                                    <div className="rems-action-icon">

                                                                        <BsMegaphone />

                                                                    </div>


                                                                    <div className="min-width-0 flex-grow-1">

                                                                        <div className="d-flex align-items-center flex-wrap gap-2">

                                                                            <div className="rems-table-primary">

                                                                                {
                                                                                    announcement.title
                                                                                }

                                                                            </div>


                                                                            <span className="rems-status-badge rems-status-info">

                                                                                {
                                                                                    announcement.category_display ||
                                                                                    announcement.category
                                                                                }

                                                                            </span>

                                                                        </div>


                                                                        <div className="rems-table-secondary mt-1">

                                                                            {
                                                                                announcement.content
                                                                            }

                                                                        </div>


                                                                        <div className="small text-muted mt-2">

                                                                            {
                                                                                announcement.published_at
                                                                                    ? new Date(
                                                                                        announcement.published_at
                                                                                    )
                                                                                        .toLocaleDateString()
                                                                                    : "Recently published"
                                                                            }

                                                                        </div>

                                                                    </div>

                                                                </div>

                                                            </button>

                                                        )
                                                    )
                                            }

                                        </div>

                                    )
                            }

                        </div>

                    )
                }

            </div>


            {/* =================================================
                RECENT VISITORS — COLLAPSIBLE
            ================================================= */}

            <div className="rems-glass-card mb-3">

                <div className="rems-card-header">

                    <div className="d-flex align-items-center gap-2 min-width-0">

                        <div className="rems-action-icon">

                            <BsPeople />

                        </div>


                        <div className="min-width-0">

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

                    </div>


                    <div className="d-flex align-items-center gap-2">

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


                        <button
                            type="button"
                            className="rems-icon-button rems-resident-collapse-button"
                            aria-expanded={
                                expandedSections.visitors
                            }
                            aria-label={
                                expandedSections.visitors
                                    ? "Collapse visitors"
                                    : "Expand visitors"
                            }
                            onClick={() =>
                                toggleSection(
                                    "visitors"
                                )
                            }
                        >

                            <span className="rems-resident-collapse-icon">

                                {
                                    expandedSections.visitors
                                        ? <BsChevronUp />
                                        : <BsChevronDown />
                                }

                            </span>

                        </button>

                    </div>

                </div>


                {
                    expandedSections.visitors && (

                        <>

                            {
                                recentVisitors.length ===
                                0
                                    ? (

                                        <div className="rems-empty-state py-4">

                                            <div className="rems-empty-icon">

                                                <BsPeople />

                                            </div>


                                            <div className="rems-empty-title">

                                                No recent visitors

                                            </div>


                                            <div className="rems-empty-text">

                                                Visitor authorizations
                                                will appear here.

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

                                    )
                                    : (

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

                                                    {
                                                        recentVisitors.map(
                                                            visitor => (

                                                                <tr
                                                                    key={
                                                                        visitor.id
                                                                    }
                                                                >

                                                                    <td data-label="Visitor">

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


                                                                    <td data-label="Visit Date">

                                                                        {
                                                                            visitor.visit_date ||
                                                                            visitor.date ||
                                                                            visitor.scheduled_date ||
                                                                            "—"
                                                                        }

                                                                    </td>


                                                                    <td data-label="Status">

                                                                        {
                                                                            getVisitorStatus(
                                                                                visitor
                                                                            )
                                                                        }

                                                                    </td>

                                                                </tr>

                                                            )
                                                        )
                                                    }

                                                </tbody>

                                            </table>

                                        </div>

                                    )
                            }

                        </>

                    )
                }

            </div>

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
//     BsBuilding,
//     BsCalendar3,
//     BsCarFront,
//     BsChevronRight,
//     BsCheck2Circle,
//     BsClockHistory,
//     BsCreditCard,
//     BsExclamationCircle,
//     BsFileEarmarkCheck,
//     BsHouseDoor,
//     BsMegaphone,
//     BsPeople,
//     BsPersonCheck,
//     BsPlusLg,
//     BsShieldCheck,
//     BsXCircle,
// } from "react-icons/bs";

// import {
//     getMyVehicles,
//     getMotoristStickersMine,
// } from "../../api/vehicles";

// import {
//     getMyProperties,
// } from "../../api/properties";

// import {
//     getMyVisitorInvitations,
// } from "../../api/visitors";

// import {
//     getAnnouncementFeed,
// } from "../../api/announcements";

// import {
//     getMyFacilityBookings,
// } from "../../api/facilities";


// /* =========================================================
//    HELPERS
// ========================================================= */

// const normalize = (
//     response,
//     keys = []
// ) => {

//     if (
//         Array.isArray(
//             response
//         )
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
//         value ||
//         ""
//     )
//         .trim()
//         .toUpperCase();

// };


// const money = (
//     value
// ) => {

//     return Number(
//         value || 0
//     ).toLocaleString(
//         undefined,
//         {
//             minimumFractionDigits:
//                 2,

//             maximumFractionDigits:
//                 2,
//         }
//     );

// };


// const getErrorMessage = (
//     error,
//     fallback =
//         "Unable to load your resident dashboard."
// ) => {

//     const data =
//         error?.response?.data;


//     if (
//         typeof data ===
//         "string"
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
//         typeof data ===
//         "object"
//     ) {

//         const firstError =
//             Object.values(
//                 data
//             )
//                 .flat()
//                 .find(
//                     value =>
//                         Boolean(
//                             value
//                         )
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


// /* =========================================================
//    FACILITY BOOKING STATUS
// ========================================================= */

// const FACILITY_ACTIVE_STATUSES = [

//     "PENCIL",

//     "PENDING",

//     "APPROVED",

//     "IN_USE",

//     "INSPECTION_PENDING",

//     "REFUND_PENDING",

// ];


// const FACILITY_TERMINAL_STATUSES = [

//     "COMPLETED",

//     "CLOSED",

//     "REJECTED",

//     "CANCELLED",

//     "EXPIRED",

// ];


// /* =========================================================
//    FACILITY STATUS CLASS
// ========================================================= */

// const getFacilityStatusClass = (
//     status
// ) => {

//     switch (
//         normalizeStatus(
//             status
//         )
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
//    COMPONENT
// ========================================================= */

// export default function ResidentDashboard() {

//     const navigate =
//         useNavigate();


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
//        USER
//     ===================================================== */

//     const [
//         user,
//         setUser,
//     ] = useState(null);


//     /* =====================================================
//        RESIDENT DATA
//     ===================================================== */

//     const [
//         properties,
//         setProperties,
//     ] = useState([]);


//     const [
//         vehicles,
//         setVehicles,
//     ] = useState([]);


//     const [
//         stickers,
//         setStickers,
//     ] = useState([]);


//     const [
//         visitors,
//         setVisitors,
//     ] = useState([]);


//     const [
//         announcements,
//         setAnnouncements,
//     ] = useState([]);


//     const [
//         facilityBookings,
//         setFacilityBookings,
//     ] = useState([]);


//     /* =====================================================
//        READ STORED USER
//     ===================================================== */

//     useEffect(
//         () => {

//             try {

//                 const storedUser =
//                     localStorage.getItem(
//                         "user"
//                     );


//                 if (
//                     storedUser
//                 ) {

//                     setUser(
//                         JSON.parse(
//                             storedUser
//                         )
//                     );

//                 }

//             } catch (
//                 err
//             ) {

//                 console.error(
//                     "[Resident Dashboard] Unable to read user:",
//                     err
//                 );

//             }

//         },
//         []
//     );


//     /* =====================================================
//        ROLE
//     ===================================================== */

//     const role =
//         String(
//             user?.role ||
//             localStorage.getItem(
//                 "role"
//             ) ||
//             ""
//         )
//             .trim()
//             .toUpperCase();


//     const isHomeowner =
//         role ===
//         "HOMEOWNER";


//     const isTenant =
//         role ===
//         "TENANT";


//     const roleLabel =
//         isHomeowner

//             ? "Homeowner"

//             : isTenant

//                 ? "Tenant"

//                 : "Resident";


//     const displayName =
//         user?.full_name ||
//         user?.name ||
//         [
//             user?.first_name,
//             user?.last_name,
//         ]
//             .filter(Boolean)
//             .join(" ") ||
//         user?.username ||
//         "Resident";


//     const firstName =
//         user?.first_name ||
//         displayName.split(
//             " "
//         )[0] ||
//         "Resident";


//     const portalPrefix =
//         isHomeowner
//             ? "/homeowner"
//             : "/tenant";


//     /* =====================================================
//        LOAD DASHBOARD
//     ===================================================== */

//     const loadDashboard =
//         useCallback(
//             async (
//                 isRefresh = false
//             ) => {

//                 if (
//                     isRefresh
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


//                 try {

//                     const [

//                         vehiclesResponse,

//                         stickersResponse,

//                         propertiesResponse,

//                         visitorsResponse,

//                         announcementsResponse,

//                         facilityBookingsResponse,

//                     ] = await Promise.allSettled([

//                         getMyVehicles(),

//                         getMotoristStickersMine(),

//                         getMyProperties(),

//                         getMyVisitorInvitations(),

//                         getAnnouncementFeed(),

//                         getMyFacilityBookings(),

//                     ]);


//                     let vehicleData =
//                         [];


//                     let stickerData =
//                         [];


//                     let propertyData =
//                         [];


//                     let visitorData =
//                         [];


//                     let announcementData =
//                         [];


//                     let facilityBookingData =
//                         [];


//                     /* -----------------------------------------
//                        VEHICLES
//                     ----------------------------------------- */

//                     if (
//                         vehiclesResponse.status ===
//                         "fulfilled"
//                     ) {

//                         vehicleData =
//                             normalize(
//                                 vehiclesResponse.value,
//                                 [
//                                     "vehicles",
//                                 ]
//                             );

//                     }


//                     /* -----------------------------------------
//                        STICKERS
//                     ----------------------------------------- */

//                     if (
//                         stickersResponse.status ===
//                         "fulfilled"
//                     ) {

//                         stickerData =
//                             normalize(
//                                 stickersResponse.value,
//                                 [
//                                     "stickers",
//                                 ]
//                             );

//                     }


//                     /* -----------------------------------------
//                        PROPERTIES
//                     ----------------------------------------- */

//                     if (
//                         propertiesResponse.status ===
//                         "fulfilled"
//                     ) {

//                         propertyData =
//                             normalize(
//                                 propertiesResponse.value,
//                                 [
//                                     "properties",
//                                 ]
//                             );

//                     }


//                     /* -----------------------------------------
//                        VISITORS
//                     ----------------------------------------- */

//                     if (
//                         visitorsResponse.status ===
//                         "fulfilled"
//                     ) {

//                         visitorData =
//                             normalize(
//                                 visitorsResponse.value,
//                                 [
//                                     "invitations",
//                                     "visitors",
//                                 ]
//                             );

//                     }


//                     /* -----------------------------------------
//                        ANNOUNCEMENTS
//                     ----------------------------------------- */

//                     if (
//                         announcementsResponse.status ===
//                         "fulfilled"
//                     ) {

//                         announcementData =
//                             normalize(
//                                 announcementsResponse.value,
//                                 [
//                                     "announcements",
//                                     "results",
//                                 ]
//                             );

//                     }


//                     /* -----------------------------------------
//                        FACILITY BOOKINGS
//                     ----------------------------------------- */

//                     if (
//                         facilityBookingsResponse.status ===
//                         "fulfilled"
//                     ) {

//                         facilityBookingData =
//                             normalize(
//                                 facilityBookingsResponse.value,
//                                 [
//                                     "bookings",
//                                 ]
//                             );

//                     }


//                     setVehicles(
//                         vehicleData
//                     );


//                     setStickers(
//                         stickerData
//                     );


//                     setProperties(
//                         propertyData
//                     );


//                     setVisitors(
//                         visitorData
//                     );


//                     setAnnouncements(
//                         announcementData
//                     );


//                     setFacilityBookings(
//                         facilityBookingData
//                     );


//                     /*
//                      * We intentionally do not make one failed
//                      * dashboard module prevent the rest of the
//                      * resident dashboard from rendering.
//                      */

//                     const failedModules = [

//                         vehiclesResponse,

//                         stickersResponse,

//                         propertiesResponse,

//                         visitorsResponse,

//                         announcementsResponse,

//                         facilityBookingsResponse,

//                     ]
//                         .filter(
//                             item =>
//                                 item.status ===
//                                 "rejected"
//                         );


//                     if (
//                         failedModules.length ===
//                         6
//                     ) {

//                         setError(
//                             "Unable to load your resident dashboard."
//                         );

//                     }

//                 } catch (
//                     err
//                 ) {

//                     console.error(
//                         "[Resident Dashboard] Failed:",
//                         err
//                     );


//                     setError(
//                         getErrorMessage(
//                             err
//                         )
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


//     /* =====================================================
//        INITIAL LOAD
//     ===================================================== */

//     useEffect(
//         () => {

//             loadDashboard();

//         },
//         [
//             loadDashboard,
//         ]
//     );


//     /* =====================================================
//        STATISTICS
//     ===================================================== */

//     const statistics =
//         useMemo(
//             () => {

//                 const activeVehicles =
//                     vehicles.filter(
//                         vehicle =>
//                             vehicle?.is_active !==
//                             false
//                     ).length;


//                 const activeStickers =
//                     stickers.filter(
//                         sticker =>
//                             normalizeStatus(
//                                 sticker?.status
//                             ) ===
//                             "ACTIVE"
//                     ).length;


//                 const pendingStickers =
//                     stickers.filter(
//                         sticker =>
//                             normalizeStatus(
//                                 sticker?.status
//                             ) ===
//                             "PENDING"
//                     ).length;


//                 const usedVisitors =
//                     visitors.filter(
//                         visitor =>
//                             normalizeStatus(
//                                 visitor?.status
//                             ) ===
//                             "USED"
//                     );


//                 const activeVisitors =
//                     visitors.filter(
//                         visitor =>
//                             normalizeStatus(
//                                 visitor?.status
//                             ) ===
//                             "INSIDE"
//                     ).length;


//                 const activeFacilityBookings =
//                     facilityBookings.filter(
//                         booking =>
//                             FACILITY_ACTIVE_STATUSES.includes(
//                                 normalizeStatus(
//                                     booking?.status
//                                 )
//                             )
//                     ).length;


//                 const pendingFacilityBookings =
//                     facilityBookings.filter(
//                         booking =>
//                             normalizeStatus(
//                                 booking?.status
//                             ) ===
//                             "PENDING"
//                     ).length;


//                 const expiredFacilityBookings =
//                     facilityBookings.filter(
//                         booking =>
//                             normalizeStatus(
//                                 booking?.status
//                             ) ===
//                             "EXPIRED"
//                     ).length;


//                 const completedFacilityBookings =
//                     facilityBookings.filter(
//                         booking =>
//                             [
//                                 "COMPLETED",
//                                 "CLOSED",
//                             ].includes(
//                                 normalizeStatus(
//                                     booking?.status
//                                 )
//                             )
//                     ).length;


//                 return {

//                     properties:
//                         properties.length,

//                     vehicles:
//                         vehicles.length,

//                     activeVehicles,

//                     stickers:
//                         stickers.length,

//                     activeStickers,

//                     pendingStickers,

//                     visitors:
//                         usedVisitors.length,

//                     activeVisitors,

//                     facilityBookings:
//                         facilityBookings.length,

//                     activeFacilityBookings,

//                     pendingFacilityBookings,

//                     expiredFacilityBookings,

//                     completedFacilityBookings,

//                 };

//             },
//             [
//                 properties,
//                 vehicles,
//                 stickers,
//                 visitors,
//                 facilityBookings,
//             ]
//         );


//     /* =====================================================
//        PRIMARY PROPERTY
//     ===================================================== */

//     const primaryProperty =
//         properties[0] ||
//         null;


//     const propertyName =
//         primaryProperty?.address ||
//         primaryProperty?.property_name ||
//         primaryProperty?.name ||
//         "My Property";


//     /* =====================================================
//        RECENT VISITORS
//     ===================================================== */

//     const recentVisitors =
//         useMemo(
//             () => {

//                 return [
//                     ...visitors,
//                 ]
//                     .sort(
//                         (
//                             a,
//                             b
//                         ) => {

//                             const dateA =
//                                 new Date(
//                                     a?.created_at ||
//                                     a?.visit_date ||
//                                     a?.date ||
//                                     0
//                                 )
//                                     .getTime();


//                             const dateB =
//                                 new Date(
//                                     b?.created_at ||
//                                     b?.visit_date ||
//                                     b?.date ||
//                                     0
//                                 )
//                                     .getTime();


//                             return (
//                                 dateB -
//                                 dateA
//                             );

//                         }
//                     )
//                     .slice(
//                         0,
//                         5
//                     );

//             },
//             [
//                 visitors,
//             ]
//         );


//     /* =====================================================
//        RECENT FACILITY BOOKINGS
//     ===================================================== */

//     const recentFacilityBookings =
//         useMemo(
//             () => {

//                 return [
//                     ...facilityBookings,
//                 ]
//                     .sort(
//                         (
//                             a,
//                             b
//                         ) => {

//                             const dateA =
//                                 new Date(
//                                     `${a?.booking_date || "1970-01-01"}T${a?.start_time || "00:00"}`
//                                 )
//                                     .getTime();


//                             const dateB =
//                                 new Date(
//                                     `${b?.booking_date || "1970-01-01"}T${b?.start_time || "00:00"}`
//                                 )
//                                     .getTime();


//                             return (
//                                 dateB -
//                                 dateA
//                             );

//                         }
//                     )
//                     .slice(
//                         0,
//                         5
//                     );

//             },
//             [
//                 facilityBookings,
//             ]
//         );


//     /* =====================================================
//        RECENT ANNOUNCEMENTS
//     ===================================================== */

//     const recentAnnouncements =
//         useMemo(
//             () => {

//                 return [
//                     ...announcements,
//                 ]
//                     .sort(
//                         (
//                             a,
//                             b
//                         ) => {

//                             const dateA =
//                                 new Date(
//                                     a?.published_at ||
//                                     a?.created_at ||
//                                     0
//                                 )
//                                     .getTime();


//                             const dateB =
//                                 new Date(
//                                     b?.published_at ||
//                                     b?.created_at ||
//                                     0
//                                 )
//                                     .getTime();


//                             return (
//                                 dateB -
//                                 dateA
//                             );

//                         }
//                     )
//                     .slice(
//                         0,
//                         3
//                     );

//             },
//             [
//                 announcements,
//             ]
//         );


//     /* =====================================================
//        QUICK ACTIONS
//     ===================================================== */

//     const quickActions =
//         useMemo(
//             () => [

//                 {
//                     label:
//                         "Register Vehicle",

//                     description:
//                         "Add a vehicle",

//                     icon:
//                         <BsCarFront />,

//                     path:
//                         `${portalPrefix}/vehicles`,
//                 },

//                 {
//                     label:
//                         "Invite Visitor",

//                     description:
//                         "Authorize a visitor",

//                     icon:
//                         <BsPeople />,

//                     path:
//                         `${portalPrefix}/visitors`,
//                 },

//                 {
//                     label:
//                         "Request Sticker",

//                     description:
//                         "Vehicle access",

//                     icon:
//                         <BsShieldCheck />,

//                     path:
//                         `${portalPrefix}/stickers`,
//                 },

//                 {
//                     label:
//                         "Reserve Facility",

//                     description:
//                         "Book community amenities",

//                     icon:
//                         <BsCalendar3 />,

//                     path:
//                         `${portalPrefix}/facilities`,
//                 },

//             ],
//             [
//                 portalPrefix,
//             ]
//         );


//     /* =====================================================
//        VISITOR STATUS
//     ===================================================== */

//     const getVisitorStatus =
//         (
//             visitor
//         ) => {

//             const status =
//                 normalizeStatus(
//                     visitor?.status
//                 );


//             if (
//                 [
//                     "APPROVED",
//                     "EXPECTED",
//                     "INSIDE",
//                     "ACTIVE",
//                     "USED",
//                 ].includes(
//                     status
//                 )
//             ) {

//                 return (

//                     <span className="rems-status-badge rems-status-success">

//                         <span className="rems-status-dot" />

//                         {
//                             status ===
//                             "USED"
//                                 ? "Visited"
//                                 : status
//                         }

//                     </span>

//                 );

//             }


//             if (
//                 status ===
//                 "PENDING"
//             ) {

//                 return (

//                     <span className="rems-status-badge rems-status-warning">

//                         <span className="rems-status-dot" />

//                         Pending

//                     </span>

//                 );

//             }


//             if (
//                 [
//                     "REJECTED",
//                     "CANCELLED",
//                     "EXPIRED",
//                 ].includes(
//                     status
//                 )
//             ) {

//                 return (

//                     <span className="rems-status-badge rems-status-danger">

//                         <span className="rems-status-dot" />

//                         {
//                             status
//                         }

//                     </span>

//                 );

//             }


//             return (

//                 <span className="rems-status-badge rems-status-secondary">

//                     <span className="rems-status-dot" />

//                     {
//                         status ||
//                         "Unknown"
//                     }

//                 </span>

//             );

//         };


//     /* =====================================================
//        STICKER STATUS
//     ===================================================== */

//     const getStickerStatus =
//         (
//             status
//         ) => {

//             const normalized =
//                 normalizeStatus(
//                     status
//                 );


//             if (
//                 normalized ===
//                 "ACTIVE"
//             ) {

//                 return (

//                     <span className="rems-status-badge rems-status-success">

//                         <span className="rems-status-dot" />

//                         Active

//                     </span>

//                 );

//             }


//             if (
//                 normalized ===
//                 "PENDING"
//             ) {

//                 return (

//                     <span className="rems-status-badge rems-status-warning">

//                         <span className="rems-status-dot" />

//                         Pending

//                     </span>

//                 );

//             }


//             if (
//                 normalized ===
//                 "REVOKED"
//             ) {

//                 return (

//                     <span className="rems-status-badge rems-status-danger">

//                         <span className="rems-status-dot" />

//                         Revoked

//                     </span>

//                 );

//             }


//             return (

//                 <span className="rems-status-badge rems-status-secondary">

//                     <span className="rems-status-dot" />

//                     {
//                         normalized ===
//                         "EXPIRED"

//                             ? "Expired"

//                             : normalized ||
//                               "Unknown"
//                     }

//                 </span>

//             );

//         };


//     /* =====================================================
//        FACILITY REQUIREMENT STATE
//     ===================================================== */

//     const getFacilityRequirementState =
//         (
//             booking
//         ) => {

//             const documents =
//                 Array.isArray(
//                     booking?.documents
//                 )
//                     ? booking.documents
//                     : [];


//             const payments =
//                 Array.isArray(
//                     booking?.payments
//                 )
//                     ? booking.payments
//                     : [];


//             const reservationForm =
//                 documents.some(
//                     document =>
//                         normalizeStatus(
//                             document?.document_type
//                         ) ===
//                         "RESERVATION_FORM"
//                 );


//             const consolidatedPayment =
//                 payments.find(
//                     payment =>
//                         normalizeStatus(
//                             payment?.payment_type
//                         ) ===
//                         "BOOKING_TOTAL"
//                 );


//             const hasProof =
//                 Boolean(
//                     consolidatedPayment?.proof
//                 );


//             const hasReference =
//                 Boolean(
//                     String(
//                         consolidatedPayment?.reference_number ||
//                         ""
//                     ).trim()
//                 );


//             const paymentSubmitted =
//                 hasProof &&
//                 hasReference;


//             const paymentStatus =
//                 normalizeStatus(
//                     consolidatedPayment?.status
//                 );


//             const paymentRejected =
//                 paymentSubmitted &&
//                 paymentStatus ===
//                 "REJECTED";


//             const paymentVerified =
//                 paymentSubmitted &&
//                 paymentStatus ===
//                 "VERIFIED";


//             const paymentPending =
//                 paymentSubmitted &&
//                 paymentStatus ===
//                 "PENDING";


//             return {

//                 reservationForm,

//                 paymentSubmitted,

//                 paymentRejected,

//                 paymentVerified,

//                 paymentPending,

//             };

//         };


//     /* =====================================================
//        LOADING
//     ===================================================== */

//     if (
//         loading
//     ) {

//         return (

//             <div className="rems-page-content">

//                 <div className="rems-page-header">

//                     <div>

//                         <div className="rems-page-eyebrow">

//                             {
//                                 roleLabel.toUpperCase()
//                             }

//                         </div>


//                         <h1 className="rems-page-title">

//                             Resident Dashboard

//                         </h1>


//                         <p className="rems-page-description">

//                             Loading your community information...

//                         </p>

//                     </div>

//                 </div>


//                 <div className="rems-loading-state">

//                     <div
//                         className="spinner-border"
//                         role="status"
//                         aria-hidden="true"
//                     />


//                     <div className="mt-2">

//                         Loading resident dashboard...

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
//                 LOCAL DASHBOARD CSS
//             ================================================= */}

//             <style>
//                 {`

//                     .rems-resident-dashboard-grid {
//                         display: grid;
//                         gap: 14px;
//                     }

//                     .rems-resident-compact-card {
//                         padding: 14px !important;
//                     }

//                     .rems-resident-stat-card {
//                         min-height: 92px !important;
//                         padding: 14px !important;
//                         gap: 11px !important;
//                     }

//                     .rems-resident-stat-card .rems-stat-icon {
//                         width: 38px !important;
//                         height: 38px !important;
//                         min-width: 38px !important;
//                         border-radius: 10px !important;
//                         font-size: 15px !important;
//                     }

//                     .rems-resident-stat-card .rems-stat-value {
//                         font-size: 21px !important;
//                     }

//                     .rems-resident-property-item {
//                         min-height: 64px !important;
//                         padding: 10px 11px !important;
//                         gap: 10px !important;
//                     }

//                     .rems-resident-property-item .rems-property-detail-icon {
//                         width: 36px !important;
//                         height: 36px !important;
//                         flex: 0 0 36px !important;
//                         border-radius: 10px !important;
//                     }

//                     .rems-resident-action {
//                         min-height: 68px !important;
//                         padding: 11px !important;
//                         gap: 10px !important;
//                     }

//                     .rems-resident-action .rems-action-icon {
//                         width: 36px !important;
//                         height: 36px !important;
//                         border-radius: 10px !important;
//                     }

//                     .rems-resident-access-item {
//                         min-height: 0 !important;
//                         padding: 10px 11px !important;
//                     }

//                     .rems-resident-table td,
//                     .rems-resident-table th {
//                         padding: 10px 12px !important;
//                     }

//                     .rems-dashboard-booking-item {
//                         transition:
//                             background .2s ease,
//                             transform .2s ease;
//                     }

//                     .rems-dashboard-booking-item:hover {
//                         background:
//                             rgba(15,23,42,.045) !important;
//                     }

//                     .rems-dashboard-announcement {
//                         transition:
//                             background .2s ease,
//                             transform .2s ease;
//                     }

//                     .rems-dashboard-announcement:hover {
//                         background:
//                             rgba(15,23,42,.045) !important;
//                     }

//                     @media (max-width: 767.98px) {

//                         .rems-page-content {
//                             padding:
//                                 14px 12px 22px !important;
//                         }

//                         .rems-page-header {
//                             gap:
//                                 14px !important;
//                             margin-bottom:
//                                 18px !important;
//                         }

//                         .rems-page-title {
//                             font-size:
//                                 21px !important;
//                         }

//                         .rems-page-description {
//                             margin-top:
//                                 5px !important;
//                             font-size:
//                                 11px !important;
//                             line-height:
//                                 1.45 !important;
//                         }

//                         .rems-page-header-actions {
//                             gap:
//                                 7px !important;
//                         }

//                         .rems-card-header {
//                             padding:
//                                 14px !important;
//                             gap:
//                                 10px !important;
//                         }

//                         .rems-card-title {
//                             font-size:
//                                 13px !important;
//                         }

//                         .rems-card-subtitle {
//                             font-size:
//                                 10px !important;
//                         }

//                         .rems-resident-compact-card {
//                             padding:
//                                 11px !important;
//                         }

//                         .rems-resident-stat-card {
//                             min-height:
//                                 84px !important;
//                             padding:
//                                 11px !important;
//                         }

//                         .rems-resident-stat-card .rems-stat-value {
//                             font-size:
//                                 19px !important;
//                         }

//                         .rems-resident-property-item {
//                             min-height:
//                                 58px !important;
//                             padding:
//                                 9px !important;
//                         }

//                         .rems-resident-action {
//                             min-height:
//                                 60px !important;
//                             padding:
//                                 9px !important;
//                         }

//                         .rems-resident-table {
//                             min-width:
//                                 620px;
//                         }

//                         .rems-resident-table td,
//                         .rems-resident-table th {
//                             padding:
//                                 9px 10px !important;
//                             font-size:
//                                 11px !important;
//                         }

//                         .rems-status-badge {
//                             min-height:
//                                 23px !important;
//                             padding:
//                                 3px 7px !important;
//                             font-size:
//                                 9px !important;
//                         }

//                     }

//                     @media (max-width: 575.98px) {

//                         .rems-page-content {
//                             padding:
//                                 12px 10px 18px !important;
//                         }

//                         .rems-page-title {
//                             font-size:
//                                 19px !important;
//                         }

//                         .rems-page-description {
//                             font-size:
//                                 10px !important;
//                         }

//                         .rems-resident-stat-card {
//                             min-height:
//                                 78px !important;
//                             padding:
//                                 10px !important;
//                         }

//                         .rems-resident-stat-card .rems-stat-icon {
//                             width:
//                                 34px !important;
//                             height:
//                                 34px !important;
//                             min-width:
//                                 34px !important;
//                             font-size:
//                                 14px !important;
//                         }

//                         .rems-resident-stat-card .rems-stat-value {
//                             font-size:
//                                 18px !important;
//                         }

//                         .rems-resident-stat-card .rems-stat-label {
//                             font-size:
//                                 10px !important;
//                         }

//                         .rems-resident-property-item {
//                             padding:
//                                 8px !important;
//                         }

//                         .rems-resident-action {
//                             padding:
//                                 8px !important;
//                         }

//                     }

//                 `}
//             </style>


//             {/* =================================================
//                 HEADER
//             ================================================= */}

//             <div className="rems-page-header">

//                 <div>

//                     <div className="rems-page-eyebrow">

//                         {
//                             roleLabel.toUpperCase()
//                         }

//                     </div>


//                     <h1 className="rems-page-title">

//                         Hello! {firstName}

//                     </h1>


//                     <p className="rems-page-description">

//                         Manage your residence, vehicles,
//                         visitors, facilities, payments,
//                         and community information.

//                     </p>

//                 </div>


//                 <div className="rems-page-header-actions">

//                     <button
//                         type="button"
//                         className="rems-secondary-button"
//                         onClick={() =>
//                             loadDashboard(
//                                 true
//                             )
//                         }
//                         disabled={
//                             refreshing
//                         }
//                     >

//                         {refreshing ? (

//                             <span
//                                 className="spinner-border spinner-border-sm"
//                                 aria-hidden="true"
//                             />

//                         ) : (

//                             <BsArrowClockwise />

//                         )}


//                         {
//                             refreshing
//                                 ? "Refreshing..."
//                                 : "Refresh"
//                         }

//                     </button>

//                 </div>

//             </div>


//             {/* =================================================
//                 ERROR
//             ================================================= */}

//             {error && (

//                 <div className="alert alert-danger rems-alert mb-3">

//                     <BsExclamationCircle className="me-2" />

//                     {
//                         error
//                     }

//                 </div>

//             )}


//             {/* =================================================
//                 PROPERTY CONTEXT
//             ================================================= */}

//             <div className="rems-glass-card rems-resident-compact-card mb-3">

//                 <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">

//                     <div className="d-flex align-items-center gap-2 min-width-0">

//                         <div className="rems-stat-icon">

//                             {
//                                 isHomeowner
//                                     ? <BsBuilding />
//                                     : <BsHouseDoor />
//                             }

//                         </div>


//                         <div className="min-width-0">

//                             <div className="rems-page-eyebrow mb-1">

//                                 CURRENT RESIDENCE

//                             </div>


//                             <div className="rems-card-title text-truncate">

//                                 {
//                                     propertyName
//                                 }

//                             </div>


//                             <div className="rems-card-subtitle text-truncate">

//                                 {
//                                     isHomeowner
//                                         ? "Properties under your ownership"
//                                         : "Your current authorized residence"
//                                 }

//                             </div>

//                         </div>

//                     </div>


//                     <button
//                         type="button"
//                         className="rems-secondary-button"
//                         onClick={() =>
//                             navigate(
//                                 isHomeowner
//                                     ? "/homeowner/properties"
//                                     : "/tenant/property"
//                             )
//                         }
//                     >

//                         View

//                         <BsChevronRight />

//                     </button>

//                 </div>

//             </div>


//             {/* =================================================
//                 STATISTICS
//             ================================================= */}

//             <div className="row g-2 mb-3">


//                 <div className="col-6 col-xl-3">

//                     <div className="rems-stat-card rems-resident-stat-card">

//                         <div className="rems-stat-icon">

//                             <BsCarFront />

//                         </div>


//                         <div className="rems-stat-content">

//                             <div className="rems-stat-label">

//                                 Vehicles

//                             </div>


//                             <div className="rems-stat-value">

//                                 {
//                                     statistics.vehicles
//                                 }

//                             </div>


//                             <div className="small text-muted">

//                                 {
//                                     statistics.activeVehicles
//                                 }

//                                 {" active"}

//                             </div>

//                         </div>

//                     </div>

//                 </div>


//                 <div className="col-6 col-xl-3">

//                     <div className="rems-stat-card rems-resident-stat-card">

//                         <div className="rems-stat-icon">

//                             <BsShieldCheck />

//                         </div>


//                         <div className="rems-stat-content">

//                             <div className="rems-stat-label">

//                                 Stickers

//                             </div>


//                             <div className="rems-stat-value">

//                                 {
//                                     statistics.stickers
//                                 }

//                             </div>


//                             <div className="small text-muted">

//                                 {
//                                     statistics.activeStickers
//                                 }

//                                 {" active"}

//                             </div>

//                         </div>

//                     </div>

//                 </div>


//                 <div className="col-6 col-xl-3">

//                     <div className="rems-stat-card rems-resident-stat-card">

//                         <div className="rems-stat-icon">

//                             <BsPeople />

//                         </div>


//                         <div className="rems-stat-content">

//                             <div className="rems-stat-label">

//                                 Visitors

//                             </div>


//                             <div className="rems-stat-value">

//                                 {
//                                     statistics.visitors
//                                 }

//                             </div>


//                             <div className="small text-muted">

//                                 {
//                                     statistics.activeVisitors
//                                 }

//                                 {" inside"}

//                             </div>

//                         </div>

//                     </div>

//                 </div>


//                 <div className="col-6 col-xl-3">

//                     <div className="rems-stat-card rems-resident-stat-card">

//                         <div className="rems-stat-icon">

//                             <BsCalendar3 />

//                         </div>


//                         <div className="rems-stat-content">

//                             <div className="rems-stat-label">

//                                 Facility Bookings

//                             </div>


//                             <div className="rems-stat-value">

//                                 {
//                                     statistics.facilityBookings
//                                 }

//                             </div>


//                             <div className="small text-muted">

//                                 {
//                                     statistics.activeFacilityBookings
//                                 }

//                                 {" active"}

//                             </div>

//                         </div>

//                     </div>

//                 </div>

//             </div>


//             {/* =================================================
//                 QUICK ACTIONS
//             ================================================= */}

//             <div className="rems-glass-card mb-3">

//                 <div className="rems-card-header">

//                     <div>

//                         <div className="rems-page-eyebrow">

//                             QUICK ACTIONS

//                         </div>


//                         <div className="rems-card-title">

//                             Manage Your Residence

//                         </div>

//                     </div>

//                 </div>


//                 <div className="p-2 p-md-3">

//                     <div className="row g-2">

//                         {quickActions.map(
//                             action => (

//                                 <div
//                                     className="col-12 col-md-6 col-xl-3"
//                                     key={
//                                         action.path
//                                     }
//                                 >

//                                     <button
//                                         type="button"
//                                         className="w-100 text-start border-0 bg-transparent p-0"
//                                         onClick={() =>
//                                             navigate(
//                                                 action.path
//                                             )
//                                         }
//                                     >

//                                         <div className="rems-action-card rems-resident-action">

//                                             <div className="rems-action-icon">

//                                                 {
//                                                     action.icon
//                                                 }

//                                             </div>


//                                             <div className="min-width-0 flex-grow-1">

//                                                 <div className="rems-table-primary text-truncate">

//                                                     {
//                                                         action.label
//                                                     }

//                                                 </div>


//                                                 <div className="rems-table-secondary text-truncate">

//                                                     {
//                                                         action.description
//                                                     }

//                                                 </div>

//                                             </div>


//                                             <BsChevronRight className="ms-auto flex-shrink-0" />

//                                         </div>

//                                     </button>

//                                 </div>

//                             )
//                         )}

//                     </div>

//                 </div>

//             </div>


//             {/* =================================================
//                 ANNOUNCEMENTS + FACILITY BOOKINGS
//             ================================================= */}

//             <div className="row g-3 mb-3">


//                 {/* =============================================
//                     ANNOUNCEMENTS
//                 ============================================= */}

//                 <div className="col-12 col-xl-6">

//                     <div className="rems-glass-card h-100">

//                         <div className="rems-card-header">

//                             <div>

//                                 <div className="rems-page-eyebrow">

//                                     COMMUNITY

//                                 </div>


//                                 <div className="rems-card-title">

//                                     Community Announcements

//                                 </div>


//                                 <div className="rems-card-subtitle">

//                                     Important notices and community updates.

//                                 </div>

//                             </div>


//                             <button
//                                 type="button"
//                                 className="btn btn-link p-0 text-decoration-none small"
//                                 onClick={() =>
//                                     navigate(
//                                         `${portalPrefix}/announcements`
//                                     )
//                                 }
//                             >

//                                 View all

//                                 <BsChevronRight className="ms-1" />

//                             </button>

//                         </div>


//                         <div className="p-2 p-md-3">

//                             {recentAnnouncements.length ===
//                             0 ? (

//                                 <div className="rems-empty-state py-3">

//                                     <div className="rems-empty-icon">

//                                         <BsMegaphone />

//                                     </div>


//                                     <div className="rems-empty-title">

//                                         No announcements

//                                     </div>


//                                     <div className="rems-empty-text">

//                                         Community notices will appear here.

//                                     </div>

//                                 </div>

//                             ) : (

//                                 <div className="d-flex flex-column gap-2">

//                                     {recentAnnouncements.map(
//                                         announcement => (

//                                             <button
//                                                 key={
//                                                     announcement.id
//                                                 }
//                                                 type="button"
//                                                 className="w-100 border-0 text-start rounded-3 p-3 rems-dashboard-announcement"
//                                                 style={{
//                                                     background:
//                                                         "rgba(15,23,42,.025)",
//                                                 }}
//                                                 onClick={() =>
//                                                     navigate(
//                                                         `${portalPrefix}/announcements/${announcement.id}`
//                                                     )
//                                                 }
//                                             >

//                                                 <div className="d-flex align-items-start gap-3">

//                                                     <div className="rems-action-icon">

//                                                         <BsMegaphone />

//                                                     </div>


//                                                     <div className="min-width-0 flex-grow-1">

//                                                         <div className="d-flex align-items-center gap-2 flex-wrap">

//                                                             <div className="rems-table-primary">

//                                                                 {
//                                                                     announcement.title
//                                                                 }

//                                                             </div>


//                                                             {(announcement.category_display ||
//                                                             announcement.category) && (

//                                                                 <span className="rems-status-badge rems-status-secondary">

//                                                                     {
//                                                                         announcement.category_display ||
//                                                                         announcement.category
//                                                                     }

//                                                                 </span>

//                                                             )}

//                                                         </div>


//                                                         <div
//                                                             className="rems-table-secondary mt-1"
//                                                             style={{
//                                                                 display:
//                                                                     "-webkit-box",

//                                                                 WebkitLineClamp:
//                                                                     2,

//                                                                 WebkitBoxOrient:
//                                                                     "vertical",

//                                                                 overflow:
//                                                                     "hidden",
//                                                             }}
//                                                         >

//                                                             {
//                                                                 announcement.content
//                                                             }

//                                                         </div>


//                                                         <div className="small text-muted mt-2">

//                                                             {
//                                                                 announcement.published_at
//                                                                     ? new Date(
//                                                                         announcement.published_at
//                                                                     ).toLocaleDateString()
//                                                                     : "Recently published"
//                                                             }

//                                                         </div>

//                                                     </div>


//                                                     <BsChevronRight className="ms-auto flex-shrink-0 mt-1" />

//                                                 </div>

//                                             </button>

//                                         )
//                                     )}

//                                 </div>

//                             )}

//                         </div>

//                     </div>

//                 </div>


//                 {/* =============================================
//                     FACILITY BOOKINGS
//                 ============================================= */}

//                 <div className="col-12 col-xl-6">

//                     <div className="rems-glass-card h-100">

//                         <div className="rems-card-header">

//                             <div>

//                                 <div className="rems-page-eyebrow">

//                                     ORES FACILITIES

//                                 </div>


//                                 <div className="rems-card-title">

//                                     Recent Facility Reservations

//                                 </div>


//                                 <div className="rems-card-subtitle">

//                                     Monitor reservation and payment progress.

//                                 </div>

//                             </div>


//                             <button
//                                 type="button"
//                                 className="rems-secondary-button"
//                                 onClick={() =>
//                                     navigate(
//                                         `${portalPrefix}/facilities/bookings`
//                                     )
//                                 }
//                             >

//                                 View all

//                                 <BsChevronRight />

//                             </button>

//                         </div>


//                         <div className="p-2 p-md-3">

//                             {recentFacilityBookings.length ===
//                             0 ? (

//                                 <div className="rems-empty-state py-3">

//                                     <div className="rems-empty-icon">

//                                         <BsCalendar3 />

//                                     </div>


//                                     <div className="rems-empty-title">

//                                         No facility reservations

//                                     </div>


//                                     <div className="rems-empty-text">

//                                         Reserve a community facility for your
//                                         next event or activity.

//                                     </div>


//                                     <button
//                                         type="button"
//                                         className="rems-primary-button mt-2"
//                                         onClick={() =>
//                                             navigate(
//                                                 `${portalPrefix}/facilities`
//                                             )
//                                         }
//                                     >

//                                         <BsPlusLg />

//                                         Reserve Facility

//                                     </button>

//                                 </div>

//                             ) : (

//                                 <div className="d-flex flex-column gap-2">

//                                     {recentFacilityBookings.map(
//                                         booking => {

//                                             const requirements =
//                                                 getFacilityRequirementState(
//                                                     booking
//                                                 );


//                                             const bookingStatus =
//                                                 normalizeStatus(
//                                                     booking?.status
//                                                 );


//                                             return (

//                                                 <button
//                                                     key={
//                                                         booking.id
//                                                     }
//                                                     type="button"
//                                                     className="w-100 border-0 text-start rounded-3 p-3 rems-dashboard-booking-item"
//                                                     style={{
//                                                         background:
//                                                             "rgba(15,23,42,.025)",
//                                                     }}
//                                                     onClick={() =>
//                                                         navigate(
//                                                             `${portalPrefix}/facilities/bookings/${booking.id}`
//                                                         )
//                                                     }
//                                                 >

//                                                     <div className="d-flex justify-content-between align-items-start gap-3">

//                                                         <div className="min-width-0">

//                                                             <div className="rems-table-primary text-truncate">

//                                                                 {
//                                                                     booking.facility_name ||
//                                                                     "Facility"
//                                                                 }

//                                                             </div>


//                                                             <div className="rems-table-secondary mt-1">

//                                                                 {
//                                                                     booking.booking_date ||
//                                                                     "—"
//                                                                 }

//                                                                 {" · "}

//                                                                 {
//                                                                     booking.start_time ||
//                                                                     "—"
//                                                                 }

//                                                                 {" — "}

//                                                                 {
//                                                                     booking.end_time ||
//                                                                     "—"
//                                                                 }

//                                                             </div>


//                                                             <div className="d-flex align-items-center gap-2 flex-wrap mt-2">

//                                                                 <span
//                                                                     className={`rems-status-badge ${
//                                                                         requirements.reservationForm
//                                                                             ? "rems-status-success"
//                                                                             : "rems-status-warning"
//                                                                     }`}
//                                                                     title={
//                                                                         requirements.reservationForm
//                                                                             ? "Reservation form uploaded"
//                                                                             : "Reservation form required"
//                                                                     }
//                                                                 >

//                                                                     <BsFileEarmarkCheck />

//                                                                 </span>


//                                                                 <span
//                                                                     className={`rems-status-badge ${
//                                                                         requirements.paymentVerified

//                                                                             ? "rems-status-success"

//                                                                             : requirements.paymentPending

//                                                                                 ? "rems-status-warning"

//                                                                                 : requirements.paymentRejected

//                                                                                     ? "rems-status-danger"

//                                                                                     : "rems-status-warning"
//                                                                     }`}
//                                                                     title={
//                                                                         requirements.paymentVerified

//                                                                             ? "Payment verified"

//                                                                             : requirements.paymentPending

//                                                                                 ? "Payment submitted and awaiting verification"

//                                                                                 : requirements.paymentRejected

//                                                                                     ? "Payment rejected; resubmission required"

//                                                                                     : "Payment proof required"
//                                                                     }
//                                                                 >

//                                                                     <BsCreditCard />

//                                                                 </span>

//                                                             </div>

//                                                         </div>


//                                                         <div className="d-flex flex-column align-items-end gap-2 flex-shrink-0">

//                                                             <span
//                                                                 className={`rems-status-badge ${
//                                                                     getFacilityStatusClass(
//                                                                         bookingStatus
//                                                                     )
//                                                                 }`}
//                                                             >

//                                                                 <span className="rems-status-dot" />

//                                                                 {
//                                                                     booking.status_display ||
//                                                                     bookingStatus ||
//                                                                     "—"
//                                                                 }

//                                                             </span>


//                                                             <BsChevronRight />

//                                                         </div>

//                                                     </div>

//                                                 </button>

//                                             );

//                                         }
//                                     )}

//                                 </div>

//                             )}

//                         </div>

//                     </div>

//                 </div>

//             </div>


//             {/* =================================================
//                 RECENT VISITORS
//             ================================================= */}

//             <div className="rems-glass-card mb-3">

//                 <div className="rems-card-header">

//                     <div>

//                         <div className="rems-page-eyebrow">

//                             SECURITY

//                         </div>


//                         <div className="rems-card-title">

//                             Recent Visitors

//                         </div>


//                         <div className="rems-card-subtitle">

//                             Recent visitor activity.

//                         </div>

//                     </div>


//                     <button
//                         type="button"
//                         className="rems-secondary-button"
//                         onClick={() =>
//                             navigate(
//                                 `${portalPrefix}/visitors`
//                             )
//                         }
//                     >

//                         Manage

//                         <BsChevronRight />

//                     </button>

//                 </div>


//                 {recentVisitors.length ===
//                 0 ? (

//                     <div className="rems-empty-state py-4">

//                         <div className="rems-empty-icon">

//                             <BsPeople />

//                         </div>


//                         <div className="rems-empty-title">

//                             No recent visitors

//                         </div>


//                         <div className="rems-empty-text">

//                             Visitor authorizations will appear here.

//                         </div>


//                         <button
//                             type="button"
//                             className="rems-primary-button mt-2"
//                             onClick={() =>
//                                 navigate(
//                                     `${portalPrefix}/visitors`
//                                 )
//                             }
//                         >

//                             <BsPlusLg />

//                             Invite Visitor

//                         </button>

//                     </div>

//                 ) : (

//                     <div className="rems-table-wrapper">

//                         <table className="table rems-table rems-resident-table align-middle mb-0">

//                             <thead>

//                                 <tr>

//                                     <th>

//                                         Visitor

//                                     </th>


//                                     <th>

//                                         Date

//                                     </th>


//                                     <th>

//                                         Status

//                                     </th>

//                                 </tr>

//                             </thead>


//                             <tbody>

//                                 {recentVisitors.map(
//                                     visitor => (

//                                         <tr
//                                             key={
//                                                 visitor.id
//                                             }
//                                         >

//                                             <td data-label="Visitor">

//                                                 <div className="rems-table-primary">

//                                                     {
//                                                         visitor.name ||
//                                                         visitor.visitor_name ||
//                                                         [
//                                                             visitor.first_name,
//                                                             visitor.last_name,
//                                                         ]
//                                                             .filter(Boolean)
//                                                             .join(" ") ||
//                                                         "Visitor"
//                                                     }

//                                                 </div>

//                                             </td>


//                                             <td data-label="Visit Date">

//                                                 {
//                                                     visitor.visit_date ||
//                                                     visitor.date ||
//                                                     visitor.scheduled_date ||
//                                                     "—"
//                                                 }

//                                             </td>


//                                             <td data-label="Status">

//                                                 {
//                                                     getVisitorStatus(
//                                                         visitor
//                                                     )
//                                                 }

//                                             </td>

//                                         </tr>

//                                     )
//                                 )}

//                             </tbody>

//                         </table>

//                     </div>

//                 )}

//             </div>


//             {/* =================================================
//                 PROPERTY + ACCESS
//             ================================================= */}

//             <div className="row g-3">


//                 {/* =============================================
//                     PROPERTY
//                 ============================================= */}

//                 <div className="col-12 col-lg-7">

//                     <div className="rems-glass-card h-100">

//                         <div className="rems-card-header">

//                             <div>

//                                 <div className="rems-page-eyebrow">

//                                     RESIDENCE

//                                 </div>


//                                 <div className="rems-card-title">

//                                     Property Information

//                                 </div>

//                             </div>

//                         </div>


//                         <div className="p-2 p-md-3">

//                             {primaryProperty ? (

//                                 <div className="row g-2">


//                                     <div className="col-12">

//                                         <div className="rems-property-info-card rems-resident-property-item">

//                                             <div className="rems-property-detail-icon">

//                                                 <BsBuilding />

//                                             </div>


//                                             <div className="min-width-0">

//                                                 <div className="rems-table-secondary">

//                                                     Property

//                                                 </div>


//                                                 <div className="rems-table-primary text-truncate">

//                                                     {
//                                                         propertyName
//                                                     }

//                                                 </div>

//                                             </div>

//                                         </div>

//                                     </div>


//                                     <div className="col-4">

//                                         <div className="rems-property-info-card rems-resident-property-item">

//                                             <div>

//                                                 <div className="rems-table-secondary">

//                                                     Block

//                                                 </div>


//                                                 <div className="rems-table-primary">

//                                                     {
//                                                         primaryProperty.block ||
//                                                         "—"
//                                                     }

//                                                 </div>

//                                             </div>

//                                         </div>

//                                     </div>


//                                     <div className="col-4">

//                                         <div className="rems-property-info-card rems-resident-property-item">

//                                             <div>

//                                                 <div className="rems-table-secondary">

//                                                     Lot

//                                                 </div>


//                                                 <div className="rems-table-primary">

//                                                     {
//                                                         primaryProperty.lot ||
//                                                         "—"
//                                                     }

//                                                 </div>

//                                             </div>

//                                         </div>

//                                     </div>


//                                     <div className="col-4">

//                                         <div className="rems-property-info-card rems-resident-property-item">

//                                             <div>

//                                                 <div className="rems-table-secondary">

//                                                     Status

//                                                 </div>


//                                                 <div className="rems-table-primary text-truncate">

//                                                     {
//                                                         primaryProperty.status_display ||
//                                                         String(
//                                                             primaryProperty.status ||
//                                                             ""
//                                                         )
//                                                             .replace(
//                                                                 /_/g,
//                                                                 " "
//                                                             ) ||
//                                                         "—"
//                                                     }

//                                                 </div>

//                                             </div>

//                                         </div>

//                                     </div>


//                                     <div className="col-12 d-flex justify-content-end">

//                                         <button
//                                             type="button"
//                                             className="rems-secondary-button"
//                                             onClick={() =>
//                                                 navigate(
//                                                     isHomeowner
//                                                         ? "/homeowner/properties"
//                                                         : "/tenant/property"
//                                                 )
//                                             }
//                                         >

//                                             View Details

//                                             <BsChevronRight />

//                                         </button>

//                                     </div>

//                                 </div>

//                             ) : (

//                                 <div className="rems-empty-state py-3">

//                                     <div className="rems-empty-icon">

//                                         <BsBuilding />

//                                     </div>


//                                     <div className="rems-empty-title">

//                                         Property unavailable

//                                     </div>


//                                     <div className="rems-empty-text">

//                                         No authorized property is currently
//                                         associated with your account.

//                                     </div>

//                                 </div>

//                             )}

//                         </div>

//                     </div>

//                 </div>


//                 {/* =============================================
//                     ACCESS + FACILITY SUMMARY
//                 ============================================= */}

//                 <div className="col-12 col-lg-5">

//                     <div className="rems-glass-card h-100">

//                         <div className="rems-card-header">

//                             <div>

//                                 <div className="rems-page-eyebrow">

//                                     COMMUNITY ACCESS

//                                 </div>


//                                 <div className="rems-card-title">

//                                     Access & Security

//                                 </div>

//                             </div>

//                         </div>


//                         <div className="p-2 p-md-3">

//                             <div className="d-flex flex-column gap-2">


//                                 <div className="rems-property-info-card rems-resident-access-item">

//                                     <div className="rems-property-detail-icon">

//                                         <BsShieldCheck />

//                                     </div>


//                                     <div className="min-width-0">

//                                         <div className="rems-table-primary">

//                                             Motorist Access

//                                         </div>


//                                         <div className="rems-table-secondary">

//                                             {
//                                                 statistics.activeStickers
//                                             }

//                                             {" active sticker"}

//                                             {
//                                                 statistics.activeStickers ===
//                                                 1
//                                                     ? ""
//                                                     : "s"
//                                             }

//                                             {" authorize vehicle access."}

//                                         </div>

//                                     </div>

//                                 </div>


//                                 <div className="rems-property-info-card rems-resident-access-item">

//                                     <div className="rems-property-detail-icon">

//                                         <BsPersonCheck />

//                                     </div>


//                                     <div className="min-width-0">

//                                         <div className="rems-table-primary">

//                                             Visitor Authorization

//                                         </div>


//                                         <div className="rems-table-secondary">

//                                             Register visitors before arrival.

//                                         </div>

//                                     </div>

//                                 </div>


//                                 <div className="rems-property-info-card rems-resident-access-item">

//                                     <div className="rems-property-detail-icon">

//                                         <BsCalendar3 />

//                                     </div>


//                                     <div className="min-width-0 flex-grow-1">

//                                         <div className="rems-table-primary">

//                                             Facility Reservations

//                                         </div>


//                                         <div className="rems-table-secondary">

//                                             {
//                                                 statistics.activeFacilityBookings
//                                             }

//                                             {" active reservation"}

//                                             {
//                                                 statistics.activeFacilityBookings ===
//                                                 1
//                                                     ? ""
//                                                     : "s"
//                                             }

//                                         </div>

//                                     </div>


//                                     <button
//                                         type="button"
//                                         className="btn btn-link p-0 text-decoration-none"
//                                         onClick={() =>
//                                             navigate(
//                                                 `${portalPrefix}/facilities/bookings`
//                                             )
//                                         }
//                                     >

//                                         View

//                                     </button>

//                                 </div>


//                                 <div className="rems-property-info-card rems-resident-access-item">

//                                     <div className="rems-property-detail-icon">

//                                         <BsCreditCard />

//                                     </div>


//                                     <div className="min-width-0">

//                                         <div className="rems-table-primary">

//                                             Payment Verification

//                                         </div>


//                                         <div className="rems-table-secondary">

//                                             Facility payments are reviewed
//                                             separately by ORES administration.

//                                         </div>

//                                     </div>

//                                 </div>


//                                 {statistics.pendingFacilityBookings >
//                                 0 && (

//                                     <div className="alert alert-warning rems-alert mb-0">

//                                         <BsClockHistory className="me-2" />

//                                         {
//                                             statistics.pendingFacilityBookings
//                                         }

//                                         {" facility booking"}

//                                         {
//                                             statistics.pendingFacilityBookings ===
//                                             1
//                                                 ? ""
//                                                 : "s"
//                                         }

//                                         {" "}
//                                         awaiting approval.

//                                     </div>

//                                 )}


//                                 {statistics.expiredFacilityBookings >
//                                 0 && (

//                                     <div className="alert alert-secondary rems-alert mb-0">

//                                         <BsClockHistory className="me-2" />

//                                         {
//                                             statistics.expiredFacilityBookings
//                                         }

//                                         {" expired facility reservation"}

//                                         {
//                                             statistics.expiredFacilityBookings ===
//                                             1
//                                                 ? ""
//                                                 : "s"
//                                         }

//                                         {" remain in your history."}

//                                     </div>

//                                 )}

//                             </div>

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

//                 Community access, visitor,
//                 vehicle, and facility information
//                 is synchronized with ORES services.

//                 {" "}

//                 Facility payment verification is
//                 performed separately by administration.

//             </div>

//         </div>

//     );

// }