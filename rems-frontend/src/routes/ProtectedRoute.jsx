
import {
    Navigate,
    Outlet,
    useLocation,
} from "react-router-dom";

import {
    useContext,
} from "react";

import AuthContext
    from "../context/AuthContext";


// ============================================================
// PROTECTED ROUTE
// ADMIN + HOMEOWNER + TENANT + SECURITY
// ============================================================

export default function ProtectedRoute({
    allowedRoles = [],
    children,
}) {

    const location =
        useLocation();


    const auth =
        useContext(
            AuthContext
        );


    const {
        user,
        loading,
    } = auth;


    // ========================================================
    // AUTH LOADING
    // ========================================================

    if (loading) {

        return (

            <div
                className="d-flex align-items-center justify-content-center"
                style={{
                    minHeight:
                        "100vh",
                }}
            >

                <div className="text-center">

                    <div
                        className="spinner-border"
                        role="status"
                    />

                    <div className="mt-3 text-muted">

                        Loading...

                    </div>

                </div>

            </div>

        );

    }


    // ========================================================
    // NO USER
    // ========================================================

    if (!user) {

        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from:
                        location,
                }}
            />
        );

    }


    // ========================================================
    // NORMALIZE USER ROLE
    // ========================================================

    const userRole =
        String(
            user?.role ||
            ""
        )
            .trim()
            .toUpperCase();


    const normalizedRoles =
        allowedRoles.map(
            (
                role
            ) =>
                String(
                    role
                )
                    .trim()
                    .toUpperCase()
        );


    // ========================================================
    // ROLE NOT ALLOWED
    // ========================================================

    if (
        normalizedRoles.length > 0 &&
        !normalizedRoles.includes(
            userRole
        )
    ) {


        // ----------------------------------------------------
        // ADMIN
        // ----------------------------------------------------

        if (
            userRole ===
            "ADMIN"
        ) {

            return (
                <Navigate
                    to="/admin"
                    replace
                />
            );

        }


        // ----------------------------------------------------
        // HOMEOWNER
        // ----------------------------------------------------

        if (
            userRole ===
            "HOMEOWNER"
        ) {

            return (
                <Navigate
                    to="/homeowner"
                    replace
                />
            );

        }


        // ----------------------------------------------------
        // TENANT
        // ----------------------------------------------------

        if (
            userRole ===
            "TENANT"
        ) {

            return (
                <Navigate
                    to="/tenant"
                    replace
                />
            );

        }


        // ----------------------------------------------------
        // SECURITY
        // ----------------------------------------------------

        if (
            userRole ===
                "SECURITY" ||
            userRole ===
                "SECURITY_OFFICER"
        ) {

            return (
                <Navigate
                    to="/security"
                    replace
                />
            );

        }


        // ----------------------------------------------------
        // UNKNOWN ROLE
        // ----------------------------------------------------

        return (
            <Navigate
                to="/login"
                replace
            />
        );

    }


    // ========================================================
    // AUTHORIZED
    // ========================================================

    if (children) {

        return children;

    }


    return (
        <Outlet />
    );

}


// import {
//     Navigate,
//     Outlet,
//     useLocation,
// } from "react-router-dom";

// import {
//     useContext,
// } from "react";

// import AuthContext
//     from "../context/AuthContext";


// // ============================================================
// // PROTECTED ROUTE
// // ADMIN + HOMEOWNER + TENANT
// // ============================================================

// export default function ProtectedRoute({
//     allowedRoles = [],
//     children,
// }) {

//     const location =
//         useLocation();


//     const auth =
//         useContext(
//             AuthContext
//         );


//     const {
//         user,
//         loading,
//     } = auth;


//     // ========================================================
//     // AUTH LOADING
//     // ========================================================

//     if (loading) {

//         return (

//             <div
//                 className="d-flex align-items-center justify-content-center"
//                 style={{
//                     minHeight:
//                         "100vh",
//                 }}
//             >

//                 <div className="text-center">

//                     <div
//                         className="spinner-border"
//                         role="status"
//                     />

//                     <div className="mt-3 text-muted">

//                         Loading...

//                     </div>

//                 </div>

//             </div>

//         );

//     }


//     // ========================================================
//     // NO USER
//     // ========================================================

//     if (!user) {

//         return (
//             <Navigate
//                 to="/login"
//                 replace
//                 state={{
//                     from:
//                         location,
//                 }}
//             />
//         );

//     }


//     // ========================================================
//     // NORMALIZE ROLE
//     // ========================================================

//     const userRole =
//         String(
//             user?.role ||
//             ""
//         )
//             .trim()
//             .toUpperCase();


//     const normalizedRoles =
//         allowedRoles.map(
//             (role) =>
//                 String(
//                     role
//                 )
//                     .trim()
//                     .toUpperCase()
//         );


//     // ========================================================
//     // ROLE NOT ALLOWED
//     // ========================================================

//     if (
//         normalizedRoles.length > 0 &&
//         !normalizedRoles.includes(
//             userRole
//         )
//     ) {

//         // ----------------------------------------------------
//         // ADMIN
//         // ----------------------------------------------------

//         if (
//             userRole ===
//             "ADMIN"
//         ) {

//             return (
//                 <Navigate
//                     to="/admin"
//                     replace
//                 />
//             );

//         }


//         // ----------------------------------------------------
//         // HOMEOWNER
//         // ----------------------------------------------------

//         if (
//             userRole ===
//             "HOMEOWNER"
//         ) {

//             return (
//                 <Navigate
//                     to="/homeowner"
//                     replace
//                 />
//             );

//         }


//         // ----------------------------------------------------
//         // TENANT
//         // ----------------------------------------------------

//         if (
//             userRole ===
//             "TENANT"
//         ) {

//             return (
//                 <Navigate
//                     to="/tenant"
//                     replace
//                 />
//             );

//         }


//         // ----------------------------------------------------
//         // UNKNOWN ROLE
//         // ----------------------------------------------------

//         return (
//             <Navigate
//                 to="/login"
//                 replace
//             />
//         );

//     }


   