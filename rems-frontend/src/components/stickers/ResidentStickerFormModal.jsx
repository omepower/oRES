
import {
    useEffect,
    useState,
} from "react";

import {
    createMotoristSticker,
    getMyVehicles,
} from "../../api/vehicles";


const initialForm = {
    vehicle: "",
};


export default function ResidentStickerFormModal({
    show,
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
        vehicles,
        setVehicles,
    ] = useState([]);


    const [
        loadingVehicles,
        setLoadingVehicles,
    ] = useState(false);


    const [
        saving,
        setSaving,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState({});


    useEffect(() => {

        if (!show) {
            return;
        }

        setForm(
            initialForm
        );

        setError({});

        loadVehicles();

    }, [
        show,
    ]);


    const normalize = (
        response
    ) => {

        if (
            Array.isArray(
                response
            )
        ) {
            return response;
        }

        return (
            response?.results ||
            response?.vehicles ||
            []
        );

    };


    const loadVehicles = async () => {

        setLoadingVehicles(
            true
        );

        setError({});

        try {

            const response =
                await getMyVehicles();

            const data =
                normalize(
                    response
                );

            setVehicles(
                data.filter(
                    (vehicle) =>
                        vehicle.is_active !== false
                )
            );

        } catch (err) {

            console.error(
                "[Resident Sticker] Failed to load vehicles:",
                err
            );

            setError({
                general:
                    "Unable to load your active vehicles.",
            });

            setVehicles([]);

        } finally {

            setLoadingVehicles(
                false
            );

        }
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


    const handleChange = (
        event
    ) => {

        const {
            name,
            value,
        } = event.target;

        setForm(
            (previous) => ({
                ...previous,
                [name]:
                    value,
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


    const selectedVehicle =
        vehicles.find(
            (vehicle) =>
                String(vehicle.id) ===
                String(form.vehicle)
        );


    const handleSubmit =
        async (
            event
        ) => {

            event.preventDefault();

            if (!form.vehicle) {
                return;
            }

            setSaving(true);

            setError({});

            try {

                /*
                 * We deliberately submit only the vehicle.
                 *
                 * The backend should derive/validate:
                 * - resident
                 * - property
                 *
                 * from the authenticated resident and vehicle.
                 */

                const payload = {
                    vehicle:
                        Number(
                            form.vehicle
                        ),
                };


                const saved =
                    await createMotoristSticker(
                        payload
                    );


                if (onSuccess) {

                    await onSuccess(
                        saved
                    );

                }

                onClose();

            } catch (err) {

                console.error(
                    "[Resident Sticker] Save failed:",
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
                            "Unable to request the motorist sticker.",
                    });

                }

            } finally {

                setSaving(
                    false
                );

            }
        };


    if (!show) {
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
                onMouseDown={(
                    event
                ) =>
                    event.stopPropagation()
                }
            >

                <div className="rems-modal-header">

                    <div>

                        <div className="rems-page-eyebrow">
                            MOTORIST ACCESS
                        </div>

                        <div className="rems-modal-title">
                            Request Motorist Sticker
                        </div>

                        <div className="rems-modal-subtitle">
                            Request a sticker for one of your registered vehicles.
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


                        <div className="rems-form-section">

                            <div className="rems-form-section-title">

                                <i className="bi bi-car-front me-2" />

                                Vehicle

                            </div>


                            <label className="rems-form-label">

                                Registered Vehicle

                                <span className="text-danger">
                                    {" "}*
                                </span>

                            </label>


                            <select
                                name="vehicle"
                                className={`form-select rems-form-control ${
                                    getError(
                                        "vehicle"
                                    )
                                        ? "is-invalid"
                                        : ""
                                }`}
                                value={
                                    form.vehicle
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    loadingVehicles ||
                                    saving
                                }
                                required
                            >

                                <option value="">

                                    {
                                        loadingVehicles
                                            ? "Loading vehicles..."
                                            : vehicles.length
                                                ? "Select vehicle"
                                                : "No active vehicles available"
                                    }

                                </option>


                                {vehicles.map(
                                    (
                                        vehicle
                                    ) => (

                                        <option
                                            key={
                                                vehicle.id
                                            }
                                            value={
                                                vehicle.id
                                            }
                                        >

                                            {
                                                vehicle.plate_number
                                            }

                                            {" — "}

                                            {
                                                vehicle.make
                                            }

                                            {" "}

                                            {
                                                vehicle.model
                                            }

                                            {" — "}

                                            {
                                                vehicle.color
                                            }

                                        </option>

                                    )
                                )}

                            </select>


                            {getError(
                                "vehicle"
                            ) && (

                                <div className="invalid-feedback">

                                    {
                                        getError(
                                            "vehicle"
                                        )
                                    }

                                </div>

                            )}


                            {!loadingVehicles &&
                                !vehicles.length && (

                                    <div className="form-text text-danger">

                                        You need an active registered
                                        vehicle before requesting a
                                        motorist sticker.

                                    </div>

                                )}

                        </div>


                        {selectedVehicle && (

                            <div className="rems-form-section">

                                <div className="rems-form-section-title">

                                    <i className="bi bi-info-circle me-2" />

                                    Vehicle Summary

                                </div>


                                <div className="row g-3">


                                    <div className="col-12 col-md-6">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Plate Number
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        selectedVehicle.plate_number ||
                                                        "—"
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12 col-md-6">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Vehicle
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        selectedVehicle.make
                                                    }

                                                    {" "}

                                                    {
                                                        selectedVehicle.model
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Property
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        selectedVehicle.property_address ||
                                                        "Authorized property"
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        )}


                        <div className="alert alert-info rems-alert mb-0">

                            <strong>
                                Approval required.
                            </strong>

                            <div className="small mt-1">

                                Your request will initially be marked
                                Pending. An administrator must approve
                                it before the sticker becomes active.

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
                                loadingVehicles ||
                                !form.vehicle
                            }
                        >

                            {saving ? (

                                <>

                                    <span
                                        className="spinner-border spinner-border-sm"
                                        aria-hidden="true"
                                    />

                                    Requesting...

                                </>

                            ) : (

                                <>

                                    <i className="bi bi-shield-check" />

                                    Request Sticker

                                </>

                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}