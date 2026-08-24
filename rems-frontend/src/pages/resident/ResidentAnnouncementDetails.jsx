import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    BsArrowLeft,
    BsCalendarEvent,
    BsMegaphone,
} from "react-icons/bs";

import {
    getAnnouncement,
} from "../../api/announcements";


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


export default function ResidentAnnouncementDetails() {

    const {
        id,
    } = useParams();

    const navigate =
        useNavigate();


    const [
        announcement,
        setAnnouncement,
    ] = useState(null);


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState("");


    const loadAnnouncement =
        useCallback(
            async () => {

                setLoading(true);
                setError("");


                try {

                    const data =
                        await getAnnouncement(
                            id
                        );


                    setAnnouncement(
                        data
                    );

                } catch (err) {

                    console.error(
                        "[Announcement Details] Failed:",
                        err
                    );


                    setError(
                        err?.response?.data?.detail ||
                        "Unable to load this announcement."
                    );

                } finally {

                    setLoading(false);

                }

            },
            [
                id,
            ]
        );


    useEffect(() => {

        loadAnnouncement();

    }, [
        loadAnnouncement,
    ]);


    if (loading) {

        return (

            <div className="rems-page-content">

                <div className="rems-loading-state">

                    <div
                        className="spinner-border"
                        role="status"
                    />

                    <div className="mt-3">
                        Loading announcement...
                    </div>

                </div>

            </div>

        );

    }


    if (error || !announcement) {

        return (

            <div className="rems-page-content">

                <button
                    type="button"
                    className="rems-secondary-button mb-3"
                    onClick={() =>
                        navigate(-1)
                    }
                >

                    <BsArrowLeft />

                    Back

                </button>


                <div className="rems-glass-card">

                    <div className="rems-empty-state">

                        <div className="rems-empty-icon">

                            <BsMegaphone />

                        </div>


                        <div className="rems-empty-title">

                            Announcement unavailable

                        </div>


                        <div className="rems-empty-text">

                            {
                                error ||
                                "This announcement could not be found."
                            }

                        </div>

                    </div>

                </div>

            </div>

        );

    }


    return (

        <div className="rems-page-content">

            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">
                        COMMUNITY
                    </div>

                    <h1 className="rems-page-title">
                        Announcement
                    </h1>

                </div>


                <button
                    type="button"
                    className="rems-secondary-button"
                    onClick={() =>
                        navigate(-1)
                    }
                >

                    <BsArrowLeft />

                    Back

                </button>

            </div>


            <div className="rems-glass-card">

                <div className="rems-card-body">

                    <div className="d-flex align-items-start gap-3">

                        <div className="rems-stat-icon flex-shrink-0">

                            <BsMegaphone />

                        </div>


                        <div className="min-width-0 flex-grow-1">

                            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">

                                <div className="rems-page-eyebrow mb-0">

                                    {
                                        announcement.category_display ||
                                        announcement.category ||
                                        "GENERAL"
                                    }

                                </div>


                                <span
                                    className={`rems-status-badge ${
                                        getPriorityClass(
                                            announcement.priority
                                        )
                                    }`}
                                >

                                    <span className="rems-status-dot" />

                                    {
                                        announcement.priority_display ||
                                        announcement.priority
                                    }

                                </span>

                            </div>


                            <div className="rems-card-title">

                                {
                                    announcement.title
                                }

                            </div>


                            <div className="d-flex align-items-center gap-2 mt-2 small text-muted">

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


                    <div
                        className="mt-4"
                        style={{
                            whiteSpace:
                                "pre-wrap",
                            lineHeight:
                                1.75,
                            color:
                                "var(--rems-text-soft)",
                            fontSize:
                                "13px",
                        }}
                    >

                        {
                            announcement.content
                        }

                    </div>


                    <div className="mt-4 pt-3 border-top">

                        <div className="rems-table-secondary">
                            Published by
                        </div>

                        <div className="rems-table-primary">

                            {
                                announcement.created_by_name ||
                                "Community Administration"
                            }

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}