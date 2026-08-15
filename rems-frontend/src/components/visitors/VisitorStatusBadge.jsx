export default function VisitorStatusBadge({
    status,
}) {
    const normalizedStatus =
        String(status || "")
            .toUpperCase();

    const statusConfig = {
        PENDING: {
            label: "Pending",
            className:
                "rems-status-warning",
        },

        USED: {
            label: "Used",
            className:
                "rems-status-success",
        },

        EXPIRED: {
            label: "Expired",
            className:
                "rems-status-secondary",
        },

        CANCELLED: {
            label: "Cancelled",
            className:
                "rems-status-danger",
        },

        INSIDE: {
            label: "Inside",
            className:
                "rems-status-info",
        },

        COMPLETED: {
            label: "Completed",
            className:
                "rems-status-success",
        },

        DENIED: {
            label: "Denied",
            className:
                "rems-status-danger",
        },
    };

    const config =
        statusConfig[
            normalizedStatus
        ] || {
            label:
                normalizedStatus || "Unknown",

            className:
                "rems-status-secondary",
        };

    return (
        <span
            className={`rems-status-badge ${config.className}`}
        >
            <span className="rems-status-dot" />

            {config.label}
        </span>
    );
}