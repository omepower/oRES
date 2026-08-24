import {
    useNavigate,
} from "react-router-dom";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsCalendarEvent,
    BsMegaphone,
} from "react-icons/bs";

import {
    getAnnouncementFeed,
} from "../../api/announcements";


const getCategoryLabel = (
    announcement
) => {

    return (
        announcement?.category_display ||
        announcement?.category ||
        "General"
    );
};


const getPriorityClass = (
    priority
) => {

    switch (
        String(
            priority || ""
        ).toUpperCase()
    ) {

        case "URGENT":
            return "rems-status-danger";

        case "IMPORTANT":
            return "rems-status-warning";

        default:
            return "rems-status-info";
    }
};


export default function ResidentAnnouncements() {

    const [
        announcements,
        setAnnouncements,
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

    const navigate =
    useNavigate();


    const loadAnnouncements =
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
                        await getAnnouncementFeed();


                    const data =
                        Array.isArray(
                            response
                        )
                            ? response
                            : response?.results ||
                              [];


                    setAnnouncements(
                        data
                    );

                } catch (err) {

                    console.error(
                        "[Announcements] Failed:",
                        err
                    );

                    setError(
                        err?.response?.data?.detail ||
                        "Unable to load community announcements."
                    );

                } finally {

                    setLoading(false);
                    setRefreshing(false);

                }

            },
            []
        );


    useEffect(() => {

        loadAnnouncements();

    }, [
        loadAnnouncements,
    ]);


    return (

        <div className="rems-page-content">

            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">
                        COMMUNITY
                    </div>

                    <h1 className="rems-page-title">
                        Community Announcements
                    </h1>

                    <p className="rems-page-description">
                        Stay informed about important notices,
                        maintenance, events, policies, and security updates.
                    </p>

                </div>


                <button
                    type="button"
                    className="rems-secondary-button"
                    onClick={() =>
                        loadAnnouncements(true)
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


            {loading ? (

                <div className="rems-glass-card">

                    <div className="rems-loading-state">

                        <div
                            className="spinner-border"
                            role="status"
                        />

                        <div className="mt-3">
                            Loading community announcements...
                        </div>

                    </div>

                </div>

            ) : announcements.length === 0 ? (

                <div className="rems-glass-card">

                    <div className="rems-empty-state">

                        <div className="rems-empty-icon">

                            <BsMegaphone />

                        </div>

                        <div className="rems-empty-title">

                            No community announcements

                        </div>

                        <div className="rems-empty-text">

                            New notices and community updates
                            will appear here.

                        </div>

                    </div>

                </div>

            ) : (

                <div className="d-flex flex-column gap-3">

                    {announcements.map(
                        (
                            announcement
                        ) => (

                            <button
                                key={announcement.id}
                                type="button"
                                className="rems-glass-card border-0 text-start w-100 p-0"
                                style={{
                                    cursor: "pointer",
                                }}
                                onClick={() =>
                                    navigate(
                                        `./${announcement.id}`
                                    )
                                }
                            >
                                <div className="rems-card-body">

                                    <div className="d-flex align-items-start gap-3">

                                        <div className="rems-stat-icon flex-shrink-0">

                                            <BsMegaphone />

                                        </div>


                                        <div className="min-width-0 flex-grow-1">

                                            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">

                                                <span className="rems-page-eyebrow mb-0">

                                                    {
                                                        getCategoryLabel(
                                                            announcement
                                                        )
                                                    }

                                                </span>


                                                <span
                                                    className={`rems-status-badge ${
                                                        getPriorityClass(
                                                            announcement.priority
                                                        )
                                                    }`}
                                                >

                                                    {
                                                        announcement.priority_display ||
                                                        announcement.priority
                                                    }

                                                </span>

                                            </div>


                                            <div className="rems-card-title mb-1">

                                                {
                                                    announcement.title
                                                }

                                            </div>


                                            <div className="rems-card-subtitle">

                                                {
                                                    announcement.content
                                                }

                                            </div>


                                            <div className="d-flex align-items-center gap-2 mt-3 small text-muted">

                                                <BsCalendarEvent />

                                                {
                                                    announcement.published_at
                                                        ? new Date(
                                                            announcement.published_at
                                                        ).toLocaleString()
                                                        : "Recently published"
                                                }

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </button>

                        )
                    )}

                </div>

            )}

        </div>

    );
}