import {
    useState,
} from "react";

import {
    Link,
    Navigate,
    useLocation,
} from "react-router-dom";

import useAuth from "../../hooks/useAuth";


export default function Login() {

    const {
        login,
        user,
        loading,
    } = useAuth();


    const location =
        useLocation();


    const [
        username,
        setUsername,
    ] = useState("");


    const [
        password,
        setPassword,
    ] = useState("");


    const [
        showPassword,
        setShowPassword,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState("");


    const [
        submitting,
        setSubmitting,
    ] = useState(false);


    const userRole =
        String(
            user?.role ||
            ""
        )
            .trim()
            .toUpperCase();


    /* =====================================================
       REDIRECT AUTHENTICATED USER
    ===================================================== */

    if (
        !loading &&
        user
    ) {

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


        if (
            userRole === "SECURITY" ||
            userRole === "SECURITY_OFFICER"
        ) {

            return (
                <Navigate
                    to="/security"
                    replace
                />
            );

        }

    }


    /* =====================================================
       SUBMIT
    ===================================================== */

    const handleSubmit =
        async (
            event
        ) => {

            event.preventDefault();

            setError("");

            setSubmitting(true);


            try {

                const authenticatedUser =
                    await login(
                        username.trim(),
                        password
                    );


                const role =
                    String(
                        authenticatedUser?.role ||
                        ""
                    )
                        .trim()
                        .toUpperCase();


                if (
                    [
                        "ADMIN",
                        "HOMEOWNER",
                        "TENANT",
                        "SECURITY",
                        "SECURITY_OFFICER",
                    ].includes(
                        role
                    )
                ) {

                    return;

                }


                setError(
                    "Your account does not have an assigned portal role."
                );

            } catch (err) {

                console.error(
                    "Login failed:",
                    err
                );


                const responseData =
                    err?.response?.data;


                setError(
                    responseData?.detail ||
                    responseData?.message ||
                    "Unable to sign in. Please check your username and password."
                );

            } finally {

                setSubmitting(false);

            }

        };


    const fromPath =
        location.state?.from?.pathname;


    return (
        <>
            <style>
                {`

                    /* =====================================================
                       oRES LOGIN
                       Responsive / Mobile First
                    ===================================================== */

                    .rems-login-page {

                        min-height:
                            100vh;

                        width:
                            100%;

                        position:
                            relative;

                        overflow-x:
                            hidden;

                        display:
                            flex;

                        flex-direction:
                            column;

                        color:
                            #1f2937;

                        background:
                            linear-gradient(
                                135deg,
                                #f7f9fc 0%,
                                #eef2f7 48%,
                                #f9fafc 100%
                            );
                    }


                    .rems-login-page::before {

                        content:
                            "";

                        position:
                            absolute;

                        width:
                            560px;

                        height:
                            560px;

                        top:
                            -300px;

                        right:
                            -150px;

                        border-radius:
                            50%;

                        background:
                            rgba(
                                37,
                                99,
                                235,
                                0.065
                            );

                        filter:
                            blur(14px);

                        pointer-events:
                            none;
                    }


                    .rems-login-page::after {

                        content:
                            "";

                        position:
                            absolute;

                        width:
                            480px;

                        height:
                            480px;

                        left:
                            -260px;

                        bottom:
                            -250px;

                        border-radius:
                            50%;

                        background:
                            rgba(
                                148,
                                163,
                                184,
                                0.10
                            );

                        filter:
                            blur(12px);

                        pointer-events:
                            none;
                    }


                    /* =====================================================
                       NAVIGATION
                    ===================================================== */

                    .rems-login-nav {

                        position:
                            relative;

                        z-index:
                            5;

                        width:
                            min(
                                100%,
                                1240px
                            );

                        margin:
                            0 auto;

                        padding:
                            20px 28px;

                        display:
                            flex;

                        align-items:
                            center;

                        justify-content:
                            space-between;

                        gap:
                            18px;

                        box-sizing:
                            border-box;
                    }


                    .rems-login-brand {

                        min-width:
                            0;

                        display:
                            inline-flex;

                        align-items:
                            center;

                        gap:
                            10px;

                        color:
                            inherit;

                        text-decoration:
                            none;
                    }


                    .rems-login-brand-mark {

                        width:
                            40px;

                        height:
                            40px;

                        flex:
                            0 0 40px;

                        display:
                            flex;

                        align-items:
                            center;

                        justify-content:
                            center;

                        border-radius:
                            12px;

                        color:
                            #ffffff;

                        background:
                            #1f2937;

                        box-shadow:
                            0 9px 21px
                            rgba(
                                15,
                                23,
                                42,
                                0.12
                            );
                    }


                    .rems-login-brand-mark i {
                        font-size:
                            17px;
                    }


                    .rems-login-brand-name {

                        font-size:
                            15px;

                        font-weight:
                            800;

                        letter-spacing:
                            0.13em;

                        line-height:
                            1;
                    }


                    .rems-login-brand-caption {

                        margin-top:
                            4px;

                        color:
                            #969eaa;

                        font-size:
                            8px;

                        font-weight:
                            700;

                        letter-spacing:
                            0.10em;

                        text-transform:
                            uppercase;

                        white-space:
                            nowrap;
                    }


                    .rems-login-back {

                        display:
                            inline-flex;

                        align-items:
                            center;

                        gap:
                            7px;

                        min-height:
                            40px;

                        color:
                            #7b8594;

                        font-size:
                            11px;

                        font-weight:
                            650;

                        text-decoration:
                            none;

                        white-space:
                            nowrap;
                    }


                    .rems-login-back:hover {

                        color:
                            #374151;
                    }


                    /* =====================================================
                       MAIN
                    ===================================================== */

                    .rems-login-main {

                        position:
                            relative;

                        z-index:
                            3;

                        flex:
                            1;

                        width:
                            min(
                                100%,
                                1120px
                            );

                        margin:
                            0 auto;

                        padding:
                            25px 28px 55px;

                        display:
                            flex;

                        align-items:
                            center;

                        justify-content:
                            center;

                        box-sizing:
                            border-box;
                    }


                    .rems-login-layout {

                        width:
                            100%;

                        display:
                            grid;

                        grid-template-columns:
                            minmax(
                                0,
                                0.95fr
                            )
                            minmax(
                                390px,
                                0.82fr
                            );

                        gap:
                            60px;

                        align-items:
                            center;
                    }


                    /* =====================================================
                       INTRO
                    ===================================================== */

                    .rems-login-intro {

                        min-width:
                            0;

                        max-width:
                            520px;
                    }


                    .rems-login-eyebrow {

                        display:
                            inline-flex;

                        align-items:
                            center;

                        gap:
                            7px;

                        margin-bottom:
                            16px;

                        color:
                            #8993a1;

                        font-size:
                            9px;

                        font-weight:
                            800;

                        letter-spacing:
                            0.14em;

                        text-transform:
                            uppercase;
                    }


                    .rems-login-eyebrow span {

                        width:
                            6px;

                        height:
                            6px;

                        flex:
                            0 0 6px;

                        border-radius:
                            50%;

                        background:
                            #5d9b72;

                        box-shadow:
                            0 0 0 4px
                            rgba(
                                93,
                                155,
                                114,
                                0.10
                            );
                    }


                    .rems-login-heading {

                        margin:
                            0;

                        color:
                            #172033;

                        font-size:
                            clamp(
                                2.6rem,
                                5vw,
                                4.15rem
                            );

                        font-weight:
                            760;

                        line-height:
                            1.02;

                        letter-spacing:
                            -0.055em;
                    }


                    .rems-login-heading span {

                        color:
                            #657083;
                    }


                    .rems-login-description {

                        max-width:
                            500px;

                        margin:
                            20px 0 0;

                        color:
                            #7e8896;

                        font-size:
                            14px;

                        line-height:
                            1.75;
                    }


                    .rems-login-role-strip {

                        display:
                            flex;

                        align-items:
                            center;

                        flex-wrap:
                            wrap;

                        gap:
                            8px;

                        margin-top:
                            24px;
                    }


                    .rems-login-role {

                        display:
                            inline-flex;

                        align-items:
                            center;

                        gap:
                            6px;

                        min-height:
                            30px;

                        padding:
                            6px 9px;

                        border:
                            1px solid
                            rgba(
                                148,
                                163,
                                184,
                                0.13
                            );

                        border-radius:
                            999px;

                        color:
                            #727d8c;

                        background:
                            rgba(
                                255,
                                255,
                                255,
                                0.53
                            );

                        font-size:
                            9px;

                        font-weight:
                            650;
                    }


                    /* =====================================================
                       LOGIN CARD
                    ===================================================== */

                    .rems-login-card {

                        width:
                            100%;

                        min-width:
                            0;

                        box-sizing:
                            border-box;

                        padding:
                            30px;

                        border:
                            1px solid
                            rgba(
                                255,
                                255,
                                255,
                                0.87
                            );

                        border-radius:
                            23px;

                        background:
                            rgba(
                                255,
                                255,
                                255,
                                0.77
                            );

                        box-shadow:
                            0 30px 75px
                            rgba(
                                15,
                                23,
                                42,
                                0.105
                            ),

                            inset 0 1px 0
                            rgba(
                                255,
                                255,
                                255,
                                0.90
                            );

                        -webkit-backdrop-filter:
                            blur(24px);

                        backdrop-filter:
                            blur(24px);
                    }


                    .rems-login-card-header {

                        margin-bottom:
                            24px;
                    }


                    .rems-login-card-icon {

                        width:
                            43px;

                        height:
                            43px;

                        display:
                            flex;

                        align-items:
                            center;

                        justify-content:
                            center;

                        margin-bottom:
                            16px;

                        border-radius:
                            12px;

                        color:
                            #566274;

                        background:
                            #eff2f6;

                        font-size:
                            16px;
                    }


                    .rems-login-card-title {

                        margin:
                            0;

                        color:
                            #243042;

                        font-size:
                            20px;

                        font-weight:
                            730;

                        letter-spacing:
                            -0.025em;
                    }


                    .rems-login-card-subtitle {

                        margin:
                            6px 0 0;

                        color:
                            #919aa6;

                        font-size:
                            11px;

                        line-height:
                            1.6;
                    }


                    /* =====================================================
                       ERROR
                    ===================================================== */

                    .rems-login-alert {

                        display:
                            flex;

                        align-items:
                            flex-start;

                        gap:
                            8px;

                        margin-bottom:
                            17px;

                        padding:
                            11px 12px;

                        border:
                            1px solid
                            rgba(
                                220,
                                53,
                                69,
                                0.12
                            );

                        border-radius:
                            10px;

                        color:
                            #a33440;

                        background:
                            rgba(
                                220,
                                53,
                                69,
                                0.055
                            );

                        font-size:
                            11px;

                        line-height:
                            1.5;
                    }


                    /* =====================================================
                       FORM
                    ===================================================== */

                    .rems-login-field {

                        margin-bottom:
                            17px;
                    }


                    .rems-login-label-row {

                        display:
                            flex;

                        align-items:
                            center;

                        justify-content:
                            space-between;

                        gap:
                            10px;

                        margin-bottom:
                            7px;
                    }


                    .rems-login-label {

                        color:
                            #384354;

                        font-size:
                            11px;

                        font-weight:
                            680;
                    }


                    .rems-login-input-wrap {

                        position:
                            relative;
                    }


                    .rems-login-input-icon {

                        position:
                            absolute;

                        left:
                            13px;

                        top:
                            50%;

                        z-index:
                            2;

                        color:
                            #a0a8b4;

                        font-size:
                            13px;

                        transform:
                            translateY(
                                -50%
                            );

                        pointer-events:
                            none;
                    }


                    .rems-login-input {

                        width:
                            100%;

                        min-height:
                            46px;

                        box-sizing:
                            border-box;

                        padding:
                            10px 12px 10px 39px;

                        border:
                            1px solid
                            rgba(
                                148,
                                163,
                                184,
                                0.17
                            );

                        border-radius:
                            11px;

                        outline:
                            none;

                        color:
                            #273244;

                        background:
                            rgba(
                                255,
                                255,
                                255,
                                0.67
                            );

                        font-size:
                            13px;

                        line-height:
                            1.4;
                    }


                    .rems-login-input::placeholder {

                        color:
                            #adb4bd;
                    }


                    .rems-login-input:focus {

                        border-color:
                            rgba(
                                37,
                                99,
                                235,
                                0.30
                            );

                        background:
                            rgba(
                                255,
                                255,
                                255,
                                0.94
                            );

                        box-shadow:
                            0 0 0 3px
                            rgba(
                                37,
                                99,
                                235,
                                0.075
                            );
                    }


                    .rems-login-password-toggle {

                        position:
                            absolute;

                        right:
                            8px;

                        top:
                            50%;

                        width:
                            34px;

                        height:
                            34px;

                        display:
                            flex;

                        align-items:
                            center;

                        justify-content:
                            center;

                        padding:
                            0;

                        border:
                            0;

                        border-radius:
                            8px;

                        color:
                            #8e98a5;

                        background:
                            transparent;

                        transform:
                            translateY(
                                -50%
                            );
                    }


                    .rems-login-password-toggle:hover {

                        color:
                            #465263;

                        background:
                            rgba(
                                15,
                                23,
                                42,
                                0.04
                            );
                    }


                    .rems-login-password-input {

                        padding-right:
                            48px;
                    }


                    /* =====================================================
                       SUBMIT
                    ===================================================== */

                    .rems-login-submit {

                        width:
                            100%;

                        min-height:
                            48px;

                        display:
                            inline-flex;

                        align-items:
                            center;

                        justify-content:
                            center;

                        gap:
                            8px;

                        margin-top:
                            3px;

                        padding:
                            11px 16px;

                        border:
                            0;

                        border-radius:
                            11px;

                        color:
                            #ffffff;

                        background:
                            #1f2937;

                        box-shadow:
                            0 11px 25px
                            rgba(
                                31,
                                41,
                                55,
                                0.14
                            );

                        font-size:
                            13px;

                        font-weight:
                            700;
                    }


                    .rems-login-submit:hover:not(:disabled) {

                        background:
                            #374151;
                    }


                    .rems-login-submit:disabled {

                        cursor:
                            not-allowed;

                        opacity:
                            0.72;
                    }


                    /* =====================================================
                       SECURITY
                    ===================================================== */

                    .rems-login-security {

                        display:
                            flex;

                        align-items:
                            flex-start;

                        gap:
                            8px;

                        margin-top:
                            17px;

                        padding-top:
                            16px;

                        border-top:
                            1px solid
                            rgba(
                                148,
                                163,
                                184,
                                0.10
                            );

                        color:
                            #929ba7;

                        font-size:
                            9px;

                        line-height:
                            1.65;
                    }


                    /* =====================================================
                       FOOTER
                    ===================================================== */

                    .rems-login-footer {

                        position:
                            relative;

                        z-index:
                            3;

                        width:
                            min(
                                100%,
                                1120px
                            );

                        margin:
                            0 auto;

                        padding:
                            0 28px 20px;

                        display:
                            flex;

                        align-items:
                            center;

                        justify-content:
                            space-between;

                        gap:
                            20px;

                        color:
                            #a1a9b4;

                        font-size:
                            9px;

                        box-sizing:
                            border-box;
                    }


                    /* =====================================================
                       TABLET
                    ===================================================== */

                    @media (max-width: 900px) {

                        .rems-login-layout {

                            grid-template-columns:
                                1fr;

                            max-width:
                                650px;

                            margin:
                                0 auto;

                            gap:
                                30px;
                        }


                        .rems-login-intro {

                            max-width:
                                100%;

                            text-align:
                                center;
                        }


                        .rems-login-eyebrow {

                            justify-content:
                                center;
                        }


                        .rems-login-description {

                            margin-left:
                                auto;

                            margin-right:
                                auto;
                        }


                        .rems-login-role-strip {

                            justify-content:
                                center;
                        }


                        .rems-login-main {

                            padding-top:
                                15px;
                        }

                    }


                    /* =====================================================
                       MOBILE
                    ===================================================== */

                    @media (max-width: 767.98px) {

                        .rems-login-nav {

                            padding:
                                14px;
                        }


                        .rems-login-brand-mark {

                            width:
                                38px;

                            height:
                                38px;

                            flex-basis:
                                38px;
                        }


                        .rems-login-brand-name {

                            font-size:
                                14px;
                        }


                        .rems-login-brand-caption {

                            font-size:
                                7px;
                        }


                        .rems-login-main {

                            padding:
                                20px 14px 32px;

                            align-items:
                                flex-start;
                        }


                        .rems-login-layout {

                            gap:
                                24px;
                        }


                        .rems-login-heading {

                            font-size:
                                clamp(
                                    2.15rem,
                                    10vw,
                                    3.1rem
                                );

                            line-height:
                                1.04;
                        }


                        .rems-login-description {

                            font-size:
                                13px;

                            line-height:
                                1.65;
                        }


                        .rems-login-role-strip {

                            justify-content:
                                flex-start;
                        }


                        .rems-login-role {

                            font-size:
                                9px;
                        }


                        .rems-login-card {

                            padding:
                                22px 18px;

                            border-radius:
                                19px;
                        }


                        .rems-login-card-title {

                            font-size:
                                19px;
                        }


                        .rems-login-card-subtitle {

                            font-size:
                                11px;
                        }


                        .rems-login-label {

                            font-size:
                                12px;
                        }


                        .rems-login-input {

                            min-height:
                                48px;

                            font-size:
                                16px;
                        }


                        .rems-login-input-icon {

                            font-size:
                                14px;
                        }


                        .rems-login-submit {

                            min-height:
                                48px;

                            font-size:
                                13px;
                        }


                        .rems-login-security {

                            font-size:
                                10px;
                        }


                        .rems-login-footer {

                            padding:
                                0 14px 16px;

                            flex-direction:
                                column;

                            align-items:
                                flex-start;

                            font-size:
                                9px;

                            line-height:
                                1.5;
                        }

                    }


                    /* =====================================================
                       SMALL PHONES
                    ===================================================== */

                    @media (max-width: 480px) {

                        .rems-login-nav {

                            padding:
                                12px;
                        }


                        .rems-login-brand-caption {

                            display:
                                none;
                        }


                        .rems-login-back {

                            font-size:
                                10px;
                        }


                        .rems-login-main {

                            padding:
                                17px 12px 28px;
                        }


                        .rems-login-heading {

                            font-size:
                                2.05rem;
                        }


                        .rems-login-description {

                            font-size:
                                13px;
                        }


                        .rems-login-role-strip {

                            display:
                                grid;

                            grid-template-columns:
                                1fr 1fr;

                            gap:
                                7px;
                        }


                        .rems-login-role {

                            width:
                                100%;

                            justify-content:
                                center;

                            box-sizing:
                                border-box;

                            font-size:
                                9px;
                        }


                        .rems-login-card {

                            padding:
                                20px 16px;
                        }


                        .rems-login-card-icon {

                            width:
                                40px;

                            height:
                                40px;
                        }


                        .rems-login-card-title {

                            font-size:
                                18px;
                        }


                        .rems-login-alert {

                            font-size:
                                10px;
                        }


                        .rems-login-security {

                            font-size:
                                9px;
                        }

                    }


                    @media (prefers-reduced-motion: reduce) {

                        .rems-login-page *,
                        .rems-login-page *::before,
                        .rems-login-page *::after {

                            transition:
                                none !important;
                        }

                    }

                `}
            </style>


            <div className="rems-login-page">


                {/* =================================================
                    NAVIGATION
                ================================================= */}

                <nav className="rems-login-nav">

                    <Link
                        to="/"
                        className="rems-login-brand"
                    >

                        <div className="rems-login-brand-mark">

                            <i className="bi bi-buildings" />

                        </div>


                        <div>

                            <div className="rems-login-brand-name">
                                oRES
                            </div>

                            <div className="rems-login-brand-caption">
                                Real Estate Management System
                            </div>

                        </div>

                    </Link>


                    <Link
                        to="/"
                        className="rems-login-back"
                    >

                        <i className="bi bi-arrow-left" />

                        Back to oRES

                    </Link>

                </nav>


                {/* =================================================
                    MAIN
                ================================================= */}

                <main className="rems-login-main">

                    <div className="rems-login-layout">


                        {/* INTRO */}

                        <section className="rems-login-intro">

                            <div className="rems-login-eyebrow">

                                <span />

                                SECURE PORTAL ACCESS

                            </div>


                            <h1 className="rems-login-heading">

                                Welcome back.

                                <br />

                                <span>
                                    Your community,
                                    connected.
                                </span>

                            </h1>


                            <p className="rems-login-description">

                                Sign in to access the oRES
                                management platform. Administrators,
                                homeowners, tenants, and security
                                personnel all use the same secure
                                entry point.

                            </p>


                            <div className="rems-login-role-strip">

                                <div className="rems-login-role">
                                    <i className="bi bi-shield-check" />
                                    Administrator
                                </div>

                                <div className="rems-login-role">
                                    <i className="bi bi-house" />
                                    Homeowner
                                </div>

                                <div className="rems-login-role">
                                    <i className="bi bi-person" />
                                    Tenant
                                </div>

                                <div className="rems-login-role">
                                    <i className="bi bi-person-badge" />
                                    Security
                                </div>

                            </div>

                        </section>


                        {/* LOGIN CARD */}

                        <section className="rems-login-card">

                            <div className="rems-login-card-header">

                                <div className="rems-login-card-icon">

                                    <i className="bi bi-shield-lock" />

                                </div>


                                <h2 className="rems-login-card-title">
                                    Sign in to oRES
                                </h2>


                                <p className="rems-login-card-subtitle">
                                    Use your account credentials
                                    to continue.
                                </p>

                            </div>


                            {error && (

                                <div
                                    className="rems-login-alert"
                                    role="alert"
                                >

                                    <i className="bi bi-exclamation-circle" />

                                    <span>
                                        {error}
                                    </span>

                                </div>

                            )}


                            <form onSubmit={handleSubmit}>

                                <div className="rems-login-field">

                                    <div className="rems-login-label-row">

                                        <label
                                            htmlFor="rems-login-username"
                                            className="rems-login-label"
                                        >
                                            Username
                                        </label>

                                    </div>


                                    <div className="rems-login-input-wrap">

                                        <i className="bi bi-person rems-login-input-icon" />


                                        <input
                                            id="rems-login-username"
                                            type="text"
                                            className="rems-login-input"
                                            value={username}
                                            onChange={(event) =>
                                                setUsername(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Enter your username"
                                            autoComplete="username"
                                            autoFocus
                                            disabled={submitting}
                                            required
                                        />

                                    </div>

                                </div>


                                <div className="rems-login-field">

                                    <div className="rems-login-label-row">

                                        <label
                                            htmlFor="rems-login-password"
                                            className="rems-login-label"
                                        >
                                            Password
                                        </label>

                                    </div>


                                    <div className="rems-login-input-wrap">

                                        <i className="bi bi-lock rems-login-input-icon" />


                                        <input
                                            id="rems-login-password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            className="rems-login-input rems-login-password-input"
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                            disabled={submitting}
                                            required
                                        />


                                        <button
                                            type="button"
                                            className="rems-login-password-toggle"
                                            onClick={() =>
                                                setShowPassword(
                                                    previous =>
                                                        !previous
                                                )
                                            }
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >

                                            <i
                                                className={
                                                    showPassword
                                                        ? "bi bi-eye-slash"
                                                        : "bi bi-eye"
                                                }
                                            />

                                        </button>

                                    </div>

                                </div>


                                <button
                                    type="submit"
                                    className="rems-login-submit"
                                    disabled={
                                        submitting ||
                                        !username.trim() ||
                                        !password
                                    }
                                >

                                    {submitting ? (

                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm"
                                                aria-hidden="true"
                                            />

                                            Signing in...
                                        </>

                                    ) : (

                                        <>
                                            <i className="bi bi-box-arrow-in-right" />
                                            Sign in
                                        </>

                                    )}

                                </button>

                            </form>


                            <div className="rems-login-security">

                                <i className="bi bi-shield-check" />

                                <span>

                                    Your account is protected by
                                    authenticated, role-based access.
                                    You will automatically be directed
                                    to the appropriate oRES portal after
                                    signing in.

                                </span>

                            </div>

                        </section>

                    </div>

                </main>


                <footer className="rems-login-footer">

                    <div>

                        © {new Date().getFullYear()}{" "}

                        <strong>
                            oRES
                        </strong>

                        . Real Estate Management System.

                    </div>


                    <div>
                        Secure community management
                    </div>

                </footer>

            </div>
        </>
    );
}