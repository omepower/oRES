import api from "./axios";


/* ============================================================================
   PROPERTIES API
   ============================================================================ */


/* ============================================================================
   GET PROPERTIES
   ============================================================================ */

export const getProperties = async (
    params = {}
) => {

    const response = await api.get(
        "properties/properties/",
        {
            params,
        }
    );

    return response.data;
};


/* ============================================================================
   GET SINGLE PROPERTY
   ============================================================================ */

export const getProperty = async (
    id
) => {

    const response = await api.get(
        `properties/properties/${id}/`
    );

    return response.data;
};


/* ============================================================================
   CREATE PROPERTY
   ============================================================================ */

export const createProperty = async (
    data
) => {

    const response = await api.post(
        "properties/properties/",
        data
    );

    return response.data;
};


/* ============================================================================
   UPDATE PROPERTY
   ============================================================================ */

export const updateProperty = async (
    id,
    data
) => {

    const response = await api.patch(
        `properties/properties/${id}/`,
        data
    );

    return response.data;
};


/* ============================================================================
   DELETE PROPERTY
   ============================================================================ */

export const deleteProperty = async (
    id
) => {

    const response = await api.delete(
        `properties/properties/${id}/`
    );

    return response.data;
};


/* ============================================================================
   PROPERTY OWNERSHIP HISTORY
   ============================================================================ */

export const getPropertyOwnershipHistory =
    async (
        id
    ) => {

        const response = await api.get(
            `properties/properties/${id}/ownership-history/`
        );

        return response.data;
    };


/* ============================================================================
   PROPERTY OCCUPANCY HISTORY
   ============================================================================ */

export const getPropertyOccupancyHistory =
    async (
        id
    ) => {

        const response = await api.get(
            `properties/properties/${id}/occupancy-history/`
        );

        return response.data;
    };


/* ============================================================================
   CURRENT OWNER
   ============================================================================ */

export const getCurrentPropertyOwner =
    async (
        id
    ) => {

        const response = await api.get(
            `properties/properties/${id}/current-owner/`
        );

        return response.data;
    };


/* ============================================================================
   CURRENT OCCUPANT
   ============================================================================ */

export const getCurrentPropertyOccupant =
    async (
        id
    ) => {

        const response = await api.get(
            `properties/properties/${id}/current-occupant/`
        );

        return response.data;
    };


/* ============================================================================
   PROPERTY OCCUPANCIES
   ============================================================================ */

export const getPropertyOccupancies =
    async (
        params = {}
    ) => {

        const response = await api.get(
            "properties/property-occupancies/",
            {
                params,
            }
        );

        return response.data;
    };


/* ============================================================================
   CREATE PROPERTY OCCUPANCY
   ============================================================================ */

export const createPropertyOccupancy =
    async (
        data
    ) => {

        const response = await api.post(
            "properties/property-occupancies/",
            data
        );

        return response.data;
    };


/* ============================================================================
   UPDATE PROPERTY OCCUPANCY
   ============================================================================ */

export const updatePropertyOccupancy =
    async (
        id,
        data
    ) => {

        const response = await api.patch(
            `properties/property-occupancies/${id}/`,
            data
        );

        return response.data;
    };


/* ============================================================================
   DELETE PROPERTY OCCUPANCY
   ============================================================================ */

export const deletePropertyOccupancy =
    async (
        id
    ) => {

        const response = await api.delete(
            `properties/property-occupancies/${id}/`
        );

        return response.data;
    };


/* ============================================================================
   ACTIVE PROPERTY OCCUPANCIES
   ============================================================================ */

export const getActivePropertyOccupancies =
    async () => {

        const response = await api.get(
            "properties/property-occupancies/active/"
        );

        return response.data;
    };


/* ============================================================================
   PROPERTY OWNERSHIP
   ============================================================================ */

export const getPropertyOwnerships =
    async (
        params = {}
    ) => {

        const response = await api.get(
            "properties/property-ownerships/",
            {
                params,
            }
        );

        return response.data;
    };


/* ============================================================================
   CREATE PROPERTY OWNERSHIP
   ============================================================================ */

export const createPropertyOwnership =
    async (
        data
    ) => {

        const response = await api.post(
            "properties/property-ownerships/",
            data
        );

        return response.data;
    };


/* ============================================================================
   UPDATE PROPERTY OWNERSHIP
   ============================================================================ */

export const updatePropertyOwnership =
    async (
        id,
        data
    ) => {

        const response = await api.patch(
            `properties/property-ownerships/${id}/`,
            data
        );

        return response.data;
    };


/* ============================================================================
   DELETE PROPERTY OWNERSHIP
   ============================================================================ */

export const deletePropertyOwnership =
    async (
        id
    ) => {

        const response = await api.delete(
            `properties/property-ownerships/${id}/`
        );

        return response.data;
    };


/* ============================================================================
   ACTIVE PROPERTY OWNERSHIPS
   ============================================================================ */

export const getActivePropertyOwnerships =
    async () => {

        const response = await api.get(
            "properties/property-ownerships/active/"
        );

        return response.data;
    };


/* ============================================================================
   RESIDENT PROPERTIES
   ============================================================================ */

/*
 * Returns properties associated with the authenticated resident.
 *
 * HOMEOWNER:
 *     Active properties owned by the homeowner.
 *
 * TENANT:
 *     Property where the tenant has active occupancy.
 *
 * ADMIN:
 *     Backend may return all properties if permitted.
 */

export const getMyProperties = async () => {

    const response = await api.get(
        "properties/mine/"
    );

    return response.data;
};



export const getMyProperty = async (
    id
) => {

    const response = await api.get(
        `properties/properties/${id}/`
    );

    return response.data;
};


