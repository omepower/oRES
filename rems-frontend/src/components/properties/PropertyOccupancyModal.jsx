import {
    useEffect,
    useState,
} from "react";

import {
    createPropertyOccupancy,
    updatePropertyOccupancy,
} from "../../api/properties";

import {
    getResidents,
} from "../../api/residents";


const initialForm = {
    resident: "",
    occupancy_type: "",
    start_date: "",
    end_date: "",
    is_active: true,
};


export default function PropertyOccupancyModal({
    show,
    property,
    occupancy,
    onClose,
    onSuccess,
}) {

    const [
        residents,
        setResidents,
    ] = useState([]);

    const [
        form,
        setForm,
    ] = useState(initialForm);

    const [
        loadingResidents,
        setLoadingResidents,
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
        Boolean(occupancy?.id);


    useEffect(() => {

        if (!show) {
            return;
        }

        setError("");

        if (occupancy) {

            setForm({
                resident:
                    occupancy.resident ||
                    "",
                occupancy_type:
                    occupancy.occupancy_type ||
                    "",
                start_date:
                    occupancy.start_date ||
                    "",
                end_date:
                    occupancy.end_date ||
                    "",
                is_active:
                    occupancy.is_active !== false,
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

        loadResidents();

    }, [
        show,
        occupancy,
    ]);


    const loadResidents = async () => {

        setLoadingResidents(true);

        try {

            const data =
                await getResidents();

            setResidents(
                Array.isArray(data)
                    ? data.filter(
                          (resident) =>
                              resident.is_active
                      )
                    : (
                          data?.results || []
                      ).filter(
                          (resident) =>
                              resident.is_active
                      )
            );

        } catch (err) {

            console.error(
                "Failed to load residents:",
                err
            );

            setError(
                "Unable to load resident records."
            );

        } finally {

            setLoadingResidents(false);
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


    const handleResidentChange = (
        event
    ) => {

        const residentId =
            event.target.value;

        const resident =
            residents.find(
                (item) =>
                    String(item.id) ===
                    String(residentId)
            );


        setForm(
            (previous) => ({
                ...previous,

                resident:
                    residentId,

                occupancy_type:
                    resident?.resident_type ||
                    "",
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

                resident:
                    Number(form.resident),

                occupancy_type:
                    form.occupancy_type,

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
                    ? await updatePropertyOccupancy(
                        occupancy.id,
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

        } catch (err) {

            console.error(
                "Property occupancy save failed:",
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
                          "Unable to save occupancy record."
                );

            } else {

                setError(
                    "Unable to save occupancy record."
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
                            PROPERTY OCCUPANCY
                        </div>

                        <h5 className="mb-1 fw-semibold">
                            {isEditing
                                ? "Edit Occupancy Record"
                                : "Assign Occupant"}
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
                                <i className="bi bi-person me-2" />
                                Occupancy Information
                            </div>


                            <div className="row g-3">

                                <div className="col-12">

                                    <label className="form-label">
                                        Resident
                                        <span className="text-danger">
                                            {" "}*
                                        </span>
                                    </label>

                                    <select
                                        name="resident"
                                        className="form-select rems-form-control"
                                        value={
                                            form.resident
                                        }
                                        onChange={
                                            handleResidentChange
                                        }
                                        disabled={
                                            loadingResidents ||
                                            saving
                                        }
                                        required
                                    >

                                        <option value="">
                                            {loadingResidents
                                                ? "Loading residents..."
                                                : "Select resident"}
                                        </option>

                                        {residents.map(
                                            (resident) => (
                                                <option
                                                    key={
                                                        resident.id
                                                    }
                                                    value={
                                                        resident.id
                                                    }
                                                >
                                                    {resident.full_name ||
                                                        `${resident.first_name || ""} ${resident.last_name || ""}`.trim() ||
                                                        resident.username ||
                                                        `Resident #${resident.id}`}
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>


                                <div className="col-12 col-md-6">

                                    <label className="form-label">
                                        Occupancy Type
                                    </label>

                                    <select
                                        name="occupancy_type"
                                        className="form-select rems-form-control"
                                        value={
                                            form.occupancy_type
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            true
                                        }
                                        required
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
                                        Automatically determined
                                        from the resident's account role.
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
                                            Active occupancy must
                                            not have an end date.
                                        </div>
                                    )}

                                </div>


                                <div className="col-12 col-md-6 d-flex align-items-end">

                                    <div className="form-check form-switch mb-2">

                                        <input
                                            id="occupancy-active"
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
                                            htmlFor="occupancy-active"
                                            className="form-check-label"
                                        >
                                            Active occupancy record
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
                                A property can have only one active
                                occupancy record. Django will reject
                                conflicting active occupancy records.
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
                                loadingResidents ||
                                !form.resident
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