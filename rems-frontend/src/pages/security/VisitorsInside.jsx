
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsBoxArrowRight,
    BsClock,
    BsDoorOpen,
    BsPeople,
} from "react-icons/bs";

import {
    checkoutVisitor,
    getVisitorsInside,
} from "../../api/security";


export default function VisitorsInside() {

    const [
        visitors,
        setVisitors,
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
        processingId,
        setProcessingId,
    ] = useState(null);


    const [
        error,
        setError,
    ] = useState("");


    // ========================================================
    // LOAD VISITORS
    // ========================================================

    const loadVisitors =
        useCallback(
            async (
                refresh = false
            ) => {

                if (refresh) {

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
                        await getVisitorsInside();


                    const data =
                        Array.isArray(
                            response
                        )
                            ? response
                            : response?.results ||
                              response?.visits ||
                              [];


                    setVisitors(
                        data
                    );

                } catch (err) {

                    console.error(
                        "[Security] Failed to load visitors inside:",
                        err
                    );


                    setError(
                        err?.response?.data?.detail ||
                        "Unable to load visitors currently inside."
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


    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {

        loadVisitors();

    }, [
        loadVisitors,
    ]);


    // ========================================================
    // CHECKOUT
    // ========================================================

    const handleCheckout =
        async (
            visit
        ) => {

            if (
                !visit?.id ||
                processingId
            ) {

                return;

            }


            const visitorName =
                visit?.visitor_name ||
                "this visitor";


            const confirmed =
                window.confirm(
                    `Check out ${visitorName}?`
                );


            if (
                !confirmed
            ) {

                return;

            }


            setProcessingId(
                visit.id
            );

            setError("");


            try {

                await checkoutVisitor(
                    visit.id
                );


                setVisitors(
                    (
                        previous
                    ) =>
                        previous.filter(
                            (
                                item
                            ) =>
                                item.id !==
                                visit.id
                        )
                );

            } catch (err) {

                console.error(
                    "[Security] Checkout failed:",
                    err
                );


                setError(
                    err?.response?.data?.detail ||
                    "Unable to check out this visitor."
                );

            } finally {

                setProcessingId(
                    null
                );

            }

        };


    // ========================================================
    // FORMAT TIME
    // ========================================================

    const formatTime =
        (
            value
        ) => {

            if (
                !value
            ) {

                return "—";

            }


            const date =
                new Date(
                    value
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return "—";

            }


            return date.toLocaleTimeString(
                [],
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit",
                }
            );

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
                        Visitors Inside
                    </h1>

                    <p className="rems-page-description">
                        Monitor visitors who have entered the
                        subdivision and have not yet checked out.
                    </p>

                </div>


                <button
                    type="button"
                    className="rems-secondary-button"
                    onClick={() =>
                        loadVisitors(
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


            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

                <div className="alert alert-danger rems-alert mb-4">

                    {error}

                </div>

            )}


            {/* ==================================================
                CARD
            ================================================== */}

            <div className="rems-glass-card">


                <div className="rems-card-header">

                    <div>

                        <div className="rems-page-eyebrow">
                            LIVE GATE STATUS
                        </div>

                        <div className="rems-card-title">
                            Current Visitors
                        </div>

                        <div className="rems-card-subtitle">

                            {visitors.length} visitor
                            {visitors.length === 1
                                ? ""
                                : "s"} currently inside.

                        </div>

                    </div>


                    <div className="rems-stat-icon">

                        <BsPeople />

                    </div>

                </div>


                {/* ==================================================
                    CONTENT
                ================================================== */}

                {loading ? (

                    <div className="rems-loading-state">

                        <div
                            className="spinner-border"
                            role="status"
                        />

                        <div className="mt-2">
                            Loading visitors...
                        </div>

                    </div>

                ) : visitors.length === 0 ? (

                    <div className="rems-empty-state">

                        <div className="rems-empty-icon">

                            <BsDoorOpen />

                        </div>


                        <div className="rems-empty-title">
                            No visitors currently inside
                        </div>


                        <p className="rems-empty-text">
                            The gate is currently clear.
                        </p>

                    </div>

                ) : (

                    <div className="rems-table-wrapper">

                        <table className="table rems-table align-middle mb-0">

                            <thead>

                                <tr>

                                    <th>
                                        Visitor
                                    </th>

                                    <th>
                                        Host
                                    </th>

                                    <th>
                                        Property
                                    </th>

                                    <th>
                                        Gate
                                    </th>

                                    <th>
                                        Time In
                                    </th>

                                    <th className="text-end">
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {visitors.map(
                                    (
                                        visit
                                    ) => (

                                        <tr
                                            key={
                                                visit.id
                                            }
                                        >

                                            {/* VISITOR */}

                                            <td data-label="Visitor">

                                                <div className="rems-table-primary">

                                                    {
                                                        visit.visitor_name ||
                                                        "Visitor"
                                                    }

                                                </div>


                                                <div className="rems-table-secondary">

                                                    {
                                                        visit.visitor_phone ||
                                                        "No phone"
                                                    }

                                                </div>

                                            </td>


                                            {/* HOST */}

                                            <td data-label="Host">

                                                <div className="rems-table-primary">

                                                    {
                                                        visit.host_name ||
                                                        "Resident"
                                                    }

                                                </div>


                                                <div className="rems-table-secondary">

                                                    {
                                                        visit.host_phone ||
                                                        "No phone"
                                                    }

                                                </div>

                                            </td>


                                            {/* PROPERTY */}

                                            <td data-label="Property">

                                                <div className="rems-table-primary">

                                                    {
                                                        visit.property_address ||
                                                        "—"
                                                    }

                                                </div>

                                            </td>


                                            {/* GATE */}

                                            <td data-label="Gate">

                                                {
                                                    visit.gate_name ||
                                                    "—"
                                                }

                                            </td>


                                            {/* TIME IN */}

                                            <td data-label="Time In">

                                                <div className="d-flex align-items-center gap-1">

                                                    <BsClock />

                                                    {
                                                        formatTime(
                                                            visit.time_in
                                                        )
                                                    }

                                                </div>

                                            </td>


                                            {/* ACTION */}

                                            <td data-label="Action">

                                                <div className="d-flex justify-content-end">

                                                    <button
                                                        type="button"
                                                        className="rems-primary-button bg-danger border-danger"
                                                        onClick={() =>
                                                            handleCheckout(
                                                                visit
                                                            )
                                                        }
                                                        disabled={
                                                            processingId ===
                                                            visit.id
                                                        }
                                                    >

                                                        {processingId ===
                                                        visit.id ? (

                                                            <span
                                                                className="spinner-border spinner-border-sm"
                                                                aria-hidden="true"
                                                            />

                                                        ) : (

                                                            <BsBoxArrowRight />

                                                        )}


                                                        {
                                                            processingId ===
                                                            visit.id
                                                                ? "Checking out..."
                                                                : "Check Out"
                                                        }

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    );
}
