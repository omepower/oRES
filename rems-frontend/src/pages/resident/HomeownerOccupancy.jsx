
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsBuilding,
    BsPersonCheck,
} from "react-icons/bs";

import {
    getMyProperties,
    getPropertyOccupancyHistory,
} from "../../api/properties";


export default function HomeownerOccupancy() {

    const [
        properties,
        setProperties,
    ] = useState([]);

    const [
        selectedProperty,
        setSelectedProperty,
    ] = useState(null);

    const [
        occupancy,
        setOccupancy,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        loadingHistory,
        setLoadingHistory,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);


    const loadProperties = useCallback(
        async (
            refresh = false
        ) => {

            if (refresh) {
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

                setProperties(data);

                setSelectedProperty(
                    (current) => {

                        if (!current) {
                            return data[0] || null;
                        }

                        return (
                            data.find(
                                (item) =>
                                    item.id ===
                                    current.id
                            ) ||
                            data[0] ||
                            null
                        );

                    }
                );

            } catch (err) {

                console.error(
                    "[Homeowner Occupancy] Properties failed:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to load your properties."
                );

            } finally {

                setLoading(false);
                setRefreshing(false);

            }

        },
        []
    );


    const loadOccupancyHistory =
        useCallback(
            async (
                propertyId
            ) => {

                if (!propertyId) {
                    setOccupancy([]);
                    return;
                }

                setLoadingHistory(true);

                try {

                    const response =
                        await getPropertyOccupancyHistory(
                            propertyId
                        );

                    const data =
                        Array.isArray(response)
                            ? response
                            : response?.results ||
                              response?.occupancies ||
                              [];

                    setOccupancy(data);

                } catch (err) {

                    console.error(
                        "[Homeowner Occupancy] History failed:",
                        err
                    );

                    setOccupancy([]);

                    setError(
                        err?.response?.data?.detail ||
                        "Unable to load occupancy history."
                    );

                } finally {

                    setLoadingHistory(false);

                }

            },
            []
        );


    useEffect(() => {

        loadProperties();

    }, [
        loadProperties,
    ]);


    useEffect(() => {

        loadOccupancyHistory(
            selectedProperty?.id
        );

    }, [
        selectedProperty,
        loadOccupancyHistory,
    ]);


    const activeOccupancy =
        occupancy.find(
            (record) =>
                record.is_active
        ) || null;


    const getOccupancyLabel = (
        record
    ) => {

        return (
            record?.occupancy_type_display ||
            record?.occupancy_type ||
            "Occupancy"
        );

    };


    const getOccupancyClass = (
        record
    ) => {

        if (!record?.is_active) {
            return "rems-status-secondary";
        }

        if (
            record.occupancy_type ===
            "TENANT"
        ) {
            return "rems-status-info";
        }

        return "rems-status-success";

    };


    return (

        <div className="rems-page-content">


            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">
                        HOMEOWNER PORTAL
                    </div>

                    <h1 className="rems-page-title">
                        Occupancy
                    </h1>

                    <p className="rems-page-description">
                        View the current occupant and occupancy
                        history of your properties.
                    </p>

                </div>


                <div className="rems-page-header-actions">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() =>
                            loadProperties(true)
                        }
                        disabled={refreshing}
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


            {error && (

                <div className="alert alert-danger rems-alert mb-4">

                    <i className="bi bi-exclamation-circle me-2" />

                    {error}

                    <button
                        type="button"
                        className="btn-close float-end"
                        onClick={() =>
                            setError("")
                        }
                    />

                </div>

            )}


            {loading ? (

                <div className="rems-glass-card">

                    <div className="rems-loading-state">

                        <div
                            className="spinner-border"
                            role="status"
                        />

                        <div className="mt-3">
                            Loading occupancy information...
                        </div>

                    </div>

                </div>

            ) : properties.length === 0 ? (

                <div className="rems-glass-card">

                    <div className="rems-empty-state">

                        <div className="rems-empty-icon">
                            <BsBuilding />
                        </div>

                        <div className="rems-empty-title">
                            No properties found
                        </div>

                        <div className="rems-empty-text">
                            Occupancy information is unavailable
                            because no property is currently associated
                            with your account.
                        </div>

                    </div>

                </div>

            ) : (

                <div className="row g-4">


                    {/* =================================================
                        PROPERTY SELECTOR
                    ================================================= */}

                    <div className="col-12 col-xl-4">

                        <div className="rems-glass-card h-100">

                            <div className="rems-card-header">

                                <div>

                                    <div className="rems-page-eyebrow">
                                        MY PROPERTIES
                                    </div>

                                    <div className="rems-card-title">
                                        Select Property
                                    </div>

                                </div>

                            </div>


                            <div className="p-3">

                                <div className="d-flex flex-column gap-2">

                                    {properties.map(
                                        (property) => (

                                            <button
                                                key={property.id}
                                                type="button"
                                                className="w-100 text-start border-0 bg-transparent p-0"
                                                onClick={() =>
                                                    setSelectedProperty(
                                                        property
                                                    )
                                                }
                                            >

                                                <div
                                                    className="rems-action-card"
                                                    style={{
                                                        cursor:
                                                            "pointer",
                                                        background:
                                                            selectedProperty?.id ===
                                                            property.id
                                                                ? "rgba(37,99,235,.055)"
                                                                : undefined,
                                                        border:
                                                            selectedProperty?.id ===
                                                            property.id
                                                                ? "1px solid rgba(37,99,235,.22)"
                                                                : undefined,
                                                    }}
                                                >

                                                    <div className="rems-action-icon">
                                                        <BsBuilding />
                                                    </div>


                                                    <div className="flex-grow-1">

                                                        <div className="fw-semibold">

                                                            {
                                                                property.address ||
                                                                `Property #${property.id}`
                                                            }

                                                        </div>

                                                        <div className="small text-muted mt-1">

                                                            Block{" "}
                                                            {
                                                                property.block ||
                                                                "—"
                                                            }

                                                            {" · Lot "}

                                                            {
                                                                property.lot ||
                                                                "—"
                                                            }

                                                        </div>

                                                    </div>

                                                </div>

                                            </button>

                                        )
                                    )}

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        OCCUPANCY DETAILS
                    ================================================= */}

                    <div className="col-12 col-xl-8">

                        <div className="rems-glass-card h-100">

                            <div className="rems-card-header">

                                <div>

                                    <div className="rems-page-eyebrow">
                                        CURRENT OCCUPANCY
                                    </div>

                                    <div className="rems-card-title">

                                        {
                                            selectedProperty?.address ||
                                            "Property"
                                        }

                                    </div>

                                </div>

                            </div>


                            <div className="rems-card-body">


                                {loadingHistory ? (

                                    <div className="rems-loading-state">

                                        <div
                                            className="spinner-border"
                                            role="status"
                                        />

                                        <div className="mt-3">
                                            Loading occupancy history...
                                        </div>

                                    </div>

                                ) : (

                                    <>


                                        {/* CURRENT OCCUPANT */}

                                        <div className="rems-form-section">

                                            <div className="rems-form-section-title">

                                                <i className="bi bi-person-check me-2" />

                                                Current Occupant

                                            </div>


                                            {activeOccupancy ? (

                                                <div className="rems-property-person-card">

                                                    <div className="rems-property-detail-icon">

                                                        <BsPersonCheck />

                                                    </div>


                                                    <div className="flex-grow-1">

                                                        <div className="rems-table-primary">

                                                            {
                                                                activeOccupancy.resident_name ||
                                                                activeOccupancy.resident_full_name ||
                                                                "Current Occupant"
                                                            }

                                                        </div>

                                                        <div className="rems-table-secondary">

                                                            {
                                                                getOccupancyLabel(
                                                                    activeOccupancy
                                                                )
                                                            }

                                                            {" · "}

                                                            Since{" "}

                                                            {
                                                                activeOccupancy.start_date ||
                                                                "—"
                                                            }

                                                        </div>

                                                    </div>


                                                    <span
                                                        className={`rems-status-badge ${
                                                            getOccupancyClass(
                                                                activeOccupancy
                                                            )
                                                        }`}
                                                    >

                                                        <span className="rems-status-dot" />

                                                        Active

                                                    </span>

                                                </div>

                                            ) : (

                                                <div className="rems-empty-state py-4">

                                                    <BsPersonCheck
                                                        size={30}
                                                    />

                                                    <div className="mt-2 fw-semibold">
                                                        No active occupant
                                                    </div>

                                                    <div className="small text-muted">
                                                        This property is currently vacant.
                                                    </div>

                                                </div>

                                            )}

                                        </div>


                                        {/* HISTORY */}

                                        <div className="rems-form-section">

                                            <div className="rems-form-section-title">

                                                <i className="bi bi-clock-history me-2" />

                                                Occupancy History

                                            </div>


                                            {occupancy.length === 0 ? (

                                                <div className="small text-muted">

                                                    No occupancy history is available
                                                    for this property.

                                                </div>

                                            ) : (

                                                <div className="table-responsive">

                                                    <table className="table rems-table align-middle mb-0">

                                                        <thead>

                                                            <tr>

                                                                <th>
                                                                    Resident
                                                                </th>

                                                                <th>
                                                                    Type
                                                                </th>

                                                                <th>
                                                                    Start
                                                                </th>

                                                                <th>
                                                                    End
                                                                </th>

                                                                <th>
                                                                    Status
                                                                </th>

                                                            </tr>

                                                        </thead>


                                                        <tbody>

                                                            {occupancy.map(
                                                                (
                                                                    record
                                                                ) => (

                                                                    <tr
                                                                        key={
                                                                            record.id
                                                                        }
                                                                    >

                                                                        <td>

                                                                            <div className="rems-table-primary">

                                                                                {
                                                                                    record.resident_name ||
                                                                                    record.resident_full_name ||
                                                                                    "Resident"
                                                                                }

                                                                            </div>

                                                                        </td>


                                                                        <td>

                                                                            {
                                                                                getOccupancyLabel(
                                                                                    record
                                                                                )
                                                                            }

                                                                        </td>


                                                                        <td>

                                                                            {
                                                                                record.start_date ||
                                                                                "—"
                                                                            }

                                                                        </td>


                                                                        <td>

                                                                            {
                                                                                record.end_date ||
                                                                                "Present"
                                                                            }

                                                                        </td>


                                                                        <td>

                                                                            <span
                                                                                className={`rems-status-badge ${
                                                                                    record.is_active
                                                                                        ? "rems-status-success"
                                                                                        : "rems-status-secondary"
                                                                                }`}
                                                                            >

                                                                                <span className="rems-status-dot" />

                                                                                {
                                                                                    record.is_active
                                                                                        ? "Active"
                                                                                        : "Ended"
                                                                                }

                                                                            </span>

                                                                        </td>

                                                                    </tr>

                                                                )
                                                            )}

                                                        </tbody>

                                                    </table>

                                                </div>

                                            )}

                                        </div>


                                        <div className="alert alert-info rems-alert mb-0">

                                            <i className="bi bi-shield-check me-2" />

                                            Occupancy records are managed by
                                            administration. This portal provides
                                            read-only visibility.

                                        </div>

                                    </>

                                )}

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}
