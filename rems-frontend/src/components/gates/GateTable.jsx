import {
    BsEye,
    BsPencil,
    BsTrash,
} from "react-icons/bs";


const getGateTypeLabel = (
    value
) => {

    switch (value) {

        case "MAIN_ENTRANCE":
            return "Main Entrance";

        case "SECONDARY":
            return "Secondary Gate";

        case "SERVICE":
            return "Service Gate";

        case "EMERGENCY":
            return "Emergency Gate";

        default:
            return value || "—";
    }
};


export default function GateTable({
    gates = [],
    onView,
    onEdit,
    onDelete,
}) {

    if (!gates.length) {

        return (
            <div className="rems-empty-state">

                <div className="rems-empty-icon">

                    <i className="bi bi-door-open" />

                </div>

                <div className="rems-empty-title">
                    No gate records found
                </div>

                <p className="rems-empty-text">
                    Try changing your filters or
                    register a new gate.
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
                            Gate
                        </th>

                        <th>
                            Type
                        </th>

                        <th>
                            Location
                        </th>

                        <th>
                            Primary
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

                    {gates.map(
                        (gate) => (

                            <tr
                                key={
                                    gate.id
                                }
                            >

                                <td>

                                    <div className="rems-table-primary">
                                        {gate.name}
                                    </div>

                                    <div className="rems-table-secondary">

                                        Gate #
                                        {gate.id}

                                    </div>

                                </td>


                                <td>

                                    <span className="rems-badge rems-badge-neutral">

                                        {
                                            gate.gate_type_display ||
                                            getGateTypeLabel(
                                                gate.gate_type
                                            )
                                        }

                                    </span>

                                </td>


                                <td>

                                    <div className="rems-table-primary">

                                        {
                                            gate.location ||
                                            "Location not specified"
                                        }

                                    </div>

                                </td>


                                <td>

                                    {gate.is_primary ? (

                                        <span className="rems-status-badge rems-status-success">

                                            <span className="rems-status-dot" />

                                            Primary

                                        </span>

                                    ) : (

                                        <span className="rems-badge rems-badge-neutral">

                                            Standard

                                        </span>

                                    )}

                                </td>


                                <td>

                                    <span
                                        className={`rems-status-badge ${
                                            gate.is_active
                                                ? "rems-status-success"
                                                : "rems-status-danger"
                                        }`}
                                    >

                                        <span className="rems-status-dot" />

                                        {gate.is_active
                                            ? "Active"
                                            : "Inactive"}

                                    </span>

                                </td>


                                <td>

                                    <div className="d-flex justify-content-end gap-1">

                                        <button
                                            type="button"
                                            className="rems-icon-button"
                                            title="View gate"
                                            onClick={() =>
                                                onView(
                                                    gate
                                                )
                                            }
                                        >

                                            <BsEye />

                                        </button>


                                        <button
                                            type="button"
                                            className="rems-icon-button"
                                            title="Edit gate"
                                            onClick={() =>
                                                onEdit(
                                                    gate
                                                )
                                            }
                                        >

                                            <BsPencil />

                                        </button>


                                        <button
                                            type="button"
                                            className="rems-icon-button rems-action-danger"
                                            title="Delete gate"
                                            onClick={() =>
                                                onDelete(
                                                    gate
                                                )
                                            }
                                        >

                                            <BsTrash />

                                        </button>

                                    </div>

                                </td>

                            </tr>

                        )
                    )}

                </tbody>

            </table>

        </div>
    );
}