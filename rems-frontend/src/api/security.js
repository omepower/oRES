

import api from "./axios";


/* ============================================================================
   GATES API
   ============================================================================ */

export const getGates = async (
    params = {}
) => {

    const response = await api.get(
        "security/gates/",
        {
            params,
        }
    );

    return response.data;
};


export const getGate = async (
    id
) => {

    const response = await api.get(
        `security/gates/${id}/`
    );

    return response.data;
};


export const createGate = async (
    data
) => {

    const response = await api.post(
        "security/gates/",
        data
    );

    return response.data;
};


export const updateGate = async (
    id,
    data
) => {

    const response = await api.patch(
        `security/gates/${id}/`,
        data
    );

    return response.data;
};


export const deleteGate = async (
    id
) => {

    const response = await api.delete(
        `security/gates/${id}/`
    );

    return response.data;
};




/* ============================================================
   SECURITY GUARD / GATE API
   ============================================================ */


export const getSecurityGates =
    async () => {

        const response =
            await api.get(
                "security/gates/active/"
            );

        return response.data;
    };


export const getPrimaryGate =
    async () => {

        const response =
            await api.get(
                "security/gates/primary/"
            );

        return response.data;
    };





export const scanVisitorQr =
    async (
        invitationCode,
        gateId
    ) => {

        const response =
            await api.post(
                "security/gates/visitor-scan/",
                {
                    invitation_code:
                        invitationCode,

                    gate:
                        Number(
                            gateId
                        ),
                }
            );

        return response.data;
    };

export const getVisitorsInside =
    async () => {

        const response =
            await api.get(
                "visitors/visitor-visits/inside/"
            );

        return response.data;
    };


export const checkoutVisitor =
    async (
        visitId
    ) => {

        const response =
            await api.post(
                `visitors/visitor-visits/${visitId}/checkout/`
            );

        return response.data;
    };



export const getVisitorGateHistory =
    async (
        params = {}
    ) => {

        const response =
            await api.get(
                "visitors/visitor-visits/history/",
                {
                    params,
                }
            );

        return response.data;
    };


