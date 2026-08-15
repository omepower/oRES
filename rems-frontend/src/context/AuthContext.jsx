import {
createContext,
useContext,
useEffect,
useState,
} from "react";

import {
login as loginService,
logout as logoutService,
getProfile,
} from "../services/authService";

import {
getAccessToken,
clearTokens,
} from "../utils/token";

const AuthContext = createContext(null);

/*                                                                         |
| -------------------------------------------------------------------------- |
| AUTH PROVIDER                                                              |
| -------------------------------------------------------------------------- |
| */                                                                         

export const AuthProvider = ({ children }) => {


const [user, setUser] = useState(null);

const [loading, setLoading] = useState(true);


/*
|--------------------------------------------------------------------------
| RESTORE AUTHENTICATION
|--------------------------------------------------------------------------
*/

useEffect(() => {

    const restoreAuthentication = async () => {

        const accessToken =
            getAccessToken();

        const storedUser =
            localStorage.getItem("user");


        if (!accessToken) {

            setLoading(false);

            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Restore cached user
        |--------------------------------------------------------------------------
        */

        if (storedUser) {

            try {

                const parsedUser =
                    JSON.parse(
                        storedUser
                    );

                setUser(
                    parsedUser
                );

            } catch (error) {

                console.error(
                    "Invalid stored user:",
                    error
                );

                localStorage.removeItem(
                    "user"
                );

            }
        }


        /*
        |--------------------------------------------------------------------------
        | Verify user against Django
        |--------------------------------------------------------------------------
        */

        try {

            const profile =
                await getProfile();


            setUser(
                profile
            );


            localStorage.setItem(
                "user",
                JSON.stringify(
                    profile
                )
            );

        } catch (error) {

            console.error(
                "Authentication restoration failed:",
                error
            );


            clearTokens();

            localStorage.removeItem(
                "user"
            );

            setUser(null);

        } finally {

            setLoading(false);

        }

    };


    restoreAuthentication();

}, []);


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

const login = async (
    username,
    password
) => {

    const data =
        await loginService(
            username,
            password
        );


    const authenticatedUser =
        data?.user;


    if (!authenticatedUser) {

        throw new Error(
            "Login succeeded but no user information was returned."
        );

    }


    setUser(
        authenticatedUser
    );


    localStorage.setItem(
        "user",
        JSON.stringify(
            authenticatedUser
        )
    );


    /*
    |--------------------------------------------------------------------------
    | Return the complete authentication response.
    |--------------------------------------------------------------------------
    */

    return data;

};


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

const logout = async () => {

    try {

        await logoutService();

    } finally {

        clearTokens();

        localStorage.removeItem(
            "user"
        );

        setUser(null);
    }

};


/*
|--------------------------------------------------------------------------
| AUTHENTICATION STATE
|--------------------------------------------------------------------------
*/

const isAuthenticated =
    Boolean(user);


const role =
    user?.role || null;


return (
    <AuthContext.Provider
        value={{
            user,
            role,
            loading,
            isAuthenticated,
            login,
            logout,
        }}
    >

        {children}

    </AuthContext.Provider>
);


};

 /*                                                                         |
| -------------------------------------------------------------------------- |
| useAuth                                                                    |
| -------------------------------------------------------------------------- |
|                                                                            |
| THIS IS THE NAMED EXPORT THAT useAuth.js IMPORTS.                          |
|                                                                            |
| */                                                                         

export const useAuth = () => {


const context =
    useContext(
        AuthContext
    );


if (!context) {

    throw new Error(
        "useAuth must be used inside an AuthProvider."
    );

}


return context;


};

export default AuthContext;
