import {
    useEffect,
    useState,
} from "react";

import {
    NavLink,
    Outlet,
    useLocation,
} from "react-router-dom";

import {
    BsShieldCheck,
    BsQrCodeScan,
    BsPeople,
    BsClockHistory,
    BsBoxArrowRight,
    BsPersonCircle,
    BsChevronDown,
    BsX,
    BsList,
} from "react-icons/bs";

import useAuth from "../hooks/useAuth";


// ============================================================
// SECURITY LAYOUT
// GATE / SECURITY OFFICER PORTAL
// ============================================================

export default function SecurityLayout() {

    const {
        logout,
        user,
    } = useAuth();

    const location =
        useLocation();


    // ========================================================
    // STATE
    // ========================================================

    const [
        mobileOpen,
        setMobileOpen,
    ] = useState(false);


    const [
        userMenuOpen,
        setUserMenuOpen,
    ] = useState(false);


    // ========================================================
    // USER
    // ========================================================

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


    const roleLabel =
        user?.role ===
        "SECURITY_OFFICER"
            ? "Security Officer"
            : user?.role ===
                "SECURITY"
                ? "Security"
                : "Gate Personnel";


    // ========================================================
    // NAVIGATION
    // ========================================================

    const navigation = [

        {
            label:
                "Dashboard",

            path:
                "/security",

            icon:
                <BsShieldCheck />,

            end:
                true,
        },

        {
            label:
                "Scan Visitor QR",

            path:
                "/security/scan",

            icon:
                <BsQrCodeScan />,
        },

        {
            label:
                "Visitors Inside",

            path:
                "/security/inside",

            icon:
                <BsPeople />,
        },

        {
            label:
                "Gate History",

            path:
                "/security/history",

            icon:
                <BsClockHistory />,
        },

    ];


    // ========================================================
    // PAGE TITLE
    // ========================================================

    const pageTitle =
        navigation.find(
            (
                item
            ) => {

                if (
                    item.end
                ) {

                    return (
                        location.pathname ===
                        item.path
                    );

                }

                return (
                    location.pathname ===
                        item.path ||
                    location.pathname.startsWith(
                        `${item.path}/`
                    )
                );

            }
        )?.label ||
        "Security Portal";


    // ========================================================
    // CLOSE ON ROUTE CHANGE
    // ========================================================

    useEffect(() => {

        setMobileOpen(
            false
        );

        setUserMenuOpen(
            false
        );

    }, [
        location.pathname,
    ]);


    // ========================================================
    // CLOSE USER MENU OUTSIDE
    // ========================================================

    useEffect(() => {

        const handleDocumentClick =
            () => {

                setUserMenuOpen(
                    false
                );

            };


        if (
            userMenuOpen
        ) {

            document.addEventListener(
                "click",
                handleDocumentClick
            );

        }


        return () => {

            document.removeEventListener(
                "click",
                handleDocumentClick
            );

        };

    }, [
        userMenuOpen,
    ]);


    // ========================================================
    // LOGOUT
    // ========================================================

    const handleLogout =
        async () => {

            setMobileOpen(
                false
            );

            setUserMenuOpen(
                false
            );

            await logout();

        };


    // ========================================================
    // USER MENU
    // ========================================================

    const handleUserMenu =
        (
            event
        ) => {

            event.stopPropagation();

            setUserMenuOpen(
                (
                    previous
                ) =>
                    !previous
            );

        };


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div className="rems-app-shell">


            {/* ==================================================
                MOBILE BACKDROP
            ================================================== */}

            {mobileOpen && (

                <div
                    className="rems-sidebar-backdrop"
                    onClick={() =>
                        setMobileOpen(
                            false
                        )
                    }
                />

            )}


            {/* ==================================================
                SIDEBAR
            ================================================== */}

            <aside
                className={`rems-sidebar ${
                    mobileOpen
                        ? "rems-sidebar-open"
                        : ""
                }`}
            >


                {/* ==================================================
                    BRAND
                ================================================== */}

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


                    {/* MOBILE CLOSE */}

                    <button
                        type="button"
                        className="rems-mobile-close"
                        onClick={() =>
                            setMobileOpen(
                                false
                            )
                        }
                        aria-label="Close navigation"
                    >

                        <BsX />

                    </button>

                </div>


                {/* ==================================================
                    NAVIGATION
                ================================================== */}

                <div className="rems-sidebar-section">

                    <div className="rems-sidebar-section-title">

                        Security Operations

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
                                    onClick={() =>
                                        setMobileOpen(
                                            false
                                        )
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

                                    <span>

                                        {
                                            item.icon
                                        }

                                    </span>


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


                {/* ==================================================
                    SIDEBAR FOOTER
                ================================================== */}

                <div className="rems-sidebar-footer">


                    <div className="rems-sidebar-resident-card">

                        <div className="rems-resident-avatar">

                            {
                                (
                                    displayName?.[0] ||
                                    "S"
                                ).toUpperCase()
                            }

                        </div>


                        <div className="rems-resident-info">

                            <div className="rems-resident-name">

                                {
                                    displayName
                                }

                            </div>


                            <div className="rems-resident-type">

                                {
                                    roleLabel
                                }

                            </div>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="rems-signout-button"
                        onClick={
                            handleLogout
                        }
                    >

                        <BsBoxArrowRight />

                        <span>

                            Sign out

                        </span>

                    </button>

                </div>

            </aside>


            {/* ==================================================
                MAIN AREA
            ================================================== */}

            <div className="rems-main-area">


                {/* ==================================================
                    TOPBAR
                ================================================== */}

                <header className="rems-topbar">


                    {/* ==================================================
                        TOPBAR LEFT
                    ================================================== */}

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

                            <BsList />

                        </button>


                        <div>

                            <div className="rems-topbar-title">

                                {
                                    pageTitle
                                }

                            </div>


                            <div className="rems-topbar-subtitle">

                                oRES Security Operations

                            </div>

                        </div>

                    </div>


                    {/* ==================================================
                        TOPBAR RIGHT
                    ================================================== */}

                    <div className="rems-topbar-right">

                        <div className="rems-topbar-divider" />


                        <div className="dropdown">


                            {/* ==================================================
                                USER BUTTON
                            ================================================== */}

                            <button
                                type="button"
                                className="dropdown-toggle rems-user-button"
                                onClick={
                                    handleUserMenu
                                }
                                aria-expanded={
                                    userMenuOpen
                                }
                            >

                                <div className="rems-user-avatar">

                                    {user?.profile_picture ? (

                                        <img
                                            src={
                                                user.profile_picture
                                            }
                                            alt={
                                                displayName
                                            }
                                            style={{
                                                width:
                                                    "100%",
                                                height:
                                                    "100%",
                                                objectFit:
                                                    "cover",
                                                borderRadius:
                                                    "50%",
                                            }}
                                        />

                                    ) : (

                                        <BsPersonCircle />

                                    )}

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


                                <BsChevronDown
                                    style={{
                                        transform:
                                            userMenuOpen
                                                ? "rotate(180deg)"
                                                : "rotate(0deg)",
                                        transition:
                                            "transform 180ms ease",
                                    }}
                                />

                            </button>


                            {/* ==================================================
                                USER MENU
                            ================================================== */}

                            {userMenuOpen && (

                                <div
                                    className="dropdown-menu dropdown-menu-end rems-user-menu show"
                                    onClick={(event) =>
                                        event.stopPropagation()
                                    }
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
                                                roleLabel
                                            }

                                        </span>

                                    </div>


                                    <div className="dropdown-divider" />


                                    <button
                                        type="button"
                                        className="dropdown-item rems-logout-item"
                                        onClick={
                                            handleLogout
                                        }
                                    >

                                        <BsBoxArrowRight />

                                        <span>

                                            Sign out

                                        </span>

                                    </button>

                                </div>

                            )}

                        </div>

                    </div>

                </header>


                {/* ==================================================
                    PAGE CONTENT
                ================================================== */}

                <main className="rems-content">

                    <Outlet />

                </main>

            </div>

        </div>

    );

}