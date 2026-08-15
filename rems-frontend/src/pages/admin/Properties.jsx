import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    BsBuilding,
    BsPlusLg,
    BsSearch,
    BsArrowClockwise,
    BsHouseCheck,
    BsPersonCheck,
    BsHouse,
} from "react-icons/bs";

import {
    getProperties,
    deleteProperty,
} from "../../api/properties";

import PropertyTable
    from "../../components/properties/PropertyTable";

import PropertyFormModal
    from "../../components/properties/PropertyFormModal";

import PropertyDetailsModal
    from "../../components/properties/PropertyDetailsModal";

import PropertyOwnershipModal
    from "../../components/properties/PropertyOwnershipModal";

import PropertyOccupancyModal
    from "../../components/properties/PropertyOccupancyModal";


export default function Properties() {

    /* =========================================================
       DATA
    ========================================================= */

    const [
        properties,
        setProperties,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

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

    const [
        activeFilter,
        setActiveFilter,
    ] = useState("ALL");


    /* =========================================================
       PROPERTY MODALS
    ========================================================= */

    const [
        showFormModal,
        setShowFormModal,
    ] = useState(false);

    const [
        showDetailsModal,
        setShowDetailsModal,
    ] = useState(false);

    const [
        showOwnershipModal,
        setShowOwnershipModal,
    ] = useState(false);

    const [
        showOccupancyModal,
        setShowOccupancyModal,
    ] = useState(false);


    /* =========================================================
       SELECTED RECORDS
    ========================================================= */

    const [
        selectedProperty,
        setSelectedProperty,
    ] = useState(null);

    const [
        editingProperty,
        setEditingProperty,
    ] = useState(null);

    const [
        selectedOwnership,
        setSelectedOwnership,
    ] = useState(null);

    const [
        selectedOccupancy,
        setSelectedOccupancy,
    ] = useState(null);


    /* =========================================================
       LOAD PROPERTIES
    ========================================================= */

    const loadProperties = useCallback(
        async () => {

            setLoading(true);
            setError("");

            try {

                const params = {};


                if (search.trim()) {

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


                if (
                    activeFilter !==
                    "ALL"
                ) {

                    params.is_active =
                        activeFilter ===
                        "ACTIVE";

                }


                const response =
                    await getProperties(
                        params
                    );


                const data =
                    Array.isArray(
                        response
                    )
                        ? response
                        : response?.results ||
                          [];


                setProperties(
                    data
                );

            } catch (err) {

                console.error(
                    "Failed to load properties:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to load properties."
                );

            } finally {

                setLoading(false);
            }

        },
        [
            search,
            statusFilter,
            activeFilter,
        ]
    );


    useEffect(() => {

        loadProperties();

    }, [
        loadProperties,
    ]);


    /* =========================================================
       STATISTICS
    ========================================================= */

    const statistics =
        useMemo(() => {

            const vacant =
                properties.filter(
                    (property) =>
                        property.status ===
                        "VACANT"
                ).length;


            const ownerOccupied =
                properties.filter(
                    (property) =>
                        property.status ===
                        "OWNER_OCCUPIED"
                ).length;


            const tenantOccupied =
                properties.filter(
                    (property) =>
                        property.status ===
                        "TENANT_OCCUPIED"
                ).length;


            const active =
                properties.filter(
                    (property) =>
                        property.is_active
                ).length;


            return {
                total:
                    properties.length,

                vacant,

                ownerOccupied,

                tenantOccupied,

                active,
            };

        }, [
            properties,
        ]);


    /* =========================================================
       ADD PROPERTY
    ========================================================= */

    const handleAdd = () => {

        setEditingProperty(
            null
        );

        setShowFormModal(
            true
        );
    };


    /* =========================================================
       EDIT PROPERTY
    ========================================================= */

    const handleEdit = (
        property
    ) => {

        setEditingProperty(
            property
        );

        setShowFormModal(
            true
        );
    };


    /* =========================================================
       VIEW PROPERTY
    ========================================================= */

    const handleView = (
        property
    ) => {

        setSelectedProperty(
            property
        );

        setShowDetailsModal(
            true
        );
    };


    /* =========================================================
       DELETE PROPERTY
    ========================================================= */

    const handleDelete = async (
        property
    ) => {

        if (!property?.id) {
            return;
        }


        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${property.address}"?`
            );


        if (!confirmed) {
            return;
        }


        setError("");


        try {

            await deleteProperty(
                property.id
            );

            await loadProperties();

        } catch (err) {

            console.error(
                "Failed to delete property:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                "Unable to delete property."
            );

        }

    };


    /* =========================================================
       FORM SUCCESS
    ========================================================= */

    const handleFormSuccess = async () => {

        setShowFormModal(
            false
        );

        setEditingProperty(
            null
        );

        await loadProperties();

    };


    /* =========================================================
       OPEN OWNERSHIP
    ========================================================= */

    const handleAssignOwnership = () => {

        setShowDetailsModal(
            false
        );

        setSelectedOwnership(
            null
        );

        setShowOwnershipModal(
            true
        );

    };


    /* =========================================================
       OPEN OCCUPANCY
    ========================================================= */

    const handleAssignOccupancy = () => {

        setShowDetailsModal(
            false
        );

        setSelectedOccupancy(
            null
        );

        setShowOccupancyModal(
            true
        );

    };


    /* =========================================================
       OWNERSHIP SUCCESS
    ========================================================= */

    const handleOwnershipSuccess =
        async () => {

            setShowOwnershipModal(
                false
            );

            setSelectedOwnership(
                null
            );

            await loadProperties();

            setShowDetailsModal(
                true
            );

        };


    /* =========================================================
       OCCUPANCY SUCCESS
    ========================================================= */

    const handleOccupancySuccess =
        async () => {

            setShowOccupancyModal(
                false
            );

            setSelectedOccupancy(
                null
            );

            await loadProperties();

            setShowDetailsModal(
                true
            );

        };


    /* =========================================================
       CLEAR FILTERS
    ========================================================= */

    const clearFilters = () => {

        setSearch("");

        setStatusFilter(
            "ALL"
        );

        setActiveFilter(
            "ALL"
        );

    };


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
                        Properties Management
                    </h1>

                    <p className="rems-page-description">
                        Manage subdivision properties,
                        ownership, and resident occupancy.
                    </p>

                </div>


                <div className="rems-page-header-actions">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={
                            loadProperties
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

                        Add Property

                    </button>

                </div>

            </div>


            {/* =================================================
                ALERT
            ================================================= */}

            {error && (

                <div
                    className="alert alert-danger rems-alert mb-4"
                    role="alert"
                >

                    <i className="bi bi-exclamation-circle me-2" />

                    {error}

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

                            <BsBuilding />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Total Properties
                            </div>

                            <div className="rems-stat-value">
                                {statistics.total}
                            </div>

                        </div>

                    </div>

                </div>


                {/* VACANT */}

                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <BsHouse />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Vacant
                            </div>

                            <div className="rems-stat-value">
                                {statistics.vacant}
                            </div>

                        </div>

                    </div>

                </div>


                {/* OWNER OCCUPIED */}

                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <BsHouseCheck />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Owner Occupied
                            </div>

                            <div className="rems-stat-value">
                                {statistics.ownerOccupied}
                            </div>

                        </div>

                    </div>

                </div>


                {/* TENANT OCCUPIED */}

                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <BsPersonCheck />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Tenant Occupied
                            </div>

                            <div className="rems-stat-value">
                                {statistics.tenantOccupied}
                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                PROPERTY MANAGEMENT CARD
            ================================================= */}

            <div className="rems-glass-card">


                {/* =================================================
                    CARD HEADER
                ================================================= */}

                <div className="rems-card-header">

                    <div>

                        <div className="rems-card-title">
                            Property Registry
                        </div>

                        <div className="rems-card-subtitle">
                            Registered properties and
                            current property status
                        </div>

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
                            placeholder="Search address, block, lot..."
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
                            All Property Statuses
                        </option>

                        <option value="VACANT">
                            Vacant
                        </option>

                        <option value="OWNER_OCCUPIED">
                            Owner Occupied
                        </option>

                        <option value="TENANT_OCCUPIED">
                            Tenant Occupied
                        </option>

                    </select>


                    <select
                        className="form-select rems-filter-select"
                        value={
                            activeFilter
                        }
                        onChange={(event) =>
                            setActiveFilter(
                                event.target.value
                            )
                        }
                    >

                        <option value="ALL">
                            All Record Statuses
                        </option>

                        <option value="ACTIVE">
                            Active
                        </option>

                        <option value="INACTIVE">
                            Inactive
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
                    SECTION SUMMARY
                ================================================= */}

                <div className="rems-table-toolbar">

                    <div>

                        <div className="rems-card-title">
                            Property Records
                        </div>

                        <div className="rems-card-subtitle">

                            {loading
                                ? "Loading records..."
                                : `${properties.length} ${
                                      properties.length ===
                                      1
                                          ? "property"
                                          : "properties"
                                  } found`}

                        </div>

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
                            Loading properties...
                        </div>

                    </div>

                ) : (

                    <PropertyTable
                        properties={
                            properties
                        }
                        onView={
                            handleView
                        }
                        onEdit={
                            handleEdit
                        }
                        onDelete={
                            handleDelete
                        }
                    />

                )}

            </div>


            {/* =================================================
                PROPERTY FORM
            ================================================= */}

            <PropertyFormModal
                show={
                    showFormModal
                }
                property={
                    editingProperty
                }
                onClose={() => {

                    setShowFormModal(
                        false
                    );

                    setEditingProperty(
                        null
                    );

                }}
                onSuccess={
                    handleFormSuccess
                }
            />


            {/* =================================================
                PROPERTY DETAILS
            ================================================= */}

            <PropertyDetailsModal
                show={
                    showDetailsModal
                }
                property={
                    selectedProperty
                }
                onClose={() => {

                    setShowDetailsModal(
                        false
                    );

                    setSelectedProperty(
                        null
                    );

                }}
                onAssignOwnership={
                    handleAssignOwnership
                }
                onAssignOccupancy={
                    handleAssignOccupancy
                }
            />


            {/* =================================================
                OWNERSHIP
            ================================================= */}

            <PropertyOwnershipModal
                show={
                    showOwnershipModal
                }
                property={
                    selectedProperty
                }
                ownership={
                    selectedOwnership
                }
                onClose={() => {

                    setShowOwnershipModal(
                        false
                    );

                    setSelectedOwnership(
                        null
                    );

                    setShowDetailsModal(
                        true
                    );

                }}
                onSuccess={
                    handleOwnershipSuccess
                }
            />


            {/* =================================================
                OCCUPANCY
            ================================================= */}

            <PropertyOccupancyModal
                show={
                    showOccupancyModal
                }
                property={
                    selectedProperty
                }
                occupancy={
                    selectedOccupancy
                }
                onClose={() => {

                    setShowOccupancyModal(
                        false
                    );

                    setSelectedOccupancy(
                        null
                    );

                    setShowDetailsModal(
                        true
                    );

                }}
                onSuccess={
                    handleOccupancySuccess
                }
            />

        </div>
    );
}