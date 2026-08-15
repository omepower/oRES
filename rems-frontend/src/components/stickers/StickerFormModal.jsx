import {
    useEffect,
    useState,
} from "react";

import {
    createMotoristSticker,
    updateMotoristSticker,
    getMotoristStickerAvailableSlots,
    getVehicles,
} from "../../api/vehicles";

import {
    getProperties,
    getPropertyOccupancies,
    getPropertyOwnerships,
} from "../../api/properties";


const initialForm = {
    property: "",
    resident: "",
    vehicle: "",
};


export default function StickerFormModal({
    show,
    sticker,
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
        vehicles,
        setVehicles,
    ] = useState([]);


    const [
        capacity,
        setCapacity,
    ] = useState(null);


    const [
        loadingProperties,
        setLoadingProperties,
    ] = useState(false);


    const [
        loadingResidents,
        setLoadingResidents,
    ] = useState(false);


    const [
        loadingVehicles,
        setLoadingVehicles,
    ] = useState(false);


    const [
        loadingCapacity,
        setLoadingCapacity,
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
        Boolean(
            sticker?.id
        );


    /* =========================================================
       NORMALIZE
    ========================================================= */

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


        if (
            response &&
            Array.isArray(
                response.results
            )
        ) {

            return response.results;
        }


        return [];
    };


    /* =========================================================
       ERROR
    ========================================================= */

    const getErrorText = (
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


    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    useEffect(() => {

        if (!show) {
            return;
        }


        setErrors({});

        setCapacity(null);

        setResidents([]);

        setVehicles([]);


        if (sticker) {

            const propertyId =
                sticker.property
                    ? String(
                        sticker.property
                    )
                    : "";


            const residentId =
                sticker.resident
                    ? String(
                        sticker.resident
                    )
                    : "";


            const vehicleId =
                sticker.vehicle
                    ? String(
                        sticker.vehicle
                    )
                    : "";


            setForm({

                property:
                    propertyId,

                resident:
                    residentId,

                vehicle:
                    vehicleId,

            });


            loadProperties().then(
                async () => {

                    if (
                        propertyId
                    ) {

                        await loadPropertyData(
                            propertyId,
                            residentId,
                            vehicleId
                        );

                    }

                }
            );

        } else {

            setForm(
                initialForm
            );

            loadProperties();

        }

    }, [
        show,
        sticker,
    ]);


    /* =========================================================
       LOAD PROPERTIES
    ========================================================= */

    const loadProperties =
        async () => {

            setLoadingProperties(
                true
            );


            try {

                const response =
                    await getProperties({
                        is_active:
                            true,
                    });


                setProperties(
                    normalize(
                        response
                    )
                );

            } catch (error) {

                console.error(
                    "Unable to load sticker properties:",
                    error
                );


                setErrors({
                    general:
                        "Unable to load properties.",
                });

            } finally {

                setLoadingProperties(
                    false
                );
            }
        };


    /* =========================================================
       LOAD PROPERTY DATA
    ========================================================= */

    const loadPropertyData =
        async (
            propertyId,
            preferredResidentId = "",
            preferredVehicleId = ""
        ) => {

            if (!propertyId) {

                setResidents([]);

                setVehicles([]);

                setCapacity(null);

                return;
            }


            setLoadingResidents(
                true
            );

            setLoadingVehicles(
                true
            );

            setLoadingCapacity(
                true
            );


            try {

                const [
                    occupancyResponse,
                    ownershipResponse,
                    capacityResponse,
                ] = await Promise.all([

                    getPropertyOccupancies({
                        property:
                            propertyId,

                        is_active:
                            true,
                    }),

                    getPropertyOwnerships({
                        property:
                            propertyId,

                        is_active:
                            true,
                    }),

                    getMotoristStickerAvailableSlots(
                        propertyId
                    ),

                ]);


                const occupancyRecords =
                    normalize(
                        occupancyResponse
                    );


                const ownershipRecords =
                    normalize(
                        ownershipResponse
                    );


                /*
                 * Resident IDs from active occupancy.
                 */

                const residentIds =
                    new Set();


                occupancyRecords.forEach(
                    (
                        record
                    ) => {

                        if (
                            record?.is_active &&
                            record?.resident
                        ) {

                            residentIds.add(
                                Number(
                                    record.resident
                                )
                            );

                        }

                    }
                );


                /*
                 * Ownership records contain homeowner USER IDs.
                 *
                 * We need the actual Resident record.
                 *
                 * Since the ownership serializer already provides
                 * homeowner_name / homeowner_username but not the
                 * resident ID, we retrieve the residents from the
                 * existing property occupancy records first.
                 *
                 * If the homeowner is also a Resident, its resident
                 * record can be identified by username.
                 */

                const homeownerUsernames =
                    ownershipRecords
                        .filter(
                            (
                                record
                            ) =>
                                record?.is_active
                        )
                        .map(
                            (
                                record
                            ) =>
                                record.homeowner_username
                        )
                        .filter(
                            Boolean
                        );


                let allResidents = [];


                /*
                 * Occupancy records may already provide resident data
                 * in future serializer versions. Prefer that information.
                 */

                occupancyRecords.forEach(
                    (
                        record
                    ) => {

                        if (
                            record?.resident
                        ) {

                            allResidents.push({
                                id:
                                    record.resident,

                                full_name:
                                    record.resident_name,

                                username:
                                    record.resident_username,

                                resident_type:
                                    record.occupancy_type,

                                resident_type_display:
                                    record.occupancy_type_display,

                            });

                        }

                    }
                );


                /*
                 * If active ownership exists, retrieve the complete
                 * resident collection and match homeowner usernames.
                 *
                 * This uses the existing residents API indirectly through
                 * the ownership records already returned by Django.
                 */

                if (
                    homeownerUsernames.length
                ) {

                    try {

                        const residentResponse =
                            await import(
                                "../../api/residents"
                            ).then(
                                (
                                    module
                                ) =>
                                    module.getResidents({
                                        is_active:
                                            true,
                                    })
                            );


                        const residentData =
                            normalize(
                                residentResponse
                            );


                        residentData
                            .filter(
                                (
                                    resident
                                ) =>
                                    homeownerUsernames.includes(
                                        resident.username
                                    )
                            )
                            .forEach(
                                (
                                    resident
                                ) => {

                                    residentIds.add(
                                        Number(
                                            resident.id
                                        )
                                    );

                                    allResidents.push(
                                        resident
                                    );

                                }
                            );

                    } catch (
                        residentError
                    ) {

                        console.error(
                            "Unable to resolve homeowner residents:",
                            residentError
                        );

                    }

                }


                /*
                 * Remove duplicate residents.
                 */

                const uniqueResidents =
                    Array.from(
                        new Map(
                            allResidents.map(
                                (
                                    resident
                                ) => [

                                    Number(
                                        resident.id
                                    ),

                                    resident,

                                ]
                            )
                        ).values()
                    ).filter(
                        (
                            resident
                        ) =>
                            residentIds.has(
                                Number(
                                    resident.id
                                )
                            )
                    );


                setResidents(
                    uniqueResidents
                );


                /*
                 * Load vehicle list for the property.
                 */

                const vehicleResponse =
                    await getVehicles({
                        property:
                            propertyId,

                        is_active:
                            true,
                    });


                const propertyVehicles =
                    normalize(
                        vehicleResponse
                    );


                /*
                 * During editing, narrow vehicle list to the
                 * selected resident.
                 */

                const residentVehicles =
                    preferredResidentId
                        ? propertyVehicles.filter(
                            (
                                vehicle
                            ) =>
                                String(
                                    vehicle.registered_resident
                                ) ===
                                String(
                                    preferredResidentId
                                )
                        )
                        : [];


                setVehicles(
                    residentVehicles
                );


                setCapacity(
                    capacityResponse
                );


                /*
                 * If the existing resident is no longer authorized,
                 * clear the assignment.
                 */

                if (
                    preferredResidentId
                ) {

                    const residentStillValid =
                        uniqueResidents.some(
                            (
                                resident
                            ) =>
                                String(
                                    resident.id
                                ) ===
                                String(
                                    preferredResidentId
                                )
                        );


                    if (
                        !residentStillValid
                    ) {

                        setForm(
                            (
                                previous
                            ) => ({

                                ...previous,

                                resident:
                                    "",

                                vehicle:
                                    "",

                            })
                        );

                    }

                }


                /*
                 * If the existing vehicle is no longer associated
                 * with the selected resident, clear it.
                 */

                if (
                    preferredVehicleId &&
                    !residentVehicles.some(
                        (
                            vehicle
                        ) =>
                            String(
                                vehicle.id
                            ) ===
                            String(
                                preferredVehicleId
                            )
                    )
                ) {

                    setForm(
                        (
                            previous
                        ) => ({

                            ...previous,

                            vehicle:
                                "",

                        })
                    );

                }

            } catch (error) {

                console.error(
                    "Unable to load property sticker data:",
                    error
                );


                setErrors({
                    general:
                        "Unable to load the authorized residents, vehicles, or sticker availability.",
                });

            } finally {

                setLoadingResidents(
                    false
                );

                setLoadingVehicles(
                    false
                );

                setLoadingCapacity(
                    false
                );
            }
        };


    /* =========================================================
       LOAD VEHICLES FOR RESIDENT
    ========================================================= */

    const loadResidentVehicles =
        async (
            propertyId,
            residentId
        ) => {

            if (
                !propertyId ||
                !residentId
            ) {

                setVehicles([]);

                return;
            }


            setLoadingVehicles(
                true
            );


            try {

                const response =
                    await getVehicles({
                        property:
                            propertyId,

                        registered_resident:
                            residentId,

                        is_active:
                            true,
                    });


                setVehicles(
                    normalize(
                        response
                    )
                );

            } catch (error) {

                console.error(
                    "Unable to load resident vehicles:",
                    error
                );


                setVehicles([]);


                setErrors(
                    (
                        previous
                    ) => ({

                        ...previous,

                        vehicle:
                            "Unable to load vehicles for this resident.",

                    })
                );

            } finally {

                setLoadingVehicles(
                    false
                );
            }
        };


    /* =========================================================
       PROPERTY CHANGE
    ========================================================= */

    const handlePropertyChange =
        async (
            event
        ) => {

            const propertyId =
                event.target.value;


            setForm(
                (
                    previous
                ) => ({

                    ...previous,

                    property:
                        propertyId,

                    resident:
                        "",

                    vehicle:
                        "",

                })
            );


            setErrors({});

            setResidents([]);

            setVehicles([]);

            setCapacity(null);


            if (
                !propertyId
            ) {

                return;
            }


            await loadPropertyData(
                propertyId
            );
        };


    /* =========================================================
       RESIDENT CHANGE
    ========================================================= */

    const handleResidentChange =
        async (
            event
        ) => {

            const residentId =
                event.target.value;


            setForm(
                (
                    previous
                ) => ({

                    ...previous,

                    resident:
                        residentId,

                    vehicle:
                        "",

                })
            );


            setErrors(
                (
                    previous
                ) => ({

                    ...previous,

                    resident:
                        undefined,

                    vehicle:
                        undefined,

                    general:
                        undefined,

                })
            );


            setVehicles([]);


            if (
                !residentId ||
                !form.property
            ) {

                return;
            }


            await loadResidentVehicles(
                form.property,
                residentId
            );
        };


    /* =========================================================
       VEHICLE CHANGE
    ========================================================= */

    const handleVehicleChange =
        (
            event
        ) => {

            setForm(
                (
                    previous
                ) => ({

                    ...previous,

                    vehicle:
                        event.target.value,

                })
            );


            setErrors(
                (
                    previous
                ) => ({

                    ...previous,

                    vehicle:
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

                    vehicle:
                        Number(
                            form.vehicle
                        ),

                };


                const saved =
                    isEditing

                        ? await updateMotoristSticker(
                            sticker.id,
                            payload
                        )

                        : await createMotoristSticker(
                            payload
                        );


                if (
                    onSuccess
                ) {

                    await onSuccess(
                        saved
                    );
                }

            } catch (
                error
            ) {

                console.error(
                    "Sticker save failed:",
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
                            "Unable to save motorist sticker.",
                    });
                }

            } finally {

                setSaving(
                    false
                );
            }
        };


    /* =========================================================
       CLOSE
    ========================================================= */

    const handleClose =
        () => {

            if (
                saving
            ) {

                return;
            }


            onClose();
        };


    if (
        !show
    ) {

        return null;
    }


    const noSlotsAvailable =
        !isEditing &&
        capacity &&
        Number(
            capacity.available
        ) <= 0;


    const canSubmit =
        Boolean(
            form.property &&
            form.resident &&
            form.vehicle
        ) &&
        !saving &&
        !loadingProperties &&
        !loadingResidents &&
        !loadingVehicles &&
        !loadingCapacity &&
        !noSlotsAvailable;


    return (
        <div
            className="rems-modal-backdrop"
            onMouseDown={(
                event
            ) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    handleClose();

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


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="rems-modal-header">

                    <div>

                        <div className="rems-page-eyebrow">
                            MOTORIST STICKER
                        </div>


                        <h5 className="mb-1 fw-semibold">

                            {isEditing
                                ? "Edit Motorist Sticker"
                                : "Issue Motorist Sticker"}

                        </h5>


                        <div className="rems-modal-subtitle">

                            {isEditing
                                ? "Update the authorized vehicle assignment."
                                : "Register a sticker for an authorized vehicle."}

                        </div>

                    </div>


                    <button
                        type="button"
                        className="rems-modal-close"
                        onClick={
                            handleClose
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


                        {/* =================================================
                            ERROR
                        ================================================= */}

                        {errors.general && (

                            <div className="alert alert-danger rems-alert">

                                <i className="bi bi-exclamation-circle me-2" />

                                {
                                    getErrorText(
                                        "general"
                                    )
                                }

                            </div>

                        )}


                        {/* =================================================
                            ASSIGNMENT
                        ================================================= */}

                        <div className="rems-form-section">

                            <div className="rems-form-section-title">

                                <i className="bi bi-car-front me-2" />

                                Sticker Assignment

                            </div>


                            <div className="row g-3">


                                {/* PROPERTY */}

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
                                            getErrorText(
                                                "property"
                                            )
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        value={
                                            form.property
                                        }
                                        onChange={
                                            handlePropertyChange
                                        }
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


                                    {getErrorText(
                                        "property"
                                    ) && (

                                        <div className="invalid-feedback">

                                            {
                                                getErrorText(
                                                    "property"
                                                )
                                            }

                                        </div>

                                    )}


                                    {form.property && (

                                        <div className="mt-3">

                                            {loadingCapacity ? (

                                                <div className="small text-muted">

                                                    <span
                                                        className="spinner-border spinner-border-sm me-2"
                                                        aria-hidden="true"
                                                    />

                                                    Checking sticker availability...

                                                </div>

                                            ) : capacity ? (

                                                <div className="rems-property-info-card">

                                                    <div className="d-flex justify-content-between align-items-center">

                                                        <div>

                                                            <div className="rems-table-secondary">
                                                                Sticker Capacity
                                                            </div>

                                                            <div className="rems-table-primary">

                                                                {
                                                                    capacity.used
                                                                }

                                                                {" / "}

                                                                {
                                                                    capacity.maximum
                                                                }

                                                                {" "}
                                                                used

                                                            </div>

                                                        </div>


                                                        <div className="text-end">

                                                            <div className="rems-table-secondary">
                                                                Available
                                                            </div>

                                                            <div
                                                                className={
                                                                    Number(
                                                                        capacity.available
                                                                    ) > 0
                                                                        ? "text-success fw-semibold"
                                                                        : "text-danger fw-semibold"
                                                                }
                                                            >

                                                                {
                                                                    capacity.available
                                                                }

                                                            </div>

                                                        </div>

                                                    </div>


                                                    {noSlotsAvailable && (

                                                        <div className="small text-danger mt-2">

                                                            This property has reached
                                                            its maximum of three active
                                                            or pending stickers.

                                                        </div>

                                                    )}

                                                </div>

                                            ) : null}

                                        </div>

                                    )}

                                </div>


                                {/* RESIDENT */}

                                <div className="col-12">

                                    <label className="rems-form-label">

                                        Authorized Resident

                                        <span className="text-danger">
                                            {" "}*
                                        </span>

                                    </label>


                                    <select
                                        name="resident"
                                        className={`form-select rems-form-control ${
                                            getErrorText(
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
                                            !form.property ||
                                            loadingResidents ||
                                            saving
                                        }
                                        required
                                    >

                                        <option value="">

                                            {!form.property
                                                ? "Select a property first"
                                                : loadingResidents
                                                ? "Loading authorized residents..."
                                                : residents.length === 0
                                                ? "No authorized residents"
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
                                                        `${resident.first_name || ""} ${resident.last_name || ""}`.trim() ||
                                                        `Resident #${resident.id}`
                                                    }

                                                    {" — "}

                                                    {
                                                        resident.resident_type_display ||
                                                        resident.resident_type ||
                                                        "Resident"
                                                    }

                                                </option>

                                            )
                                        )}

                                    </select>


                                    {getErrorText(
                                        "resident"
                                    ) && (

                                        <div className="invalid-feedback">

                                            {
                                                getErrorText(
                                                    "resident"
                                                )
                                            }

                                        </div>

                                    )}


                                    {form.property &&
                                        !loadingResidents &&
                                        residents.length === 0 && (

                                            <div className="form-text text-danger">

                                                No active homeowner or tenant
                                                is currently authorized for
                                                this property.

                                            </div>

                                        )}

                                </div>


                                {/* VEHICLE */}

                                <div className="col-12">

                                    <label className="rems-form-label">

                                        Authorized Vehicle

                                        <span className="text-danger">
                                            {" "}*
                                        </span>

                                    </label>


                                    <select
                                        name="vehicle"
                                        className={`form-select rems-form-control ${
                                            getErrorText(
                                                "vehicle"
                                            )
                                                ? "is-invalid"
                                                : ""
                                        }`}
                                        value={
                                            form.vehicle
                                        }
                                        onChange={
                                            handleVehicleChange
                                        }
                                        disabled={
                                            !form.resident ||
                                            loadingVehicles ||
                                            saving
                                        }
                                        required
                                    >

                                        <option value="">

                                            {!form.resident
                                                ? "Select a resident first"
                                                : loadingVehicles
                                                ? "Loading authorized vehicles..."
                                                : vehicles.length === 0
                                                ? "No active vehicles"
                                                : "Select vehicle"}

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


                                    {getErrorText(
                                        "vehicle"
                                    ) && (

                                        <div className="invalid-feedback">

                                            {
                                                getErrorText(
                                                    "vehicle"
                                                )
                                            }

                                        </div>

                                    )}


                                    {form.resident &&
                                        !loadingVehicles &&
                                        vehicles.length === 0 && (

                                            <div className="form-text text-danger">

                                                This resident has no active
                                                vehicle registered to the
                                                selected property.

                                            </div>

                                        )}

                                </div>

                            </div>

                        </div>


                        {/* POLICY */}

                        <div className="alert alert-info rems-alert mb-0">

                            <strong>
                                Sticker policy
                            </strong>

                            <div className="small mt-1">

                                Only residents currently authorized
                                for the selected property can receive
                                a motorist sticker. Each vehicle can
                                have one sticker, and each property
                                can have up to three active or pending
                                stickers.

                            </div>

                        </div>

                    </div>


                    {/* FOOTER */}

                    <div className="rems-modal-footer">

                        <button
                            type="button"
                            className="rems-secondary-button"
                            onClick={
                                handleClose
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
                                !canSubmit
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

                                    {noSlotsAvailable
                                        ? "No Sticker Slots Available"
                                        : isEditing
                                        ? "Save Changes"
                                        : "Issue Sticker"}

                                </>

                            )}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}