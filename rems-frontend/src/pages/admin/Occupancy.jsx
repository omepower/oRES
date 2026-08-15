import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsHouseCheck,
    BsPersonVcard,
    BsPlusLg,
} from "react-icons/bs";

import {
    getPropertyOwnerships,
    deletePropertyOwnership,
    getPropertyOccupancies,
    deletePropertyOccupancy,
} from "../../api/properties";

import OwnershipTable
    from "../../components/occupancy/OwnershipTable";

import OccupancyTable
    from "../../components/occupancy/OccupancyTable";

import OwnershipFormModal
    from "../../components/occupancy/OwnershipFormModal";

import OccupancyFormModal
    from "../../components/occupancy/OccupancyFormModal";


export default function Occupancy() {

    const [
        activeTab,
        setActiveTab,
    ] = useState("occupancy");


    const [
        ownerships,
        setOwnerships,
    ] = useState([]);

    const [
        occupancies,
        setOccupancies,
    ] = useState([]);


    const [
        loadingOwnership,
        setLoadingOwnership,
    ] = useState(true);

    const [
        loadingOccupancy,
        setLoadingOccupancy,
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
        showOwnershipModal,
        setShowOwnershipModal,
    ] = useState(false);

    const [
        showOccupancyModal,
        setShowOccupancyModal,
    ] = useState(false);


    const [
        selectedOwnership,
        setSelectedOwnership,
    ] = useState(null);

    const [
        selectedOccupancy,
        setSelectedOccupancy,
    ] = useState(null);


    /* =========================================================
       LOAD OWNERSHIP
    ========================================================= */

    const loadOwnerships = useCallback(
        async () => {

            setLoadingOwnership(true);

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

                    params.is_active =
                        statusFilter ===
                        "ACTIVE";

                }


                const response =
                    await getPropertyOwnerships(
                        params
                    );


                const data =
                    Array.isArray(
                        response
                    )
                        ? response
                        : response?.results ||
                          [];


                setOwnerships(
                    data
                );

            } catch (err) {

                console.error(
                    "Failed to load ownership records:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to load ownership records."
                );

            } finally {

                setLoadingOwnership(
                    false
                );
            }

        },
        [
            search,
            statusFilter,
        ]
    );


    /* =========================================================
       LOAD OCCUPANCY
    ========================================================= */

    const loadOccupancies = useCallback(
        async () => {

            setLoadingOccupancy(true);

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

                    params.is_active =
                        statusFilter ===
                        "ACTIVE";

                }


                const response =
                    await getPropertyOccupancies(
                        params
                    );


                const data =
                    Array.isArray(
                        response
                    )
                        ? response
                        : response?.results ||
                          [];


                setOccupancies(
                    data
                );

            } catch (err) {

                console.error(
                    "Failed to load occupancy records:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to load occupancy records."
                );

            } finally {

                setLoadingOccupancy(
                    false
                );
            }

        },
        [
            search,
            statusFilter,
        ]
    );


    useEffect(() => {

        loadOwnerships();

        loadOccupancies();

    }, [
        loadOwnerships,
        loadOccupancies,
    ]);


    /* =========================================================
       STATISTICS
    ========================================================= */

    const statistics =
        useMemo(() => {

            const activeOwnership =
                ownerships.filter(
                    (record) =>
                        record.is_active
                ).length;


            const historicalOwnership =
                ownerships.filter(
                    (record) =>
                        !record.is_active
                ).length;


            const activeOccupancy =
                occupancies.filter(
                    (record) =>
                        record.is_active
                ).length;


            const homeownerOccupancy =
                occupancies.filter(
                    (record) =>
                        record.occupancy_type ===
                        "HOMEOWNER"
                ).length;


            const tenantOccupancy =
                occupancies.filter(
                    (record) =>
                        record.occupancy_type ===
                        "TENANT"
                ).length;


            return {

                activeOwnership,

                historicalOwnership,

                activeOccupancy,

                homeownerOccupancy,

                tenantOccupancy,

            };

        }, [
            ownerships,
            occupancies,
        ]);


    /* =========================================================
       REFRESH
    ========================================================= */

    const refresh = async () => {

        setError("");

        await Promise.all([
            loadOwnerships(),
            loadOccupancies(),
        ]);

    };


    /* =========================================================
       OPEN OWNERSHIP
    ========================================================= */

    const handleAddOwnership = () => {

        setSelectedOwnership(
            null
        );

        setShowOwnershipModal(
            true
        );

    };


    const handleEditOwnership = (
        record
    ) => {

        setSelectedOwnership(
            record
        );

        setShowOwnershipModal(
            true
        );

    };


    const handleViewOwnership = (
        record
    ) => {

        setSelectedOwnership(
            record
        );

        setShowOwnershipModal(
            true
        );

    };


    /* =========================================================
       DELETE OWNERSHIP
    ========================================================= */

    const handleDeleteOwnership =
        async (
            record
        ) => {

            const confirmed =
                window.confirm(
                    `Delete the ownership record for ${
                        record.property_address ||
                        "this property"
                    }?`
                );


            if (!confirmed) {
                return;
            }


            try {

                setError("");

                await deletePropertyOwnership(
                    record.id
                );

                await loadOwnerships();

            } catch (err) {

                console.error(
                    "Ownership deletion failed:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to delete ownership record."
                );
            }
        };


    /* =========================================================
       OPEN OCCUPANCY
    ========================================================= */

    const handleAddOccupancy = () => {

        setSelectedOccupancy(
            null
        );

        setShowOccupancyModal(
            true
        );

    };


    const handleEditOccupancy = (
        record
    ) => {

        setSelectedOccupancy(
            record
        );

        setShowOccupancyModal(
            true
        );

    };


    const handleViewOccupancy = (
        record
    ) => {

        setSelectedOccupancy(
            record
        );

        setShowOccupancyModal(
            true
        );

    };


    /* =========================================================
       DELETE OCCUPANCY
    ========================================================= */

    const handleDeleteOccupancy =
        async (
            record
        ) => {

            const confirmed =
                window.confirm(
                    `Delete the occupancy record for ${
                        record.property_address ||
                        "this property"
                    }?`
                );


            if (!confirmed) {
                return;
            }


            try {

                setError("");

                await deletePropertyOccupancy(
                    record.id
                );

                await loadOccupancies();

            } catch (err) {

                console.error(
                    "Occupancy deletion failed:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to delete occupancy record."
                );
            }
        };


    /* =========================================================
       CLEAR FILTERS
    ========================================================= */

    const clearFilters = () => {

        setSearch("");

        setStatusFilter(
            "ALL"
        );

    };


    const activeLoading =
        activeTab === "ownership"
            ? loadingOwnership
            : loadingOccupancy;


    return (
        <div className="rems-page-content">


            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">
                        PROPERTY MANAGEMENT
                    </div>

                    <h1 className="rems-page-title">
                        Occupancy Management
                    </h1>

                    <p className="rems-page-description">
                        Manage property ownership,
                        occupancy assignments, and historical
                        resident relationships.
                    </p>

                </div>


                <div className="rems-page-header-actions">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={
                            refresh
                        }
                        disabled={
                            activeLoading
                        }
                    >

                        <BsArrowClockwise />

                        Refresh

                    </button>


                    {activeTab === "ownership" ? (

                        <button
                            type="button"
                            className="rems-primary-button"
                            onClick={
                                handleAddOwnership
                            }
                        >

                            <BsPlusLg />

                            Assign Homeowner

                        </button>

                    ) : (

                        <button
                            type="button"
                            className="rems-primary-button"
                            onClick={
                                handleAddOccupancy
                            }
                        >

                            <BsPlusLg />

                            Assign Occupant

                        </button>

                    )}

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

                    {
                        error
                    }

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

                            <BsPersonVcard />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Active Ownerships
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.activeOwnership
                                }
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <BsHouseCheck />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Active Occupancies
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.activeOccupancy
                                }
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <i className="bi bi-person-check" />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Homeowner Occupants
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.homeownerOccupancy
                                }
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <i className="bi bi-people" />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Tenant Occupants
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.tenantOccupancy
                                }
                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                GLASS CARD
            ================================================= */}

            <div className="rems-glass-card">


                {/* =================================================
                    CARD HEADER + TABS
                ================================================= */}

                <div className="rems-card-header">

                    <div>

                        <div className="rems-card-title">
                            Property Relationships
                        </div>

                        <div className="rems-card-subtitle">
                            Ownership and occupancy history
                            are maintained separately.
                        </div>

                    </div>

                </div>


                <div className="px-3 px-lg-4 pt-3">
                    <ul className="nav nav-pills gap-2">
                        <li className="nav-item">
                        <button
                            type="button"
                            className={`nav-link ${
                            activeTab === "occupancy" ? "active bg-secondary text-white" : ""
                            }`}
                            style={activeTab !== "occupancy" ? { color: "#ff6600" } : {}}
                            onClick={() => setActiveTab("occupancy")}
                        >
                            <BsHouseCheck className="me-2" />
                            Occupancy
                        </button>
                        </li>

                        <li className="nav-item">
                        <button
                            type="button"
                            className={`nav-link ${
                            activeTab === "ownership" ? "active bg-secondary text-white" : ""
                            }`}
                            style={activeTab !== "ownership" ? { color: "#ff6600" } : {}}
                            onClick={() => setActiveTab("ownership")}
                        >
                            <BsPersonVcard className="me-2" />
                            Ownership
                        </button>
                        </li>
                    </ul>
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
                            placeholder={
                                activeTab ===
                                "ownership"
                                    ? "Search property or homeowner..."
                                    : "Search property or resident..."
                            }
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
                            All Records
                        </option>

                        <option value="ACTIVE">
                            Active
                        </option>

                        <option value="HISTORICAL">
                            Historical
                        </option>

                    </select>


                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={
                            clearFilters
                        }
                    >

                        <i className="bi bi-arrow-counterclockwise" />

                        Reset

                    </button>

                </div>


                {/* =================================================
                    SUMMARY
                ================================================= */}

                <div className="rems-table-toolbar">

                    <div>

                        <div className="rems-card-title">

                            {activeTab ===
                            "ownership"
                                ? "Ownership Records"
                                : "Occupancy Records"}

                        </div>

                        <div className="rems-card-subtitle">

                            {activeLoading
                                ? "Loading records..."
                                : activeTab ===
                                  "ownership"
                                ? `${ownerships.length} ${
                                      ownerships.length ===
                                      1
                                          ? "ownership record"
                                          : "ownership records"
                                  } found`
                                : `${occupancies.length} ${
                                      occupancies.length ===
                                      1
                                          ? "occupancy record"
                                          : "occupancy records"
                                  } found`}

                        </div>

                    </div>

                </div>


                {/* =================================================
                    TABLE
                ================================================= */}

                {activeLoading ? (

                    <div className="rems-loading-state">

                        <div
                            className="spinner-border"
                            role="status"
                        />

                        <div className="mt-3">
                            Loading records...
                        </div>

                    </div>

                ) : activeTab ===
                  "ownership" ? (

                    <OwnershipTable
                        records={
                            ownerships
                        }
                        onView={
                            handleViewOwnership
                        }
                        onEdit={
                            handleEditOwnership
                        }
                        onDelete={
                            handleDeleteOwnership
                        }
                    />

                ) : (

                    <OccupancyTable
                        records={
                            occupancies
                        }
                        onView={
                            handleViewOccupancy
                        }
                        onEdit={
                            handleEditOccupancy
                        }
                        onDelete={
                            handleDeleteOccupancy
                        }
                    />

                )}

            </div>


            {/* =================================================
                OWNERSHIP MODAL
            ================================================= */}

            <OwnershipFormModal
                show={
                    showOwnershipModal
                }
                record={
                    selectedOwnership
                }
                onClose={() => {

                    setShowOwnershipModal(
                        false
                    );

                    setSelectedOwnership(
                        null
                    );

                }}
                onSuccess={async () => {

                    setShowOwnershipModal(
                        false
                    );

                    setSelectedOwnership(
                        null
                    );

                    await loadOwnerships();

                }}
            />


            {/* =================================================
                OCCUPANCY MODAL
            ================================================= */}

            <OccupancyFormModal
                show={
                    showOccupancyModal
                }
                record={
                    selectedOccupancy
                }
                onClose={() => {

                    setShowOccupancyModal(
                        false
                    );

                    setSelectedOccupancy(
                        null
                    );

                }}
                onSuccess={async () => {

                    setShowOccupancyModal(
                        false
                    );

                    setSelectedOccupancy(
                        null
                    );

                    await loadOccupancies();

                }}
            />

        </div>
    );
}