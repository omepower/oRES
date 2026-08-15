
import {
    useEffect,
    useState,
} from "react";

import {
    createVehicle,
    updateVehicle,
} from "../../api/vehicles";

import {
    getMyProperties,
} from "../../api/properties";


const initialForm = {
    property: "",
    vehicle_type: "SEDAN",
    make: "",
    model: "",
    color: "",
    plate_number: "",
    ownership_type: "OWNED",
    is_active: true,
};


export default function ResidentVehicleFormModal({
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
        Boolean(
            vehicle?.id
        );


    /* =========================================================
       FORM INITIALIZATION
    ========================================================= */

    useEffect(() => {

        if (!show) {
            return;
        }

        setError({});

        setForm({

            property:
                vehicle?.property
                    ? String(
                        vehicle.property
                    )
                    : "",

            vehicle_type:
                vehicle?.vehicle_type ||
                "SEDAN",

            make:
                vehicle?.make ||
                "",

            model:
                vehicle?.model ||
                "",

            color:
                vehicle?.color ||
                "",

            plate_number:
                vehicle?.plate_number ||
                "",

            ownership_type:
                vehicle?.ownership_type ||
                "OWNED",

            is_active:
                vehicle?.is_active !== false,

        });

        loadOptions();

    }, [
        show,
        vehicle,
    ]);


    /* =========================================================
       LOAD AUTHORIZED PROPERTIES
    ========================================================= */

    const loadOptions =
        async () => {

            setLoadingOptions(
                true
            );

            setError({});

            try {

                const response =
                    await getMyProperties();

               


                const propertyData =
                    Array.isArray(
                        response
                    )
                        ? response
                        : response?.results ||
                          response?.properties ||
                          [];




                setProperties(
                    propertyData
                );

            } catch (err) {

                console.error(
                    "[Resident Vehicle] Property loading failed:",
                    err
                );

                setProperties([]);

                setError({

                    general:
                        err?.response?.data?.detail ||
                        "Unable to load your authorized properties.",

                });

            } finally {

                setLoadingOptions(
                    false
                );

            }
        };


    /* =========================================================
       FIELD ERROR
    ========================================================= */

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


    /* =========================================================
       CHANGE
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


        setError(
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

            setError({});


            try {

                const payload = {

                    property:
                        Number(
                            form.property
                        ),

                    /*
                     * registered_resident is deliberately
                     * NOT sent by the resident frontend.
                     *
                     * The backend derives it from request.user.
                     */

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


                console.log(
                    "[Resident Vehicle] submitting:",
                    payload
                );


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
                    "[Resident Vehicle] Save failed:",
                    err
                );


                const data =
                    err?.response?.data;


                setError(
                    data &&
                    typeof data ===
                        "object"

                        ? data

                        : {
                            general:
                                "Unable to save vehicle.",
                        }
                );

            } finally {

                setSaving(
                    false
                );

            }
        };


    if (
        !show
    ) {

        return null;

    }


    return (

        <div
            className="rems-modal-backdrop"
            onMouseDown={(
                event
            ) => {

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


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="rems-modal-header">

                    <div>

                        <div className="rems-page-eyebrow">
                            MY VEHICLES
                        </div>

                        <div className="rems-modal-title">

                            {
                                isEditing
                                    ? "Edit Vehicle"
                                    : "Register Vehicle"
                            }

                        </div>

                        <div className="rems-modal-subtitle">

                            {
                                isEditing
                                    ? "Update your vehicle registration."
                                    : "Register a vehicle associated with your authorized residence."
                            }

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


                {/* =================================================
                    FORM
                ================================================= */}

                <form
                    onSubmit={
                        handleSubmit
                    }
                >

                    <div className="rems-modal-body">


                        {error.general && (

                            <div className="alert alert-danger rems-alert mb-3">

                                <i className="bi bi-exclamation-circle me-2" />

                                {
                                    Array.isArray(
                                        error.general
                                    )
                                        ? error.general[0]
                                        : error.general
                                }

                            </div>

                        )}


                        {/* =================================================
                            PROPERTY
                        ================================================= */}

                        <div className="rems-form-section">

                            <div className="rems-form-section-title">

                                <i className="bi bi-house me-2" />

                                Property

                            </div>


                            <label className="rems-form-label">

                                Authorized Property{" "}

                                <span className="text-danger">
                                    *
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

                                    {
                                        loadingOptions
                                            ? "Loading authorized properties..."
                                            : properties.length === 0
                                                ? "No authorized properties found"
                                                : "Select property"
                                    }

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
                                                property.address ||
                                                property.property_name ||
                                                `Property #${property.id}`
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


                            <div className="form-text">

                                Only properties currently authorized
                                to your resident account are shown.

                            </div>

                        </div>


                        {/* =================================================
                            VEHICLE INFORMATION
                        ================================================= */}

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

                                        Plate Number{" "}

                                        <span className="text-danger">
                                            *
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

                                        Make{" "}

                                        <span className="text-danger">
                                            *
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

                                        Model{" "}

                                        <span className="text-danger">
                                            *
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

                                        Color{" "}

                                        <span className="text-danger">
                                            *
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


                                {isEditing && (

                                    <div className="col-12">

                                        <div className="form-check form-switch">

                                            <input
                                                id="resident-vehicle-active"
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
                                                htmlFor="resident-vehicle-active"
                                                className="form-check-label"
                                            >
                                                Vehicle is active
                                            </label>

                                        </div>

                                    </div>

                                )}

                            </div>

                        </div>


                        <div className="alert alert-info rems-alert mb-0">

                            <i className="bi bi-shield-check me-2" />

                            Your resident identity is determined
                            automatically from your authenticated
                            account.

                        </div>

                    </div>


                    {/* =================================================
                        FOOTER
                    ================================================= */}

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
                                !form.property
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

                                    {
                                        isEditing
                                            ? "Save Changes"
                                            : "Register Vehicle"
                                    }
                                </>

                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}
