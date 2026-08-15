
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsBuilding,
    BsChevronRight,
    BsHouseCheck,
    BsPersonCheck,
    BsShieldCheck,
} from "react-icons/bs";

import {
    getMyProperties,
} from "../../api/properties";

import {
    getCurrentPropertyOwner,
    getCurrentPropertyOccupant,
} from "../../api/properties";


// ============================================================
// HOMEOWNER PROPERTIES
// Read-only resident property view
// ============================================================

export default function HomeownerProperties() {

    /* =========================================================
       STATE
    ========================================================= */

    const [
        properties,
        setProperties,
    ] = useState([]);


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        refreshing,
        setRefreshing,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState("");


    const [
        expandedPropertyId,
        setExpandedPropertyId,
    ] = useState(null);


    const [
        propertyDetails,
        setPropertyDetails,
    ] = useState({});


    const [
        loadingDetailsId,
        setLoadingDetailsId,
    ] = useState(null);


    /* =========================================================
       LOAD PROPERTIES
    ========================================================= */

    const loadProperties = useCallback(
        async (
            isRefresh = false
        ) => {

            if (isRefresh) {

                setRefreshing(
                    true
                );

            } else {

                setLoading(
                    true
                );

            }


            setError("");


            try {

                const response =
                    await getMyProperties();


                const data =
                    Array.isArray(
                        response
                    )
                        ? response
                        : response?.results ||
                          response?.properties ||
                          [];


                setProperties(
                    data
                );


            } catch (err) {

                console.error(
                    "[Homeowner Properties] Failed to load properties:",
                    err
                );


                setError(
                    err?.response?.data?.detail ||
                    "Unable to load your properties."
                );


                setProperties(
                    []
                );

            } finally {

                setLoading(
                    false
                );

                setRefreshing(
                    false
                );

            }

        },
        []
    );


    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    useEffect(() => {

        loadProperties();

    }, [
        loadProperties,
    ]);


    /* =========================================================
       STATISTICS
    ========================================================= */

    const statistics =
        useMemo(
            () => {

                const occupied =
                    properties.filter(
                        (
                            property
                        ) =>
                            [
                                "OWNER_OCCUPIED",
                                "TENANT_OCCUPIED",
                            ].includes(
                                String(
                                    property?.status ||
                                    ""
                                ).toUpperCase()
                            )
                    ).length;


                const vacant =
                    properties.filter(
                        (
                            property
                        ) =>
                            String(
                                property?.status ||
                                ""
                            ).toUpperCase() ===
                            "VACANT"
                    ).length;


                const active =
                    properties.filter(
                        (
                            property
                        ) =>
                            property?.is_active !== false
                    ).length;


                return {

                    total:
                        properties.length,

                    occupied,

                    vacant,

                    active,

                };

            },
            [
                properties,
            ]
        );


    /* =========================================================
       STATUS HELPERS
    ========================================================= */

    const getStatusClass = (
        status
    ) => {

        switch (
            String(
                status ||
                ""
            ).toUpperCase()
        ) {

            case "OWNER_OCCUPIED":
                return "rems-status-success";

            case "TENANT_OCCUPIED":
                return "rems-status-info";

            case "VACANT":
                return "rems-status-secondary";

            default:
                return "rems-status-secondary";

        }

    };


    const getStatusLabel = (
        property
    ) => {

        if (
            property?.status_display
        ) {

            return property.status_display;

        }


        switch (
            String(
                property?.status ||
                ""
            ).toUpperCase()
        ) {

            case "OWNER_OCCUPIED":
                return "Owner Occupied";

            case "TENANT_OCCUPIED":
                return "Tenant Occupied";

            case "VACANT":
                return "Vacant";

            default:
                return "Unknown";

        }

    };


    /* =========================================================
       PROPERTY DETAILS
    ========================================================= */

    const loadPropertyDetails = async (
        property
    ) => {

        if (
            !property?.id
        ) {
            return;
        }


        if (
            expandedPropertyId ===
            property.id
        ) {

            setExpandedPropertyId(
                null
            );

            return;

        }


        setExpandedPropertyId(
            property.id
        );


        if (
            propertyDetails[property.id]
        ) {
            return;
        }


        setLoadingDetailsId(
            property.id
        );


        try {

            const [
                owner,
                occupant,
            ] = await Promise.allSettled([

                getCurrentPropertyOwner(
                    property.id
                ),

                getCurrentPropertyOccupant(
                    property.id
                ),

            ]);


            setPropertyDetails(
                (
                    previous
                ) => ({

                    ...previous,

                    [property.id]: {

                        owner:
                            owner.status ===
                            "fulfilled"
                                ? owner.value
                                : null,

                        occupant:
                            occupant.status ===
                            "fulfilled"
                                ? occupant.value
                                : null,

                    },

                })
            );

        } catch (err) {

            console.error(
                "[Homeowner Properties] Failed to load property details:",
                err
            );

        } finally {

            setLoadingDetailsId(
                null
            );

        }

    };


    /* =========================================================
       LOADING
    ========================================================= */

    if (
        loading
    ) {

        return (

            <div className="rems-page-content">

                <div className="rems-page-header">

                    <div>

                        <div className="rems-page-eyebrow">
                            HOMEOWNER
                        </div>

                        <h1 className="rems-page-title">
                            My Properties
                        </h1>

                        <p className="rems-page-description">
                            View properties currently registered
                            under your ownership.
                        </p>

                    </div>

                </div>


                <div className="rems-loading-state">

                    <div
                        className="spinner-border"
                        role="status"
                    />

                    <div className="mt-3">
                        Loading your properties...
                    </div>

                </div>

            </div>

        );

    }


    /* =========================================================
       RENDER
    ========================================================= */

    return (

        <div className="rems-page-content">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">
                        HOMEOWNER
                    </div>

                    <h1 className="rems-page-title">
                        My Properties
                    </h1>

                    <p className="rems-page-description">
                        View your owned properties, current
                        occupancy status, and residence information.
                    </p>

                </div>


                <div className="rems-page-header-actions">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() =>
                            loadProperties(
                                true
                            )
                        }
                        disabled={
                            refreshing
                        }
                    >

                        <BsArrowClockwise />

                        {
                            refreshing
                                ? "Refreshing..."
                                : "Refresh"
                        }

                    </button>

                </div>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div
                    className="alert alert-danger rems-alert mb-4"
                    role="alert"
                >

                    <i className="bi bi-exclamation-circle me-2" />

                    {
                        error
                    }

                </div>

            )}


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="row g-3 mb-4">


                {/* TOTAL */}

                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <BsBuilding />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                My Properties
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.total
                                }
                            </div>

                        </div>

                    </div>

                </div>


                {/* ACTIVE */}

                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <BsShieldCheck />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Active Records
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.active
                                }
                            </div>

                        </div>

                    </div>

                </div>


                {/* OCCUPIED */}

                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <BsHouseCheck />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Occupied
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.occupied
                                }
                            </div>

                        </div>

                    </div>

                </div>


                {/* VACANT */}

                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <BsPersonCheck />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Vacant
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.vacant
                                }
                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                PROPERTY REGISTRY
            ================================================= */}

            <div className="rems-glass-card">


                {/* CARD HEADER */}

                <div className="rems-card-header">

                    <div>

                        <div className="rems-card-title">
                            Property Registry
                        </div>

                        <div className="rems-card-subtitle">
                            Properties currently associated with
                            your homeowner account.
                        </div>

                    </div>


                    <div className="small text-muted">

                        {
                            properties.length
                        }{" "}

                        {
                            properties.length ===
                            1
                                ? "property"
                                : "properties"
                        }

                    </div>

                </div>


                {/* EMPTY */}

                {properties.length === 0 ? (

                    <div className="rems-empty-state">

                        <div className="rems-empty-icon">

                            <BsBuilding />

                        </div>

                        <div className="rems-empty-title">

                            No properties found

                        </div>

                        <p className="rems-empty-text">

                            No active property ownership
                            records are currently associated
                            with your account.

                        </p>

                    </div>

                ) : (

                    <div className="table-responsive">

                        <table className="table rems-table align-middle mb-0">

                            <thead>

                                <tr>

                                    <th>
                                        Property
                                    </th>

                                    <th>
                                        Block
                                    </th>

                                    <th>
                                        Lot
                                    </th>

                                    <th>
                                        Address
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Record
                                    </th>

                                    <th className="text-end">
                                        Details
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {properties.map(
                                    (
                                        property
                                    ) => {

                                        const details =
                                            propertyDetails[
                                                property.id
                                            ];


                                        return (

                                            <tr
                                                key={
                                                    property.id
                                                }
                                            >

                                                <td>

                                                    <div className="rems-table-primary">

                                                        {
                                                            property.subdivision ||
                                                            "Main Subdivision"
                                                        }

                                                    </div>


                                                    <div className="rems-table-secondary">

                                                        {
                                                            property.house_number
                                                                ? `House ${property.house_number}`
                                                                : "Property"
                                                        }

                                                    </div>

                                                </td>


                                                <td>

                                                    {
                                                        property.block ||
                                                        "—"
                                                    }

                                                </td>


                                                <td>

                                                    {
                                                        property.lot ||
                                                        "—"
                                                    }

                                                </td>


                                                <td>

                                                    <div className="rems-table-primary">

                                                        {
                                                            property.address ||
                                                            "—"
                                                        }

                                                    </div>


                                                    {property.street && (

                                                        <div className="rems-table-secondary">

                                                            {
                                                                property.street
                                                            }

                                                        </div>

                                                    )}

                                                </td>


                                                <td>

                                                    <span
                                                        className={`rems-status-badge ${
                                                            getStatusClass(
                                                                property.status
                                                            )
                                                        }`}
                                                    >

                                                        <span className="rems-status-dot" />

                                                        {
                                                            getStatusLabel(
                                                                property
                                                            )
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    <span
                                                        className={`rems-status-badge ${
                                                            property.is_active !== false
                                                                ? "rems-status-success"
                                                                : "rems-status-danger"
                                                        }`}
                                                    >

                                                        <span className="rems-status-dot" />

                                                        {
                                                            property.is_active !== false
                                                                ? "Active"
                                                                : "Inactive"
                                                        }

                                                    </span>

                                                </td>


                                                <td className="text-end">

                                                    <button
                                                        type="button"
                                                        className="rems-secondary-button"
                                                        onClick={() =>
                                                            loadPropertyDetails(
                                                                property
                                                            )
                                                        }
                                                        disabled={
                                                            loadingDetailsId ===
                                                            property.id
                                                        }
                                                    >

                                                        {loadingDetailsId ===
                                                        property.id ? (

                                                            <>
                                                                <span
                                                                    className="spinner-border spinner-border-sm"
                                                                    aria-hidden="true"
                                                                />

                                                                Loading...
                                                            </>

                                                        ) : (

                                                            <>
                                                                View

                                                                <BsChevronRight />

                                                            </>

                                                        )}

                                                    </button>

                                                </td>

                                            </tr>

                                        );

                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                )}


                {/* =================================================
                    EXPANDED PROPERTY DETAILS
                ================================================= */}

                {expandedPropertyId && (

                    <div
                        className="p-3 border-top"
                        style={{
                            borderColor:
                                "var(--rems-border-soft)",
                        }}
                    >

                        {(() => {

                            const property =
                                properties.find(
                                    (
                                        item
                                    ) =>
                                        item.id ===
                                        expandedPropertyId
                                );


                            if (!property) {
                                return null;
                            }


                            const details =
                                propertyDetails[
                                    property.id
                                ];


                            return (

                                <div className="rems-form-section">

                                    <div className="d-flex align-items-start justify-content-between gap-3 mb-3">

                                        <div>

                                            <div className="rems-page-eyebrow">
                                                PROPERTY DETAILS
                                            </div>

                                            <div className="rems-card-title">
                                                {
                                                    property.address ||
                                                    "Property"
                                                }
                                            </div>

                                        </div>


                                        <button
                                            type="button"
                                            className="rems-icon-button"
                                            onClick={() =>
                                                setExpandedPropertyId(
                                                    null
                                                )
                                            }
                                            title="Close details"
                                        >

                                            <i className="bi bi-x-lg" />

                                        </button>

                                    </div>


                                    <div className="row g-3">


                                        {/* OWNERSHIP */}

                                        <div className="col-12 col-lg-6">

                                            <div className="rems-property-info-card">

                                                <div className="rems-property-detail-icon">

                                                    <BsPersonCheck />

                                                </div>


                                                <div>

                                                    <div className="rems-table-secondary">
                                                        Current Owner
                                                    </div>

                                                    <div className="rems-table-primary">

                                                        {
                                                            details?.owner?.homeowner_name ||
                                                            details?.owner?.homeowner_username ||
                                                            "Current ownership information unavailable"
                                                        }

                                                    </div>

                                                </div>

                                            </div>

                                        </div>


                                        {/* OCCUPANCY */}

                                        <div className="col-12 col-lg-6">

                                            <div className="rems-property-info-card">

                                                <div className="rems-property-detail-icon">

                                                    <BsHouseCheck />

                                                </div>


                                                <div>

                                                    <div className="rems-table-secondary">
                                                        Current Occupancy
                                                    </div>

                                                    <div className="rems-table-primary">

                                                        {
                                                            details?.occupant?.resident_name ||
                                                            details?.occupant?.resident_username ||
                                                            "No active occupant"
                                                        }

                                                    </div>

                                                </div>

                                            </div>

                                        </div>


                                        {/* SUBDIVISION */}

                                        <div className="col-12 col-md-4">

                                            <div className="rems-property-info-card">

                                                <div>

                                                    <div className="rems-table-secondary">
                                                        Subdivision
                                                    </div>

                                                    <div className="rems-table-primary">

                                                        {
                                                            property.subdivision ||
                                                            "—"
                                                        }

                                                    </div>

                                                </div>

                                            </div>

                                        </div>


                                        {/* BLOCK */}

                                        <div className="col-12 col-md-4">

                                            <div className="rems-property-info-card">

                                                <div>

                                                    <div className="rems-table-secondary">
                                                        Block
                                                    </div>

                                                    <div className="rems-table-primary">

                                                        {
                                                            property.block ||
                                                            "—"
                                                        }

                                                    </div>

                                                </div>

                                            </div>

                                        </div>


                                        {/* LOT */}

                                        <div className="col-12 col-md-4">

                                            <div className="rems-property-info-card">

                                                <div>

                                                    <div className="rems-table-secondary">
                                                        Lot
                                                    </div>

                                                    <div className="rems-table-primary">

                                                        {
                                                            property.lot ||
                                                            "—"
                                                        }

                                                    </div>

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            );

                        })()}

                    </div>

                )}

            </div>

        </div>
    );
}
