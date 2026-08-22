import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    BsBell,
    BsCheck2All,
} from "react-icons/bs";

import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from "../../api/notifications";


export default function NotificationCenter() {

    const [
        notifications,
        setNotifications,
    ] = useState([]);


    const [
        loading,
        setLoading,
    ] = useState(true);


    const loadNotifications =
        useCallback(
            async () => {

                try {

                    setLoading(
                        true
                    );

                    const response =
                        await getNotifications();

                    setNotifications(
                        Array.isArray(response)
                            ? response
                            : response?.results || []
                    );

                } finally {

                    setLoading(
                        false
                    );

                }

            },
            []
        );


    useEffect(() => {

        loadNotifications();

    }, [
        loadNotifications,
    ]);


    const handleRead =
        async (
            notification
        ) => {

            if (
                notification.is_read
            ) {
                return;
            }


            await markNotificationRead(
                notification.id
            );


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

        };


    const handleMarkAll =
        async () => {

            await markAllNotificationsRead();

            setNotifications(
                previous =>
                    previous.map(
                        item => ({
                            ...item,
                            is_read: true,
                        })
                    )
            );

        };


    return (

        <div className="rems-page-content">

            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">
                        COMMUNICATION
                    </div>

                    <h1 className="rems-page-title">
                        Notification Center
                    </h1>

                    <p className="rems-page-description">
                        Stay informed about activity across your oRES account.
                    </p>

                </div>


                <button
                    type="button"
                    className="rems-secondary-button"
                    onClick={
                        handleMarkAll
                    }
                >

                    <BsCheck2All />

                    Mark all as read

                </button>

            </div>


            <div className="rems-glass-card">

                {loading ? (

                    <div className="rems-loading-state">

                        <div className="spinner-border" />

                        <div className="mt-2">
                            Loading notifications...
                        </div>

                    </div>

                ) : notifications.length === 0 ? (

                    <div className="rems-empty-state">

                        <div className="rems-empty-icon">

                            <BsBell />

                        </div>

                        <div className="rems-empty-title">

                            You're all caught up

                        </div>

                        <div className="rems-empty-text">

                            New notifications will appear here.

                        </div>

                    </div>

                ) : (

                    <div>

                        {notifications.map(
                            notification => (

                                <button
                                    key={
                                        notification.id
                                    }
                                    type="button"
                                    className={`w-100 border-0 text-start d-flex gap-3 align-items-start p-3 ${
                                        !notification.is_read
                                            ? "bg-light"
                                            : "bg-transparent"
                                    }`}
                                    onClick={() =>
                                        handleRead(
                                            notification
                                        )
                                    }
                                >

                                    <div>

                                        <strong>
                                            {
                                                notification.title
                                            }
                                        </strong>

                                        <div className="small text-muted mt-1">

                                            {
                                                notification.message
                                            }

                                        </div>

                                    </div>

                                </button>

                            )
                        )}

                    </div>

                )}

            </div>

        </div>

    );

}