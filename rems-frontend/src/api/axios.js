import axios from "axios";


const API_URL =
    import.meta.env.VITE_API_URL;


const api = axios.create({

    baseURL:
        API_URL,

    headers: {
        "Content-Type":
            "application/json",
    },

});


/* ==========================================================================
   REQUEST INTERCEPTOR

   Attach the JWT access token to authenticated requests.
========================================================================== */

api.interceptors.request.use(

    (config) => {

        const accessToken =
            localStorage.getItem(
                "access"
            );


        if (accessToken) {

            config.headers =
                config.headers || {};

            config.headers.Authorization =
                `Bearer ${accessToken}`;

        }


        return config;

    },

    (error) => {

        return Promise.reject(
            error
        );

    }

);


/* ==========================================================================
   RESPONSE INTERCEPTOR

   Refresh an expired access token and retry the original request.

   IMPORTANT:
   Authentication endpoints such as:

       auth/login/
       auth/logout/

   must NOT be processed by the JWT refresh mechanism.

   A failed login must reach Login.jsx so its error message can remain
   visible to the user.
========================================================================== */

api.interceptors.response.use(

    (response) => {

        return response;

    },

    async (error) => {

        const originalRequest =
            error.config;


        /*
        |----------------------------------------------------------------------
        | No response
        |----------------------------------------------------------------------
        */

        if (!error.response) {

            return Promise.reject(
                error
            );

        }


        /*
        |----------------------------------------------------------------------
        | NEVER INTERCEPT LOGIN
        |
        | Wrong username/password should remain a normal 401 response so
        | Login.jsx can display the authentication error.
        |----------------------------------------------------------------------
        */

        const requestUrl =
            originalRequest?.url || "";


        if (
            requestUrl.includes(
                "auth/login/"
            )
        ) {

            return Promise.reject(
                error
            );

        }


        /*
        |----------------------------------------------------------------------
        | NEVER INTERCEPT LOGOUT
        |----------------------------------------------------------------------
        */

        if (
            requestUrl.includes(
                "auth/logout/"
            )
        ) {

            return Promise.reject(
                error
            );

        }


        /*
        |----------------------------------------------------------------------
        | Only process 401 responses
        |----------------------------------------------------------------------
        */

        if (
            error.response.status !== 401 ||
            originalRequest?._retry
        ) {

            return Promise.reject(
                error
            );

        }


        /*
        |----------------------------------------------------------------------
        | Do not refresh the refresh request itself
        |----------------------------------------------------------------------
        */

        if (
            requestUrl.includes(
                "token/refresh/"
            )
        ) {

            localStorage.removeItem(
                "access"
            );

            localStorage.removeItem(
                "refresh"
            );

            localStorage.removeItem(
                "user"
            );

            window.location.href =
                "/login";

            return Promise.reject(
                error
            );

        }


        originalRequest._retry =
            true;


        /*
        |----------------------------------------------------------------------
        | Get refresh token
        |----------------------------------------------------------------------
        */

        const refreshToken =
            localStorage.getItem(
                "refresh"
            );


        /*
        |----------------------------------------------------------------------
        | No refresh token
        |
        | IMPORTANT:
        | Do not redirect if this is already an authentication page request.
        | Login is already excluded above.
        |----------------------------------------------------------------------
        */

        if (!refreshToken) {

            localStorage.removeItem(
                "access"
            );

            localStorage.removeItem(
                "refresh"
            );

            localStorage.removeItem(
                "user"
            );

            window.location.href =
                "/login";

            return Promise.reject(
                error
            );

        }


        /*
        |----------------------------------------------------------------------
        | Refresh access token
        |----------------------------------------------------------------------
        */

        try {

            const response =
                await axios.post(

                    `${API_URL}token/refresh/`,

                    {
                        refresh:
                            refreshToken,
                    },

                );


            const newAccessToken =
                response.data.access;


            /*
            |------------------------------------------------------------------
            | Save new access token
            |------------------------------------------------------------------
            */

            localStorage.setItem(
                "access",
                newAccessToken
            );


            /*
            |------------------------------------------------------------------
            | Update original request
            |------------------------------------------------------------------
            */

            originalRequest.headers =
                originalRequest.headers ||
                {};

            originalRequest.headers.Authorization =
                `Bearer ${newAccessToken}`;


            /*
            |------------------------------------------------------------------
            | Retry original request
            |------------------------------------------------------------------
            */

            return api(
                originalRequest
            );

        } catch (
            refreshError
        ) {

            console.error(
                "Token refresh failed:",
                refreshError
            );


            localStorage.removeItem(
                "access"
            );

            localStorage.removeItem(
                "refresh"
            );

            localStorage.removeItem(
                "user"
            );


            window.location.href =
                "/login";


            return Promise.reject(
                refreshError
            );

        }

    }

);


export default api;