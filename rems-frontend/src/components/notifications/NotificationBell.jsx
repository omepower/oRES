import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    BsBell,
    BsCheck2All,
    BsChevronRight,
    BsInfoCircle,
    BsShieldCheck,
    BsPeople,
    BsCarFront,
    BsBuilding,
    BsExclamationTriangle,
} from "react-icons/bs";

import {
    getNotifications,
    getUnreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
} from "../../api/notifications";


export default function NotificationBell() {

    const navigate =
        useNavigate();

    const location =
        useLocation();


    const getNotificationPath = () => {

        const pathname =
            location.pathname;


        if (
            pathname.startsWith(
                "/admin"
            )
        ) {

            return "/admin/notifications";

        }


        if (
            pathname.startsWith(
                "/homeowner"
            )
        ) {

            return "/homeowner/notifications";

        }


        if (
            pathname.startsWith(
                "/tenant"
            )
        ) {

            return "/tenant/notifications";

        }


        if (
            pathname.startsWith(
                "/security"
            )
        ) {

            return "/security/notifications";

        }


        return "/";

    };


    const [
        notifications,
        setNotifications,
    ] = useState([]);


    const [
        unreadCount,
        setUnreadCount,
    ] = useState(0);


    const [
        open,
        setOpen,
    ] = useState(false);


    const [
        loading,
        setLoading,
    ] = useState(false);


    const loadNotifications =
        useCallback(
            async () => {

                try {

                    setLoading(true);


                    const [
                        notificationData,
                        countData,
                    ] = await Promise.all([

                        getNotifications(),

                        getUnreadNotificationCount(),

                    ]);


                    const normalized =
                        Array.isArray(
                            notificationData
                        )
                            ? notificationData
                            : notificationData?.results || [];


                    setNotifications(
                        normalized.slice(
                            0,
                            8
                        )
                    );


                    setUnreadCount(
                        countData?.count || 0
                    );

                } catch (error) {

                    console.error(
                        "[Notification Center]",
                        error
                    );

                } finally {

                    setLoading(false);

                }

            },
            []
        );


    useEffect(() => {

        loadNotifications();

    }, [
        loadNotifications,
    ]);


    /*
     * Lightweight polling.
     *
     * Later we can replace this with WebSockets.
     */

    useEffect(() => {

        const interval =
            setInterval(
                () => {

                    loadNotifications();

                },
                30000
            );


        return () =>
            clearInterval(
                interval
            );

    }, [
        loadNotifications,
    ]);


    const handleNotificationClick =
        async (
            notification
        ) => {

            try {

                if (
                    !notification.is_read
                ) {

                    await markNotificationRead(
                        notification.id
                    );

                }

            } catch (error) {

                console.error(
                    "Unable to mark notification read:",
                    error
                );

            }


            setNotifications(
                previous =>
                    previous.map(
                        item =>
                            item.id === notification.id
                                ? {
                                    ...item,
                                    is_read: true,
                                }
                                : item
                    )
            );


            setUnreadCount(
                previous =>
                    Math.max(
                        0,
                        previous -
                        (
                            notification.is_read
                                ? 0
                                : 1
                        )
                    )
            );


            setOpen(
                false
            );


            if (
                notification.action_url
            ) {

                navigate(
                    notification.action_url
                );

            }

        };


    const handleMarkAllRead =
        async () => {

            try {

                await markAllNotificationsRead();

                setNotifications(
                    previous =>
                        previous.map(
                            item => ({
                                ...item,
                                is_read:
                                    true,
                            })
                        )
                );

                setUnreadCount(
                    0
                );

            } catch (error) {

                console.error(
                    "Unable to mark notifications read:",
                    error
                );

            }

        };


    const getIcon =
        (
            category
        ) => {

            switch (
                category
            ) {

                case "VISITOR":
                    return <BsPeople />;

                case "VEHICLE":
                    return <BsCarFront />;

                case "STICKER":
                    return <BsShieldCheck />;

                case "PROPERTY":
                    return <BsBuilding />;

                case "SECURITY":
                    return <BsShieldCheck />;

                case "ACCOUNT":
                    return <BsInfoCircle />;

                default:
                    return <BsBell />;

            }

        };

    


    const getPriorityClass =
        (
            priority
        ) => {

            switch (
                priority
            ) {

                case "SUCCESS":
                    return "notification-success";

                case "WARNING":
                    return "notification-warning";

                case "DANGER":
                    return "notification-danger";

                default:
                    return "notification-info";

            }

        };


    return (

        <div className="rems-notification-wrapper">


            <button
                type="button"
                className="rems-notification-button"
                onClick={() =>
                    setOpen(
                        previous =>
                            !previous
                    )
                }
                aria-label="Notifications"
            >

                <BsBell />


                {unreadCount > 0 && (

                    <span className="rems-notification-count">

                        {unreadCount > 99
                            ? "99+"
                            : unreadCount}

                    </span>

                )}

            </button>


            {open && (

                <>

                    <div
                        className="rems-notification-backdrop"
                        onClick={() =>
                            setOpen(false)
                        }
                    />


                    <div className="rems-notification-panel">


                        <div className="rems-notification-header">

                            <div>

                                <div className="rems-notification-title">

                                    Notifications

                                </div>

                                <div className="rems-notification-subtitle">

                                    Stay updated with your community activity.

                                </div>

                            </div>


                            {unreadCount > 0 && (

                                <button
                                    type="button"
                                    className="rems-notification-mark-all"
                                    onClick={
                                        handleMarkAllRead
                                    }
                                >

                                    <BsCheck2All />

                                    Mark all read

                                </button>

                            )}

                        </div>


                        <div className="rems-notification-list">


                            {loading ? (

                                <div className="rems-notification-empty">

                                    <div className="spinner-border spinner-border-sm" />

                                    <span>
                                        Loading notifications...
                                    </span>

                                </div>

                            ) : notifications.length === 0 ? (

                                <div className="rems-notification-empty">

                                    <div className="rems-notification-empty-icon">

                                        <BsBell />

                                    </div>

                                    <strong>
                                        You're all caught up
                                    </strong>

                                    <span>
                                        New community activity will appear here.
                                    </span>

                                </div>

                            ) : (

                                notifications.map(
                                    notification => (

                                        <button
                                            type="button"
                                            key={
                                                notification.id
                                            }
                                            className={`rems-notification-item ${
                                                !notification.is_read
                                                    ? "is-unread"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                handleNotificationClick(
                                                    notification
                                                )
                                            }
                                        >

                                            <div
                                                className={`rems-notification-icon ${
                                                    getPriorityClass(
                                                        notification.priority
                                                    )
                                                }`}
                                            >

                                                {
                                                    getIcon(
                                                        notification.category
                                                    )
                                                }

                                            </div>


                                            <div className="rems-notification-content">

                                                <div className="rems-notification-item-top">

                                                    <strong>

                                                        {
                                                            notification.title
                                                        }

                                                    </strong>


                                                    {!notification.is_read && (

                                                        <span className="rems-notification-unread-dot" />

                                                    )}

                                                </div>


                                                <p>

                                                    {
                                                        notification.message
                                                    }

                                                </p>


                                                <div className="rems-notification-time">

                                                    {
                                                        new Date(
                                                            notification.created_at
                                                        ).toLocaleString(
                                                            [],
                                                            {
                                                                dateStyle:
                                                                    "medium",
                                                                timeStyle:
                                                                    "short",
                                                            }
                                                        )
                                                    }

                                                </div>

                                            </div>


                                            <BsChevronRight className="rems-notification-arrow" />

                                        </button>

                                    )
                                )

                            )}

                        </div>


                        <div className="rems-notification-footer">

                            <button
                                type="button"
                                className="rems-notification-view-all"
                                onClick={() => {

                                    setOpen(
                                        false
                                    );

                                    navigate(
                                        getNotificationPath()
                                    );

                                }}
                            >

                                View Notification Center

                                <BsChevronRight />

                            </button>

                        </div>

                    </div>

                </>

            )}

        </div>

    );

}