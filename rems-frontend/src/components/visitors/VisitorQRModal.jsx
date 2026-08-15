
import {
    QRCodeCanvas,
} from "qrcode.react";


export default function VisitorQrModal({
    show,
    invitation,
    qrValue,
    onClose,
}) {

    if (
        !show ||
        !invitation
    ) {
        return null;
    }


    const visitorName =
        invitation.visitor_name ||
        "Visitor";


    const hostName =
        invitation.host_name ||
        invitation.host_name_snapshot ||
        "Resident";


    const propertyAddress =
        invitation.property_address ||
        invitation.host_address_snapshot ||
        "Property";


    const visitDate =
        invitation.visit_date ||
        "";


    const timeIn =
        invitation.expected_time_in ||
        "";


    const timeOut =
        invitation.expected_time_out ||
        "";


    const code =
        qrValue ||
        invitation.invitation_code ||
        "";


    return (

        <div
            className="rems-modal-backdrop"
            style={{
                zIndex: 3000,
            }}
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
                className="rems-modal rems-qr-modal"
                style={{
                    position: "relative",
                    zIndex: 3001,
                    width: "min(100%, 520px)",
                }}
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="rems-modal-header">

                    <div>

                        <div className="rems-modal-icon">

                            <i className="bi bi-qr-code" />

                        </div>


                        <div className="rems-modal-title">

                            Visitor QR Code

                        </div>


                        <div className="rems-modal-subtitle">

                            This QR code is associated with
                            the visitor invitation.

                        </div>

                    </div>


                    <button
                        type="button"
                        className="rems-modal-close"
                        onClick={
                            onClose
                        }
                        aria-label="Close"
                    >

                        <i className="bi bi-x-lg" />

                    </button>

                </div>


                {/* =================================================
                    BODY
                ================================================= */}

                <div className="rems-modal-body">


                    {/* QR */}

                    <div className="rems-qr-container">

                        <div className="rems-qr-code">

                            <QRCodeCanvas
                                value={
                                    code
                                }
                                size={220}
                                level="H"
                                includeMargin={true}
                            />

                        </div>


                        <div className="rems-qr-label">

                            Present this QR code
                            at the gate.

                        </div>

                    </div>


                    {/* DETAILS */}

                    <div className="rems-qr-details">


                        <div className="rems-qr-detail-row">

                            <span>
                                Visitor
                            </span>

                            <strong>
                                {
                                    visitorName
                                }
                            </strong>

                        </div>


                        <div className="rems-qr-detail-row">

                            <span>
                                Host
                            </span>

                            <strong>
                                {
                                    hostName
                                }
                            </strong>

                        </div>


                        <div className="rems-qr-detail-row">

                            <span>
                                Property
                            </span>

                            <strong>
                                {
                                    propertyAddress
                                }
                            </strong>

                        </div>


                        <div className="rems-qr-detail-row">

                            <span>
                                Visit Date
                            </span>

                            <strong>
                                {
                                    visitDate
                                }
                            </strong>

                        </div>


                        <div className="rems-qr-detail-row">

                            <span>
                                Time
                            </span>

                            <strong>

                                {
                                    timeIn
                                }

                                {" — "}

                                {
                                    timeOut
                                }

                            </strong>

                        </div>


                    </div>


                    {/* INVITATION CODE */}

                    <div className="rems-qr-code-value">

                        <span>
                            Invitation Code
                        </span>

                        <strong>
                            {
                                code ||
                                "Unavailable"
                            }
                        </strong>

                    </div>

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


                    <button
                        type="button"
                        className="rems-primary-button"
                        onClick={() =>
                            window.print()
                        }
                    >

                        <i className="bi bi-printer" />

                        Print

                    </button>

                </div>

            </div>

        </div>
    );
}
