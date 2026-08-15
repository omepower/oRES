import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsCarFront,
    BsPlusLg,
} from "react-icons/bs";

import {
    getVehicles,
    deleteVehicle,
} from "../../api/vehicles";

import VehicleTable
    from "../../components/vehicles/VehicleTable";

import VehicleFormModal
    from "../../components/vehicles/VehicleFormModal";

import VehicleDetailsModal
    from "../../components/vehicles/VehicleDetailsModal";


export default function Vehicles() {

    const [
        vehicles,
        setVehicles,
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
        vehicleTypeFilter,
        setVehicleTypeFilter,
    ] = useState("ALL");

    const [
        activeFilter,
        setActiveFilter,
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
        selectedVehicle,
        setSelectedVehicle,
    ] = useState(null);

    const [
        editingVehicle,
        setEditingVehicle,
    ] = useState(null);


    /* =========================================================
       LOAD VEHICLES
    ========================================================= */

    const loadVehicles = useCallback(
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
                    vehicleTypeFilter !==
                    "ALL"
                ) {

                    params.vehicle_type =
                        vehicleTypeFilter;

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
                    await getVehicles(
                        params
                    );


                const data =
                    Array.isArray(
                        response
                    )
                        ? response
                        : response?.results ||
                          [];


                setVehicles(
                    data
                );

            } catch (err) {

                console.error(
                    "Failed to load vehicles:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to load vehicles."
                );

            } finally {

                setLoading(false);
            }

        },
        [
            search,
            vehicleTypeFilter,
            activeFilter,
        ]
    );


    useEffect(() => {

        loadVehicles();

    }, [
        loadVehicles,
    ]);


    /* =========================================================
       STATISTICS
    ========================================================= */

    const statistics =
        useMemo(() => {

            const active =
                vehicles.filter(
                    (vehicle) =>
                        vehicle.is_active
                ).length;


            const inactive =
                vehicles.filter(
                    (vehicle) =>
                        !vehicle.is_active
                ).length;


            const motorcycles =
                vehicles.filter(
                    (vehicle) =>
                        vehicle.vehicle_type ===
                        "MOTORCYCLE"
                ).length;


            const cars =
                vehicles.filter(
                    (vehicle) =>
                        [
                            "SEDAN",
                            "SUV",
                            "PICKUP",
                            "VAN",
                        ].includes(
                            vehicle.vehicle_type
                        )
                ).length;


            return {
                total:
                    vehicles.length,

                active,

                inactive,

                motorcycles,

                cars,
            };

        }, [
            vehicles,
        ]);


    /* =========================================================
       ADD
    ========================================================= */

    const handleAdd = () => {

        setEditingVehicle(
            null
        );

        setShowFormModal(
            true
        );

    };


    /* =========================================================
       EDIT
    ========================================================= */

    const handleEdit = (
        vehicle
    ) => {

        setEditingVehicle(
            vehicle
        );

        setShowFormModal(
            true
        );

    };


    /* =========================================================
       VIEW
    ========================================================= */

    const handleView = (
        vehicle
    ) => {

        setSelectedVehicle(
            vehicle
        );

        setShowDetailsModal(
            true
        );

    };


    /* =========================================================
       DELETE
    ========================================================= */

    const handleDelete = async (
        vehicle
    ) => {

        if (!vehicle?.id) {
            return;
        }


        const confirmed =
            window.confirm(
                `Are you sure you want to delete vehicle ${vehicle.plate_number}?`
            );


        if (!confirmed) {
            return;
        }


        setError("");


        try {

            await deleteVehicle(
                vehicle.id
            );

            await loadVehicles();

        } catch (err) {

            console.error(
                "Vehicle deletion failed:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                "Unable to delete vehicle."
            );

        }
    };


    /* =========================================================
       FORM SUCCESS
    ========================================================= */

    const handleFormSuccess =
        async () => {

            setShowFormModal(
                false
            );

            setEditingVehicle(
                null
            );

            await loadVehicles();

        };


    /* =========================================================
       CLEAR FILTERS
    ========================================================= */

    const clearFilters = () => {

        setSearch("");

        setVehicleTypeFilter(
            "ALL"
        );

        setActiveFilter(
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
                        Vehicles Management
                    </h1>

                    <p className="rems-page-description">
                        Manage resident vehicles registered
                        to subdivision properties.
                    </p>

                </div>


                <div className="rems-page-header-actions">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={
                            loadVehicles
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

                        Add Vehicle

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

                </div>

            )}


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="row g-3 mb-4">


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <BsCarFront />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Total Vehicles
                            </div>

                            <div className="rems-stat-value">
                                {statistics.total}
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
                                {statistics.active}
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <i className="bi bi-bicycle" />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Motorcycles
                            </div>

                            <div className="rems-stat-value">
                                {statistics.motorcycles}
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <BsCarFront />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Cars / SUVs
                            </div>

                            <div className="rems-stat-value">
                                {statistics.cars}
                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                GLASS CARD
            ================================================= */}

            <div className="rems-glass-card">


                <div className="rems-card-header">

                    <div>

                        <div className="rems-card-title">
                            Vehicle Registry
                        </div>

                        <div className="rems-card-subtitle">
                            Registered vehicles and
                            resident associations
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
                            placeholder="Search plate, make, model..."
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
                            vehicleTypeFilter
                        }
                        onChange={(event) =>
                            setVehicleTypeFilter(
                                event.target.value
                            )
                        }
                    >

                        <option value="ALL">
                            All Vehicle Types
                        </option>

                        <option value="MOTORCYCLE">
                            Motorcycles
                        </option>

                        <option value="SEDAN">
                            Sedans
                        </option>

                        <option value="SUV">
                            SUVs
                        </option>

                        <option value="PICKUP">
                            Pickups
                        </option>

                        <option value="VAN">
                            Vans
                        </option>

                        <option value="TRUCK">
                            Trucks
                        </option>

                        <option value="OTHER">
                            Other
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
                            All Statuses
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
                    SUMMARY
                ================================================= */}

                <div className="rems-table-toolbar">

                    <div>

                        <div className="rems-card-title">
                            Vehicle Records
                        </div>

                        <div className="rems-card-subtitle">

                            {loading
                                ? "Loading records..."
                                : `${vehicles.length} ${
                                      vehicles.length ===
                                      1
                                          ? "vehicle"
                                          : "vehicles"
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
                            Loading vehicles...
                        </div>

                    </div>

                ) : (

                    <VehicleTable
                        vehicles={
                            vehicles
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
                FORM MODAL
            ================================================= */}

            <VehicleFormModal
                show={
                    showFormModal
                }
                vehicle={
                    editingVehicle
                }
                onClose={() => {

                    setShowFormModal(
                        false
                    );

                    setEditingVehicle(
                        null
                    );

                }}
                onSuccess={
                    handleFormSuccess
                }
            />


            {/* =================================================
                DETAILS MODAL
            ================================================= */}

            <VehicleDetailsModal
                show={
                    showDetailsModal
                }
                vehicle={
                    selectedVehicle
                }
                onClose={() => {

                    setShowDetailsModal(
                        false
                    );

                    setSelectedVehicle(
                        null
                    );

                }}
            />

        </div>
    );
}