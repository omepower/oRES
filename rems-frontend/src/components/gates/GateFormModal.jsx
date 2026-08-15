import {
    useEffect,
    useState,
} from "react";

import {
    createGate,
    updateGate,
} from "../../api/security";


const initialForm = {
    name: "",
    gate_type: "MAIN_ENTRANCE",
    location: "",
    is_primary: false,
    is_active: true,
};


export default function GateFormModal({
    show,
    gate,
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
        saving,
        setSaving,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState({});


    const isEditing =
        Boolean(gate?.id);


    useEffect(() => {

        if (!show) {
            return;
        }


        setError({});


        if (gate) {

            setForm({

                name:
                    gate.name ||
                    "",

                gate_type:
                    gate.gate_type ||
                    "MAIN_ENTRANCE",

                location:
                    gate.location ||
                    "",

                is_primary:
                    gate.is_primary === true,

                is_active:
                    gate.is_active !== false,

            });

        } else {

            setForm(
                initialForm
            );
        }

    }, [
        show,
        gate,
    ]);


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


    const getFieldError = (
        field
    ) => {

        const value =
            error?.[field];


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
        setError({});


        try {

            const payload = {

                name:
                    form.name.trim(),

                gate_type:
                    form.gate_type,

                location:
                    form.location.trim(),

                is_primary:
                    form.is_primary,

                is_active:
                    form.is_active,

            };


            const saved =
                isEditing
                    ? await updateGate(
                        gate.id,
                        payload
                    )
                    : await createGate(
                        payload
                    );


            if (onSuccess) {

                await onSuccess(
                    saved
                );

            }

        } catch (err) {

            console.error(
                "Gate save failed:",
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
                        "Unable to save gate.",

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
                            SECURITY MANAGEMENT
                        </div>

                        <h5 className="mb-1 fw-semibold">

                            {isEditing
                                ? "Edit Gate"
                                : "Add Gate"}

                        </h5>

                        <div className="rems-modal-subtitle">

                            {isEditing
                                ? "Update the gate configuration."
                                : "Register a new subdivision gate."}

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

                            <div className="alert alert-danger rems-alert">

                                <i className="bi bi-exclamation-circle me-2" />

                                {
                                    error.general
                                }

                            </div>

                        )}


                        <div className="rems-form-section">

                            <div className="rems-form-section-title">

                                <i className="bi bi-door-open me-2" />

                                Gate Information

                            </div>


                            <div className="row g-3">


                                {/* NAME */}

                                <div className="col-12">

                                    <label className="rems-form-label">

                                        Gate Name

                                        <span className="text-danger">
                                            {" "}*
                                        </span>

                                    </label>


                                    <input
                                        type="text"
                                        name="name"
                                        className={`form-control rems-form-control ${
                                            getFieldError(
                                                "name"
                                            )
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        value={
                                            form.name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. Main Entrance"
                                        required
                                        disabled={
                                            saving
                                        }
                                    />


                                    {getFieldError(
                                        "name"
                                    ) && (

                                        <div className="invalid-feedback">

                                            {
                                                getFieldError(
                                                    "name"
                                                )
                                            }

                                        </div>

                                    )}

                                </div>


                                {/* GATE TYPE */}

                                <div className="col-12">

                                    <label className="rems-form-label">

                                        Gate Type

                                        <span className="text-danger">
                                            {" "}*
                                        </span>

                                    </label>


                                    <select
                                        name="gate_type"
                                        className={`form-select rems-form-control ${
                                            getFieldError(
                                                "gate_type"
                                            )
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        value={
                                            form.gate_type
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                        required
                                    >

                                        <option value="MAIN_ENTRANCE">
                                            Main Entrance
                                        </option>

                                        <option value="SECONDARY">
                                            Secondary Gate
                                        </option>

                                        <option value="SERVICE">
                                            Service Gate
                                        </option>

                                        <option value="EMERGENCY">
                                            Emergency Gate
                                        </option>

                                    </select>


                                    {getFieldError(
                                        "gate_type"
                                    ) && (

                                        <div className="invalid-feedback">

                                            {
                                                getFieldError(
                                                    "gate_type"
                                                )
                                            }

                                        </div>

                                    )}

                                </div>


                                {/* LOCATION */}

                                <div className="col-12">

                                    <label className="rems-form-label">

                                        Location

                                    </label>


                                    <input
                                        type="text"
                                        name="location"
                                        className={`form-control rems-form-control ${
                                            getFieldError(
                                                "location"
                                            )
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        value={
                                            form.location
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. North entrance road"
                                        disabled={
                                            saving
                                        }
                                    />


                                    {getFieldError(
                                        "location"
                                    ) && (

                                        <div className="invalid-feedback">

                                            {
                                                getFieldError(
                                                    "location"
                                                )
                                            }

                                        </div>

                                    )}

                                </div>


                                {/* PRIMARY */}

                                <div className="col-12 col-md-6">

                                    <div className="form-check form-switch">

                                        <input
                                            id="gate-primary"
                                            type="checkbox"
                                            name="is_primary"
                                            className="form-check-input"
                                            checked={
                                                form.is_primary
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                saving
                                            }
                                        />

                                        <label
                                            htmlFor="gate-primary"
                                            className="form-check-label"
                                        >

                                            Primary gate

                                        </label>

                                    </div>

                                    <div className="form-text">

                                        Only one gate can be
                                        designated as primary.

                                    </div>

                                </div>


                                {/* ACTIVE */}

                                <div className="col-12 col-md-6">

                                    <div className="form-check form-switch">

                                        <input
                                            id="gate-active"
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
                                            htmlFor="gate-active"
                                            className="form-check-label"
                                        >

                                            Gate is active

                                        </label>

                                    </div>

                                </div>

                            </div>

                        </div>


                        <div className="alert alert-info rems-alert mb-0">

                            <strong>
                                Primary-gate validation is enforced by Django.
                            </strong>

                            <div className="small mt-1">

                                If another gate is already marked
                                as primary, the backend will reject
                                the conflicting record.

                            </div>

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
                                !form.name.trim()
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
                                        : "Add Gate"}

                                </>

                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}