import {
    BsEye,
    BsPencil,
    BsTrash,
    BsCheckCircle,
    BsSlashCircle,
    BsClockHistory,
} from "react-icons/bs";


const getStatusLabel = (
    status
) => {

    switch (status) {

        case "PENDING":
            return "Pending";

        case "ACTIVE":
            return "Active";

        case "REVOKED":
            return "Revoked";

        case "EXPIRED":
            return "Expired";

        default:
            return status || "—";
    }
};


const getStatusClass = (
    status
) => {

    switch (status) {

        case "PENDING":
            return "rems-status-warning";

        case "ACTIVE":
            return "rems-status-success";

        case "REVOKED":
            return "rems-status-danger";

        case "EXPIRED":
            return "rems-status-secondary";

        default:
            return "rems-status-secondary";
    }
};


export default function StickerTable({
    stickers = [],
    onView,
    onEdit,
    onDelete,
    onApprove,
    onRevoke,
    onExpire,
    processingId = null,
}) {

    if (!stickers.length) {

        return (
            <div className="rems-empty-state">

                <div className="rems-empty-icon">

                    <i className="bi bi-shield-check" />

                </div>

                <div className="rems-empty-title">

                    No motorist stickers found

                </div>

                <p className="rems-empty-text">

                    Try changing your filters or
                    issue a new motorist sticker.

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
                            Sticker
                        </th>

                        <th>
                            Vehicle
                        </th>

                        <th>
                            Plate
                        </th>

                        <th>
                            Resident
                        </th>

                        <th>
                            Property
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

                    {stickers.map(
                        (sticker) => {

                            const resident =
                                sticker.resident_name ||
                                "—";


                            const property =
                                sticker.property_address ||
                                "—";


                            const vehicle =
                                sticker.vehicle_description ||
                                "—";


                            const plate =
                                sticker.vehicle_plate_number ||
                                "—";


                            const processing =
                                processingId ===
                                sticker.id;


                            return (
                                <tr
                                    key={
                                        sticker.id
                                    }
                                >

                                    {/* STICKER */}

                                    <td>

                                        <div className="rems-table-primary">

                                            {
                                                sticker.sticker_number ||
                                                "Pending Number"
                                            }

                                        </div>

                                        <div className="rems-table-secondary">

                                            {sticker.sticker_uuid
                                                ? "Secure sticker identity"
                                                : "Sticker record"}

                                        </div>

                                    </td>


                                    {/* VEHICLE */}

                                    <td>

                                        <div className="rems-table-primary">

                                            {
                                                vehicle
                                            }

                                        </div>

                                    </td>


                                    {/* PLATE */}

                                    <td>

                                        <span className="fw-semibold">

                                            {
                                                plate
                                            }

                                        </span>

                                    </td>


                                    {/* RESIDENT */}

                                    <td>

                                        <div className="rems-table-primary">

                                            {
                                                resident
                                            }

                                        </div>

                                    </td>


                                    {/* PROPERTY */}

                                    <td>

                                        <div className="rems-table-primary">

                                            {
                                                property
                                            }

                                        </div>

                                    </td>


                                    {/* STATUS */}

                                    <td>

                                        <span
                                            className={`rems-status-badge ${getStatusClass(
                                                sticker.status
                                            )}`}
                                        >

                                            <span className="rems-status-dot" />

                                            {
                                                sticker.status_display ||
                                                getStatusLabel(
                                                    sticker.status
                                                )
                                            }

                                        </span>

                                    </td>


                                    {/* ACTIONS */}

                                    <td>

                                        <div className="d-flex justify-content-end gap-1">


                                            {/* VIEW */}

                                            <button
                                                type="button"
                                                className="rems-icon-button"
                                                title="View sticker"
                                                onClick={() =>
                                                    onView(
                                                        sticker
                                                    )
                                                }
                                                disabled={
                                                    processing
                                                }
                                            >

                                                <BsEye />

                                            </button>


                                            {/* EDIT */}

                                            {(
                                                sticker.status ===
                                                    "PENDING" ||
                                                sticker.status ===
                                                    "ACTIVE"
                                            ) && (

                                                <button
                                                    type="button"
                                                    className="rems-icon-button"
                                                    title="Edit sticker"
                                                    onClick={() =>
                                                        onEdit(
                                                            sticker
                                                        )
                                                    }
                                                    disabled={
                                                        processing
                                                    }
                                                >

                                                    <BsPencil />

                                                </button>

                                            )}


                                            {/* APPROVE */}

                                            {sticker.status ===
                                                "PENDING" && (

                                                <button
                                                    type="button"
                                                    className="rems-icon-button"
                                                    title="Approve sticker"
                                                    onClick={() =>
                                                        onApprove(
                                                            sticker
                                                        )
                                                    }
                                                    disabled={
                                                        processing
                                                    }
                                                >

                                                    {processing ? (

                                                        <span
                                                            className="spinner-border spinner-border-sm"
                                                            aria-hidden="true"
                                                        />

                                                    ) : (

                                                        <BsCheckCircle />

                                                    )}

                                                </button>

                                            )}


                                            {/* REVOKE */}

                                            {sticker.status ===
                                                "ACTIVE" && (

                                                <button
                                                    type="button"
                                                    className="rems-icon-button rems-action-danger"
                                                    title="Revoke sticker"
                                                    onClick={() =>
                                                        onRevoke(
                                                            sticker
                                                        )
                                                    }
                                                    disabled={
                                                        processing
                                                    }
                                                >

                                                    {processing ? (

                                                        <span
                                                            className="spinner-border spinner-border-sm"
                                                            aria-hidden="true"
                                                        />

                                                    ) : (

                                                        <BsSlashCircle />

                                                    )}

                                                </button>

                                            )}


                                            {/* EXPIRE */}

                                            {sticker.status ===
                                                "ACTIVE" && (

                                                <button
                                                    type="button"
                                                    className="rems-icon-button"
                                                    title="Expire sticker"
                                                    onClick={() =>
                                                        onExpire(
                                                            sticker
                                                        )
                                                    }
                                                    disabled={
                                                        processing
                                                    }
                                                >

                                                    <BsClockHistory />

                                                </button>

                                            )}


                                            {/* DELETE */}

                                            <button
                                                type="button"
                                                className="rems-icon-button rems-action-danger"
                                                title="Delete sticker"
                                                onClick={() =>
                                                    onDelete(
                                                        sticker
                                                    )
                                                }
                                                disabled={
                                                    processing
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