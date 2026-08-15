import axios from "axios";

const api = axios.create({
baseURL: import.meta.env.VITE_API_URL,


headers: {
    "Content-Type": "application/json",
},


});

 /*                                                                         |
| -------------------------------------------------------------------------- |
| Request Interceptor                                                        |
| -------------------------------------------------------------------------- |
|                                                                            |
| Attach the JWT access token to authenticated requests.                     |
|                                                                            |
| */                                                                         

api.interceptors.request.use(
(config) => {


    const accessToken =
        localStorage.getItem("access");


    if (accessToken) {

        config.headers.Authorization =
            `Bearer ${accessToken}`;

    }


    return config;
},

(error) => {

    return Promise.reject(error);

}


);

/*                                                                         |
| -------------------------------------------------------------------------- |
| Response Interceptor                                                       |
| -------------------------------------------------------------------------- |
|                                                                            |
| Refresh an expired access token and retry                                  |
| the original request.                                                      |
|                                                                            |
| */                                                                         

api.interceptors.response.use(


(response) => {

    return response;

},

async (error) => {

    const originalRequest =
        error.config;


    /*
    |--------------------------------------------------------------------------
    | No response
    |--------------------------------------------------------------------------
    */

    if (!error.response) {

        return Promise.reject(error);

    }


    /*
    |--------------------------------------------------------------------------
    | Only process 401 responses
    |--------------------------------------------------------------------------
    */

    if (
        error.response.status !== 401 ||
        originalRequest?._retry
    ) {

        return Promise.reject(error);

    }


    /*
    |--------------------------------------------------------------------------
    | Do not refresh the refresh request itself
    |--------------------------------------------------------------------------
    */

    if (
        originalRequest?.url?.includes(
            "token/refresh/"
        )
    ) {

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");

        window.location.href = "/login";

        return Promise.reject(error);

    }


    originalRequest._retry = true;


    /*
    |--------------------------------------------------------------------------
    | Get refresh token
    |--------------------------------------------------------------------------
    */

    const refreshToken =
        localStorage.getItem("refresh");


    if (!refreshToken) {

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");

        window.location.href = "/login";

        return Promise.reject(error);

    }


    /*
    |--------------------------------------------------------------------------
    | Request new access token
    |--------------------------------------------------------------------------
    */

    try {

        const response =
            await axios.post(

                `${import.meta.env.VITE_API_URL}token/refresh/`,

                {
                    refresh: refreshToken,
                }

            );


        const newAccessToken =
            response.data.access;


        localStorage.setItem(
            "access",
            newAccessToken
        );


        /*
        |--------------------------------------------------------------------------
        | Update original request
        |--------------------------------------------------------------------------
        */

        originalRequest.headers.Authorization =
            `Bearer ${newAccessToken}`;


        /*
        |--------------------------------------------------------------------------
        | Retry original request
        |--------------------------------------------------------------------------
        */

        return api(
            originalRequest
        );


    } catch (refreshError) {

        console.error(
            "Token refresh failed:",
            refreshError
        );


        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");

        window.location.href = "/login";

        return Promise.reject(
            refreshError
        );

    }

}


);

export default api;
