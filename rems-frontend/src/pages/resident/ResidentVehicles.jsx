
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
    BsShieldCheck,
} from "react-icons/bs";

import {
    getMyVehicles,
    deleteVehicle,
} from "../../api/vehicles";

import ResidentVehicleFormModal
    from "../../components/vehicles/ResidentVehicleFormModal";

import VehicleDetailsModal
    from "../../components/vehicles/VehicleDetailsModal";


export default function ResidentVehicles() {

    const [vehicles, setVehicles] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [showFormModal, setShowFormModal] =
        useState(false);

    const [showDetailsModal, setShowDetailsModal] =
        useState(false);

    const [selectedVehicle, setSelectedVehicle] =
        useState(null);

    const [editingVehicle, setEditingVehicle] =
        useState(null);

    const [confirmation, setConfirmation] =
        useState(null);

    const [processingId, setProcessingId] =
        useState(null);


    const loadVehicles = useCallback(
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
                    await getMyVehicles();

                const data =
                    Array.isArray(response)
                        ? response
                        : response?.results ||
                          response?.vehicles ||
                          [];

                setVehicles(data);

            } catch (err) {

                console.error(
                    "[Resident Vehicles] Failed to load:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to load your vehicles."
                );

            } finally {

                setLoading(false);
                setRefreshing(false);

            }
        },
        []
    );


    useEffect(() => {
        loadVehicles();
    }, [
        loadVehicles,
    ]);


    const statistics =
        useMemo(() => {

            return {
                total:
                    vehicles.length,

                active:
                    vehicles.filter(
                        (vehicle) =>
                            vehicle.is_active !== false
                    ).length,

                motorcycles:
                    vehicles.filter(
                        (vehicle) =>
                            vehicle.vehicle_type ===
                            "MOTORCYCLE"
                    ).length,

                other:
                    vehicles.filter(
                        (vehicle) =>
                            ![
                                "MOTORCYCLE",
                                "SEDAN",
                                "SUV",
                                "PICKUP",
                                "VAN",
                            ].includes(
                                vehicle.vehicle_type
                            )
                    ).length,
            };

        }, [
            vehicles,
        ]);


    const handleAdd = () => {

        setEditingVehicle(null);
        setShowFormModal(true);

    };


    const handleEdit = (
        vehicle
    ) => {

        setEditingVehicle(vehicle);
        setShowFormModal(true);

    };


    const handleView = (
        vehicle
    ) => {

        setSelectedVehicle(vehicle);
        setShowDetailsModal(true);

    };


    const openDeleteConfirmation = (
        vehicle
    ) => {

        if (!vehicle?.id) {
            return;
        }

        setConfirmation({
            vehicle,
        });

    };


    const executeDelete = async () => {

        if (!confirmation?.vehicle?.id) {
            return;
        }

        const vehicle =
            confirmation.vehicle;

        setProcessingId(
            vehicle.id
        );

        setError("");

        try {

            await deleteVehicle(
                vehicle.id
            );

            setConfirmation(null);

            await loadVehicles();

        } catch (err) {

            console.error(
                "[Resident Vehicles] Delete failed:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                "Unable to delete the vehicle."
            );

        } finally {

            setProcessingId(null);

        }
    };


    const handleSuccess = async () => {

        setShowFormModal(false);
        setEditingVehicle(null);

        await loadVehicles();

    };


    return (

        <div className="rems-page-content">


            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">
                        RESIDENT PORTAL
                    </div>

                    <h1 className="rems-page-title">
                        My Vehicles
                    </h1>

                    <p className="rems-page-description">
                        Manage vehicles currently registered
                        to your authorized residence.
                    </p>

                </div>


                <div className="rems-page-header-actions">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() =>
                            loadVehicles(true)
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
                        onClick={handleAdd}
                    >

                        <BsPlusLg />

                        Register Vehicle

                    </button>

                </div>

            </div>


            {error && (

                <div className="alert alert-danger rems-alert mb-4">

                    <i className="bi bi-exclamation-circle me-2" />

                    {error}

                </div>

            )}


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
                            <BsShieldCheck />
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
                            <i className="bi bi-car-front" />
                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Other Types
                            </div>

                            <div className="rems-stat-value">
                                {statistics.other}
                            </div>

                        </div>

                    </div>

                </div>

            </div>


            <div className="rems-glass-card">

                <div className="rems-card-header">

                    <div>

                        <div className="rems-card-title">
                            Vehicle Registry
                        </div>

                        <div className="rems-card-subtitle">
                            Vehicles associated with your residence.
                        </div>

                    </div>

                </div>


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

                ) : vehicles.length === 0 ? (

                    <div className="rems-empty-state">

                        <div className="rems-empty-icon">
                            <BsCarFront />
                        </div>

                        <div className="rems-empty-title">
                            No vehicles registered
                        </div>

                        <p className="rems-empty-text">
                            Register your first vehicle to begin
                            managing motorist access.
                        </p>

                        <button
                            type="button"
                            className="rems-primary-button mt-3"
                            onClick={handleAdd}
                        >
                            <BsPlusLg />
                            Register Vehicle
                        </button>

                    </div>

                ) : (

                    <div className="rems-table-wrapper">

                        <table className="table rems-table align-middle mb-0">

                            <thead>

                                <tr>

                                    <th>
                                        Vehicle
                                    </th>

                                    <th>
                                        Plate
                                    </th>

                                    <th>
                                        Type
                                    </th>

                                    <th>
                                        Property
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Sticker
                                    </th>

                                    <th className="text-end">
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {vehicles.map(
                                    (vehicle) => (

                                        <tr
                                            key={vehicle.id}
                                        >

                                            <td>

                                                <div className="rems-table-primary">

                                                    {
                                                        vehicle.make
                                                    }

                                                    {" "}

                                                    {
                                                        vehicle.model
                                                    }

                                                </div>

                                                <div className="rems-table-secondary">

                                                    {
                                                        vehicle.color ||
                                                        "Color unavailable"
                                                    }

                                                </div>

                                            </td>


                                            <td>

                                                <span className="fw-semibold">

                                                    {
                                                        vehicle.plate_number
                                                    }

                                                </span>

                                            </td>


                                            <td>

                                                {
                                                    vehicle.vehicle_type_display ||
                                                    vehicle.vehicle_type ||
                                                    "—"
                                                }

                                            </td>


                                            <td>

                                                <div className="rems-table-primary">

                                                    {
                                                        vehicle.property_address ||
                                                        "—"
                                                    }

                                                </div>

                                            </td>


                                            <td>

                                                <span
                                                    className={`rems-status-badge ${
                                                        vehicle.is_active !== false
                                                            ? "rems-status-success"
                                                            : "rems-status-danger"
                                                    }`}
                                                >

                                                    <span className="rems-status-dot" />

                                                    {
                                                        vehicle.is_active !== false
                                                            ? "Active"
                                                            : "Inactive"
                                                    }

                                                </span>

                                            </td>


                                            <td>

                                                {vehicle.motorist_sticker ? (

                                                    <span className="rems-status-badge rems-status-success">

                                                        <span className="rems-status-dot" />

                                                        Stickered

                                                    </span>

                                                ) : (

                                                    <span className="rems-status-badge rems-status-secondary">

                                                        <span className="rems-status-dot" />

                                                        No Sticker

                                                    </span>

                                                )}

                                            </td>


                                            <td>

                                                <div className="d-flex justify-content-end gap-1">

                                                    <button
                                                        type="button"
                                                        className="rems-icon-button"
                                                        title="View vehicle"
                                                        onClick={() =>
                                                            handleView(
                                                                vehicle
                                                            )
                                                        }
                                                    >

                                                        <i className="bi bi-eye" />

                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="rems-icon-button"
                                                        title="Edit vehicle"
                                                        onClick={() =>
                                                            handleEdit(
                                                                vehicle
                                                            )
                                                        }
                                                    >

                                                        <i className="bi bi-pencil" />

                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="rems-icon-button rems-action-danger"
                                                        title="Delete vehicle"
                                                        onClick={() =>
                                                            openDeleteConfirmation(
                                                                vehicle
                                                            )
                                                        }
                                                    >

                                                        <i className="bi bi-trash" />

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


            <ResidentVehicleFormModal
                show={showFormModal}
                vehicle={editingVehicle}
                onClose={() => {

                    setShowFormModal(false);
                    setEditingVehicle(null);

                }}
                onSuccess={handleSuccess}
            />


            <VehicleDetailsModal
                show={showDetailsModal}
                vehicle={selectedVehicle}
                onClose={() => {

                    setShowDetailsModal(false);
                    setSelectedVehicle(null);

                }}
            />


            {confirmation && (

                <div
                    className="rems-modal-backdrop"
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
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="rems-modal-header">

                            <div>

                                <div className="rems-page-eyebrow">
                                    VEHICLE MANAGEMENT
                                </div>

                                <div className="rems-modal-title">
                                    Delete Vehicle
                                </div>

                                <div className="rems-modal-subtitle">

                                    Delete{" "}
                                    {
                                        confirmation.vehicle?.plate_number ||
                                        "this vehicle"
                                    }?

                                </div>

                            </div>


                            <button
                                type="button"
                                className="rems-modal-close"
                                onClick={() =>
                                    setConfirmation(null)
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
                                        color: "#b02a37",
                                    }}
                                >

                                    <i className="bi bi-trash" />

                                </div>


                                <div>

                                    <div className="fw-semibold mb-1">
                                        This action cannot be undone.
                                    </div>

                                    <div className="small text-muted">
                                        Removing this vehicle will also
                                        prevent it from being used for a
                                        future motorist sticker registration.
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
                                Keep Vehicle
                            </button>


                            <button
                                type="button"
                                className="rems-primary-button bg-danger border-danger"
                                onClick={
                                    executeDelete
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
                                        Deleting...
                                    </>

                                ) : (

                                    <>
                                        <i className="bi bi-trash" />
                                        Delete Vehicle
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
