
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    BsCheckCircle,
    BsExclamationCircle,
    BsQrCodeScan,
    BsShieldCheck,
    BsXCircle,
} from "react-icons/bs";

import {
    Html5Qrcode,
} from "html5-qrcode";

import {
    getSecurityGates,
    scanVisitorQr,
} from "../../api/security";


export default function VisitorScanner() {

    const scannerRef =
        useRef(null);

    const startingRef =
        useRef(false);


    const [
        gates,
        setGates,
    ] = useState([]);


    const [
        selectedGate,
        setSelectedGate,
    ] = useState("");


    const [
        scanning,
        setScanning,
    ] = useState(false);


    const [
        processing,
        setProcessing,
    ] = useState(false);


    const [
        result,
        setResult,
    ] = useState(null);


    const [
        error,
        setError,
    ] = useState("");


    const [
        loadingGates,
        setLoadingGates,
    ] = useState(true);


    // ========================================================
    // LOAD GATES
    // ========================================================

    useEffect(() => {

        const loadGates =
            async () => {

                setLoadingGates(true);
                setError("");

                try {

                    const response =
                        await getSecurityGates();


                    const gateData =
                        Array.isArray(response)
                            ? response
                            : response?.results ||
                              response?.gates ||
                              [];


                    setGates(
                        gateData
                    );


                    const primaryGate =
                        gateData.find(
                            (gate) =>
                                gate?.is_primary ===
                                true
                        ) ||
                        gateData[0];


                    if (
                        primaryGate?.id
                    ) {

                        setSelectedGate(
                            String(
                                primaryGate.id
                            )
                        );

                    }

                } catch (err) {

                    console.error(
                        "[Security Scanner] Gate loading failed:",
                        err
                    );


                    setError(
                        err?.response?.data?.detail ||
                        "Unable to load active gates."
                    );

                } finally {

                    setLoadingGates(false);

                }

            };


        loadGates();

    }, []);


    // ========================================================
    // STOP SCANNER
    // ========================================================

    const stopScanner =
        useCallback(
            async () => {

                if (
                    scannerRef.current
                ) {

                    try {

                        const state =
                            scannerRef.current
                                .getState?.();


                        if (
                            state ===
                            2
                        ) {

                            await scannerRef.current.stop();

                        } else {

                            try {

                                await scannerRef.current.stop();

                            } catch {
                                // Already stopped.
                            }

                        }

                    } catch {
                        // Scanner already stopped.
                    }


                    try {

                        await scannerRef.current.clear();

                    } catch {
                        // Container may already be cleared.
                    }


                    scannerRef.current =
                        null;

                }


                startingRef.current =
                    false;


                setScanning(false);

            },
            []
        );


    // ========================================================
    // PROCESS SCANNED QR
    // ========================================================

    const handleScan =
        useCallback(
            async (
                decodedText
            ) => {

                if (
                    processing ||
                    startingRef.current
                ) {
                    return;
                }


                if (
                    !selectedGate
                ) {

                    setError(
                        "Please select a gate before scanning."
                    );

                    return;

                }


                startingRef.current =
                    true;


                setProcessing(true);
                setError("");
                setResult(null);


                await stopScanner();


                try {

                    const response =
                        await scanVisitorQr(
                            decodedText,
                            selectedGate
                        );


                    setResult(
                        response
                    );

                } catch (err) {

                    console.error(
                        "[Security Scanner] QR validation failed:",
                        err
                    );


                    const data =
                        err?.response?.data;


                    setError(
                        data?.reason ||
                        data?.detail ||
                        "Unable to validate the visitor QR code."
                    );

                } finally {

                    setProcessing(false);

                    startingRef.current =
                        false;

                }

            },
            [
                processing,
                selectedGate,
                stopScanner,
            ]
        );


    // ========================================================
    // START CAMERA AFTER CONTAINER HAS RENDERED
    // ========================================================

    useEffect(() => {

        if (
            !scanning ||
            processing ||
            result
        ) {

            return;

        }


        let cancelled =
            false;


        const start =
            async () => {

                try {

                    // Give React one render cycle to
                    // mount #security-visitor-qr-reader.

                    await new Promise(
                        (
                            resolve
                        ) =>
                            requestAnimationFrame(
                                () =>
                                    resolve()
                            )
                    );


                    if (
                        cancelled
                    ) {
                        return;
                    }


                    const element =
                        document.getElementById(
                            "security-visitor-qr-reader"
                        );


                    if (
                        !element
                    ) {

                        setScanning(false);

                        setError(
                            "Unable to initialize the QR scanner."
                        );

                        return;

                    }


                    if (
                        scannerRef.current
                    ) {

                        return;

                    }


                    const scanner =
                        new Html5Qrcode(
                            "security-visitor-qr-reader"
                        );


                    scannerRef.current =
                        scanner;


                    await scanner.start(

                        {
                            facingMode:
                                "environment",
                        },

                        {
                            fps:
                                10,

                            qrbox:
                                {
                                    width:
                                        250,

                                    height:
                                        250,
                                },

                            aspectRatio:
                                1.0,

                        },

                        (
                            decodedText
                        ) => {

                            handleScan(
                                decodedText
                            );

                        },

                        () => {
                            // Ignore frame scan failures.
                        }

                    );

                } catch (err) {

                    if (
                        cancelled
                    ) {
                        return;
                    }


                    console.error(
                        "[Security Scanner] Camera error:",
                        err
                    );


                    setScanning(false);


                    setError(
                        err?.message ||
                        "Unable to access the camera. Please allow camera access and try again."
                    );

                }

            };


        start();


        return () => {

            cancelled = true;

        };

    }, [
        scanning,
        processing,
        result,
        handleScan,
    ]);


    // ========================================================
    // CLEANUP ON UNMOUNT
    // ========================================================

    useEffect(() => {

        return () => {

            if (
                scannerRef.current
            ) {

                scannerRef.current
                    .stop()
                    .catch(() => {});

            }

        };

    }, []);


    // ========================================================
    // START SCANNING
    // ========================================================

    const startScanner =
        () => {

            setError("");
            setResult(null);


            if (
                !selectedGate
            ) {

                setError(
                    "Please select a gate before starting the scanner."
                );

                return;

            }


            setScanning(true);

        };


    // ========================================================
    // RESET
    // ========================================================

    const resetScanner =
        async () => {

            await stopScanner();

            setResult(null);
            setError("");

        };


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div className="rems-page-content">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">
                        SECURITY OPERATIONS
                    </div>

                    <h1 className="rems-page-title">
                        Scan Visitor QR
                    </h1>

                    <p className="rems-page-description">
                        Verify the visitor authorization before
                        allowing entry through the gate.
                    </p>

                </div>

            </div>


            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

                <div className="alert alert-danger rems-alert mb-4">

                    <BsExclamationCircle
                        className="me-2"
                    />

                    {error}

                </div>

            )}


            <div className="row justify-content-center">

                <div className="col-12 col-lg-7 col-xl-6">

                    <div className="rems-glass-card">


                        {/* ==================================================
                            HEADER
                        ================================================== */}

                        <div className="rems-card-header">

                            <div>

                                <div className="rems-page-eyebrow">
                                    GATE VERIFICATION
                                </div>

                                <div className="rems-card-title">
                                    Visitor QR Scanner
                                </div>

                                <div className="rems-card-subtitle">
                                    Scan the QR generated from the
                                    resident visitor invitation.
                                </div>

                            </div>


                            <div className="rems-stat-icon">

                                <BsQrCodeScan />

                            </div>

                        </div>


                        {/* ==================================================
                            GATE
                        ================================================== */}

                        <div className="p-3 pb-0">

                            <label className="rems-form-label">
                                Gate
                            </label>


                            <select
                                className="form-select rems-form-control"
                                value={
                                    selectedGate
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSelectedGate(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    loadingGates ||
                                    scanning ||
                                    processing
                                }
                            >

                                <option value="">

                                    {
                                        loadingGates
                                            ? "Loading gates..."
                                            : "Select gate"
                                    }

                                </option>


                                {gates.map(
                                    (
                                        gate
                                    ) => (

                                        <option
                                            key={
                                                gate.id
                                            }
                                            value={
                                                gate.id
                                            }
                                        >

                                            {
                                                gate.name
                                            }

                                            {
                                                gate.is_primary
                                                    ? " — Primary"
                                                    : ""
                                            }

                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {/* ==================================================
                            SCANNER / RESULT
                        ================================================== */}

                        <div className="p-3">


                            {/* ==================================================
                                READY
                            ================================================== */}

                            {!scanning &&
                                !processing &&
                                !result && (

                                    <div
                                        className="d-flex flex-column align-items-center justify-content-center text-center"
                                        style={{
                                            minHeight:
                                                "360px",
                                            padding:
                                                "20px",
                                        }}
                                    >

                                        <div className="rems-empty-icon">

                                            <BsQrCodeScan />

                                        </div>


                                        <div className="rems-empty-title">

                                            Ready to Scan

                                        </div>


                                        <div className="rems-empty-text mb-3">

                                            Ask the visitor to present
                                            their QR code.

                                        </div>


                                        <button
                                            type="button"
                                            className="rems-primary-button"
                                            onClick={
                                                startScanner
                                            }
                                            disabled={
                                                loadingGates ||
                                                !selectedGate
                                            }
                                        >

                                            <BsQrCodeScan />

                                            Start Scanner

                                        </button>

                                    </div>

                                )}


                            {/* ==================================================
                                CAMERA
                            ================================================== */}

                            {scanning && (

                                <div>

                                    <div
                                        id="security-visitor-qr-reader"
                                        style={{
                                            width:
                                                "100%",
                                            minHeight:
                                                "300px",
                                        }}
                                    />


                                    <div className="text-center mt-3">

                                        <button
                                            type="button"
                                            className="rems-secondary-button"
                                            onClick={
                                                stopScanner
                                            }
                                        >

                                            Stop Scanner

                                        </button>

                                    </div>

                                </div>

                            )}


                            {/* ==================================================
                                PROCESSING
                            ================================================== */}

                            {processing && (

                                <div className="rems-loading-state">

                                    <div
                                        className="spinner-border"
                                        role="status"
                                    />

                                    <div className="mt-3">

                                        Verifying visitor authorization...

                                    </div>

                                </div>

                            )}


                            {/* ==================================================
                                SUCCESS
                            ================================================== */}

                            {result?.success && (

                                <div className="mt-3">

                                    <div className="alert alert-success rems-alert">

                                        <BsCheckCircle
                                            className="me-2"
                                        />

                                        Visitor entry approved.

                                    </div>


                                    <div className="rems-form-section">

                                        <div className="rems-form-section-title">

                                            <BsShieldCheck
                                                className="me-2"
                                            />

                                            Visitor Authorization

                                        </div>


                                        <div className="rems-property-info-card mb-2">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Visitor
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        result.visitor?.name ||
                                                        "Visitor"
                                                    }

                                                </div>

                                            </div>

                                        </div>


                                        <div className="rems-property-info-card mb-2">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Host
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        result.host?.name ||
                                                        "Resident"
                                                    }

                                                </div>

                                            </div>

                                        </div>


                                        <div className="rems-property-info-card mb-2">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Property
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        result.property?.address ||
                                                        "Property"
                                                    }

                                                </div>

                                            </div>

                                        </div>


                                        <div className="rems-property-info-card">

                                            <div>

                                                <div className="rems-table-secondary">
                                                    Gate
                                                </div>

                                                <div className="rems-table-primary">

                                                    {
                                                        result.gate?.name ||
                                                        "Gate"
                                                    }

                                                </div>

                                            </div>

                                        </div>


                                        <div className="small text-success fw-semibold mt-3">

                                            Entry recorded at{" "}

                                            {
                                                result.time_in
                                                    ? new Date(
                                                        result.time_in
                                                    ).toLocaleTimeString(
                                                        [],
                                                        {
                                                            hour:
                                                                "2-digit",

                                                            minute:
                                                                "2-digit",
                                                        }
                                                    )
                                                    : "—"
                                            }

                                        </div>


                                        <button
                                            type="button"
                                            className="rems-primary-button w-100 mt-3"
                                            onClick={
                                                resetScanner
                                            }
                                        >

                                            <BsQrCodeScan />

                                            New Scan

                                        </button>

                                    </div>

                                </div>

                            )}


                            {/* ==================================================
                                FAILURE
                            ================================================== */}

                            {!scanning &&
                                !processing &&
                                !result &&
                                error && (

                                    <div className="text-center py-4">

                                        <BsXCircle
                                            size={42}
                                            className="text-danger mb-3"
                                        />


                                        <div className="fw-semibold">

                                            Access Not Authorized

                                        </div>


                                        <div className="small text-muted mt-1 mb-3">

                                            The visitor QR could not
                                            be accepted.

                                        </div>


                                        <button
                                            type="button"
                                            className="rems-primary-button"
                                            onClick={
                                                resetScanner
                                            }
                                        >

                                            Scan Again

                                        </button>

                                    </div>

                                )}

                        </div>


                        {/* ==================================================
                            SECURITY NOTE
                        ================================================== */}

                        <div className="p-3 border-top">

                            <div className="small text-muted">

                                <strong>
                                    Security:
                                </strong>{" "}
                                QR validation, visit timing,
                                invitation status and gate authorization
                                are enforced by the backend.

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}



// import {
//     useEffect,
//     useRef,
//     useState,
// } from "react";

// import {
//     BsCheckCircle,
//     BsExclamationCircle,
//     BsQrCodeScan,
//     BsShieldCheck,
//     BsXCircle,
// } from "react-icons/bs";

// import {
//     Html5Qrcode,
// } from "html5-qrcode";

// import {
//     getSecurityGates,
//     scanVisitorQr,
// } from "../../api/security";


// export default function VisitorScanner() {

//     const scannerRef =
//         useRef(null);


//     const [
//         gates,
//         setGates,
//     ] = useState([]);


//     const [
//         selectedGate,
//         setSelectedGate,
//     ] = useState("");


//     const [
//         scanning,
//         setScanning,
//     ] = useState(false);


//     const [
//         processing,
//         setProcessing,
//     ] = useState(false);


//     const [
//         result,
//         setResult,
//     ] = useState(null);


//     const [
//         error,
//         setError,
//     ] = useState("");


//     const [
//         loadingGates,
//         setLoadingGates,
//     ] = useState(true);


//     // ========================================================
//     // LOAD GATES
//     // ========================================================

//     useEffect(() => {

//         const loadGates =
//             async () => {

//                 setLoadingGates(
//                     true
//                 );

//                 setError("");


//                 try {

//                     const response =
//                         await getSecurityGates();


//                     const gateData =
//                         Array.isArray(
//                             response
//                         )
//                             ? response
//                             : response?.results ||
//                               response?.gates ||
//                               [];


//                     setGates(
//                         gateData
//                     );


//                     const primaryGate =
//                         gateData.find(
//                             (
//                                 gate
//                             ) =>
//                                 gate?.is_primary ===
//                                 true
//                         ) ||
//                         gateData[0];


//                     if (
//                         primaryGate?.id
//                     ) {

//                         setSelectedGate(
//                             String(
//                                 primaryGate.id
//                             )
//                         );

//                     }

//                 } catch (err) {

//                     console.error(
//                         "[Security Scanner] Gate loading failed:",
//                         err
//                     );


//                     setError(
//                         err?.response?.data?.detail ||
//                         "Unable to load active gates."
//                     );

//                 } finally {

//                     setLoadingGates(
//                         false
//                     );

//                 }

//             };


//         loadGates();

//     }, []);


//     // ========================================================
//     // STOP SCANNER
//     // ========================================================

//     const stopScanner =
//         async () => {

//             if (
//                 scannerRef.current
//             ) {

//                 try {

//                     await scannerRef.current.stop();

//                 } catch {
//                     // Already stopped.
//                 }


//                 scannerRef.current =
//                     null;

//             }


//             setScanning(
//                 false
//             );

//         };


//     // ========================================================
//     // QR SUCCESS
//     // ========================================================

//     const handleScan =
//         async (
//             decodedText
//         ) => {

//             if (
//                 processing
//             ) {
//                 return;
//             }


//             if (
//                 !selectedGate
//             ) {

//                 setError(
//                     "Please select a gate before scanning."
//                 );

//                 return;

//             }


//             setProcessing(
//                 true
//             );

//             setError("");

//             setResult(null);


//             await stopScanner();


//             try {

//                 const response =
//                     await scanVisitorQr(
//                         decodedText,
//                         selectedGate
//                     );


//                 setResult(
//                     response
//                 );

//             } catch (err) {

//                 console.error(
//                     "[Security Scanner] QR validation failed:",
//                     err
//                 );


//                 const data =
//                     err?.response?.data;


//                 setError(
//                     data?.reason ||
//                     data?.detail ||
//                     "Unable to validate the visitor QR code."
//                 );

//             } finally {

//                 setProcessing(
//                     false
//                 );

//             }

//         };


//     // ========================================================
//     // START SCANNER
//     // ========================================================

//     const startScanner =
//         async () => {

//             setError("");
//             setResult(null);


//             if (
//                 !selectedGate
//             ) {

//                 setError(
//                     "Please select a gate before starting the scanner."
//                 );

//                 return;

//             }


//             setScanning(
//                 true
//             );


//             try {

//                 const scanner =
//                     new Html5Qrcode(
//                         "security-visitor-qr-reader"
//                     );


//                 scannerRef.current =
//                     scanner;


//                 await scanner.start(

//                     {
//                         facingMode:
//                             "environment",
//                     },

//                     {
//                         fps:
//                             10,

//                         qrbox:
//                             {
//                                 width:
//                                     250,

//                                 height:
//                                     250,
//                             },
//                     },

//                     (
//                         decodedText
//                     ) => {

//                         handleScan(
//                             decodedText
//                         );

//                     },

//                     () => {
//                         // Ignore frame-level failures.
//                     }

//                 );

//             } catch (err) {

//                 console.error(
//                     "[Security Scanner] Camera error:",
//                     err
//                 );


//                 setScanning(
//                     false
//                 );


//                 setError(
//                     "Unable to access the camera. Please allow camera access and try again."
//                 );

//             }

//         };


//     // ========================================================
//     // CLEANUP
//     // ========================================================

//     useEffect(() => {

//         return () => {

//             if (
//                 scannerRef.current
//             ) {

//                 scannerRef.current
//                     .stop()
//                     .catch(() => {});

//             }

//         };

//     }, []);


//     // ========================================================
//     // NEW SCAN
//     // ========================================================

//     const resetScanner =
//         () => {

//             setResult(null);

//             setError("");

//         };


//     // ========================================================
//     // RENDER
//     // ========================================================

//     return (

//         <div className="rems-page-content">


//             {/* ==================================================
//                 HEADER
//             ================================================== */}

//             <div className="rems-page-header">

//                 <div>

//                     <div className="rems-page-eyebrow">
//                         SECURITY OPERATIONS
//                     </div>

//                     <h1 className="rems-page-title">
//                         Scan Visitor QR
//                     </h1>

//                     <p className="rems-page-description">
//                         Verify the visitor authorization before
//                         allowing entry through the gate.
//                     </p>

//                 </div>

//             </div>


//             {/* ==================================================
//                 ERROR
//             ================================================== */}

//             {error && (

//                 <div className="alert alert-danger rems-alert mb-4">

//                     <BsExclamationCircle
//                         className="me-2"
//                     />

//                     {error}

//                 </div>

//             )}


//             <div className="row justify-content-center">

//                 <div className="col-12 col-lg-7 col-xl-6">

//                     <div className="rems-glass-card">


//                         {/* ==================================================
//                             HEADER
//                         ================================================== */}

//                         <div className="rems-card-header">

//                             <div>

//                                 <div className="rems-page-eyebrow">
//                                     GATE VERIFICATION
//                                 </div>

//                                 <div className="rems-card-title">
//                                     Visitor QR Scanner
//                                 </div>

//                                 <div className="rems-card-subtitle">
//                                     Scan the QR generated from the resident
//                                     visitor invitation.
//                                 </div>

//                             </div>


//                             <div className="rems-stat-icon">

//                                 <BsQrCodeScan />

//                             </div>

//                         </div>


//                         {/* ==================================================
//                             GATE
//                         ================================================== */}

//                         <div className="p-3 pb-0">

//                             <label className="rems-form-label">

//                                 Gate

//                             </label>


//                             <select
//                                 className="form-select rems-form-control"
//                                 value={
//                                     selectedGate
//                                 }
//                                 onChange={(
//                                     event
//                                 ) =>
//                                     setSelectedGate(
//                                         event.target.value
//                                     )
//                                 }
//                                 disabled={
//                                     loadingGates ||
//                                     scanning ||
//                                     processing
//                                 }
//                             >

//                                 <option value="">

//                                     {
//                                         loadingGates
//                                             ? "Loading gates..."
//                                             : "Select gate"
//                                     }

//                                 </option>


//                                 {gates.map(
//                                     (
//                                         gate
//                                     ) => (

//                                         <option
//                                             key={
//                                                 gate.id
//                                             }
//                                             value={
//                                                 gate.id
//                                             }
//                                         >

//                                             {
//                                                 gate.name
//                                             }

//                                             {
//                                                 gate.is_primary
//                                                     ? " — Primary"
//                                                     : ""
//                                             }

//                                         </option>

//                                     )
//                                 )}

//                             </select>

//                         </div>


//                         {/* ==================================================
//                             BODY
//                         ================================================== */}

//                         <div className="p-3">


//                             {/* READY */}

//                             {!scanning &&
//                                 !processing &&
//                                 !result && (

//                                     <div
//                                         className="d-flex flex-column align-items-center justify-content-center text-center"
//                                         style={{
//                                             minHeight:
//                                                 "360px",
//                                             padding:
//                                                 "20px",
//                                         }}
//                                     >

//                                         <div className="rems-empty-icon">

//                                             <BsQrCodeScan />

//                                         </div>


//                                         <div className="rems-empty-title">

//                                             Ready to Scan

//                                         </div>


//                                         <div className="rems-empty-text mb-3">

//                                             Ask the visitor to present
//                                             their QR code.

//                                         </div>


//                                         <button
//                                             type="button"
//                                             className="rems-primary-button"
//                                             onClick={
//                                                 startScanner
//                                             }
//                                             disabled={
//                                                 loadingGates ||
//                                                 !selectedGate
//                                             }
//                                         >

//                                             <BsQrCodeScan />

//                                             Start Scanner

//                                         </button>

//                                     </div>

//                                 )}


//                             {/* CAMERA */}

//                             {scanning && (

//                                 <div>

//                                     <div
//                                         id="security-visitor-qr-reader"
//                                         style={{
//                                             width:
//                                                 "100%",
//                                         }}
//                                     />


//                                     <div className="text-center mt-3">

//                                         <button
//                                             type="button"
//                                             className="rems-secondary-button"
//                                             onClick={
//                                                 stopScanner
//                                             }
//                                         >

//                                             Stop Scanner

//                                         </button>

//                                     </div>

//                                 </div>

//                             )}


//                             {/* PROCESSING */}

//                             {processing && (

//                                 <div className="rems-loading-state">

//                                     <div
//                                         className="spinner-border"
//                                         role="status"
//                                     />

//                                     <div className="mt-3">

//                                         Verifying visitor authorization...

//                                     </div>

//                                 </div>

//                             )}


//                             {/* ==================================================
//                                 SUCCESS
//                             ================================================== */}

//                             {result?.success && (

//                                 <div className="mt-3">


//                                     <div className="alert alert-success rems-alert">

//                                         <BsCheckCircle
//                                             className="me-2"
//                                         />

//                                         Visitor entry approved.

//                                     </div>


//                                     <div className="rems-form-section">


//                                         <div className="rems-form-section-title">

//                                             <BsShieldCheck
//                                                 className="me-2"
//                                             />

//                                             Visitor Authorization

//                                         </div>


//                                         <div className="rems-property-info-card mb-2">

//                                             <div>

//                                                 <div className="rems-table-secondary">
//                                                     Visitor
//                                                 </div>

//                                                 <div className="rems-table-primary">

//                                                     {
//                                                         result.visitor?.name ||
//                                                         "Visitor"
//                                                     }

//                                                 </div>

//                                             </div>

//                                         </div>


//                                         <div className="rems-property-info-card mb-2">

//                                             <div>

//                                                 <div className="rems-table-secondary">
//                                                     Host
//                                                 </div>

//                                                 <div className="rems-table-primary">

//                                                     {
//                                                         result.host?.name ||
//                                                         "Resident"
//                                                     }

//                                                 </div>

//                                             </div>

//                                         </div>


//                                         <div className="rems-property-info-card mb-2">

//                                             <div>

//                                                 <div className="rems-table-secondary">
//                                                     Property
//                                                 </div>

//                                                 <div className="rems-table-primary">

//                                                     {
//                                                         result.property?.address ||
//                                                         "Property"
//                                                     }

//                                                 </div>

//                                             </div>

//                                         </div>


//                                         <div className="rems-property-info-card">

//                                             <div>

//                                                 <div className="rems-table-secondary">
//                                                     Gate
//                                                 </div>

//                                                 <div className="rems-table-primary">

//                                                     {
//                                                         result.gate?.name ||
//                                                         "Gate"
//                                                     }

//                                                 </div>

//                                             </div>

//                                         </div>


//                                         <div className="small text-success fw-semibold mt-3">

//                                             Entry recorded at{" "}

//                                             {
//                                                 result.time_in
//                                                     ? new Date(
//                                                         result.time_in
//                                                     ).toLocaleTimeString(
//                                                         [],
//                                                         {
//                                                             hour:
//                                                                 "2-digit",
//                                                             minute:
//                                                                 "2-digit",
//                                                         }
//                                                     )
//                                                     : "—"
//                                             }

//                                         </div>


//                                         <button
//                                             type="button"
//                                             className="rems-primary-button w-100 mt-3"
//                                             onClick={
//                                                 resetScanner
//                                             }
//                                         >

//                                             <BsQrCodeScan />

//                                             New Scan

//                                         </button>

//                                     </div>

//                                 </div>

//                             )}


//                             {/* ==================================================
//                                 FAILURE
//                             ================================================== */}

//                             {!scanning &&
//                                 !processing &&
//                                 !result &&
//                                 error && (

//                                     <div className="text-center py-4">

//                                         <BsXCircle
//                                             size={42}
//                                             className="text-danger mb-3"
//                                         />


//                                         <div className="fw-semibold">

//                                             Access Not Authorized

//                                         </div>


//                                         <div className="small text-muted mt-1 mb-3">

//                                             The visitor QR could not
//                                             be accepted.

//                                         </div>


//                                         <button
//                                             type="button"
//                                             className="rems-primary-button"
//                                             onClick={
//                                                 resetScanner
//                                             }
//                                         >

//                                             Scan Again

//                                         </button>

//                                     </div>

//                                 )}

//                         </div>


//                         {/* ==================================================
//                             SECURITY NOTE
//                         ================================================== */}

//                         <div className="p-3 border-top">

//                             <div className="small text-muted">

//                                 <strong>
//                                     Security:
//                                 </strong>{" "}
//                                 QR validation, visit timing,
//                                 invitation status and gate authorization
//                                 are enforced by the backend.

//                             </div>

//                         </div>

//                     </div>

//                 </div>

//             </div>

//         </div>
//     );
// }
