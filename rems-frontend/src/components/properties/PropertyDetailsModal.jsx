
import {
    useEffect,
    useState,
} from "react";

import {
    BsBuilding,
    BsPerson,
    BsPersonVcard,
    BsClockHistory,
    BsHouseCheck,
    BsHouseDash,
} from "react-icons/bs";

import {
    getCurrentPropertyOwner,
    getCurrentPropertyOccupant,
    getPropertyOccupancyHistory,
    getPropertyOwnershipHistory,
} from "../../api/properties";


export default function PropertyDetailsModal({
    show,
    property,
    onClose,
    onAssignOwnership,
    onAssignOccupancy,
}) {

    const [
        owner,
        setOwner,
    ] = useState(null);

    const [
        occupant,
        setOccupant,
    ] = useState(null);

    const [
        ownershipHistory,
        setOwnershipHistory,
    ] = useState([]);

    const [
        occupancyHistory,
        setOccupancyHistory,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");


    /*
    |--------------------------------------------------------------------------
    | Load Property Details
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (
            !show ||
            !property?.id
        ) {
            return;
        }

        loadDetails();

    }, [
        show,
        property,
    ]);


    const loadDetails = async () => {

        setLoading(true);
        setError("");

        setOwner(null);
        setOccupant(null);
        setOwnershipHistory([]);
        setOccupancyHistory([]);


        try {

            const results =
                await Promise.allSettled([

                    getCurrentPropertyOwner(
                        property.id
                    ),

                    getCurrentPropertyOccupant(
                        property.id
                    ),

                    getPropertyOwnershipHistory(
                        property.id
                    ),

                    getPropertyOccupancyHistory(
                        property.id
                    ),

                ]);


                <div className="d-flex flex-wrap justify-content-end gap-2 mb-3">

                        <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={onAssignOwnership}
                        >
                            <i className="bi bi-person-vcard me-2" />
                            Assign Homeowner
                        </button>

                        <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={onAssignOccupancy}
                        >
                            <i className="bi bi-person-plus me-2" />
                            Assign Occupant
                        </button>

                    </div>


            /*
             * Current owner
             */

            if (
                results[0].status ===
                "fulfilled"
            ) {

                setOwner(
                    results[0].value
                );
            }


            /*
             * Current occupant
             *
             * A 404 is valid when the property
             * currently has no active occupant.
             */

            if (
                results[1].status ===
                "fulfilled"
            ) {

                setOccupant(
                    results[1].value
                );
            }


            /*
             * Ownership history
             */

            if (
                results[2].status ===
                "fulfilled"
            ) {

                const ownership =
                    results[2].value;

                setOwnershipHistory(
                    Array.isArray(
                        ownership
                    )
                        ? ownership
                        : ownership?.results ||
                          []
                );
            }


            /*
             * Occupancy history
             */

            if (
                results[3].status ===
                "fulfilled"
            ) {

                const occupancy =
                    results[3].value;

                setOccupancyHistory(
                    Array.isArray(
                        occupancy
                    )
                        ? occupancy
                        : occupancy?.results ||
                          []
                );
            }


            /*
             * Only show a general error when
             * the history endpoints themselves
             * fail unexpectedly.
             */

            const unexpectedErrors =
                results.filter(
                    (result) =>
                        result.status ===
                        "rejected"
                );


            if (
                unexpectedErrors.length ===
                results.length
            ) {

                setError(
                    "Unable to load property details."
                );
            }

        } catch (err) {

            console.error(
                "Property detail loading failed:",
                err
            );

            setError(
                "Unable to load property details."
            );

        } finally {

            setLoading(false);
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Format Date
    |--------------------------------------------------------------------------
    */

    const formatDate = (
        value
    ) => {

        if (!value) {
            return "—";
        }

        try {

            return new Date(
                `${value}T00:00:00`
            ).toLocaleDateString(
                undefined,
                {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                }
            );

        } catch {

            return value;
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Status Label
    |--------------------------------------------------------------------------
    */

    const getPropertyStatusLabel =
        () => {

            switch (
                property?.status
            ) {

                case "VACANT":
                    return "Vacant";

                case "OWNER_OCCUPIED":
                    return "Owner Occupied";

                case "TENANT_OCCUPIED":
                    return "Tenant Occupied";

                default:
                    return (
                        property?.status_display ||
                        property?.status ||
                        "Unknown"
                    );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Close
    |--------------------------------------------------------------------------
    */

    const handleClose = () => {

        if (loading) {
            return;
        }

        onClose();
    };


    if (
        !show ||
        !property
    ) {
        return null;
    }


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <div
            className="rems-modal-backdrop"
            onMouseDown={(event) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    handleClose();

                }

            }}
        >

            <div
                className="rems-modal rems-property-details-modal"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >


                {/* =========================================================
                    HEADER
                   ========================================================= */}

                <div className="rems-modal-header">

                    <div className="d-flex align-items-center gap-3">

                        <div className="rems-property-detail-icon">

                            <BsBuilding />

                        </div>


                        <div>

                            <div className="rems-page-eyebrow">
                                PROPERTY DETAILS
                            </div>

                            <h5 className="mb-1 fw-semibold">
                                {property.address}
                            </h5>

                            <div className="small text-muted">

                                {property.subdivision ||
                                    "Main Subdivision"}

                                {" • Block "}
                                {property.block}

                                {" • Lot "}
                                {property.lot}

                            </div>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="rems-modal-close"
                        onClick={
                            handleClose
                        }
                        disabled={loading}
                        aria-label="Close"
                    >

                        <i className="bi bi-x-lg" />

                    </button>

                </div>


                {/* =========================================================
                    BODY
                   ========================================================= */}

                <div className="rems-modal-body">


                    {error && (

                        <div className="alert alert-danger rems-alert">

                            <i className="bi bi-exclamation-circle me-2" />

                            {error}

                        </div>

                    )}


                    {loading ? (

                        <div className="rems-loading-state">

                            <div
                                className="spinner-border"
                                role="status"
                            />

                            <div className="small text-muted mt-3">
                                Loading property information...
                            </div>

                        </div>

                    ) : (

                        <>


                            {/* =================================================
                                PROPERTY OVERVIEW
                               ================================================= */}

                            <section className="rems-property-detail-section">

                                <div className="rems-property-section-heading">

                                    <div>

                                        <h6 className="mb-1 fw-semibold">
                                            Property Overview
                                        </h6>

                                        <div className="small text-muted">
                                            Current property record
                                        </div>

                                    </div>

                                </div>


                                <div className="row g-3">


                                    {/* Status */}

                                    <div className="col-12 col-md-4">

                                        <div className="rems-property-info-card">

                                            <div className="rems-property-info-icon">

                                                {property.status ===
                                                "VACANT" ? (
                                                    <BsHouseDash />
                                                ) : (
                                                    <BsHouseCheck />
                                                )}

                                            </div>


                                            <div>

                                                <div className="rems-property-info-label">
                                                    Property Status
                                                </div>

                                                <div className="rems-property-info-value">

                                                    {getPropertyStatusLabel()}

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    {/* Record */}

                                    <div className="col-12 col-md-4">

                                        <div className="rems-property-info-card">

                                            <div className="rems-property-info-icon">

                                                <BsBuilding />

                                            </div>


                                            <div>

                                                <div className="rems-property-info-label">
                                                    Record Status
                                                </div>

                                                <div className="rems-property-info-value">

                                                    {property.is_active
                                                        ? "Active"
                                                        : "Inactive"}

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    {/* Address */}

                                    <div className="col-12 col-md-4">

                                        <div className="rems-property-info-card">

                                            <div className="rems-property-info-icon">

                                                <BsBuilding />

                                            </div>


                                            <div>

                                                <div className="rems-property-info-label">
                                                    Address
                                                </div>

                                                <div className="rems-property-info-value">

                                                    {property.address}

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </section>


                            {/* =================================================
                                CURRENT OWNER / OCCUPANT
                               ================================================= */}

                            <section className="rems-property-detail-section">

                                <div className="rems-property-section-heading">

                                    <div>

                                        <h6 className="mb-1 fw-semibold">
                                            Current Residents
                                        </h6>

                                        <div className="small text-muted">
                                            Current ownership and occupancy
                                        </div>

                                    </div>

                                </div>


                                <div className="row g-3">


                                    {/* CURRENT OWNER */}

                                    <div className="col-12 col-lg-6">

                                        <div className="rems-property-person-card">

                                            <div className="rems-property-person-icon">

                                                <BsPersonVcard />

                                            </div>


                                            <div className="flex-grow-1">

                                                <div className="rems-property-info-label">
                                                    Current Homeowner
                                                </div>


                                                {owner ? (

                                                    <>

                                                        <div className="rems-property-person-name">

                                                            {
                                                                owner.homeowner_name ||
                                                                "Homeowner"
                                                            }

                                                        </div>


                                                        <div className="small text-muted">

                                                            {owner.homeowner_username
                                                                ? `@${owner.homeowner_username}`
                                                                : "Homeowner"}

                                                        </div>


                                                        <div className="small text-muted mt-1">

                                                            Ownership started{" "}

                                                            {formatDate(
                                                                owner.start_date
                                                            )}

                                                        </div>

                                                    </>

                                                ) : (

                                                    <div className="text-muted small">

                                                        No active homeowner
                                                        record.

                                                    </div>

                                                )}

                                            </div>

                                        </div>

                                    </div>


                                    {/* CURRENT OCCUPANT */}

                                    <div className="col-12 col-lg-6">

                                        <div className="rems-property-person-card">

                                            <div className="rems-property-person-icon">

                                                <BsPerson />

                                            </div>


                                            <div className="flex-grow-1">

                                                <div className="rems-property-info-label">
                                                    Current Occupant
                                                </div>


                                                {occupant ? (

                                                    <>

                                                        <div className="rems-property-person-name">

                                                            {
                                                                occupant.resident_name ||
                                                                "Resident"
                                                            }

                                                        </div>


                                                        <div className="small text-muted">

                                                            {occupant.resident_username
                                                                ? `@${occupant.resident_username}`
                                                                : "Resident"}

                                                        </div>


                                                        <div className="small text-muted mt-1">

                                                            {occupant.occupancy_type_display ||
                                                                occupant.occupancy_type}

                                                            {" • Started "}

                                                            {formatDate(
                                                                occupant.start_date
                                                            )}

                                                        </div>

                                                    </>

                                                ) : (

                                                    <div className="text-muted small">

                                                        No active occupant
                                                        record.

                                                    </div>

                                                )}

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </section>


                            {/* =================================================
                                OWNERSHIP HISTORY
                               ================================================= */}

                            <section className="rems-property-detail-section">

                                <div className="d-flex align-items-center justify-content-between mb-3">

                                    <div>

                                        <h6 className="mb-1 fw-semibold">
                                            Ownership History
                                        </h6>

                                        <div className="small text-muted">
                                            Historical homeowner records
                                        </div>

                                    </div>


                                    <span className="badge bg-light text-dark">

                                        {
                                            ownershipHistory.length
                                        }

                                        {" "}
                                        record
                                        {ownershipHistory.length === 1
                                            ? ""
                                            : "s"}

                                    </span>

                                </div>


                                {ownershipHistory.length === 0 ? (

                                    <div className="rems-property-empty-history">

                                        <BsClockHistory />

                                        <span>
                                            No ownership history
                                            recorded.
                                        </span>

                                    </div>

                                ) : (

                                    <div className="table-responsive">

                                        <table className="table table-sm align-middle mb-0">

                                            <thead>

                                                <tr>

                                                    <th>
                                                        Homeowner
                                                    </th>

                                                    <th>
                                                        Start
                                                    </th>

                                                    <th>
                                                        End
                                                    </th>

                                                    <th>
                                                        Status
                                                    </th>

                                                </tr>

                                            </thead>


                                            <tbody>

                                                {ownershipHistory.map(
                                                    (record) => (

                                                        <tr
                                                            key={
                                                                record.id
                                                            }
                                                        >

                                                            <td>

                                                                <div className="fw-semibold">

                                                                    {
                                                                        record.homeowner_name ||
                                                                        "—"
                                                                    }

                                                                </div>

                                                                <div className="small text-muted">

                                                                    {record.homeowner_username
                                                                        ? `@${record.homeowner_username}`
                                                                        : ""}

                                                                </div>

                                                            </td>


                                                            <td>
                                                                {
                                                                    formatDate(
                                                                        record.start_date
                                                                    )
                                                                }
                                                            </td>


                                                            <td>
                                                                {
                                                                    formatDate(
                                                                        record.end_date
                                                                    )
                                                                }
                                                            </td>


                                                            <td>

                                                                <span
                                                                    className={`badge ${
                                                                        record.is_active
                                                                            ? "bg-success"
                                                                            : "bg-secondary"
                                                                    }`}
                                                                >

                                                                    {record.is_active
                                                                        ? "Active"
                                                                        : "Historical"}

                                                                </span>

                                                            </td>

                                                        </tr>

                                                    )
                                                )}

                                            </tbody>

                                        </table>

                                    </div>

                                )}

                            </section>


                            {/* =================================================
                                OCCUPANCY HISTORY
                               ================================================= */}

                            <section className="rems-property-detail-section">

                                <div className="d-flex align-items-center justify-content-between mb-3">

                                    <div>

                                        <h6 className="mb-1 fw-semibold">
                                            Occupancy History
                                        </h6>

                                        <div className="small text-muted">
                                            Historical resident occupancy
                                            records
                                        </div>

                                    </div>


                                    <span className="badge bg-light text-dark">

                                        {
                                            occupancyHistory.length
                                        }

                                        {" "}
                                        record
                                        {occupancyHistory.length === 1
                                            ? ""
                                            : "s"}

                                    </span>

                                </div>


                                {occupancyHistory.length === 0 ? (

                                    <div className="rems-property-empty-history">

                                        <BsClockHistory />

                                        <span>
                                            No occupancy history
                                            recorded.
                                        </span>

                                    </div>

                                ) : (

                                    <div className="table-responsive">

                                        <table className="table table-sm align-middle mb-0">

                                            <thead>

                                                <tr>

                                                    <th>
                                                        Resident
                                                    </th>

                                                    <th>
                                                        Type
                                                    </th>

                                                    <th>
                                                        Start
                                                    </th>

                                                    <th>
                                                        End
                                                    </th>

                                                    <th>
                                                        Status
                                                    </th>

                                                </tr>

                                            </thead>


                                            <tbody>

                                                {occupancyHistory.map(
                                                    (record) => (

                                                        <tr
                                                            key={
                                                                record.id
                                                            }
                                                        >

                                                            <td>

                                                                <div className="fw-semibold">

                                                                    {
                                                                        record.resident_name ||
                                                                        "—"
                                                                    }

                                                                </div>

                                                                <div className="small text-muted">

                                                                    {record.resident_username
                                                                        ? `@${record.resident_username}`
                                                                        : ""}

                                                                </div>

                                                            </td>


                                                            <td>

                                                                {
                                                                    record.occupancy_type_display ||
                                                                    record.occupancy_type
                                                                }

                                                            </td>


                                                            <td>
                                                                {
                                                                    formatDate(
                                                                        record.start_date
                                                                    )
                                                                }
                                                            </td>


                                                            <td>
                                                                {
                                                                    formatDate(
                                                                        record.end_date
                                                                    )
                                                                }
                                                            </td>


                                                            <td>

                                                                <span
                                                                    className={`badge ${
                                                                        record.is_active
                                                                            ? "bg-success"
                                                                            : "bg-secondary"
                                                                    }`}
                                                                >

                                                                    {record.is_active
                                                                        ? "Active"
                                                                        : "Historical"}

                                                                </span>

                                                            </td>

                                                        </tr>
                                                    )
                                                )}

                                            </tbody>

                                        </table>

                                    </div>

                                )}

                            </section>


                        </>

                    )}

                </div>


                {/* =========================================================
                    FOOTER
                   ========================================================= */}

                <div className="rems-modal-footer">

                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={
                            handleClose
                        }
                        disabled={loading}
                    >

                        Close

                    </button>

                </div>

            </div>

        </div>
    );
}
