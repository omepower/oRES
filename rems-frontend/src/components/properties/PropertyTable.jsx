import {
    BsEye,
    BsPencil,
    BsTrash,
} from "react-icons/bs";


export default function PropertyTable({
    properties = [],
    onView,
    onEdit,
    onDelete,
}) {

    /* =========================================================
       EMPTY STATE
    ========================================================= */

    if (!properties.length) {

        return (
            <div className="rems-empty-state">

                <div className="rems-empty-icon">

                    <i className="bi bi-buildings" />

                </div>


                <div className="fw-semibold">
                    No property records found
                </div>


                <div className="small text-muted">
                    Try changing your search or filters.
                </div>

            </div>
        );

    }


    /* =========================================================
       HELPERS
    ========================================================= */

    const getStatusClass = (
        status
    ) => {

        switch (status) {

            case "OWNER_OCCUPIED":
                return "rems-status-success";

            case "TENANT_OCCUPIED":
                return "rems-status-info";

            case "VACANT":
            default:
                return "rems-status-secondary";

        }

    };


    const getStatusLabel = (
        property
    ) => {

        return (
            property.status_display ||
            (
                property.status ===
                "OWNER_OCCUPIED"
                    ? "Owner Occupied"
                    : property.status ===
                      "TENANT_OCCUPIED"
                    ? "Tenant Occupied"
                    : "Vacant"
            )
        );

    };


    const getOwnerName = (
        property
    ) => {

        return (
            property.current_owner_name ||
            ""
        );

    };


    const getOccupantName = (
        property
    ) => {

        return (
            property.current_occupant_name ||
            ""
        );

    };


    const getOccupantType = (
        property
    ) => {

        if (
            property.current_occupant_type ===
            "TENANT"
        ) {

            return "Tenant";

        }


        if (
            property.current_occupant_type ===
            "HOMEOWNER"
        ) {

            return "Homeowner";

        }


        return "";

    };


    /* =========================================================
       TABLE
    ========================================================= */

    return (
        <div className="table-responsive">

            <table className="table rems-table align-middle mb-0">

                <thead>

                    <tr>

                        <th>
                            Property
                        </th>

                        <th>
                            Block
                        </th>

                        <th>
                            Lot
                        </th>

                        <th>
                            Address
                        </th>

                        <th>
                            Status
                        </th>

                        <th>
                            Record
                        </th>

                        <th className="text-end">
                            Actions
                        </th>

                    </tr>

                </thead>


                <tbody>

                    {properties.map(
                        (
                            property
                        ) => {

                            const ownerName =
                                getOwnerName(
                                    property
                                );


                            const occupantName =
                                getOccupantName(
                                    property
                                );


                            const occupantType =
                                getOccupantType(
                                    property
                                );


                            const statusLabel =
                                getStatusLabel(
                                    property
                                );


                            return (

                                <tr
                                    key={
                                        property.id
                                    }
                                >


                                    {/* =================================================
                                        PROPERTY
                                    ================================================= */}

                                    <td>

                                        <div className="rems-table-primary">

                                            {
                                                property.subdivision ||
                                                "Main Subdivision"
                                            }

                                        </div>


                                        <div className="rems-table-secondary">

                                            {property.house_number

                                                ? `House ${property.house_number}`

                                                : "Property"}

                                        </div>

                                    </td>


                                    {/* =================================================
                                        BLOCK
                                    ================================================= */}

                                    <td>

                                        {
                                            property.block ||
                                            "—"
                                        }

                                    </td>


                                    {/* =================================================
                                        LOT
                                    ================================================= */}

                                    <td>

                                        {
                                            property.lot ||
                                            "—"
                                        }

                                    </td>


                                    {/* =================================================
                                        ADDRESS
                                    ================================================= */}

                                    <td>

                                        <div className="rems-table-primary">

                                            {
                                                property.address ||
                                                "—"
                                            }

                                        </div>


                                        {property.street && (

                                            <div className="rems-table-secondary">

                                                {
                                                    property.street
                                                }

                                            </div>

                                        )}

                                    </td>


                                    {/* =================================================
                                        STATUS
                                    ================================================= */}

                                    <td>

                                        <div className="d-flex flex-column align-items-start gap-1">


                                            {/* MAIN STATUS */}

                                            <span
                                                className={`rems-status-badge ${getStatusClass(
                                                    property.status
                                                )}`}
                                            >

                                                <span className="rems-status-dot" />

                                                {
                                                    statusLabel
                                                }

                                            </span>


                                            {/* OWNER */}

                                            {ownerName ? (

                                                <div
                                                    style={{
                                                        color:
                                                            "#657184",
                                                        fontSize:
                                                            "0.66rem",
                                                        lineHeight:
                                                            1.35,
                                                    }}
                                                >

                                                    <span
                                                        style={{
                                                            fontWeight:
                                                                600,
                                                            color:
                                                                "#596678",
                                                        }}
                                                    >
                                                        Owner:
                                                    </span>

                                                    {" "}

                                                    {
                                                        ownerName
                                                    }

                                                </div>

                                            ) : (

                                                <div
                                                    style={{
                                                        color:
                                                            "#9aa3af",
                                                        fontSize:
                                                            "0.64rem",
                                                    }}
                                                >

                                                    Not Owned

                                                </div>

                                            )}


                                            {/* OCCUPANT */}

                                            {occupantName ? (

                                                <div
                                                    style={{
                                                        color:
                                                            "#7b8695",
                                                        fontSize:
                                                            "0.64rem",
                                                        lineHeight:
                                                            1.35,
                                                    }}
                                                >

                                                    <span
                                                        style={{
                                                            fontWeight:
                                                                600,
                                                            color:
                                                                "#657184",
                                                        }}
                                                    >

                                                        Occupant:

                                                    </span>

                                                    {" "}

                                                    {
                                                        occupantName
                                                    }


                                                    {occupantType && (

                                                        <span
                                                            style={{
                                                                color:
                                                                    "#9aa3af",
                                                            }}
                                                        >

                                                            {" "}
                                                            •{" "}
                                                            {
                                                                occupantType
                                                            }

                                                        </span>

                                                    )}

                                                </div>

                                            ) : (

                                                <div
                                                    style={{
                                                        color:
                                                            "#9aa3af",
                                                        fontSize:
                                                            "0.64rem",
                                                    }}
                                                >

                                                    No current occupant

                                                </div>

                                            )}

                                        </div>

                                    </td>


                                    {/* =================================================
                                        RECORD
                                    ================================================= */}

                                    <td>

                                        <span
                                            className={`rems-status-badge ${
                                                property.is_active
                                                    ? "rems-status-success"
                                                    : "rems-status-danger"
                                            }`}
                                        >

                                            <span className="rems-status-dot" />

                                            {property.is_active
                                                ? "Active"
                                                : "Inactive"}

                                        </span>

                                    </td>


                                    {/* =================================================
                                        ACTIONS
                                    ================================================= */}

                                    <td>

                                        <div className="d-flex justify-content-end gap-1">


                                            {/* VIEW */}

                                            <button
                                                type="button"
                                                className="rems-icon-button"
                                                title="View property"
                                                onClick={() =>
                                                    onView(
                                                        property
                                                    )
                                                }
                                            >

                                                <BsEye />

                                            </button>


                                            {/* EDIT */}

                                            <button
                                                type="button"
                                                className="rems-icon-button"
                                                title="Edit property"
                                                onClick={() =>
                                                    onEdit(
                                                        property
                                                    )
                                                }
                                            >

                                                <BsPencil />

                                            </button>


                                            {/* DELETE */}

                                            <button
                                                type="button"
                                                className="rems-icon-button rems-action-danger"
                                                title="Delete property"
                                                onClick={() =>
                                                    onDelete(
                                                        property
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