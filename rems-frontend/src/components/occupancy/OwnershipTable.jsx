import {
    BsEye,
    BsPencil,
    BsTrash,
} from "react-icons/bs";


export default function OwnershipTable({
    records = [],
    onView,
    onEdit,
    onDelete,
}) {

    if (!records.length) {

        return (
            <div className="rems-empty-state">

                <div className="rems-empty-icon">
                    <i className="bi bi-person-vcard" />
                </div>

                <div className="rems-empty-title">
                    No ownership records found
                </div>

                <p className="rems-empty-text">
                    Try changing your filters or create
                    a new homeowner assignment.
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
                            Homeowner
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
                                            record.homeowner_name ||
                                            "—"
                                        }

                                    </div>

                                    <div className="rems-table-secondary">

                                        {record.homeowner_username
                                            ? `@${record.homeowner_username}`
                                            : ""}

                                    </div>

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
                                            title="View ownership"
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
                                            title="Edit ownership"
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
                                            title="Delete ownership"
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