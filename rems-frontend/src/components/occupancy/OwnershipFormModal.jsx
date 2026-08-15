import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    BsBuilding,
    BsCheck2,
    BsInfoCircle,
    BsPersonVcard,
    BsX,
} from "react-icons/bs";

import {
    createPropertyOwnership,
    updatePropertyOwnership,
    getProperties,
} from "../../api/properties";

import {
    getHomeowners,
} from "../../api/residents";


/* ============================================================================
   INITIAL FORM
   ============================================================================ */

const initialForm = {

    property:
        "",

    homeowner:
        "",

    start_date:
        "",

    end_date:
        "",

    is_active:
        true,

};


/* ============================================================================
   COMPONENT
   ============================================================================ */

export default function OwnershipFormModal({

    show,

    record,

    onClose,

    onSuccess,

}) {

    /* =========================================================
       FORM STATE
    ========================================================= */

    const [
        form,
        setForm,
    ] = useState(
        initialForm
    );


    /* =========================================================
       OPTIONS STATE
    ========================================================= */

    const [
        properties,
        setProperties,
    ] = useState([]);


    const [
        homeowners,
        setHomeowners,
    ] = useState([]);


    /* =========================================================
       LOADING STATE
    ========================================================= */

    const [
        loadingProperties,
        setLoadingProperties,
    ] = useState(false);


    const [
        loadingHomeowners,
        setLoadingHomeowners,
    ] = useState(false);


    const [
        saving,
        setSaving,
    ] = useState(false);


    /* =========================================================
       ERROR STATE
    ========================================================= */

    const [
        errors,
        setErrors,
    ] = useState({});


    /* =========================================================
       EDITING
    ========================================================= */

    const isEditing =
        Boolean(
            record?.id
        );


    /* =========================================================
       NORMALIZE API RESPONSE
    ========================================================= */

    const normalize = useCallback(
        (
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

        },
        []
    );


    /* =========================================================
       FORMAT API ERROR
    ========================================================= */

    const extractError =
        useCallback(
            (
                error,
                fallback
            ) => {

                const responseData =
                    error?.response?.data;


                if (
                    typeof responseData ===
                    "string"
                ) {

                    return responseData;
                }


                if (
                    responseData?.detail
                ) {

                    return responseData.detail;
                }


                return fallback;

            },
            []
        );


    /* =========================================================
       LOAD PROPERTIES
    ========================================================= */

    const loadProperties =
        useCallback(
            async () => {

                setLoadingProperties(
                    true
                );


                try {

                    /*
                     * IMPORTANT:
                     *
                     * Do not send an is_active filter.
                     *
                     * The working Properties page already
                     * proves that getProperties() returns the
                     * database records correctly.
                     */

                    const response =
                        await getProperties();


                    const propertyData =
                        normalize(
                            response
                        );


                    setProperties(
                        propertyData
                    );


                } catch (
                    error
                ) {

                    console.error(
                        "Ownership modal - properties failed:",
                        error
                    );


                    setProperties(
                        []
                    );


                    setErrors(
                        (
                            previous
                        ) => ({

                            ...previous,

                            propertyLoad:
                                extractError(
                                    error,
                                    "Unable to load property records.",
                                ),

                        })
                    );

                } finally {

                    setLoadingProperties(
                        false
                    );
                }

            },
            [
                normalize,
                extractError,
            ]
        );


    /* =========================================================
       LOAD HOMEOWNERS
    ========================================================= */

    const loadHomeowners =
        useCallback(
            async () => {

                setLoadingHomeowners(
                    true
                );


                try {

                    /*
                     * This uses the corrected residents.js:
                     *
                     * GET
                     * /api/residents/residents/homeowners/
                     */

                    const response =
                        await getHomeowners();


                    const homeownerData =
                        normalize(
                            response
                        );


                    /*
                     * Only active resident profiles
                     * should normally be assignable.
                     *
                     * The current edited homeowner is
                     * retained below when necessary.
                     */

                    let availableHomeowners =
                        homeownerData.filter(
                            (
                                homeowner
                            ) =>
                                homeowner?.is_active !==
                                false
                        );


                    if (
                        record?.homeowner
                    ) {

                        const existingHomeowner =
                            homeownerData.find(
                                (
                                    homeowner
                                ) =>
                                    String(
                                        homeowner?.user_id ||
                                        homeowner?.user ||
                                        homeowner?.id
                                    ) ===
                                    String(
                                        record.homeowner
                                    )
                            );


                        if (
                            existingHomeowner &&
                            !availableHomeowners.some(
                                (
                                    homeowner
                                ) =>
                                    String(
                                        homeowner?.user_id ||
                                        homeowner?.user ||
                                        homeowner?.id
                                    ) ===
                                    String(
                                        record.homeowner
                                    )
                            )
                        ) {

                            availableHomeowners = [

                                existingHomeowner,

                                ...availableHomeowners,

                            ];

                        }

                    }


                    setHomeowners(
                        availableHomeowners
                    );


                } catch (
                    error
                ) {

                    console.error(
                        "Ownership modal - homeowners failed:",
                        error
                    );


                    setHomeowners(
                        []
                    );


                    setErrors(
                        (
                            previous
                        ) => ({

                            ...previous,

                            homeownerLoad:
                                extractError(
                                    error,
                                    "Unable to load homeowner records.",
                                ),

                        })
                    );

                } finally {

                    setLoadingHomeowners(
                        false
                    );
                }

            },
            [
                normalize,
                extractError,
                record,
            ]
        );


    /* =========================================================
       INITIALIZE FORM
    ========================================================= */

    useEffect(
        () => {

            if (
                !show
            ) {

                return;
            }


            setErrors({});


            if (
                record
            ) {

                setForm({

                    property:
                        record.property
                            ? String(
                                record.property
                            )
                            : "",

                    homeowner:
                        record.homeowner
                            ? String(
                                record.homeowner
                            )
                            : "",

                    start_date:
                        record.start_date ||
                        "",

                    end_date:
                        record.end_date ||
                        "",

                    is_active:
                        record.is_active !==
                        false,

                });

            } else {

                setForm({

                    ...initialForm,

                    start_date:
                        new Date()
                            .toISOString()
                            .split(
                                "T"
                            )[0],

                });

            }


            /*
             * Load both independently.
             *
             * This is intentional.
             * A homeowner endpoint failure will not
             * erase successfully loaded properties.
             */

            loadProperties();

            loadHomeowners();

        },
        [
            show,
            record,
            loadProperties,
            loadHomeowners,
        ]
    );


    /* =========================================================
       DERIVED LOADING
    ========================================================= */

    const loadingOptions =
        loadingProperties ||
        loadingHomeowners;


    /* =========================================================
       PROPERTY DISPLAY
    ========================================================= */

    const propertyOptions =
        useMemo(
            () => {

                return properties.map(
                    (
                        property
                    ) => ({

                        ...property,

                        optionLabel:
                            property?.address ||
                            [
                                property?.subdivision,
                                property?.block
                                    ? `Block ${property.block}`
                                    : null,
                                property?.lot
                                    ? `Lot ${property.lot}`
                                    : null,
                            ]
                            .filter(
                                Boolean
                            )
                            .join(
                                " • "
                            ) ||
                            `Property #${property?.id}`,

                    })
                );

            },
            [
                properties,
            ]
        );


    /* =========================================================
       HOMEOWNER DISPLAY
    ========================================================= */

    const homeownerOptions =
        useMemo(
            () => {

                return homeowners.map(
                    (
                        homeowner
                    ) => {

                        const userId =
                            homeowner?.user_id ||
                            homeowner?.user ||
                            homeowner?.id;


                        const fullName =
                            homeowner?.full_name ||
                            [
                                homeowner?.first_name,
                                homeowner?.middle_name,
                                homeowner?.last_name,
                            ]
                            .filter(
                                Boolean
                            )
                            .join(
                                " "
                            );


                        const label =
                            fullName ||
                            homeowner?.username ||
                            `Resident #${homeowner?.id}`;


                        return {

                            ...homeowner,

                            userId,

                            optionLabel:
                                homeowner?.username
                                    ? `${label} — @${homeowner.username}`
                                    : label,

                        };

                    }
                );

            },
            [
                homeowners,
            ]
        );


    /* =========================================================
       HANDLE INPUT
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
                    type ===
                    "checkbox"
                        ? checked
                        : value,

            })
        );


        setErrors(
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
       ERROR MESSAGE
    ========================================================= */

    const getFieldError = (
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


        if (
            typeof value ===
            "string"
        ) {

            return value;
        }


        return "";

    };


    /* =========================================================
       SUBMIT
    ========================================================= */

    const handleSubmit =
        async (
            event
        ) => {

            event.preventDefault();


            if (
                !form.property ||
                !form.homeowner
            ) {

                setErrors({

                    property:
                        !form.property
                            ? "Please select a property."
                            : undefined,

                    homeowner:
                        !form.homeowner
                            ? "Please select a homeowner."
                            : undefined,

                });

                return;
            }


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

                    homeowner:
                        Number(
                            form.homeowner
                        ),

                    start_date:
                        form.start_date,

                    /*
                     * Active ownership records must
                     * not contain an end date.
                     */

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

                        ? await updatePropertyOwnership(
                            record.id,
                            payload
                        )

                        : await createPropertyOwnership(
                            payload
                        );


                if (
                    onSuccess
                ) {

                    await onSuccess(
                        response
                    );
                }


            } catch (
                error
            ) {

                console.error(
                    "Ownership save failed:",
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
                            extractError(
                                error,
                                "Unable to save ownership record.",
                            ),

                    });

                }

            } finally {

                setSaving(
                    false
                );
            }

        };


    /* =========================================================
       CLOSED
    ========================================================= */

    if (
        !show
    ) {

        return null;
    }


    /* =========================================================
       RENDER
    ========================================================= */

    return (

        <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ownershipModalTitle"
            style={{

                background:
                    "rgba(15, 23, 42, 0.42)",

                backdropFilter:
                    "blur(4px)",

                WebkitBackdropFilter:
                    "blur(4px)",

            }}
        >

            <div
                className="modal-dialog modal-dialog-centered modal-dialog-scrollable rems-management-modal"
                role="document"
            >

                <div className="modal-content rems-modal">


                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div className="rems-modal-header">

                        <div>

                            <div className="rems-modal-icon">

                                <BsPersonVcard />

                            </div>


                            <h5
                                id="ownershipModalTitle"
                                className="rems-modal-title mb-0"
                            >

                                {isEditing
                                    ? "Edit Ownership"
                                    : "Assign Homeowner"}

                            </h5>


                            <div className="rems-modal-subtitle">

                                {isEditing
                                    ? "Update the property's ownership record."
                                    : "Assign a homeowner to a registered property."}

                            </div>

                        </div>


                        <button
                            type="button"
                            className="btn border-0 p-1 text-secondary"
                            onClick={
                                onClose
                            }
                            disabled={
                                saving
                            }
                            aria-label="Close"
                            style={{
                                fontSize:
                                    "1.2rem",
                                lineHeight:
                                    1,
                            }}
                        >

                            <BsX />

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


                            {/* =================================================
                                GENERAL ERROR
                            ================================================= */}

                            {errors.general && (

                                <div
                                    className="alert alert-danger rems-alert mb-3"
                                    role="alert"
                                >

                                    <div className="d-flex align-items-start gap-2">

                                        <i className="bi bi-exclamation-circle mt-1" />

                                        <span>

                                            {
                                                getFieldError(
                                                    "general"
                                                ) ||
                                                errors.general
                                            }

                                        </span>

                                    </div>

                                </div>

                            )}


                            {/* =================================================
                                DATA LOAD ERRORS
                            ================================================= */}

                            {errors.propertyLoad && (

                                <div
                                    className="alert alert-warning rems-alert mb-3"
                                    role="alert"
                                >

                                    <div className="d-flex align-items-start gap-2">

                                        <BsBuilding />

                                        <span>

                                            {
                                                errors.propertyLoad
                                            }

                                        </span>

                                    </div>

                                </div>

                            )}


                            {errors.homeownerLoad && (

                                <div
                                    className="alert alert-warning rems-alert mb-3"
                                    role="alert"
                                >

                                    <div className="d-flex align-items-start gap-2">

                                        <BsPersonVcard />

                                        <span>

                                            {
                                                errors.homeownerLoad
                                            }

                                        </span>

                                    </div>

                                </div>

                            )}


                            {/* =================================================
                                OWNERSHIP SECTION
                            ================================================= */}

                            <div className="rems-form-section">

                                <div className="rems-form-section-title">

                                    <BsPersonVcard className="me-2" />

                                    Ownership Record

                                </div>


                                <div className="row g-3">


                                    {/* =================================================
                                        PROPERTY
                                    ================================================= */}

                                    <div className="col-12">

                                        <label
                                            htmlFor="ownershipProperty"
                                            className="rems-form-label"
                                        >

                                            Property

                                            <span className="text-danger">
                                                {" "}*
                                            </span>

                                        </label>


                                        <select
                                            id="ownershipProperty"
                                            name="property"
                                            className={`form-select rems-form-control ${
                                                getFieldError(
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
                                                loadingProperties ||
                                                saving
                                            }
                                            required
                                        >

                                            <option value="">

                                                {loadingProperties
                                                    ? "Loading properties..."
                                                    : propertyOptions.length ===
                                                      0
                                                    ? "No property records found"
                                                    : "Select property"}

                                            </option>


                                            {propertyOptions.map(
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
                                                            property.optionLabel
                                                        }


                                                        {property?.status_display
                                                            ? ` — ${property.status_display}`
                                                            : ""}

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


                                    {/* =================================================
                                        HOMEOWNER
                                    ================================================= */}

                                    <div className="col-12">

                                        <label
                                            htmlFor="ownershipHomeowner"
                                            className="rems-form-label"
                                        >

                                            Homeowner

                                            <span className="text-danger">
                                                {" "}*
                                            </span>

                                        </label>


                                        <select
                                            id="ownershipHomeowner"
                                            name="homeowner"
                                            className={`form-select rems-form-control ${
                                                getFieldError(
                                                    "homeowner"
                                                )
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
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
                                                    : homeownerOptions.length ===
                                                      0
                                                    ? "No homeowner records found"
                                                    : "Select homeowner"}

                                            </option>


                                            {homeownerOptions.map(
                                                (
                                                    homeowner
                                                ) => (

                                                    <option
                                                        key={
                                                            homeowner.userId
                                                        }
                                                        value={
                                                            homeowner.userId
                                                        }
                                                    >

                                                        {
                                                            homeowner.optionLabel
                                                        }

                                                    </option>

                                                )
                                            )}

                                        </select>


                                        {getFieldError(
                                            "homeowner"
                                        ) && (

                                            <div className="invalid-feedback">

                                                {
                                                    getFieldError(
                                                        "homeowner"
                                                    )
                                                }

                                            </div>

                                        )}

                                    </div>


                                    {/* =================================================
                                        DATES
                                    ================================================= */}

                                    <div className="col-12 col-md-6">

                                        <label
                                            htmlFor="ownershipStartDate"
                                            className="rems-form-label"
                                        >

                                            Start Date

                                            <span className="text-danger">
                                                {" "}*
                                            </span>

                                        </label>


                                        <input
                                            id="ownershipStartDate"
                                            type="date"
                                            name="start_date"
                                            className={`form-control rems-form-control ${
                                                getFieldError(
                                                    "start_date"
                                                )
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
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


                                        {getFieldError(
                                            "start_date"
                                        ) && (

                                            <div className="invalid-feedback">

                                                {
                                                    getFieldError(
                                                        "start_date"
                                                    )
                                                }

                                            </div>

                                        )}

                                    </div>


                                    <div className="col-12 col-md-6">

                                        <label
                                            htmlFor="ownershipEndDate"
                                            className="rems-form-label"
                                        >

                                            End Date

                                        </label>


                                        <input
                                            id="ownershipEndDate"
                                            type="date"
                                            name="end_date"
                                            className={`form-control rems-form-control ${
                                                getFieldError(
                                                    "end_date"
                                                )
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
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


                                        {getFieldError(
                                            "end_date"
                                        ) && (

                                            <div className="invalid-feedback">

                                                {
                                                    getFieldError(
                                                        "end_date"
                                                    )
                                                }

                                            </div>

                                        )}


                                        {form.is_active && (

                                            <div
                                                className="mt-1"
                                                style={{
                                                    color:
                                                        "#929baa",
                                                    fontSize:
                                                        "0.64rem",
                                                }}
                                            >

                                                Active ownership has no
                                                end date.

                                            </div>

                                        )}

                                    </div>


                                    {/* =================================================
                                        ACTIVE OWNERSHIP
                                    ================================================= */}

                                    <div className="col-12">

                                        <div
                                            className="d-flex align-items-center justify-content-between gap-3"
                                            style={{
                                                padding:
                                                    "11px 12px",

                                                border:
                                                    "1px solid rgba(148, 163, 184, 0.12)",

                                                borderRadius:
                                                    "10px",

                                                background:
                                                    "rgba(248, 250, 252, 0.55)",
                                            }}
                                        >

                                            <div>

                                                <div
                                                    style={{
                                                        color:
                                                            "#394556",
                                                        fontSize:
                                                            "0.75rem",
                                                        fontWeight:
                                                            650,
                                                    }}
                                                >

                                                    Active ownership

                                                </div>


                                                <div
                                                    style={{
                                                        marginTop:
                                                            "2px",
                                                        color:
                                                            "#969fac",
                                                        fontSize:
                                                            "0.62rem",
                                                    }}
                                                >

                                                    A property can have only
                                                    one active ownership record.

                                                </div>

                                            </div>


                                            <div className="form-check form-switch mb-0">

                                                <input
                                                    id="ownership-active-admin"
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
                                                    htmlFor="ownership-active-admin"
                                                    className="visually-hidden"
                                                >

                                                    Active ownership

                                                </label>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>


                            {/* =================================================
                                INFORMATION
                            ================================================= */}

                            <div
                                className="d-flex align-items-start gap-2 mt-3"
                                style={{
                                    padding:
                                        "11px 12px",

                                    border:
                                        "1px solid rgba(37, 99, 235, 0.10)",

                                    borderRadius:
                                        "10px",

                                    background:
                                        "rgba(37, 99, 235, 0.035)",

                                    color:
                                        "#6f7b8b",

                                    fontSize:
                                        "0.64rem",

                                    lineHeight:
                                        1.55,
                                }}
                            >

                                <BsInfoCircle
                                    className="mt-1 flex-shrink-0"
                                />


                                <div>

                                    <strong>
                                        Ownership history is preserved.
                                    </strong>


                                    <div className="mt-1">

                                        The backend prevents multiple
                                        active ownership records for
                                        the same property.

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            FOOTER
                        ================================================= */}

                        <div className="rems-modal-footer d-flex justify-content-end gap-2">

                            <button
                                type="button"
                                className="rems-btn"
                                onClick={
                                    onClose
                                }
                                disabled={
                                    saving
                                }
                                style={{
                                    color:
                                        "#5f6b7c",

                                    background:
                                        "rgba(15, 23, 42, 0.05)",
                                }}
                            >

                                Cancel

                            </button>


                            <button
                                type="submit"
                                className="rems-btn rems-btn-primary"
                                disabled={
                                    saving ||
                                    loadingOptions ||
                                    !form.property ||
                                    !form.homeowner ||
                                    !form.start_date
                                }
                            >

                                {saving ? (

                                    <>

                                        <span
                                            className="spinner-border spinner-border-sm"
                                            role="status"
                                            aria-hidden="true"
                                        />

                                        Saving...

                                    </>

                                ) : (

                                    <>

                                        <BsCheck2 />

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

        </div>
    );
}