import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsEye,
    BsPeople,
    BsPersonCheck,
    BsDoorOpen,
    BsClockHistory,
    BsQrCode,
} from "react-icons/bs";

import {
    getVisitorInvitations,
    getVisitorVisits,
    getVisitorsInside,
    getCompletedVisitorVisits,
    cancelVisitorInvitation,
} from "../../api/visitors";

import VisitorTable
    from "../../components/visitors/VisitorTable";

import VisitorDetailsModal
    from "../../components/visitors/VisitorDetailsModal";

import VisitorQrModal
    from "../../components/visitors/VisitorQrModal";


export default function Visitors() {

    /* =========================================================
       DATA
    ========================================================= */

    const [
        invitations,
        setInvitations,
    ] = useState([]);


    const [
        visits,
        setVisits,
    ] = useState([]);


    const [
        visitorsInside,
        setVisitorsInside,
    ] = useState([]);


    const [
        completedVisits,
        setCompletedVisits,
    ] = useState([]);


    /* =========================================================
       PAGE STATE
    ========================================================= */

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


    /* =========================================================
       FILTERS
    ========================================================= */

    const [
        search,
        setSearch,
    ] = useState("");


    const [
        statusFilter,
        setStatusFilter,
    ] = useState("ALL");


    /* =========================================================
       DETAILS MODAL
    ========================================================= */

    const [
        showDetailsModal,
        setShowDetailsModal,
    ] = useState(false);


    const [
        selectedInvitation,
        setSelectedInvitation,
    ] = useState(null);


    const [
        selectedVisit,
        setSelectedVisit,
    ] = useState(null);


    /* =========================================================
       QR MODAL
    ========================================================= */

    const [
        showQrModal,
        setShowQrModal,
    ] = useState(false);


    const [
        qrInvitation,
        setQrInvitation,
    ] = useState(null);


    const [
        qrValue,
        setQrValue,
    ] = useState("");


    /* =========================================================
       PROCESSING
    ========================================================= */

    const [
        processingId,
        setProcessingId,
    ] = useState(null);


    /* =========================================================
       NORMALIZE API RESPONSE
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


        if (
            response &&
            Array.isArray(
                response.results
            )
        ) {

            return response.results;
        }


        return [];
    };


    /* =========================================================
       LOAD DATA
    ========================================================= */

    const loadVisitors = useCallback(
        async (
            silent = false
        ) => {

            if (silent) {

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
                    invitationsResponse,
                    visitsResponse,
                    insideResponse,
                    completedResponse,
                ] = await Promise.all([

                    getVisitorInvitations(),

                    getVisitorVisits(),

                    getVisitorsInside(),

                    getCompletedVisitorVisits(),

                ]);


                setInvitations(
                    normalize(
                        invitationsResponse
                    )
                );


                setVisits(
                    normalize(
                        visitsResponse
                    )
                );


                setVisitorsInside(
                    normalize(
                        insideResponse
                    )
                );


                setCompletedVisits(
                    normalize(
                        completedResponse
                    )
                );

            } catch (err) {

                console.error(
                    "Failed to load visitor administration data:",
                    err
                );


                setError(
                    err?.response?.data?.detail ||
                    err?.message ||
                    "Unable to load visitor activity."
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


    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    useEffect(() => {

        loadVisitors();

    }, [
        loadVisitors,
    ]);


    /* =========================================================
       FIND VISIT FOR INVITATION
    ========================================================= */

    const getVisitForInvitation =
        useCallback(
            (
                invitationId
            ) => {

                return visits.find(
                    (
                        visit
                    ) =>
                        visit?.invitation ===
                            invitationId ||
                        visit?.invitation?.id ===
                            invitationId
                ) || null;

            },
            [
                visits,
            ]
        );


    /* =========================================================
       OPEN DETAILS
    ========================================================= */

    const handleView = (
        invitation,
        visit = null
    ) => {

        setSelectedInvitation(
            invitation
        );


        setSelectedVisit(
            visit ||
            getVisitForInvitation(
                invitation?.id
            )
        );


        setShowDetailsModal(
            true
        );

    };


    /* =========================================================
       CLOSE DETAILS
    ========================================================= */

    const closeDetails = () => {

        setShowDetailsModal(
            false
        );


        setSelectedInvitation(
            null
        );


        setSelectedVisit(
            null
        );

    };


    /* =========================================================
       VIEW QR
    ========================================================= */

    const handleViewQr = (
        invitation
    ) => {

        if (!invitation) {

            return;

        }


        const value =
            invitation.invitation_code ||
            invitation.qr_value ||
            "";


        if (!value) {

            setError(
                "This invitation does not have a generated QR code."
            );

            return;

        }


        setQrInvitation(
            invitation
        );


        setQrValue(
            value
        );


        setShowQrModal(
            true
        );

    };


    /* =========================================================
       CLOSE QR
    ========================================================= */

    const closeQr = () => {

        setShowQrModal(
            false
        );


        setQrInvitation(
            null
        );


        setQrValue(
            ""
        );

    };


    /* =========================================================
       CANCEL INVITATION
    ========================================================= */

    const handleCancel = async (
        invitation
    ) => {

        if (
            !invitation?.id
        ) {

            return;

        }


        const confirmed =
            window.confirm(
                `Cancel the visitor invitation for ${invitation.visitor_name || "this visitor"}?`
            );


        if (!confirmed) {

            return;

        }


        setProcessingId(
            invitation.id
        );


        setError("");


        try {

            await cancelVisitorInvitation(
                invitation.id
            );


            await loadVisitors(
                true
            );

        } catch (err) {

            console.error(
                "Failed to cancel invitation:",
                err
            );


            setError(
                err?.response?.data?.detail ||
                "Unable to cancel the visitor invitation."
            );

        } finally {

            setProcessingId(
                null
            );

        }

    };


    /* =========================================================
       TODAY
    ========================================================= */

    const todayString =
        new Date()
            .toISOString()
            .split("T")[0];


    /* =========================================================
       FILTERED INVITATIONS
    ========================================================= */

    const filteredInvitations =
        useMemo(
            () => {

                const searchText =
                    search
                        .trim()
                        .toLowerCase();


                return invitations.filter(
                    (
                        invitation
                    ) => {

                        const visitorName =
                            invitation?.visitor_name
                                ?.toLowerCase() ||
                            "";


                        const visitorPhone =
                            invitation?.visitor_phone
                                ?.toLowerCase() ||
                            "";


                        const hostName =
                            invitation?.host_name
                                ?.toLowerCase() ||
                            invitation?.host_name_snapshot
                                ?.toLowerCase() ||
                            "";


                        const propertyAddress =
                            invitation?.property_address
                                ?.toLowerCase() ||
                            invitation?.host_address_snapshot
                                ?.toLowerCase() ||
                            "";


                        const matchesSearch =
                            !searchText ||
                            visitorName.includes(
                                searchText
                            ) ||
                            visitorPhone.includes(
                                searchText
                            ) ||
                            hostName.includes(
                                searchText
                            ) ||
                            propertyAddress.includes(
                                searchText
                            );


                        const matchesStatus =
                            statusFilter ===
                                "ALL" ||
                            invitation?.status ===
                                statusFilter;


                        return (
                            matchesSearch &&
                            matchesStatus
                        );

                    }
                );

            },
            [
                invitations,
                search,
                statusFilter,
            ]
        );


    /* =========================================================
       STATISTICS
    ========================================================= */

    const totalInvitations =
        invitations.length;


    const pendingInvitations =
        invitations.filter(
            (
                invitation
            ) =>
                invitation?.status ===
                "PENDING"
        ).length;


    const todayInvitations =
        invitations.filter(
            (
                invitation
            ) =>
                invitation?.visit_date ===
                todayString
        ).length;


    const insideCount =
        visitorsInside.length;


    const completedCount =
        completedVisits.length;


    const usedInvitations =
        invitations.filter(
            (
                invitation
            ) =>
                invitation?.status ===
                "USED"
        ).length;


    /* =========================================================
       RESET
    ========================================================= */

    const resetFilters = () => {

        setSearch("");

        setStatusFilter(
            "ALL"
        );

    };


    /* =========================================================
       RENDER
    ========================================================= */

    return (
        <div className="rems-page-content">


            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">
                        ADMINISTRATION
                    </div>


                    <h1 className="rems-page-title">
                        Visitors Management
                    </h1>


                    <p className="rems-page-description">

                        Monitor visitor invitations,
                        expected visits, arrivals,
                        and current visitor activity
                        across the subdivision.

                    </p>

                </div>


                <div className="rems-page-header-actions">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() =>
                            loadVisitors(
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

                        Refresh

                    </button>

                </div>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div
                    className="alert alert-warning rems-alert mb-4"
                    role="alert"
                >

                    <i className="bi bi-exclamation-triangle me-2" />

                    {error}


                    <button
                        type="button"
                        className="btn-close float-end"
                        aria-label="Close"
                        onClick={() =>
                            setError("")
                        }
                    />

                </div>

            )}


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="row g-3 mb-4">


                {/* TOTAL */}

                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <BsPeople />

                        </div>


                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Total Invitations
                            </div>


                            <div className="rems-stat-value">
                                {
                                    totalInvitations
                                }
                            </div>

                        </div>

                    </div>

                </div>


                {/* PENDING */}

                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <BsClockHistory />

                        </div>


                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Pending Invitations
                            </div>


                            <div className="rems-stat-value">
                                {
                                    pendingInvitations
                                }
                            </div>

                        </div>

                    </div>

                </div>


                {/* INSIDE */}

                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <BsDoorOpen />

                        </div>


                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Visitors Inside
                            </div>


                            <div className="rems-stat-value">
                                {
                                    insideCount
                                }
                            </div>

                        </div>

                    </div>

                </div>


                {/* TODAY */}

                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <i className="bi bi-calendar-event" />

                        </div>


                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Visits Today
                            </div>


                            <div className="rems-stat-value">
                                {
                                    todayInvitations
                                }
                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                LIVE ACTIVITY SUMMARY
            ================================================= */}

            <div className="row g-3 mb-4">

                <div className="col-12 col-md-6">

                    <div className="rems-glass-card">

                        <div className="rems-card-body">

                            <div className="d-flex align-items-center justify-content-between">

                                <div>

                                    <div className="rems-card-title">
                                        Visitor Activity
                                    </div>


                                    <div className="rems-card-subtitle">
                                        Current gate activity
                                    </div>

                                </div>


                                <div className="rems-stat-icon">

                                    <BsPersonCheck />

                                </div>

                            </div>


                            <div className="row g-3 mt-2">

                                <div className="col-6">

                                    <div
                                        style={{
                                            color:
                                                "#8993a2",
                                            fontSize:
                                                "0.72rem",
                                        }}
                                    >
                                        Currently Inside
                                    </div>


                                    <div
                                        style={{
                                            color:
                                                "#263143",
                                            fontSize:
                                                "1.35rem",
                                            fontWeight:
                                                700,
                                        }}
                                    >
                                        {
                                            insideCount
                                        }
                                    </div>

                                </div>


                                <div className="col-6">

                                    <div
                                        style={{
                                            color:
                                                "#8993a2",
                                            fontSize:
                                                "0.72rem",
                                        }}
                                    >
                                        Completed Visits
                                    </div>


                                    <div
                                        style={{
                                            color:
                                                "#263143",
                                            fontSize:
                                                "1.35rem",
                                            fontWeight:
                                                700,
                                        }}
                                    >
                                        {
                                            completedCount
                                        }
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-12 col-md-6">

                    <div className="rems-glass-card">

                        <div className="rems-card-body">

                            <div className="d-flex align-items-center justify-content-between">

                                <div>

                                    <div className="rems-card-title">
                                        Invitation Activity
                                    </div>


                                    <div className="rems-card-subtitle">
                                        Resident-generated visitor access
                                    </div>

                                </div>


                                <div className="rems-stat-icon">

                                    <BsQrCode />

                                </div>

                            </div>


                            <div className="row g-3 mt-2">

                                <div className="col-6">

                                    <div
                                        style={{
                                            color:
                                                "#8993a2",
                                            fontSize:
                                                "0.72rem",
                                        }}
                                    >
                                        Used Invitations
                                    </div>


                                    <div
                                        style={{
                                            color:
                                                "#263143",
                                            fontSize:
                                                "1.35rem",
                                            fontWeight:
                                                700,
                                        }}
                                    >
                                        {
                                            usedInvitations
                                        }
                                    </div>

                                </div>


                                <div className="col-6">

                                    <div
                                        style={{
                                            color:
                                                "#8993a2",
                                            fontSize:
                                                "0.72rem",
                                        }}
                                    >
                                        Today's Invitations
                                    </div>


                                    <div
                                        style={{
                                            color:
                                                "#263143",
                                            fontSize:
                                                "1.35rem",
                                            fontWeight:
                                                700,
                                        }}
                                    >
                                        {
                                            todayInvitations
                                        }
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                MAIN GLASS CARD
            ================================================= */}

            <div className="rems-glass-card">


                {/* =================================================
                    CARD HEADER
                ================================================= */}

                <div className="rems-card-header">

                    <div>

                        <div className="rems-card-title">
                            Visitor Invitations
                        </div>


                        <div className="rems-card-subtitle">

                            Resident-created invitations and
                            corresponding gate visits.

                        </div>

                    </div>


                    <div className="rems-card-header-icon">

                        <BsEye />

                    </div>

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
                            placeholder="Search visitors, hosts, properties..."
                            value={
                                search
                            }
                            onChange={(event) =>
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
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                    >

                        <option value="ALL">
                            All Invitation Statuses
                        </option>

                        <option value="PENDING">
                            Pending
                        </option>

                        <option value="USED">
                            Used
                        </option>

                        <option value="EXPIRED">
                            Expired
                        </option>

                        <option value="CANCELLED">
                            Cancelled
                        </option>

                    </select>


                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={
                            resetFilters
                        }
                    >

                        <i className="bi bi-arrow-counterclockwise" />

                        Reset

                    </button>

                </div>


                {/* =================================================
                    TABLE TOOLBAR
                ================================================= */}

                <div className="rems-table-toolbar">

                    <div>

                        <div className="rems-card-title">
                            Visitor Records
                        </div>


                        <div className="rems-card-subtitle">

                            {loading

                                ? "Loading records..."

                                : `${filteredInvitations.length} ${
                                      filteredInvitations.length ===
                                      1
                                          ? "invitation"
                                          : "invitations"
                                  } found`}

                        </div>

                    </div>


                    <div
                        className="small text-muted"
                    >

                        {search ||
                        statusFilter !==
                            "ALL"

                            ? "Filtered"

                            : "All records"}

                    </div>

                </div>


                {/* =================================================
                    TABLE
                ================================================= */}

                {loading ? (

                    <div className="rems-loading-state">

                        <div
                            className="spinner-border"
                            role="status"
                        />


                        <div className="mt-3">
                            Loading visitor records...
                        </div>

                    </div>

                ) : (

                    <VisitorTable
                        invitations={
                            filteredInvitations
                        }
                        visits={
                            visits
                        }
                        onView={
                            handleView
                        }
                    />

                )}

            </div>


            {/* =================================================
                DETAILS MODAL
            ================================================= */}

            {showDetailsModal && (

                <VisitorDetailsModal
                    invitation={
                        selectedInvitation
                    }
                    visit={
                        selectedVisit
                    }
                    onClose={
                        closeDetails
                    }
                />

            )}


            {/* =================================================
                QR MODAL
            ================================================= */}

            <VisitorQrModal
                show={
                    showQrModal
                }
                invitation={
                    qrInvitation
                }
                qrValue={
                    qrValue
                }
                onClose={
                    closeQr
                }
            />


            {/* =================================================
                ADMIN NOTE
            ================================================= */}

            {!loading &&
            filteredInvitations.length >
                0 && (

                <div
                    className="mt-3"
                    style={{
                        color:
                            "#929baa",
                        fontSize:
                            "0.68rem",
                    }}
                >

                    <i className="bi bi-info-circle me-1" />

                    Visitor invitations are created by
                    homeowners and tenants. Admin access
                    is provided for monitoring, security
                    oversight, and administrative intervention.

                </div>

            )}

        </div>
    );
}