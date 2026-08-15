import {
    useEffect,
    useState,
} from "react";

import {
    createPropertyOwnership,
    updatePropertyOwnership,
} from "../../api/properties";

import {
    getHomeowners,
} from "../../api/residents";


const initialForm = {
    homeowner: "",
    start_date: "",
    end_date: "",
    is_active: true,
};


export default function PropertyOwnershipModal({
    show,
    property,
    ownership,
    onClose,
    onSuccess,
}) {

    const [
        homeowners,
        setHomeowners,
    ] = useState([]);

    const [
        form,
        setForm,
    ] = useState(initialForm);

    const [
        loadingHomeowners,
        setLoadingHomeowners,
    ] = useState(false);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const isEditing =
        Boolean(ownership?.id);


    useEffect(() => {

        if (!show) {
            return;
        }

        setError("");

        if (ownership) {

            setForm({
                homeowner:
                    ownership.homeowner ||
                    "",
                start_date:
                    ownership.start_date ||
                    "",
                end_date:
                    ownership.end_date ||
                    "",
                is_active:
                    ownership.is_active !== false,
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

        loadHomeowners();

    }, [
        show,
        ownership,
    ]);


    const loadHomeowners = async () => {

        setLoadingHomeowners(true);

        try {

            const data =
                await getHomeowners();

            setHomeowners(
                Array.isArray(data)
                    ? data
                    : data?.results || []
            );

        } catch (err) {

            console.error(
                "Failed to load homeowners:",
                err
            );

            setError(
                "Unable to load homeowner accounts."
            );

        } finally {

            setLoadingHomeowners(false);
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

        setError("");
    };


    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();

        if (!property?.id) {
            setError(
                "No property was selected."
            );
            return;
        }

        setSaving(true);
        setError("");

        try {

            const payload = {
                property:
                    Number(property.id),

                homeowner:
                    Number(form.homeowner),

                start_date:
                    form.start_date,

                end_date:
                    form.end_date ||
                    null,

                is_active:
                    form.is_active,
            };


            const response =
                isEditing
                    ? await updatePropertyOwnership(
                        ownership.id,
                        payload
                    )
                    : await createPropertyOwnership(
                        payload
                    );


            if (onSuccess) {
                await onSuccess(
                    response
                );
            }

        } catch (err) {

            console.error(
                "Property ownership save failed:",
                err
            );

            const data =
                err?.response?.data;

            if (
                data &&
                typeof data === "object"
            ) {

                const firstError =
                    Object.values(data)[0];

                setError(
                    Array.isArray(firstError)
                        ? firstError.join(" ")
                        : firstError ||
                          "Unable to save ownership record."
                );

            } else {

                setError(
                    "Unable to save ownership record."
                );
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
                            PROPERTY OWNERSHIP
                        </div>

                        <h5 className="mb-1 fw-semibold">
                            {isEditing
                                ? "Edit Ownership Record"
                                : "Assign Homeowner"}
                        </h5>

                        <div className="small text-muted">
                            {property.address}
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
                    onSubmit={handleSubmit}
                >

                    <div className="rems-modal-body">

                        {error && (
                            <div className="alert alert-danger rems-alert">
                                <i className="bi bi-exclamation-circle me-2" />
                                {error}
                            </div>
                        )}


                        <div className="rems-form-section">

                            <div className="rems-form-section-title">
                                <i className="bi bi-person-vcard me-2" />
                                Ownership Information
                            </div>


                            <div className="row g-3">

                                <div className="col-12">

                                    <label className="form-label">
                                        Homeowner
                                        <span className="text-danger">
                                            {" "}*
                                        </span>
                                    </label>

                                    <select
                                        name="homeowner"
                                        className="form-select rems-form-control"
                                        value={
                                            form.homeowner
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            loadingHomeowners ||
                                            saving
                                        }
                                        required
                                    >

                                        <option value="">
                                            {loadingHomeowners
                                                ? "Loading homeowners..."
                                                : "Select homeowner"}
                                        </option>

                                        {homeowners.map(
                                            (resident) => (
                                                <option
                                                    key={
                                                        resident.user_id ||
                                                        resident.id
                                                    }
                                                    value={
                                                        resident.user_id ||
                                                        resident.id
                                                    }
                                                >
                                                    {resident.full_name ||
                                                        `${resident.first_name || ""} ${resident.last_name || ""}`.trim() ||
                                                        resident.username ||
                                                        `Homeowner #${resident.id}`}
                                                </option>
                                            )
                                        )}

                                    </select>

                                    <div className="form-text">
                                        The backend will verify that
                                        the selected account has the
                                        HOMEOWNER role.
                                    </div>

                                </div>


                                <div className="col-12 col-md-6">

                                    <label className="form-label">
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

                                    <label className="form-label">
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
                                            Active ownership must not
                                            have an end date.
                                        </div>
                                    )}

                                </div>


                                <div className="col-12">

                                    <div className="form-check form-switch">

                                        <input
                                            id="ownership-active"
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
                                            htmlFor="ownership-active"
                                            className="form-check-label"
                                        >
                                            Active ownership record
                                        </label>

                                    </div>

                                </div>

                            </div>

                        </div>


                        <div className="alert alert-info rems-alert mb-0">

                            <strong>
                                Ownership history is preserved.
                            </strong>

                            <div className="small mt-1">
                                Creating a new active ownership
                                record will only succeed when the
                                property has no other active
                                ownership record.
                            </div>

                        </div>

                    </div>


                    <div className="rems-modal-footer">

                        <button
                            type="button"
                            className="btn rems-btn-secondary"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="btn rems-btn-primary"
                            disabled={
                                saving ||
                                loadingHomeowners
                            }
                        >

                            {saving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check2 me-2" />
                                    {isEditing
                                        ? "Save Changes"
                                        : "Assign Homeowner"}
                                </>
                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}