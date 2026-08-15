import {
    BsEye,
    BsPencil,
    BsTrash,
} from "react-icons/bs";


export default function OccupancyTable({
    records = [],
    onView,
    onEdit,
    onDelete,
}) {

    if (!records.length) {

        return (
            <div className="rems-empty-state">

                <div className="rems-empty-icon">
                    <i className="bi bi-house-check" />
                </div>

                <div className="rems-empty-title">
                    No occupancy records found
                </div>

                <p className="rems-empty-text">
                    Try changing your filters or create
                    a new occupancy assignment.
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
                            Property
                        </th>

                        <th>
                            Resident
                        </th>

                        <th>
                            Type
                        </th>

                        <th>
                            Start Date
                        </th>

                        <th>
                            End Date
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

                    {records.map(
                        (record) => (

                            <tr
                                key={
                                    record.id
                                }
                            >

                                <td>

                                    <div className="rems-table-primary">

                                        {
                                            record.property_address ||
                                            "—"
                                        }

                                    </div>

                                    <div className="rems-table-secondary">

                                        Property #
                                        {record.property}

                                    </div>

                                </td>


                                <td>

                                    <div className="rems-table-primary">

                                        {
                                            record.resident_name ||
                                            "—"
                                        }

                                    </div>

                                    <div className="rems-table-secondary">

                                        {record.resident_username
                                            ? `@${record.resident_username}`
                                            : ""}

                                    </div>

                                </td>


                                <td>

                                    <span className="rems-badge rems-badge-neutral">

                                        {
                                            record.occupancy_type_display ||
                                            record.occupancy_type ||
                                            "—"
                                        }

                                    </span>

                                </td>


                                <td>

                                    {
                                        record.start_date ||
                                        "—"
                                    }

                                </td>


                                <td>

                                    {
                                        record.end_date ||
                                        "Current"
                                    }

                                </td>


                                <td>

                                    <span
                                        className={`rems-status-badge ${
                                            record.is_active
                                                ? "rems-status-success"
                                                : "rems-status-secondary"
                                        }`}
                                    >

                                        <span className="rems-status-dot" />

                                        {record.is_active
                                            ? "Active"
                                            : "Historical"}

                                    </span>

                                </td>


                                <td>

                                    <div className="d-flex justify-content-end gap-1">

                                        <button
                                            type="button"
                                            className="rems-icon-button"
                                            title="View occupancy"
                                            onClick={() =>
                                                onView(
                                                    record
                                                )
                                            }
                                        >
                                            <BsEye />
                                        </button>


                                        <button
                                            type="button"
                                            className="rems-icon-button"
                                            title="Edit occupancy"
                                            onClick={() =>
                                                onEdit(
                                                    record
                                                )
                                            }
                                        >
                                            <BsPencil />
                                        </button>


                                        <button
                                            type="button"
                                            className="rems-icon-button rems-action-danger"
                                            title="Delete occupancy"
                                            onClick={() =>
                                                onDelete(
                                                    record
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