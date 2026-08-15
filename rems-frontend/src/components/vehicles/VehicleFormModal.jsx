import {
    useEffect,
    useState,
} from "react";

import {
    createVehicle,
    updateVehicle,
} from "../../api/vehicles";

import {
    getProperties,
} from "../../api/properties";

import {
    getResidents,
} from "../../api/residents";


const initialForm = {
    property: "",
    registered_resident: "",
    vehicle_type: "SEDAN",
    make: "",
    model: "",
    color: "",
    plate_number: "",
    ownership_type: "OWNED",
    is_active: true,
};


export default function VehicleFormModal({
    show,
    vehicle,
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
        error,
        setError,
    ] = useState({});


    const isEditing =
        Boolean(vehicle?.id);


    useEffect(() => {

        if (!show) {
            return;
        }


        setError({});


        if (vehicle) {

            setForm({

                property:
                    vehicle.property ||
                    "",

                registered_resident:
                    vehicle.registered_resident ||
                    "",

                vehicle_type:
                    vehicle.vehicle_type ||
                    "SEDAN",

                make:
                    vehicle.make ||
                    "",

                model:
                    vehicle.model ||
                    "",

                color:
                    vehicle.color ||
                    "",

                plate_number:
                    vehicle.plate_number ||
                    "",

                ownership_type:
                    vehicle.ownership_type ||
                    "OWNED",

                is_active:
                    vehicle.is_active !== false,

            });

        } else {

            setForm(
                initialForm
            );
        }


        loadOptions();

    }, [
        show,
        vehicle,
    ]);


    const loadOptions = async () => {

        setLoadingOptions(true);

        try {

            const [
                propertiesResponse,
                residentsResponse,
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
                    propertiesResponse
                )
                    ? propertiesResponse
                    : propertiesResponse?.results ||
                      []
            );


            const residentData =
                Array.isArray(
                    residentsResponse
                )
                    ? residentsResponse
                    : residentsResponse?.results ||
                      [];


            setResidents(
                residentData.filter(
                    (resident) =>
                        resident.is_active
                )
            );

        } catch (err) {

            console.error(
                "Unable to load vehicle options:",
                err
            );

            setError({
                general:
                    "Unable to load properties and residents.",
            });

        } finally {

            setLoadingOptions(false);
        }
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


        setError(
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
            error?.[field];

        if (
            Array.isArray(
                value
            )
        ) {
            return value[0];
        }

        return value || "";
    };


    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();

        setSaving(true);
        setError({});


        try {

            const payload = {

                property:
                    Number(
                        form.property
                    ),

                registered_resident:
                    Number(
                        form.registered_resident
                    ),

                vehicle_type:
                    form.vehicle_type,

                make:
                    form.make.trim(),

                model:
                    form.model.trim(),

                color:
                    form.color.trim(),

                plate_number:
                    form.plate_number
                        .trim()
                        .toUpperCase(),

                ownership_type:
                    form.ownership_type,

                is_active:
                    form.is_active,

            };


            const saved =
                isEditing
                    ? await updateVehicle(
                        vehicle.id,
                        payload
                    )
                    : await createVehicle(
                        payload
                    );


            if (onSuccess) {

                await onSuccess(
                    saved
                );
            }

        } catch (err) {

            console.error(
                "Vehicle save failed:",
                err
            );


            const data =
                err?.response?.data;


            if (
                data &&
                typeof data ===
                    "object"
            ) {

                setError(
                    data
                );

            } else {

                setError({
                    general:
                        "Unable to save vehicle.",
                });
            }

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
                    event.currentTarget
                ) {

                    if (!saving) {
                        onClose();
                    }

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
                            VEHICLE MANAGEMENT
                        </div>

                        <h5 className="mb-1 fw-semibold">

                            {isEditing
                                ? "Edit Vehicle"
                                : "Add Vehicle"}

                        </h5>

                        <div className="rems-modal-subtitle">

                            {isEditing
                                ? "Update the vehicle registration."
                                : "Register a vehicle for an authorized resident."}

                        </div>

                    </div>


                    <button
                        type="button"
                        className="rems-modal-close"
                        onClick={onClose}
                        disabled={saving}
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


                        {error.general && (

                            <div className="alert alert-danger rems-alert">

                                <i className="bi bi-exclamation-circle me-2" />

                                {
                                    error.general
                                }

                            </div>

                        )}


                        <div className="rems-form-section">

                            <div className="rems-form-section-title">

                                <i className="bi bi-house me-2" />

                                Property & Resident

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

                                        Registered Resident

                                        <span className="text-danger">
                                            {" "}*
                                        </span>

                                    </label>


                                    <select
                                        name="registered_resident"
                                        className={`form-select rems-form-control ${
                                            getError(
                                                "registered_resident"
                                            )
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        value={
                                            form.registered_resident
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

                                                    {" — "}

                                                    {
                                                        resident.resident_type_display ||
                                                        resident.resident_type
                                                    }

                                                </option>

                                            )
                                        )}

                                    </select>


                                    <div className="form-text">

                                        The backend will verify
                                        that this resident is
                                        authorized for the
                                        selected property.

                                    </div>


                                    {getError(
                                        "registered_resident"
                                    ) && (

                                        <div className="invalid-feedback">

                                            {
                                                getError(
                                                    "registered_resident"
                                                )
                                            }

                                        </div>

                                    )}

                                </div>

                            </div>

                        </div>


                        <div className="rems-form-section">

                            <div className="rems-form-section-title">

                                <i className="bi bi-car-front me-2" />

                                Vehicle Information

                            </div>


                            <div className="row g-3">


                                <div className="col-12 col-md-6">

                                    <label className="rems-form-label">

                                        Vehicle Type

                                    </label>


                                    <select
                                        name="vehicle_type"
                                        className="form-select rems-form-control"
                                        value={
                                            form.vehicle_type
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                        required
                                    >

                                        <option value="MOTORCYCLE">
                                            Motorcycle
                                        </option>

                                        <option value="SEDAN">
                                            Sedan
                                        </option>

                                        <option value="SUV">
                                            SUV
                                        </option>

                                        <option value="PICKUP">
                                            Pickup
                                        </option>

                                        <option value="VAN">
                                            Van
                                        </option>

                                        <option value="TRUCK">
                                            Truck
                                        </option>

                                        <option value="OTHER">
                                            Other
                                        </option>

                                    </select>

                                </div>


                                <div className="col-12 col-md-6">

                                    <label className="rems-form-label">

                                        Plate Number

                                        <span className="text-danger">
                                            {" "}*
                                        </span>

                                    </label>


                                    <input
                                        type="text"
                                        name="plate_number"
                                        className={`form-control rems-form-control ${
                                            getError(
                                                "plate_number"
                                            )
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        value={
                                            form.plate_number
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. ABC 1234"
                                        required
                                        disabled={
                                            saving
                                        }
                                    />


                                    {getError(
                                        "plate_number"
                                    ) && (

                                        <div className="invalid-feedback">

                                            {
                                                getError(
                                                    "plate_number"
                                                )
                                            }

                                        </div>

                                    )}

                                </div>


                                <div className="col-12 col-md-6">

                                    <label className="rems-form-label">

                                        Make

                                        <span className="text-danger">
                                            {" "}*
                                        </span>

                                    </label>


                                    <input
                                        type="text"
                                        name="make"
                                        className="form-control rems-form-control"
                                        value={
                                            form.make
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. Toyota"
                                        required
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>


                                <div className="col-12 col-md-6">

                                    <label className="rems-form-label">

                                        Model

                                        <span className="text-danger">
                                            {" "}*
                                        </span>

                                    </label>


                                    <input
                                        type="text"
                                        name="model"
                                        className="form-control rems-form-control"
                                        value={
                                            form.model
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. Vios"
                                        required
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>


                                <div className="col-12 col-md-6">

                                    <label className="rems-form-label">

                                        Color

                                        <span className="text-danger">
                                            {" "}*
                                        </span>

                                    </label>


                                    <input
                                        type="text"
                                        name="color"
                                        className="form-control rems-form-control"
                                        value={
                                            form.color
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. White"
                                        required
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>


                                <div className="col-12 col-md-6">

                                    <label className="rems-form-label">

                                        Ownership Type

                                    </label>


                                    <select
                                        name="ownership_type"
                                        className="form-select rems-form-control"
                                        value={
                                            form.ownership_type
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                    >

                                        <option value="OWNED">
                                            Owned
                                        </option>

                                        <option value="COMPANY">
                                            Company
                                        </option>

                                        <option value="LEASED">
                                            Leased
                                        </option>

                                        <option value="OTHER">
                                            Other
                                        </option>

                                    </select>

                                </div>


                                <div className="col-12">

                                    <div className="form-check form-switch">

                                        <input
                                            id="vehicle-active"
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
                                            htmlFor="vehicle-active"
                                            className="form-check-label"
                                        >

                                            Vehicle is active

                                        </label>

                                    </div>

                                </div>

                            </div>

                        </div>


                        <div className="alert alert-info rems-alert mb-0">

                            <strong>
                                Property authorization is enforced by the backend.
                            </strong>

                            <div className="small mt-1">

                                A vehicle cannot be registered to a
                                resident who is not currently
                                authorized for the selected property.

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
                                !form.registered_resident
                            }
                        >

                            {saving ? (

                                <>
                                    <span
                                        className="spinner-border spinner-border-sm"
                                        aria-hidden="true"
                                    />

                                    Saving...

                                </>

                            ) : (

                                <>
                                    <i className="bi bi-check2" />

                                    {isEditing
                                        ? "Save Changes"
                                        : "Register Vehicle"}

                                </>

                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}