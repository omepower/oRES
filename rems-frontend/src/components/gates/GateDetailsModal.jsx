import {
    useEffect,
    useState,
} from "react";

import {
    getGate,
} from "../../api/security";


const getGateTypeLabel = (
    value
) => {

    switch (value) {

        case "MAIN_ENTRANCE":
            return "Main Entrance";

        case "SECONDARY":
            return "Secondary Gate";

        case "SERVICE":
            return "Service Gate";

        case "EMERGENCY":
            return "Emergency Gate";

        default:
            return value || "—";
    }
};


export default function GateDetailsModal({
    show,
    gate,
    onClose,
}) {

    const [
        details,
        setDetails,
    ] = useState(null);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");


    useEffect(() => {

        if (
            !show ||
            !gate?.id
        ) {
            return;
        }

        loadDetails();

    }, [
        show,
        gate,
    ]);


    const loadDetails = async () => {

        setLoading(true);
        setError("");

        try {

            const response =
                await getGate(
                    gate.id
                );

            setDetails(
                response
            );

        } catch (err) {

            console.error(
                "Unable to load gate details:",
                err
            );

            setDetails(
                gate
            );

            setError(
                "Unable to refresh the gate record. Showing available data."
            );

        } finally {

            setLoading(false);
        }
    };


    if (
        !show ||
        !gate
    ) {
        return null;
    }


    const current =
        details || gate;


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

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="rems-modal-header">

                    <div>

                        <div className="rems-page-eyebrow">
                            GATE DETAILS
                        </div>

                        <h5 className="mb-1 fw-semibold">

                            {
                                current.name
                            }

                        </h5>

                        <div className="rems-modal-subtitle">

                            {
                                current.location ||
                                "No location specified"
                            }

                        </div>

                    </div>


                    <button
                        type="button"
                        className="rems-modal-close"
                        onClick={
                            onClose
                        }
                    >

                        <i className="bi bi-x-lg" />

                    </button>

                </div>


                {/* =================================================
                    BODY
                ================================================= */}

                <div className="rems-modal-body">

                    {error && (

                        <div className="alert alert-warning rems-alert">

                            <i className="bi bi-exclamation-triangle me-2" />

                            {
                                error
                            }

                        </div>

                    )}


                    {loading ? (

                        <div className="rems-loading-state">

                            <div
                                className="spinner-border"
                                role="status"
                            />

                            <div className="mt-3">
                                Loading gate details...
                            </div>

                        </div>

                    ) : (

                        <div className="rems-form-section">

                            <div className="rems-form-section-title">

                                <i className="bi bi-door-open me-2" />

                                Gate Information

                            </div>


                            <div className="row g-3">


                                <div className="col-12 col-md-6">

                                    <div className="rems-property-info-card">

                                        <div>

                                            <div className="rems-table-secondary">
                                                Gate Name
                                            </div>

                                            <div className="rems-table-primary">

                                                {
                                                    current.name
                                                }

                                            </div>

                                        </div>

                                    </div>

                                </div>


                                <div className="col-12 col-md-6">

                                    <div className="rems-property-info-card">

                                        <div>

                                            <div className="rems-table-secondary">
                                                Gate Type
                                            </div>

                                            <div className="rems-table-primary">

                                                {
                                                    current.gate_type_display ||
                                                    getGateTypeLabel(
                                                        current.gate_type
                                                    )
                                                }

                                            </div>

                                        </div>

                                    </div>

                                </div>


                                <div className="col-12">

                                    <div className="rems-property-info-card">

                                        <div>

                                            <div className="rems-table-secondary">
                                                Location
                                            </div>

                                            <div className="rems-table-primary">

                                                {
                                                    current.location ||
                                                    "No location specified"
                                                }

                                            </div>

                                        </div>

                                    </div>

                                </div>


                                <div className="col-12 col-md-6">

                                    <div className="rems-property-info-card">

                                        <div>

                                            <div className="rems-table-secondary">
                                                Designation
                                            </div>

                                            <div className="mt-1">

                                                {current.is_primary ? (

                                                    <span className="rems-status-badge rems-status-success">

                                                        <span className="rems-status-dot" />

                                                        Primary Gate

                                                    </span>

                                                ) : (

                                                    <span className="rems-badge rems-badge-neutral">

                                                        Standard Gate

                                                    </span>

                                                )}

                                            </div>

                                        </div>

                                    </div>

                                </div>


                                <div className="col-12 col-md-6">

                                    <div className="rems-property-info-card">

                                        <div>

                                            <div className="rems-table-secondary">
                                                Operational Status
                                            </div>

                                            <div className="mt-1">

                                                <span
                                                    className={`rems-status-badge ${
                                                        current.is_active
                                                            ? "rems-status-success"
                                                            : "rems-status-danger"
                                                    }`}
                                                >

                                                    <span className="rems-status-dot" />

                                                    {current.is_active
                                                        ? "Active"
                                                        : "Inactive"}

                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    )}

                </div>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="rems-modal-footer">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={
                            onClose
                        }
                    >

                        Close

                    </button>

                </div>

            </div>

        </div>
    );
}