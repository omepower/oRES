import {
    useEffect,
    useState,
} from "react";

import {
    getVehicle,
} from "../../api/vehicles";


const getVehicleTypeLabel = (
    value
) => {

    switch (value) {

        case "MOTORCYCLE":
            return "Motorcycle";

        case "SEDAN":
            return "Sedan";

        case "SUV":
            return "SUV";

        case "PICKUP":
            return "Pickup";

        case "VAN":
            return "Van";

        case "TRUCK":
            return "Truck";

        case "OTHER":
            return "Other";

        default:
            return value || "—";
    }
};


const getOwnershipLabel = (
    value
) => {

    switch (value) {

        case "OWNED":
            return "Owned";

        case "COMPANY":
            return "Company";

        case "LEASED":
            return "Leased";

        case "OTHER":
            return "Other";

        default:
            return value || "—";
    }
};


export default function VehicleDetailsModal({
    show,
    vehicle,
    onClose,
}) {

    const [
        details,
        setDetails,
    ] = useState(null);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");


    useEffect(() => {

        if (
            !show ||
            !vehicle?.id
        ) {
            return;
        }


        loadDetails();

    }, [
        show,
        vehicle,
    ]);


    const loadDetails = async () => {

        setLoading(true);
        setError("");

        try {

            const data =
                await getVehicle(
                    vehicle.id
                );

            setDetails(
                data
            );

        } catch (err) {

            console.error(
                "Unable to load vehicle details:",
                err
            );

            /*
             * Fall back to the table record
             * if the detail endpoint fails.
             */

            setDetails(
                vehicle
            );

            setError(
                "Unable to refresh the vehicle record. Showing the available data."
            );

        } finally {

            setLoading(false);
        }
    };


    if (
        !show ||
        !vehicle
    ) {
        return null;
    }


    const current =
        details || vehicle;


    const residentName =
        current.registered_resident_name ||
        current.resident_name ||
        current.registered_resident_display ||
        "—";


    const propertyAddress =
        current.property_address ||
        "—";


    return (
        <div
            className="rems-modal-backdrop"
            onMouseDown={(event) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    onClose();
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
                            VEHICLE DETAILS
                        </div>

                        <h5 className="mb-1 fw-semibold">

                            {
                                current.make
                            }

                            {" "}

                            {
                                current.model
                            }

                        </h5>

                        <div className="rems-modal-subtitle">

                            {
                                current.plate_number
                            }

                        </div>

                    </div>


                    <button
                        type="button"
                        className="rems-modal-close"
                        onClick={
                            onClose
                        }
                    >

                        <i className="bi bi-x-lg" />

                    </button>

                </div>


                <div className="rems-modal-body">

                    {error && (

                        <div className="alert alert-warning rems-alert">

                            <i className="bi bi-exclamation-triangle me-2" />

                            {
                                error
                            }

                        </div>

                    )}


                    {loading ? (

                        <div className="rems-loading-state">

                            <div className="spinner-border" />

                            <div className="mt-3">
                                Loading vehicle details...
                            </div>

                        </div>

                    ) : (

                        <>

                            <div className="rems-form-section">

                                <div className="rems-form-section-title">

                                    <i className="bi bi-car-front me-2" />

                                    Vehicle Information

                                </div>


                                <div className="row g-3">


                                    <div className="col-12 col-md-6">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Vehicle
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        current.make
                                                    }

                                                    {" "}

                                                    {
                                                        current.model
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12 col-md-6">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Plate Number
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        current.plate_number
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12 col-md-4">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Type
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        current.vehicle_type_display ||
                                                        getVehicleTypeLabel(
                                                            current.vehicle_type
                                                        )
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12 col-md-4">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Color
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        current.color ||
                                                        "—"
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12 col-md-4">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Ownership
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        current.ownership_type_display ||
                                                        getOwnershipLabel(
                                                            current.ownership_type
                                                        )
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>


                            <div className="rems-form-section">

                                <div className="rems-form-section-title">

                                    <i className="bi bi-house me-2" />

                                    Registration

                                </div>


                                <div className="row g-3">


                                    <div className="col-12 col-md-6">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Property
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        propertyAddress
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12 col-md-6">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Registered Resident
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        residentName
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12">

                                        <span
                                            className={`rems-status-badge ${
                                                current.is_active
                                                    ? "rems-status-success"
                                                    : "rems-status-danger"
                                            }`}
                                        >

                                            <span className="rems-status-dot" />

                                            {current.is_active
                                                ? "Active Vehicle"
                                                : "Inactive Vehicle"}

                                        </span>

                                    </div>

                                </div>

                            </div>

                        </>

                    )}

                </div>


                <div className="rems-modal-footer">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={
                            onClose
                        }
                    >

                        Close

                    </button>

                </div>

            </div>

        </div>
    );
}