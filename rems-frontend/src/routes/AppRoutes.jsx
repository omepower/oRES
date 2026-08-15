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


// ============================================================
// HOMEOWNER PAGES
// ============================================================

import HomeownerDashboard
    from "../pages/resident/HomeownerDashboard";

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
// ============================================================
// TENANT PAGES
// ============================================================

import TenantDashboard
    from "../pages/resident/TenantDashboard";

// ============================================================
// SECURITY GUARD PAGES
// ============================================================
import SecurityLayout
    from "../layouts/SecurityLayout";

import SecurityDashboard
    from "../pages/security/SecurityDashboard";

import VisitorScanner
    from "../pages/security/VisitorScanner";

import VisitorsInside
    from "../pages/security/VisitorsInside";

import GateHistory
    from "../pages/security/GateHistory";


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

                    {/* ------------------------------------------
                        ADMIN DASHBOARD
                    ------------------------------------------ */}

                    <Route
                        index
                        element={
                            <AdminDashboard />
                        }
                    />


                    {/* ------------------------------------------
                        VISITORS
                    ------------------------------------------ */}

                    <Route
                        path="visitors"
                        element={
                            <Visitors />
                        }
                    />


                    {/* ------------------------------------------
                        RESIDENTS
                    ------------------------------------------ */}

                    <Route
                        path="residents"
                        element={
                            <Residents />
                        }
                    />


                    {/* ------------------------------------------
                        PROPERTIES
                    ------------------------------------------ */}

                    <Route
                        path="properties"
                        element={
                            <Properties />
                        }
                    />


                    {/* ------------------------------------------
                        VEHICLES
                    ------------------------------------------ */}

                    <Route
                        path="vehicles"
                        element={
                            <Vehicles />
                        }
                    />


                    {/* ------------------------------------------
                        MOTORIST STICKERS
                    ------------------------------------------ */}

                    <Route
                        path="stickers"
                        element={
                            <Stickers />
                        }
                    />


                    {/* ------------------------------------------
                        GATES
                    ------------------------------------------ */}

                    <Route
                        path="gates"
                        element={
                            <Gates />
                        }
                    />


                    {/* ------------------------------------------
                        OCCUPANCY
                    ------------------------------------------ */}

                    <Route
                        path="occupancy"
                        element={
                            <Occupancy />
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

                    {/* ------------------------------------------
                        HOMEOWNER DASHBOARD
                    ------------------------------------------ */}

                    <Route
                        index
                        element={
                            <HomeownerDashboard />
                        }
                    />

                    <Route
                        path="visitors"
                        element={
                            <ResidentVisitors />
                        }
                    />

                    <Route
                        path="vehicles"
                        element={
                            <ResidentVehicles />
                        }
                    />

                    <Route
                        path="stickers"
                        element={
                            <ResidentStickers />
                        }
                    />

                    <Route
                        path="properties"
                        element={
                            <ResidentProperties />
                        }
                    />

                    <Route
                        path="occupancy"
                        element={
                            <HomeownerOccupancy />
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

                    {/* ------------------------------------------
                        TENANT DASHBOARD
                    ------------------------------------------ */}

                    <Route
                        index
                        element={
                            <TenantDashboard />
                        }
                    />

                    <Route
                        path="visitors"
                        element={
                            <ResidentVisitors />
                        }
                    />

                    <Route
                        path="vehicles"
                        element={
                            <ResidentVehicles />
                        }
                    />

                    <Route
                        path="stickers"
                        element={
                            <ResidentStickers />
                        }
                    />

                    <Route
                        path="property"
                        element={
                            <ResidentProperties />
                        }
                    />

                </Route>

            </Route>

            {/* ==================================================
                SECURITY GUARD PORTAL
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

                    <Route
                        index
                        element={
                            <SecurityDashboard />
                        }
                    />

                    <Route
                        path="scan"
                        element={
                            <VisitorScanner />
                        }
                    />

                    <Route
                        path="inside"
                        element={
                            <VisitorsInside />
                        }
                    />

                    <Route
                        path="history"
                        element={
                            <GateHistory />
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