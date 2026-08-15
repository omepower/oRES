import api from "./axios";


/* ============================================================================
   RESIDENTS API
   ============================================================================ */


/* ============================================================================
   GET RESIDENTS
   ============================================================================ */

export const getResidents = async (
    params = {}
) => {

    const response = await api.get(
        "residents/residents/",
        {
            params,
        }
    );

    return response.data;
};


/* ============================================================================
   RESIDENT USER OPTIONS
   ============================================================================ */

export const getResidentUserOptions =
    async () => {

        const response = await api.get(
            "auth/users/resident-accounts/"
        );

        return response.data;
    };


/* ============================================================================
   GET SINGLE RESIDENT
   ============================================================================ */

export const getResident = async (
    id
) => {

    const response = await api.get(
        `residents/residents/${id}/`
    );

    return response.data;
};


/* ============================================================================
   CREATE RESIDENT
   ============================================================================ */

export const createResident = async (
    data
) => {

    const response = await api.post(
        "residents/residents/",
        data
    );

    return response.data;
};


/* ============================================================================
   UPDATE RESIDENT
   ============================================================================ */

export const updateResident = async (
    id,
    data
) => {

    const response = await api.patch(
        `residents/residents/${id}/`,
        data
    );

    return response.data;
};


/* ============================================================================
   DELETE RESIDENT
   ============================================================================ */

export const deleteResident = async (
    id
) => {

    const response = await api.delete(
        `residents/residents/${id}/`
    );

    return response.data;
};


/* ============================================================================
   HOMEOWNERS
   ============================================================================ */

export const getHomeowners = async () => {

    const response = await api.get(
        "residents/residents/homeowners/"
    );

    return response.data;
};


/* ============================================================================
   TENANTS
   ============================================================================ */

export const getTenants = async () => {

    const response = await api.get(
        "residents/residents/tenants/"
    );

    return response.data;
};


/* ============================================================================
   ACTIVE RESIDENTS
   ============================================================================ */

export const getActiveResidents =
    async () => {

        const response = await api.get(
            "residents/residents/active/"
        );

        return response.data;
    };