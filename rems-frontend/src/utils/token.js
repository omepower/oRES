export const getAccessToken = () => {
    return localStorage.getItem("access");
};


export const getRefreshToken = () => {
    return localStorage.getItem("refresh");
};


export const setTokens = (
    access,
    refresh
) => {
    if (access) {
        localStorage.setItem(
            "access",
            access
        );
    }

    if (refresh) {
        localStorage.setItem(
            "refresh",
            refresh
        );
    }
};


export const clearTokens = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
};


export const hasAccessToken = () => {
    return Boolean(
        localStorage.getItem("access")
    );
};