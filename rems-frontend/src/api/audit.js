import api from "./axios";


export const getAuditEvents = async (params = {}) => {
    const response = await api.get("audit/audit/events/", { params });
    return response.data;
};


export const getAuditEvent = async (id) => {
    const response = await api.get(`audit/audit/events/${id}/`);
    return response.data;
};


export const getAuditSummary = async (params = {}) => {
    const response = await api.get("audit/audit/events/summary/", { params });
    return response.data;
};


export const getRecentAuditEvents = async (params = {}) => {
    const response = await api.get("audit/audit/events/recent/", { params });
    return response.data;
};
