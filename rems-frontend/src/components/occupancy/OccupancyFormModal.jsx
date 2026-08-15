import {
    useEffect,
    useState,
} from "react";

import {
    createPropertyOccupancy,
    updatePropertyOccupancy,
    getProperties,
} from "../../api/properties";

import {
    getResidents,
} from "../../api/residents";


const initialForm = {
    property: "",
    resident: "",
    occupancy_type: "",
    start_date: "",
    end_date: "",
    is_active: true,
};


export default function OccupancyFormModal({
    show,
    record,
    onClose,
    onSuccess,
}) {

    const [
        form,
        setForm,
    ] = useState(
        initialForm
    );

    const [
        properties,
        setProperties,
    ] = useState([]);

    const [
        residents,
        setResidents,
    ] = useState([]);

    const [
        loadingOptions,
        setLoadingOptions,
    ] = useState(false);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        errors,
        setErrors,
    ] = useState({});


    const isEditing =
        Boolean(record?.id);


    useEffect(() => {

        if (!show) {
            return;
        }


        setErrors({});


        if (record) {

            setForm({

                property:
                    record.property ||
                    "",

                resident:
                    record.resident ||
                    "",

                occupancy_type:
                    record.occupancy_type ||
                    "",

                start_date:
                    record.start_date ||
                    "",

                end_date:
                    record.end_date ||
                    "",

                is_active:
                    record.is_active !== false,

            });

        } else {

            setForm({

                ...initialForm,

                start_date:
                    new Date()
                        .toISOString()
                        .split("T")[0],

            });
        }


        loadOptions();

    }, [
        show,
        record,
    ]);


    const loadOptions = async () => {

        setLoadingOptions(true);

        try {

            const [
                propertyResponse,
                residentResponse,
            ] = await Promise.all([

                getProperties({
                    is_active: true,
                }),

                getResidents({
                    is_active: true,
                }),

            ]);


            setProperties(
                Array.isArray(
                    propertyResponse
                )
                    ? propertyResponse
                    : propertyResponse?.results ||
                      []
            );


            const residentData =
                Array.isArray(
                    residentResponse
                )
                    ? residentResponse
                    : residentResponse?.results ||
                      [];


            setResidents(
                residentData.filter(
                    (resident) =>
                        resident.is_active
                )
            );

        } catch (error) {

            console.error(
                "Unable to load occupancy options:",
                error
            );

            setErrors({
                general:
                    "Unable to load properties or residents.",
            });

        } finally {

            setLoadingOptions(false);
        }
    };


    const handleResidentChange = (
        event
    ) => {

        const residentId =
            event.target.value;


        const selectedResident =
            residents.find(
                (resident) =>
                    String(
                        resident.id
                    ) ===
                    String(
                        residentId
                    )
            );


        setForm(
            (previous) => ({
                ...previous,

                resident:
                    residentId,

                occupancy_type:
                    selectedResident?.resident_type ||
                    "",
            })
        );


        setErrors(
            (previous) => ({
                ...previous,
                resident:
                    undefined,
                occupancy_type:
                    undefined,
                general:
                    undefined,
            })
        );
    };


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
            (previous) => ({
                ...previous,
                [name]:
                    type === "checkbox"
                        ? checked
                        : value,
            })
        );


        setErrors(
            (previous) => ({
                ...previous,
                [name]:
                    undefined,
                general:
                    undefined,
            })
        );
    };


    const getError = (
        field
    ) => {

        const value =
            errors?.[field];


        if (
            Array.isArray(
                value
            )
        ) {

            return value.join(
                " "
            );

        }


        return value || "";
    };


    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();

        setSaving(true);
        setErrors({});


        try {

            const payload = {

                property:
                    Number(
                        form.property
                    ),

                resident:
                    Number(
                        form.resident
                    ),

                occupancy_type:
                    form.occupancy_type,

                start_date:
                    form.start_date,

                end_date:
                    form.is_active
                        ? null
                        : (
                            form.end_date ||
                            null
                        ),

                is_active:
                    form.is_active,

            };


            const response =
                isEditing
                    ? await updatePropertyOccupancy(
                        record.id,
                        payload
                    )
                    : await createPropertyOccupancy(
                        payload
                    );


            if (onSuccess) {

                await onSuccess(
                    response
                );
            }

        } catch (error) {

            console.error(
                "Occupancy save failed:",
                error
            );


            const data =
                error?.response?.data;


            setErrors(
                data &&
                typeof data ===
                    "object"
                    ? data
                    : {
                        general:
                            "Unable to save occupancy record.",
                    }
            );

        } finally {

            setSaving(false);
        }
    };


    if (!show) {
        return null;
    }


    return (
        <div
            className="rems-modal-backdrop"
            onMouseDown={(event) => {

                if (
                    event.target ===
                    event.currentTarget &&
                    !saving
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
                            OCCUPANCY MANAGEMENT
                        </div>

                        <h5 className="mb-1 fw-semibold">

                            {isEditing
                                ? "Edit Occupancy"
                                : "Assign Occupant"}

                        </h5>

                        <div className="rems-modal-subtitle">
                            Manage the property's occupancy history.
                        </div>

                    </div>


                    <button
                        type="button"
                        className="rems-modal-close"
                        onClick={
                            onClose
                        }
                        disabled={
                            saving
                        }
                    >

                        <i className="bi bi-x-lg" />

                    </button>

                </div>


                <form
                    onSubmit={
                        handleSubmit
                    }
                >

                    <div className="rems-modal-body">


                        {errors.general && (

                            <div className="alert alert-danger rems-alert">

                                <i className="bi bi-exclamation-circle me-2" />

                                {
                                    errors.general
                                }

                            </div>

                        )}


                        <div className="rems-form-section">

                            <div className="rems-form-section-title">

                                <i className="bi bi-house-check me-2" />

                                Occupancy Record

                            </div>


                            <div className="row g-3">


                                <div className="col-12">

                                    <label className="rems-form-label">

                                        Property

                                        <span className="text-danger">
                                            {" "}*
                                        </span>

                                    </label>


                                    <select
                                        name="property"
                                        className={`form-select rems-form-control ${
                                            getError(
                                                "property"
                                            )
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        value={
                                            form.property
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            loadingOptions ||
                                            saving
                                        }
                                        required
                                    >

                                        <option value="">

                                            {loadingOptions
                                                ? "Loading properties..."
                                                : "Select property"}

                                        </option>


                                        {properties.map(
                                            (
                                                property
                                            ) => (

                                                <option
                                                    key={
                                                        property.id
                                                    }
                                                    value={
                                                        property.id
                                                    }
                                                >

                                                    {
                                                        property.address
                                                    }

                                                </option>

                                            )
                                        )}

                                    </select>


                                    {getError(
                                        "property"
                                    ) && (

                                        <div className="invalid-feedback">

                                            {
                                                getError(
                                                    "property"
                                                )
                                            }

                                        </div>

                                    )}

                                </div>


                                <div className="col-12">

                                    <label className="rems-form-label">

                                        Resident

                                        <span className="text-danger">
                                            {" "}*
                                        </span>

                                    </label>


                                    <select
                                        name="resident"
                                        className={`form-select rems-form-control ${
                                            getError(
                                                "resident"
                                            )
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        value={
                                            form.resident
                                        }
                                        onChange={
                                            handleResidentChange
                                        }
                                        disabled={
                                            loadingOptions ||
                                            saving
                                        }
                                        required
                                    >

                                        <option value="">

                                            {loadingOptions
                                                ? "Loading residents..."
                                                : "Select resident"}

                                        </option>


                                        {residents.map(
                                            (
                                                resident
                                            ) => (

                                                <option
                                                    key={
                                                        resident.id
                                                    }
                                                    value={
                                                        resident.id
                                                    }
                                                >

                                                    {
                                                        resident.full_name ||
                                                        `${resident.first_name || ""} ${resident.last_name || ""}`.trim()
                                                    }

                                                    {resident.resident_type_display
                                                        ? ` — ${resident.resident_type_display}`
                                                        : ""}

                                                </option>

                                            )
                                        )}

                                    </select>


                                    {getError(
                                        "resident"
                                    ) && (

                                        <div className="invalid-feedback">

                                            {
                                                getError(
                                                    "resident"
                                                )
                                            }

                                        </div>

                                    )}

                                </div>


                                <div className="col-12 col-md-6">

                                    <label className="rems-form-label">

                                        Occupancy Type

                                    </label>


                                    <select
                                        name="occupancy_type"
                                        className="form-select rems-form-control"
                                        value={
                                            form.occupancy_type
                                        }
                                        disabled
                                    >

                                        <option value="">
                                            Select resident first
                                        </option>

                                        <option value="HOMEOWNER">
                                            Homeowner
                                        </option>

                                        <option value="TENANT">
                                            Tenant
                                        </option>

                                    </select>


                                    <div className="form-text">

                                        Automatically derived from
                                        the resident's account role.

                                    </div>


                                    {getError(
                                        "occupancy_type"
                                    ) && (

                                        <div className="invalid-feedback">

                                            {
                                                getError(
                                                    "occupancy_type"
                                                )
                                            }

                                        </div>

                                    )}

                                </div>


                                <div className="col-12 col-md-6">

                                    <label className="rems-form-label">

                                        Start Date

                                        <span className="text-danger">
                                            {" "}*
                                        </span>

                                    </label>


                                    <input
                                        type="date"
                                        name="start_date"
                                        className="form-control rems-form-control"
                                        value={
                                            form.start_date
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                        required
                                    />

                                </div>


                                <div className="col-12 col-md-6">

                                    <label className="rems-form-label">
                                        End Date
                                    </label>


                                    <input
                                        type="date"
                                        name="end_date"
                                        className="form-control rems-form-control"
                                        value={
                                            form.end_date
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving ||
                                            form.is_active
                                        }
                                    />


                                    {form.is_active && (

                                        <div className="form-text">
                                            Active occupancy has no
                                            end date.
                                        </div>

                                    )}

                                </div>


                                <div className="col-12 col-md-6 d-flex align-items-end">

                                    <div className="form-check form-switch mb-2">

                                        <input
                                            id="occupancy-active-admin"
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
                                            htmlFor="occupancy-active-admin"
                                            className="form-check-label"
                                        >

                                            Active occupancy

                                        </label>

                                    </div>

                                </div>

                            </div>

                        </div>


                        <div className="alert alert-info rems-alert mb-0">

                            <strong>
                                Occupancy history is preserved.
                            </strong>

                            <div className="small mt-1">

                                Only one active occupancy record
                                can exist for a property. Django
                                validates conflicting assignments.

                            </div>

                        </div>

                    </div>


                    <div className="rems-modal-footer">

                        <button
                            type="button"
                            className="rems-secondary-button"
                            onClick={
                                onClose
                            }
                            disabled={
                                saving
                            }
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            className="rems-primary-button"
                            disabled={
                                saving ||
                                loadingOptions ||
                                !form.property ||
                                !form.resident
                            }
                        >

                            {saving ? (

                                <>
                                    <span className="spinner-border spinner-border-sm" />
                                    Saving...
                                </>

                            ) : (

                                <>
                                    <i className="bi bi-check2" />

                                    {isEditing
                                        ? "Save Changes"
                                        : "Assign Occupant"}

                                </>

                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}