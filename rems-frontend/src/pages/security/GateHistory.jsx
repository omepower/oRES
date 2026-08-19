
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsClockHistory,
} from "react-icons/bs";

import {
    getVisitorGateHistory,
} from "../../api/security";


export default function GateHistory() {

    const [
        visits,
        setVisits,
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
        search,
        setSearch,
    ] = useState("");


    const [
        statusFilter,
        setStatusFilter,
    ] = useState("ALL");


    const [
        error,
        setError,
    ] = useState("");


    // ========================================================
    // LOAD HISTORY
    // ========================================================

    const loadHistory =
        useCallback(
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
                        await getVisitorGateHistory();


                    const data =
                        Array.isArray(response)
                            ? response
                            : response?.results ||
                              response?.visits ||
                              [];


                    setVisits(data);

                } catch (err) {

                    console.error(
                        "[Security] Failed to load gate history:",
                        err
                    );


                    setError(
                        err?.response?.data?.detail ||
                        "Unable to load gate history."
                    );

                } finally {

                    setLoading(false);
                    setRefreshing(false);

                }

            },
            []
        );


    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {

        loadHistory();

    }, [
        loadHistory,
    ]);


    // ========================================================
    // FILTER
    // ========================================================

    const filteredVisits =
        useMemo(
            () => {

                const text =
                    search
                        .trim()
                        .toLowerCase();


                return visits.filter(
                    (
                        visit
                    ) => {

                        const searchable = [

                            visit?.visitor_name,
                            visit?.visitor_phone,
                            visit?.host_name,
                            visit?.host_address,
                            visit?.property_address,
                            visit?.gate_name,
                            visit?.scanned_by_name,
                            visit?.status,

                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                        const matchesSearch =
                            !text ||
                            searchable.includes(text);


                        const matchesStatus =
                            statusFilter === "ALL" ||
                            visit?.status === statusFilter;


                        return (
                            matchesSearch &&
                            matchesStatus
                        );

                    }
                );

            },
            [
                visits,
                search,
                statusFilter,
            ]
        );


    // ========================================================
    // FORMAT DATE / TIME
    // ========================================================

    const formatDateTime =
        (
            value
        ) => {

            if (!value) {

                return "—";

            }


            const date =
                new Date(value);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return "—";

            }


            return date.toLocaleString(
                [],
                {
                    dateStyle: "medium",
                    timeStyle: "short",
                }
            );

        };


    // ========================================================
    // STATUS CLASS
    // ========================================================

    const getStatusClass =
        (
            status
        ) => {

            switch (status) {

                case "COMPLETED":
                    return "rems-status-success";

                case "INSIDE":
                    return "rems-status-warning";

                case "DENIED":
                    return "rems-status-danger";

                default:
                    return "rems-status-secondary";

            }

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

                        Gate History

                    </h1>


                    <p className="rems-page-description">

                        Review visitor entry and exit records.

                    </p>

                </div>


                <button
                    type="button"
                    className="rems-secondary-button"
                    onClick={() =>
                        loadHistory(true)
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


            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

                <div className="alert alert-danger rems-alert mb-4">

                    {error}

                </div>

            )}


            {/* ==================================================
                MAIN CARD
            ================================================== */}

            <div className="rems-glass-card">


                {/* ==================================================
                    CARD HEADER
                ================================================== */}

                <div className="rems-card-header">

                    <div>

                        <div className="rems-page-eyebrow">

                            VISITOR RECORDS

                        </div>


                        <div className="rems-card-title">

                            Gate Activity

                        </div>


                        <div className="rems-card-subtitle">

                            Completed and active visitor gate records.

                        </div>

                    </div>


                    <div className="rems-stat-icon">

                        <BsClockHistory />

                    </div>

                </div>


                {/* ==================================================
                    FILTER BAR
                ================================================== */}

                <div className="rems-filter-bar">


                    {/* SEARCH */}

                    <div className="rems-search-box">

                        <i
                            className="bi bi-search"
                            aria-hidden="true"
                        />


                        <input
                            type="search"
                            className="form-control"
                            placeholder="Search visitor, host, property or gate..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            aria-label="Search gate history"
                            autoComplete="off"
                            spellCheck="false"
                        />

                    </div>


                    {/* STATUS */}

                    <select
                        className="form-select rems-filter-select"
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                        aria-label="Filter gate history by status"
                    >

                        <option value="ALL">
                            All Statuses
                        </option>

                        <option value="INSIDE">
                            Inside
                        </option>

                        <option value="COMPLETED">
                            Completed
                        </option>

                        <option value="DENIED">
                            Denied
                        </option>

                    </select>


                    {/* RESET */}

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() => {

                            setSearch("");
                            setStatusFilter("ALL");

                        }}
                    >

                        Reset

                    </button>

                </div>


                {/* ==================================================
                    CONTENT
                ================================================== */}

                {loading ? (

                    <div className="rems-loading-state">

                        <div
                            className="spinner-border"
                            role="status"
                            aria-hidden="true"
                        />

                        <div className="mt-2">

                            Loading gate history...

                        </div>

                    </div>

                ) : filteredVisits.length === 0 ? (

                    <div className="rems-empty-state">

                        <div className="rems-empty-icon">

                            <BsClockHistory />

                        </div>


                        <div className="rems-empty-title">

                            No gate records found

                        </div>


                        <p className="rems-empty-text">

                            There are no visitor records matching
                            the current filters.

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
                                        Host / Property
                                    </th>

                                    <th>
                                        Gate
                                    </th>

                                    <th>
                                        Time In
                                    </th>

                                    <th>
                                        Time Out
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Scanned By
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredVisits.map(
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


                                            {/* HOST / PROPERTY */}

                                            <td data-label="Host / Property">

                                                <div className="rems-table-primary">

                                                    {
                                                        visit.host_name ||
                                                        "Resident"
                                                    }

                                                </div>


                                                <div className="rems-table-secondary">

                                                    {
                                                        visit.property_address ||
                                                        "Property"
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

                                                {
                                                    formatDateTime(
                                                        visit.time_in
                                                    )
                                                }

                                            </td>


                                            {/* TIME OUT */}

                                            <td data-label="Time Out">

                                                {
                                                    formatDateTime(
                                                        visit.time_out
                                                    )
                                                }

                                            </td>


                                            {/* STATUS */}

                                            <td data-label="Status">

                                                <span
                                                    className={
                                                        `rems-status-badge ${
                                                            getStatusClass(
                                                                visit.status
                                                            )
                                                        }`
                                                    }
                                                >

                                                    <span className="rems-status-dot" />

                                                    {
                                                        visit.status_display ||
                                                        visit.status ||
                                                        "—"
                                                    }

                                                </span>

                                            </td>


                                            {/* SCANNED BY */}

                                            <td data-label="Scanned By">

                                                {
                                                    visit.scanned_by_name ||
                                                    visit.scanned_by?.username ||
                                                    "—"
                                                }

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
