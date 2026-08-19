
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


// ============================================================
// SECURITY LAYOUT
// ============================================================

export default function SecurityLayout() {

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
       USER
    ========================================================= */

    const displayName =
        user?.full_name ||
        user?.name ||
        [
            user?.first_name,
            user?.last_name,
        ]
            .filter(Boolean)
            .join(" ") ||
        user?.username ||
        "Security Officer";


    const avatarLetter =
        (
            user?.first_name?.[0] ||
            user?.username?.[0] ||
            "S"
        ).toUpperCase();


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
       CLOSE MENU ON ROUTE / SIDEBAR ACTION
    ========================================================= */

    useEffect(() => {

        setUserMenuOpen(
            false
        );

    }, [
        mobileOpen,
    ]);


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
                SECURITY SIDEBAR
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

                        <i className="bi bi-shield-check" />

                    </div>


                    <div className="rems-brand-text">

                        <div className="rems-brand-name">

                            oRES

                        </div>


                        <div className="rems-brand-subtitle">

                            SECURITY PORTAL

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

                        Security Operations

                    </div>


                    <nav className="rems-sidebar-nav">


                        {/* DASHBOARD */}

                        <NavLink
                            to="/security"
                            end
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

                            <i className="bi bi-shield-check" />

                            <span>
                                Dashboard
                            </span>

                        </NavLink>


                        {/* SCANNER */}

                        <NavLink
                            to="/security/scan"
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

                            <i className="bi bi-qr-code-scan" />

                            <span>
                                Scan Visitor QR
                            </span>

                        </NavLink>


                        {/* INSIDE */}

                        <NavLink
                            to="/security/inside"
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

                            <i className="bi bi-people" />

                            <span>
                                Visitors Inside
                            </span>

                        </NavLink>


                        {/* HISTORY */}

                        <NavLink
                            to="/security/history"
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

                            <i className="bi bi-clock-history" />

                            <span>
                                Gate History
                            </span>

                        </NavLink>


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
                MAIN APPLICATION AREA
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

                                Security Operations

                            </div>


                            <div className="rems-topbar-subtitle">

                                Real Estate Management System

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        TOPBAR RIGHT
                    ================================================= */}

                    <div className="rems-topbar-right">

                        <div className="rems-topbar-divider" />


                        {/* =================================================
                            USER DROPDOWN
                        ================================================= */}

                        <div
                            className="rems-security-user-dropdown"
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

                                                avatarLetter

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

                                        Security Officer

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
                                CUSTOM USER MENU
                            ================================================= */}

                            {userMenuOpen && (

                                <div
                                    className="rems-security-user-menu"
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
                                                "Security Account"
                                            }
                                        </span>

                                    </div>


                                    <div className="dropdown-divider" />


                                    <div
                                        className="rems-security-account-role"
                                    >

                                        <i className="bi bi-shield-check" />

                                        <span>
                                            Security Officer
                                        </span>

                                    </div>


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

            </div>


            {/* =====================================================
                SECURITY USER MENU LOCAL STYLES
            ===================================================== */}

            <style>
                {`

                    /* =============================================
                       USER DROPDOWN WRAPPER
                    ============================================= */

                    .rems-security-user-dropdown {

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

                    .rems-security-user-dropdown
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


                    .rems-security-user-dropdown
                    .rems-user-button:hover,
                    .rems-security-user-dropdown
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

                    .rems-security-user-dropdown
                    .rems-user-avatar {

                        width:
                            38px;

                        height:
                            38px;

                        min-width:
                            38px;

                        overflow:
                            hidden;
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

                    .rems-security-user-dropdown
                    .rems-user-info {

                        min-width:
                            0;

                        max-width:
                            150px;

                        text-align:
                            left;
                    }


                    .rems-security-user-dropdown
                    .rems-user-name {

                        max-width:
                            150px;
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

                    .rems-security-user-menu {

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
                            remsSecurityMenuIn
                            140ms ease-out;
                    }


                    @keyframes remsSecurityMenuIn {

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

                    .rems-security-user-menu
                    .rems-user-menu-header {

                        padding:
                            10px 11px;
                    }


                    .rems-security-user-menu
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


                    .rems-security-user-menu
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
                       SECURITY ROLE ROW
                    ============================================= */

                    .rems-security-account-role {

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

                        border-radius:
                            9px;

                        color:
                            var(--rems-text-soft);

                        background:
                            rgba(
                                15,
                                23,
                                42,
                                0.025
                            );

                        font-size:
                            12px;
                    }


                    .rems-security-account-role i {

                        width:
                            18px;

                        min-width:
                            18px;

                        text-align:
                            center;

                        color:
                            var(--rems-text-muted);

                        font-size:
                            15px;
                    }


                    /* =============================================
                       LOGOUT
                    ============================================= */

                    .rems-security-user-menu
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

                        color:
                            var(--rems-text-soft);

                        background:
                            transparent;

                        font-size:
                            13px;

                        transition:
                            background 160ms ease,
                            color 160ms ease,
                            transform 160ms ease;
                    }


                    .rems-security-user-menu
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


                    .rems-security-user-menu
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

                        transform:
                            translateX(
                                2px
                            );
                    }


                    /* =============================================
                       MOBILE
                    ============================================= */

                    @media (max-width: 575.98px) {

                        .rems-security-user-dropdown
                        .rems-user-button {

                            padding:
                                4px;
                        }


                        .rems-security-user-dropdown
                        .rems-user-info {

                            display:
                                none;
                        }


                        .rems-user-chevron {

                            display:
                                none;
                        }


                        .rems-security-user-menu {

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
    );

}
