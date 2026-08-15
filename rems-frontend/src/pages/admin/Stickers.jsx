import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsPlusLg,
    BsShieldCheck,
    BsCheckCircle,
    BsSlashCircle,
    BsClockHistory,
    BsTrash,
} from "react-icons/bs";

import {
    getMotoristStickers,
    deleteMotoristSticker,
    approveMotoristSticker,
    revokeMotoristSticker,
    expireMotoristSticker,
} from "../../api/vehicles";

import StickerTable
    from "../../components/stickers/StickerTable";

import StickerFormModal
    from "../../components/stickers/StickerFormModal";

import StickerDetailsModal
    from "../../components/stickers/StickerDetailsModal";


export default function Stickers() {

    const [
        stickers,
        setStickers,
    ] = useState([]);


    const [
        loading,
        setLoading,
    ] = useState(true);


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
        showFormModal,
        setShowFormModal,
    ] = useState(false);


    const [
        showDetailsModal,
        setShowDetailsModal,
    ] = useState(false);


    const [
        selectedSticker,
        setSelectedSticker,
    ] = useState(null);


    const [
        editingSticker,
        setEditingSticker,
    ] = useState(null);


    const [
        processingId,
        setProcessingId,
    ] = useState(null);


    /*
    ============================================================
       CONFIRMATION
    ============================================================
    */

    const [
        confirmation,
        setConfirmation,
    ] = useState(null);


    /*
    ============================================================
       LOAD
    ============================================================
    */

    const loadStickers = useCallback(
        async () => {

            setLoading(true);

            setError("");

            try {

                const params = {};

                if (
                    search.trim()
                ) {

                    params.search =
                        search.trim();

                }


                if (
                    statusFilter !==
                    "ALL"
                ) {

                    params.status =
                        statusFilter;

                }


                const response =
                    await getMotoristStickers(
                        params
                    );


                const data =
                    Array.isArray(
                        response
                    )
                        ? response
                        : response?.results ||
                          [];


                setStickers(
                    data
                );

            } catch (err) {

                console.error(
                    "Failed to load motorist stickers:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to load motorist stickers."
                );

            } finally {

                setLoading(false);
            }

        },
        [
            search,
            statusFilter,
        ]
    );


    useEffect(() => {

        loadStickers();

    }, [
        loadStickers,
    ]);


    /*
    ============================================================
       STATISTICS
    ============================================================
    */

    const statistics =
        useMemo(
            () => {

                const pending =
                    stickers.filter(
                        (sticker) =>
                            sticker.status ===
                            "PENDING"
                    ).length;


                const active =
                    stickers.filter(
                        (sticker) =>
                            sticker.status ===
                            "ACTIVE"
                    ).length;


                const revoked =
                    stickers.filter(
                        (sticker) =>
                            sticker.status ===
                            "REVOKED"
                    ).length;


                const expired =
                    stickers.filter(
                        (sticker) =>
                            sticker.status ===
                            "EXPIRED"
                    ).length;


                return {

                    total:
                        stickers.length,

                    pending,

                    active,

                    revoked,

                    expired,

                };

            },
            [
                stickers,
            ]
        );


    /*
    ============================================================
       ADD
    ============================================================
    */

    const handleAdd = () => {

        setEditingSticker(
            null
        );

        setShowFormModal(
            true
        );
    };


    /*
    ============================================================
       EDIT
    ============================================================
    */

    const handleEdit = (
        sticker
    ) => {

        setEditingSticker(
            sticker
        );

        setShowFormModal(
            true
        );
    };


    /*
    ============================================================
       VIEW
    ============================================================
    */

    const handleView = (
        sticker
    ) => {

        setSelectedSticker(
            sticker
        );

        setShowDetailsModal(
            true
        );
    };


    /*
    ============================================================
       OPEN CONFIRMATION
    ============================================================
    */

    const openConfirmation = (
        type,
        sticker
    ) => {

        if (
            !sticker?.id
        ) {
            return;
        }


        const configs = {

            approve: {

                title:
                    "Approve Motorist Sticker",

                message:
                    `Approve sticker "${sticker.sticker_number || "this sticker"}"?`,

                description:
                    "The sticker will become active and can be used for vehicle access.",

                button:
                    "Approve",

                icon:
                    <BsCheckCircle />,

                action:
                    approveMotoristSticker,

                danger:
                    false,

            },

            revoke: {

                title:
                    "Revoke Motorist Sticker",

                message:
                    `Revoke sticker "${sticker.sticker_number || "this sticker"}"?`,

                description:
                    "The sticker will no longer be considered active.",

                button:
                    "Revoke",

                icon:
                    <BsSlashCircle />,

                action:
                    revokeMotoristSticker,

                danger:
                    true,

            },

            expire: {

                title:
                    "Expire Motorist Sticker",

                message:
                    `Expire sticker "${sticker.sticker_number || "this sticker"}"?`,

                description:
                    "The sticker will no longer be active.",

                button:
                    "Expire",

                icon:
                    <BsClockHistory />,

                action:
                    expireMotoristSticker,

                danger:
                    false,

            },

            delete: {

                title:
                    "Delete Motorist Sticker",

                message:
                    `Delete sticker "${sticker.sticker_number || "this sticker"}"?`,

                description:
                    "This action permanently removes the sticker record.",

                button:
                    "Delete",

                icon:
                    <BsTrash />,

                action:
                    deleteMotoristSticker,

                danger:
                    true,

            },

        };


        const selected =
            configs[type];


        if (!selected) {
            return;
        }


        setConfirmation({

            type,

            sticker,

            ...selected,

        });

    };


    /*
    ============================================================
       EXECUTE CONFIRMATION
    ============================================================
    */

    const executeConfirmation =
        async () => {

            if (
                !confirmation?.sticker?.id
            ) {
                return;
            }


            const {
                sticker,
                action,
            } = confirmation;


            setProcessingId(
                sticker.id
            );

            setError("");


            try {

                await action(
                    sticker.id
                );


                setConfirmation(
                    null
                );


                await loadStickers();

            } catch (err) {

                console.error(
                    "Sticker action failed:",
                    err
                );


                setError(
                    err?.response?.data?.detail ||
                    err?.message ||
                    "Unable to complete the sticker action."
                );

            } finally {

                setProcessingId(
                    null
                );
            }
        };


    /*
    ============================================================
       FORM SUCCESS
    ============================================================
    */

    const handleFormSuccess =
        async () => {

            setShowFormModal(
                false
            );

            setEditingSticker(
                null
            );

            await loadStickers();
        };


    /*
    ============================================================
       RESET
    ============================================================
    */

    const clearFilters = () => {

        setSearch("");

        setStatusFilter(
            "ALL"
        );
    };


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
                        Motorist Stickers
                    </h1>

                    <p className="rems-page-description">
                        Manage vehicle stickers assigned
                        to residents and subdivision properties.
                    </p>

                </div>


                <div className="rems-page-header-actions">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={
                            loadStickers
                        }
                        disabled={
                            loading
                        }
                    >

                        <BsArrowClockwise />

                        Refresh

                    </button>


                    <button
                        type="button"
                        className="rems-primary-button"
                        onClick={
                            handleAdd
                        }
                    >

                        <BsPlusLg />

                        Issue Sticker

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
                            <BsShieldCheck />
                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Total Stickers
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
                            <i className="bi bi-check-circle" />
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


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">
                            <i className="bi bi-hourglass-split" />
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
                            <i className="bi bi-slash-circle" />
                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Revoked / Expired
                            </div>

                            <div className="rems-stat-value">

                                {
                                    statistics.revoked +
                                    statistics.expired
                                }

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                MAIN CARD
            ================================================= */}

            {/* =================================================
                STICKER REGISTRY
            ================================================= */}

            <div className="rems-glass-card mb-4">

                {/* =================================================
                    CARD HEADER
                ================================================= */}

                <div className="rems-card-header">

                    <div>

                        <div className="rems-card-title">
                            Sticker Registry
                        </div>

                        <div className="rems-card-subtitle">
                            Motorist sticker assignments, statuses,
                            and vehicle associations.
                        </div>

                    </div>

                </div>


                {/* =================================================
                    FILTERS
                ================================================= */}

                <div className="rems-filter-bar">

                    <div className="rems-search-box">

                        <i className="bi bi-search" />

                        <input
                            type="search"
                            className="form-control"
                            placeholder="Search sticker, plate, resident..."
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
                            All Sticker Statuses
                        </option>

                        <option value="PENDING">
                            Pending
                        </option>

                        <option value="ACTIVE">
                            Active
                        </option>

                        <option value="REVOKED">
                            Revoked
                        </option>

                        <option value="EXPIRED">
                            Expired
                        </option>

                    </select>


                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={clearFilters}
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
                            Sticker Records
                        </div>

                        <div className="rems-card-subtitle">

                            {loading
                                ? "Loading records..."
                                : `${stickers.length} ${
                                    stickers.length === 1
                                        ? "sticker"
                                        : "stickers"
                                } found`}

                        </div>

                    </div>


                    {!loading && (

                        <div className="small text-muted">

                            {search ||
                            statusFilter !== "ALL"
                                ? "Filtered results"
                                : "All records"}

                        </div>

                    )}

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
                            Loading motorist stickers...
                        </div>

                    </div>

                ) : (

                    <StickerTable
                        stickers={stickers}
                        onView={handleView}
                        onEdit={handleEdit}
                        onApprove={(sticker) =>
                            openConfirmation(
                                "approve",
                                sticker
                            )
                        }
                        onRevoke={(sticker) =>
                            openConfirmation(
                                "revoke",
                                sticker
                            )
                        }
                        onExpire={(sticker) =>
                            openConfirmation(
                                "expire",
                                sticker
                            )
                        }
                        onDelete={(sticker) =>
                            openConfirmation(
                                "delete",
                                sticker
                            )
                        }
                        processingId={processingId}
                    />

                )}

            </div>


            {/* =================================================
                POLICY / LIFECYCLE
            ================================================= */}

            <div className="row g-4 mb-4">


                {/* =================================================
                    LIFECYCLE
                ================================================= */}

                <div className="col-12 col-lg-7">

                    <div className="rems-glass-card h-100">

                        <div className="rems-card-header">

                            <div>

                                <div className="rems-page-eyebrow">
                                    STICKER POLICY
                                </div>

                                <div className="rems-card-title">
                                    Sticker Lifecycle
                                </div>

                                <div className="rems-card-subtitle">
                                    Administrative workflow for motorist
                                    sticker approval and status management.
                                </div>

                            </div>

                        </div>


                        <div className="p-4">

                            {/* =================================================
                                LIFECYCLE FLOW
                            ================================================= */}

                            <div className="row g-3 align-items-stretch">


                                {/* PENDING */}

                                <div className="col-12 col-md-4">

                                    <div
                                        className="h-100 p-3 rounded-3"
                                        style={{
                                            background:
                                                "rgba(245, 158, 11, 0.055)",
                                            border:
                                                "1px solid rgba(245, 158, 11, 0.14)",
                                        }}
                                    >

                                        <div className="d-flex align-items-center gap-2 mb-2">

                                            <div
                                                className="d-flex align-items-center justify-content-center rounded-circle"
                                                style={{
                                                    width:
                                                        "34px",
                                                    height:
                                                        "34px",
                                                    background:
                                                        "rgba(245, 158, 11, 0.10)",
                                                }}
                                            >

                                                <i className="bi bi-hourglass-split" />

                                            </div>


                                            <strong>
                                                Pending
                                            </strong>

                                        </div>


                                        <p className="small text-muted mb-0">

                                            Newly issued stickers remain
                                            pending until reviewed and
                                            approved by an administrator.

                                        </p>

                                    </div>

                                </div>


                                {/* ACTIVE */}

                                <div className="col-12 col-md-4">

                                    <div
                                        className="h-100 p-3 rounded-3"
                                        style={{
                                            background:
                                                "rgba(25, 135, 84, 0.055)",
                                            border:
                                                "1px solid rgba(25, 135, 84, 0.14)",
                                        }}
                                    >

                                        <div className="d-flex align-items-center gap-2 mb-2">

                                            <div
                                                className="d-flex align-items-center justify-content-center rounded-circle"
                                                style={{
                                                    width:
                                                        "34px",
                                                    height:
                                                        "34px",
                                                    background:
                                                        "rgba(25, 135, 84, 0.10)",
                                                }}
                                            >

                                                <i className="bi bi-check-circle" />

                                            </div>


                                            <strong>
                                                Active
                                            </strong>

                                        </div>


                                        <p className="small text-muted mb-0">

                                            Approved stickers are active
                                            and authorized for gate access.

                                        </p>

                                    </div>

                                </div>


                                {/* FINAL */}

                                <div className="col-12 col-md-4">

                                    <div
                                        className="h-100 p-3 rounded-3"
                                        style={{
                                            background:
                                                "rgba(100, 116, 139, 0.055)",
                                            border:
                                                "1px solid rgba(100, 116, 139, 0.14)",
                                        }}
                                    >

                                        <div className="d-flex align-items-center gap-2 mb-2">

                                            <div
                                                className="d-flex align-items-center justify-content-center rounded-circle"
                                                style={{
                                                    width:
                                                        "34px",
                                                    height:
                                                        "34px",
                                                    background:
                                                        "rgba(100, 116, 139, 0.10)",
                                                }}
                                            >

                                                <i className="bi bi-slash-circle" />

                                            </div>


                                            <strong>
                                                Closed
                                            </strong>

                                        </div>


                                        <p className="small text-muted mb-0">

                                            Active stickers may later be
                                            revoked or expired.

                                        </p>

                                    </div>

                                </div>

                            </div>


                            {/* =================================================
                                FLOW
                            ================================================= */}

                            <div className="d-flex align-items-center justify-content-center flex-wrap gap-2 mt-4">

                                <span className="rems-status-badge rems-status-warning">
                                    <span className="rems-status-dot" />
                                    Pending
                                </span>

                                <i className="bi bi-arrow-right text-muted" />

                                <span className="rems-status-badge rems-status-success">
                                    <span className="rems-status-dot" />
                                    Active
                                </span>

                                <i className="bi bi-arrow-right text-muted" />

                                <span className="rems-status-badge rems-status-danger">
                                    <span className="rems-status-dot" />
                                    Revoked
                                </span>

                                <span className="text-muted small">
                                    or
                                </span>

                                <span className="rems-status-badge rems-status-secondary">
                                    <span className="rems-status-dot" />
                                    Expired
                                </span>

                            </div>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    RULES
                ================================================= */}

                <div className="col-12 col-lg-5">

                    <div className="rems-glass-card h-100">

                        <div className="rems-card-header">

                            <div>

                                <div className="rems-page-eyebrow">
                                    GOVERNANCE
                                </div>

                                <div className="rems-card-title">
                                    Registration Rules
                                </div>

                                <div className="rems-card-subtitle">
                                    Controls enforced by the REMS backend.
                                </div>

                            </div>

                            <div className="rems-card-header-icon">

                                <BsShieldCheck />

                            </div>

                        </div>


                        <div className="p-4">

                            <div className="d-flex flex-column gap-3">


                                <div className="d-flex align-items-start gap-3">

                                    <div className="rems-dashboard-icon">

                                        <i className="bi bi-check2-circle" />

                                    </div>

                                    <div>

                                        <div className="fw-semibold">
                                            Administrative approval
                                        </div>

                                        <div className="small text-muted">
                                            New stickers remain pending
                                            until an administrator approves them.
                                        </div>

                                    </div>

                                </div>


                                <div className="d-flex align-items-start gap-3">

                                    <div className="rems-dashboard-icon">

                                        <i className="bi bi-house-check" />

                                    </div>

                                    <div>

                                        <div className="fw-semibold">
                                            Property authorization
                                        </div>

                                        <div className="small text-muted">
                                            The resident must be authorized
                                            for the selected property.
                                        </div>

                                    </div>

                                </div>


                                <div className="d-flex align-items-start gap-3">

                                    <div className="rems-dashboard-icon">

                                        <i className="bi bi-car-front" />

                                    </div>

                                    <div>

                                        <div className="fw-semibold">
                                            Vehicle ownership
                                        </div>

                                        <div className="small text-muted">
                                            The vehicle must belong to the same
                                            property and resident.
                                        </div>

                                    </div>

                                </div>


                                <div className="d-flex align-items-start gap-3">

                                    <div className="rems-dashboard-icon">

                                        <i className="bi bi-shield-check" />

                                    </div>

                                    <div>

                                        <div className="fw-semibold">
                                            Sticker limit
                                        </div>

                                        <div className="small text-muted">
                                            A property can have a maximum
                                            of three active or pending stickers.
                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <StickerFormModal
                show={
                    showFormModal
                }
                sticker={
                    editingSticker
                }
                onClose={() => {

                    setShowFormModal(
                        false
                    );

                    setEditingSticker(
                        null
                    );

                }}
                onSuccess={
                    handleFormSuccess
                }
            />


            {/* =================================================
                DETAILS
            ================================================= */}

            <StickerDetailsModal
                show={
                    showDetailsModal
                }
                sticker={
                    selectedSticker
                }
                onClose={() => {

                    setShowDetailsModal(
                        false
                    );

                    setSelectedSticker(
                        null
                    );

                }}
            />


            {/* =================================================
                CONFIRMATION MODAL
            ================================================= */}

            {confirmation && (

                <div
                    className="rems-modal-backdrop"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget &&
                            !processingId
                        ) {

                            setConfirmation(
                                null
                            );

                        }

                    }}
                >

                    <div
                        className="rems-modal rems-management-modal"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="rems-modal-header">

                            <div>

                                <div className="rems-page-eyebrow">
                                    STICKER MANAGEMENT
                                </div>

                                <h5 className="mb-1 fw-semibold">

                                    {
                                        confirmation.title
                                    }

                                </h5>

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
                                        width:
                                            "44px",
                                        height:
                                            "44px",
                                        flex:
                                            "0 0 44px",
                                        background:
                                            confirmation.danger
                                                ? "rgba(220,53,69,.10)"
                                                : "rgba(13,110,253,.08)",
                                    }}
                                >

                                    {
                                        confirmation.icon
                                    }

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

                                Cancel

                            </button>


                            <button
                                type="button"
                                className={
                                    confirmation.danger
                                        ? "rems-primary-button bg-danger border-danger"
                                        : "rems-primary-button"
                                }
                                onClick={
                                    executeConfirmation
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

                                        Processing...

                                    </>

                                ) : (

                                    <>

                                        {
                                            confirmation.icon
                                        }

                                        {
                                            confirmation.button
                                        }

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