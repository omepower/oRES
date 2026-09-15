import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsClipboardCheck,
    BsClockHistory,
    BsEye,
    BsFileEarmarkText,
    BsFunnel,
    BsSearch,
    BsShieldCheck,
    BsXCircle,
} from "react-icons/bs";

import api from "../../api/axios";


/* ============================================================
   CONSTANTS
============================================================ */

const PAGE_SIZE = 5;

const DEFAULT_FILTERS = {
    search: "",
    action: "",
    model_name: "",
    severity: "",
    user_id: "",
    date_from: "",
    date_to: "",
};


/* ============================================================
   HELPERS
============================================================ */

const normalizeResponse = (response) => {
    if (Array.isArray(response)) {
        return {
            results: response,
            count: response.length,
            next: null,
            previous: null,
        };
    }

    return {
        results: response?.results || [],
        count: Number(response?.count || 0),
        next: response?.next || null,
        previous: response?.previous || null,
    };
};


const normalizeStatus = (value) => {
    return String(value || "").trim().toUpperCase();
};


const formatDateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
};


const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};


const humanize = (value) => {
    return String(value || "")
        .replaceAll("_", " ")
        .replaceAll("-", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
};


const getErrorMessage = (error, fallback = "Unable to complete the request.") => {
    const data = error?.response?.data;
    if (typeof data === "string") return data;
    if (data?.detail) return String(data.detail);
    if (data?.message) return String(data.message);

    if (data && typeof data === "object") {
        const values = Object.values(data).flat();
        const first = values.find(
            (value) => value !== null && value !== undefined && String(value).trim()
        );
        if (first) return String(first);
    }

    return error?.message || fallback;
};


const getSeverityClass = (severity) => {
    switch (normalizeStatus(severity)) {
        case "CRITICAL":
        case "HIGH":
            return "rems-status-danger";
        case "MEDIUM":
            return "rems-status-warning";
        case "LOW":
            return "rems-status-success";
        case "INFO":
        default:
            return "rems-status-secondary";
    }
};


const getActionClass = (action) => {
    const normalized = normalizeStatus(action);

    if (
        normalized.includes("DELETE") ||
        normalized.includes("REVOKE") ||
        normalized.includes("REJECT") ||
        normalized.includes("FAIL")
    ) {
        return "rems-status-danger";
    }

    if (
        normalized.includes("CREATE") ||
        normalized.includes("APPROVE") ||
        normalized.includes("VERIFY") ||
        normalized.includes("COMPLETE")
    ) {
        return "rems-status-success";
    }

    if (
        normalized.includes("UPDATE") ||
        normalized.includes("CHANGE") ||
        normalized.includes("MODIFY")
    ) {
        return "rems-status-warning";
    }

    return "rems-status-secondary";
};


/* ============================================================
   API
============================================================ */

const getAuditEvents = async (params) => {
    const response = await api.get("audit/events/", { params });
    return response.data;
};


const getAuditSummary = async () => {
    const response = await api.get("audit/events/summary/");
    return response.data;
};


/* ============================================================
   MAIN PAGE
============================================================ */

export default function AuditComplianceCenter() {
    const [events, setEvents] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [summary, setSummary] = useState({});

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);

    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const activeFilterCount = useMemo(() => {
        return Object.entries(filters).filter(([key, value]) =>
            Boolean(String(value).trim())
        ).length;
    }, [filters]);

    const loadEvents = useCallback(
        async (refresh = false) => {
            if (refresh) setRefreshing(true);
            else setLoading(true);

            setError("");

            try {
                const params = {
                    page,
                    page_size: PAGE_SIZE,
                };

                if (filters.search.trim()) params.search = filters.search.trim();
                if (filters.action) params.action = filters.action;
                if (filters.model_name) params.model_name = filters.model_name;
                if (filters.severity) params.severity = filters.severity;
                if (filters.user_id) params.user_id = filters.user_id;
                if (filters.date_from) params.date_from = filters.date_from;
                if (filters.date_to) params.date_to = filters.date_to;

                const response = await getAuditEvents(params);
                const normalized = normalizeResponse(response);

                setEvents(normalized.results);
                setTotalCount(normalized.count);
                setHasNext(Boolean(normalized.next));
                setHasPrevious(Boolean(normalized.previous));
            } catch (err) {
                console.error("[Audit Center] Load events:", err);
                setError(getErrorMessage(err, "Unable to load audit events."));
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [page, filters]
    );

    const loadSummary = useCallback(async () => {
        try {
            const response = await getAuditSummary();
            setSummary(response || {});
        } catch (err) {
            console.warn("[Audit Center] Summary:", err);
        }
    }, []);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    const updateFilter = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const resetFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setPage(1);
    };

    const refresh = async () => {
        await Promise.all([loadEvents(true), loadSummary()]);
    };

    const totalEvents = Number(summary?.total_events ?? summary?.total ?? totalCount ?? 0);
    const todayEvents = Number(summary?.today_events ?? summary?.events_today ?? 0);
    const criticalEvents = Number(summary?.critical_events ?? summary?.critical ?? 0);
    const highEvents = Number(summary?.high_events ?? summary?.high ?? 0);
    const uniqueUsers = Number(summary?.unique_users ?? summary?.users ?? 0);
    const uniqueModels = Number(summary?.unique_models ?? summary?.models ?? 0);
    const integrityStatus = summary?.integrity_status || summary?.status || "NORMAL";

    // --- ACCURATE RESOLUTION FOR FAILED & SUCCESSFUL EVENTS ---
    const failedEvents = useMemo(() => {
        if (summary?.failed_events !== undefined) return Number(summary.failed_events);
        if (summary?.failed_count !== undefined) return Number(summary.failed_count);
        if (summary?.failure_count !== undefined) return Number(summary.failure_count);
        if (summary?.failed !== undefined) return Number(summary.failed);
        if (summary?.failures !== undefined) return Number(summary.failures);
        if (summary?.status_counts?.FAILED !== undefined) return Number(summary.status_counts.FAILED);
        if (summary?.status_counts?.FAILURE !== undefined) return Number(summary.status_counts.FAILURE);

        // Fallback calculation from loaded records
        if (Array.isArray(events) && events.length > 0) {
            return events.filter((e) => {
                const res = normalizeStatus(e.result || e.status || e.outcome || e.event_status);
                const act = normalizeStatus(e.action);
                return (
                    res === "FAILED" ||
                    res === "FAILURE" ||
                    res === "ERROR" ||
                    e.success === false ||
                    act.includes("FAIL") ||
                    act.includes("REJECT")
                );
            }).length;
        }
        return 0;
    }, [summary, events]);

    const successfulEvents = useMemo(() => {
        if (summary?.successful_events !== undefined) return Number(summary.successful_events);
        if (summary?.success_count !== undefined) return Number(summary.success_count);
        if (summary?.successful_count !== undefined) return Number(summary.successful_count);
        if (summary?.successful !== undefined) return Number(summary.successful);
        if (summary?.successes !== undefined) return Number(summary.successes);
        if (summary?.success !== undefined) return Number(summary.success);
        if (summary?.status_counts?.SUCCESS !== undefined) return Number(summary.status_counts.SUCCESS);

        // Fallback calculation from loaded records
        if (Array.isArray(events) && events.length > 0) {
            return events.filter((e) => {
                const res = normalizeStatus(e.result || e.status || e.outcome || e.event_status);
                const act = normalizeStatus(e.action);
                return (
                    res === "SUCCESS" ||
                    res === "SUCCESSFUL" ||
                    res === "OK" ||
                    e.success === true ||
                    (!act.includes("FAIL") && !act.includes("REJECT") && res !== "FAILURE" && res !== "FAILED" && res !== "ERROR" && e.success !== false)
                );
            }).length;
        }
        return 0;
    }, [summary, events]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const openEvent = (event) => setSelectedEvent(event);
    const closeEvent = () => setSelectedEvent(null);

    return (
        <div className="rems-page-content">
            {/* PAGE HEADER */}
            <div className="rems-page-header" style={{ marginBottom: "1.5rem" }}>
                <div>
                    <div className="rems-page-eyebrow">GOVERNANCE & COMPLIANCE</div>
                    <h1 className="rems-page-title">Audit & Compliance Center</h1>
                    <p className="rems-page-description">
                        Monitor system activity, administrative actions, security events, and audit records across the oRES platform.
                    </p>
                </div>

                <button
                    type="button"
                    className="rems-secondary-button"
                    onClick={refresh}
                    disabled={refreshing}
                >
                    {refreshing ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    ) : (
                        <BsArrowClockwise />
                    )}
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {/* ERROR ALERT */}
            {error && (
                <div className="alert alert-danger rems-alert mb-4" role="alert">
                    <div className="d-flex align-items-start gap-3">
                        <BsXCircle className="mt-1 flex-shrink-0" />
                        <div className="flex-grow-1">
                            <div className="fw-semibold">Audit service error</div>
                            <div className="small mt-1">{error}</div>
                        </div>
                        <button
                            type="button"
                            className="btn-close"
                            aria-label="Close"
                            onClick={() => setError("")}
                        />
                    </div>
                </div>
            )}

            {/* KPI CARDS */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="rems-stat-card h-100">
                        <div className="rems-stat-icon"><BsClipboardCheck /></div>
                        <div className="rems-stat-content">
                            <div className="rems-stat-label">Total Audit Events</div>
                            <div className="rems-stat-value">{totalEvents}</div>
                            <div className="small text-muted mt-1">All recorded events</div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="rems-stat-card h-100">
                        <div className="rems-stat-icon"><BsClockHistory /></div>
                        <div className="rems-stat-content">
                            <div className="rems-stat-label">Events Today</div>
                            <div className="rems-stat-value">{todayEvents}</div>
                            <div className="small text-muted mt-1">Activity recorded today</div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="rems-stat-card h-100">
                        <div className="rems-stat-icon"><BsShieldCheck /></div>
                        <div className="rems-stat-content">
                            <div className="rems-stat-label">Critical Events</div>
                            <div className="rems-stat-value">{criticalEvents}</div>
                            <div className="small text-muted mt-1">Critical severity records</div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="rems-stat-card h-100">
                        <div className="rems-stat-icon"><BsFileEarmarkText /></div>
                        <div className="rems-stat-content">
                            <div className="rems-stat-label">Unique Users</div>
                            <div className="rems-stat-value">{uniqueUsers}</div>
                            <div className="small text-muted mt-1">Users represented in audit logs</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECONDARY METRICS */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-3">
                    <div className="rems-glass-card h-100">
                        <div className="p-3">
                            <div className="rems-table-secondary">High Severity</div>
                            <div className="rems-table-primary fs-4 mt-1">{highEvents}</div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-3">
                    <div className="rems-glass-card h-100">
                        <div className="p-3">
                            <div className="rems-table-secondary">Successful Events</div>
                            <div className="rems-table-primary fs-4 mt-1">{successfulEvents}</div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-3">
                    <div className="rems-glass-card h-100">
                        <div className="p-3">
                            <div className="rems-table-secondary">Failed Events</div>
                            <div className="rems-table-primary fs-4 mt-1">{failedEvents}</div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-3">
                    <div className="rems-glass-card h-100">
                        <div className="p-3">
                            <div className="rems-table-secondary">Audited Modules</div>
                            <div className="rems-table-primary fs-4 mt-1">{uniqueModels}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* INTEGRITY STATUS */}
            <div className="rems-glass-card mb-4">
                <div className="p-3">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <div className="rems-stat-icon"><BsShieldCheck /></div>
                            <div>
                                <div className="rems-page-eyebrow">AUDIT INTEGRITY</div>
                                <div className="rems-card-title">Audit Logging Status</div>
                                <div className="small text-muted">Monitoring the integrity and availability of audit records.</div>
                            </div>
                        </div>

                        <span className={`rems-status-badge ${getSeverityClass(integrityStatus)}`}>
                            <span className="rems-status-dot" />
                            {humanize(integrityStatus)}
                        </span>
                    </div>
                </div>
            </div>

            {/* FILTERS */}
            <div className="rems-glass-card mb-3">
                <div className="p-3">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                        <div>
                            <div className="rems-page-eyebrow">AUDIT LOG</div>
                            <div className="rems-card-title">Audit Events</div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <BsFunnel />
                            <span className="small">
                                {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
                            </span>
                        </div>
                    </div>

                    <div className="row g-3">
                        <div className="col-12 col-lg-6">
                            <label className="rems-form-label">Search</label>
                            <div className="input-group">
                                <span className="input-group-text"><BsSearch /></span>
                                <input
                                    type="search"
                                    className="form-control rems-form-control"
                                    placeholder="Search action, user, module, object, IP..."
                                    value={filters.search}
                                    onChange={(e) => updateFilter("search", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="col-12 col-md-6 col-lg-3">
                            <label className="rems-form-label">Action</label>
                            <input
                                type="text"
                                className="form-control rems-form-control"
                                placeholder="e.g. CREATE"
                                value={filters.action}
                                onChange={(e) => updateFilter("action", e.target.value)}
                            />
                        </div>

                        <div className="col-12 col-md-6 col-lg-3">
                            <label className="rems-form-label">Module / Model</label>
                            <input
                                type="text"
                                className="form-control rems-form-control"
                                placeholder="e.g. Booking"
                                value={filters.model_name}
                                onChange={(e) => updateFilter("model_name", e.target.value)}
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="rems-form-label">Severity</label>
                            <select
                                className="form-select rems-form-control"
                                value={filters.severity}
                                onChange={(e) => updateFilter("severity", e.target.value)}
                            >
                                <option value="">All Severities</option>
                                <option value="INFO">Info</option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="rems-form-label">User ID</label>
                            <input
                                type="text"
                                className="form-control rems-form-control"
                                placeholder="User ID"
                                value={filters.user_id}
                                onChange={(e) => updateFilter("user_id", e.target.value)}
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="rems-form-label">From</label>
                            <input
                                type="date"
                                className="form-control rems-form-control"
                                value={filters.date_from}
                                onChange={(e) => updateFilter("date_from", e.target.value)}
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="rems-form-label">To</label>
                            <input
                                type="date"
                                className="form-control rems-form-control"
                                value={filters.date_to}
                                onChange={(e) => updateFilter("date_to", e.target.value)}
                            />
                        </div>

                        <div className="col-12">
                            <div className="d-flex justify-content-end">
                                <button
                                    type="button"
                                    className="rems-secondary-button"
                                    onClick={resetFilters}
                                    disabled={activeFilterCount === 0}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="rems-glass-card">
                {loading ? (
                    <div className="rems-loading-state">
                        <div className="spinner-border" role="status" aria-hidden="true" />
                        <div className="mt-3">Loading audit events...</div>
                    </div>
                ) : events.length === 0 ? (
                    <div className="rems-empty-state py-5">
                        <div className="rems-empty-icon"><BsClipboardCheck /></div>
                        <div className="rems-empty-title">No audit events found</div>
                        <div className="rems-empty-text">
                            No audit records match the current search and filter criteria.
                        </div>
                    </div>
                ) : (
                    <div className="rems-table-wrapper">
                        <table className="table rems-table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Module</th>
                                    <th>Severity</th>
                                    <th>Object</th>
                                    <th className="text-end">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {events.map((event, index) => {
                                    const action = event?.action || "—";
                                    const user = event?.actor_name || event?.actor?.username || event?.username || event?.user_name || "System";
                                    const role = event?.actor_role || "SYSTEM";
                                    const moduleName = event?.module || event?.model_name || event?.object_type || "—";
                                    const severity = event?.severity || event?.level || "INFO";
                                    const objectName = event?.object_repr || event?.object_name || (event?.object_type ? `${event.object_type} #${event.object_id}` : "—");

                                    return (
                                        <tr key={event?.id || event?.pk || `${page}-${index}`}>
                                            <td data-label="Timestamp">
                                                <div className="rems-table-primary">
                                                    {formatDate(event?.created_at || event?.timestamp || event?.occurred_at)}
                                                </div>
                                                <div className="rems-table-secondary">
                                                    {formatDateTime(event?.created_at || event?.timestamp || event?.occurred_at)}
                                                </div>
                                            </td>

                                            <td data-label="User">
                                                <div className="rems-table-primary">{user}</div>
                                                <div className="rems-table-secondary">Role: {role}</div>
                                            </td>

                                            <td data-label="Action">
                                                <span className={`rems-status-badge ${getActionClass(action)}`}>
                                                    <span className="rems-status-dot" />
                                                    {humanize(action)}
                                                </span>
                                            </td>

                                            <td data-label="Module">
                                                <div className="rems-table-primary">{humanize(moduleName)}</div>
                                            </td>

                                            <td data-label="Severity">
                                                <span className={`rems-status-badge ${getSeverityClass(severity)}`}>
                                                    <span className="rems-status-dot" />
                                                    {humanize(severity)}
                                                </span>
                                            </td>

                                            <td data-label="Object">
                                                <div
                                                    className="rems-table-primary"
                                                    style={{
                                                        maxWidth: "250px",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {objectName}
                                                </div>
                                                {event?.object_id && (
                                                    <div className="rems-table-secondary">
                                                        ID: {event.object_id}
                                                    </div>
                                                )}
                                            </td>

                                            <td data-label="Action" className="text-end">
                                                <button
                                                    type="button"
                                                    className="rems-icon-button"
                                                    title="View audit event"
                                                    onClick={() => openEvent(event)}
                                                >
                                                    <BsEye />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION */}
                {!loading && events.length > 0 && (
                    <div
                        className="d-flex flex-wrap justify-content-between align-items-center gap-3 p-3"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                    >
                        <div className="small text-muted">
                            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> · {totalCount} total event{totalCount === 1 ? "" : "s"}
                        </div>

                        <div className="d-flex gap-2">
                            <button
                                type="button"
                                className="rems-secondary-button"
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={!hasPrevious || page <= 1 || loading}
                            >
                                Previous
                            </button>

                            <button
                                type="button"
                                className="rems-primary-button"
                                onClick={() => setPage((prev) => prev + 1)}
                                disabled={!hasNext || loading}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* EVENT DETAIL MODAL */}
            {selectedEvent && (
                <div
                    className="rems-modal-backdrop"
                    style={{ zIndex: 3000 }}
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) closeEvent();
                    }}
                >
                    <div
                        className="rems-modal rems-management-modal"
                        style={{
                            position: "relative",
                            zIndex: 3001,
                            width: "min(100%, 900px)",
                            maxHeight: "92vh",
                            overflowY: "auto",
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {/* HEADER */}
                        <div className="rems-modal-header">
                            <div>
                                <div className="rems-page-eyebrow">AUDIT EVENT DETAIL</div>
                                <div className="rems-modal-title">
                                    Event #{selectedEvent?.id || selectedEvent?.event_id || selectedEvent?.pk || "—"}
                                </div>
                                <div className="rems-modal-subtitle">
                                    {formatDateTime(selectedEvent?.created_at || selectedEvent?.timestamp || selectedEvent?.occurred_at)}
                                </div>
                            </div>

                            <button
                                type="button"
                                className="rems-modal-close"
                                onClick={closeEvent}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="rems-modal-body">
                            <div className="row g-3">
                                <div className="col-12 col-md-6">
                                    <div className="rems-form-section h-100">
                                        <div className="rems-form-section-title">Event Information</div>

                                        <div className="row g-3">
                                            <div className="col-12">
                                                <div className="rems-table-secondary">Action / Type</div>
                                                <div className="rems-table-primary">
                                                    {humanize(selectedEvent?.action || selectedEvent?.event_type || "—")}
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="rems-table-secondary">Severity</div>
                                                <div className="mt-1">
                                                    <span className={`rems-status-badge ${getSeverityClass(selectedEvent?.severity || selectedEvent?.level)}`}>
                                                        <span className="rems-status-dot" />
                                                        {humanize(selectedEvent?.severity || selectedEvent?.level || "INFO")}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="rems-table-secondary">Module</div>
                                                <div className="rems-table-primary">
                                                    {humanize(selectedEvent?.module || selectedEvent?.model_name || "—")}
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="rems-table-secondary">Object</div>
                                                <div className="rems-table-primary">
                                                    {selectedEvent?.object_repr || selectedEvent?.object_name || selectedEvent?.object_type || "—"}
                                                </div>
                                                {selectedEvent?.object_id && (
                                                    <div className="rems-table-secondary">
                                                        Object ID: {selectedEvent.object_id}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12 col-md-6">
                                    <div className="rems-form-section h-100">
                                        <div className="rems-form-section-title">Actor & Request</div>

                                        <div className="row g-3">
                                            <div className="col-12">
                                                <div className="rems-table-secondary">User</div>
                                                <div className="rems-table-primary">
                                                    {selectedEvent?.actor_name || selectedEvent?.actor?.username || selectedEvent?.username || selectedEvent?.user_name || "System"}
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="rems-table-secondary">Actor Role</div>
                                                <div className="rems-table-primary">
                                                    {selectedEvent?.actor_role || "SYSTEM"}
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="rems-table-secondary">IP Address</div>
                                                <div className="rems-table-primary">
                                                    {selectedEvent?.ip_address || selectedEvent?.remote_addr || "—"}
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="rems-table-secondary">Request Method</div>
                                                <div className="rems-table-primary">
                                                    {selectedEvent?.request_method || selectedEvent?.method || "—"}
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="rems-table-secondary">Request Path</div>
                                                <div className="rems-table-primary" style={{ wordBreak: "break-word" }}>
                                                    {selectedEvent?.request_path || selectedEvent?.path || "—"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="rems-form-section">
                                        <div className="rems-form-section-title">Description</div>
                                        <div className="small">
                                            {selectedEvent?.description || selectedEvent?.message || selectedEvent?.details || "No description was recorded for this event."}
                                        </div>
                                    </div>
                                </div>

                                {(selectedEvent?.before_data || selectedEvent?.after_data || selectedEvent?.metadata) && (
                                    <div className="col-12">
                                        <div className="rems-form-section">
                                            <div className="rems-form-section-title">Audit Diffs & Metadata</div>
                                            <div className="row g-2">
                                                {selectedEvent?.before_data && (
                                                    <div className="col-12 col-md-6">
                                                        <span className="small text-muted d-block mb-1">Before State</span>
                                                        <pre className="p-3 rounded-3 bg-dark text-light small mb-0" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                            {JSON.stringify(selectedEvent.before_data, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                                {selectedEvent?.after_data && (
                                                    <div className="col-12 col-md-6">
                                                        <span className="small text-muted d-block mb-1">After State</span>
                                                        <pre className="p-3 rounded-3 bg-dark text-light small mb-0" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                            {JSON.stringify(selectedEvent.after_data, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                                {selectedEvent?.metadata && (
                                                    <div className="col-12 mt-2">
                                                        <span className="small text-muted d-block mb-1">Metadata</span>
                                                        <pre className="p-3 rounded-3 bg-dark text-light small mb-0" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                            {JSON.stringify(selectedEvent.metadata, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="rems-modal-footer">
                            <button
                                type="button"
                                className="rems-secondary-button"
                                onClick={closeEvent}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}