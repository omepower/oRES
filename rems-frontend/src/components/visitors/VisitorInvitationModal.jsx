import {
    useEffect,
    useState,
} from "react";

import {
    createVisitorInvitation,
} from "../../api/visitors";

export default function VisitorInvitationModal({
    show,
    onClose,
    onCreated,
    hosts = [],
    properties = [],
}) {

    const [form, setForm] = useState({
        visitor_name: "",
        visitor_home_address: "",
        visitor_phone: "",
        host: "",
        property: "",
        visit_date: "",
        expected_time_in: "",
        expected_time_out: "",
    });

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    const [fieldErrors, setFieldErrors] =
        useState({});

    useEffect(() => {

        if (show) {

            setForm({
                visitor_name: "",
                visitor_home_address: "",
                visitor_phone: "",
                host: "",
                property: "",
                visit_date: "",
                expected_time_in: "",
                expected_time_out: "",
            });

            setError("");
            setFieldErrors({});
        }

    }, [show]);

    if (!show) {
        return null;
    }

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        setFieldErrors((previous) => ({
            ...previous,
            [name]: undefined,
        }));

        setError("");
    };

    const getFieldError = (field) => {

        const value =
            fieldErrors?.[field];

        if (Array.isArray(value)) {
            return value[0];
        }

        if (typeof value === "string") {
            return value;
        }

        return null;
    };

    const handleSubmit = async (event) => {

        event.preventDefault();

        setSaving(true);
        setError("");
        setFieldErrors({});

        try {

            const payload = {
                visitor_name:
                    form.visitor_name.trim(),

                visitor_home_address:
                    form.visitor_home_address.trim(),

                visitor_phone:
                    form.visitor_phone.trim(),

                host:
                    Number(form.host),

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

        } catch (err) {

            console.error(
                "Create visitor invitation failed:",
                err
            );

            const responseData =
                err?.response?.data;

            if (
                responseData &&
                typeof responseData === "object"
            ) {

                setFieldErrors(
                    responseData
                );

                setError(
                    responseData.detail ||
                    responseData.non_field_errors?.[0] ||
                    "Unable to create the visitor invitation."
                );

            } else {

                setError(
                    "Unable to create the visitor invitation. Please try again."
                );
            }

        } finally {

            setSaving(false);
        }
    };

    return (
        <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            style={{
                backgroundColor:
                    "rgba(15, 23, 42, 0.45)",
            }}
        >

            <div
                className="modal-dialog modal-dialog-centered modal-lg"
                role="document"
            >

                <div className="modal-content rems-modal">

                    <div className="modal-header rems-modal-header">

                        <div>

                            <div className="rems-modal-icon">
                                <i className="bi bi-person-plus" />
                            </div>

                            <div className="rems-modal-title">
                                Create Visitor Invitation
                            </div>

                            <div className="rems-modal-subtitle">
                                Register an expected visitor and issue a secure invitation.
                            </div>

                        </div>

                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            disabled={saving}
                            aria-label="Close"
                        />

                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="modal-body rems-modal-body">

                            {error && (
                                <div
                                    className="alert alert-danger rems-alert"
                                    role="alert"
                                >
                                    <i className="bi bi-exclamation-circle me-2" />
                                    {error}
                                </div>
                            )}

                            <div className="rems-form-section">

                                <div className="rems-form-section-title">
                                    <i className="bi bi-person me-2" />
                                    Visitor Information
                                </div>

                                <div className="row g-3">

                                    <div className="col-12 col-md-6">

                                        <label className="form-label">
                                            Visitor Name
                                            <span className="text-danger">
                                                {" "}*
                                            </span>
                                        </label>

                                        <input
                                            type="text"
                                            name="visitor_name"
                                            className={`form-control rems-form-control ${
                                                getFieldError("visitor_name")
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={
                                                form.visitor_name
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter visitor's full name"
                                            required
                                        />

                                        {getFieldError(
                                            "visitor_name"
                                        ) && (
                                            <div className="invalid-feedback">
                                                {
                                                    getFieldError(
                                                        "visitor_name"
                                                    )
                                                }
                                            </div>
                                        )}

                                    </div>

                                    <div className="col-12 col-md-6">

                                        <label className="form-label">
                                            Visitor Phone
                                            <span className="text-danger">
                                                {" "}*
                                            </span>
                                        </label>

                                        <input
                                            type="tel"
                                            name="visitor_phone"
                                            className={`form-control rems-form-control ${
                                                getFieldError("visitor_phone")
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={
                                                form.visitor_phone
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter phone number"
                                            required
                                        />

                                        {getFieldError(
                                            "visitor_phone"
                                        ) && (
                                            <div className="invalid-feedback">
                                                {
                                                    getFieldError(
                                                        "visitor_phone"
                                                    )
                                                }
                                            </div>
                                        )}

                                    </div>

                                    <div className="col-12">

                                        <label className="form-label">
                                            Visitor Home Address
                                            <span className="text-danger">
                                                {" "}*
                                            </span>
                                        </label>

                                        <input
                                            type="text"
                                            name="visitor_home_address"
                                            className={`form-control rems-form-control ${
                                                getFieldError(
                                                    "visitor_home_address"
                                                )
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={
                                                form.visitor_home_address
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter visitor's home address"
                                            required
                                        />

                                        {getFieldError(
                                            "visitor_home_address"
                                        ) && (
                                            <div className="invalid-feedback">
                                                {
                                                    getFieldError(
                                                        "visitor_home_address"
                                                    )
                                                }
                                            </div>
                                        )}

                                    </div>

                                </div>

                            </div>

                            <div className="rems-form-section">

                                <div className="rems-form-section-title">
                                    <i className="bi bi-house me-2" />
                                    Visit Authorization
                                </div>

                                <div className="row g-3">

                                    <div className="col-12 col-md-6">

                                        <label className="form-label">
                                            Host / Resident
                                            <span className="text-danger">
                                                {" "}*
                                            </span>
                                        </label>

                                        <select
                                            name="host"
                                            className={`form-select rems-form-control ${
                                                getFieldError("host")
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={
                                                form.host
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        >

                                            <option value="">
                                                Select resident
                                            </option>

                                            {hosts.map(
                                                (host) => (
                                                    <option
                                                        key={
                                                            host.id
                                                        }
                                                        value={
                                                            host.id
                                                        }
                                                    >
                                                        {host.full_name ||
                                                            `${host.first_name || ""} ${host.last_name || ""}`.trim() ||
                                                            `Resident #${host.id}`}
                                                    </option>
                                                )
                                            )}

                                        </select>

                                        {getFieldError(
                                            "host"
                                        ) && (
                                            <div className="invalid-feedback">
                                                {
                                                    getFieldError(
                                                        "host"
                                                    )
                                                }
                                            </div>
                                        )}

                                    </div>

                                    <div className="col-12 col-md-6">

                                        <label className="form-label">
                                            Property
                                            <span className="text-danger">
                                                {" "}*
                                            </span>
                                        </label>

                                        <select
                                            name="property"
                                            className={`form-select rems-form-control ${
                                                getFieldError("property")
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={
                                                form.property
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        >

                                            <option value="">
                                                Select property
                                            </option>

                                            {properties.map(
                                                (property) => (
                                                    <option
                                                        key={
                                                            property.id
                                                        }
                                                        value={
                                                            property.id
                                                        }
                                                    >
                                                        {property.address ||
                                                            property.name ||
                                                            `Property #${property.id}`}
                                                    </option>
                                                )
                                            )}

                                        </select>

                                        {getFieldError(
                                            "property"
                                        ) && (
                                            <div className="invalid-feedback">
                                                {
                                                    getFieldError(
                                                        "property"
                                                    )
                                                }
                                            </div>
                                        )}

                                    </div>

                                </div>

                            </div>

                            <div className="rems-form-section">

                                <div className="rems-form-section-title">
                                    <i className="bi bi-calendar-event me-2" />
                                    Visit Schedule
                                </div>

                                <div className="row g-3">

                                    <div className="col-12 col-md-4">

                                        <label className="form-label">
                                            Visit Date
                                            <span className="text-danger">
                                                {" "}*
                                            </span>
                                        </label>

                                        <input
                                            type="date"
                                            name="visit_date"
                                            className={`form-control rems-form-control ${
                                                getFieldError("visit_date")
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={
                                                form.visit_date
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                        {getFieldError(
                                            "visit_date"
                                        ) && (
                                            <div className="invalid-feedback">
                                                {
                                                    getFieldError(
                                                        "visit_date"
                                                    )
                                                }
                                            </div>
                                        )}

                                    </div>

                                    <div className="col-12 col-md-4">

                                        <label className="form-label">
                                            Expected Time In
                                            <span className="text-danger">
                                                {" "}*
                                            </span>
                                        </label>

                                        <input
                                            type="time"
                                            name="expected_time_in"
                                            className={`form-control rems-form-control ${
                                                getFieldError(
                                                    "expected_time_in"
                                                )
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={
                                                form.expected_time_in
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                        {getFieldError(
                                            "expected_time_in"
                                        ) && (
                                            <div className="invalid-feedback">
                                                {
                                                    getFieldError(
                                                        "expected_time_in"
                                                    )
                                                }
                                            </div>
                                        )}

                                    </div>

                                    <div className="col-12 col-md-4">

                                        <label className="form-label">
                                            Expected Time Out
                                            <span className="text-danger">
                                                {" "}*
                                            </span>
                                        </label>

                                        <input
                                            type="time"
                                            name="expected_time_out"
                                            className={`form-control rems-form-control ${
                                                getFieldError(
                                                    "expected_time_out"
                                                )
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={
                                                form.expected_time_out
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                        {getFieldError(
                                            "expected_time_out"
                                        ) && (
                                            <div className="invalid-feedback">
                                                {
                                                    getFieldError(
                                                        "expected_time_out"
                                                    )
                                                }
                                            </div>
                                        )}

                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="modal-footer rems-modal-footer">

                            <button
                                type="button"
                                className="btn btn-light rems-btn-secondary"
                                onClick={onClose}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="btn rems-btn-primary"
                                disabled={saving}
                            >

                                {saving ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            aria-hidden="true"
                                        />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check2-circle me-2" />
                                        Create Invitation
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