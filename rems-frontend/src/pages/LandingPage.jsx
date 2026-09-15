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
                       Responsive / Mobile First
                    ===================================================== */

                    .rems-landing {

                        min-height: 100vh;

                        position: relative;

                        overflow-x: hidden;
                        overflow-y: auto;

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
                            rgba(
                                37,
                                99,
                                235,
                                0.075
                            );

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
                            rgba(
                                148,
                                163,
                                184,
                                0.10
                            );

                        filter:
                            blur(10px);

                        pointer-events: none;
                    }


                    /* =====================================================
                       NAVIGATION
                    ===================================================== */

                    .rems-landing-nav {

                        position:
                            relative;

                        z-index:
                            10;

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


                    .rems-landing-brand {

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


                    .rems-landing-brand-mark {

                        width:
                            42px;

                        height:
                            42px;

                        flex:
                            0 0 42px;

                        display:
                            flex;

                        align-items:
                            center;

                        justify-content:
                            center;

                        border-radius:
                            13px;

                        color:
                            #ffffff;

                        background:
                            #1f2937;

                        box-shadow:
                            0 10px 22px
                            rgba(
                                15,
                                23,
                                42,
                                0.12
                            );
                    }


                    .rems-landing-brand-mark i {

                        font-size:
                            18px;
                    }


                    .rems-landing-brand-name {

                        font-size:
                            15px;

                        font-weight:
                            800;

                        letter-spacing:
                            0.13em;

                        line-height:
                            1;
                    }


                    .rems-landing-brand-caption {

                        margin-top:
                            4px;

                        color:
                            #929aa7;

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


                    .rems-landing-login-button {

                        display:
                            inline-flex;

                        align-items:
                            center;

                        justify-content:
                            center;

                        gap:
                            8px;

                        min-height:
                            42px;

                        padding:
                            9px 16px;

                        border:
                            1px solid
                            rgba(
                                31,
                                41,
                                55,
                                0.12
                            );

                        border-radius:
                            10px;

                        color:
                            #ffffff;

                        background:
                            #1f2937;

                        box-shadow:
                            0 9px 22px
                            rgba(
                                31,
                                41,
                                55,
                                0.13
                            );

                        font-size:
                            12px;

                        font-weight:
                            650;

                        text-decoration:
                            none;

                        white-space:
                            nowrap;
                    }


                    .rems-landing-login-button:hover {

                        color:
                            #ffffff;

                        background:
                            #374151;
                    }


                    /* =====================================================
                       MAIN
                    ===================================================== */

                    .rems-landing-main {

                        position:
                            relative;

                        z-index:
                            2;

                        width:
                            min(
                                100%,
                                1240px
                            );

                        min-height:
                            calc(
                                100vh - 88px
                            );

                        margin:
                            0 auto;

                        padding:
                            35px 28px 70px;

                        display:
                            flex;

                        align-items:
                            center;

                        box-sizing:
                            border-box;
                    }


                    .rems-landing-grid {

                        width:
                            100%;

                        display:
                            grid;

                        grid-template-columns:
                            minmax(
                                0,
                                1.08fr
                            )
                            minmax(
                                390px,
                                0.92fr
                            );

                        gap:
                            55px;

                        align-items:
                            center;
                    }


                    /* =====================================================
                       COPY
                    ===================================================== */

                    .rems-landing-copy {

                        min-width:
                            0;

                        max-width:
                            680px;
                    }


                    .rems-landing-eyebrow {

                        display:
                            inline-flex;

                        align-items:
                            center;

                        gap:
                            8px;

                        margin-bottom:
                            18px;

                        padding:
                            7px 10px;

                        border:
                            1px solid
                            rgba(
                                148,
                                163,
                                184,
                                0.16
                            );

                        border-radius:
                            999px;

                        color:
                            #697586;

                        background:
                            rgba(
                                255,
                                255,
                                255,
                                0.62
                            );

                        font-size:
                            9px;

                        font-weight:
                            800;

                        letter-spacing:
                            0.12em;

                        text-transform:
                            uppercase;
                    }


                    .rems-landing-eyebrow span {

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


                    .rems-landing-title {

                        margin:
                            0;

                        color:
                            #172033;

                        font-size:
                            clamp(
                                2.8rem,
                                6vw,
                                5rem
                            );

                        font-weight:
                            760;

                        line-height:
                            1.02;

                        letter-spacing:
                            -0.055em;
                    }


                    .rems-landing-title-accent {

                        color:
                            #667085;
                    }


                    .rems-landing-description {

                        max-width:
                            610px;

                        margin:
                            23px 0 0;

                        color:
                            #7a8493;

                        font-size:
                            15px;

                        line-height:
                            1.8;
                    }


                    .rems-landing-actions {

                        display:
                            flex;

                        align-items:
                            center;

                        gap:
                            12px;

                        margin-top:
                            28px;
                    }


                    .rems-landing-primary-action,
                    .rems-landing-secondary-action {

                        min-height:
                            48px;

                        box-sizing:
                            border-box;
                    }


                    .rems-landing-primary-action {

                        display:
                            inline-flex;

                        align-items:
                            center;

                        justify-content:
                            center;

                        gap:
                            9px;

                        padding:
                            11px 19px;

                        border-radius:
                            12px;

                        color:
                            #ffffff;

                        background:
                            #1f2937;

                        box-shadow:
                            0 12px 28px
                            rgba(
                                31,
                                41,
                                55,
                                0.15
                            );

                        font-size:
                            12px;

                        font-weight:
                            700;

                        text-decoration:
                            none;
                    }


                    .rems-landing-primary-action:hover {

                        color:
                            #ffffff;

                        background:
                            #374151;
                    }


                    .rems-landing-secondary-action {

                        display:
                            inline-flex;

                        align-items:
                            center;

                        justify-content:
                            center;

                        gap:
                            7px;

                        padding:
                            11px 16px;

                        color:
                            #657184;

                        border:
                            1px solid
                            rgba(
                                148,
                                163,
                                184,
                                0.16
                            );

                        border-radius:
                            12px;

                        background:
                            rgba(
                                255,
                                255,
                                255,
                                0.58
                            );

                        font-size:
                            11px;

                        font-weight:
                            650;

                        text-align:
                            center;
                    }


                    /* =====================================================
                       TRUST
                    ===================================================== */

                    .rems-landing-trust {

                        display:
                            flex;

                        align-items:
                            center;

                        flex-wrap:
                            wrap;

                        gap:
                            15px;

                        margin-top:
                            26px;

                        color:
                            #9aa2ae;

                        font-size:
                            9px;

                        font-weight:
                            600;
                    }


                    .rems-landing-trust-item {

                        display:
                            inline-flex;

                        align-items:
                            center;

                        gap:
                            6px;
                    }


                    .rems-landing-trust-item i {

                        color:
                            #7b8797;

                        font-size:
                            11px;
                    }


                    /* =====================================================
                       COMMUNITY VISUAL
                    ===================================================== */

                    .rems-landing-visual {

                        position:
                            relative;

                        min-width:
                            0;

                        min-height:
                            510px;

                        display:
                            flex;

                        align-items:
                            center;

                        justify-content:
                            center;

                        isolation:
                            isolate;
                    }


                    .rems-landing-community-orbit {

                        position:
                            absolute;

                        width:
                            min(
                                520px,
                                100%
                            );

                        aspect-ratio:
                            1;

                        max-width:
                            100%;

                        border:
                            1px solid
                            rgba(
                                148,
                                163,
                                184,
                                0.14
                            );

                        border-radius:
                            50%;

                        opacity:
                            0.9;
                    }


                    .rems-landing-community-orbit::before {

                        content:
                            "";

                        position:
                            absolute;

                        inset:
                            8%;

                        border:
                            1px dashed
                            rgba(
                                148,
                                163,
                                184,
                                0.13
                            );

                        border-radius:
                            50%;
                    }


                    .rems-landing-community-orbit::after {

                        content:
                            "";

                        position:
                            absolute;

                        inset:
                            19%;

                        border:
                            1px solid
                            rgba(
                                148,
                                163,
                                184,
                                0.09
                            );

                        border-radius:
                            50%;
                    }


                    .rems-landing-community-stage {

                        position:
                            relative;

                        z-index:
                            2;

                        width:
                            min(
                                100%,
                                500px
                            );

                        aspect-ratio:
                            1.02;

                        display:
                            flex;

                        align-items:
                            center;

                        justify-content:
                            center;
                    }


                    .rems-landing-community-stage::before {

                        content:
                            "";

                        position:
                            absolute;

                        width:
                            72%;

                        height:
                            18%;

                        bottom:
                            8%;

                        left:
                            14%;

                        border-radius:
                            50%;

                        background:
                            rgba(
                                15,
                                23,
                                42,
                                0.08
                            );

                        filter:
                            blur(16px);

                        z-index:
                            -1;
                    }


                    .rems-landing-community-panel {

                        position:
                            relative;

                        width:
                            100%;

                        height:
                            100%;

                        overflow:
                            hidden;

                        border:
                            1px solid
                            rgba(
                                255,
                                255,
                                255,
                                0.82
                            );

                        border-radius:
                            28px;

                        background:
                            rgba(
                                255,
                                255,
                                255,
                                0.58
                            );

                        box-shadow:
                            0 34px 80px
                            rgba(
                                15,
                                23,
                                42,
                                0.10
                            ),

                            inset 0 1px 0
                            rgba(
                                255,
                                255,
                                255,
                                0.90
                            );

                        -webkit-backdrop-filter:
                            blur(18px);

                        backdrop-filter:
                            blur(18px);
                    }


                    .rems-landing-community-panel::before {

                        content:
                            "";

                        position:
                            absolute;

                        width:
                            190px;

                        height:
                            190px;

                        top:
                            -85px;

                        right:
                            -45px;

                        border-radius:
                            50%;

                        background:
                            rgba(
                                37,
                                99,
                                235,
                                0.07
                            );

                        z-index:
                            0;
                    }


                    .rems-landing-community-panel::after {

                        content:
                            "";

                        position:
                            absolute;

                        width:
                            170px;

                        height:
                            170px;

                        bottom:
                            -90px;

                        left:
                            -55px;

                        border-radius:
                            50%;

                        background:
                            rgba(
                                93,
                                155,
                                114,
                                0.07
                            );

                        z-index:
                            0;
                    }


                    .rems-landing-community-label {

                        position:
                            absolute;

                        top:
                            18px;

                        left:
                            18px;

                        z-index:
                            5;

                        display:
                            inline-flex;

                        align-items:
                            center;

                        gap:
                            7px;

                        padding:
                            7px 9px;

                        border:
                            1px solid
                            rgba(
                                148,
                                163,
                                184,
                                0.12
                            );

                        border-radius:
                            999px;

                        color:
                            #697586;

                        background:
                            rgba(
                                255,
                                255,
                                255,
                                0.70
                            );

                        font-size:
                            8px;

                        font-weight:
                            800;

                        letter-spacing:
                            0.09em;

                        text-transform:
                            uppercase;
                    }


                    .rems-landing-community-label span {

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


                    .rems-landing-community-art {

                        position:
                            absolute;

                        inset:
                            0;

                        width:
                            100%;

                        height:
                            100%;

                        z-index:
                            1;
                    }


                    .rems-landing-community-caption {

                        position:
                            absolute;

                        left:
                            20px;

                        bottom:
                            18px;

                        z-index:
                            5;

                        display:
                            flex;

                        align-items:
                            center;

                        gap:
                            9px;

                        padding:
                            8px 10px;

                        border:
                            1px solid
                            rgba(
                                148,
                                163,
                                184,
                                0.12
                            );

                        border-radius:
                            10px;

                        background:
                            rgba(
                                255,
                                255,
                                255,
                                0.72
                            );

                        box-shadow:
                            0 10px 24px
                            rgba(
                                15,
                                23,
                                42,
                                0.05
                            );
                    }


                    .rems-landing-community-caption-icon {

                        width:
                            26px;

                        height:
                            26px;

                        display:
                            flex;

                        align-items:
                            center;

                        justify-content:
                            center;

                        border-radius:
                            8px;

                        color:
                            #5f6f82;

                        background:
                            #eef1f5;

                        font-size:
                            10px;
                    }


                    .rems-landing-community-caption-copy {

                        display:
                            flex;

                        flex-direction:
                            column;

                        gap:
                            2px;
                    }


                    .rems-landing-community-caption-copy span {

                        color:
                            #9aa3ae;

                        font-size:
                            7px;

                        text-transform:
                            uppercase;

                        letter-spacing:
                            0.07em;
                    }


                    .rems-landing-community-caption-copy strong {

                        color:
                            #4e5b6e;

                        font-size:
                            9px;

                        font-weight:
                            700;
                    }


                    .rems-landing-person {

                        position:
                            absolute;

                        z-index:
                            4;

                        display:
                            flex;

                        flex-direction:
                            column;

                        align-items:
                            center;

                        justify-content:
                            flex-end;
                    }


                    .rems-landing-person::before {

                        content:
                            "";

                        width:
                            11px;

                        height:
                            11px;

                        border-radius:
                            50%;

                        background:
                            #5c6675;

                        box-shadow:
                            0 2px 5px
                            rgba(
                                15,
                                23,
                                42,
                                0.10
                            );
                    }


                    .rems-landing-person::after {

                        content:
                            "";

                        width:
                            15px;

                        height:
                            25px;

                        margin-top:
                            -1px;

                        border-radius:
                            7px 7px 4px 4px;

                        background:
                            #7c8795;

                        box-shadow:
                            0 4px 8px
                            rgba(
                                15,
                                23,
                                42,
                                0.08
                            );
                    }


                    .rems-landing-person-a {
                        left:
                            13%;

                        bottom:
                            22%;
                    }


                    .rems-landing-person-b {

                        right:
                            11%;

                        bottom:
                            20%;

                        transform:
                            scale(0.92);
                    }


                    .rems-landing-person-c {

                        left:
                            19%;

                        top:
                            28%;

                        transform:
                            scale(0.78);
                    }


                    .rems-landing-person-d {

                        right:
                            18%;

                        top:
                            28%;

                        transform:
                            scale(0.80);
                    }


                    .rems-landing-person-e {

                        right:
                            33%;

                        bottom:
                            14%;

                        transform:
                            scale(0.62);
                    }


                    .rems-landing-house {

                        position:
                            absolute;

                        left:
                            50%;

                        top:
                            52%;

                        width:
                            62%;

                        height:
                            52%;

                        transform:
                            translate(
                                -50%,
                                -50%
                            );

                        z-index:
                            3;
                    }


                    .rems-landing-house-shadow {

                        position:
                            absolute;

                        left:
                            9%;

                        right:
                            9%;

                        bottom:
                            5%;

                        height:
                            9%;

                        border-radius:
                            50%;

                        background:
                            rgba(
                                15,
                                23,
                                42,
                                0.09
                            );

                        filter:
                            blur(7px);
                    }


                    .rems-landing-house-body {

                        position:
                            absolute;

                        left:
                            14%;

                        right:
                            14%;

                        bottom:
                            14%;

                        top:
                            26%;

                        border:
                            1px solid
                            rgba(
                                148,
                                163,
                                184,
                                0.22
                            );

                        border-radius:
                            4px 4px 8px 8px;

                        background:
                            #f6f7f9;

                        box-shadow:
                            0 16px 30px
                            rgba(
                                15,
                                23,
                                42,
                                0.09
                            );
                    }


                    .rems-landing-house-roof {

                        position:
                            absolute;

                        left:
                            8%;

                        right:
                            8%;

                        top:
                            7%;

                        height:
                            32%;

                        clip-path:
                            polygon(
                                50% 0,
                                100% 100%,
                                0 100%
                            );

                        background:
                            #455164;

                        box-shadow:
                            0 12px 20px
                            rgba(
                                15,
                                23,
                                42,
                                0.10
                            );
                    }


                    .rems-landing-house-roof::after {

                        content:
                            "";

                        position:
                            absolute;

                        left:
                            18%;

                        right:
                            18%;

                        bottom:
                            11%;

                        height:
                            16%;

                        border-radius:
                            4px;

                        background:
                            rgba(
                                255,
                                255,
                                255,
                                0.16
                            );
                    }


                    .rems-landing-house-floor {

                        position:
                            absolute;

                        left:
                            18%;

                        right:
                            18%;

                        bottom:
                            18%;

                        height:
                            12%;

                        display:
                            flex;

                        align-items:
                            center;

                        justify-content:
                            center;

                        gap:
                            4px;

                        border-top:
                            1px solid
                            rgba(
                                148,
                                163,
                                184,
                                0.12
                            );
                    }


                    .rems-landing-house-window {

                        width:
                            15%;

                        aspect-ratio:
                            0.85;

                        border:
                            1px solid
                            rgba(
                                96,
                                111,
                                130,
                                0.18
                            );

                        border-radius:
                            2px;

                        background:
                            #dfe8ef;

                        box-shadow:
                            inset 0 2px 0
                            rgba(
                                255,
                                255,
                                255,
                                0.52
                            );
                    }


                    .rems-landing-house-door {

                        position:
                            absolute;

                        left:
                            50%;

                        bottom:
                            0;

                        width:
                            17%;

                        height:
                            32%;

                        transform:
                            translateX(
                                -50%
                            );

                        border:
                            1px solid
                            rgba(
                                65,
                                75,
                                90,
                                0.16
                            );

                        border-bottom:
                            0;

                        border-radius:
                            5px 5px 0 0;

                        background:
                            #556172;
                    }


                    .rems-landing-house-door::after {

                        content:
                            "";

                        position:
                            absolute;

                        width:
                            3px;

                        height:
                            3px;

                        right:
                            14%;

                        top:
                            54%;

                        border-radius:
                            50%;

                        background:
                            #d7dde5;
                    }


                    .rems-landing-side-house {

                        position:
                            absolute;

                        width:
                            20%;

                        height:
                            22%;

                        bottom:
                            21%;

                        z-index:
                            2;

                        opacity:
                            0.88;
                    }


                    .rems-landing-side-house-left {

                        left:
                            5%;
                    }


                    .rems-landing-side-house-right {

                        right:
                            5%;
                    }


                    .rems-landing-side-house-roof {

                        position:
                            absolute;

                        left:
                            8%;

                        right:
                            8%;

                        top:
                            0;

                        height:
                            48%;

                        clip-path:
                            polygon(
                                50% 0,
                                100% 100%,
                                0 100%
                            );

                        background:
                            #7d8897;
                    }


                    .rems-landing-side-house-body {

                        position:
                            absolute;

                        left:
                            16%;

                        right:
                            16%;

                        bottom:
                            0;

                        height:
                            58%;

                        border:
                            1px solid
                            rgba(
                                148,
                                163,
                                184,
                                0.18
                            );

                        border-radius:
                            2px 2px 5px 5px;

                        background:
                            #f9fafb;
                    }


                    .rems-landing-tree {

                        position:
                            absolute;

                        width:
                            32px;

                        height:
                            52px;

                        z-index:
                            3;
                    }


                    .rems-landing-tree::before {

                        content:
                            "";

                        position:
                            absolute;

                        left:
                            50%;

                        top:
                            0;

                        width:
                            25px;

                        height:
                            25px;

                        transform:
                            translateX(
                                -50%
                            );

                        border-radius:
                            50%;

                        background:
                            #91a99a;

                        box-shadow:
                            9px 7px 0
                            #819a8b,
                            -8px 9px 0
                            #9db2a4;
                    }


                    .rems-landing-tree::after {

                        content:
                            "";

                        position:
                            absolute;

                        left:
                            50%;

                        bottom:
                            0;

                        width:
                            5px;

                        height:
                            23px;

                        transform:
                            translateX(
                                -50%
                            );

                        border-radius:
                            3px;

                        background:
                            #7f6c5a;
                    }


                    .rems-landing-tree-a {

                        left:
                            16%;

                        bottom:
                            18%;
                    }


                    .rems-landing-tree-b {

                        right:
                            15%;

                        bottom:
                            17%;

                        transform:
                            scale(
                                0.86
                            );
                    }


                    .rems-landing-tree-c {

                        left:
                            24%;

                        top:
                            17%;

                        transform:
                            scale(
                                0.68
                            );
                    }


                    .rems-landing-tree-d {

                        right:
                            25%;

                        top:
                            15%;

                        transform:
                            scale(
                                0.72
                            );
                    }


                    .rems-landing-road {

                        position:
                            absolute;

                        left:
                            10%;

                        right:
                            10%;

                        bottom:
                            10%;

                        height:
                            13%;

                        z-index:
                            1;

                        border-radius:
                            50%;

                        background:
                            #d6dbe1;

                        transform:
                            perspective(
                                280px
                            )
                            rotateX(
                                55deg
                            );
                    }


                    .rems-landing-road-line {

                        position:
                            absolute;

                        left:
                            34%;

                        right:
                            34%;

                        bottom:
                            5%;

                        height:
                            4px;

                        z-index:
                            2;

                        border-radius:
                            999px;

                        background:
                            rgba(
                                255,
                                255,
                                255,
                                0.85
                            );
                    }


                    .rems-landing-community-caption-copy {
                        min-width:
                            0;
                    }


                    /* =====================================================
                       FOOTER
                    ===================================================== */

                    .rems-landing-footer {

                        position:
                            relative;

                        z-index:
                            4;

                        width:
                            min(
                                100%,
                                1240px
                            );

                        margin:
                            -25px auto 0;

                        padding:
                            0 28px 22px;

                        display:
                            flex;

                        align-items:
                            center;

                        justify-content:
                            space-between;

                        gap:
                            20px;

                        color:
                            #a0a8b3;

                        font-size:
                            9px;

                        box-sizing:
                            border-box;
                    }


                    .rems-landing-footer strong {

                        color:
                            #7d8794;

                        font-weight:
                            650;
                    }


                    /* =====================================================
                       TABLET
                    ===================================================== */

                    @media (max-width: 1050px) {

                        .rems-landing-grid {

                            grid-template-columns:
                                1fr;

                            gap:
                                30px;
                        }


                        .rems-landing-copy {

                            max-width:
                                760px;
                        }


                        .rems-landing-visual {

                            min-height:
                                430px;
                        }


                        .rems-landing-main {

                            padding-top:
                                30px;
                        }

                    }


                    /* =====================================================
                       MOBILE
                    ===================================================== */

                    @media (max-width: 767.98px) {

                        .rems-landing-nav {

                            padding:
                                16px 14px;
                        }


                        .rems-landing-brand-mark {

                            width:
                                38px;

                            height:
                                38px;

                            flex-basis:
                                38px;
                        }


                        .rems-landing-brand-name {

                            font-size:
                                14px;
                        }


                        .rems-landing-brand-caption {

                            font-size:
                                7px;
                        }


                        .rems-landing-login-button {

                            min-width:
                                42px;

                            min-height:
                                42px;

                            padding:
                                9px 12px;
                        }


                        .rems-landing-main {

                            min-height:
                                auto;

                            padding:
                                26px 14px 45px;
                        }


                        .rems-landing-grid {

                            gap:
                                30px;
                        }


                        .rems-landing-copy {

                            text-align:
                                left;
                        }


                        .rems-landing-eyebrow {

                            margin-bottom:
                                15px;

                            font-size:
                                9px;
                        }


                        .rems-landing-title {

                            font-size:
                                clamp(
                                    2.25rem,
                                    11.5vw,
                                    3.5rem
                                );

                            line-height:
                                1.04;
                        }


                        .rems-landing-description {

                            margin-top:
                                18px;

                            font-size:
                                14px;

                            line-height:
                                1.7;
                        }


                        .rems-landing-actions {

                            width:
                                100%;

                            flex-direction:
                                column;

                            align-items:
                                stretch;

                            margin-top:
                                24px;
                        }


                        .rems-landing-primary-action,
                        .rems-landing-secondary-action {

                            width:
                                100%;

                            min-height:
                                48px;

                            font-size:
                                13px;
                        }


                        .rems-landing-trust {

                            gap:
                                10px 14px;

                            margin-top:
                                21px;

                            font-size:
                                10px;

                            line-height:
                                1.4;
                        }


                        .rems-landing-visual {

                            min-height:
                                auto;

                            padding:
                                8px 0 5px;
                        }



                        .rems-landing-community-stage {

                            width:
                                min(
                                    100%,
                                    430px
                                );

                        }


                        .rems-landing-community-orbit {

                            width:
                                min(
                                    410px,
                                    96vw
                                );

                        }


                        .rems-landing-community-caption {

                            left:
                                14px;

                            bottom:
                                14px;

                        }


                        .rems-landing-orbit {

                            width:
                                min(
                                    350px,
                                    88vw
                                );

                            height:
                                min(
                                    350px,
                                    88vw
                                );
                        }


                        .rems-landing-orbit::before {

                            inset:
                                35px;
                        }


                        .rems-landing-orbit::after {

                            inset:
                                75px;
                        }


                        .rems-landing-glass-panel {

                            width:
                                min(
                                    100%,
                                    430px
                                );

                            padding:
                                18px;

                            border-radius:
                                20px;
                        }


                        .rems-landing-panel-name {

                            font-size:
                                11px;
                        }


                        .rems-landing-panel-label {

                            font-size:
                                8px;
                        }


                        .rems-landing-online {

                            font-size:
                                8px;
                        }


                        .rems-landing-panel-heading {

                            font-size:
                                10px;
                        }


                        .rems-landing-mini-card {

                            min-height:
                                88px;

                            padding:
                                12px;
                        }


                        .rems-landing-mini-value {

                            font-size:
                                17px;
                        }


                        .rems-landing-mini-label {

                            font-size:
                                9px;
                        }


                        .rems-landing-security-copy strong {

                            font-size:
                                10px;
                        }


                        .rems-landing-footer {

                            margin:
                                0;

                            padding:
                                0 14px 18px;

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

                        .rems-landing-nav {

                            padding:
                                14px 12px;
                        }


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
                                42px;

                            height:
                                42px;

                            min-width:
                                42px;

                            padding:
                                0;
                        }


                        .rems-landing-main {

                            padding:
                                24px 12px 38px;
                        }


                        .rems-landing-title {

                            font-size:
                                2.2rem;
                        }


                        .rems-landing-description {

                            font-size:
                                13px;

                            line-height:
                                1.65;
                        }


                        .rems-landing-trust {

                            display:
                                grid;

                            grid-template-columns:
                                1fr 1fr;

                            gap:
                                10px;
                        }


                        .rems-landing-visual {

                            padding-top:
                                4px;
                        }


                        .rems-landing-glass-panel {

                            padding:
                                15px;
                        }


                        .rems-landing-panel-top {

                            align-items:
                                flex-start;
                        }


                        .rems-landing-online {

                            font-size:
                                7px;

                            padding:
                                5px 7px;
                        }


                        .rems-landing-panel-metric {

                            gap:
                                8px;
                        }


                        .rems-landing-mini-card {

                            min-height:
                                82px;

                            padding:
                                10px;
                        }


                        .rems-landing-mini-icon {

                            width:
                                26px;

                            height:
                                26px;

                            margin-bottom:
                                8px;
                        }


                        .rems-landing-mini-value {

                            font-size:
                                16px;
                        }


                        .rems-landing-mini-label {

                            font-size:
                                8px;
                        }


                        .rems-landing-panel-bottom {

                            align-items:
                                flex-start;
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
                                Residential Estate Management System
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


                        <div className="rems-landing-copy">

                            


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


                        <div className="rems-landing-visual">

                            <div className="rems-landing-community-orbit" />


                            <div className="rems-landing-community-stage">

                                <div className="rems-landing-community-panel">

                                    <div className="rems-landing-community-label">

                                        

                                        oREs COMMUNITY

                                    </div>


                                    <svg
                                        className="rems-landing-community-art"
                                        viewBox="0 0 620 600"
                                        role="img"
                                        aria-label="Illustration of a modern residential subdivision with homes, trees, a central clubhouse, and people"
                                        preserveAspectRatio="xMidYMid meet"
                                    >

                                        {/* Soft community ground */}

                                        <ellipse
                                            cx="310"
                                            cy="510"
                                            rx="230"
                                            ry="54"
                                            fill="rgba(15,23,42,0.055)"
                                        />


                                        {/* Road */}

                                        <path
                                            d="M76 484 C172 427 451 427 544 486"
                                            fill="none"
                                            stroke="#d5dae1"
                                            strokeWidth="52"
                                            strokeLinecap="round"
                                        />


                                        <path
                                            d="M88 484 C184 442 437 442 532 486"
                                            fill="none"
                                            stroke="#f6f8fa"
                                            strokeWidth="3"
                                            strokeDasharray="15 14"
                                            strokeLinecap="round"
                                        />


                                        {/* Left homes */}

                                        <g opacity="0.88">

                                            <path
                                                d="M76 310 L132 266 L188 310"
                                                fill="#7a8697"
                                            />

                                            <rect
                                                x="91"
                                                y="307"
                                                width="83"
                                                height="81"
                                                rx="5"
                                                fill="#f8fafc"
                                                stroke="#c6ced8"
                                                strokeWidth="1"
                                            />

                                            <rect
                                                x="110"
                                                y="333"
                                                width="17"
                                                height="24"
                                                rx="2"
                                                fill="#dbe5ed"
                                            />

                                            <rect
                                                x="143"
                                                y="333"
                                                width="17"
                                                height="24"
                                                rx="2"
                                                fill="#dbe5ed"
                                            />

                                        </g>


                                        {/* Right homes */}

                                        <g opacity="0.88">

                                            <path
                                                d="M432 310 L488 266 L544 310"
                                                fill="#7a8697"
                                            />

                                            <rect
                                                x="447"
                                                y="307"
                                                width="83"
                                                height="81"
                                                rx="5"
                                                fill="#f8fafc"
                                                stroke="#c6ced8"
                                                strokeWidth="1"
                                            />

                                            <rect
                                                x="466"
                                                y="333"
                                                width="17"
                                                height="24"
                                                rx="2"
                                                fill="#dbe5ed"
                                            />

                                            <rect
                                                x="499"
                                                y="333"
                                                width="17"
                                                height="24"
                                                rx="2"
                                                fill="#dbe5ed"
                                            />

                                        </g>


                                        {/* Central community building */}

                                        <g>

                                            {/* Ground shadow */}

                                            <ellipse
                                                cx="310"
                                                cy="448"
                                                rx="108"
                                                ry="20"
                                                fill="rgba(15,23,42,0.10)"
                                            />


                                            {/* Building body */}

                                            <rect
                                                x="200"
                                                y="282"
                                                width="220"
                                                height="153"
                                                rx="7"
                                                fill="#f7f8fa"
                                                stroke="#bec7d2"
                                                strokeWidth="1.2"
                                            />


                                            {/* Main roof */}

                                            <path
                                                d="M178 290 L310 187 L442 290 Z"
                                                fill="#445063"
                                            />


                                            <path
                                                d="M203 287 L310 207 L417 287"
                                                fill="none"
                                                stroke="rgba(255,255,255,0.19)"
                                                strokeWidth="6"
                                                strokeLinecap="round"
                                            />


                                            {/* Upper facade */}

                                            <rect
                                                x="250"
                                                y="250"
                                                width="120"
                                                height="39"
                                                rx="4"
                                                fill="#eef2f6"
                                                stroke="#c8d0da"
                                                strokeWidth="1"
                                            />


                                            {/* Windows */}

                                            <rect
                                                x="224"
                                                y="312"
                                                width="30"
                                                height="42"
                                                rx="3"
                                                fill="#dce8ef"
                                                stroke="#bcc9d5"
                                                strokeWidth="1"
                                            />

                                            <rect
                                                x="273"
                                                y="312"
                                                width="30"
                                                height="42"
                                                rx="3"
                                                fill="#dce8ef"
                                                stroke="#bcc9d5"
                                                strokeWidth="1"
                                            />

                                            <rect
                                                x="317"
                                                y="312"
                                                width="30"
                                                height="42"
                                                rx="3"
                                                fill="#dce8ef"
                                                stroke="#bcc9d5"
                                                strokeWidth="1"
                                            />

                                            <rect
                                                x="366"
                                                y="312"
                                                width="30"
                                                height="42"
                                                rx="3"
                                                fill="#dce8ef"
                                                stroke="#bcc9d5"
                                                strokeWidth="1"
                                            />


                                            {/* Entry */}

                                            <rect
                                                x="284"
                                                y="345"
                                                width="52"
                                                height="90"
                                                rx="5"
                                                fill="#596576"
                                            />

                                            <rect
                                                x="294"
                                                y="355"
                                                width="32"
                                                height="67"
                                                rx="3"
                                                fill="#697789"
                                            />


                                            {/* Community sign */}

                                            <rect
                                                x="261"
                                                y="258"
                                                width="98"
                                                height="25"
                                                rx="5"
                                                fill="rgba(255,255,255,0.86)"
                                                stroke="#ccd3dc"
                                                strokeWidth="1"
                                            />

                                            <text
                                                x="310"
                                                y="274"
                                                textAnchor="middle"
                                                fill="#5d6878"
                                                fontSize="11"
                                                fontWeight="700"
                                                letterSpacing="2"
                                            >
                                                oRES
                                            </text>

                                        </g>


                                        {/* Trees */}

                                        <g>

                                            <rect
                                                x="144"
                                                y="387"
                                                width="7"
                                                height="37"
                                                rx="3"
                                                fill="#806d5b"
                                            />

                                            <circle
                                                cx="148"
                                                cy="379"
                                                r="18"
                                                fill="#8da595"
                                            />

                                            <circle
                                                cx="134"
                                                cy="388"
                                                r="12"
                                                fill="#9daf9e"
                                            />

                                            <circle
                                                cx="163"
                                                cy="388"
                                                r="12"
                                                fill="#819a89"
                                            />


                                            <rect
                                                x="469"
                                                y="389"
                                                width="7"
                                                height="35"
                                                rx="3"
                                                fill="#806d5b"
                                            />

                                            <circle
                                                cx="472"
                                                cy="381"
                                                r="18"
                                                fill="#8da595"
                                            />

                                            <circle
                                                cx="458"
                                                cy="390"
                                                r="12"
                                                fill="#9daf9e"
                                            />

                                            <circle
                                                cx="487"
                                                cy="390"
                                                r="12"
                                                fill="#819a89"
                                            />

                                        </g>


                                        {/* People around the community */}

                                        <g>

                                            {/* Person left */}

                                            <circle
                                                cx="82"
                                                cy="435"
                                                r="8"
                                                fill="#5e6977"
                                            />

                                            <rect
                                                x="74"
                                                y="444"
                                                width="16"
                                                height="31"
                                                rx="7"
                                                fill="#7a8796"
                                            />

                                            <line
                                                x1="79"
                                                y1="473"
                                                x2="75"
                                                y2="490"
                                                stroke="#667282"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                            />

                                            <line
                                                x1="85"
                                                y1="473"
                                                x2="90"
                                                y2="490"
                                                stroke="#667282"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                            />


                                            {/* Person right */}

                                            <circle
                                                cx="536"
                                                cy="433"
                                                r="8"
                                                fill="#5e6977"
                                            />

                                            <rect
                                                x="528"
                                                y="442"
                                                width="16"
                                                height="31"
                                                rx="7"
                                                fill="#8a94a1"
                                            />

                                            <line
                                                x1="533"
                                                y1="471"
                                                x2="529"
                                                y2="489"
                                                stroke="#667282"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                            />

                                            <line
                                                x1="539"
                                                y1="471"
                                                x2="544"
                                                y2="489"
                                                stroke="#667282"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                            />


                                            {/* Small group */}

                                            <circle
                                                cx="198"
                                                cy="452"
                                                r="6"
                                                fill="#687484"
                                            />

                                            <rect
                                                x="192"
                                                y="459"
                                                width="12"
                                                height="25"
                                                rx="6"
                                                fill="#97a1ad"
                                            />


                                            <circle
                                                cx="424"
                                                cy="454"
                                                r="6"
                                                fill="#687484"
                                            />

                                            <rect
                                                x="418"
                                                y="461"
                                                width="12"
                                                height="25"
                                                rx="6"
                                                fill="#97a1ad"
                                            />

                                        </g>


                                        {/* Small community path */}

                                        <path
                                            d="M224 452 C260 434 358 434 398 452"
                                            fill="none"
                                            stroke="#c7cfd7"
                                            strokeWidth="18"
                                            strokeLinecap="round"
                                        />

                                        <path
                                            d="M224 452 C260 440 358 440 398 452"
                                            fill="none"
                                            stroke="#f8fafc"
                                            strokeWidth="2"
                                            strokeDasharray="7 8"
                                            strokeLinecap="round"
                                        />

                                    </svg>


                                    {/* Caption */}

                                    <div className="rems-landing-community-caption">

                                        <div className="rems-landing-community-caption-icon">

                                            <i className="bi bi-buildings" />

                                        </div>


                                        <div className="rems-landing-community-caption-copy">

                                            <span>
                                                Community operations
                                            </span>

                                            <strong>
                                                Homes, people, access, and security
                                            </strong>

                                        </div>

                                    </div>


                                    {/* People accents */}

                                    <div className="rems-landing-person rems-landing-person-a" />
                                    <div className="rems-landing-person rems-landing-person-b" />
                                    <div className="rems-landing-person rems-landing-person-c" />
                                    <div className="rems-landing-person rems-landing-person-d" />
                                    <div className="rems-landing-person rems-landing-person-e" />

                                </div>

                            </div>

                        </div>

                    </div>

                </main>


                <footer className="rems-landing-footer">

                    <div>

                        © {new Date().getFullYear()}{" "}

                        <strong>
                            oRES
                        </strong>

                        

                    </div>


                    <div>

                        Secure community management platform

                    </div>

                </footer>

            </div>
        </>
    );
}