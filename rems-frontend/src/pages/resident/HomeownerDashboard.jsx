import {
    Link,
} from "react-router-dom";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import useAuth from "../../hooks/useAuth";

import {
    getMyVehicles,
    getMotoristStickersMine,
} from "../../api/vehicles";

import {
    getVisitorInvitations,
    getVisitorVisits,
} from "../../api/visitors";

import ResidentDashboard from "./ResidentDashboard";

import api from "../../api/axios";


export default function HomeownerDashboard() {
    return <ResidentDashboard />;

    const {
        user,
    } = useAuth();


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
        resident,
        setResident,
    ] = useState(null);


    const [
        vehicles,
        setVehicles,
    ] = useState([]);


    const [
        stickers,
        setStickers,
    ] = useState([]);


    const [
        invitations,
        setInvitations,
    ] = useState([]);


    const [
        visits,
        setVisits,
    ] = useState([]);


    const homeownerName =
        resident?.full_name ||
        user?.first_name ||
        user?.username ||
        "Homeowner";


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


    const safeRequest = async (
        request
    ) => {

        try {

            return await request();

        } catch {

            return null;

        }

    };


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


                try {

                    const [
                        residentResponse,
                        vehicleResponse,
                        stickerResponse,
                        invitationResponse,
                        visitResponse,
                    ] = await Promise.all([

                        safeRequest(
                            () =>
                                api.get(
                                    "residents/me/"
                                )
                        ),

                        safeRequest(
                            getMyVehicles
                        ),

                        safeRequest(
                            getMotoristStickersMine
                        ),

                        safeRequest(
                            getVisitorInvitations
                        ),

                        safeRequest(
                            getVisitorVisits
                        ),

                    ]);


                    if (
                        residentResponse
                    ) {

                        setResident(
                            residentResponse.data
                        );

                    }


                    setVehicles(
                        normalize(
                            vehicleResponse
                        )
                    );


                    setStickers(
                        normalize(
                            stickerResponse
                        )
                    );


                    setInvitations(
                        normalize(
                            invitationResponse
                        )
                    );


                    setVisits(
                        normalize(
                            visitResponse
                        )
                    );


                } catch (err) {

                    console.error(
                        "Homeowner dashboard failed:",
                        err
                    );

                    setError(
                        "Unable to fully load your resident dashboard."
                    );

                } finally {

                    setLoading(false);

                    setRefreshing(false);

                }

            },
            []
        );


    useEffect(() => {

        loadDashboard();

    }, [
        loadDashboard,
    ]);


    const todayString =
        useMemo(
            () => {

                const today =
                    new Date();

                return [
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

            },
            []
        );


    const visitorsToday =
        invitations.filter(
            (
                invitation
            ) =>
                invitation?.visit_date ===
                todayString
        ).length;


    const pendingVisitors =
        invitations.filter(
            (
                invitation
            ) =>
                invitation?.status ===
                "PENDING"
        ).length;


    const activeVehicles =
        vehicles.filter(
            (
                vehicle
            ) =>
                vehicle?.is_active ===
                true
        ).length;


    const activeStickers =
        stickers.filter(
            (
                sticker
            ) =>
                sticker?.status ===
                "ACTIVE"
        ).length;


    const pendingStickers =
        stickers.filter(
            (
                sticker
            ) =>
                sticker?.status ===
                "PENDING"
        ).length;


    const visitorsInside =
        visits.filter(
            (
                visit
            ) =>
                visit?.status ===
                "INSIDE"
        ).length;


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


    if (loading) {

        return (

            <div className="d-flex align-items-center justify-content-center"
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

                        Loading your REMS portal...

                    </div>

                </div>

            </div>

        );

    }


    return (

        <div className="rems-page-content">


            {/* =====================================================
                HEADER
            ===================================================== */}

            <section className="rems-dashboard-header">

                <div>

                    <div className="rems-eyebrow">

                        HOMEOWNER PORTAL

                    </div>


                    <h1 className="rems-page-title">

                        Good day, {homeownerName}

                    </h1>


                    <p className="rems-page-description">

                        Your property, visitor, vehicle,
                        and access information in one place.

                    </p>

                </div>


                <button
                    type="button"
                    className="rems-dashboard-date border-0"
                    onClick={() =>
                        loadDashboard(
                            true
                        )
                    }
                    disabled={
                        refreshing
                    }
                >

                    <div className="rems-dashboard-date-icon">

                        {refreshing ? (

                            <span className="spinner-border spinner-border-sm" />

                        ) : (

                            <i className="bi bi-arrow-clockwise" />

                        )}

                    </div>


                    <div>

                        <span className="rems-dashboard-date-label">

                            RESIDENT PORTAL

                        </span>

                        <strong>
                            {currentDate}
                        </strong>

                    </div>

                </button>

            </section>


            {error && (

                <div className="alert alert-warning rems-alert mb-4">

                    <i className="bi bi-exclamation-triangle me-2" />

                    {error}

                </div>

            )}


            {/* =====================================================
                SUMMARY
            ===================================================== */}

            <section className="rems-dashboard-section">

                <div className="rems-section-heading">

                    <div>

                        <h2>
                            My Overview
                        </h2>

                        <p>
                            Current activity associated with your resident account.
                        </p>

                    </div>


                    <span className="rems-section-badge">
                        Personal Data
                    </span>

                </div>


                <div className="row g-4">


                    <div className="col-12 col-sm-6 col-xl-3">

                        <Link
                            to="/homeowner/properties"
                            className="rems-overview-card"
                        >

                            <div className="rems-overview-card-content">

                                <div className="rems-overview-top">

                                    <div className="rems-dashboard-icon">

                                        <i className="bi bi-house" />

                                    </div>

                                    <i className="bi bi-arrow-up-right rems-card-arrow" />

                                </div>


                                <div className="rems-overview-value">

                                    {resident ? 1 : 0}

                                </div>


                                <div className="rems-overview-label">

                                    My Properties

                                </div>


                                <div className="rems-overview-description">

                                    Ownership and property relationships

                                </div>

                            </div>

                        </Link>

                    </div>


                    <div className="col-12 col-sm-6 col-xl-3">

                        <Link
                            to="/homeowner/visitors"
                            className="rems-overview-card"
                        >

                            <div className="rems-overview-card-content">

                                <div className="rems-overview-top">

                                    <div className="rems-dashboard-icon">

                                        <i className="bi bi-people" />

                                    </div>

                                    <i className="bi bi-arrow-up-right rems-card-arrow" />

                                </div>


                                <div className="rems-overview-value">

                                    {visitorsToday}

                                </div>


                                <div className="rems-overview-label">

                                    Visitors Today

                                </div>


                                <div className="rems-overview-description">

                                    {pendingVisitors} pending invitations

                                </div>

                            </div>

                        </Link>

                    </div>


                    <div className="col-12 col-sm-6 col-xl-3">

                        <Link
                            to="/homeowner/vehicles"
                            className="rems-overview-card"
                        >

                            <div className="rems-overview-card-content">

                                <div className="rems-overview-top">

                                    <div className="rems-dashboard-icon">

                                        <i className="bi bi-car-front" />

                                    </div>

                                    <i className="bi bi-arrow-up-right rems-card-arrow" />

                                </div>


                                <div className="rems-overview-value">

                                    {activeVehicles}

                                </div>


                                <div className="rems-overview-label">

                                    Active Vehicles

                                </div>


                                <div className="rems-overview-description">

                                    {vehicles.length} registered vehicles

                                </div>

                            </div>

                        </Link>

                    </div>


                    <div className="col-12 col-sm-6 col-xl-3">

                        <Link
                            to="/homeowner/stickers"
                            className="rems-overview-card"
                        >

                            <div className="rems-overview-card-content">

                                <div className="rems-overview-top">

                                    <div className="rems-dashboard-icon">

                                        <i className="bi bi-shield-check" />

                                    </div>

                                    <i className="bi bi-arrow-up-right rems-card-arrow" />

                                </div>


                                <div className="rems-overview-value">

                                    {activeStickers}

                                </div>


                                <div className="rems-overview-label">

                                    Active Stickers

                                </div>


                                <div className="rems-overview-description">

                                    {pendingStickers} pending approval

                                </div>

                            </div>

                        </Link>

                    </div>

                </div>

            </section>


            {/* =====================================================
                PROPERTY STATUS + VISITOR ACTIVITY
            ===================================================== */}

            <div className="row g-4">


                <div className="col-12 col-xl-7">

                    <section className="rems-dashboard-card">

                        <div className="rems-card-header">

                            <div>

                                <h2>
                                    Resident Profile
                                </h2>

                                <p>
                                    Your currently registered resident information.
                                </p>

                            </div>

                            <div className="rems-card-header-icon">

                                <i className="bi bi-person-vcard" />

                            </div>

                        </div>


                        <div className="rems-card-body">

                            <div className="row g-3">

                                <div className="col-12 col-md-6">

                                    <div className="rems-security-stat">

                                        <span>
                                            Full Name
                                        </span>

                                        <strong>
                                            {
                                                resident?.full_name ||
                                                homeownerName
                                            }
                                        </strong>

                                    </div>

                                </div>


                                <div className="col-12 col-md-6">

                                    <div className="rems-security-stat">

                                        <span>
                                            Resident Type
                                        </span>

                                        <strong>
                                            Homeowner
                                        </strong>

                                    </div>

                                </div>


                                <div className="col-12">

                                    <div className="rems-security-stat">

                                        <span>
                                            Registered Address
                                        </span>

                                        <strong>
                                            {
                                                resident?.address ||
                                                "Property information will appear here."
                                            }
                                        </strong>

                                    </div>

                                </div>

                            </div>


                            <Link
                                to="/profile"
                                className="rems-security-link"
                            >

                                <span>
                                    View my profile
                                </span>

                                <i className="bi bi-arrow-right" />

                            </Link>

                        </div>

                    </section>

                </div>


                <div className="col-12 col-xl-5">

                    <section className="rems-dashboard-card rems-security-card">

                        <div className="rems-card-header">

                            <div>

                                <h2>
                                    Visitor Activity
                                </h2>

                                <p>
                                    Current visitor access activity.
                                </p>

                            </div>

                            <div className="rems-status-dot">

                                <span />

                            </div>

                        </div>


                        <div className="rems-card-body">

                            <div className="rems-security-stat">

                                <span>
                                    Invitations today
                                </span>

                                <strong>
                                    {visitorsToday}
                                </strong>

                            </div>


                            <div className="rems-security-stat">

                                <span>
                                    Pending invitations
                                </span>

                                <strong>
                                    {pendingVisitors}
                                </strong>

                            </div>


                            <div className="rems-security-stat">

                                <span>
                                    Visitors currently inside
                                </span>

                                <strong>
                                    {visitorsInside}
                                </strong>

                            </div>


                            <Link
                                to="/homeowner/visitors"
                                className="rems-security-link"
                            >

                                <span>
                                    Manage my visitors
                                </span>

                                <i className="bi bi-arrow-right" />

                            </Link>

                        </div>

                    </section>

                </div>

            </div>


            {/* =====================================================
                QUICK ACTIONS
            ===================================================== */}

            <div className="row g-4 rems-dashboard-lower">


                <div className="col-12">

                    <section className="rems-dashboard-card">

                        <div className="rems-card-header">

                            <div>

                                <h2>
                                    Quick Actions
                                </h2>

                                <p>
                                    Frequently used resident services.
                                </p>

                            </div>

                            <i className="bi bi-lightning-charge rems-header-symbol" />

                        </div>


                        <div className="rems-card-body">

                            <div className="row g-3">


                                <div className="col-12 col-md-6 col-xl-3">

                                    <Link
                                        to="/homeowner/visitors"
                                        className="rems-action-card"
                                    >

                                        <div className="rems-action-icon">

                                            <i className="bi bi-person-plus" />

                                        </div>

                                        <div className="rems-action-content">

                                            <div className="rems-action-title">
                                                Invite Visitor
                                            </div>

                                            <div className="rems-action-description">
                                                Create a secure visitor invitation.
                                            </div>

                                        </div>

                                        <i className="bi bi-chevron-right rems-action-arrow" />

                                    </Link>

                                </div>


                                <div className="col-12 col-md-6 col-xl-3">

                                    <Link
                                        to="/homeowner/vehicles"
                                        className="rems-action-card"
                                    >

                                        <div className="rems-action-icon">

                                            <i className="bi bi-car-front" />

                                        </div>

                                        <div className="rems-action-content">

                                            <div className="rems-action-title">
                                                Manage Vehicles
                                            </div>

                                            <div className="rems-action-description">
                                                Review and register your vehicles.
                                            </div>

                                        </div>

                                        <i className="bi bi-chevron-right rems-action-arrow" />

                                    </Link>

                                </div>


                                <div className="col-12 col-md-6 col-xl-3">

                                    <Link
                                        to="/homeowner/stickers"
                                        className="rems-action-card"
                                    >

                                        <div className="rems-action-icon">

                                            <i className="bi bi-shield-check" />

                                        </div>

                                        <div className="rems-action-content">

                                            <div className="rems-action-title">
                                                My Stickers
                                            </div>

                                            <div className="rems-action-description">
                                                Check sticker approval and status.
                                            </div>

                                        </div>

                                        <i className="bi bi-chevron-right rems-action-arrow" />

                                    </Link>

                                </div>


                                <div className="col-12 col-md-6 col-xl-3">

                                    <Link
                                        to="/profile"
                                        className="rems-action-card"
                                    >

                                        <div className="rems-action-icon">

                                            <i className="bi bi-person" />

                                        </div>

                                        <div className="rems-action-content">

                                            <div className="rems-action-title">
                                                My Profile
                                            </div>

                                            <div className="rems-action-description">
                                                Review your account information.
                                            </div>

                                        </div>

                                        <i className="bi bi-chevron-right rems-action-arrow" />

                                    </Link>

                                </div>

                            </div>

                        </div>

                    </section>

                </div>

            </div>

        </div>

    );
}