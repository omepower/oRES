import {
    Navigate,
    Route,
    Routes,
} from "react-router-dom";


// ============================================================
// PUBLIC
// ============================================================

import LandingPage
    from "../pages/LandingPage";

import Login
    from "../pages/auth/Login";


// ============================================================
// LAYOUTS
// ============================================================

import AdminLayout
    from "../layouts/AdminLayout";

import ResidentLayout
    from "../layouts/ResidentLayout";

import SecurityLayout
    from "../layouts/SecurityLayout";


// ============================================================
// ROUTE GUARD
// ============================================================

import ProtectedRoute
    from "./ProtectedRoute";


// ============================================================
// ADMIN PAGES
// ============================================================

import AdminDashboard
    from "../pages/admin/AdminDashboard";

import Visitors
    from "../pages/admin/Visitors";

import Residents
    from "../pages/admin/Residents";

import Properties
    from "../pages/admin/Properties";

import Vehicles
    from "../pages/admin/Vehicles";

import Stickers
    from "../pages/admin/Stickers";

import Gates
    from "../pages/admin/Gates";

import Occupancy
    from "../pages/admin/Occupancy";

import Announcements
    from "../pages/admin/Announcements";

// ============================================================
// SHARED RESIDENT PAGES
// ============================================================

import ResidentDashboard
    from "../pages/resident/ResidentDashboard";

import ResidentVisitors
    from "../pages/resident/ResidentVisitors";

import ResidentVehicles
    from "../pages/resident/ResidentVehicles";

import ResidentStickers
    from "../pages/resident/ResidentStickers";

import ResidentProperties
    from "../pages/resident/ResidentProperties";

import HomeownerOccupancy
    from "../pages/resident/HomeownerOccupancy";

import ResidentAnnouncements
    from "../pages/resident/ResidentAnnouncements";

import ResidentAnnouncementDetails
    from "../pages/resident/ResidentAnnouncementDetails";


// ============================================================
// SECURITY PAGES
// ============================================================

import SecurityDashboard
    from "../pages/security/SecurityDashboard";

import VisitorScanner
    from "../pages/security/VisitorScanner";

import VisitorsInside
    from "../pages/security/VisitorsInside";

import GateHistory
    from "../pages/security/GateHistory";


// ============================================================
// NOTIFICATION CENTER
// Shared page, rendered inside the active portal layout.
// ============================================================

import NotificationCenter
    from "../pages/notifications/NotificationCenter";


// ============================================================
// APP ROUTES
// ============================================================

export default function AppRoutes() {

    return (

        <Routes>


            {/* ==================================================
                PUBLIC ROUTES
            ================================================== */}

            <Route
                path="/"
                element={
                    <LandingPage />
                }
            />


            <Route
                path="/login"
                element={
                    <Login />
                }
            />


            {/* ==================================================
                ADMINISTRATION
            ================================================== */}

            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={[
                            "ADMIN",
                        ]}
                    />
                }
            >

                <Route
                    path="/admin"
                    element={
                        <AdminLayout />
                    }
                >


                    {/* =================================================
                        DASHBOARD
                    ================================================= */}

                    <Route
                        index
                        element={
                            <AdminDashboard />
                        }
                    />


                    {/* =================================================
                        VISITORS
                    ================================================= */}

                    <Route
                        path="visitors"
                        element={
                            <Visitors />
                        }
                    />


                    {/* =================================================
                        RESIDENTS
                    ================================================= */}

                    <Route
                        path="residents"
                        element={
                            <Residents />
                        }
                    />


                    {/* =================================================
                        PROPERTIES
                    ================================================= */}

                    <Route
                        path="properties"
                        element={
                            <Properties />
                        }
                    />


                    {/* =================================================
                        VEHICLES
                    ================================================= */}

                    <Route
                        path="vehicles"
                        element={
                            <Vehicles />
                        }
                    />


                    {/* =================================================
                        MOTORIST STICKERS
                    ================================================= */}

                    <Route
                        path="stickers"
                        element={
                            <Stickers />
                        }
                    />


                    {/* =================================================
                        GATES
                    ================================================= */}

                    <Route
                        path="gates"
                        element={
                            <Gates />
                        }
                    />


                    {/* =================================================
                        OCCUPANCY
                    ================================================= */}

                    <Route
                        path="occupancy"
                        element={
                            <Occupancy />
                        }
                    />


                    {/* =================================================
                        NOTIFICATION CENTER
                    ================================================= */}

                    <Route
                        path="notifications"
                        element={
                            <NotificationCenter />
                        }
                    />

                    {/* /*==========================================
                                 ANNOUNCEMENT   
                    =============================================*/ }

                    <Route
                        path="announcements"
                        element={
                            <Announcements />
                        }
                    />

                </Route>

            </Route>


            {/* ==================================================
                HOMEOWNER PORTAL
            ================================================== */}

            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={[
                            "HOMEOWNER",
                        ]}
                    />
                }
            >

                <Route
                    path="/homeowner"
                    element={
                        <ResidentLayout />
                    }
                >


                    {/* =================================================
                        DASHBOARD
                    ================================================= */}

                    <Route
                        index
                        element={
                            <ResidentDashboard />
                        }
                    />


                    {/* =================================================
                        VISITORS
                    ================================================= */}

                    <Route
                        path="visitors"
                        element={
                            <ResidentVisitors />
                        }
                    />


                    {/* =================================================
                        VEHICLES
                    ================================================= */}

                    <Route
                        path="vehicles"
                        element={
                            <ResidentVehicles />
                        }
                    />


                    {/* =================================================
                        STICKERS
                    ================================================= */}

                    <Route
                        path="stickers"
                        element={
                            <ResidentStickers />
                        }
                    />


                    {/* =================================================
                        PROPERTIES
                    ================================================= */}

                    <Route
                        path="properties"
                        element={
                            <ResidentProperties />
                        }
                    />


                    {/* =================================================
                        OCCUPANCY
                    ================================================= */}

                    <Route
                        path="occupancy"
                        element={
                            <HomeownerOccupancy />
                        }
                    />


                    {/* =================================================
                        NOTIFICATION CENTER
                    ================================================= */}

                    <Route
                        path="notifications"
                        element={
                            <NotificationCenter />
                        }
                    />
                     
                     {/* =======================================
                             ANNOUNCEMENT   
                    ========================================== */}

                    <Route
                        path="announcements"
                        element={
                            <ResidentAnnouncements />
                        }
                    />

                    <Route
                        path="announcements/:id"
                        element={
                            <ResidentAnnouncementDetails />
                        }
                    />

                </Route>

            </Route>


            {/* ==================================================
                TENANT PORTAL
            ================================================== */}

            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={[
                            "TENANT",
                        ]}
                    />
                }
            >

                <Route
                    path="/tenant"
                    element={
                        <ResidentLayout />
                    }
                >


                    {/* =================================================
                        DASHBOARD
                    ================================================= */}

                    <Route
                        index
                        element={
                            <ResidentDashboard />
                        }
                    />


                    {/* =================================================
                        VISITORS
                    ================================================= */}

                    <Route
                        path="visitors"
                        element={
                            <ResidentVisitors />
                        }
                    />


                    {/* =================================================
                        VEHICLES
                    ================================================= */}

                    <Route
                        path="vehicles"
                        element={
                            <ResidentVehicles />
                        }
                    />


                    {/* =================================================
                        STICKERS
                    ================================================= */}

                    <Route
                        path="stickers"
                        element={
                            <ResidentStickers />
                        }
                    />


                    {/* =================================================
                        PROPERTY
                    ================================================= */}

                    <Route
                        path="property"
                        element={
                            <ResidentProperties />
                        }
                    />


                    {/* =================================================
                        NOTIFICATION CENTER
                    ================================================= */}

                    <Route
                        path="notifications"
                        element={
                            <NotificationCenter />
                        }
                    />
                    
                    {/* ==========================================
                              ANNOUNCEMENT    
                    ============================================ */}

                    <Route
                        path="announcements"
                        element={
                            <ResidentAnnouncements />
                        }
                    />

                    <Route
                        path="announcements/:id"
                        element={
                            <ResidentAnnouncementDetails />
                        }
                    />

                </Route>

            </Route>


            {/* ==================================================
                SECURITY PORTAL
            ================================================== */}

            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={[
                            "SECURITY",
                            "SECURITY_OFFICER",
                            "ADMIN",
                        ]}
                    />
                }
            >

                <Route
                    path="/security"
                    element={
                        <SecurityLayout />
                    }
                >


                    {/* =================================================
                        DASHBOARD
                    ================================================= */}

                    <Route
                        index
                        element={
                            <SecurityDashboard />
                        }
                    />


                    {/* =================================================
                        QR SCANNER
                    ================================================= */}

                    <Route
                        path="scan"
                        element={
                            <VisitorScanner />
                        }
                    />


                    {/* =================================================
                        VISITORS INSIDE
                    ================================================= */}

                    <Route
                        path="inside"
                        element={
                            <VisitorsInside />
                        }
                    />


                    {/* =================================================
                        GATE HISTORY
                    ================================================= */}

                    <Route
                        path="history"
                        element={
                            <GateHistory />
                        }
                    />


                    {/* =================================================
                        NOTIFICATION CENTER
                    ================================================= */}

                    <Route
                        path="notifications"
                        element={
                            <NotificationCenter />
                        }
                    />

                </Route>

            </Route>


            {/* ==================================================
                UNKNOWN ROUTES
            ================================================== */}

            <Route
                path="*"
                element={
                    <Navigate
                        to="/"
                        replace
                    />
                }
            />

        </Routes>

    );

}

// import {
//     Navigate,
//     Route,
//     Routes,
// } from "react-router-dom";


// // ============================================================
// // PUBLIC
// // ============================================================

// import LandingPage
//     from "../pages/LandingPage";

// import Login
//     from "../pages/auth/Login";


// // ============================================================
// // LAYOUTS
// // ============================================================

// import AdminLayout
//     from "../layouts/AdminLayout";

// import ResidentLayout
//     from "../layouts/ResidentLayout";

// import SecurityLayout
//     from "../layouts/SecurityLayout";


// // ============================================================
// // ROUTE GUARD
// // ============================================================

// import ProtectedRoute
//     from "./ProtectedRoute";


// // ============================================================
// // ADMIN PAGES
// // ============================================================

// import AdminDashboard
//     from "../pages/admin/AdminDashboard";

// import Visitors
//     from "../pages/admin/Visitors";

// import Residents
//     from "../pages/admin/Residents";

// import Properties
//     from "../pages/admin/Properties";

// import Vehicles
//     from "../pages/admin/Vehicles";

// import Stickers
//     from "../pages/admin/Stickers";

// import Gates
//     from "../pages/admin/Gates";

// import Occupancy
//     from "../pages/admin/Occupancy";


// // ============================================================
// // SHARED RESIDENT PAGES
// // ============================================================

// import ResidentDashboard
//     from "../pages/resident/ResidentDashboard";

// import ResidentVisitors
//     from "../pages/resident/ResidentVisitors";

// import ResidentVehicles
//     from "../pages/resident/ResidentVehicles";

// import ResidentStickers
//     from "../pages/resident/ResidentStickers";

// import ResidentProperties
//     from "../pages/resident/ResidentProperties";

// import HomeownerOccupancy
//     from "../pages/resident/HomeownerOccupancy";


// // ============================================================
// // SECURITY PAGES
// // ============================================================

// import SecurityDashboard
//     from "../pages/security/SecurityDashboard";

// import VisitorScanner
//     from "../pages/security/VisitorScanner";

// import VisitorsInside
//     from "../pages/security/VisitorsInside";

// import GateHistory
//     from "../pages/security/GateHistory";


// // ============================================================
// // APP ROUTES
// // ============================================================

// export default function AppRoutes() {

//     return (

//         <Routes>


//             {/* ==================================================
//                 PUBLIC ROUTES
//             ================================================== */}

//             <Route
//                 path="/"
//                 element={
//                     <LandingPage />
//                 }
//             />


//             <Route
//                 path="/login"
//                 element={
//                     <Login />
//                 }
//             />


//             {/* ==================================================
//                 ADMINISTRATION
//             ================================================== */}

//             <Route
//                 element={
//                     <ProtectedRoute
//                         allowedRoles={[
//                             "ADMIN",
//                         ]}
//                     />
//                 }
//             >

//                 <Route
//                     path="/admin"
//                     element={
//                         <AdminLayout />
//                     }
//                 >

//                     {/* ADMIN DASHBOARD */}

//                     <Route
//                         index
//                         element={
//                             <AdminDashboard />
//                         }
//                     />


//                     {/* VISITORS */}

//                     <Route
//                         path="visitors"
//                         element={
//                             <Visitors />
//                         }
//                     />


//                     {/* RESIDENTS */}

//                     <Route
//                         path="residents"
//                         element={
//                             <Residents />
//                         }
//                     />


//                     {/* PROPERTIES */}

//                     <Route
//                         path="properties"
//                         element={
//                             <Properties />
//                         }
//                     />


//                     {/* VEHICLES */}

//                     <Route
//                         path="vehicles"
//                         element={
//                             <Vehicles />
//                         }
//                     />


//                     {/* MOTORIST STICKERS */}

//                     <Route
//                         path="stickers"
//                         element={
//                             <Stickers />
//                         }
//                     />


//                     {/* GATES */}

//                     <Route
//                         path="gates"
//                         element={
//                             <Gates />
//                         }
//                     />


//                     {/* OCCUPANCY */}

//                     <Route
//                         path="occupancy"
//                         element={
//                             <Occupancy />
//                         }
//                     />

//                 </Route>

//             </Route>


//             {/* ==================================================
//                 HOMEOWNER PORTAL
//                 ResidentDashboard serves this route directly.
//             ================================================== */}

//             <Route
//                 element={
//                     <ProtectedRoute
//                         allowedRoles={[
//                             "HOMEOWNER",
//                         ]}
//                     />
//                 }
//             >

//                 <Route
//                     path="/homeowner"
//                     element={
//                         <ResidentLayout />
//                     }
//                 >

//                     {/* SHARED RESIDENT DASHBOARD */}

//                     <Route
//                         index
//                         element={
//                             <ResidentDashboard />
//                         }
//                     />


//                     {/* VISITORS */}

//                     <Route
//                         path="visitors"
//                         element={
//                             <ResidentVisitors />
//                         }
//                     />


//                     {/* VEHICLES */}

//                     <Route
//                         path="vehicles"
//                         element={
//                             <ResidentVehicles />
//                         }
//                     />


//                     {/* STICKERS */}

//                     <Route
//                         path="stickers"
//                         element={
//                             <ResidentStickers />
//                         }
//                     />


//                     {/* PROPERTIES */}

//                     <Route
//                         path="properties"
//                         element={
//                             <ResidentProperties />
//                         }
//                     />


//                     {/* HOMEOWNER OCCUPANCY */}

//                     <Route
//                         path="occupancy"
//                         element={
//                             <HomeownerOccupancy />
//                         }
//                     />

//                 </Route>

//             </Route>


//             {/* ==================================================
//                 TENANT PORTAL
//                 ResidentDashboard serves this route directly.
//             ================================================== */}

//             <Route
//                 element={
//                     <ProtectedRoute
//                         allowedRoles={[
//                             "TENANT",
//                         ]}
//                     />
//                 }
//             >

//                 <Route
//                     path="/tenant"
//                     element={
//                         <ResidentLayout />
//                     }
//                 >

//                     {/* SHARED RESIDENT DASHBOARD */}

//                     <Route
//                         index
//                         element={
//                             <ResidentDashboard />
//                         }
//                     />


//                     {/* VISITORS */}

//                     <Route
//                         path="visitors"
//                         element={
//                             <ResidentVisitors />
//                         }
//                     />


//                     {/* VEHICLES */}

//                     <Route
//                         path="vehicles"
//                         element={
//                             <ResidentVehicles />
//                         }
//                     />


//                     {/* STICKERS */}

//                     <Route
//                         path="stickers"
//                         element={
//                             <ResidentStickers />
//                         }
//                     />


//                     {/* PROPERTY */}

//                     <Route
//                         path="property"
//                         element={
//                             <ResidentProperties />
//                         }
//                     />

//                 </Route>

//             </Route>


//             {/* ==================================================
//                 SECURITY PORTAL
//             ================================================== */}

//             <Route
//                 element={
//                     <ProtectedRoute
//                         allowedRoles={[
//                             "SECURITY",
//                             "SECURITY_OFFICER",
//                             "ADMIN",
//                         ]}
//                     />
//                 }
//             >

//                 <Route
//                     path="/security"
//                     element={
//                         <SecurityLayout />
//                     }
//                 >

//                     {/* SECURITY DASHBOARD */}

//                     <Route
//                         index
//                         element={
//                             <SecurityDashboard />
//                         }
//                     />


//                     {/* QR SCANNER */}

//                     <Route
//                         path="scan"
//                         element={
//                             <VisitorScanner />
//                         }
//                     />


//                     {/* VISITORS INSIDE */}

//                     <Route
//                         path="inside"
//                         element={
//                             <VisitorsInside />
//                         }
//                     />


//                     {/* GATE HISTORY */}

//                     <Route
//                         path="history"
//                         element={
//                             <GateHistory />
//                         }
//                     />

//                 </Route>

//             </Route>


//             {/* ==================================================
//                 UNKNOWN ROUTES
//             ================================================== */}

//             <Route
//                 path="*"
//                 element={
//                     <Navigate
//                         to="/"
//                         replace
//                     />
//                 }
//             />

//         </Routes>

//     );

// }

