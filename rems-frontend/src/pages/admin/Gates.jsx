import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsDoorOpen,
    BsPlusLg,
} from "react-icons/bs";

import {
    getGates,
    deleteGate,
} from "../../api/security";

import GateTable
    from "../../components/gates/GateTable";

import GateFormModal
    from "../../components/gates/GateFormModal";

import GateDetailsModal
    from "../../components/gates/GateDetailsModal";


export default function Gates() {

    const [
        gates,
        setGates,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");


    const [
        search,
        setSearch,
    ] = useState("");

    const [
        typeFilter,
        setTypeFilter,
    ] = useState("ALL");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState("ALL");


    const [
        showFormModal,
        setShowFormModal,
    ] = useState(false);

    const [
        showDetailsModal,
        setShowDetailsModal,
    ] = useState(false);


    const [
        selectedGate,
        setSelectedGate,
    ] = useState(null);

    const [
        editingGate,
        setEditingGate,
    ] = useState(null);


    /* =========================================================
       LOAD GATES
    ========================================================= */

    const loadGates = useCallback(
        async () => {

            setLoading(true);
            setError("");

            try {

                const params = {};


                if (
                    search.trim()
                ) {

                    params.search =
                        search.trim();

                }


                if (
                    typeFilter !==
                    "ALL"
                ) {

                    params.gate_type =
                        typeFilter;

                }


                if (
                    statusFilter !==
                    "ALL"
                ) {

                    params.is_active =
                        statusFilter ===
                        "ACTIVE";

                }


                const response =
                    await getGates(
                        params
                    );


                const data =
                    Array.isArray(
                        response
                    )
                        ? response
                        : response?.results ||
                          [];


                setGates(
                    data
                );

            } catch (err) {

                console.error(
                    "Failed to load gates:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to load gates."
                );

            } finally {

                setLoading(false);
            }

        },
        [
            search,
            typeFilter,
            statusFilter,
        ]
    );


    useEffect(() => {

        loadGates();

    }, [
        loadGates,
    ]);


    /* =========================================================
       STATISTICS
    ========================================================= */

    const statistics =
        useMemo(() => {

            const active =
                gates.filter(
                    (gate) =>
                        gate.is_active
                ).length;


            const inactive =
                gates.filter(
                    (gate) =>
                        !gate.is_active
                ).length;


            const primary =
                gates.filter(
                    (gate) =>
                        gate.is_primary
                ).length;


            const mainEntrance =
                gates.filter(
                    (gate) =>
                        gate.gate_type ===
                        "MAIN_ENTRANCE"
                ).length;


            return {

                total:
                    gates.length,

                active,

                inactive,

                primary,

                mainEntrance,

            };

        }, [
            gates,
        ]);


    /* =========================================================
       ADD
    ========================================================= */

    const handleAdd = () => {

        setEditingGate(
            null
        );

        setShowFormModal(
            true
        );

    };


    /* =========================================================
       EDIT
    ========================================================= */

    const handleEdit = (
        gate
    ) => {

        setEditingGate(
            gate
        );

        setShowFormModal(
            true
        );

    };


    /* =========================================================
       VIEW
    ========================================================= */

    const handleView = (
        gate
    ) => {

        setSelectedGate(
            gate
        );

        setShowDetailsModal(
            true
        );

    };


    /* =========================================================
       DELETE
    ========================================================= */

    const handleDelete = async (
        gate
    ) => {

        if (!gate?.id) {
            return;
        }


        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${gate.name}"?`
            );


        if (!confirmed) {
            return;
        }


        setError("");


        try {

            await deleteGate(
                gate.id
            );

            await loadGates();

        } catch (err) {

            console.error(
                "Gate deletion failed:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                "Unable to delete gate."
            );

        }

    };


    /* =========================================================
       FORM SUCCESS
    ========================================================= */

    const handleFormSuccess =
        async () => {

            setShowFormModal(
                false
            );

            setEditingGate(
                null
            );

            await loadGates();

        };


    /* =========================================================
       CLEAR FILTERS
    ========================================================= */

    const clearFilters = () => {

        setSearch("");

        setTypeFilter(
            "ALL"
        );

        setStatusFilter(
            "ALL"
        );

    };


    return (
        <div className="rems-page-content">


            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">
                        SECURITY MANAGEMENT
                    </div>

                    <h1 className="rems-page-title">
                        Gates Management
                    </h1>

                    <p className="rems-page-description">
                        Manage subdivision gates,
                        locations, primary designation,
                        and operational status.
                    </p>

                </div>


                <div className="rems-page-header-actions">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={
                            loadGates
                        }
                        disabled={
                            loading
                        }
                    >

                        <BsArrowClockwise />

                        Refresh

                    </button>


                    <button
                        type="button"
                        className="rems-primary-button"
                        onClick={
                            handleAdd
                        }
                    >

                        <BsPlusLg />

                        Add Gate

                    </button>

                </div>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div
                    className="alert alert-danger rems-alert mb-4"
                    role="alert"
                >

                    <i className="bi bi-exclamation-circle me-2" />

                    {
                        error
                    }

                </div>

            )}


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="row g-3 mb-4">


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <BsDoorOpen />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Total Gates
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.total
                                }
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <i className="bi bi-check-circle" />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Active
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.active
                                }
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <i className="bi bi-star" />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Primary Gates
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.primary
                                }
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <i className="bi bi-box-arrow-in-right" />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Main Entrances
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.mainEntrance
                                }
                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                GLASS CARD
            ================================================= */}

            <div className="rems-glass-card">


                <div className="rems-card-header">

                    <div>

                        <div className="rems-card-title">
                            Gate Registry
                        </div>

                        <div className="rems-card-subtitle">
                            Registered security gates and
                            operational configuration
                        </div>

                    </div>

                </div>


                {/* =================================================
                    FILTERS
                ================================================= */}

                <div className="rems-filter-bar">


                    <div className="rems-search-box">

                        <i className="bi bi-search" />

                        <input
                            type="search"
                            className="form-control"
                            placeholder="Search gate name or location..."
                            value={
                                search
                            }
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    <select
                        className="form-select rems-filter-select"
                        value={
                            typeFilter
                        }
                        onChange={(event) =>
                            setTypeFilter(
                                event.target.value
                            )
                        }
                    >

                        <option value="ALL">
                            All Gate Types
                        </option>

                        <option value="MAIN_ENTRANCE">
                            Main Entrance
                        </option>

                        <option value="SECONDARY">
                            Secondary Gate
                        </option>

                        <option value="SERVICE">
                            Service Gate
                        </option>

                        <option value="EMERGENCY">
                            Emergency Gate
                        </option>

                    </select>


                    <select
                        className="form-select rems-filter-select"
                        value={
                            statusFilter
                        }
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                    >

                        <option value="ALL">
                            All Statuses
                        </option>

                        <option value="ACTIVE">
                            Active
                        </option>

                        <option value="INACTIVE">
                            Inactive
                        </option>

                    </select>


                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={
                            clearFilters
                        }
                    >

                        <i className="bi bi-arrow-counterclockwise" />

                        Reset

                    </button>

                </div>


                {/* =================================================
                    SUMMARY
                ================================================= */}

                <div className="rems-table-toolbar">

                    <div>

                        <div className="rems-card-title">
                            Gate Records
                        </div>

                        <div className="rems-card-subtitle">

                            {loading
                                ? "Loading records..."
                                : `${gates.length} ${
                                      gates.length ===
                                      1
                                          ? "gate"
                                          : "gates"
                                  } found`}

                        </div>

                    </div>

                </div>


                {/* =================================================
                    TABLE
                ================================================= */}

                {loading ? (

                    <div className="rems-loading-state">

                        <div
                            className="spinner-border"
                            role="status"
                        />

                        <div className="mt-3">
                            Loading gates...
                        </div>

                    </div>

                ) : (

                    <GateTable
                        gates={
                            gates
                        }
                        onView={
                            handleView
                        }
                        onEdit={
                            handleEdit
                        }
                        onDelete={
                            handleDelete
                        }
                    />

                )}

            </div>


            {/* =================================================
                FORM MODAL
            ================================================= */}

            <GateFormModal
                show={
                    showFormModal
                }
                gate={
                    editingGate
                }
                onClose={() => {

                    setShowFormModal(
                        false
                    );

                    setEditingGate(
                        null
                    );

                }}
                onSuccess={
                    handleFormSuccess
                }
            />


            {/* =================================================
                DETAILS MODAL
            ================================================= */}

            <GateDetailsModal
                show={
                    showDetailsModal
                }
                gate={
                    selectedGate
                }
                onClose={() => {

                    setShowDetailsModal(
                        false
                    );

                    setSelectedGate(
                        null
                    );

                }}
            />

        </div>
    );
}