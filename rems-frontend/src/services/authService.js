import api from "../api/axios";
import {
    setTokens,
    clearTokens,
} from "../utils/token";


export const login = async (
    username,
    password
) => {

    const response = await api.post(
        "auth/login/",
        {
            username,
            password,
        }
    );

    const data = response.data;

    if (data.access) {
        setTokens(
            data.access,
            data.refresh
        );
    }

    if (data.user) {
        localStorage.setItem(
            "user",
            JSON.stringify(data.user)
        );
    }

    return data;
};


export const logout = async () => {

    try {
        await api.post(
            "auth/logout/"
        );
    } catch (error) {
        /*
         * Logout should still clear the local
         * authentication state even if the
         * backend request fails.
         */
        console.error(
            "Logout request failed:",
            error
        );
    }

    clearTokens();

    localStorage.removeItem("user");
};


export const getProfile = async () => {

    const response = await api.get(
        "auth/profile/"
    );

    return response.data;
};