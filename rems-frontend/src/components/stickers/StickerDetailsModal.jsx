import {
    useEffect,
    useState,
} from "react";

import {
    getMotoristSticker,
} from "../../api/vehicles";


const getStatusLabel = (
    status
) => {

    switch (status) {

        case "PENDING":
            return "Pending";

        case "ACTIVE":
            return "Active";

        case "REVOKED":
            return "Revoked";

        case "EXPIRED":
            return "Expired";

        default:
            return status || "—";
    }
};


const getStatusClass = (
    status
) => {

    switch (status) {

        case "PENDING":
            return "rems-status-warning";

        case "ACTIVE":
            return "rems-status-success";

        case "REVOKED":
            return "rems-status-danger";

        case "EXPIRED":
            return "rems-status-secondary";

        default:
            return "rems-status-secondary";
    }
};


export default function StickerDetailsModal({
    show,
    sticker,
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
            !sticker?.id
        ) {
            return;
        }

        loadDetails();

    }, [
        show,
        sticker,
    ]);


    const loadDetails = async () => {

        setLoading(true);
        setError("");

        try {

            const response =
                await getMotoristSticker(
                    sticker.id
                );

            setDetails(
                response
            );

        } catch (err) {

            console.error(
                "Unable to load sticker details:",
                err
            );

            setDetails(
                sticker
            );

            setError(
                "Unable to refresh the sticker record. Showing available data."
            );

        } finally {

            setLoading(false);
        }
    };


    if (
        !show ||
        !sticker
    ) {
        return null;
    }


    const current =
        details || sticker;


    const property =
        current.property_address ||
        "—";


    const resident =
        current.resident_name ||
        current.registered_resident_name ||
        "—";


    const vehicle =
        current.vehicle_display ||
        current.vehicle_description ||
        "—";


    const plate =
        current.plate_number ||
        current.vehicle_plate_number ||
        "—";


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
                            MOTORIST STICKER
                        </div>

                        <h5 className="mb-1 fw-semibold">

                            {
                                current.sticker_number ||
                                "Sticker Record"
                            }

                        </h5>

                        <div className="rems-modal-subtitle">

                            {
                                plate
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
                                Loading sticker details...
                            </div>

                        </div>

                    ) : (

                        <>

                            <div className="rems-form-section">

                                <div className="rems-form-section-title">

                                    <i className="bi bi-shield-check me-2" />

                                    Sticker Information

                                </div>


                                <div className="row g-3">


                                    <div className="col-12 col-md-6">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Sticker Number
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        current.sticker_number ||
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
                                                    Status
                                                </div>

                                                <div className="mt-1">

                                                    <span
                                                        className={`rems-status-badge ${
                                                            getStatusClass(
                                                                current.status
                                                            )
                                                        }`}
                                                    >

                                                        <span className="rems-status-dot" />

                                                        {
                                                            current.status_display ||
                                                            getStatusLabel(
                                                                current.status
                                                            )
                                                        }

                                                    </span>

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Sticker UUID
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        current.sticker_uuid ||
                                                        "—"
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>


                            <div className="rems-form-section">

                                <div className="rems-form-section-title">

                                    <i className="bi bi-car-front me-2" />

                                    Vehicle

                                </div>


                                <div className="row g-3">


                                    <div className="col-12 col-md-6">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Vehicle
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        vehicle
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12 col-md-6">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Plate Number
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        plate
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>


                            <div className="rems-form-section">

                                <div className="rems-form-section-title">

                                    <i className="bi bi-house me-2" />

                                    Assignment

                                </div>


                                <div className="row g-3">


                                    <div className="col-12 col-md-6">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Property
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        property
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-12 col-md-6">

                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Resident
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        resident
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </>

                    )}

                </div>


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