
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
} from "react-icons/bs";

import {
    getMotoristStickersMine,
} from "../../api/vehicles";

import ResidentStickerFormModal
    from "../../components/stickers/ResidentStickerFormModal";

import StickerDetailsModal
    from "../../components/stickers/StickerDetailsModal";


export default function ResidentStickers() {

    const [
        stickers,
        setStickers,
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
        statusFilter,
        setStatusFilter,
    ] = useState(
        "ALL"
    );

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        showFormModal,
        setShowFormModal,
    ] = useState(false);

    const [
        selectedSticker,
        setSelectedSticker,
    ] = useState(null);

    const [
        showDetailsModal,
        setShowDetailsModal,
    ] = useState(false);


    /* =========================================================
       LOAD
    ========================================================= */

    const loadStickers = useCallback(
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
                    await getMotoristStickersMine();

                const data =
                    Array.isArray(response)
                        ? response
                        : response?.results ||
                          response?.stickers ||
                          [];

                setStickers(
                    data
                );

            } catch (err) {

                console.error(
                    "[Resident Stickers] Failed to load:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to load your motorist stickers."
                );

                setStickers([]);

            } finally {

                setLoading(false);
                setRefreshing(false);

            }
        },
        []
    );


    useEffect(() => {

        loadStickers();

    }, [
        loadStickers,
    ]);


    /* =========================================================
       FILTER
    ========================================================= */

    const filteredStickers =
        useMemo(
            () => {

                const text =
                    search
                        .trim()
                        .toLowerCase();

                return stickers.filter(
                    (sticker) => {

                        const matchesSearch =
                            !text ||
                            sticker.sticker_number
                                ?.toLowerCase()
                                .includes(text) ||
                            sticker.vehicle_plate_number
                                ?.toLowerCase()
                                .includes(text) ||
                            sticker.vehicle_description
                                ?.toLowerCase()
                                .includes(text);

                        const matchesStatus =
                            statusFilter ===
                                "ALL" ||
                            sticker.status ===
                                statusFilter;

                        return (
                            matchesSearch &&
                            matchesStatus
                        );

                    }
                );

            },
            [
                stickers,
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

                return {

                    total:
                        stickers.length,

                    active:
                        stickers.filter(
                            (sticker) =>
                                sticker.status ===
                                "ACTIVE"
                        ).length,

                    pending:
                        stickers.filter(
                            (sticker) =>
                                sticker.status ===
                                "PENDING"
                        ).length,

                    inactive:
                        stickers.filter(
                            (sticker) =>
                                [
                                    "REVOKED",
                                    "EXPIRED",
                                ].includes(
                                    sticker.status
                                )
                        ).length,

                };

            },
            [
                stickers,
            ]
        );


    /* =========================================================
       STATUS
    ========================================================= */

    const getStatusClass = (
        status
    ) => {

        switch (status) {

            case "ACTIVE":
                return "rems-status-success";

            case "PENDING":
                return "rems-status-warning";

            case "REVOKED":
                return "rems-status-danger";

            case "EXPIRED":
                return "rems-status-secondary";

            default:
                return "rems-status-secondary";

        }

    };


    /* =========================================================
       SUCCESS
    ========================================================= */

    const handleSuccess = async () => {

        setShowFormModal(
            false
        );

        await loadStickers();

    };


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
                        Motorist Stickers
                    </h1>

                    <p className="rems-page-description">
                        Manage your motorist access requests
                        and active vehicle stickers.
                    </p>

                </div>


                <div className="rems-page-header-actions">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() =>
                            loadStickers(
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


                    <button
                        type="button"
                        className="rems-primary-button"
                        onClick={() =>
                            setShowFormModal(
                                true
                            )
                        }
                    >

                        <BsPlusLg />

                        Request Sticker

                    </button>

                </div>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="alert alert-danger rems-alert mb-4">

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
                                    statistics.inactive
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
                            My Motorist Stickers
                        </div>

                        <div className="rems-card-subtitle">
                            Vehicle sticker requests and access status.
                        </div>

                    </div>

                </div>


                <div className="rems-filter-bar">

                    <div className="rems-search-box">

                        <i className="bi bi-search" />

                        <input
                            type="search"
                            className="form-control"
                            placeholder="Search sticker or plate..."
                            value={
                                search
                            }
                            onChange={(
                                event
                            ) =>
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
                        onChange={(
                            event
                        ) =>
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
                        onClick={() => {

                            setSearch("");
                            setStatusFilter(
                                "ALL"
                            );

                        }}
                    >

                        <i className="bi bi-arrow-counterclockwise" />

                        Reset

                    </button>

                </div>


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

                ) : filteredStickers.length === 0 ? (

                    <div className="rems-empty-state">

                        <div className="rems-empty-icon">
                            <BsShieldCheck />
                        </div>

                        <div className="rems-empty-title">
                            No motorist stickers
                        </div>

                        <p className="rems-empty-text">
                            Request a sticker for one of your
                            registered vehicles.
                        </p>

                        <button
                            type="button"
                            className="rems-primary-button mt-3"
                            onClick={() =>
                                setShowFormModal(
                                    true
                                )
                            }
                        >

                            <BsPlusLg />

                            Request Sticker

                        </button>

                    </div>

                ) : (

                    <div className="rems-table-wrapper">

                        <table className="table rems-table align-middle mb-0">

                            <thead>

                                <tr>

                                    <th>
                                        Sticker
                                    </th>

                                    <th>
                                        Vehicle
                                    </th>

                                    <th>
                                        Property
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Issued
                                    </th>

                                    <th>
                                        Expires
                                    </th>

                                    <th className="text-end">
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredStickers.map(
                                    (
                                        sticker
                                    ) => (

                                        <tr
                                            key={
                                                sticker.id
                                            }
                                        >

                                            <td data-label="sticker">

                                                <div className="rems-table-primary">

                                                    {
                                                        sticker.sticker_number ||
                                                        "Pending Number"
                                                    }

                                                </div>

                                                <div className="rems-table-secondary">

                                                    {
                                                        sticker.sticker_uuid
                                                            ? "Secure sticker identity"
                                                            : "Sticker record"
                                                    }

                                                </div>

                                            </td>


                                            <td data-label="vehicle">

                                                <div className="rems-table-primary">

                                                    {
                                                        sticker.vehicle_description ||
                                                        "Vehicle"
                                                    }

                                                </div>

                                                <div className="rems-table-secondary">

                                                    {
                                                        sticker.vehicle_plate_number ||
                                                        "—"
                                                    }

                                                </div>

                                            </td>


                                            <td data-label="property">

                                                {
                                                    sticker.property_address ||
                                                    "—"
                                                }

                                            </td>


                                            <td data-label="status">

                                                <span
                                                    className={`rems-status-badge ${
                                                        getStatusClass(
                                                            sticker.status
                                                        )
                                                    }`}
                                                >

                                                    <span className="rems-status-dot" />

                                                    {
                                                        sticker.status_display ||
                                                        sticker.status ||
                                                        "—"
                                                    }

                                                </span>

                                            </td>


                                            <td data-label="date of issue">

                                                {
                                                    sticker.issued_at
                                                        ? new Date(
                                                            sticker.issued_at
                                                        ).toLocaleDateString()
                                                        : "—"
                                                }

                                            </td>


                                            <td data-label="exipration">

                                                {
                                                    sticker.expires_at
                                                        ? new Date(
                                                            sticker.expires_at
                                                        ).toLocaleDateString()
                                                        : "—"
                                                }

                                            </td>


                                            <td data-label="action">

                                                <div className="d-flex justify-content-end gap-1">

                                                    <button
                                                        type="button"
                                                        className="rems-icon-button"
                                                        title="View sticker"
                                                        onClick={() => {

                                                            setSelectedSticker(
                                                                sticker
                                                            );

                                                            setShowDetailsModal(
                                                                true
                                                            );

                                                        }}
                                                    >

                                                        <i className="bi bi-eye" />

                                                    </button>

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


            <ResidentStickerFormModal
                show={
                    showFormModal
                }
                onClose={() =>
                    setShowFormModal(
                        false
                    )
                }
                onSuccess={
                    handleSuccess
                }
            />


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

        </div>
    );
}
