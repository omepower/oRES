export const ROLES = {
    ADMIN: "ADMIN",
    HOMEOWNER: "HOMEOWNER",
    TENANT: "TENANT",
};


export const isAdmin = (role) => {
    return role === ROLES.ADMIN;
};


export const isHomeowner = (role) => {
    return role === ROLES.HOMEOWNER;
};


export const isTenant = (role) => {
    return role === ROLES.TENANT;
};


export const isResident = (role) => {
    return (
        role === ROLES.HOMEOWNER ||
        role === ROLES.TENANT
    );
};