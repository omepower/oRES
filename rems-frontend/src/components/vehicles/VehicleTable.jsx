import {
    BsEye,
    BsPencil,
    BsTrash,
} from "react-icons/bs";


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


export default function VehicleTable({
    vehicles = [],
    onView,
    onEdit,
    onDelete,
}) {

    if (!vehicles.length) {

        return (
            <div className="rems-empty-state">

                <div className="rems-empty-icon">

                    <i className="bi bi-car-front" />

                </div>

                <div className="rems-empty-title">
                    No vehicle records found
                </div>

                <p className="rems-empty-text">
                    Try changing your search or filters,
                    or register a new vehicle.
                </p>

            </div>
        );
    }


    return (
        <div className="table-responsive">

            <table className="table rems-table align-middle mb-0">

                <thead>

                    <tr>

                        <th>
                            Vehicle
                        </th>

                        <th>
                            Plate Number
                        </th>

                        <th>
                            Resident
                        </th>

                        <th>
                            Property
                        </th>

                        <th>
                            Type
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

                    {vehicles.map(
                        (vehicle) => {

                            const residentName =
                                vehicle.registered_resident_name ||
                                vehicle.resident_name ||
                                vehicle.registered_resident_display ||
                                "—";

                            const propertyAddress =
                                vehicle.property_address ||
                                "—";


                            return (
                                <tr
                                    key={
                                        vehicle.id
                                    }
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

                                            {vehicle.color ||
                                                "Color not specified"}

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

                                        <div className="rems-table-primary">
                                            {
                                                residentName
                                            }
                                        </div>

                                    </td>


                                    <td>

                                        <div className="rems-table-primary">

                                            {
                                                propertyAddress
                                            }

                                        </div>

                                    </td>


                                    <td>

                                        <span className="rems-badge rems-badge-neutral">

                                            {
                                                vehicle.vehicle_type_display ||
                                                getVehicleTypeLabel(
                                                    vehicle.vehicle_type
                                                )
                                            }

                                        </span>

                                    </td>


                                    <td>

                                        <span
                                            className={`rems-status-badge ${
                                                vehicle.is_active
                                                    ? "rems-status-success"
                                                    : "rems-status-danger"
                                            }`}
                                        >

                                            <span className="rems-status-dot" />

                                            {vehicle.is_active
                                                ? "Active"
                                                : "Inactive"}

                                        </span>

                                    </td>


                                    <td>

                                        <div className="d-flex justify-content-end gap-1">

                                            <button
                                                type="button"
                                                className="rems-icon-button"
                                                title="View vehicle"
                                                onClick={() =>
                                                    onView(
                                                        vehicle
                                                    )
                                                }
                                            >

                                                <BsEye />

                                            </button>


                                            <button
                                                type="button"
                                                className="rems-icon-button"
                                                title="Edit vehicle"
                                                onClick={() =>
                                                    onEdit(
                                                        vehicle
                                                    )
                                                }
                                            >

                                                <BsPencil />

                                            </button>


                                            <button
                                                type="button"
                                                className="rems-icon-button rems-action-danger"
                                                title="Delete vehicle"
                                                onClick={() =>
                                                    onDelete(
                                                        vehicle
                                                    )
                                                }
                                            >

                                                <BsTrash />

                                            </button>

                                        </div>

                                    </td>

                                </tr>
                            );
                        }
                    )}

                </tbody>

            </table>

        </div>
    );
}