import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    BsArrowClockwise,
    BsPeople,
    BsQrCodeScan,
    BsShieldCheck,
    BsClockHistory,
    BsDoorOpen,
    BsChevronRight,
} from "react-icons/bs";

import api from "../../api/axios";


// ============================================================
// SECURITY DASHBOARD
// ============================================================

export default function SecurityDashboard() {

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
        data,
        setData,
    ] = useState({

        visitorsInside:
            0,

        visitorsToday:
            0,

        completedToday:
            0,

        primaryGate:
            null,

        activeGates:
            0,

        recentVisits:
            [],

    });


    // ========================================================
    // NORMALIZE
    // ========================================================

    const normalize =
        (
            response
        ) => {

            if (
                Array.isArray(
                    response?.data
                )
            ) {

                return response.data;

            }


            return (
                response?.data?.results ||
                response?.data?.gates ||
                response?.data?.visits ||
                response?.data?.invitations ||
                []
            );

        };


    // ========================================================
    // LOAD DASHBOARD
    // ========================================================

    const loadDashboard =
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

                    const [
                        gatesResponse,
                        visitsResponse,
                        invitationsResponse,
                        completedTodayResponse,
                    ] = await Promise.all([

                        api.get(
                            "security/gates/"
                        ),

                        api.get(
                            "visitors/visitor-visits/"
                        ),

                        api.get(
                            "visitors/visitor-invitations/today/"
                        ),

                        api.get(
                            "visitors/visitor-visits/completed-today/"
                        ),

                    ]);


                    const gates =
                        normalize(
                            gatesResponse
                        );


                    const visits =
                        normalize(
                            visitsResponse
                        );


                    const invitations =
                        normalize(
                            invitationsResponse
                        );

                    const completedToday =
                        normalize(
                            completedTodayResponse
                        );


                    // ==================================================
                    // CURRENT VISITORS
                    // ==================================================

                    const inside =
                        visits.filter(
                            (
                                visit
                            ) =>
                                visit?.status ===
                                "INSIDE"
                        );


                    const completed =
                        visits.filter(
                            (
                                visit
                            ) =>
                                visit?.status ===
                                "COMPLETED"
                        );


                    // ==================================================
                    // PRIMARY GATE
                    // ==================================================

                    const primaryGate =
                        gates.find(
                            (
                                gate
                            ) =>
                                gate?.is_primary ===
                                true
                        ) ||
                        gates[0] ||
                        null;


                    // ==================================================
                    // RECENT VISITS
                    // ==================================================

                    const recentVisits =
                        [
                            ...visits,
                        ]
                            .sort(
                                (
                                    a,
                                    b
                                ) =>
                                    new Date(
                                        b?.time_in ||
                                        b?.created_at ||
                                        0
                                    ) -
                                    new Date(
                                        a?.time_in ||
                                        a?.created_at ||
                                        0
                                    )
                            )
                            .slice(
                                0,
                                5
                            );


                    // ==================================================
                    // STORE
                    // ==================================================

                    setData({

                        visitorsInside:
                            inside.length,

                        visitorsToday:
                            invitations.length,

                        completedToday:
                            completedToday.length,

                        primaryGate:

                            primaryGate,

                        activeGates:
                            gates.filter(
                                (
                                    gate
                                ) =>
                                    gate?.is_active ===
                                    true
                            ).length,

                        recentVisits:
                            recentVisits,

                    });

                } catch (
                    err
                ) {

                    console.error(
                        "[Security Dashboard]",
                        err
                    );


                    setError(
                        err?.response?.data?.detail ||
                        "Unable to load security dashboard."
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


    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {

        loadDashboard();

    }, [
        loadDashboard,
    ]);


    // ========================================================
    // LOADING
    // ========================================================

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

                        Loading security operations...

                    </div>

                </div>

            </div>

        );

    }


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div className="rems-page-content">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">

                        SECURITY OPERATIONS

                    </div>


                    <h1 className="rems-page-title">

                        Gate Dashboard

                    </h1>


                    <p className="rems-page-description">

                        Monitor visitor access and verify
                        QR-based entry at the gate.

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

                        <BsArrowClockwise />

                        {
                            refreshing
                                ? "Refreshing..."
                                : "Refresh"
                        }

                    </button>

                </div>

            </div>


            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

                <div className="alert alert-danger rems-alert mb-4">

                    {
                        error
                    }

                </div>

            )}


            {/* ==================================================
                QR SCANNER ACTION
            ================================================== */}

            <section className="rems-glass-card mb-4">

                <div className="p-3 p-md-4">

                    <div className="row align-items-center g-3">


                        <div className="col-12 col-lg-8">

                            <div className="d-flex align-items-center gap-3">

                                <div className="rems-stat-icon flex-shrink-0">

                                    <BsQrCodeScan />

                                </div>


                                <div className="min-width-0">

                                    <div className="rems-page-eyebrow mb-1">

                                        GATE ACCESS

                                    </div>


                                    <div className="rems-card-title">

                                        Scan Visitor QR

                                    </div>


                                    <div className="rems-card-subtitle">

                                        Verify the visitor invitation
                                        before allowing entry.

                                    </div>

                                </div>

                            </div>

                        </div>


                        <div className="col-12 col-lg-4">

                            <button
                                type="button"
                                className="rems-primary-button w-100"
                                onClick={() =>
                                    navigate(
                                        "/security/scan"
                                    )
                                }
                            >

                                <BsQrCodeScan />

                                Scan Visitor QR

                            </button>

                        </div>

                    </div>

                </div>

            </section>


            {/* ==================================================
                STATISTICS
            ================================================== */}

            <div className="row g-3 mb-4">


                <div className="col-6 col-xl-3">

                    <div className="rems-stat-card h-100">

                        <div className="rems-stat-icon">

                            <BsPeople />

                        </div>


                        <div className="rems-stat-content">

                            <div className="rems-stat-label">

                                Inside Now

                            </div>


                            <div className="rems-stat-value">

                                {
                                    data.visitorsInside
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

                                Expected Today

                            </div>


                            <div className="rems-stat-value">

                                {
                                    data.visitorsToday
                                }

                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-6 col-xl-3">

                    <div className="rems-stat-card h-100">

                        <div className="rems-stat-icon">

                            <BsDoorOpen />

                        </div>


                        <div className="rems-stat-content">

                            <div className="rems-stat-label">

                                Completed Today

                            </div>


                            <div className="rems-stat-value">

                                {
                                    data.completedToday
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

                                Active Gates

                            </div>


                            <div className="rems-stat-value">

                                {
                                    data.activeGates
                                }

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* ==================================================
                GATE STATUS + ACTIVITY
            ================================================== */}

            <div className="row g-3">


                {/* ==================================================
                    GATE STATUS
                ================================================== */}

                <div className="col-12 col-lg-5">

                    <div className="rems-glass-card h-100">

                        <div className="rems-card-header">

                            <div>

                                <div className="rems-page-eyebrow">

                                    GATE STATUS

                                </div>


                                <div className="rems-card-title">

                                    Current Gate

                                </div>


                                <div className="rems-card-subtitle">

                                    Current operating status.

                                </div>

                            </div>

                        </div>


                        <div className="p-3">

                            <div className="rems-property-info-card">

                                <div className="rems-property-detail-icon">

                                    <BsShieldCheck />

                                </div>


                                <div className="min-width-0">

                                    <div className="rems-table-secondary">

                                        Gate

                                    </div>


                                    <div className="rems-table-primary text-truncate">

                                        {
                                            data.primaryGate?.name ||
                                            "Primary Gate"
                                        }

                                    </div>


                                    <div className="rems-table-secondary">

                                        {
                                            data.activeGates > 0
                                                ? "Operational"
                                                : "No active gate"
                                        }

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* ==================================================
                    RECENT VISITOR ACTIVITY
                ================================================== */}

                <div className="col-12 col-lg-7">

                    <div className="rems-glass-card h-100">

                        <div className="rems-card-header">

                            <div>

                                <div className="rems-page-eyebrow">

                                    GATE ACTIVITY

                                </div>


                                <div className="rems-card-title">

                                    Recent Visitor Activity

                                </div>


                                <div className="rems-card-subtitle">

                                    Latest visitor entry records.

                                </div>

                            </div>


                            <button
                                type="button"
                                className="rems-secondary-button"
                                onClick={() =>
                                    navigate(
                                        "/security/history"
                                    )
                                }
                            >

                                View history

                                <BsChevronRight
                                    className="ms-1"
                                />

                            </button>

                        </div>


                        <div className="rems-table-wrapper">

                            <table className="table rems-table align-middle mb-0">

                                <thead>

                                    <tr>

                                        <th>
                                            Visitor
                                        </th>

                                        <th>
                                            Host / Property
                                        </th>

                                        <th>
                                            Gate
                                        </th>

                                        <th>
                                            Time In
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {
                                        data.recentVisits.length === 0
                                            ? (

                                                <tr>

                                                    <td
                                                        data-label=""
                                                        colSpan="5"
                                                        className="text-center text-muted py-4"
                                                    >

                                                        No gate activity yet.

                                                    </td>

                                                </tr>

                                            )
                                            : (

                                                data.recentVisits.map(
                                                    (
                                                        visit
                                                    ) => (

                                                        <tr
                                                            key={
                                                                visit.id
                                                            }
                                                        >


                                                            {/* VISITOR */}

                                                            <td data-label="Visitor">

                                                                <div className="rems-table-primary">

                                                                    {
                                                                        visit.visitor_name ||
                                                                        "Visitor"
                                                                    }

                                                                </div>


                                                                <div className="rems-table-secondary">

                                                                    {
                                                                        visit.visitor_phone ||
                                                                        "No phone"
                                                                    }

                                                                </div>

                                                            </td>


                                                            {/* HOST / PROPERTY */}

                                                            <td data-label="Host / Property">

                                                                <div className="rems-table-primary">

                                                                    {
                                                                        visit.host_name ||
                                                                        "Resident"
                                                                    }

                                                                </div>


                                                                <div className="rems-table-secondary">

                                                                    {
                                                                        visit.property_address ||
                                                                        "Property"
                                                                    }

                                                                </div>

                                                            </td>


                                                            {/* GATE */}

                                                            <td data-label="Gate">

                                                                {
                                                                    visit.gate_name ||
                                                                    "—"
                                                                }

                                                            </td>


                                                            {/* TIME */}

                                                            <td data-label="Time In">

                                                                {
                                                                    visit.time_in
                                                                        ? new Date(
                                                                            visit.time_in
                                                                        ).toLocaleTimeString(
                                                                            [],
                                                                            {
                                                                                hour:
                                                                                    "2-digit",

                                                                                minute:
                                                                                    "2-digit",
                                                                            }
                                                                        )
                                                                        : "—"
                                                                }

                                                            </td>


                                                            {/* STATUS */}

                                                            <td data-label="Status">

                                                                <span
                                                                    className={
                                                                        `rems-status-badge ${
                                                                            visit.status ===
                                                                            "COMPLETED"
                                                                                ? "rems-status-success"
                                                                                : visit.status ===
                                                                                    "INSIDE"
                                                                                    ? "rems-status-warning"
                                                                                    : "rems-status-secondary"
                                                                        }`
                                                                    }
                                                                >

                                                                    <span className="rems-status-dot" />

                                                                    {
                                                                        visit.status_display ||
                                                                        visit.status ||
                                                                        "—"
                                                                    }

                                                                </span>

                                                            </td>

                                                        </tr>

                                                    )
                                                )

                                            )
                                    }

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}