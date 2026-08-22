import api from "./axios";


export const getNotifications = async () => {

    const response =
        await api.get(
            "notifications/"
        );

    return response.data;

};


export const getUnreadNotifications = async () => {

    const response =
        await api.get(
            "notifications/unread/"
        );

    return response.data;

};


export const getUnreadNotificationCount = async () => {

    const response =
        await api.get(
            "notifications/unread-count/"
        );

    return response.data;

};


export const markNotificationRead = async (
    id
) => {

    const response =
        await api.post(
            `notifications/${id}/mark-read/`
        );

    return response.data;

};


export const markAllNotificationsRead = async () => {

    const response =
        await api.post(
            "notifications/mark-all-read/"
        );

    return response.data;

};


export const deleteNotification = async (
    id
) => {

    await api.delete(
        `notifications/${id}/`
    );

};