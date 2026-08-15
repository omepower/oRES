
import {
    useEffect,
    useState,
} from "react";

import {
    createVisitorInvitation,
} from "../../api/visitors";

import {
    getMyProperties,
} from "../../api/properties";


const initialForm = {
    visitor_name: "",
    visitor_home_address: "",
    visitor_phone: "",
    property: "",
    visit_date: "",
    expected_time_in: "",
    expected_time_out: "",
};


export default function ResidentVisitorInvitationModal({
    show,
    onClose,
    onCreated,
}) {

    const [form, setForm] =
        useState(initialForm);

    const [properties, setProperties] =
        useState([]);

    const [saving, setSaving] =
        useState(false);

    const [loadingProperties, setLoadingProperties] =
        useState(false);

    const [errors, setErrors] =
        useState({});


    useEffect(() => {

        if (!show) {
            return;
        }

        setForm(initialForm);
        setErrors({});

        loadProperties();

    }, [show]);


    const loadProperties = async () => {

        setLoadingProperties(true);

        try {

            const response =
                await getMyProperties();

            const data =
                Array.isArray(response)
                    ? response
                    : response?.results ||
                      response?.properties ||
                      [];

            setProperties(data);

        } catch (error) {

            console.error(
                "Failed to load resident properties:",
                error
            );

            setErrors({
                general:
                    "Unable to load your authorized properties.",
            });

        } finally {

            setLoadingProperties(false);

        }
    };


    const getError = (field) => {

        const value =
            errors?.[field];

        if (Array.isArray(value)) {
            return value[0];
        }

        return value || "";

    };


    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: undefined,
            general: undefined,
        }));

    };


    const handleSubmit = async (event) => {

        event.preventDefault();

        setSaving(true);
        setErrors({});

        try {

            const payload = {
                visitor_name:
                    form.visitor_name.trim(),

                visitor_home_address:
                    form.visitor_home_address.trim(),

                visitor_phone:
                    form.visitor_phone.trim(),

                property:
                    Number(form.property),

                visit_date:
                    form.visit_date,

                expected_time_in:
                    form.expected_time_in,

                expected_time_out:
                    form.expected_time_out,
            };

            const invitation =
                await createVisitorInvitation(
                    payload
                );

            if (onCreated) {
                await onCreated(
                    invitation
                );
            }

            onClose();

        } catch (error) {

            console.error(
                "Failed to create resident visitor invitation:",
                error
            );

            const data =
                error?.response?.data;

            if (
                data &&
                typeof data === "object"
            ) {

                setErrors(data);

            } else {

                setErrors({
                    general:
                        "Unable to create the visitor invitation.",
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

                <div className="rems-modal-header">

                    <div>

                        <div className="rems-page-eyebrow">
                            VISITOR ACCESS
                        </div>

                        <div className="rems-modal-title">
                            Invite Visitor
                        </div>

                        <div className="rems-modal-subtitle">
                            Register an expected visitor for your property.
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


                <form onSubmit={handleSubmit}>

                    <div className="rems-modal-body">

                        {errors.general && (
                            <div className="alert alert-danger rems-alert mb-3">
                                <i className="bi bi-exclamation-circle me-2" />
                                {Array.isArray(errors.general)
                                    ? errors.general[0]
                                    : errors.general}
                            </div>
                        )}


                        <div className="rems-form-section">

                            <div className="rems-form-section-title">
                                Visitor Information
                            </div>

                            <div className="row g-3">

                                <div className="col-12 col-md-6">

                                    <label className="rems-form-label">
                                        Visitor Name{" "}
                                        <span className="text-danger">*</span>
                                    </label>

                                    <input
                                        type="text"
                                        name="visitor_name"
                                        className={`form-control rems-form-control ${
                                            getError("visitor_name")
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        value={form.visitor_name}
                                        onChange={handleChange}
                                        required
                                    />

                                    {getError("visitor_name") && (
                                        <div className="invalid-feedback">
                                            {getError("visitor_name")}
                                        </div>
                                    )}

                                </div>


                                <div className="col-12 col-md-6">

                                    <label className="rems-form-label">
                                        Phone{" "}
                                        <span className="text-danger">*</span>
                                    </label>

                                    <input
                                        type="tel"
                                        name="visitor_phone"
                                        className={`form-control rems-form-control ${
                                            getError("visitor_phone")
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        value={form.visitor_phone}
                                        onChange={handleChange}
                                        required
                                    />

                                    {getError("visitor_phone") && (
                                        <div className="invalid-feedback">
                                            {getError("visitor_phone")}
                                        </div>
                                    )}

                                </div>


                                <div className="col-12">

                                    <label className="rems-form-label">
                                        Home Address{" "}
                                        <span className="text-danger">*</span>
                                    </label>

                                    <input
                                        type="text"
                                        name="visitor_home_address"
                                        className={`form-control rems-form-control ${
                                            getError("visitor_home_address")
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        value={form.visitor_home_address}
                                        onChange={handleChange}
                                        required
                                    />

                                    {getError("visitor_home_address") && (
                                        <div className="invalid-feedback">
                                            {getError("visitor_home_address")}
                                        </div>
                                    )}

                                </div>

                            </div>

                        </div>


                        <div className="rems-form-section">

                            <div className="rems-form-section-title">
                                Visit Authorization
                            </div>

                            <div className="row g-3">

                                <div className="col-12">

                                    <label className="rems-form-label">
                                        Property{" "}
                                        <span className="text-danger">*</span>
                                    </label>

                                    <select
                                        name="property"
                                        className={`form-select rems-form-control ${
                                            getError("property")
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        value={form.property}
                                        onChange={handleChange}
                                        disabled={
                                            loadingProperties ||
                                            saving
                                        }
                                        required
                                    >

                                        <option value="">
                                            {loadingProperties
                                                ? "Loading properties..."
                                                : "Select property"}
                                        </option>

                                        {properties.map(
                                            (property) => (
                                                <option
                                                    key={property.id}
                                                    value={property.id}
                                                >
                                                    {property.address ||
                                                        `Property #${property.id}`}
                                                </option>
                                            )
                                        )}

                                    </select>

                                    {getError("property") && (
                                        <div className="invalid-feedback">
                                            {getError("property")}
                                        </div>
                                    )}

                                </div>

                            </div>

                        </div>


                        <div className="rems-form-section">

                            <div className="rems-form-section-title">
                                Visit Schedule
                            </div>

                            <div className="row g-3">

                                <div className="col-12 col-md-4">

                                    <label className="rems-form-label">
                                        Visit Date{" "}
                                        <span className="text-danger">*</span>
                                    </label>

                                    <input
                                        type="date"
                                        name="visit_date"
                                        className={`form-control rems-form-control ${
                                            getError("visit_date")
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        value={form.visit_date}
                                        onChange={handleChange}
                                        required
                                    />

                                    {getError("visit_date") && (
                                        <div className="invalid-feedback">
                                            {getError("visit_date")}
                                        </div>
                                    )}

                                </div>


                                <div className="col-12 col-md-4">

                                    <label className="rems-form-label">
                                        Time In{" "}
                                        <span className="text-danger">*</span>
                                    </label>

                                    <input
                                        type="time"
                                        name="expected_time_in"
                                        className={`form-control rems-form-control ${
                                            getError("expected_time_in")
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        value={form.expected_time_in}
                                        onChange={handleChange}
                                        required
                                    />

                                    {getError("expected_time_in") && (
                                        <div className="invalid-feedback">
                                            {getError("expected_time_in")}
                                        </div>
                                    )}

                                </div>


                                <div className="col-12 col-md-4">

                                    <label className="rems-form-label">
                                        Time Out{" "}
                                        <span className="text-danger">*</span>
                                    </label>

                                    <input
                                        type="time"
                                        name="expected_time_out"
                                        className={`form-control rems-form-control ${
                                            getError("expected_time_out")
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        value={form.expected_time_out}
                                        onChange={handleChange}
                                        required
                                    />

                                    {getError("expected_time_out") && (
                                        <div className="invalid-feedback">
                                            {getError("expected_time_out")}
                                        </div>
                                    )}

                                </div>

                            </div>

                        </div>


                        <div className="alert alert-info rems-alert mb-0">

                            <i className="bi bi-shield-check me-2" />

                            Your account is automatically recorded as the
                            visitor host. Only properties currently authorized
                            to your account are available.

                        </div>

                    </div>


                    <div className="rems-modal-footer">

                        <button
                            type="button"
                            className="rems-secondary-button"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            className="rems-primary-button"
                            disabled={
                                saving ||
                                loadingProperties ||
                                !form.property
                            }
                        >

                            {saving ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm"
                                        aria-hidden="true"
                                    />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-person-plus" />
                                    Create Invitation
                                </>
                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}
