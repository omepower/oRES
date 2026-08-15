import api from "./axios";


/* ============================================================================
   VEHICLES
   ============================================================================ */

export const getVehicles = async (
    params = {}
) => {

    const response =
        await api.get(
            "vehicles/vehicles/",
            {
                params,
            }
        );

    return response.data;
};


export const getVehicle = async (
    id
) => {

    const response =
        await api.get(
            `vehicles/vehicles/${id}/`
        );

    return response.data;
};


export const createVehicle = async (
    payload
) => {

    const response =
        await api.post(
            "vehicles/vehicles/",
            payload
        );

    return response.data;
};


export const updateVehicle = async (
    id,
    payload
) => {

    const response =
        await api.patch(
            `vehicles/vehicles/${id}/`,
            payload
        );

    return response.data;
};


export const deleteVehicle = async (
    id
) => {

    const response =
        await api.delete(
            `vehicles/vehicles/${id}/`
        );

    return response.data;
};


/* ============================================================================
   RESIDENT VEHICLES
   ============================================================================ */

export const getMyVehicles =
    async () => {

        const response =
            await api.get(
                "vehicles/vehicles/mine/"
            );

        return response.data;
    };


export const getActiveVehicles =
    async () => {

        const response =
            await api.get(
                "vehicles/vehicles/active/"
            );

        return response.data;
    };


/* ============================================================================
   MOTORIST STICKERS
   ============================================================================ */

export const getMotoristStickers =
    async (
        params = {}
    ) => {

        const response =
            await api.get(
                "vehicles/motorist-stickers/",
                {
                    params,
                }
            );

        return response.data;
    };


export const getMotoristSticker =
    async (
        id
    ) => {

        const response =
            await api.get(
                `vehicles/motorist-stickers/${id}/`
            );

        return response.data;
    };


export const createMotoristSticker =
    async (
        data
    ) => {

        const response =
            await api.post(
                "vehicles/motorist-stickers/",
                data
            );

        return response.data;
    };


export const updateMotoristSticker =
    async (
        id,
        data
    ) => {

        const response =
            await api.patch(
                `vehicles/motorist-stickers/${id}/`,
                data
            );

        return response.data;
    };


export const deleteMotoristSticker =
    async (
        id
    ) => {

        const response =
            await api.delete(
                `vehicles/motorist-stickers/${id}/`
            );

        return response.data;
    };


/* ============================================================================
   MOTORIST STICKER SPECIAL ACTIONS
   ============================================================================ */

export const getPendingMotoristStickers =
    async () => {

        const response =
            await api.get(
                "vehicles/motorist-stickers/pending/"
            );

        return response.data;
    };


export const getActiveMotoristStickers =
    async () => {

        const response =
            await api.get(
                "vehicles/motorist-stickers/active/"
            );

        return response.data;
    };


export const getMotoristStickersMine =
    async () => {

        const response =
            await api.get(
                "vehicles/motorist-stickers/mine/"
            );

        return response.data;
    };


export const getMotoristStickerAvailableSlots =
    async (
        propertyId
    ) => {

        const response =
            await api.get(
                "vehicles/motorist-stickers/available-slots/",
                {
                    params: {
                        property:
                            propertyId,
                    },
                }
            );

        return response.data;
    };


/* ============================================================================
   ADMIN STICKER LIFECYCLE
   ============================================================================ */

export const approveMotoristSticker =
    async (
        id
    ) => {

        const response =
            await api.post(
                `vehicles/motorist-stickers/${id}/approve/`
            );

        return response.data;
    };


export const revokeMotoristSticker =
    async (
        id
    ) => {

        const response =
            await api.post(
                `vehicles/motorist-stickers/${id}/revoke/`
            );

        return response.data;
    };


export const expireMotoristSticker =
    async (
        id
    ) => {

        const response =
            await api.post(
                `vehicles/motorist-stickers/${id}/expire/`
            );

        return response.data;
    };