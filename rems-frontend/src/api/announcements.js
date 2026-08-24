import api from "./axios";


export const getAnnouncements = async () => {

    const response =
        await api.get(
            "announcements/admin/"
        );

    return response.data;
};


export const getAnnouncementFeed = async () => {

    const response =
        await api.get(
            "announcements/feed/"
        );

    return response.data;
};


export const getAnnouncement = async (
    id
) => {

    const response =
        await api.get(
            `announcements/${id}/`
        );

    return response.data;
};


export const createAnnouncement = async (
    payload
) => {

    const response =
        await api.post(
            "announcements/",
            payload
        );

    return response.data;
};


export const updateAnnouncement = async (
    id,
    payload
) => {

    const response =
        await api.patch(
            `announcements/${id}/`,
            payload
        );

    return response.data;
};


export const publishAnnouncement = async (
    id
) => {

    const response =
        await api.post(
            `announcements/${id}/publish/`
        );

    return response.data;
};


export const archiveAnnouncement = async (
    id
) => {

    const response =
        await api.post(
            `announcements/${id}/archive/`
        );

    return response.data;
};


export const deleteAnnouncement = async (
    id
) => {

    await api.delete(
        `announcements/${id}/`
    );
};