import api from "./axios";


/* ============================================================================
   ACCOUNT / PROFILE API
   ============================================================================ */


/* ============================================================================
   GET CURRENT PROFILE
   ============================================================================ */

export const getProfile = async () => {

    const response = await api.get(
        "auth/profile/"
    );

    return response.data;
};


/* ============================================================================
   UPDATE CURRENT PROFILE
   ============================================================================ */

export const updateProfile = async (
    data
) => {

    const response = await api.patch(
        "auth/profile/",
        data
    );

    return response.data;
};


/* ============================================================================
   CHANGE PASSWORD
   ============================================================================ */

export const changePassword = async (
    data
) => {

    const response = await api.post(
        "auth/change-password/",
        data
    );

    return response.data;
};