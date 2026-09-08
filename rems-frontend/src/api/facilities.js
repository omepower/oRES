
// src/api/facilities.js

import api from "./axios";


/* =========================================================
   FACILITIES
========================================================= */

export const getFacilities = async () => {

    const response = await api.get(
        "facilities/"
    );

    return response.data;
};


export const getActiveFacilities = async () => {

    const response = await api.get(
        "facilities/active/"
    );

    return response.data;
};


export const checkFacilityAvailability = async ({
    facility,
    booking_date,
    start_time,
    end_time,
    estimated_guests = 1,
}) => {

    try {

        const response = await api.get(
            "facilities/available/",
            {
                params: {
                    facility,
                    booking_date,
                    start_time,
                    end_time,
                    estimated_guests: Math.max(
                        1,
                        Number(
                            estimated_guests || 1
                        )
                    ),
                },
            }
        );

        return response.data;

    } catch (error) {

        if (
            error?.response?.status === 400
        ) {

            return {
                available: false,

                reason:
                    error?.response?.data?.detail ||
                    error?.response?.data?.end_time?.[0] ||
                    error?.response?.data?.estimated_guests?.[0] ||
                    error?.response?.data?.booking_date?.[0] ||
                    "The requested booking does not meet the facility requirements.",

                validation_error: true,

                errors:
                    error?.response?.data || {},
            };
        }

        throw error;
    }
};


export const createFacility = async (
    payload
) => {

    const response = await api.post(
        "facilities/",
        payload
    );

    return response.data;
};


export const updateFacility = async (
    id,
    payload
) => {

    const response = await api.patch(
        `facilities/${id}/`,
        payload
    );

    return response.data;
};


export const deleteFacility = async (
    id
) => {

    await api.delete(
        `facilities/${id}/`
    );
};


/* =========================================================
   BOOKINGS
========================================================= */

export const getFacilityBookings = async (
    params = {}
) => {

    const response = await api.get(
        "facilities/bookings/",
        {
            params,
        }
    );

    return response.data;
};


export const getMyFacilityBookings = async () => {

    const response = await api.get(
        "facilities/bookings/mine/"
    );

    return response.data;
};


export const getFacilityBooking = async (
    id
) => {

    const response = await api.get(
        `facilities/bookings/${id}/`
    );

    return response.data;
};


export const createFacilityBooking = async (
    payload
) => {

    const response = await api.post(
        "facilities/bookings/",
        payload
    );

    return response.data;
};


export const updateFacilityBooking = async (
    id,
    payload
) => {

    const response = await api.patch(
        `facilities/bookings/${id}/`,
        payload
    );

    return response.data;
};


/* =========================================================
   BOOKING LIFECYCLE
========================================================= */

export const submitFacilityBooking = async (
    id
) => {

    const response = await api.post(
        `facilities/bookings/${id}/submit/`
    );

    return response.data;
};


export const approveFacilityBooking = async (
    id
) => {

    const response = await api.post(
        `facilities/bookings/${id}/approve/`
    );

    return response.data;
};


export const rejectFacilityBooking = async (
    id,
    reason = ""
) => {

    const response = await api.post(
        `facilities/bookings/${id}/reject/`,
        {
            reason,
        }
    );

    return response.data;
};


export const cancelFacilityBooking = async (
    id,
    reason = ""
) => {

    const response = await api.post(
        `facilities/bookings/${id}/cancel/`,
        {
            reason,
        }
    );

    return response.data;
};


export const startFacilityUse = async (
    id
) => {

    const response = await api.post(
        `facilities/bookings/${id}/start-use/`
    );

    return response.data;
};


export const completeFacilityBooking = async (
    id
) => {

    const response = await api.post(
        `facilities/bookings/${id}/complete/`
    );

    return response.data;
};


export const completeFacilitySecurityClearance = async (
    id
) => {

    const response = await api.post(
        `facilities/bookings/${id}/clearance/`
    );

    return response.data;
};


export const inspectFacilityBooking = async (
    id,
    payload
) => {

    const response = await api.post(
        `facilities/bookings/${id}/inspect/`,
        payload
    );

    return response.data;
};


export const refundFacilityDeposit = async (
    id,
    payload = {}
) => {

    const response = await api.post(
        `facilities/bookings/${id}/refund/`,
        payload
    );

    return response.data;
};


/* =========================================================
   BOOKING GUESTS
========================================================= */

export const getBookingGuests = async (
    bookingId
) => {

    const response = await api.get(
        "facilities/booking-guests/",
        {
            params: {
                booking: bookingId,
            },
        }
    );

    return response.data;
};


export const createBookingGuest = async (
    payload
) => {

    const response = await api.post(
        "facilities/booking-guests/",
        {
            ...payload,

            full_name:
                String(
                    payload?.full_name || ""
                ).trim(),

            vehicle_plate_number:
                String(
                    payload?.vehicle_plate_number || ""
                )
                    .trim()
                    .toUpperCase(),

            vehicle_model:
                String(
                    payload?.vehicle_model || ""
                ).trim(),
        }
    );

    return response.data;
};


export const updateBookingGuest = async (
    id,
    payload
) => {

    const response = await api.patch(
        `facilities/booking-guests/${id}/`,
        {
            ...payload,

            full_name:
                payload?.full_name !== undefined
                    ? String(
                        payload.full_name || ""
                    ).trim()
                    : undefined,

            vehicle_plate_number:
                payload?.vehicle_plate_number !== undefined
                    ? String(
                        payload.vehicle_plate_number || ""
                    )
                        .trim()
                        .toUpperCase()
                    : undefined,

            vehicle_model:
                payload?.vehicle_model !== undefined
                    ? String(
                        payload.vehicle_model || ""
                    ).trim()
                    : undefined,
        }
    );

    return response.data;
};


export const deleteBookingGuest = async (
    id
) => {

    await api.delete(
        `facilities/booking-guests/${id}/`
    );
};


export const reorderBookingGuests = async (
    bookingId,
    guestIds
) => {

    const response = await api.post(
        "facilities/booking-guests/reorder/",
        {
            booking: bookingId,
            guest_ids: guestIds,
        }
    );

    return response.data;
};


/* =========================================================
   XLSX GUEST LIST
========================================================= */

export const importBookingGuestList = async (
    bookingId,
    file
) => {

    if (!bookingId) {

        throw new Error(
            "A booking ID is required."
        );
    }

    if (
        !(file instanceof File)
    ) {

        throw new Error(
            "Please select a valid XLSX guest list file."
        );
    }

    const filename = String(
        file.name || ""
    ).toLowerCase();

    if (
        !filename.endsWith(".xlsx")
    ) {

        throw new Error(
            "Only .xlsx guest list files are accepted."
        );
    }

    const formData =
        new FormData();

    formData.append(
        "file",
        file,
        file.name
    );

    const response = await api.post(
        `facilities/bookings/${bookingId}/guest-list/import/`,
        formData,
        {
            headers: {
                "Content-Type":
                    "multipart/form-data",
            },
        }
    );

    return response.data;
};


/* =========================================================
   PAYMENTS
========================================================= */

export const getBookingPayments = async (
    bookingId
) => {

    const response = await api.get(
        "facilities/payments/",
        {
            params: {
                booking: bookingId,
            },
        }
    );

    return response.data;
};


export const createBookingPayment = async (
    payload
) => {

    if (!payload?.booking) {

        throw new Error(
            "A booking ID is required for payment."
        );
    }

    const formData =
        new FormData();

    formData.append(
        "booking",
        String(
            payload.booking
        )
    );

    formData.append(
        "payment_type",
        "BOOKING_TOTAL"
    );

    if (
        payload.payment_method !==
            undefined &&
        payload.payment_method !==
            null
    ) {

        formData.append(
            "payment_method",
            String(
                payload.payment_method
            )
        );
    }

    if (
        payload.amount !==
            undefined &&
        payload.amount !==
            null &&
        payload.amount !== ""
    ) {

        formData.append(
            "amount",
            String(
                payload.amount
            )
        );
    }

    if (
        payload.reference_number !==
            undefined &&
        payload.reference_number !==
            null
    ) {

        formData.append(
            "reference_number",
            String(
                payload.reference_number
            ).trim()
        );
    }

    if (
        payload.proof instanceof File
    ) {

        formData.append(
            "proof",
            payload.proof,
            payload.proof.name
        );

    } else if (
        payload.proof
    ) {

        throw new Error(
            "Payment proof must be a valid file."
        );
    }

    const response = await api.post(
        "facilities/payments/",
        formData,
        {
            headers: {
                "Content-Type":
                    "multipart/form-data",
            },
        }
    );

    return response.data;
};


export const updateBookingPayment = async (
    id,
    payload
) => {

    const formData =
        new FormData();

    formData.append(
        "payment_type",
        "BOOKING_TOTAL"
    );

    if (
        payload?.booking !==
            undefined &&
        payload?.booking !==
            null
    ) {

        formData.append(
            "booking",
            String(
                payload.booking
            )
        );
    }

    if (
        payload?.payment_method !==
            undefined &&
        payload?.payment_method !==
            null
    ) {

        formData.append(
            "payment_method",
            String(
                payload.payment_method
            )
        );
    }

    if (
        payload?.amount !==
            undefined &&
        payload?.amount !==
            null &&
        payload?.amount !== ""
    ) {

        formData.append(
            "amount",
            String(
                payload.amount
            )
        );
    }

    if (
        payload?.reference_number !==
            undefined &&
        payload?.reference_number !==
            null
    ) {

        formData.append(
            "reference_number",
            String(
                payload.reference_number
            ).trim()
        );
    }

    if (
        payload?.proof instanceof File
    ) {

        formData.append(
            "proof",
            payload.proof,
            payload.proof.name
        );
    }

    const response = await api.patch(
        `facilities/payments/${id}/`,
        formData,
        {
            headers: {
                "Content-Type":
                    "multipart/form-data",
            },
        }
    );

    return response.data;
};


export const verifyBookingPayment = async (
    id
) => {

    const response = await api.post(
        `facilities/payments/${id}/verify/`
    );

    return response.data;
};


export const rejectBookingPayment = async (
    id
) => {

    const response = await api.post(
        `facilities/payments/${id}/reject/`
    );

    return response.data;
};


/* =========================================================
   INSPECTIONS
========================================================= */

export const getFacilityInspections = async (
    bookingId = null
) => {

    const response = await api.get(
        "facilities/inspections/",
        bookingId
            ? {
                params: {
                    booking: bookingId,
                },
            }
            : undefined
    );

    return response.data;
};


export const getFacilityInspection = async (
    id
) => {

    const response = await api.get(
        `facilities/inspections/${id}/`
    );

    return response.data;
};
