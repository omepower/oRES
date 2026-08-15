import {
    useEffect,
    useState,
} from "react";

import {
    BsBuilding,
    BsX,
    BsCheckCircle,
    BsInfoCircle,
    BsHouseCheck,
    BsPersonCheck,
    BsPerson,
} from "react-icons/bs";

import {
    createProperty,
    updateProperty,
} from "../../api/properties";


const initialForm = {

    subdivision:
        "Main Subdivision",

    block:
        "",

    lot:
        "",

    house_number:
        "",

    street:
        "",

    address:
        "",

    is_active:
        true,

};


export default function PropertyFormModal({
    show,
    property,
    onClose,
    onSuccess,
}) {

    /* =========================================================
       STATE
    ========================================================= */

    const [
        form,
        setForm,
    ] = useState(
        initialForm
    );


    const [
        errors,
        setErrors,
    ] = useState({});


    const [
        saving,
        setSaving,
    ] = useState(false);


    const isEditing =
        Boolean(
            property?.id
        );


    /* =========================================================
       DERIVED PROPERTY INFORMATION
    ========================================================= */

    const propertyStatus =
        property?.status ||
        "VACANT";


    const statusLabels = {

        VACANT:
            "Vacant",

        OWNER_OCCUPIED:
            "Owner Occupied",

        TENANT_OCCUPIED:
            "Tenant Occupied",

    };


    const statusLabel =
        property?.status_display ||
        statusLabels[
            propertyStatus
        ] ||
        "Vacant";


    const ownershipStatus =
        property?.ownership_status ===
        "OWNED"
            ? "Owned"
            : "Not Owned";


    const ownershipIsActive =
        property?.ownership_status ===
        "OWNED";


    const currentOwnerName =
        property?.current_owner_name ||
        "";


    const currentOwnerUsername =
        property?.current_owner_username ||
        "";


    const currentOccupantName =
        property?.current_occupant_name ||
        "";


    const currentOccupantUsername =
        property?.current_occupant_username ||
        "";


    const currentOccupantType =
        property?.current_occupant_type ||
        "";


    /* =========================================================
       LOAD PROPERTY
    ========================================================= */

    useEffect(
        () => {

            if (!show) {

                return;
            }


            if (property) {

                setForm({

                    subdivision:
                        property.subdivision ||
                        "Main Subdivision",

                    block:
                        property.block ||
                        "",

                    lot:
                        property.lot ||
                        "",

                    house_number:
                        property.house_number ||
                        "",

                    street:
                        property.street ||
                        "",

                    address:
                        property.address ||
                        "",

                    is_active:
                        property.is_active !==
                        false,

                });

            } else {

                setForm(
                    initialForm
                );

            }


            setErrors({});

        },
        [
            show,
            property,
        ]
    );


    /* =========================================================
       HANDLE INPUT
    ========================================================= */

    const handleChange = (
        event
    ) => {

        const {
            name,
            value,
            type,
            checked,
        } = event.target;


        setForm(
            (
                previous
            ) => ({

                ...previous,

                [name]:
                    type === "checkbox"
                        ? checked
                        : value,

            })
        );


        setErrors(
            (
                previous
            ) => ({

                ...previous,

                [name]:
                    undefined,

                general:
                    undefined,

            })
        );

    };


    /* =========================================================
       ERROR FORMATTER
    ========================================================= */

    const getErrorText = (
        value
    ) => {

        if (
            Array.isArray(
                value
            )
        ) {

            return value.join(
                " "
            );

        }


        if (
            typeof value ===
            "string"
        ) {

            return value;

        }


        return "";

    };


    /* =========================================================
       SUBMIT
    ========================================================= */

    const handleSubmit =
        async (
            event
        ) => {

            event.preventDefault();

            setSaving(
                true
            );

            setErrors({});


            try {

                /*
                 * IMPORTANT:
                 *
                 * Property status is NOT submitted.
                 *
                 * The backend calculates status from
                 * the active PropertyOccupancy record.
                 */

                const payload = {

                    subdivision:
                        form.subdivision
                            .trim(),

                    block:
                        form.block
                            .trim(),

                    lot:
                        form.lot
                            .trim(),

                    house_number:
                        form.house_number
                            .trim(),

                    street:
                        form.street
                            .trim(),

                    address:
                        form.address
                            .trim(),

                    is_active:
                        form.is_active,

                };


                let savedProperty;


                if (isEditing) {

                    savedProperty =
                        await updateProperty(
                            property.id,
                            payload
                        );

                } else {

                    savedProperty =
                        await createProperty(
                            payload
                        );

                }


                if (onSuccess) {

                    await onSuccess(
                        savedProperty
                    );

                }

            } catch (
                error
            ) {

                console.error(
                    "Failed to save property:",
                    error
                );


                const responseData =
                    error?.response?.data;


                if (
                    responseData &&
                    typeof responseData ===
                        "object"
                ) {

                    setErrors(
                        responseData
                    );

                } else {

                    setErrors({

                        general:
                            "Unable to save property. Please try again.",

                    });

                }

            } finally {

                setSaving(
                    false
                );

            }

        };


    /* =========================================================
       CLOSED
    ========================================================= */

    if (!show) {

        return null;

    }


    return (

        <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="propertyModalTitle"
            onMouseDown={(event) => {

                if (
                    event.target ===
                    event.currentTarget &&
                    !saving
                ) {

                    onClose();

                }

            }}
            style={{

                background:
                    "rgba(15, 23, 42, 0.42)",

                backdropFilter:
                    "blur(4px)",

                WebkitBackdropFilter:
                    "blur(4px)",

            }}
        >

            <div
                className="modal-dialog modal-dialog-centered modal-dialog-scrollable rems-management-modal"
                role="document"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >

                <div className="modal-content rems-modal">


                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div className="rems-modal-header">

                        <div>

                            <div className="rems-modal-icon">

                                <BsBuilding />

                            </div>


                            <h5
                                id="propertyModalTitle"
                                className="rems-modal-title mb-0"
                            >

                                {isEditing
                                    ? "Edit Property"
                                    : "Add Property"}

                            </h5>


                            <div className="rems-modal-subtitle">

                                {isEditing

                                    ? "Update the property information below."

                                    : "Register a new property in the subdivision."}

                            </div>

                        </div>


                        <button
                            type="button"
                            className="btn border-0 p-1 text-secondary"
                            onClick={
                                onClose
                            }
                            disabled={
                                saving
                            }
                            aria-label="Close"
                            style={{

                                fontSize:
                                    "1.2rem",

                                lineHeight:
                                    1,

                            }}
                        >

                            <BsX />

                        </button>

                    </div>


                    {/* =================================================
                        FORM
                    ================================================= */}

                    <form
                        onSubmit={
                            handleSubmit
                        }
                    >

                        <div className="rems-modal-body">


                            {/* =================================================
                                GENERAL ERROR
                            ================================================= */}

                            {errors.general && (

                                <div
                                    className="alert alert-danger rems-alert mb-3"
                                    role="alert"
                                >

                                    <div className="d-flex align-items-start gap-2">

                                        <i className="bi bi-exclamation-circle mt-1" />

                                        <div>

                                            {
                                                getErrorText(
                                                    errors.general
                                                )
                                            }

                                        </div>

                                    </div>

                                </div>

                            )}


                            {/* =================================================
                                LOCATION
                            ================================================= */}

                            <div className="rems-form-section">

                                <div className="rems-form-section-title">

                                    Property Location

                                </div>


                                <div className="row g-3">


                                    {/* SUBDIVISION */}

                                    <div className="col-12">

                                        <label
                                            htmlFor="propertySubdivision"
                                            className="rems-form-label"
                                        >

                                            Subdivision

                                            <span className="text-danger">
                                                {" "}*
                                            </span>

                                        </label>


                                        <input
                                            id="propertySubdivision"
                                            type="text"
                                            name="subdivision"
                                            className={`form-control rems-form-control ${
                                                errors.subdivision
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={
                                                form.subdivision
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                            disabled={
                                                saving
                                            }
                                            placeholder="Subdivision name"
                                        />


                                        {errors.subdivision && (

                                            <div className="invalid-feedback">

                                                {
                                                    getErrorText(
                                                        errors.subdivision
                                                    )
                                                }

                                            </div>

                                        )}

                                    </div>


                                    {/* BLOCK */}

                                    <div className="col-12 col-md-6">

                                        <label
                                            htmlFor="propertyBlock"
                                            className="rems-form-label"
                                        >

                                            Block

                                            <span className="text-danger">
                                                {" "}*
                                            </span>

                                        </label>


                                        <input
                                            id="propertyBlock"
                                            type="text"
                                            name="block"
                                            className={`form-control rems-form-control ${
                                                errors.block
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={
                                                form.block
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                            disabled={
                                                saving
                                            }
                                            placeholder="e.g. 1"
                                        />


                                        {errors.block && (

                                            <div className="invalid-feedback">

                                                {
                                                    getErrorText(
                                                        errors.block
                                                    )
                                                }

                                            </div>

                                        )}

                                    </div>


                                    {/* LOT */}

                                    <div className="col-12 col-md-6">

                                        <label
                                            htmlFor="propertyLot"
                                            className="rems-form-label"
                                        >

                                            Lot

                                            <span className="text-danger">
                                                {" "}*
                                            </span>

                                        </label>


                                        <input
                                            id="propertyLot"
                                            type="text"
                                            name="lot"
                                            className={`form-control rems-form-control ${
                                                errors.lot
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={
                                                form.lot
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                            disabled={
                                                saving
                                            }
                                            placeholder="e.g. 15"
                                        />


                                        {errors.lot && (

                                            <div className="invalid-feedback">

                                                {
                                                    getErrorText(
                                                        errors.lot
                                                    )
                                                }

                                            </div>

                                        )}

                                    </div>

                                </div>

                            </div>


                            {/* =================================================
                                ADDRESS
                            ================================================= */}

                            <div className="rems-form-section">

                                <div className="rems-form-section-title">

                                    Address Information

                                </div>


                                <div className="row g-3">


                                    {/* HOUSE NUMBER */}

                                    <div className="col-12 col-md-4">

                                        <label
                                            htmlFor="propertyHouseNumber"
                                            className="rems-form-label"
                                        >

                                            House Number

                                        </label>


                                        <input
                                            id="propertyHouseNumber"
                                            type="text"
                                            name="house_number"
                                            className={`form-control rems-form-control ${
                                                errors.house_number
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={
                                                form.house_number
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                saving
                                            }
                                            placeholder="e.g. 15-A"
                                        />


                                        {errors.house_number && (

                                            <div className="invalid-feedback">

                                                {
                                                    getErrorText(
                                                        errors.house_number
                                                    )
                                                }

                                            </div>

                                        )}

                                    </div>


                                    {/* STREET */}

                                    <div className="col-12 col-md-8">

                                        <label
                                            htmlFor="propertyStreet"
                                            className="rems-form-label"
                                        >

                                            Street

                                        </label>


                                        <input
                                            id="propertyStreet"
                                            type="text"
                                            name="street"
                                            className={`form-control rems-form-control ${
                                                errors.street
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={
                                                form.street
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                saving
                                            }
                                            placeholder="e.g. Acacia Street"
                                        />


                                        {errors.street && (

                                            <div className="invalid-feedback">

                                                {
                                                    getErrorText(
                                                        errors.street
                                                    )
                                                }

                                            </div>

                                        )}

                                    </div>


                                    {/* COMPLETE ADDRESS */}

                                    <div className="col-12">

                                        <label
                                            htmlFor="propertyAddress"
                                            className="rems-form-label"
                                        >

                                            Complete Address

                                            <span className="text-danger">
                                                {" "}*
                                            </span>

                                        </label>


                                        <textarea
                                            id="propertyAddress"
                                            name="address"
                                            className={`form-control rems-form-control ${
                                                errors.address
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            rows="2"
                                            value={
                                                form.address
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                            disabled={
                                                saving
                                            }
                                            placeholder="Enter the complete property address"
                                        />


                                        {errors.address && (

                                            <div className="invalid-feedback">

                                                {
                                                    getErrorText(
                                                        errors.address
                                                    )
                                                }

                                            </div>

                                        )}

                                    </div>

                                </div>

                            </div>


                            {/* =================================================
                                OWNERSHIP + OCCUPANCY
                            ================================================= */}

                            {isEditing && (

                                <div className="rems-form-section">

                                    <div className="rems-form-section-title">

                                        Property Ownership & Occupancy

                                    </div>


                                    <div className="row g-3">


                                        {/* =====================================
                                            OWNERSHIP STATUS
                                        ===================================== */}

                                        <div className="col-12 col-md-6">

                                            <label className="rems-form-label">

                                                Ownership

                                            </label>


                                            <div
                                                className="d-flex align-items-center gap-3"
                                                style={{
                                                    minHeight:
                                                        "44px",
                                                }}
                                            >

                                                <div
                                                    className="d-flex align-items-center justify-content-center rounded-3"
                                                    style={{

                                                        width:
                                                            "38px",

                                                        height:
                                                            "38px",

                                                        flex:
                                                            "0 0 38px",

                                                        background:
                                                            ownershipIsActive
                                                                ? "rgba(25, 135, 84, 0.08)"
                                                                : "rgba(100, 116, 139, 0.08)",

                                                        color:
                                                            ownershipIsActive
                                                                ? "#5f846d"
                                                                : "#697586",

                                                    }}
                                                >

                                                    <BsPersonCheck />

                                                </div>


                                                <div>

                                                    <div
                                                        className="fw-semibold"
                                                        style={{
                                                            color:
                                                                "#334155",

                                                            fontSize:
                                                                "0.78rem",
                                                        }}
                                                    >

                                                        {
                                                            ownershipStatus
                                                        }

                                                    </div>


                                                    <div
                                                        style={{

                                                            color:
                                                                "#8f98a6",

                                                            fontSize:
                                                                "0.64rem",

                                                        }}
                                                    >

                                                        {currentOwnerName

                                                            ? currentOwnerName

                                                            : "No active homeowner"}

                                                    </div>


                                                    {currentOwnerUsername && (

                                                        <div
                                                            style={{
                                                                color:
                                                                    "#a0a7b2",
                                                                fontSize:
                                                                    "0.57rem",
                                                            }}
                                                        >

                                                            @
                                                            {
                                                                currentOwnerUsername
                                                            }

                                                        </div>

                                                    )}

                                                </div>

                                            </div>

                                        </div>


                                        {/* =====================================
                                            OCCUPANCY STATUS
                                        ===================================== */}

                                        <div className="col-12 col-md-6">

                                            <label className="rems-form-label">

                                                Current Occupancy

                                            </label>


                                            <div
                                                className="d-flex align-items-center gap-3"
                                                style={{
                                                    minHeight:
                                                        "44px",
                                                }}
                                            >

                                                <div
                                                    className="d-flex align-items-center justify-content-center rounded-3"
                                                    style={{

                                                        width:
                                                            "38px",

                                                        height:
                                                            "38px",

                                                        flex:
                                                            "0 0 38px",

                                                        background:
                                                            "rgba(15, 23, 42, 0.06)",

                                                        color:
                                                            "#566274",

                                                    }}
                                                >

                                                    {propertyStatus ===
                                                    "TENANT_OCCUPIED" ? (

                                                        <BsPerson />

                                                    ) : (

                                                        <BsHouseCheck />

                                                    )}

                                                </div>


                                                <div>

                                                    <div
                                                        className="fw-semibold"
                                                        style={{
                                                            color:
                                                                "#334155",
                                                            fontSize:
                                                                "0.78rem",
                                                        }}
                                                    >

                                                        {
                                                            statusLabel
                                                        }

                                                    </div>


                                                    {currentOccupantName ? (

                                                        <>

                                                            <div
                                                                style={{
                                                                    color:
                                                                        "#8f98a6",
                                                                    fontSize:
                                                                        "0.64rem",
                                                                }}
                                                            >

                                                                {
                                                                    currentOccupantName
                                                                }

                                                            </div>


                                                            {currentOccupantUsername && (

                                                                <div
                                                                    style={{
                                                                        color:
                                                                            "#a0a7b2",
                                                                        fontSize:
                                                                            "0.57rem",
                                                                    }}
                                                                >

                                                                    @
                                                                    {
                                                                        currentOccupantUsername
                                                                    }

                                                                </div>

                                                            )}

                                                        </>

                                                    ) : (

                                                        <div
                                                            style={{
                                                                color:
                                                                    "#a0a7b2",
                                                                fontSize:
                                                                    "0.64rem",
                                                            }}
                                                        >

                                                            No current occupant

                                                        </div>

                                                    )}

                                                </div>

                                            </div>

                                        </div>


                                        {/* =====================================
                                            OCCUPANT TYPE
                                        ===================================== */}

                                        {currentOccupantType && (

                                            <div className="col-12">

                                                <div
                                                    className="d-flex align-items-center gap-2"
                                                    style={{
                                                        padding:
                                                            "9px 11px",

                                                        borderRadius:
                                                            "9px",

                                                        background:
                                                            "rgba(15, 23, 42, 0.035)",

                                                        color:
                                                            "#7b8695",

                                                        fontSize:
                                                            "0.64rem",
                                                    }}
                                                >

                                                    <BsInfoCircle />

                                                    <span>

                                                        Current occupant type:

                                                        <strong
                                                            className="ms-1"
                                                            style={{
                                                                color:
                                                                    "#596678",
                                                            }}
                                                        >

                                                            {currentOccupantType ===
                                                            "TENANT"
                                                                ? "Tenant"
                                                                : "Homeowner"}

                                                        </strong>

                                                    </span>

                                                </div>

                                            </div>

                                        )}

                                    </div>


                                    {/* =========================================
                                        INFORMATION NOTICE
                                    ========================================= */}

                                    <div
                                        className="mt-3 p-3 rounded-3"
                                        style={{

                                            border:
                                                "1px solid rgba(37, 99, 235, 0.10)",

                                            background:
                                                "rgba(37, 99, 235, 0.035)",

                                        }}
                                    >

                                        <div className="d-flex align-items-start gap-2">

                                            <BsInfoCircle
                                                className="mt-1 flex-shrink-0"
                                                style={{
                                                    color:
                                                        "#64748b",
                                                }}
                                            />


                                            <div
                                                style={{

                                                    color:
                                                        "#64748b",

                                                    fontSize:
                                                        "0.69rem",

                                                    lineHeight:
                                                        1.55,

                                                }}
                                            >

                                                <div>

                                                    <strong>
                                                        Ownership and occupancy
                                                        are separate.
                                                    </strong>

                                                </div>


                                                <div className="mt-1">

                                                    A property can be owned but
                                                    vacant. The occupancy status
                                                    changes only when an active
                                                    occupancy record is assigned
                                                    through Occupancy Management.

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            )}


                            {/* =================================================
                                NEW PROPERTY NOTICE
                            ================================================= */}

                            {!isEditing && (

                                <div className="rems-form-section">

                                    <div
                                        className="d-flex align-items-start gap-2"
                                    >

                                        <BsInfoCircle
                                            className="mt-1 flex-shrink-0"
                                            style={{
                                                color:
                                                    "#64748b",
                                            }}
                                        />


                                        <div
                                            style={{

                                                color:
                                                    "#64748b",

                                                fontSize:
                                                    "0.69rem",

                                                lineHeight:
                                                    1.55,

                                            }}
                                        >

                                            <strong>
                                                Property status is managed automatically.
                                            </strong>


                                            <div className="mt-1">

                                                A newly registered property starts
                                                as vacant. Ownership and occupancy
                                                are assigned separately.

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            )}


                            {/* =================================================
                                RECORD STATUS
                            ================================================= */}

                            <div className="rems-form-section">

                                <div className="rems-form-section-title">

                                    Record Status

                                </div>


                                <div
                                    className="d-flex align-items-center"
                                    style={{
                                        minHeight:
                                            "44px",
                                    }}
                                >

                                    <div className="form-check form-switch mb-0">

                                        <input
                                            id="propertyActive"
                                            type="checkbox"
                                            name="is_active"
                                            className="form-check-input"
                                            checked={
                                                form.is_active
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                saving
                                            }
                                        />


                                        <label
                                            htmlFor="propertyActive"
                                            className="form-check-label"
                                            style={{

                                                fontSize:
                                                    "0.78rem",

                                                fontWeight:
                                                    600,

                                                color:
                                                    "#334155",

                                            }}
                                        >

                                            {form.is_active
                                                ? "Active"
                                                : "Inactive"}

                                        </label>

                                    </div>

                                </div>

                            </div>


                            {/* =================================================
                                EDIT NOTICE
                            ================================================= */}

                            {isEditing && (

                                <div
                                    className="d-flex align-items-start gap-2"
                                    style={{

                                        padding:
                                            "11px 12px",

                                        borderRadius:
                                            "9px",

                                        background:
                                            "rgba(15, 23, 42, 0.035)",

                                        color:
                                            "#7b8695",

                                        fontSize:
                                            "0.66rem",

                                        lineHeight:
                                            1.55,

                                    }}
                                >

                                    <BsCheckCircle
                                        className="mt-1 flex-shrink-0"
                                        style={{
                                            color:
                                                "#708b79",
                                        }}
                                    />


                                    <span>

                                        Updating this form changes the
                                        property record only. Ownership
                                        and occupancy relationships are
                                        managed separately.

                                    </span>

                                </div>

                            )}

                        </div>


                        {/* =================================================
                            FOOTER
                        ================================================= */}

                        <div className="rems-modal-footer d-flex justify-content-end gap-2">

                            <button
                                type="button"
                                className="rems-btn"
                                onClick={
                                    onClose
                                }
                                disabled={
                                    saving
                                }
                                style={{

                                    color:
                                        "#5f6b7c",

                                    background:
                                        "rgba(15, 23, 42, 0.05)",

                                }}
                            >

                                Cancel

                            </button>


                            <button
                                type="submit"
                                className="rems-btn rems-btn-primary"
                                disabled={
                                    saving
                                }
                            >

                                {saving ? (

                                    <>

                                        <span
                                            className="spinner-border spinner-border-sm"
                                            role="status"
                                            aria-hidden="true"
                                        />

                                        Saving...

                                    </>

                                ) : (

                                    <>

                                        <i
                                            className={
                                                isEditing
                                                    ? "bi bi-check-lg"
                                                    : "bi bi-plus-lg"
                                            }
                                        />

                                        {isEditing
                                            ? "Save Changes"
                                            : "Create Property"}

                                    </>

                                )}

                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </div>

    );
}