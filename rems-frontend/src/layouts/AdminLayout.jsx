import {
    Outlet,
    NavLink,
} from "react-router-dom";

import {
    useState,
} from "react";

import useAuth from "../hooks/useAuth";

import ProfileModal
    from "../components/account/ProfileModal";

import ChangePasswordModal
    from "../components/account/ChangePasswordModal";


export default function AdminLayout() {

    const {
        logout,
        user,
    } = useAuth();


    /* =========================================================
       SIDEBAR
    ========================================================= */

    const [
        mobileOpen,
        setMobileOpen,
    ] = useState(false);


    /* =========================================================
       ACCOUNT MODALS
    ========================================================= */

    const [
        showProfileModal,
        setShowProfileModal,
    ] = useState(false);


    const [
        showChangePasswordModal,
        setShowChangePasswordModal,
    ] = useState(false);


    /* =========================================================
       SIDEBAR HELPERS
    ========================================================= */

    const closeMobileSidebar = () => {

        setMobileOpen(
            false
        );

    };


    /* =========================================================
       LOGOUT
    ========================================================= */

    const handleLogout =
        async () => {

            closeMobileSidebar();

            await logout();

        };


    /* =========================================================
       RENDER
    ========================================================= */

    return (

        <div className="rems-app-shell">


            {/* =====================================================
                MOBILE SIDEBAR BACKDROP
            ===================================================== */}

            {mobileOpen && (

                <div
                    className="rems-sidebar-backdrop"
                    onClick={
                        closeMobileSidebar
                    }
                />

            )}


            {/* =====================================================
                ADMIN SIDEBAR
            ===================================================== */}

            <aside
                className={`rems-sidebar ${
                    mobileOpen
                        ? "rems-sidebar-open"
                        : ""
                }`}
            >


                {/* =================================================
                    BRAND
                ================================================= */}

                <div className="rems-sidebar-brand">

                    <div className="rems-brand-mark">

                        <i className="bi bi-buildings" />

                    </div>


                    <div className="rems-brand-text">

                        <div className="rems-brand-name">

                            oRES

                        </div>


                        <div className="rems-brand-subtitle">

                            VERSION 1.0

                        </div>

                    </div>


                    {/* MOBILE CLOSE */}

                    <button
                        type="button"
                        className="rems-mobile-close"
                        onClick={
                            closeMobileSidebar
                        }
                        aria-label="Close navigation"
                    >

                        <i className="bi bi-x-lg" />

                    </button>

                </div>


                {/* =================================================
                    NAVIGATION
                ================================================= */}

                <div className="rems-sidebar-section">

                    <div className="rems-sidebar-section-title">

                        Management

                    </div>


                    <nav className="rems-sidebar-nav">


                        {/* DASHBOARD */}

                        <NavLink
                            to="/admin"
                            end
                            onClick={
                                closeMobileSidebar
                            }
                            className={({ isActive }) =>
                                `rems-nav-link ${
                                    isActive
                                        ? "active"
                                        : ""
                                }`
                            }
                        >

                            <i className="bi bi-grid" />

                            <span>
                                Dashboard
                            </span>

                        </NavLink>


                        {/* VISITORS */}

                        <NavLink
                            to="/admin/visitors"
                            onClick={
                                closeMobileSidebar
                            }
                            className={({ isActive }) =>
                                `rems-nav-link ${
                                    isActive
                                        ? "active"
                                        : ""
                                }`
                            }
                        >

                            <i className="bi bi-people" />

                            <span>
                                Visitors
                            </span>

                        </NavLink>


                        {/* RESIDENTS */}

                        <NavLink
                            to="/admin/residents"
                            onClick={
                                closeMobileSidebar
                            }
                            className={({ isActive }) =>
                                `rems-nav-link ${
                                    isActive
                                        ? "active"
                                        : ""
                                }`
                            }
                        >

                            <i className="bi bi-person-vcard" />

                            <span>
                                Residents
                            </span>

                        </NavLink>


                        {/* PROPERTIES */}

                        <NavLink
                            to="/admin/properties"
                            onClick={
                                closeMobileSidebar
                            }
                            className={({ isActive }) =>
                                `rems-nav-link ${
                                    isActive
                                        ? "active"
                                        : ""
                                }`
                            }
                        >

                            <i className="bi bi-house" />

                            <span>
                                Properties
                            </span>

                        </NavLink>


                        {/* VEHICLES */}

                        <NavLink
                            to="/admin/vehicles"
                            onClick={
                                closeMobileSidebar
                            }
                            className={({ isActive }) =>
                                `rems-nav-link ${
                                    isActive
                                        ? "active"
                                        : ""
                                }`
                            }
                        >

                            <i className="bi bi-car-front" />

                            <span>
                                Vehicles
                            </span>

                        </NavLink>


                        {/* STICKERS */}

                        <NavLink
                            to="/admin/stickers"
                            onClick={
                                closeMobileSidebar
                            }
                            className={({ isActive }) =>
                                `rems-nav-link ${
                                    isActive
                                        ? "active"
                                        : ""
                                }`
                            }
                        >

                            <i className="bi bi-shield-check" />

                            <span>
                                Motorist Stickers
                            </span>

                        </NavLink>


                        {/* GATES */}

                        <NavLink
                            to="/admin/gates"
                            onClick={
                                closeMobileSidebar
                            }
                            className={({ isActive }) =>
                                `rems-nav-link ${
                                    isActive
                                        ? "active"
                                        : ""
                                }`
                            }
                        >

                            <i className="bi bi-door-open" />

                            <span>
                                Gates
                            </span>

                        </NavLink>


                        {/* OCCUPANCY */}

                        <NavLink
                            to="/admin/occupancy"
                            onClick={
                                closeMobileSidebar
                            }
                            className={({ isActive }) =>
                                `rems-nav-link ${
                                    isActive
                                        ? "active"
                                        : ""
                                }`
                            }
                        >

                            <i className="bi bi-house-check" />

                            <span>
                                Occupancy
                            </span>

                        </NavLink>

                    </nav>

                </div>


                {/* =================================================
                    SIDEBAR FOOTER
                ================================================= */}

                <div className="rems-sidebar-footer">

                    <div className="rems-sidebar-footer-icon">

                        <i className="bi bi-shield-lock" />

                    </div>


                    <div>

                        <div className="rems-sidebar-footer-title">

                            {/* Administration */}

                        </div>


                        <div className="rems-sidebar-footer-text">

                            {/* Secure management portal */}

                        </div>

                    </div>

                </div>

            </aside>


            {/* =====================================================
                MAIN APPLICATION AREA
            ===================================================== */}

            <div className="rems-main-area">


                {/* =================================================
                    TOPBAR
                ================================================= */}

                <header className="rems-topbar">


                    {/* TOPBAR LEFT */}

                    <div className="rems-topbar-left">


                        {/* MOBILE MENU */}

                        <button
                            type="button"
                            className="rems-mobile-menu"
                            onClick={() =>
                                setMobileOpen(
                                    true
                                )
                            }
                            aria-label="Open navigation"
                        >

                            <i className="bi bi-list" />

                        </button>


                        <div>

                            <div className="rems-topbar-title">

                                Jubilation Paradise

                            </div>


                            <div className="rems-topbar-subtitle">

                                Real Estate Management System

                            </div>

                        </div>

                    </div>


                    {/* TOPBAR RIGHT */}

                    <div className="rems-topbar-right">

                        <div className="rems-topbar-divider" />


                        {/* =================================================
                            USER DROPDOWN
                        ================================================= */}

                        <div className="dropdown">

                            <button
                                type="button"
                                className="dropdown-toggle rems-user-button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >

                                <div className="rems-user-avatar">

                                    {user?.first_name?.[0] ||
                                        user?.username?.[0] ||
                                        "A"}

                                </div>


                                <div className="rems-user-info">

                                    <div className="rems-user-name">

                                        {user?.first_name ||
                                            user?.username ||
                                            "Administrator"}

                                    </div>


                                    <div className="rems-user-role">

                                        Administrator

                                    </div>

                                </div>

                            </button>


                            {/* =================================================
                                USER MENU
                            ================================================= */}

                            <div className="dropdown-menu dropdown-menu-end rems-user-menu">

                                <div className="rems-user-menu-header">

                                    <strong>

                                        {user?.first_name ||
                                            user?.username ||
                                            "Administrator"}

                                    </strong>


                                    <span>

                                        {user?.email ||
                                            "Administration Account"}

                                    </span>

                                </div>


                                <div className="dropdown-divider" />


                                {/* PROFILE */}

                                <button
                                    type="button"
                                    className="dropdown-item rems-account-menu-item"
                                    onClick={() => {

                                        setShowProfileModal(
                                            true
                                        );

                                    }}
                                >

                                    <i className="bi bi-person-circle" />

                                    <span>
                                        Profile
                                    </span>

                                </button>


                                {/* CHANGE PASSWORD */}

                                <button
                                    type="button"
                                    className="dropdown-item rems-account-menu-item"
                                    onClick={() => {

                                        setShowChangePasswordModal(
                                            true
                                        );

                                    }}
                                >

                                    <i className="bi bi-key" />

                                    <span>
                                        Change Password
                                    </span>

                                </button>


                                <div className="dropdown-divider" />


                                {/* SIGN OUT */}

                                <button
                                    type="button"
                                    className="dropdown-item rems-logout-item"
                                    onClick={
                                        handleLogout
                                    }
                                >

                                    <i className="bi bi-box-arrow-right" />

                                    <span>
                                        Sign out
                                    </span>

                                </button>

                            </div>

                        </div>

                    </div>

                </header>


                {/* =================================================
                    PAGE CONTENT
                ================================================= */}

                <main className="rems-content">

                    <Outlet />

                </main>


                {/* =================================================
                    PROFILE MODAL
                ================================================= */}

                <ProfileModal
                    show={
                        showProfileModal
                    }
                    onClose={() =>
                        setShowProfileModal(
                            false
                        )
                    }
                    onSuccess={() => {
                        /*
                         * Profile is saved successfully.
                         */
                    }}
                />


                {/* =================================================
                    CHANGE PASSWORD MODAL
                ================================================= */}

                <ChangePasswordModal
                    show={
                        showChangePasswordModal
                    }
                    onClose={() =>
                        setShowChangePasswordModal(
                            false
                        )
                    }
                    onSuccess={() => {
                        /*
                         * Password changed successfully.
                         */
                    }}
                />


                {/* =================================================
                    ACCOUNT MENU LOCAL STYLES
                ================================================= */}

                <style>
                    {`

                        .rems-account-menu-item {

                            display:
                                flex !important;

                            align-items:
                                center;

                            gap:
                                10px;

                            width:
                                100%;

                            padding:
                                9px 10px;

                            border:
                                0;

                            border-radius:
                                9px;

                            color:
                                var(--rems-text-soft);

                            background:
                                transparent;

                            font-size:
                                13px;

                            transition:
                                background var(--rems-transition),
                                color var(--rems-transition),
                                transform var(--rems-transition);

                        }


                        .rems-account-menu-item i {

                            width:
                                18px;

                            flex-shrink:
                                0;

                            text-align:
                                center;

                            color:
                                var(--rems-text-muted);

                            font-size:
                                15px;

                        }


                        .rems-account-menu-item:hover {

                            color:
                                var(--rems-text);

                            background:
                                rgba(
                                    15,
                                    23,
                                    42,
                                    0.045
                                );

                            transform:
                                translateX(2px);

                        }


                        .rems-account-menu-item:hover i {

                            color:
                                var(--rems-text);

                        }


                        .rems-account-menu-item:focus-visible {

                            outline:
                                3px solid
                                rgba(
                                    37,
                                    99,
                                    235,
                                    0.22
                                );

                            outline-offset:
                                2px;

                        }

                    `}
                </style>

            </div>

        </div>

    );

}