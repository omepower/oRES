
import {
    Outlet,
    NavLink,
} from "react-router-dom";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import useAuth from "../hooks/useAuth";

import ProfileModal
    from "../components/account/ProfileModal";

import ChangePasswordModal
    from "../components/account/ChangePasswordModal";


export default function ResidentLayout() {

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
       USER MENU
    ========================================================= */

    const [
        userMenuOpen,
        setUserMenuOpen,
    ] = useState(false);


    const userMenuRef =
        useRef(null);


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
       ROLE
    ========================================================= */

    const role =
        String(
            user?.role || ""
        )
            .trim()
            .toUpperCase();


    const isHomeowner =
        role === "HOMEOWNER";


    const isTenant =
        role === "TENANT";


    const roleLabel =
        isHomeowner
            ? "Homeowner"
            : isTenant
                ? "Tenant"
                : "Resident";


    /* =========================================================
       DISPLAY NAME
    ========================================================= */

    const displayName =
        user?.full_name ||
        user?.name ||
        [
            user?.first_name,
            user?.middle_name,
            user?.last_name,
        ]
            .filter(Boolean)
            .join(" ") ||
        user?.username ||
        "Resident";


    const firstName =
        user?.first_name ||
        displayName
            .split(" ")
            .filter(Boolean)[0] ||
        "Resident";


    /* =========================================================
       SIDEBAR HELPERS
    ========================================================= */

    const closeMobileSidebar =
        () => {

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

            setUserMenuOpen(
                false
            );

            await logout();

        };


    /* =========================================================
       USER MENU
    ========================================================= */

    const toggleUserMenu =
        () => {

            setUserMenuOpen(
                previous =>
                    !previous
            );

        };


    const closeUserMenu =
        () => {

            setUserMenuOpen(
                false
            );

        };


    /* =========================================================
       CLOSE USER MENU WHEN CLICKING OUTSIDE
    ========================================================= */

    useEffect(() => {

        const handleDocumentClick =
            (
                event
            ) => {

                if (
                    userMenuRef.current &&
                    !userMenuRef.current.contains(
                        event.target
                    )
                ) {

                    setUserMenuOpen(
                        false
                    );

                }

            };


        if (
            userMenuOpen
        ) {

            document.addEventListener(
                "mousedown",
                handleDocumentClick
            );

        }


        return () => {

            document.removeEventListener(
                "mousedown",
                handleDocumentClick
            );

        };

    }, [
        userMenuOpen,
    ]);


    /* =========================================================
       NAVIGATION
    ========================================================= */

    const homeownerNavigation = [

        {
            path:
                "/homeowner",

            label:
                "Dashboard",

            icon:
                "bi-grid",

            end:
                true,
        },

        {
            path:
                "/homeowner/properties",

            label:
                "My Properties",

            icon:
                "bi-buildings",
        },

        {
            path:
                "/homeowner/occupancy",

            label:
                "Occupancy",

            icon:
                "bi-house-check",
        },

        {
            path:
                "/homeowner/visitors",

            label:
                "Visitors",

            icon:
                "bi-people",
        },

        {
            path:
                "/homeowner/vehicles",

            label:
                "Vehicles",

            icon:
                "bi-car-front",
        },

        {
            path:
                "/homeowner/stickers",

            label:
                "Motorist Stickers",

            icon:
                "bi-shield-check",
        },

    ];


    const tenantNavigation = [

        {
            path:
                "/tenant",

            label:
                "Dashboard",

            icon:
                "bi-grid",

            end:
                true,
        },

        {
            path:
                "/tenant/property",

            label:
                "My Property",

            icon:
                "bi-house",
        },

        {
            path:
                "/tenant/visitors",

            label:
                "Visitors",

            icon:
                "bi-people",
        },

        {
            path:
                "/tenant/vehicles",

            label:
                "Vehicles",

            icon:
                "bi-car-front",
        },

        {
            path:
                "/tenant/stickers",

            label:
                "Motorist Stickers",

            icon:
                "bi-shield-check",
        },

    ];


    const navigation =
        isHomeowner
            ? homeownerNavigation
            : isTenant
                ? tenantNavigation
                : [];


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
                RESIDENT SIDEBAR
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

                        Resident Portal

                    </div>


                    <nav className="rems-sidebar-nav">

                        {navigation.map(
                            (
                                item
                            ) => (

                                <NavLink
                                    key={
                                        item.path
                                    }
                                    to={
                                        item.path
                                    }
                                    end={
                                        item.end
                                    }
                                    onClick={
                                        closeMobileSidebar
                                    }
                                    className={({
                                        isActive,
                                    }) =>
                                        `rems-nav-link ${
                                            isActive
                                                ? "active"
                                                : ""
                                        }`
                                    }
                                >

                                    <i
                                        className={`bi ${item.icon}`}
                                    />

                                    <span>
                                        {
                                            item.label
                                        }
                                    </span>

                                </NavLink>

                            )
                        )}

                    </nav>

                </div>


                {/* =================================================
                    SIDEBAR FOOTER
                ================================================= */}

                <div className="rems-sidebar-footer">

                    <button
                        type="button"
                        className="rems-signout-button"
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

            </aside>


            {/* =====================================================
                MAIN AREA
            ===================================================== */}

            <div className="rems-main-area">


                {/* =================================================
                    TOPBAR
                ================================================= */}

                <header className="rems-topbar">


                    {/* =================================================
                        TOPBAR LEFT
                    ================================================= */}

                    <div className="rems-topbar-left">

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

                                Resident Portal · oRES

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        TOPBAR RIGHT
                    ================================================= */}

                    <div className="rems-topbar-right">

                        <div className="rems-topbar-divider" />


                        {/* =================================================
                            USER DROPDOWN WRAPPER
                        ================================================= */}

                        <div
                            className="rems-resident-user-dropdown"
                            ref={
                                userMenuRef
                            }
                        >


                            {/* =================================================
                                USER BUTTON
                            ================================================= */}

                            <button
                                type="button"
                                className={`rems-user-button ${
                                    userMenuOpen
                                        ? "rems-user-button-open"
                                        : ""
                                }`}
                                onClick={
                                    toggleUserMenu
                                }
                                aria-expanded={
                                    userMenuOpen
                                }
                                aria-haspopup="menu"
                            >

                                <div className="rems-user-avatar">

                                    {
                                        user?.profile_picture
                                            ? (

                                                <img
                                                    src={
                                                        user.profile_picture
                                                    }
                                                    alt={
                                                        displayName
                                                    }
                                                    className="rems-user-avatar-image"
                                                />

                                            )
                                            : (

                                                (
                                                    user?.first_name?.[0] ||
                                                    user?.username?.[0] ||
                                                    "R"
                                                ).toUpperCase()

                                            )
                                    }

                                </div>


                                <div className="rems-user-info">

                                    <div className="rems-user-name">

                                        {
                                            displayName
                                        }

                                    </div>


                                    <div className="rems-user-role">

                                        {
                                            roleLabel
                                        }

                                    </div>

                                </div>


                                <i
                                    className={`bi bi-chevron-down rems-user-chevron ${
                                        userMenuOpen
                                            ? "open"
                                            : ""
                                    }`}
                                />

                            </button>


                            {/* =================================================
                                USER MENU
                            ================================================= */}

                            {userMenuOpen && (

                                <div
                                    className="rems-resident-user-menu"
                                    role="menu"
                                >

                                    <div className="rems-user-menu-header">

                                        <strong>
                                            {
                                                displayName
                                            }
                                        </strong>


                                        <span>
                                            {
                                                user?.email ||
                                                `${roleLabel} Account`
                                            }
                                        </span>

                                    </div>


                                    <div className="dropdown-divider" />


                                    <button
                                        type="button"
                                        className="rems-account-menu-item"
                                        role="menuitem"
                                        onClick={() => {

                                            closeUserMenu();

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


                                    <button
                                        type="button"
                                        className="rems-account-menu-item"
                                        role="menuitem"
                                        onClick={() => {

                                            closeUserMenu();

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


                                    <button
                                        type="button"
                                        className="rems-logout-item"
                                        role="menuitem"
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

                            )}

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
                    onSuccess={() => {}}
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
                    onSuccess={() => {}}
                />


                {/* =================================================
                    DROPDOWN LOCAL STYLES
                    Uses existing REMS variables/classes.
                ================================================= */}

                <style>
                    {`

                        /* =============================================
                           DROPDOWN WRAPPER
                        ============================================= */

                        .rems-resident-user-dropdown {

                            position:
                                relative;

                            flex:
                                0 0 auto;

                            z-index:
                                1100;
                        }


                        /* =============================================
                           USER BUTTON
                        ============================================= */

                        .rems-resident-user-dropdown
                        .rems-user-button {

                            min-height:
                                48px;

                            display:
                                flex;

                            align-items:
                                center;

                            justify-content:
                                flex-start;

                            gap:
                                9px;

                            padding:
                                5px 6px 5px 5px;

                            border-radius:
                                12px;

                            transition:
                                background 180ms ease,
                                box-shadow 180ms ease;
                        }


                        .rems-resident-user-dropdown
                        .rems-user-button:hover,
                        .rems-resident-user-dropdown
                        .rems-user-button-open {

                            background:
                                rgba(
                                    15,
                                    23,
                                    42,
                                    0.035
                                ) !important;
                        }


                        /* =============================================
                           AVATAR
                        ============================================= */

                        .rems-resident-user-dropdown
                        .rems-user-avatar {

                            width:
                                38px;

                            height:
                                38px;

                            min-width:
                                38px;
                        }


                        .rems-user-avatar-image {

                            width:
                                100%;

                            height:
                                100%;

                            display:
                                block;

                            object-fit:
                                cover;

                            border-radius:
                                50%;
                        }


                        /* =============================================
                           USER INFO
                        ============================================= */

                        .rems-resident-user-dropdown
                        .rems-user-info {

                            min-width:
                                0;

                            max-width:
                                145px;
                        }


                        .rems-resident-user-dropdown
                        .rems-user-name {

                            max-width:
                                145px;
                        }


                        /* =============================================
                           CHEVRON
                        ============================================= */

                        .rems-user-chevron {

                            flex:
                                0 0 auto;

                            margin-left:
                                1px;

                            color:
                                var(--rems-text-muted);

                            font-size:
                                10px;

                            transition:
                                transform 180ms ease;
                        }


                        .rems-user-chevron.open {

                            transform:
                                rotate(
                                    180deg
                                );
                        }


                        /* =============================================
                           CUSTOM MENU
                        ============================================= */

                        .rems-resident-user-menu {

                            position:
                                absolute;

                            top:
                                calc(
                                    100% + 8px
                                );

                            right:
                                0;

                            left:
                                auto;

                            z-index:
                                1200;

                            width:
                                250px;

                            min-width:
                                250px;

                            max-width:
                                calc(
                                    100vw - 24px
                                );

                            padding:
                                8px;

                            border:
                                1px solid
                                rgba(
                                    255,
                                    255,
                                    255,
                                    0.92
                                );

                            border-radius:
                                14px;

                            background:
                                rgba(
                                    255,
                                    255,
                                    255,
                                    0.96
                                );

                            -webkit-backdrop-filter:
                                blur(22px);

                            backdrop-filter:
                                blur(22px);

                            box-shadow:
                                var(--rems-shadow-lg);

                            animation:
                                remsResidentMenuIn
                                140ms ease-out;
                        }


                        @keyframes remsResidentMenuIn {

                            from {

                                opacity:
                                    0;

                                transform:
                                    translateY(
                                        -4px
                                    );
                            }

                            to {

                                opacity:
                                    1;

                                transform:
                                    translateY(
                                        0
                                    );
                            }

                        }


                        /* =============================================
                           MENU HEADER
                        ============================================= */

                        .rems-resident-user-menu
                        .rems-user-menu-header {

                            padding:
                                10px 11px;
                        }


                        .rems-resident-user-menu
                        .rems-user-menu-header strong {

                            display:
                                block;

                            max-width:
                                100%;

                            overflow:
                                hidden;

                            text-overflow:
                                ellipsis;

                            white-space:
                                nowrap;

                            font-size:
                                13px;
                        }


                        .rems-resident-user-menu
                        .rems-user-menu-header span {

                            display:
                                block;

                            max-width:
                                100%;

                            margin-top:
                                3px;

                            overflow:
                                hidden;

                            text-overflow:
                                ellipsis;

                            white-space:
                                nowrap;

                            font-size:
                                11px;
                        }


                        /* =============================================
                           MENU ITEMS
                        ============================================= */

                        .rems-resident-user-menu
                        .rems-account-menu-item,
                        .rems-resident-user-menu
                        .rems-logout-item {

                            width:
                                100%;

                            min-height:
                                40px;

                            display:
                                flex;

                            align-items:
                                center;

                            gap:
                                10px;

                            padding:
                                9px 10px;

                            border:
                                0;

                            border-radius:
                                9px;

                            text-align:
                                left;

                            background:
                                transparent;

                            font-size:
                                13px;

                            transition:
                                background 160ms ease,
                                color 160ms ease,
                                transform 160ms ease;
                        }


                        .rems-resident-user-menu
                        .rems-account-menu-item {

                            color:
                                var(--rems-text-soft);
                        }


                        .rems-resident-user-menu
                        .rems-account-menu-item i,
                        .rems-resident-user-menu
                        .rems-logout-item i {

                            width:
                                18px;

                            min-width:
                                18px;

                            text-align:
                                center;

                            font-size:
                                15px;
                        }


                        .rems-resident-user-menu
                        .rems-account-menu-item i {

                            color:
                                var(--rems-text-muted);
                        }


                        .rems-resident-user-menu
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
                                translateX(
                                    2px
                                );
                        }


                        .rems-resident-user-menu
                        .rems-logout-item {

                            color:
                                var(--rems-text-soft);
                        }


                        .rems-resident-user-menu
                        .rems-logout-item:hover {

                            color:
                                var(--rems-danger);

                            background:
                                rgba(
                                    220,
                                    53,
                                    69,
                                    0.07
                                );
                        }


                        /* =============================================
                           MOBILE
                        ============================================= */

                        @media (max-width: 575.98px) {

                            .rems-resident-user-dropdown
                            .rems-user-button {

                                padding:
                                    4px;

                            }


                            .rems-resident-user-dropdown
                            .rems-user-info {

                                display:
                                    none;
                            }


                            .rems-user-chevron {

                                display:
                                    none;
                            }


                            .rems-resident-user-menu {

                                position:
                                    fixed;

                                top:
                                    64px;

                                right:
                                    10px;

                                left:
                                    auto;

                                width:
                                    min(
                                        270px,
                                        calc(
                                            100vw - 20px
                                        )
                                    );

                                min-width:
                                    0;

                                max-width:
                                    calc(
                                        100vw - 20px
                                    );
                            }

                        }

                    `}
                </style>

            </div>

        </div>

    );
}
