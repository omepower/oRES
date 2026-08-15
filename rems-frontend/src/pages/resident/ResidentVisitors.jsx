
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsPeople,
    BsPlusLg,
} from "react-icons/bs";

import {
    getMyVisitorInvitations,
    cancelVisitorInvitation,
    generateVisitorQr,
} from "../../api/visitors";

import ResidentVisitorInvitationModal
    from "../../components/visitors/ResidentVisitorInvitationModal";

import VisitorQrModal
    from "../../components/visitors/VisitorQrModal";

import VisitorDetailsModal
    from "../../components/visitors/VisitorDetailsModal";


export default function ResidentVisitors() {

    const [
        invitations,
        setInvitations,
    ] = useState([]);

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
        search,
        setSearch,
    ] = useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState("ALL");

    const [
        showCreateModal,
        setShowCreateModal,
    ] = useState(false);

    const [
        showQrModal,
        setShowQrModal,
    ] = useState(false);

    const [
        showDetailsModal,
        setShowDetailsModal,
    ] = useState(false);

    const [
        selectedInvitation,
        setSelectedInvitation,
    ] = useState(null);

    const [
        qrValue,
        setQrValue,
    ] = useState("");

    const [
        processingId,
        setProcessingId,
    ] = useState(null);

    const [
        confirmation,
        setConfirmation,
    ] = useState(null);


    /* =========================================================
       LOAD INVITATIONS
    ========================================================= */

    const loadInvitations = useCallback(
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

                const response =
                    await getMyVisitorInvitations();

                const data =
                    Array.isArray(response)
                        ? response
                        : response?.results ||
                          response?.invitations ||
                          [];

                setInvitations(data);

            } catch (err) {

                console.error(
                    "[Resident Visitors] Failed to load:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to load your visitor invitations."
                );

                setInvitations([]);

            } finally {

                setLoading(false);
                setRefreshing(false);

            }
        },
        []
    );


    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    useEffect(() => {

        loadInvitations();

    }, [
        loadInvitations,
    ]);


    /* =========================================================
       FILTERING
    ========================================================= */

    const filteredInvitations =
        useMemo(
            () => {

                const text =
                    search
                        .trim()
                        .toLowerCase();

                return invitations.filter(
                    (invitation) => {

                        const visitorName =
                            String(
                                invitation?.visitor_name ||
                                ""
                            ).toLowerCase();

                        const visitorPhone =
                            String(
                                invitation?.visitor_phone ||
                                ""
                            ).toLowerCase();

                        const propertyAddress =
                            String(
                                invitation?.property_address ||
                                ""
                            ).toLowerCase();

                        const matchesSearch =
                            !text ||
                            visitorName.includes(text) ||
                            visitorPhone.includes(text) ||
                            propertyAddress.includes(text);

                        const matchesStatus =
                            statusFilter === "ALL" ||
                            invitation.status === statusFilter;

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

    const statistics =
        useMemo(
            () => {

                const today =
                    new Date()
                        .toISOString()
                        .split("T")[0];

                return {

                    total:
                        invitations.length,

                    pending:
                        invitations.filter(
                            (item) =>
                                item.status === "PENDING"
                        ).length,

                    today:
                        invitations.filter(
                            (item) =>
                                item.visit_date === today
                        ).length,

                    qrReady:
                        invitations.filter(
                            (item) =>
                                Boolean(
                                    item.qr_generated_at
                                )
                        ).length,

                };

            },
            [
                invitations,
            ]
        );


    /* =========================================================
       STATUS
    ========================================================= */

    const getStatusClass = (
        status
    ) => {

        switch (status) {

            case "PENDING":
                return "rems-status-warning";

            case "APPROVED":
            case "EXPECTED":
            case "USED":
            case "INSIDE":
            case "COMPLETED":
                return "rems-status-success";

            case "EXPIRED":
                return "rems-status-secondary";

            case "CANCELLED":
            case "REJECTED":
                return "rems-status-danger";

            default:
                return "rems-status-secondary";

        }
    };


    /* =========================================================
       CREATE SUCCESS
    ========================================================= */

    const handleCreated = async () => {

        setShowCreateModal(false);

        setShowDetailsModal(false);
        setShowQrModal(false);
        setConfirmation(null);

        setSelectedInvitation(null);
        setQrValue("");

        await loadInvitations();

    };


    /* =========================================================
       OPEN DETAILS
    ========================================================= */

    const handleViewDetails = (
        invitation
    ) => {

        if (!invitation?.id) {
            return;
        }

        /*
         * Only the Details modal may remain open.
         */

        setShowCreateModal(false);
        setShowQrModal(false);
        setConfirmation(null);

        setQrValue("");

        setSelectedInvitation(
            invitation
        );

        setShowDetailsModal(
            true
        );

    };


    /* =========================================================
       OPEN / VIEW QR
    ========================================================= */

    const handleViewQr = (
        invitation
    ) => {

        if (!invitation?.id) {
            return;
        }

        /*
         * Only the QR modal may remain open.
         */

        setShowCreateModal(false);
        setShowDetailsModal(false);
        setConfirmation(null);

        setSelectedInvitation(
            invitation
        );

        setQrValue(
            invitation.invitation_code ||
            ""
        );

        setShowQrModal(
            true
        );

    };


    /* =========================================================
       GENERATE QR
    ========================================================= */

    const handleGenerateQr = async (
        invitation
    ) => {

        if (!invitation?.id) {
            return;
        }

        /*
         * Close every other modal BEFORE
         * beginning the QR workflow.
         */

        setShowCreateModal(false);
        setShowDetailsModal(false);
        setConfirmation(null);

        /*
         * Clear previous modal data.
         */

        setShowQrModal(false);
        setSelectedInvitation(null);
        setQrValue("");

        setProcessingId(
            invitation.id
        );

        setError("");

        try {

            const response =
                await generateVisitorQr(
                    invitation.id
                );

            const updatedInvitation =
                response?.invitation ||
                invitation;

            const generatedValue =
                response?.qr_value ||
                updatedInvitation?.invitation_code ||
                "";

            /*
             * Store the new QR data.
             */

            setSelectedInvitation(
                updatedInvitation
            );

            setQrValue(
                generatedValue
            );

            /*
             * IMPORTANT:
             * Explicitly close Details and then
             * open QR.
             */

            setShowDetailsModal(false);

            setShowQrModal(true);

            /*
             * Refresh the table without changing
             * the currently displayed QR modal.
             */

            await loadInvitations();

        } catch (err) {

            console.error(
                "[Resident Visitors] QR generation failed:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                "Unable to generate the visitor QR code."
            );

            setShowQrModal(false);

        } finally {

            setProcessingId(
                null
            );

        }

    };


    /* =========================================================
       CANCEL CONFIRMATION
    ========================================================= */

    const openCancelConfirmation = (
        invitation
    ) => {

        if (!invitation?.id) {
            return;
        }

        setShowCreateModal(false);
        setShowQrModal(false);
        setShowDetailsModal(false);

        setConfirmation({
            invitation,
            title:
                "Cancel Visitor Invitation",
            message:
                `Cancel the visitor invitation for "${invitation.visitor_name || "this visitor"}"?`,
            description:
                "The visitor will no longer be authorized under this invitation.",
        });

    };


    /* =========================================================
       EXECUTE CANCEL
    ========================================================= */

    const executeCancel = async () => {

        if (
            !confirmation?.invitation?.id
        ) {
            return;
        }

        const invitation =
            confirmation.invitation;

        setProcessingId(
            invitation.id
        );

        setError("");

        try {

            await cancelVisitorInvitation(
                invitation.id
            );

            setConfirmation(
                null
            );

            await loadInvitations();

        } catch (err) {

            console.error(
                "[Resident Visitors] Cancel failed:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                "Unable to cancel the invitation."
            );

        } finally {

            setProcessingId(
                null
            );

        }

    };


    /* =========================================================
       RENDER
    ========================================================= */

    return (

        <div className="rems-page-content">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">
                        RESIDENT PORTAL
                    </div>

                    <h1 className="rems-page-title">
                        My Visitors
                    </h1>

                    <p className="rems-page-description">
                        Create and manage visitor invitations
                        for your authorized property.
                    </p>

                </div>


                <div className="rems-page-header-actions">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() =>
                            loadInvitations(true)
                        }
                        disabled={refreshing}
                    >

                        <BsArrowClockwise />

                        {
                            refreshing
                                ? "Refreshing..."
                                : "Refresh"
                        }

                    </button>


                    <button
                        type="button"
                        className="rems-primary-button"
                        onClick={() => {

                            setShowQrModal(false);
                            setShowDetailsModal(false);
                            setConfirmation(null);

                            setSelectedInvitation(null);
                            setQrValue("");

                            setShowCreateModal(true);

                        }}
                    >

                        <BsPlusLg />

                        Invite Visitor

                    </button>

                </div>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div
                    className="alert alert-danger rems-alert mb-4"
                    role="alert"
                >

                    <i className="bi bi-exclamation-circle me-2" />

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
                                    statistics.total
                                }
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">
                            <i className="bi bi-clock-history" />
                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Pending
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.pending
                                }
                            </div>

                        </div>

                    </div>

                </div>


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
                                    statistics.today
                                }
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">
                            <i className="bi bi-qr-code" />
                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                QR Ready
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.qrReady
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
                            Visitor Invitations
                        </div>

                        <div className="rems-card-subtitle">
                            Your visitor authorizations and QR access.
                        </div>

                    </div>

                </div>


                {/* FILTERS */}

                <div className="rems-filter-bar">

                    <div className="rems-search-box">

                        <i className="bi bi-search" />

                        <input
                            type="search"
                            className="form-control"
                            placeholder="Search visitor or property..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    <select
                        className="form-select rems-filter-select"
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

                        <option value="PENDING">
                            Pending
                        </option>

                        <option value="APPROVED">
                            Approved
                        </option>

                        <option value="EXPECTED">
                            Expected
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
                        onClick={() => {

                            setSearch("");
                            setStatusFilter("ALL");

                        }}
                    >

                        <i className="bi bi-arrow-counterclockwise" />

                        Reset

                    </button>

                </div>


                {/* TABLE */}

                {loading ? (

                    <div className="rems-loading-state">

                        <div
                            className="spinner-border"
                            role="status"
                        />

                        <div className="mt-3">
                            Loading visitor invitations...
                        </div>

                    </div>

                ) : filteredInvitations.length === 0 ? (

                    <div className="rems-empty-state">

                        <div className="rems-empty-icon">
                            <BsPeople />
                        </div>

                        <div className="rems-empty-title">
                            No visitor invitations
                        </div>

                        <p className="rems-empty-text">
                            Create an invitation for your next visitor.
                        </p>

                        <button
                            type="button"
                            className="rems-primary-button mt-3"
                            onClick={() => {

                                setShowQrModal(false);
                                setShowDetailsModal(false);
                                setConfirmation(null);

                                setSelectedInvitation(null);
                                setQrValue("");

                                setShowCreateModal(true);

                            }}
                        >

                            <BsPlusLg />

                            Invite Visitor

                        </button>

                    </div>

                ) : (

                    <div className="rems-table-wrapper">

                        <table className="table rems-table align-middle mb-0">

                            <thead>

                                <tr>

                                    <th>
                                        Visitor
                                    </th>

                                    <th>
                                        Property
                                    </th>

                                    <th>
                                        Visit Date
                                    </th>

                                    <th>
                                        Expected Time
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

                                {filteredInvitations.map(
                                    (invitation) => (

                                        <tr
                                            key={
                                                invitation.id
                                            }
                                        >

                                            <td>

                                                <div className="rems-table-primary">
                                                    {
                                                        invitation.visitor_name ||
                                                        "Visitor"
                                                    }
                                                </div>

                                                <div className="rems-table-secondary">
                                                    {
                                                        invitation.visitor_phone ||
                                                        "No phone"
                                                    }
                                                </div>

                                            </td>


                                            <td>

                                                <div className="rems-table-primary">
                                                    {
                                                        invitation.property_address ||
                                                        "—"
                                                    }
                                                </div>

                                            </td>


                                            <td>

                                                {
                                                    invitation.visit_date ||
                                                    "—"
                                                }

                                            </td>


                                            <td>

                                                {
                                                    invitation.expected_time_in ||
                                                    "—"
                                                }

                                                {" — "}

                                                {
                                                    invitation.expected_time_out ||
                                                    "—"
                                                }

                                            </td>


                                            <td>

                                                <span
                                                    className={`rems-status-badge ${
                                                        getStatusClass(
                                                            invitation.status
                                                        )
                                                    }`}
                                                >

                                                    <span className="rems-status-dot" />

                                                    {
                                                        invitation.status_display ||
                                                        invitation.status ||
                                                        "—"
                                                    }

                                                </span>

                                            </td>


                                            <td>

                                                <div className="d-flex justify-content-end gap-1">


                                                    {/* GENERATE QR */}

                                                    {invitation.status ===
                                                        "PENDING" && (

                                                        <button
                                                            type="button"
                                                            className="rems-icon-button"
                                                            title="Generate QR"
                                                            disabled={
                                                                processingId ===
                                                                invitation.id
                                                            }
                                                            onClick={() =>
                                                                handleGenerateQr(
                                                                    invitation
                                                                )
                                                            }
                                                        >

                                                            {
                                                                processingId ===
                                                                invitation.id
                                                                    ? (
                                                                        <span
                                                                            className="spinner-border spinner-border-sm"
                                                                            aria-hidden="true"
                                                                        />
                                                                    )
                                                                    : (
                                                                        <i className="bi bi-qr-code" />
                                                                    )
                                                            }

                                                        </button>

                                                    )}


                                                    {/* VIEW QR */}

                                                    {invitation.qr_generated_at && (

                                                        <button
                                                            type="button"
                                                            className="rems-icon-button"
                                                            title="View QR"
                                                            onClick={() =>
                                                                handleViewQr(
                                                                    invitation
                                                                )
                                                            }
                                                        >

                                                            <i className="bi bi-eye" />

                                                        </button>

                                                    )}


                                                    {/* DETAILS */}

                                                    <button
                                                        type="button"
                                                        className="rems-icon-button"
                                                        title="View details"
                                                        onClick={() =>
                                                            handleViewDetails(
                                                                invitation
                                                            )
                                                        }
                                                    >

                                                        <i className="bi bi-info-circle" />

                                                    </button>


                                                    {/* CANCEL */}

                                                    {invitation.status ===
                                                        "PENDING" && (

                                                        <button
                                                            type="button"
                                                            className="rems-icon-button rems-action-danger"
                                                            title="Cancel invitation"
                                                            disabled={
                                                                processingId ===
                                                                invitation.id
                                                            }
                                                            onClick={() =>
                                                                openCancelConfirmation(
                                                                    invitation
                                                                )
                                                            }
                                                        >

                                                            <i className="bi bi-x-circle" />

                                                        </button>

                                                    )}

                                                </div>

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
                CREATE MODAL
            ================================================= */}

            <ResidentVisitorInvitationModal
                show={showCreateModal}
                onClose={() => {

                    setShowCreateModal(false);

                }}
                onCreated={
                    handleCreated
                }
            />


            {/* =================================================
                DETAILS MODAL
            ================================================= */}

            {showDetailsModal &&
                !showQrModal && (

                <VisitorDetailsModal
                    invitation={
                        selectedInvitation
                    }
                    visit={
                        null
                    }
                    onClose={() => {

                        setShowDetailsModal(false);

                        setSelectedInvitation(null);

                    }}
                />

            )}


            {/* =================================================
                QR MODAL
            ================================================= */}

            {showQrModal &&
                !showDetailsModal && (

                <VisitorQrModal
                    show={
                        showQrModal
                    }
                    invitation={
                        selectedInvitation
                    }
                    qrValue={
                        qrValue
                    }
                    onClose={() => {

                        setShowQrModal(false);

                        setSelectedInvitation(null);

                        setQrValue("");

                    }}
                />

            )}


            {/* =================================================
                CONFIRMATION MODAL
            ================================================= */}

            {confirmation && (

                <div
                    className="rems-modal-backdrop"
                    style={{
                        zIndex: 4000,
                    }}
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget &&
                            !processingId
                        ) {

                            setConfirmation(null);

                        }

                    }}
                >

                    <div
                        className="rems-modal rems-management-modal"
                        style={{
                            position: "relative",
                            zIndex: 4001,
                        }}
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="rems-modal-header">

                            <div>

                                <div className="rems-page-eyebrow">
                                    VISITOR MANAGEMENT
                                </div>

                                <div className="rems-modal-title">
                                    {
                                        confirmation.title
                                    }
                                </div>

                                <div className="rems-modal-subtitle">
                                    {
                                        confirmation.message
                                    }
                                </div>

                            </div>


                            <button
                                type="button"
                                className="rems-modal-close"
                                onClick={() =>
                                    setConfirmation(
                                        null
                                    )
                                }
                                disabled={
                                    Boolean(
                                        processingId
                                    )
                                }
                            >

                                <i className="bi bi-x-lg" />

                            </button>

                        </div>


                        <div className="rems-modal-body">

                            <div className="d-flex align-items-start gap-3">

                                <div
                                    className="d-flex align-items-center justify-content-center rounded-3"
                                    style={{
                                        width: "44px",
                                        height: "44px",
                                        flex: "0 0 44px",
                                        background:
                                            "rgba(220,53,69,.10)",
                                        color:
                                            "#b02a37",
                                    }}
                                >

                                    <i className="bi bi-x-circle" />

                                </div>


                                <div>

                                    <div className="fw-semibold mb-1">
                                        {
                                            confirmation.message
                                        }
                                    </div>

                                    <div className="small text-muted">
                                        {
                                            confirmation.description
                                        }
                                    </div>

                                </div>

                            </div>

                        </div>


                        <div className="rems-modal-footer">

                            <button
                                type="button"
                                className="rems-secondary-button"
                                onClick={() =>
                                    setConfirmation(null)
                                }
                                disabled={
                                    Boolean(
                                        processingId
                                    )
                                }
                            >

                                Keep Invitation

                            </button>


                            <button
                                type="button"
                                className="rems-primary-button bg-danger border-danger"
                                onClick={
                                    executeCancel
                                }
                                disabled={
                                    Boolean(
                                        processingId
                                    )
                                }
                            >

                                {processingId ? (

                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm"
                                            aria-hidden="true"
                                        />

                                        Cancelling...
                                    </>

                                ) : (

                                    <>
                                        <i className="bi bi-x-circle" />

                                        Cancel Invitation
                                    </>

                                )}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}
