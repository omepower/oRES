import api from "./axios";


/* ============================================================================
   VISITOR INVITATIONS
   ============================================================================ */

export const getVisitorInvitations = async (
    params = {}
) => {

    const response = await api.get(
        "visitors/visitor-invitations/",
        {
            params,
        }
    );

    return response.data;
};


export const getVisitorInvitation = async (
    id
) => {

    const response = await api.get(
        `visitors/visitor-invitations/${id}/`
    );

    return response.data;
};


export const createVisitorInvitation = async (
    invitationData
) => {

    const response = await api.post(
        "visitors/visitor-invitations/",
        invitationData
    );

    return response.data;
};


export const updateVisitorInvitation = async (
    id,
    invitationData
) => {

    const response = await api.patch(
        `visitors/visitor-invitations/${id}/`,
        invitationData
    );

    return response.data;
};


export const cancelVisitorInvitation = async (
    id
) => {

    const response = await api.post(
        `visitors/visitor-invitations/${id}/cancel/`
    );

    return response.data;
};


export const generateVisitorQr = async (
    id
) => {

    const response = await api.post(
        `visitors/visitor-invitations/${id}/generate-qr/`
    );

    return response.data;
};


export const getPendingVisitorInvitations =
    async () => {

        const response = await api.get(
            "visitors/visitor-invitations/pending/"
        );

        return response.data;
    };


export const getTodayVisitorInvitations =
    async () => {

        const response = await api.get(
            "visitors/visitor-invitations/today/"
        );

        return response.data;
    };


/* ============================================================================
   VISITOR VISITS
   ============================================================================ */

export const getVisitorVisits = async (
    params = {}
) => {

    const response = await api.get(
        "visitors/visitor-visits/",
        {
            params,
        }
    );

    return response.data;
};


export const getVisitorsInside = async () => {

    const response = await api.get(
        "visitors/visitor-visits/inside/"
    );

    return response.data;
};


export const getCompletedVisitorVisits =
    async () => {

        const response = await api.get(
            "visitors/visitor-visits/completed/"
        );

        return response.data;
    };

/* ============================================================================
   MY VISITOR INVITATIONS
   ============================================================================ */

export const getMyVisitorInvitations = async (
    params = {}
) => {

    const response = await api.get(
        "visitors/mine/",
        {
            params,
        }
    );

    return response.data;
};


export const getMyVisitorVisits = async (
    params = {}
) => {

    const response = await api.get(
        "visitors/visitor-visits/",
        {
            params,
        }
    );

    return response.data;
};