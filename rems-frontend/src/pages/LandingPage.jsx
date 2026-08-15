
import {
    Link,
} from "react-router-dom";


export default function LandingPage() {

    return (
        <>
            <style>
                {`

                    /* =====================================================
                       oRES LANDING PAGE
                       Self-contained styling
                    ===================================================== */

                    .rems-landing {

                        min-height: 100vh;

                        position: relative;

                        overflow: hidden;

                        color: #18202d;

                        background:
                            linear-gradient(
                                135deg,
                                #f7f9fc 0%,
                                #eef2f7 48%,
                                #f9fafc 100%
                            );
                    }


                    .rems-landing::before {

                        content: "";

                        position: absolute;

                        width: 520px;

                        height: 520px;

                        top: -260px;

                        right: -120px;

                        border-radius: 50%;

                        background:
                            rgba(37, 99, 235, 0.075);

                        filter:
                            blur(12px);

                        pointer-events: none;
                    }


                    .rems-landing::after {

                        content: "";

                        position: absolute;

                        width: 430px;

                        height: 430px;

                        left: -210px;

                        bottom: -210px;

                        border-radius: 50%;

                        background:
                            rgba(148, 163, 184, 0.10);

                        filter:
                            blur(10px);

                        pointer-events: none;
                    }


                    /* =====================================================
                       HEADER
                    ===================================================== */

                    .rems-landing-nav {

                        position: relative;

                        z-index: 10;

                        width: min(
                            100%,
                            1240px
                        );

                        margin: 0 auto;

                        padding:
                            22px 28px;

                        display: flex;

                        align-items: center;

                        justify-content: space-between;

                        gap: 20px;
                    }


                    .rems-landing-brand {

                        display: inline-flex;

                        align-items: center;

                        gap: 11px;

                        color: inherit;

                        text-decoration: none;
                    }


                    .rems-landing-brand-mark {

                        width: 42px;

                        height: 42px;

                        display: flex;

                        align-items: center;

                        justify-content: center;

                        border-radius: 13px;

                        color: #ffffff;

                        background:
                            #1f2937;

                        box-shadow:
                            0 10px 22px
                            rgba(15, 23, 42, 0.12);
                    }


                    .rems-landing-brand-mark i {

                        font-size: 18px;
                    }


                    .rems-landing-brand-name {

                        font-size: 15px;

                        font-weight: 800;

                        letter-spacing: 0.13em;

                        line-height: 1;
                    }


                    .rems-landing-brand-caption {

                        margin-top: 4px;

                        color: #929aa7;

                        font-size: 8px;

                        font-weight: 700;

                        letter-spacing: 0.10em;

                        text-transform: uppercase;
                    }


                    .rems-landing-login-button {

                        display: inline-flex;

                        align-items: center;

                        justify-content: center;

                        gap: 8px;

                        min-height: 41px;

                        padding:
                            9px 16px;

                        border:
                            1px solid
                            rgba(31, 41, 55, 0.12);

                        border-radius: 10px;

                        color: #ffffff;

                        background:
                            #1f2937;

                        box-shadow:
                            0 9px 22px
                            rgba(31, 41, 55, 0.13);

                        font-size: 12px;

                        font-weight: 650;

                        text-decoration: none;

                        transition:
                            transform 180ms ease,
                            background 180ms ease,
                            box-shadow 180ms ease;
                    }


                    .rems-landing-login-button:hover {

                        color: #ffffff;

                        background:
                            #374151;

                        transform:
                            translateY(-1px);

                        box-shadow:
                            0 12px 26px
                            rgba(31, 41, 55, 0.16);
                    }


                    /* =====================================================
                       HERO
                    ===================================================== */

                    .rems-landing-main {

                        position: relative;

                        z-index: 2;

                        width: min(
                            100%,
                            1240px
                        );

                        min-height:
                            calc(
                                100vh - 88px
                            );

                        margin: 0 auto;

                        padding:
                            45px 28px 70px;

                        display: flex;

                        align-items: center;
                    }


                    .rems-landing-grid {

                        width: 100%;

                        display: grid;

                        grid-template-columns:
                            minmax(0, 1.08fr)
                            minmax(420px, 0.92fr);

                        gap: 65px;

                        align-items: center;
                    }


                    /* =====================================================
                       HERO COPY
                    ===================================================== */

                    .rems-landing-copy {

                        max-width: 680px;
                    }


                    .rems-landing-eyebrow {

                        display: inline-flex;

                        align-items: center;

                        gap: 8px;

                        margin-bottom: 18px;

                        padding:
                            7px 10px;

                        border:
                            1px solid
                            rgba(148, 163, 184, 0.16);

                        border-radius:
                            999px;

                        color: #697586;

                        background:
                            rgba(255, 255, 255, 0.62);

                        font-size: 9px;

                        font-weight: 800;

                        letter-spacing: 0.12em;

                        text-transform: uppercase;
                    }


                    .rems-landing-eyebrow span {

                        width: 6px;

                        height: 6px;

                        border-radius: 50%;

                        background:
                            #5d9b72;

                        box-shadow:
                            0 0 0 4px
                            rgba(93, 155, 114, 0.10);
                    }


                    .rems-landing-title {

                        margin: 0;

                        color: #172033;

                        font-size:
                            clamp(
                                2.8rem,
                                6vw,
                                5rem
                            );

                        font-weight: 760;

                        line-height: 1.02;

                        letter-spacing: -0.055em;
                    }


                    .rems-landing-title-accent {

                        color: #667085;
                    }


                    .rems-landing-description {

                        max-width: 610px;

                        margin:
                            24px 0 0;

                        color: #7a8493;

                        font-size: 15px;

                        line-height: 1.8;
                    }


                    .rems-landing-actions {

                        display: flex;

                        align-items: center;

                        gap: 12px;

                        margin-top: 30px;
                    }


                    .rems-landing-primary-action {

                        display: inline-flex;

                        align-items: center;

                        justify-content: center;

                        gap: 9px;

                        min-height: 48px;

                        padding:
                            11px 19px;

                        border-radius: 12px;

                        color: #ffffff;

                        background:
                            #1f2937;

                        box-shadow:
                            0 12px 28px
                            rgba(31, 41, 55, 0.15);

                        font-size: 12px;

                        font-weight: 700;

                        text-decoration: none;

                        transition:
                            transform 180ms ease,
                            background 180ms ease,
                            box-shadow 180ms ease;
                    }


                    .rems-landing-primary-action:hover {

                        color: #ffffff;

                        background:
                            #374151;

                        transform:
                            translateY(-2px);

                        box-shadow:
                            0 16px 32px
                            rgba(31, 41, 55, 0.18);
                    }


                    .rems-landing-secondary-action {

                        display: inline-flex;

                        align-items: center;

                        gap: 7px;

                        min-height: 48px;

                        padding:
                            11px 16px;

                        color: #657184;

                        border:
                            1px solid
                            rgba(148, 163, 184, 0.16);

                        border-radius: 12px;

                        background:
                            rgba(255, 255, 255, 0.58);

                        font-size: 11px;

                        font-weight: 650;
                    }


                    /* =====================================================
                       TRUST
                    ===================================================== */

                    .rems-landing-trust {

                        display: flex;

                        align-items: center;

                        flex-wrap: wrap;

                        gap: 17px;

                        margin-top: 28px;

                        color: #9aa2ae;

                        font-size: 9px;

                        font-weight: 600;
                    }


                    .rems-landing-trust-item {

                        display: inline-flex;

                        align-items: center;

                        gap: 6px;
                    }


                    .rems-landing-trust-item i {

                        color: #7b8797;

                        font-size: 11px;
                    }


                    /* =====================================================
                       VISUAL PANEL
                    ===================================================== */

                    .rems-landing-visual {

                        position: relative;

                        min-height: 510px;

                        display: flex;

                        align-items: center;

                        justify-content: center;
                    }


                    .rems-landing-orbit {

                        position: absolute;

                        width: 440px;

                        height: 440px;

                        border:
                            1px solid
                            rgba(148, 163, 184, 0.12);

                        border-radius: 50%;
                    }


                    .rems-landing-orbit::before {

                        content: "";

                        position: absolute;

                        inset:
                            45px;

                        border:
                            1px dashed
                            rgba(148, 163, 184, 0.14);

                        border-radius: 50%;
                    }


                    .rems-landing-orbit::after {

                        content: "";

                        position: absolute;

                        inset:
                            98px;

                        border:
                            1px solid
                            rgba(148, 163, 184, 0.10);

                        border-radius: 50%;
                    }


                    .rems-landing-glass-panel {

                        position: relative;

                        z-index: 3;

                        width: min(
                            100%,
                            435px
                        );

                        padding:
                            25px;

                        border:
                            1px solid
                            rgba(255, 255, 255, 0.84);

                        border-radius:
                            24px;

                        background:
                            rgba(255, 255, 255, 0.72);

                        box-shadow:
                            0 30px 70px
                            rgba(15, 23, 42, 0.10),

                            inset 0 1px 0
                            rgba(255, 255, 255, 0.88);

                        -webkit-backdrop-filter:
                            blur(24px);

                        backdrop-filter:
                            blur(24px);
                    }


                    .rems-landing-panel-top {

                        display: flex;

                        align-items: center;

                        justify-content: space-between;

                        gap: 15px;

                        margin-bottom: 25px;
                    }


                    .rems-landing-panel-brand {

                        display: flex;

                        align-items: center;

                        gap: 9px;
                    }


                    .rems-landing-panel-mark {

                        width: 33px;

                        height: 33px;

                        display: flex;

                        align-items: center;

                        justify-content: center;

                        border-radius: 10px;

                        color: #ffffff;

                        background: #1f2937;

                        font-size: 12px;
                    }


                    .rems-landing-panel-name {

                        color: #303b4c;

                        font-size: 10px;

                        font-weight: 750;

                        letter-spacing: 0.08em;
                    }


                    .rems-landing-panel-label {

                        color: #a0a8b3;

                        font-size: 8px;

                        letter-spacing: 0.07em;

                        text-transform: uppercase;
                    }


                    .rems-landing-online {

                        display: inline-flex;

                        align-items: center;

                        gap: 6px;

                        padding:
                            6px 8px;

                        border-radius:
                            999px;

                        color: #598369;

                        background:
                            rgba(93, 155, 114, 0.08);

                        font-size: 8px;

                        font-weight: 700;
                    }


                    .rems-landing-online span {

                        width: 5px;

                        height: 5px;

                        border-radius: 50%;

                        background: #5d9b72;
                    }


                    /* =====================================================
                       VISUAL METRIC
                    ===================================================== */

                    .rems-landing-panel-heading {

                        margin-bottom:
                            18px;

                        color: #8892a0;

                        font-size: 9px;

                        font-weight: 700;

                        letter-spacing: 0.08em;

                        text-transform: uppercase;
                    }


                    .rems-landing-panel-metric {

                        display: grid;

                        grid-template-columns:
                            repeat(2, minmax(0, 1fr));

                        gap: 11px;
                    }


                    .rems-landing-mini-card {

                        min-height: 94px;

                        padding:
                            14px;

                        border:
                            1px solid
                            rgba(148, 163, 184, 0.11);

                        border-radius: 14px;

                        background:
                            rgba(248, 250, 252, 0.64);
                    }


                    .rems-landing-mini-icon {

                        width: 28px;

                        height: 28px;

                        display: flex;

                        align-items: center;

                        justify-content: center;

                        margin-bottom: 10px;

                        border-radius: 8px;

                        color: #667386;

                        background: #eef1f5;

                        font-size: 11px;
                    }


                    .rems-landing-mini-value {

                        color: #293445;

                        font-size: 18px;

                        font-weight: 750;

                        line-height: 1;
                    }


                    .rems-landing-mini-label {

                        margin-top: 5px;

                        color: #8e98a5;

                        font-size: 8px;
                    }


                    /* =====================================================
                       PANEL BOTTOM
                    ===================================================== */

                    .rems-landing-panel-bottom {

                        display: flex;

                        align-items: center;

                        justify-content: space-between;

                        gap: 15px;

                        margin-top: 18px;

                        padding-top: 17px;

                        border-top:
                            1px solid
                            rgba(148, 163, 184, 0.10);
                    }


                    .rems-landing-panel-security {

                        display: flex;

                        align-items: center;

                        gap: 8px;
                    }


                    .rems-landing-security-icon {

                        width: 30px;

                        height: 30px;

                        display: flex;

                        align-items: center;

                        justify-content: center;

                        border-radius: 9px;

                        color: #5b9270;

                        background: #edf5ef;

                        font-size: 10px;
                    }


                    .rems-landing-security-copy {

                        display: flex;

                        flex-direction: column;

                        gap: 2px;
                    }


                    .rems-landing-security-copy span {

                        color: #9aa3ae;

                        font-size: 7px;

                        text-transform: uppercase;

                        letter-spacing: 0.06em;
                    }


                    .rems-landing-security-copy strong {

                        color: #536071;

                        font-size: 9px;
                    }


                    .rems-landing-panel-arrow {

                        color: #a4adb9;

                        font-size: 13px;
                    }


                    /* =====================================================
                       FOOTER
                    ===================================================== */

                    .rems-landing-footer {

                        position: relative;

                        z-index: 4;

                        width: min(
                            100%,
                            1240px
                        );

                        margin: -25px auto 0;

                        padding:
                            0 28px 22px;

                        display: flex;

                        align-items: center;

                        justify-content: space-between;

                        gap: 20px;

                        color: #a0a8b3;

                        font-size: 8px;
                    }


                    .rems-landing-footer strong {

                        color: #7d8794;

                        font-weight: 650;
                    }


                    /* =====================================================
                       RESPONSIVE
                    ===================================================== */

                    @media (max-width: 1050px) {

                        .rems-landing-grid {

                            grid-template-columns:
                                1fr;

                            gap: 35px;
                        }


                        .rems-landing-copy {

                            max-width: 760px;
                        }


                        .rems-landing-visual {

                            min-height: 460px;
                        }


                        .rems-landing-main {

                            padding-top: 30px;
                        }

                    }


                    @media (max-width: 767.98px) {

                        .rems-landing-nav {

                            padding:
                                18px 18px;
                        }


                        .rems-landing-main {

                            min-height:
                                auto;

                            padding:
                                28px 18px 55px;
                        }


                        .rems-landing-title {

                            font-size:
                                clamp(
                                    2.5rem,
                                    12vw,
                                    4rem
                                );
                        }


                        .rems-landing-description {

                            font-size: 13px;
                        }


                        .rems-landing-actions {

                            flex-direction:
                                column;

                            align-items:
                                stretch;
                        }


                        .rems-landing-primary-action,
                        .rems-landing-secondary-action {

                            width:
                                100%;
                        }


                        .rems-landing-trust {

                            gap:
                                12px;
                        }


                        .rems-landing-visual {

                            min-height:
                                400px;
                        }


                        .rems-landing-orbit {

                            width:
                                350px;

                            height:
                                350px;
                        }


                        .rems-landing-glass-panel {

                            padding:
                                20px;
                        }


                        .rems-landing-footer {

                            margin:
                                0;

                            padding:
                                0 18px 18px;

                            flex-direction:
                                column;

                            align-items:
                                flex-start;
                        }

                    }


                    @media (max-width: 480px) {

                        .rems-landing-brand-caption {

                            display:
                                none;
                        }


                        .rems-landing-login-button span {

                            display:
                                none;
                        }


                        .rems-landing-login-button {

                            width:
                                40px;

                            height:
                                40px;

                            padding:
                                0;
                        }


                        .rems-landing-visual {

                            min-height:
                                350px;
                        }


                        .rems-landing-orbit {

                            width:
                                300px;

                            height:
                                300px;
                        }


                        .rems-landing-panel-metric {

                            grid-template-columns:
                                1fr 1fr;
                        }

                    }


                    @media (prefers-reduced-motion: reduce) {

                        .rems-landing *,
                        .rems-landing *::before,
                        .rems-landing *::after {

                            transition:
                                none !important;
                        }

                    }

                `}
            </style>


            <div className="rems-landing">


                {/* =================================================
                    NAVIGATION
                ================================================= */}

                <nav className="rems-landing-nav">


                    <Link
                        to="/"
                        className="rems-landing-brand"
                    >

                        <div className="rems-landing-brand-mark">

                            <i className="bi bi-buildings" />

                        </div>


                        <div>

                            <div className="rems-landing-brand-name">
                                oRES
                            </div>

                            <div className="rems-landing-brand-caption">
                                Real Estate Management System
                            </div>

                        </div>

                    </Link>


                    <Link
                        to="/login"
                        className="rems-landing-login-button"
                    >

                        <i className="bi bi-box-arrow-in-right" />

                        <span>
                            Login
                        </span>

                    </Link>

                </nav>


                {/* =================================================
                    HERO
                ================================================= */}

                <main className="rems-landing-main">

                    <div className="rems-landing-grid">


                        {/* =================================================
                            LEFT CONTENT
                        ================================================= */}

                        <div className="rems-landing-copy">


                            <div className="rems-landing-eyebrow">

                                <span />

                                SECURE COMMUNITY MANAGEMENT

                            </div>


                            <h1 className="rems-landing-title">

                                Manage your community
                                <br />

                                <span className="rems-landing-title-accent">
                                    with confidence.
                                </span>

                            </h1>


                            <p className="rems-landing-description">

                                oRES brings properties, residents,
                                visitors, vehicles, security gates,
                                and community operations together
                                in one intelligent management platform.

                            </p>


                            <div className="rems-landing-actions">


                                <Link
                                    to="/login"
                                    className="rems-landing-primary-action"
                                >

                                    <i className="bi bi-shield-lock" />

                                    Enter oRES

                                    <i className="bi bi-arrow-right" />

                                </Link>


                                <div className="rems-landing-secondary-action">

                                    <i className="bi bi-buildings" />

                                    One platform.
                                    Multiple roles.

                                </div>

                            </div>


                            <div className="rems-landing-trust">

                                <div className="rems-landing-trust-item">

                                    <i className="bi bi-shield-check" />

                                    Secure access

                                </div>


                                <div className="rems-landing-trust-item">

                                    <i className="bi bi-people" />

                                    Resident portal

                                </div>


                                <div className="rems-landing-trust-item">

                                    <i className="bi bi-grid" />

                                    Admin management

                                </div>

                            </div>

                        </div>


                        {/* =================================================
                            RIGHT VISUAL
                        ================================================= */}

                        <div className="rems-landing-visual">


                            <div className="rems-landing-orbit" />


                            <div className="rems-landing-glass-panel">


                                {/* PANEL HEADER */}

                                <div className="rems-landing-panel-top">

                                    <div className="rems-landing-panel-brand">

                                        <div className="rems-landing-panel-mark">

                                            <i className="bi bi-buildings" />

                                        </div>


                                        <div>

                                            <div className="rems-landing-panel-name">
                                                oRES
                                            </div>

                                            <div className="rems-landing-panel-label">
                                                Community overview
                                            </div>

                                        </div>

                                    </div>


                                    <div className="rems-landing-online">

                                        <span />

                                        System ready

                                    </div>

                                </div>


                                {/* METRICS */}

                                <div className="rems-landing-panel-heading">

                                    Management at a glance

                                </div>


                                <div className="rems-landing-panel-metric">


                                    <div className="rems-landing-mini-card">

                                        <div className="rems-landing-mini-icon">

                                            <i className="bi bi-buildings" />

                                        </div>

                                        <div className="rems-landing-mini-value">
                                            01
                                        </div>

                                        <div className="rems-landing-mini-label">
                                            Properties
                                        </div>

                                    </div>


                                    <div className="rems-landing-mini-card">

                                        <div className="rems-landing-mini-icon">

                                            <i className="bi bi-people" />

                                        </div>

                                        <div className="rems-landing-mini-value">
                                            02
                                        </div>

                                        <div className="rems-landing-mini-label">
                                            Resident types
                                        </div>

                                    </div>


                                    <div className="rems-landing-mini-card">

                                        <div className="rems-landing-mini-icon">

                                            <i className="bi bi-shield-check" />

                                        </div>

                                        <div className="rems-landing-mini-value">
                                            24/7
                                        </div>

                                        <div className="rems-landing-mini-label">
                                            Security focus
                                        </div>

                                    </div>


                                    <div className="rems-landing-mini-card">

                                        <div className="rems-landing-mini-icon">

                                            <i className="bi bi-qr-code" />

                                        </div>

                                        <div className="rems-landing-mini-value">
                                            QR
                                        </div>

                                        <div className="rems-landing-mini-label">
                                            Visitor access
                                        </div>

                                    </div>


                                </div>


                                {/* BOTTOM STATUS */}

                                <div className="rems-landing-panel-bottom">

                                    <div className="rems-landing-panel-security">

                                        <div className="rems-landing-security-icon">

                                            <i className="bi bi-check2" />

                                        </div>


                                        <div className="rems-landing-security-copy">

                                            <span>
                                                Access control
                                            </span>

                                            <strong>
                                                Role-based portal access
                                            </strong>

                                        </div>

                                    </div>


                                    <i className="bi bi-arrow-up-right rems-landing-panel-arrow" />

                                </div>

                            </div>

                        </div>

                    </div>

                </main>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <footer className="rems-landing-footer">

                    <div>
                        © {new Date().getFullYear()}{" "}
                        <strong>
                            oRES
                        </strong>
                        . Real Estate Management System.
                    </div>


                    <div>
                        Secure community management platform
                    </div>

                </footer>

            </div>
        </>
    );
}
