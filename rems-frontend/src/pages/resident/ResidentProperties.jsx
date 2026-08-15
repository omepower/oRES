
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsBuilding,
    BsHouseCheck,
    BsPersonCheck,
    BsChevronRight,
} from "react-icons/bs";

import {
    getMyProperties,
} from "../../api/properties";


export default function ResidentProperties() {

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
        selectedProperty,
        setSelectedProperty,
    ] = useState(null);


    const user = useMemo(() => {

        try {

            const stored =
                localStorage.getItem(
                    "user"
                );

            return stored
                ? JSON.parse(stored)
                : null;

        } catch {

            return null;
        }

    }, []);


    const role =
        String(
            user?.role || ""
        ).toUpperCase();


    const isHomeowner =
        role === "HOMEOWNER";


    const loadProperties =
        useCallback(
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
                        "[Resident Properties] Failed to load:",
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


    useEffect(() => {

        loadProperties();

    }, [
        loadProperties,
    ]);


    const statistics =
        useMemo(() => {

            return {

                total:
                    properties.length,

                active:
                    properties.filter(
                        (property) =>
                            property.is_active !== false
                    ).length,

                occupied:
                    properties.filter(
                        (property) =>
                            [
                                "OWNER_OCCUPIED",
                                "TENANT_OCCUPIED",
                            ].includes(
                                property.status
                            )
                    ).length,

            };

        }, [
            properties,
        ]);


    const propertyStatusClass = (
        status
    ) => {

        switch (status) {

            case "OWNER_OCCUPIED":
            case "TENANT_OCCUPIED":
                return "rems-status-success";

            case "VACANT":
                return "rems-status-warning";

            default:
                return "rems-status-secondary";

        }
    };


    return (

        <div className="rems-page-content">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">
                        RESIDENT PORTAL
                    </div>

                    <h1 className="rems-page-title">

                        {
                            isHomeowner
                                ? "My Properties"
                                : "My Property"
                        }

                    </h1>

                    <p className="rems-page-description">

                        {
                            isHomeowner
                                ? "View the properties currently associated with your ownership."
                                : "View your current residence and property information."
                        }

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


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="alert alert-danger rems-alert mb-4">

                    <i className="bi bi-exclamation-circle me-2" />

                    {error}

                </div>

            )}


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="row g-3 mb-4">


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">
                            <BsBuilding />
                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                {
                                    isHomeowner
                                        ? "My Properties"
                                        : "My Property"
                                }
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.total
                                }
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">
                            <BsHouseCheck />
                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Active
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.active
                                }
                            </div>

                        </div>

                    </div>

                </div>


                {isHomeowner && (

                    <div className="col-12 col-sm-6 col-xl-3">

                        <div className="rems-stat-card">

                            <div className="rems-stat-icon">
                                <BsPersonCheck />
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

                )}

            </div>


            {/* =================================================
                PROPERTY LIST / DETAIL
            ================================================= */}

            {loading ? (

                <div className="rems-glass-card">

                    <div className="rems-loading-state">

                        <div
                            className="spinner-border"
                            role="status"
                        />

                        <div className="mt-3">
                            Loading property information...
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
                            No property records found
                        </div>

                        <p className="rems-empty-text">
                            No active property is currently associated
                            with your resident account.
                        </p>

                    </div>

                </div>

            ) : (

                <div className="row g-4">


                    {/* PROPERTY LIST */}

                    <div className="col-12 col-xl-5">

                        <div className="rems-glass-card h-100">

                            <div className="rems-card-header">

                                <div>

                                    <div className="rems-page-eyebrow">
                                        PROPERTY PORTFOLIO
                                    </div>

                                    <div className="rems-card-title">
                                        {
                                            isHomeowner
                                                ? "Associated Properties"
                                                : "Current Residence"
                                        }
                                    </div>

                                </div>

                            </div>


                            <div className="p-3">

                                <div className="d-flex flex-column gap-2">

                                    {properties.map(
                                        (property) => (

                                            <button
                                                key={
                                                    property.id
                                                }
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
                                                        border:
                                                            selectedProperty?.id === property.id
                                                                ? "1px solid rgba(37,99,235,.22)"
                                                                : undefined,
                                                        background:
                                                            selectedProperty?.id === property.id
                                                                ? "rgba(37,99,235,.055)"
                                                                : undefined,
                                                    }}
                                                >

                                                    <div className="rems-action-icon">

                                                        <BsBuilding />

                                                    </div>


                                                    <div className="flex-grow-1 min-width-0">

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


                                                    <BsChevronRight />

                                                </div>

                                            </button>

                                        )
                                    )}

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* PROPERTY DETAILS */}

                    <div className="col-12 col-xl-7">

                        <div className="rems-glass-card h-100">

                            <div className="rems-card-header">

                                <div>

                                    <div className="rems-page-eyebrow">
                                        PROPERTY DETAILS
                                    </div>

                                    <div className="rems-card-title">
                                        {
                                            selectedProperty?.address ||
                                            "Property"
                                        }
                                    </div>

                                </div>


                                {selectedProperty?.status && (

                                    <span
                                        className={`rems-status-badge ${
                                            propertyStatusClass(
                                                selectedProperty.status
                                            )
                                        }`}
                                    >

                                        <span className="rems-status-dot" />

                                        {
                                            selectedProperty.status_display ||
                                            selectedProperty.status.replace(
                                                /_/g,
                                                " "
                                            )
                                        }

                                    </span>

                                )}

                            </div>


                            <div className="rems-card-body">

                                <div className="row g-3">


                                    <div className="col-12 col-md-6">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Subdivision
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        selectedProperty?.subdivision ||
                                                        "—"
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12 col-md-3">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Block
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        selectedProperty?.block ||
                                                        "—"
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12 col-md-3">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Lot
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        selectedProperty?.lot ||
                                                        "—"
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Address
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        selectedProperty?.address ||
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
                                                    House Number
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        selectedProperty?.house_number ||
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
                                                    Street
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        selectedProperty?.street ||
                                                        "—"
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12">

                                        <div className="alert alert-info rems-alert mb-0">

                                            <i className="bi bi-shield-check me-2" />

                                            Property information is read-only
                                            in the resident portal. Property
                                            ownership and occupancy are managed
                                            by administration.

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}
