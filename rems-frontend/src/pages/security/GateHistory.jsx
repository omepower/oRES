
// ============================================================
// src/pages/security/GateHistory.jsx
// ============================================================

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsClockHistory,
    BsSearch,
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
                        Array.isArray(
                            response
                        )
                            ? response
                            : response?.results ||
                              response?.visits ||
                              [];


                    setVisits(
                        data
                    );

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


    useEffect(() => {

        loadHistory();

    }, [
        loadHistory,
    ]);


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

                        const invitation =
                            visit?.invitation ||
                            {};


                        const searchable = [

                            invitation.visitor_name,

                            invitation.host_name_snapshot,

                            invitation.host_address_snapshot,

                            visit.gate?.name,

                            visit.gate_name,

                            visit.scanned_by?.username,

                            visit.scanned_by_name,

                            visit.status,

                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                        const matchesSearch =
                            !text ||
                            searchable.includes(
                                text
                            );


                        const matchesStatus =
                            statusFilter ===
                                "ALL" ||
                            visit.status ===
                                statusFilter;


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


    const formatDateTime =
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


            return date.toLocaleString(
                [],
                {
                    dateStyle:
                        "medium",

                    timeStyle:
                        "short",
                }
            );

        };


    return (

        <div className="rems-page-content">


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


            {error && (

                <div className="alert alert-danger rems-alert mb-4">

                    {error}

                </div>

            )}


            <div className="rems-glass-card">


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


                <div className="rems-filter-bar">

                    <div className="rems-search-box">

                        <BsSearch />

                        <input
                            type="search"
                            className="form-control"
                            placeholder="Search visitor, host, property or gate..."
                            value={
                                search
                            }
                            onChange={(
                                event
                            ) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    <select
                        className="form-select rems-filter-select"
                        value={
                            statusFilter
                        }
                        onChange={(
                            event
                        ) =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
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


                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() => {

                            setSearch("");

                            setStatusFilter(
                                "ALL"
                            );

                        }}
                    >

                        Reset

                    </button>

                </div>


                {loading ? (

                    <div className="rems-loading-state">

                        <div
                            className="spinner-border"
                            role="status"
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
                                    ) => {

                                        const invitation =
                                            visit?.invitation ||
                                            {};


                                        const statusClass =
                                            visit.status ===
                                                "COMPLETED"
                                                ? "rems-status-success"
                                                : visit.status ===
                                                    "INSIDE"
                                                    ? "rems-status-warning"
                                                    : "rems-status-danger";


                                        return (

                                            <tr
                                                key={
                                                    visit.id
                                                }
                                            >

                                                <td>

                                                    <div className="rems-table-primary">

                                                        {
                                                            invitation.visitor_name ||
                                                            visit.visitor_name ||
                                                            "Visitor"
                                                        }

                                                    </div>


                                                    <div className="rems-table-secondary">

                                                        {
                                                            invitation.visitor_phone ||
                                                            "No phone"
                                                        }

                                                    </div>

                                                </td>


                                                <td>

                                                    <div className="rems-table-primary">

                                                        {
                                                            invitation.host_name_snapshot ||
                                                            "Resident"
                                                        }

                                                    </div>


                                                    <div className="rems-table-secondary">

                                                        {
                                                            invitation.host_address_snapshot ||
                                                            "Property"
                                                        }

                                                    </div>

                                                </td>


                                                <td>

                                                    {
                                                        visit.gate?.name ||
                                                        visit.gate_name ||
                                                        "—"
                                                    }

                                                </td>


                                                <td>

                                                    {
                                                        formatDateTime(
                                                            visit.time_in
                                                        )
                                                    }

                                                </td>


                                                <td>

                                                    {
                                                        formatDateTime(
                                                            visit.time_out
                                                        )
                                                    }

                                                </td>


                                                <td>

                                                    <span
                                                        className={`rems-status-badge ${statusClass}`}
                                                    >

                                                        <span className="rems-status-dot" />

                                                        {
                                                            visit.status ||
                                                            "—"
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    {
                                                        visit.scanned_by?.username ||
                                                        visit.scanned_by_name ||
                                                        "—"
                                                    }

                                                </td>

                                            </tr>

                                        );

                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    );
}
