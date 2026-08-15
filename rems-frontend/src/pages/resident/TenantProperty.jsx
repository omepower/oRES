
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsBuilding,
    BsHouseCheck,
    BsPersonCheck,
    BsShieldCheck,
} from "react-icons/bs";

import {
    getMyProperties,
    getCurrentPropertyOwner,
    getCurrentPropertyOccupant,
} from "../../api/properties";


// ============================================================
// TENANT PROPERTY
// Read-only current residence view
// ============================================================

export default function TenantProperty() {

    /* =========================================================
       STATE
    ========================================================= */

    const [
        property,
        setProperty,
    ] = useState(null);


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
        owner,
        setOwner,
    ] = useState(null);


    const [
        occupant,
        setOccupant,
    ] = useState(null);


    const [
        loadingDetails,
        setLoadingDetails,
    ] = useState(false);


    /* =========================================================
       LOAD CURRENT PROPERTY
    ========================================================= */

    const loadProperty = useCallback(
        async (
            isRefresh = false
        ) => {

            if (isRefresh) {

                setRefreshing(true);

            } else {

                setLoading(true);

            }

            setError("");


            try {

                const response =
                    await getMyProperties();


                const data =
                    Array.isArray(response)
                        ? response
                        : response?.results ||
                          response?.properties ||
                          [];


                const currentProperty =
                    data[0] || null;


                setProperty(
                    currentProperty
                );


                /*
                 * No active property is a valid state.
                 * Do not treat it as a system failure.
                 */

                if (!currentProperty) {

                    setOwner(null);
                    setOccupant(null);

                    return;

                }


                setLoadingDetails(true);


                const [
                    ownerResult,
                    occupantResult,
                ] = await Promise.allSettled([

                    getCurrentPropertyOwner(
                        currentProperty.id
                    ),

                    getCurrentPropertyOccupant(
                        currentProperty.id
                    ),

                ]);


                setOwner(
                    ownerResult.status ===
                    "fulfilled"
                        ? ownerResult.value
                        : null
                );


                setOccupant(
                    occupantResult.status ===
                    "fulfilled"
                        ? occupantResult.value
                        : null
                );


            } catch (err) {

                console.error(
                    "[Tenant Property] Failed to load property:",
                    err
                );


                setError(
                    err?.response?.data?.detail ||
                    "Unable to load your current property."
                );


                setProperty(null);
                setOwner(null);
                setOccupant(null);

            } finally {

                setLoadingDetails(false);
                setLoading(false);
                setRefreshing(false);

            }

        },
        []
    );


    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    useEffect(() => {

        loadProperty();

    }, [
        loadProperty,
    ]);


    /* =========================================================
       STATUS HELPERS
    ========================================================= */

    const normalizedStatus =
        String(
            property?.status || ""
        )
            .trim()
            .toUpperCase();


    const statusClass =
        normalizedStatus ===
        "TENANT_OCCUPIED"

            ? "rems-status-info"

            : normalizedStatus ===
              "OWNER_OCCUPIED"

                ? "rems-status-success"

                : "rems-status-secondary";


    const statusLabel =
        property?.status_display ||

        (
            normalizedStatus ===
            "TENANT_OCCUPIED"
                ? "Tenant Occupied"
                : normalizedStatus ===
                  "OWNER_OCCUPIED"
                    ? "Owner Occupied"
                    : normalizedStatus ===
                      "VACANT"
                        ? "Vacant"
                        : "Unknown"
        );


    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {

        return (

            <div className="rems-page-content">

                <div className="rems-page-header">

                    <div>

                        <div className="rems-page-eyebrow">
                            TENANT
                        </div>

                        <h1 className="rems-page-title">
                            My Property
                        </h1>

                        <p className="rems-page-description">
                            View your current residence and
                            occupancy information.
                        </p>

                    </div>

                </div>


                <div className="rems-loading-state">

                    <div
                        className="spinner-border"
                        role="status"
                    />

                    <div className="mt-3">
                        Loading your property...
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
                        TENANT
                    </div>

                    <h1 className="rems-page-title">
                        My Property
                    </h1>

                    <p className="rems-page-description">
                        View your current residence, property
                        status, and occupancy information.
                    </p>

                </div>


                <div className="rems-page-header-actions">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() =>
                            loadProperty(true)
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

                    {error}

                </div>

            )}


            {/* =================================================
                NO PROPERTY
            ================================================= */}

            {!property ? (

                <div className="rems-glass-card">

                    <div className="rems-empty-state">

                        <div className="rems-empty-icon">

                            <BsBuilding />

                        </div>

                        <div className="rems-empty-title">

                            No Current Property

                        </div>

                        <p className="rems-empty-text">

                            Your account does not currently have
                            an active property occupancy record.
                            Please contact the administration office
                            if you believe this is incorrect.

                        </p>

                    </div>

                </div>

            ) : (

                <>

                    {/* =================================================
                        PROPERTY HERO
                    ================================================= */}

                    <div className="rems-glass-card mb-4">

                        <div className="rems-card-header">

                            <div>

                                <div className="rems-page-eyebrow">
                                    CURRENT RESIDENCE
                                </div>

                                <div className="rems-card-title">
                                    {
                                        property.address ||
                                        "Current Property"
                                    }
                                </div>

                                <div className="rems-card-subtitle">
                                    {
                                        property.subdivision ||
                                        "Main Subdivision"
                                    }
                                </div>

                            </div>


                            <span
                                className={`rems-status-badge ${statusClass}`}
                            >

                                <span className="rems-status-dot" />

                                {
                                    statusLabel
                                }

                            </span>

                        </div>


                        <div className="p-3">

                            <div className="row g-3">

                                <div className="col-12 col-md-4">

                                    <div className="rems-property-info-card">

                                        <div className="rems-property-detail-icon">

                                            <BsBuilding />

                                        </div>

                                        <div>

                                            <div className="rems-table-secondary">
                                                Property
                                            </div>

                                            <div className="rems-table-primary">
                                                {
                                                    property.house_number
                                                        ? `House ${property.house_number}`
                                                        : "Residential Property"
                                                }
                                            </div>

                                        </div>

                                    </div>

                                </div>


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


                                <div className="col-12">

                                    <div className="rems-property-info-card">

                                        <div className="rems-property-detail-icon">

                                            <BsHouseCheck />

                                        </div>

                                        <div>

                                            <div className="rems-table-secondary">
                                                Complete Address
                                            </div>

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

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        RESIDENCY INFORMATION
                    ================================================= */}

                    <div className="rems-glass-card">

                        <div className="rems-card-header">

                            <div>

                                <div className="rems-page-eyebrow">
                                    RESIDENCY
                                </div>

                                <div className="rems-card-title">
                                    Occupancy Information
                                </div>

                                <div className="rems-card-subtitle">
                                    Current ownership and occupancy
                                    records associated with this property.
                                </div>

                            </div>

                        </div>


                        <div className="p-3">

                            {loadingDetails ? (

                                <div className="rems-loading-state">

                                    <div
                                        className="spinner-border spinner-border-sm"
                                        role="status"
                                    />

                                    <div className="mt-2">
                                        Loading residency information...
                                    </div>

                                </div>

                            ) : (

                                <div className="row g-3">


                                    {/* CURRENT OWNER */}

                                    <div className="col-12 col-lg-6">

                                        <div className="rems-form-section">

                                            <div className="rems-form-section-title">

                                                <BsPersonCheck className="me-2" />

                                                Property Owner

                                            </div>


                                            <div className="rems-property-person-card">

                                                <div className="rems-property-detail-icon">

                                                    <BsPersonCheck />

                                                </div>


                                                <div>

                                                    <div className="rems-table-secondary">
                                                        Current Homeowner
                                                    </div>

                                                    <div className="rems-table-primary">

                                                        {
                                                            owner?.homeowner_name ||
                                                            owner?.homeowner_username ||
                                                            "Ownership information unavailable"
                                                        }

                                                    </div>

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    {/* CURRENT OCCUPANT */}

                                    <div className="col-12 col-lg-6">

                                        <div className="rems-form-section">

                                            <div className="rems-form-section-title">

                                                <BsHouseCheck className="me-2" />

                                                Current Occupancy

                                            </div>


                                            <div className="rems-property-person-card">

                                                <div className="rems-property-detail-icon">

                                                    <BsHouseCheck />

                                                </div>


                                                <div>

                                                    <div className="rems-table-secondary">
                                                        Occupant
                                                    </div>

                                                    <div className="rems-table-primary">

                                                        {
                                                            occupant?.resident_name ||
                                                            occupant?.resident_username ||
                                                            "No active occupant"
                                                        }

                                                    </div>


                                                    {occupant?.occupancy_type_display && (

                                                        <div className="rems-table-secondary">

                                                            {
                                                                occupant.occupancy_type_display
                                                            }

                                                        </div>

                                                    )}

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    {/* PROPERTY STATUS */}

                                    <div className="col-12">

                                        <div className="rems-form-section">

                                            <div className="rems-form-section-title">

                                                <BsShieldCheck className="me-2" />

                                                Property Access Status

                                            </div>


                                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">

                                                <div>

                                                    <div className="rems-table-secondary">
                                                        Current Property Status
                                                    </div>

                                                    <div className="mt-1">

                                                        <span
                                                            className={`rems-status-badge ${statusClass}`}
                                                        >

                                                            <span className="rems-status-dot" />

                                                            {
                                                                statusLabel
                                                            }

                                                        </span>

                                                    </div>

                                                </div>


                                                <div className="small text-muted">

                                                    Property status is managed
                                                    automatically from current
                                                    occupancy records.

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            )}

                        </div>

                    </div>

                </>

            )}

        </div>
    );
}
