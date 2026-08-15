import {
    Link,
} from "react-router-dom";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import useAuth from "../../hooks/useAuth";

import {
    getProperties,
} from "../../api/properties";

import {
    getResidents,
} from "../../api/residents";

import {
    getVisitorInvitations,
    getVisitorVisits,
} from "../../api/visitors";

import {
    getVehicles,
    getMotoristStickers,
} from "../../api/vehicles";

import {
    getGates,
} from "../../api/security";


export default function AdminDashboard() {

    const {
        user,
    } = useAuth();


    /* =========================================================
       STATE
    ========================================================= */

    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        refreshing,
        setRefreshing,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState("");


    const [
        data,
        setData,
    ] = useState({

        properties: 0,
        residents: 0,

        homeowners: 0,
        tenants: 0,
        activeResidents: 0,

        visitorsToday: 0,
        pendingVisitors: 0,
        visitorsInside: 0,
        completedVisitors: 0,

        vehicles: 0,
        activeVehicles: 0,

        stickers: 0,
        activeStickers: 0,
        pendingStickers: 0,

        gates: 0,
        activeGates: 0,
        primaryGate: null,

        recentVisits: [],

    });


    const adminName =
        user?.first_name ||
        user?.username ||
        "Administrator";


    /* =========================================================
       LOCAL STYLES
    ========================================================= */

    const dashboardStyles = `

        /* =====================================================
           ADMIN DASHBOARD — BALANCED THEME
        ===================================================== */

        .rems-admin-dashboard {

            --admin-bg:
                rgba(255, 255, 255, 0.70);

            --admin-bg-strong:
                rgba(255, 255, 255, 0.84);

            --admin-border:
                rgba(148, 163, 184, 0.14);

            --admin-border-light:
                rgba(148, 163, 184, 0.10);

            --admin-text:
                #1d2737;

            --admin-text-soft:
                #647084;

            --admin-text-muted:
                #929baa;

            --admin-shadow:
                0 10px 30px
                rgba(15, 23, 42, 0.045);

            --admin-shadow-hover:
                0 18px 42px
                rgba(15, 23, 42, 0.085);

            width: 100%;

            max-width: 1580px;

            margin:
                0 auto;

            padding:
                28px 30px 42px;
        }


        /* =====================================================
           HEADER
        ===================================================== */

        .rems-admin-header {

            display: flex;

            align-items: flex-end;

            justify-content: space-between;

            gap: 24px;

            margin-bottom: 30px;
        }


        .rems-admin-header-copy {

            min-width: 0;

            max-width: 760px;
        }


        .rems-admin-eyebrow {

            margin-bottom: 8px;

            color:
                #7d8796;

            font-size:
                0.68rem;

            font-weight:
                800;

            letter-spacing:
                0.14em;

            text-transform:
                uppercase;
        }


        .rems-admin-title {

            margin: 0;

            color:
                var(--admin-text);

            font-size:
                clamp(
                    1.75rem,
                    2.7vw,
                    2.35rem
                );

            font-weight:
                730;

            line-height:
                1.15;

            letter-spacing:
                -0.04em;
        }


        .rems-admin-description {

            max-width: 640px;

            margin:
                9px 0 0;

            color:
                var(--admin-text-muted);

            font-size:
                0.78rem;

            line-height:
                1.65;
        }


        .rems-admin-date {

            flex:
                0 0 auto;

            display: flex;

            align-items: center;

            gap: 11px;

            min-width: 185px;

            padding:
                10px 13px;

            border:
                1px solid
                var(--admin-border);

            border-radius:
                13px;

            color:
                inherit;

            background:
                rgba(
                    255,
                    255,
                    255,
                    0.58
                );

            box-shadow:
                0 8px 24px
                rgba(
                    15,
                    23,
                    42,
                    0.035
                );

            backdrop-filter:
                blur(14px);

            -webkit-backdrop-filter:
                blur(14px);

            transition:
                transform 160ms ease,
                box-shadow 160ms ease;
        }


        .rems-admin-date:hover:not(:disabled) {

            transform:
                translateY(-1px);

            box-shadow:
                0 12px 28px
                rgba(
                    15,
                    23,
                    42,
                    0.06
                );
        }


        .rems-admin-date:disabled {

            cursor:
                default;
        }


        .rems-admin-date-icon {

            width: 36px;

            height: 36px;

            flex:
                0 0 36px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius:
                10px;

            color:
                #596678;

            background:
                #f0f3f7;

            font-size:
                0.82rem;
        }


        .rems-admin-date-copy {

            display: flex;

            flex-direction: column;

            gap: 2px;

            text-align:
                left;
        }


        .rems-admin-date-label {

            color:
                #9aa3ae;

            font-size:
                0.61rem;

            font-weight:
                700;

            letter-spacing:
                0.10em;

            text-transform:
                uppercase;
        }


        .rems-admin-date-copy strong {

            color:
                #354152;

            font-size:
                0.74rem;

            font-weight:
                650;
        }


        /* =====================================================
           SECTION HEADINGS
        ===================================================== */

        .rems-admin-section {

            margin-bottom:
                28px;
        }


        .rems-admin-section-heading {

            display: flex;

            align-items: flex-end;

            justify-content: space-between;

            gap: 18px;

            margin-bottom:
                14px;
        }


        .rems-admin-section-heading h2 {

            margin:
                0;

            color:
                #253043;

            font-size:
                0.95rem;

            font-weight:
                700;

            letter-spacing:
                -0.02em;
        }


        .rems-admin-section-heading p {

            margin:
                4px 0 0;

            color:
                #929baa;

            font-size:
                0.70rem;

            line-height:
                1.5;
        }


        .rems-admin-live-badge {

            display: inline-flex;

            align-items: center;

            gap: 6px;

            min-height:
                26px;

            padding:
                5px 9px;

            border:
                1px solid
                rgba(
                    93,
                    155,
                    114,
                    0.10
                );

            border-radius:
                999px;

            color:
                #64826f;

            background:
                rgba(
                    93,
                    155,
                    114,
                    0.06
                );

            font-size:
                0.61rem;

            font-weight:
                700;

            white-space:
                nowrap;
        }


        .rems-admin-live-badge span {

            width:
                5px;

            height:
                5px;

            border-radius:
                50%;

            background:
                #5d9b72;
        }


        /* =====================================================
           OVERVIEW CARDS
        ===================================================== */

        .rems-admin-overview-grid {

            display: grid;

            grid-template-columns:
                repeat(
                    4,
                    minmax(
                        0,
                        1fr
                    )
                );

            gap:
                16px;
        }


        .rems-admin-overview-card {

            min-width: 0;

            display: block;

            padding:
                18px;

            border:
                1px solid
                var(--admin-border);

            border-radius:
                17px;

            color:
                inherit;

            text-decoration:
                none;

            background:
                var(--admin-bg);

            box-shadow:
                var(--admin-shadow);

            backdrop-filter:
                blur(17px);

            -webkit-backdrop-filter:
                blur(17px);

            transition:
                transform 180ms ease,
                box-shadow 180ms ease,
                border-color 180ms ease,
                background 180ms ease;
        }


        .rems-admin-overview-card:hover {

            color:
                inherit;

            text-decoration:
                none;

            transform:
                translateY(-2px);

            border-color:
                rgba(
                    100,
                    116,
                    139,
                    0.20
                );

            background:
                rgba(
                    255,
                    255,
                    255,
                    0.80
                );

            box-shadow:
                var(--admin-shadow-hover);
        }


        .rems-admin-overview-top {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 12px;

            margin-bottom:
                22px;
        }


        .rems-admin-overview-icon {

            width: 40px;

            height: 40px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius:
                11px;

            color:
                #566274;

            background:
                #f0f3f7;

            font-size:
                0.88rem;
        }


        .rems-admin-overview-arrow {

            color:
                #b0b8c4;

            font-size:
                0.72rem;
        }


        .rems-admin-overview-value {

            margin-bottom:
                4px;

            color:
                #1d2737;

            font-size:
                1.85rem;

            font-weight:
                730;

            line-height:
                1;

            letter-spacing:
                -0.045em;
        }


        .rems-admin-overview-label {

            color:
                #394556;

            font-size:
                0.77rem;

            font-weight:
                680;
        }


        .rems-admin-overview-description {

            min-height:
                30px;

            margin-top:
                7px;

            color:
                #969fac;

            font-size:
                0.64rem;

            line-height:
                1.55;
        }


        /* =====================================================
           MAIN PANELS
        ===================================================== */

        .rems-admin-panels-grid {

            display: grid;

            grid-template-columns:
                minmax(
                    0,
                    1.32fr
                )
                minmax(
                    330px,
                    0.78fr
                );

            gap:
                18px;

            align-items:
                stretch;
        }


        .rems-admin-panel {

            min-width: 0;

            overflow:
                hidden;

            border:
                1px solid
                var(--admin-border);

            border-radius:
                18px;

            background:
                var(--admin-bg);

            box-shadow:
                var(--admin-shadow);

            backdrop-filter:
                blur(18px);

            -webkit-backdrop-filter:
                blur(18px);
        }


        .rems-admin-panel-header {

            display: flex;

            align-items: flex-start;

            justify-content: space-between;

            gap: 16px;

            padding:
                19px 20px 15px;

            border-bottom:
                1px solid
                var(--admin-border-light);
        }


        .rems-admin-panel-header-copy {

            min-width: 0;
        }


        .rems-admin-panel-title {

            margin:
                0;

            color:
                #293446;

            font-size:
                0.86rem;

            font-weight:
                700;

            letter-spacing:
                -0.015em;
        }


        .rems-admin-panel-subtitle {

            margin:
                4px 0 0;

            color:
                #98a0ac;

            font-size:
                0.64rem;

            line-height:
                1.5;
        }


        .rems-admin-panel-icon {

            width: 33px;

            height: 33px;

            flex:
                0 0 33px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius:
                9px;

            color:
                #6c7889;

            background:
                #f0f3f7;

            font-size:
                0.76rem;
        }


        .rems-admin-panel-body {

            padding:
                18px 20px 20px;
        }


        /* =====================================================
           QUICK ACTIONS
        ===================================================== */

        .rems-admin-actions-grid {

            display: grid;

            grid-template-columns:
                repeat(
                    2,
                    minmax(
                        0,
                        1fr
                    )
                );

            gap:
                11px;
        }


        .rems-admin-action-card {

            min-width: 0;

            display: flex;

            align-items: center;

            gap: 12px;

            min-height:
                76px;

            padding:
                12px;

            border:
                1px solid
                rgba(
                    148,
                    163,
                    184,
                    0.11
                );

            border-radius:
                13px;

            color:
                inherit;

            background:
                rgba(
                    248,
                    250,
                    252,
                    0.58
                );

            text-decoration:
                none;

            transition:
                transform 160ms ease,
                background 160ms ease,
                border-color 160ms ease,
                box-shadow 160ms ease;
        }


        .rems-admin-action-card:hover {

            color:
                inherit;

            text-decoration:
                none;

            transform:
                translateY(-1px);

            border-color:
                rgba(
                    100,
                    116,
                    139,
                    0.18
                );

            background:
                rgba(
                    255,
                    255,
                    255,
                    0.88
                );

            box-shadow:
                0 8px 20px
                rgba(
                    15,
                    23,
                    42,
                    0.045
                );
        }


        .rems-admin-action-icon {

            width: 36px;

            height: 36px;

            flex:
                0 0 36px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius:
                10px;

            color:
                #5d697b;

            background:
                #eef1f5;

            font-size:
                0.82rem;
        }


        .rems-admin-action-copy {

            min-width: 0;

            flex: 1;
        }


        .rems-admin-action-title {

            overflow: hidden;

            color:
                #354051;

            font-size:
                0.71rem;

            font-weight:
                680;

            line-height:
                1.35;

            text-overflow:
                ellipsis;

            white-space:
                nowrap;
        }


        .rems-admin-action-description {

            margin-top:
                3px;

            overflow:
                hidden;

            color:
                #999faa;

            font-size:
                0.59rem;

            line-height:
                1.45;

            text-overflow:
                ellipsis;

            white-space:
                nowrap;
        }


        .rems-admin-action-arrow {

            flex:
                0 0 auto;

            color:
                #b3bac4;

            font-size:
                0.66rem;
        }


        /* =====================================================
           SECURITY
        ===================================================== */

        .rems-admin-security-content {

            display:
                flex;

            flex-direction:
                column;
        }


        .rems-admin-gate-status {

            display: flex;

            align-items: center;

            gap: 12px;

            padding-bottom:
                15px;
        }


        .rems-admin-gate-icon {

            width: 41px;

            height: 41px;

            flex:
                0 0 41px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius:
                11px;

            color:
                #5e9272;

            background:
                #edf5ef;

            font-size:
                0.82rem;
        }


        .rems-admin-gate-copy {

            min-width: 0;

            display: flex;

            flex-direction:
                column;

            gap:
                2px;
        }


        .rems-admin-gate-copy span {

            overflow: hidden;

            color:
                #8c95a2;

            font-size:
                0.61rem;

            text-overflow:
                ellipsis;

            white-space:
                nowrap;
        }


        .rems-admin-gate-copy strong {

            color:
                #394456;

            font-size:
                0.74rem;

            font-weight:
                680;
        }


        .rems-admin-security-divider {

            height:
                1px;

            margin-bottom:
                2px;

            background:
                rgba(
                    148,
                    163,
                    184,
                    0.10
                );
        }


        .rems-admin-security-stat {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 15px;

            padding:
                11px 0;
        }


        .rems-admin-security-stat span {

            color:
                #808a98;

            font-size:
                0.63rem;

            line-height:
                1.4;
        }


        .rems-admin-security-stat strong {

            color:
                #2d394a;

            font-size:
                0.79rem;

            font-weight:
                720;
        }


        .rems-admin-security-link {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 12px;

            margin-top:
                6px;

            padding-top:
                13px;

            border-top:
                1px solid
                rgba(
                    148,
                    163,
                    184,
                    0.10
                );

            color:
                #677285;

            font-size:
                0.62rem;

            font-weight:
                650;

            text-decoration:
                none;
        }


        .rems-admin-security-link:hover {

            color:
                #303b4c;
        }


        /* =====================================================
           LOWER SECTION
        ===================================================== */

        .rems-admin-lower-grid {

            display: grid;

            grid-template-columns:
                minmax(
                    0,
                    1.42fr
                )
                minmax(
                    320px,
                    0.82fr
                );

            gap:
                18px;

            align-items:
                stretch;
        }


        /* =====================================================
           TABLE
        ===================================================== */

        .rems-admin-table-wrapper {

            overflow-x:
                auto;
        }


        .rems-admin-table {

            width:
                100%;

            margin:
                0;

            border-collapse:
                separate;

            border-spacing:
                0;
        }


        .rems-admin-table thead th {

            padding:
                11px 18px;

            color:
                #98a1ad;

            background:
                rgba(
                    248,
                    250,
                    252,
                    0.58
                );

            border-bottom:
                1px solid
                rgba(
                    148,
                    163,
                    184,
                    0.10
                );

            font-size:
                0.59rem;

            font-weight:
                800;

            letter-spacing:
                0.07em;

            text-transform:
                uppercase;

            white-space:
                nowrap;
        }


        .rems-admin-table tbody td {

            padding:
                13px 18px;

            color:
                #6c7786;

            border-bottom:
                1px solid
                rgba(
                    148,
                    163,
                    184,
                    0.075
                );

            font-size:
                0.67rem;

            vertical-align:
                middle;
        }


        .rems-admin-table tbody tr:last-child td {

            border-bottom:
                0;
        }


        .rems-admin-table tbody tr {

            transition:
                background 140ms ease;
        }


        .rems-admin-table tbody tr:hover {

            background:
                rgba(
                    248,
                    250,
                    252,
                    0.68
                );
        }


        .rems-admin-table strong {

            color:
                #3a4555;

            font-weight:
                680;
        }


        .rems-admin-table-subtext {

            margin-top:
                2px;

            color:
                #a0a7b2;

            font-size:
                0.55rem;
        }


        .rems-admin-status {

            display: inline-flex;

            align-items: center;

            justify-content:
                center;

            min-height:
                22px;

            padding:
                4px 8px;

            border-radius:
                999px;

            color:
                #687486;

            background:
                rgba(
                    100,
                    116,
                    139,
                    0.08
                );

            font-size:
                0.54rem;

            font-weight:
                700;
        }


        /* =====================================================
           EMPTY STATE
        ===================================================== */

        .rems-admin-empty {

            min-height:
                245px;

            display:
                flex;

            flex-direction:
                column;

            align-items:
                center;

            justify-content:
                center;

            padding:
                32px 22px;

            text-align:
                center;
        }


        .rems-admin-empty-icon {

            width: 48px;

            height: 48px;

            display: flex;

            align-items: center;

            justify-content: center;

            margin-bottom:
                12px;

            border-radius:
                14px;

            color:
                #8c96a4;

            background:
                #f0f3f6;

            font-size:
                1rem;
        }


        .rems-admin-empty h3 {

            margin:
                0 0 5px;

            color:
                #4a5667;

            font-size:
                0.76rem;

            font-weight:
                680;
        }


        .rems-admin-empty p {

            max-width:
                320px;

            margin:
                0;

            color:
                #9ba2ad;

            font-size:
                0.60rem;

            line-height:
                1.6;
        }


        /* =====================================================
           DATABASE SNAPSHOT
        ===================================================== */

        .rems-admin-snapshot {

            height:
                100%;

            display:
                flex;

            flex-direction:
                column;

            justify-content:
                center;

            padding:
                26px;
        }


        .rems-admin-snapshot-icon {

            width: 44px;

            height: 44px;

            display: flex;

            align-items: center;

            justify-content: center;

            margin-bottom:
                15px;

            border-radius:
                12px;

            color:
                #667386;

            background:
                #eef1f5;

            font-size:
                0.92rem;
        }


        .rems-admin-snapshot-label {

            margin-bottom:
                7px;

            color:
                #99a1ac;

            font-size:
                0.58rem;

            font-weight:
                800;

            letter-spacing:
                0.12em;
        }


        .rems-admin-snapshot h2 {

            max-width:
                360px;

            margin:
                0 0 9px;

            color:
                #344052;

            font-size:
                1.05rem;

            font-weight:
                720;

            line-height:
                1.35;

            letter-spacing:
                -0.018em;
        }


        .rems-admin-snapshot p {

            max-width:
                400px;

            margin:
                0;

            color:
                #929aa7;

            font-size:
                0.63rem;

            line-height:
                1.7;
        }


        .rems-admin-snapshot-items {

            display:
                flex;

            flex-wrap:
                wrap;

            gap:
                8px 14px;

            margin-top:
                19px;
        }


        .rems-admin-snapshot-items span {

            display:
                inline-flex;

            align-items:
                center;

            gap:
                5px;

            color:
                #7b8695;

            font-size:
                0.58rem;
        }


        .rems-admin-snapshot-items i {

            color:
                #76957f;

            font-size:
                0.62rem;
        }


        /* =====================================================
           ERROR
        ===================================================== */

        .rems-admin-error {

            display:
                flex;

            align-items:
                center;

            gap:
                8px;

            margin-bottom:
                20px;

            padding:
                10px 12px;

            border:
                1px solid
                rgba(
                    245,
                    158,
                    11,
                    0.12
                );

            border-radius:
                10px;

            color:
                #956a18;

            background:
                rgba(
                    245,
                    158,
                    11,
                    0.06
                );

            font-size:
                0.64rem;
        }


        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1199.98px) {

            .rems-admin-dashboard {

                padding:
                    24px 24px 36px;
            }


            .rems-admin-overview-grid {

                grid-template-columns:
                    repeat(
                        2,
                        minmax(
                            0,
                            1fr
                        )
                    );
            }


            .rems-admin-panels-grid,
            .rems-admin-lower-grid {

                grid-template-columns:
                    1fr;
            }

        }


        @media (max-width: 767.98px) {

            .rems-admin-dashboard {

                padding:
                    21px 18px 30px;
            }


            .rems-admin-header {

                align-items:
                    stretch;

                flex-direction:
                    column;

                margin-bottom:
                    24px;
            }


            .rems-admin-date {

                width:
                    100%;

                min-width:
                    0;
            }


            .rems-admin-overview-grid {

                grid-template-columns:
                    1fr;

                gap:
                    12px;
            }


            .rems-admin-overview-card {

                padding:
                    16px;
            }


            .rems-admin-actions-grid {

                grid-template-columns:
                    1fr;
            }


            .rems-admin-panel-header {

                padding:
                    17px 16px 14px;
            }


            .rems-admin-panel-body {

                padding:
                    15px 16px 16px;
            }


            .rems-admin-snapshot {

                padding:
                    22px;
            }

        }


        @media (max-width: 480px) {

            .rems-admin-dashboard {

                padding:
                    18px 14px 26px;
            }


            .rems-admin-title {

                font-size:
                    1.65rem;
            }


            .rems-admin-description {

                font-size:
                    0.71rem;
            }


            .rems-admin-section-heading {

                align-items:
                    flex-start;

                flex-direction:
                    column;
            }


            .rems-admin-overview-value {

                font-size:
                    1.65rem;
            }


            .rems-admin-table thead th {

                padding:
                    10px 13px;
            }


            .rems-admin-table tbody td {

                padding:
                    11px 13px;
            }

        }


        @media (prefers-reduced-motion: reduce) {

            .rems-admin-dashboard *,
            .rems-admin-dashboard *::before,
            .rems-admin-dashboard *::after {

                transition:
                    none !important;
            }

        }

    `;


    /* =========================================================
       RESPONSE NORMALIZER
    ========================================================= */

    const normalize = (
        response
    ) => {

        if (
            Array.isArray(
                response
            )
        ) {

            return response;
        }


        if (
            response &&
            Array.isArray(
                response.results
            )
        ) {

            return response.results;
        }


        return [];
    };


    /* =========================================================
       SAFE API REQUEST
    ========================================================= */

    const safeRequest = async (
        name,
        request
    ) => {

        try {

            const response =
                await request();


            return {

                success:
                    true,

                data:
                    response,

                error:
                    null,

                name,

            };

        } catch (err) {

            console.error(
                `[oRES Dashboard] ${name} failed:`,
                err
            );


            return {

                success:
                    false,

                data:
                    null,

                error:
                    err,

                name,

            };
        }
    };


    /* =========================================================
       LOAD DASHBOARD
    ========================================================= */

    const loadDashboard =
        useCallback(
            async (
                silent = false
            ) => {

                if (silent) {

                    setRefreshing(
                        true
                    );

                } else {

                    setLoading(
                        true
                    );
                }


                setError("");


                const [
                    propertiesResult,
                    residentsResult,
                    invitationsResult,
                    visitsResult,
                    vehiclesResult,
                    stickersResult,
                    gatesResult,
                ] = await Promise.all([

                    safeRequest(
                        "Properties",
                        getProperties
                    ),

                    safeRequest(
                        "Residents",
                        getResidents
                    ),

                    safeRequest(
                        "Visitor Invitations",
                        getVisitorInvitations
                    ),

                    safeRequest(
                        "Visitor Visits",
                        getVisitorVisits
                    ),

                    safeRequest(
                        "Vehicles",
                        getVehicles
                    ),

                    safeRequest(
                        "Motorist Stickers",
                        getMotoristStickers
                    ),

                    safeRequest(
                        "Gates",
                        getGates
                    ),

                ]);


                const properties =
                    normalize(
                        propertiesResult.data
                    );


                const residents =
                    normalize(
                        residentsResult.data
                    );


                const invitations =
                    normalize(
                        invitationsResult.data
                    );


                const visits =
                    normalize(
                        visitsResult.data
                    );


                const vehicles =
                    normalize(
                        vehiclesResult.data
                    );


                const stickers =
                    normalize(
                        stickersResult.data
                    );


                const gates =
                    normalize(
                        gatesResult.data
                    );


                /* =====================================================
                   RESIDENT COUNTS
                ===================================================== */

                const homeowners =
                    residents.filter(
                        (
                            resident
                        ) =>
                            resident?.resident_type ===
                            "HOMEOWNER"
                    );


                const tenants =
                    residents.filter(
                        (
                            resident
                        ) =>
                            resident?.resident_type ===
                            "TENANT"
                    );


                const activeResidents =
                    residents.filter(
                        (
                            resident
                        ) =>
                            resident?.is_active ===
                            true
                    );


                /* =====================================================
                   VISITOR COUNTS
                ===================================================== */

                const today =
                    new Date();


                const todayString =
                    [
                        today.getFullYear(),
                        String(
                            today.getMonth() + 1
                        ).padStart(
                            2,
                            "0"
                        ),
                        String(
                            today.getDate()
                        ).padStart(
                            2,
                            "0"
                        ),
                    ].join("-");


                const visitorsToday =
                    invitations.filter(
                        (
                            invitation
                        ) =>
                            invitation?.visit_date ===
                            todayString
                    );


                const pendingVisitors =
                    invitations.filter(
                        (
                            invitation
                        ) =>
                            invitation?.status ===
                            "PENDING"
                    );


                const visitorsInside =
                    visits.filter(
                        (
                            visit
                        ) =>
                            visit?.status ===
                            "INSIDE"
                    );


                const completedVisitors =
                    visits.filter(
                        (
                            visit
                        ) =>
                            visit?.status ===
                            "COMPLETED"
                    );


                /* =====================================================
                   VEHICLES
                ===================================================== */

                const activeVehicles =
                    vehicles.filter(
                        (
                            vehicle
                        ) =>
                            vehicle?.is_active ===
                            true
                    );


                /* =====================================================
                   STICKERS
                ===================================================== */

                const activeStickers =
                    stickers.filter(
                        (
                            sticker
                        ) =>
                            sticker?.status ===
                            "ACTIVE"
                    );


                const pendingStickers =
                    stickers.filter(
                        (
                            sticker
                        ) =>
                            sticker?.status ===
                            "PENDING"
                    );


                /* =====================================================
                   GATES
                ===================================================== */

                const activeGates =
                    gates.filter(
                        (
                            gate
                        ) =>
                            gate?.is_active ===
                            true
                    );


                const primaryGate =
                    gates.find(
                        (
                            gate
                        ) =>
                            gate?.is_primary ===
                            true
                    ) ||
                    gates[0] ||
                    null;


                /* =====================================================
                   RECENT VISITS
                ===================================================== */

                const recentVisits =
                    [...visits]
                        .sort(
                            (
                                first,
                                second
                            ) => {

                                const firstDate =
                                    new Date(
                                        first?.time_in ||
                                        first?.created_at ||
                                        0
                                    );


                                const secondDate =
                                    new Date(
                                        second?.time_in ||
                                        second?.created_at ||
                                        0
                                    );


                                return (
                                    secondDate -
                                    firstDate
                                );
                            }
                        )
                        .slice(
                            0,
                            6
                        );


                /* =====================================================
                   SET DATA
                ===================================================== */

                setData({

                    properties:
                        properties.length,

                    residents:
                        residents.length,

                    homeowners:
                        homeowners.length,

                    tenants:
                        tenants.length,

                    activeResidents:
                        activeResidents.length,

                    visitorsToday:
                        visitorsToday.length,

                    pendingVisitors:
                        pendingVisitors.length,

                    visitorsInside:
                        visitorsInside.length,

                    completedVisitors:
                        completedVisitors.length,

                    vehicles:
                        vehicles.length,

                    activeVehicles:
                        activeVehicles.length,

                    stickers:
                        stickers.length,

                    activeStickers:
                        activeStickers.length,

                    pendingStickers:
                        pendingStickers.length,

                    gates:
                        gates.length,

                    activeGates:
                        activeGates.length,

                    primaryGate,

                    recentVisits,

                });


                const failedModules =
                    [
                        propertiesResult,
                        residentsResult,
                        invitationsResult,
                        visitsResult,
                        vehiclesResult,
                        stickersResult,
                        gatesResult,
                    ]
                    .filter(
                        (
                            result
                        ) =>
                            !result.success
                    )
                    .map(
                        (
                            result
                        ) =>
                            result.name
                    );


                if (
                    failedModules.length
                ) {

                    setError(
                        `Unable to load: ${failedModules.join(
                            ", "
                        )}.`
                    );
                }


                setLoading(
                    false
                );

                setRefreshing(
                    false
                );

            },
            []
        );


    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    useEffect(
        () => {

            loadDashboard();

        },
        [
            loadDashboard,
        ]
    );


    /* =========================================================
       DATE
    ========================================================= */

    const currentDate =
        new Date().toLocaleDateString(
            undefined,
            {
                weekday:
                    "long",

                month:
                    "short",

                day:
                    "numeric",

                year:
                    "numeric",
            }
        );


    /* =========================================================
       OVERVIEW CARDS
    ========================================================= */

    const overviewCards = [

        {
            label:
                "Properties",

            value:
                data.properties,

            description:
                "Registered properties",

            icon:
                "bi-buildings",

            route:
                "/admin/properties",

        },

        {
            label:
                "Residents",

            value:
                data.residents,

            description:
                `${data.homeowners} homeowners • ${data.tenants} tenants`,

            icon:
                "bi-people",

            route:
                "/admin/residents",

        },

        {
            label:
                "Visitors Today",

            value:
                data.visitorsToday,

            description:
                `${data.visitorsInside} currently inside`,

            icon:
                "bi-person-walking",

            route:
                "/admin/visitors",

        },

        {
            label:
                "Vehicles",

            value:
                data.vehicles,

            description:
                `${data.activeVehicles} active registrations`,

            icon:
                "bi-car-front",

            route:
                "/admin/vehicles",

        },

    ];


    /* =========================================================
       QUICK ACTIONS
    ========================================================= */

    const quickActions = [

        {
            title:
                "Manage Visitors",

            description:
                `${data.pendingVisitors} pending • ${data.visitorsInside} inside`,

            icon:
                "bi-person-vcard",

            route:
                "/admin/visitors",

        },

        {
            title:
                "Manage Residents",

            description:
                `${data.activeResidents} active resident profiles`,

            icon:
                "bi-people",

            route:
                "/admin/residents",

        },

        {
            title:
                "Manage Properties",

            description:
                `${data.properties} registered properties`,

            icon:
                "bi-buildings",

            route:
                "/admin/properties",

        },

        {
            title:
                "Manage Vehicles",

            description:
                `${data.activeVehicles} active vehicles`,

            icon:
                "bi-car-front",

            route:
                "/admin/vehicles",

        },

        {
            title:
                "Motorist Stickers",

            description:
                `${data.activeStickers} active • ${data.pendingStickers} pending`,

            icon:
                "bi-shield-check",

            route:
                "/admin/stickers",

        },

        {
            title:
                "Gate Management",

            description:
                `${data.activeGates} of ${data.gates} gates active`,

            icon:
                "bi-door-open",

            route:
                "/admin/gates",

        },

    ];


    /* =========================================================
       TIME FORMAT
    ========================================================= */

    const formatTime = (
        value
    ) => {

        if (!value) {

            return "—";
        }


        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "—";
        }


        return date.toLocaleTimeString(
            [],
            {
                hour:
                    "2-digit",

                minute:
                    "2-digit",
            }
        );
    };


    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {

        return (

            <>
                <style>
                    {dashboardStyles}
                </style>

                <div className="rems-admin-dashboard">

                    <div
                        className="d-flex align-items-center justify-content-center"
                        style={{
                            minHeight:
                                "60vh",
                        }}
                    >

                        <div className="text-center">

                            <div
                                className="spinner-border"
                                role="status"
                            />

                            <div className="mt-3 text-muted small">

                                Loading live oRES data...

                            </div>

                        </div>

                    </div>

                </div>
            </>
        );
    }


    return (

        <>
            <style>
                {dashboardStyles}
            </style>


            <div className="rems-admin-dashboard">


                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="rems-admin-header">

                    <div className="rems-admin-header-copy">

                        <div className="rems-admin-eyebrow">

                            ADMINISTRATION

                        </div>


                        <h1 className="rems-admin-title">

                            Hello! {adminName}

                        </h1>


                        <p className="rems-admin-description">

                            Here's the current overview of
                            your subdivision management system.

                        </p>

                    </div>


                    <button
                        type="button"
                        className="rems-admin-date border-0"
                        onClick={() =>
                            loadDashboard(
                                true
                            )
                        }
                        disabled={
                            refreshing
                        }
                    >

                        <div className="rems-admin-date-icon">

                            {refreshing ? (

                                <span
                                    className="spinner-border spinner-border-sm"
                                />

                            ) : (

                                <i className="bi bi-arrow-clockwise" />

                            )}

                        </div>


                        <div className="rems-admin-date-copy">

                            <span className="rems-admin-date-label">

                                Today's Date

                            </span>


                            <strong>

                                {currentDate}

                            </strong>

                        </div>

                    </button>

                </section>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="rems-admin-error">

                        <i className="bi bi-exclamation-triangle" />

                        <span>
                            {error}
                        </span>

                    </div>

                )}


                {/* =================================================
                    SYSTEM OVERVIEW
                ================================================= */}

                <section className="rems-admin-section">

                    <div className="rems-admin-section-heading">

                        <div>

                            <h2>
                                System Overview
                            </h2>

                            <p>
                                Live records retrieved from the oRES database.
                            </p>

                        </div>


                        <div className="rems-admin-live-badge">

                            <span />

                            Live Data

                        </div>

                    </div>


                    <div className="rems-admin-overview-grid">

                        {overviewCards.map(
                            (
                                card
                            ) => (

                                <Link
                                    key={
                                        card.label
                                    }
                                    to={
                                        card.route
                                    }
                                    className="rems-admin-overview-card"
                                >

                                    <div className="rems-admin-overview-top">

                                        <div className="rems-admin-overview-icon">

                                            <i
                                                className={`bi ${card.icon}`}
                                            />

                                        </div>


                                        <i className="bi bi-arrow-up-right rems-admin-overview-arrow" />

                                    </div>


                                    <div className="rems-admin-overview-value">

                                        {
                                            card.value
                                        }

                                    </div>


                                    <div className="rems-admin-overview-label">

                                        {
                                            card.label
                                        }

                                    </div>


                                    <div className="rems-admin-overview-description">

                                        {
                                            card.description
                                        }

                                    </div>

                                </Link>

                            )
                        )}

                    </div>

                </section>


                {/* =================================================
                    MAIN PANELS
                ================================================= */}

                <section className="rems-admin-section">

                    <div className="rems-admin-panels-grid">


                        {/* =============================================
                            QUICK ACTIONS
                        ============================================= */}

                        <section className="rems-admin-panel">

                            <div className="rems-admin-panel-header">

                                <div className="rems-admin-panel-header-copy">

                                    <h2 className="rems-admin-panel-title">

                                        Quick Actions

                                    </h2>


                                    <p className="rems-admin-panel-subtitle">

                                        Frequently used administration tools.

                                    </p>

                                </div>


                                <div className="rems-admin-panel-icon">

                                    <i className="bi bi-lightning-charge" />

                                </div>

                            </div>


                            <div className="rems-admin-panel-body">

                                <div className="rems-admin-actions-grid">

                                    {quickActions.map(
                                        (
                                            action
                                        ) => (

                                            <Link
                                                key={
                                                    action.title
                                                }
                                                to={
                                                    action.route
                                                }
                                                className="rems-admin-action-card"
                                            >

                                                <div className="rems-admin-action-icon">

                                                    <i
                                                        className={`bi ${action.icon}`}
                                                    />

                                                </div>


                                                <div className="rems-admin-action-copy">

                                                    <div className="rems-admin-action-title">

                                                        {
                                                            action.title
                                                        }

                                                    </div>


                                                    <div className="rems-admin-action-description">

                                                        {
                                                            action.description
                                                        }

                                                    </div>

                                                </div>


                                                <i className="bi bi-chevron-right rems-admin-action-arrow" />

                                            </Link>

                                        )
                                    )}

                                </div>

                            </div>

                        </section>


                        {/* =============================================
                            SECURITY
                        ============================================= */}

                        <section className="rems-admin-panel">

                            <div className="rems-admin-panel-header">

                                <div className="rems-admin-panel-header-copy">

                                    <h2 className="rems-admin-panel-title">

                                        Security Status

                                    </h2>


                                    <p className="rems-admin-panel-subtitle">

                                        Current gate and visitor activity.

                                    </p>

                                </div>


                                <div className="rems-admin-panel-icon">

                                    <i className="bi bi-shield-check" />

                                </div>

                            </div>


                            <div className="rems-admin-panel-body">

                                <div className="rems-admin-security-content">


                                    <div className="rems-admin-gate-status">

                                        <div className="rems-admin-gate-icon">

                                            <i className="bi bi-shield-check" />

                                        </div>


                                        <div className="rems-admin-gate-copy">

                                            <span>

                                                {
                                                    data.primaryGate?.name ||
                                                    "Primary Gate"
                                                }

                                            </span>


                                            <strong>

                                                {
                                                    data.activeGates > 0
                                                        ? "Operational"
                                                        : "No active gate"
                                                }

                                            </strong>

                                        </div>

                                    </div>


                                    <div className="rems-admin-security-divider" />


                                    <div className="rems-admin-security-stat">

                                        <span>
                                            Visitors currently inside
                                        </span>

                                        <strong>

                                            {
                                                data.visitorsInside
                                            }

                                        </strong>

                                    </div>


                                    <div className="rems-admin-security-stat">

                                        <span>
                                            Visitor invitations today
                                        </span>

                                        <strong>

                                            {
                                                data.visitorsToday
                                            }

                                        </strong>

                                    </div>


                                    <div className="rems-admin-security-stat">

                                        <span>
                                            Completed visits
                                        </span>

                                        <strong>

                                            {
                                                data.completedVisitors
                                            }

                                        </strong>

                                    </div>


                                    <div className="rems-admin-security-stat">

                                        <span>
                                            Pending invitations
                                        </span>

                                        <strong>

                                            {
                                                data.pendingVisitors
                                            }

                                        </strong>

                                    </div>


                                    <Link
                                        to="/admin/visitors"
                                        className="rems-admin-security-link"
                                    >

                                        <span>
                                            View visitor activity
                                        </span>

                                        <i className="bi bi-arrow-right" />

                                    </Link>

                                </div>

                            </div>

                        </section>

                    </div>

                </section>


                {/* =================================================
                    LOWER PANELS
                ================================================= */}

                <section className="rems-admin-section">

                    <div className="rems-admin-lower-grid">


                        {/* =============================================
                            RECENT ACTIVITY
                        ============================================= */}

                        <section className="rems-admin-panel">

                            <div className="rems-admin-panel-header">

                                <div className="rems-admin-panel-header-copy">

                                    <h2 className="rems-admin-panel-title">

                                        Recent Visitor Activity

                                    </h2>


                                    <p className="rems-admin-panel-subtitle">

                                        Latest visitor movements from the database.

                                    </p>

                                </div>


                                <div className="rems-admin-panel-icon">

                                    <i className="bi bi-activity" />

                                </div>

                            </div>


                            {data.recentVisits.length ===
                            0 ? (

                                <div className="rems-admin-empty">

                                    <div className="rems-admin-empty-icon">

                                        <i className="bi bi-inbox" />

                                    </div>


                                    <h3>

                                        No recent visitor activity

                                    </h3>


                                    <p>

                                        Visitor visit records will
                                        appear here as activity is recorded.

                                    </p>

                                </div>

                            ) : (

                                <div className="rems-admin-table-wrapper">

                                    <table className="rems-admin-table">

                                        <thead>

                                            <tr>

                                                <th>
                                                    Visitor
                                                </th>

                                                <th>
                                                    Host
                                                </th>

                                                <th>
                                                    Time In
                                                </th>

                                                <th>
                                                    Status
                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {data.recentVisits.map(
                                                (
                                                    visit
                                                ) => (

                                                    <tr
                                                        key={
                                                            visit.id
                                                        }
                                                    >

                                                        <td>

                                                            <strong>

                                                                {
                                                                    visit.visitor_name ||
                                                                    "—"
                                                                }

                                                            </strong>


                                                            {visit.visitor_phone && (

                                                                <div className="rems-admin-table-subtext">

                                                                    {
                                                                        visit.visitor_phone
                                                                    }

                                                                </div>

                                                            )}

                                                        </td>


                                                        <td>

                                                            {
                                                                visit.host_name ||
                                                                "—"
                                                            }

                                                        </td>


                                                        <td>

                                                            {
                                                                formatTime(
                                                                    visit.time_in
                                                                )
                                                            }

                                                        </td>


                                                        <td>

                                                            <span className="rems-admin-status">

                                                                {
                                                                    visit.status_display ||
                                                                    visit.status ||
                                                                    "—"
                                                                }

                                                            </span>

                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            )}

                        </section>


                        {/* =============================================
                            DATABASE SNAPSHOT
                        ============================================= */}

                        <section className="rems-admin-panel">

                            <div className="rems-admin-snapshot">

                                <div className="rems-admin-snapshot-icon">

                                    <i className="bi bi-database-check" />

                                </div>


                                <div className="rems-admin-snapshot-label">

                                    LIVE DATABASE

                                </div>


                                <h2>

                                    oRES records at a glance

                                </h2>


                                <p>

                                    Dashboard values are retrieved
                                    directly from the same services
                                    used throughout the Admin portal.

                                </p>


                                <div className="rems-admin-snapshot-items">

                                    <span>

                                        <i className="bi bi-check2" />

                                        {data.properties}
                                        {" "}
                                        Properties

                                    </span>


                                    <span>

                                        <i className="bi bi-check2" />

                                        {data.residents}
                                        {" "}
                                        Residents

                                    </span>


                                    <span>

                                        <i className="bi bi-check2" />

                                        {data.vehicles}
                                        {" "}
                                        Vehicles

                                    </span>


                                    <span>

                                        <i className="bi bi-check2" />

                                        {data.stickers}
                                        {" "}
                                        Stickers

                                    </span>


                                    <span>

                                        <i className="bi bi-check2" />

                                        {data.visitorsToday}
                                        {" "}
                                        Visitors Today

                                    </span>


                                    <span>

                                        <i className="bi bi-check2" />

                                        {data.activeGates}
                                        {" "}
                                        Active Gates

                                    </span>

                                </div>

                            </div>

                        </section>

                    </div>

                </section>

            </div>
        </>
    );
}