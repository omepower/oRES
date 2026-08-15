
import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsPencil,
    BsPersonPlus,
    BsPeople,
    BsPersonCheck,
    BsTrash,
    BsHouseCheck,
} from "react-icons/bs";

import {
    createResident,
    deleteResident,
    getResidentUserOptions,
    getResidents,
    updateResident,
} from "../../api/residents";


export default function Residents() {

    /* =========================================================
       DATA
    ========================================================= */

    const [
        residents,
        setResidents,
    ] = useState([]);

    const [
        userOptions,
        setUserOptions,
    ] = useState([]);


    /* =========================================================
       LOADING / PROCESSING
    ========================================================= */

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        loadingUsers,
        setLoadingUsers,
    ] = useState(false);

    const [
        saving,
        setSaving,
    ] = useState(false);


    /* =========================================================
       FILTERS
    ========================================================= */

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


    /* =========================================================
       MODALS
    ========================================================= */

    const [
        showModal,
        setShowModal,
    ] = useState(false);

    const [
        editingResident,
        setEditingResident,
    ] = useState(null);

    const [
        deleteTarget,
        setDeleteTarget,
    ] = useState(null);


    /* =========================================================
       MESSAGES
    ========================================================= */

    const [
        error,
        setError,
    ] = useState("");

    const [
        success,
        setSuccess,
    ] = useState("");


    /* =========================================================
       FORM
    ========================================================= */

    const emptyForm = {
        user: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        resident_type: "",
        phone: "",
        email: "",
        address: "",
        is_active: true,
    };


    const [
        form,
        setForm,
    ] = useState(
        emptyForm
    );


    /* =========================================================
       LOAD RESIDENTS
    ========================================================= */

    const loadResidents = async () => {

        try {

            setLoading(true);
            setError("");

            const data =
                await getResidents();


            setResidents(
                Array.isArray(
                    data
                )
                    ? data
                    : data?.results ||
                      []
            );

        } catch (err) {

            console.error(
                "Failed to load residents:",
                err
            );

            setError(
                "Unable to load residents."
            );

        } finally {

            setLoading(false);
        }
    };


    /* =========================================================
       LOAD USER OPTIONS
    ========================================================= */

    const loadUserOptions = async () => {

        try {

            setLoadingUsers(
                true
            );

            const data =
                await getResidentUserOptions();


            setUserOptions(
                Array.isArray(
                    data
                )
                    ? data
                    : data?.results ||
                      []
            );

        } catch (err) {

            console.error(
                "Failed to load resident user options:",
                err
            );

            setError(
                "Unable to load eligible user accounts."
            );

        } finally {

            setLoadingUsers(
                false
            );
        }
    };


    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    useEffect(() => {

        loadResidents();

    }, []);


    /* =========================================================
       USER SELECTION
    ========================================================= */

    const handleUserChange = (
        event
    ) => {

        const userId =
            event.target.value;


        const selectedUser =
            userOptions.find(
                (user) =>
                    String(
                        user.id
                    ) ===
                    String(
                        userId
                    )
            );


        if (!selectedUser) {

            setForm(
                (previous) => ({
                    ...previous,

                    user: "",

                    first_name: "",

                    middle_name: "",

                    last_name: "",

                    resident_type: "",

                    phone: "",

                    email: "",
                })
            );

            return;
        }


        const residentType =
            selectedUser.role ===
            "HOMEOWNER"
                ? "HOMEOWNER"
                : "TENANT";


        setForm(
            (previous) => ({
                ...previous,

                user:
                    selectedUser.id,

                first_name:
                    selectedUser.first_name ||
                    "",

                middle_name:
                    "",

                last_name:
                    selectedUser.last_name ||
                    "",

                resident_type:
                    residentType,

                phone:
                    selectedUser.phone ||
                    "",

                email:
                    selectedUser.email ||
                    "",
            })
        );


        setError("");
    };


    /* =========================================================
       GENERIC FORM CHANGE
    ========================================================= */

    const handleChange = (
        event
    ) => {

        const {
            name,
            value,
            type,
            checked,
        } = event.target;


        setForm(
            (previous) => ({
                ...previous,

                [name]:
                    type === "checkbox"
                        ? checked
                        : value,
            })
        );


        setError("");
    };


    /* =========================================================
       STATISTICS
    ========================================================= */

    const statistics =
        useMemo(
            () => {

                const homeowners =
                    residents.filter(
                        (resident) =>
                            resident.resident_type ===
                            "HOMEOWNER"
                    ).length;


                const tenants =
                    residents.filter(
                        (resident) =>
                            resident.resident_type ===
                            "TENANT"
                    ).length;


                const active =
                    residents.filter(
                        (resident) =>
                            resident.is_active
                    ).length;


                return {

                    total:
                        residents.length,

                    homeowners,

                    tenants,

                    active,

                };
            },
            [
                residents,
            ]
        );


    /* =========================================================
       FILTER RESIDENTS
    ========================================================= */

    const filteredResidents =
        useMemo(
            () => {

                const keyword =
                    search
                        .trim()
                        .toLowerCase();


                return residents.filter(
                    (resident) => {

                        const matchesSearch =
                            !keyword ||

                            resident.full_name
                                ?.toLowerCase()
                                .includes(
                                    keyword
                                ) ||

                            resident.username
                                ?.toLowerCase()
                                .includes(
                                    keyword
                                ) ||

                            resident.email
                                ?.toLowerCase()
                                .includes(
                                    keyword
                                ) ||

                            resident.phone
                                ?.toLowerCase()
                                .includes(
                                    keyword
                                );


                        const matchesType =
                            typeFilter ===
                                "ALL" ||
                            resident.resident_type ===
                                typeFilter;


                        const matchesStatus =
                            statusFilter ===
                                "ALL" ||

                            (
                                statusFilter ===
                                    "ACTIVE" &&
                                resident.is_active
                            ) ||

                            (
                                statusFilter ===
                                    "INACTIVE" &&
                                !resident.is_active
                            );


                        return (
                            matchesSearch &&
                            matchesType &&
                            matchesStatus
                        );
                    }
                );

            },
            [
                residents,
                search,
                typeFilter,
                statusFilter,
            ]
        );


    /* =========================================================
       OPEN CREATE MODAL
    ========================================================= */

    const openCreateModal =
        async () => {

            setEditingResident(
                null
            );

            setForm(
                emptyForm
            );

            setError("");
            setSuccess("");

            setShowModal(
                true
            );

            await loadUserOptions();
        };


    /* =========================================================
       OPEN EDIT MODAL
    ========================================================= */

    const openEditModal = (
        resident
    ) => {

        setEditingResident(
            resident
        );


        setForm({

            user:
                resident.user ||
                resident.user_id ||
                "",

            first_name:
                resident.first_name ||
                "",

            middle_name:
                resident.middle_name ||
                "",

            last_name:
                resident.last_name ||
                "",

            resident_type:
                resident.resident_type ||
                "",

            phone:
                resident.phone ||
                "",

            email:
                resident.email ||
                "",

            address:
                resident.address ||
                "",

            is_active:
                resident.is_active,

        });


        setError("");
        setSuccess("");

        setShowModal(
            true
        );
    };


    /* =========================================================
       CLOSE MODAL
    ========================================================= */

    const closeModal = () => {

        if (saving) {
            return;
        }


        setShowModal(
            false
        );

        setEditingResident(
            null
        );

        setForm(
            emptyForm
        );

        setError("");
        setSuccess("");
    };


    /* =========================================================
       SAVE RESIDENT
    ========================================================= */

    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();

        setError("");
        setSuccess("");


        /*
         * CREATE VALIDATION
         */

        if (!editingResident) {

            if (!form.user) {

                setError(
                    "Please select a user account."
                );

                return;
            }


            if (!form.resident_type) {

                setError(
                    "Unable to determine the resident type."
                );

                return;
            }
        }


        try {

            setSaving(
                true
            );


            const payload = {

                first_name:
                    form.first_name.trim(),

                middle_name:
                    form.middle_name.trim(),

                last_name:
                    form.last_name.trim(),

                resident_type:
                    form.resident_type,

                phone:
                    form.phone.trim(),

                email:
                    form.email.trim(),

                address:
                    form.address.trim(),

                is_active:
                    form.is_active,
            };


            /*
             * USER IS REQUIRED ONLY WHEN CREATING
             */

            if (!editingResident) {

                payload.user =
                    Number(
                        form.user
                    );
            }


            /*
             * CREATE
             */

            if (!editingResident) {

                await createResident(
                    payload
                );

                setSuccess(
                    "Resident created successfully."
                );

            }


            /*
             * UPDATE
             */

            else {

                await updateResident(
                    editingResident.id,
                    payload
                );

                setSuccess(
                    "Resident updated successfully."
                );
            }


            await loadResidents();


            /*
             * Close after successful save
             */

            window.setTimeout(
                () => {
                    closeModal();
                },
                500
            );


        } catch (err) {

            console.error(
                "Failed to save resident:",
                err
            );


            const backendError =
                err?.response?.data;


            if (
                backendError &&
                typeof backendError ===
                    "object"
            ) {

                const firstError =
                    Object.values(
                        backendError
                    )[0];


                setError(
                    Array.isArray(
                        firstError
                    )
                        ? firstError[0]
                        : firstError ||
                          "Unable to save resident."
                );

            } else {

                setError(
                    "Unable to save resident."
                );
            }

        } finally {

            setSaving(
                false
            );
        }
    };


    /* =========================================================
       DELETE RESIDENT
    ========================================================= */

    const handleDelete = async () => {

        if (!deleteTarget) {
            return;
        }


        try {

            setSaving(
                true
            );

            setError("");


            await deleteResident(
                deleteTarget.id
            );


            setDeleteTarget(
                null
            );


            await loadResidents();


            setSuccess(
                "Resident deleted successfully."
            );

        } catch (err) {

            console.error(
                "Failed to delete resident:",
                err
            );


            const backendError =
                err?.response?.data;


            if (
                backendError?.detail
            ) {

                setError(
                    backendError.detail
                );

            } else {

                setError(
                    "Unable to delete resident."
                );
            }

        } finally {

            setSaving(
                false
            );
        }
    };


    /* =========================================================
       TYPE BADGE
    ========================================================= */

    const getResidentTypeClass = (
        residentType
    ) => {

        return residentType ===
            "HOMEOWNER"
            ? "rems-badge-primary"
            : "rems-badge-info";
    };


    return (
        <div className="rems-page-content">


            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">
                        ADMINISTRATION
                    </div>

                    <h1 className="rems-page-title">
                        Residents Management
                    </h1>

                    <p className="rems-page-description">
                        Manage homeowners and tenants
                        registered within the community.
                    </p>

                </div>


                <div className="rems-page-header-actions">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={
                            loadResidents
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
                            openCreateModal
                        }
                    >

                        <BsPersonPlus />

                        Add Resident

                    </button>

                </div>

            </div>


            {/* =================================================
                ALERTS
            ================================================= */}

            {error &&
                !showModal && (

                    <div className="alert alert-danger rems-alert mb-4">

                        <i className="bi bi-exclamation-circle me-2" />

                        {error}

                        <button
                            type="button"
                            className="btn-close float-end"
                            aria-label="Close"
                            onClick={() =>
                                setError("")
                            }
                        />

                    </div>
                )}


            {success &&
                !showModal && (

                    <div className="alert alert-success rems-alert mb-4">

                        <i className="bi bi-check-circle me-2" />

                        {success}

                        <button
                            type="button"
                            className="btn-close float-end"
                            aria-label="Close"
                            onClick={() =>
                                setSuccess("")
                            }
                        />

                    </div>
                )}


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="row g-3 mb-4">


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <BsPeople />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Total Residents
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

                            <BsHouseCheck />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Homeowners
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.homeowners
                                }
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <i className="bi bi-person-badge" />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Tenants
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.tenants
                                }
                            </div>

                        </div>

                    </div>

                </div>


                <div className="col-12 col-sm-6 col-xl-3">

                    <div className="rems-stat-card">

                        <div className="rems-stat-icon">

                            <BsPersonCheck />

                        </div>

                        <div className="rems-stat-content">

                            <div className="rems-stat-label">
                                Active Residents
                            </div>

                            <div className="rems-stat-value">
                                {
                                    statistics.active
                                }
                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="rems-glass-card mb-4">

                <div className="rems-filter-bar">

                    <div className="rems-search-box">

                        <i className="bi bi-search" />

                        <input
                            type="search"
                            className="form-control"
                            placeholder="Search name, username, email or phone..."
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
                            All Resident Types
                        </option>

                        <option value="HOMEOWNER">
                            Homeowners
                        </option>

                        <option value="TENANT">
                            Tenants
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
                        onClick={() => {

                            setSearch("");

                            setTypeFilter(
                                "ALL"
                            );

                            setStatusFilter(
                                "ALL"
                            );

                        }}
                    >

                        <i className="bi bi-arrow-counterclockwise" />

                        Reset

                    </button>

                </div>

            </div>


            {/* =================================================
                RESIDENT DIRECTORY
            ================================================= */}

            <div className="rems-glass-card">

                <div className="rems-card-header">

                    <div>

                        <div className="rems-card-title">
                            Resident Directory
                        </div>

                        <div className="rems-card-subtitle">

                            {loading
                                ? "Loading records..."
                                : `${filteredResidents.length} ${
                                      filteredResidents.length ===
                                      1
                                          ? "resident"
                                          : "residents"
                                  } displayed`}

                        </div>

                    </div>

                </div>


                <div className="table-responsive">

                    <table className="table rems-table align-middle mb-0">

                        <thead>

                            <tr>

                                <th>
                                    Resident
                                </th>

                                <th>
                                    Type
                                </th>

                                <th>
                                    Contact
                                </th>

                                <th>
                                    Address
                                </th>

                                <th>
                                    Status
                                </th>

                                <th className="text-end">
                                    Actions
                                </th>

                            </tr>

                        </thead>


                        <tbody>


                            {/* LOADING */}

                            {loading ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="text-center py-5"
                                    >

                                        <div
                                            className="spinner-border"
                                            role="status"
                                        />

                                        <div className="small text-muted mt-3">
                                            Loading residents...
                                        </div>

                                    </td>

                                </tr>


                            ) : filteredResidents.length ===
                              0 ? (

                                /* EMPTY */

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="p-0"
                                    >

                                        <div className="rems-empty-state">

                                            <div className="rems-empty-icon">

                                                <i className="bi bi-people" />

                                            </div>

                                            <div className="rems-empty-title">
                                                No residents found
                                            </div>

                                            <p className="rems-empty-text">
                                                Try changing your search
                                                or filters.
                                            </p>

                                        </div>

                                    </td>

                                </tr>


                            ) : (

                                /* DATA */

                                filteredResidents.map(
                                    (resident) => (

                                        <tr
                                            key={
                                                resident.id
                                            }
                                        >


                                            {/* RESIDENT */}

                                            <td>

                                                <div className="d-flex align-items-center gap-3">

                                                    <div
                                                        className="rems-resident-avatar"
                                                    >

                                                        {
                                                            resident.first_name?.[0] ||
                                                            resident.username?.[0] ||
                                                            "R"
                                                        }

                                                    </div>


                                                    <div>

                                                        <div className="rems-table-primary">

                                                            {
                                                                resident.full_name ||
                                                                `${resident.first_name || ""} ${resident.last_name || ""}`.trim() ||
                                                                "Unnamed Resident"
                                                            }

                                                        </div>

                                                        <div className="rems-table-secondary">

                                                            @
                                                            {
                                                                resident.username ||
                                                                "—"
                                                            }

                                                        </div>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* TYPE */}

                                            <td>

                                                <span
                                                    className={`rems-badge ${
                                                        getResidentTypeClass(
                                                            resident.resident_type
                                                        )
                                                    }`}
                                                >

                                                    {
                                                        resident.resident_type_display ||
                                                        resident.resident_type
                                                    }

                                                </span>

                                            </td>


                                            {/* CONTACT */}

                                            <td>

                                                <div className="rems-table-primary">

                                                    {
                                                        resident.phone ||
                                                        "—"
                                                    }

                                                </div>

                                                <div className="rems-table-secondary">

                                                    {
                                                        resident.email ||
                                                        "—"
                                                    }

                                                </div>

                                            </td>


                                            {/* ADDRESS */}

                                            <td>

                                                <div
                                                    className="text-truncate"
                                                    style={{
                                                        maxWidth:
                                                            "260px",
                                                    }}
                                                >

                                                    {
                                                        resident.address ||
                                                        "—"
                                                    }

                                                </div>

                                            </td>


                                            {/* STATUS */}

                                            <td>

                                                <span
                                                    className={`rems-status-badge ${
                                                        resident.is_active
                                                            ? "rems-status-success"
                                                            : "rems-status-danger"
                                                    }`}
                                                >

                                                    <span className="rems-status-dot" />

                                                    {
                                                        resident.is_active
                                                            ? "Active"
                                                            : "Inactive"
                                                    }

                                                </span>

                                            </td>


                                            {/* ACTIONS */}

                                            <td>

                                                <div className="d-flex justify-content-end gap-1">


                                                    <button
                                                        type="button"
                                                        className="rems-icon-button"
                                                        title="Edit resident"
                                                        onClick={() =>
                                                            openEditModal(
                                                                resident
                                                            )
                                                        }
                                                    >

                                                        <BsPencil />

                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="rems-icon-button rems-action-danger"
                                                        title="Delete resident"
                                                        onClick={() =>
                                                            setDeleteTarget(
                                                                resident
                                                            )
                                                        }
                                                    >

                                                        <BsTrash />

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* =================================================
                RESIDENT MODAL
            ================================================= */}

            {showModal && (

                <div
                    className="rems-modal-backdrop"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {

                            closeModal();
                        }

                    }}
                >

                    <div
                        className="rems-modal rems-management-modal"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >


                        {/* HEADER */}

                        <div className="rems-modal-header">

                            <div>

                                <div className="rems-page-eyebrow">
                                    RESIDENT MANAGEMENT
                                </div>

                                <h5 className="mb-1 fw-semibold">

                                    {editingResident
                                        ? "Edit Resident"
                                        : "Add Resident"}

                                </h5>

                                <div className="rems-modal-subtitle">

                                    {editingResident
                                        ? "Update the resident profile."
                                        : "Create a resident profile from an eligible user account."}

                                </div>

                            </div>


                            <button
                                type="button"
                                className="rems-modal-close"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                            >

                                <i className="bi bi-x-lg" />

                            </button>

                        </div>


                        {/* FORM */}

                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div className="rems-modal-body">


                                {error && (

                                    <div className="alert alert-danger rems-alert">

                                        <i className="bi bi-exclamation-circle me-2" />

                                        {error}

                                    </div>

                                )}


                                {success && (

                                    <div className="alert alert-success rems-alert">

                                        <i className="bi bi-check-circle me-2" />

                                        {success}

                                    </div>

                                )}


                                <div className="rems-form-section">


                                    <div className="rems-form-section-title">

                                        <i className="bi bi-person-vcard me-2" />

                                        Account Information

                                    </div>


                                    <div className="row g-3">


                                        {/* USER */}

                                        {!editingResident && (

                                            <div className="col-12">

                                                <label className="rems-form-label">

                                                    User Account

                                                    <span className="text-danger ms-1">
                                                        *
                                                    </span>

                                                </label>


                                                <select
                                                    name="user"
                                                    className="form-select rems-form-control"
                                                    value={
                                                        form.user
                                                    }
                                                    onChange={
                                                        handleUserChange
                                                    }
                                                    disabled={
                                                        loadingUsers ||
                                                        saving
                                                    }
                                                    required
                                                >

                                                    <option value="">

                                                        {loadingUsers
                                                            ? "Loading user accounts..."
                                                            : "Select a homeowner or tenant account"}

                                                    </option>


                                                    {userOptions
                                                        .filter(
                                                            (user) =>
                                                                !user.has_resident_profile
                                                        )
                                                        .map(
                                                            (user) => (

                                                                <option
                                                                    key={
                                                                        user.id
                                                                    }
                                                                    value={
                                                                        user.id
                                                                    }
                                                                >

                                                                    {
                                                                        user.label ||
                                                                        user.username
                                                                    }

                                                                    {" — "}

                                                                    {
                                                                        user.role_label ||
                                                                        user.role
                                                                    }

                                                                </option>

                                                            )
                                                        )}

                                                </select>


                                                <div className="form-text">

                                                    Only active HOMEOWNER
                                                    and TENANT accounts
                                                    without an existing
                                                    resident profile are
                                                    available.

                                                </div>

                                            </div>

                                        )}


                                        {/* SELECTED ACCOUNT */}

                                        {!editingResident &&
                                            form.user && (

                                                <div className="col-12">

                                                    <div className="rems-property-info-card">

                                                        <div className="rems-property-detail-icon">

                                                            <i className="bi bi-person-check" />

                                                        </div>


                                                        <div>

                                                            <div className="rems-table-secondary">
                                                                Selected account
                                                            </div>

                                                            <div className="rems-table-primary">

                                                                {
                                                                    userOptions.find(
                                                                        (user) =>
                                                                            String(
                                                                                user.id
                                                                            ) ===
                                                                            String(
                                                                                form.user
                                                                            )
                                                                    )?.label ||
                                                                    "Selected User"
                                                                }

                                                            </div>

                                                        </div>


                                                        <span className="rems-badge rems-badge-primary ms-auto">

                                                            {form.resident_type ===
                                                            "HOMEOWNER"
                                                                ? "Homeowner"
                                                                : "Tenant"}

                                                        </span>

                                                    </div>

                                                </div>

                                            )}


                                    </div>

                                </div>


                                <div className="rems-form-section">

                                    <div className="rems-form-section-title">

                                        <i className="bi bi-person me-2" />

                                        Resident Profile

                                    </div>


                                    <div className="row g-3">


                                        {/* FIRST */}

                                        <div className="col-12 col-md-4">

                                            <label className="rems-form-label">
                                                First Name
                                            </label>

                                            <input
                                                type="text"
                                                name="first_name"
                                                className="form-control rems-form-control"
                                                value={
                                                    form.first_name
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                required
                                                disabled={
                                                    saving
                                                }
                                            />

                                        </div>


                                        {/* MIDDLE */}

                                        <div className="col-12 col-md-4">

                                            <label className="rems-form-label">
                                                Middle Name
                                            </label>

                                            <input
                                                type="text"
                                                name="middle_name"
                                                className="form-control rems-form-control"
                                                value={
                                                    form.middle_name
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                disabled={
                                                    saving
                                                }
                                            />

                                        </div>


                                        {/* LAST */}

                                        <div className="col-12 col-md-4">

                                            <label className="rems-form-label">
                                                Last Name
                                            </label>

                                            <input
                                                type="text"
                                                name="last_name"
                                                className="form-control rems-form-control"
                                                value={
                                                    form.last_name
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                required
                                                disabled={
                                                    saving
                                                }
                                            />

                                        </div>


                                        {/* TYPE */}

                                        <div className="col-12 col-md-6">

                                            <label className="rems-form-label">
                                                Resident Type
                                            </label>

                                            <select
                                                name="resident_type"
                                                className="form-select rems-form-control"
                                                value={
                                                    form.resident_type
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                disabled={
                                                    !editingResident ||
                                                    saving
                                                }
                                                required
                                            >

                                                <option value="">
                                                    Select type
                                                </option>

                                                <option value="HOMEOWNER">
                                                    Homeowner
                                                </option>

                                                <option value="TENANT">
                                                    Tenant
                                                </option>

                                            </select>


                                            {!editingResident && (

                                                <div className="form-text">

                                                    Resident type is automatically
                                                    determined by the selected
                                                    user account.

                                                </div>

                                            )}

                                        </div>


                                        {/* PHONE */}

                                        <div className="col-12 col-md-6">

                                            <label className="rems-form-label">
                                                Phone
                                            </label>

                                            <input
                                                type="text"
                                                name="phone"
                                                className="form-control rems-form-control"
                                                value={
                                                    form.phone
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                disabled={
                                                    saving
                                                }
                                            />

                                        </div>


                                        {/* EMAIL */}

                                        <div className="col-12">

                                            <label className="rems-form-label">
                                                Email
                                            </label>

                                            <input
                                                type="email"
                                                name="email"
                                                className="form-control rems-form-control"
                                                value={
                                                    form.email
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                disabled={
                                                    saving
                                                }
                                            />

                                        </div>


                                        {/* ADDRESS */}

                                        <div className="col-12">

                                            <label className="rems-form-label">
                                                Address
                                            </label>

                                            <textarea
                                                name="address"
                                                className="form-control rems-form-control"
                                                rows="3"
                                                value={
                                                    form.address
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                disabled={
                                                    saving
                                                }
                                            />

                                        </div>


                                        {/* ACTIVE */}

                                        {editingResident && (

                                            <div className="col-12">

                                                <div className="form-check form-switch">

                                                    <input
                                                        type="checkbox"
                                                        id="resident-active"
                                                        name="is_active"
                                                        className="form-check-input"
                                                        checked={
                                                            form.is_active
                                                        }
                                                        onChange={
                                                            handleChange
                                                        }
                                                        disabled={
                                                            saving
                                                        }
                                                    />

                                                    <label
                                                        htmlFor="resident-active"
                                                        className="form-check-label"
                                                    >

                                                        Resident profile is active

                                                    </label>

                                                </div>

                                            </div>

                                        )}

                                    </div>

                                </div>

                            </div>


                            {/* FOOTER */}

                            <div className="rems-modal-footer">

                                <button
                                    type="button"
                                    className="rems-secondary-button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                >

                                    Cancel

                                </button>


                                <button
                                    type="submit"
                                    className="rems-primary-button"
                                    disabled={
                                        saving ||
                                        (
                                            !editingResident &&
                                            (
                                                !form.user ||
                                                !form.resident_type
                                            )
                                        )
                                    }
                                >

                                    {saving ? (

                                        <>

                                            <span className="spinner-border spinner-border-sm" />

                                            Saving...

                                        </>

                                    ) : (

                                        <>

                                            <i className="bi bi-check2" />

                                            {editingResident
                                                ? "Save Changes"
                                                : "Create Resident"}

                                        </>

                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {/* =================================================
                DELETE CONFIRMATION
            ================================================= */}

            {deleteTarget && (

                <div
                    className="rems-modal-backdrop"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget &&
                            !saving
                        ) {

                            setDeleteTarget(
                                null
                            );

                        }

                    }}
                >

                    <div
                        className="rems-modal"
                        style={{
                            maxWidth:
                                "430px",
                        }}
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="rems-modal-body text-center">

                            <div
                                className="rems-empty-icon"
                                style={{
                                    color:
                                        "var(--rems-danger)",
                                    background:
                                        "rgba(220, 53, 69, 0.08)",
                                }}
                            >

                                <BsTrash />

                            </div>


                            <h5 className="mt-3 mb-2 fw-semibold">
                                Delete Resident?
                            </h5>


                            <p className="text-muted small mb-0">

                                Are you sure you want to delete{" "}

                                <strong>
                                    {
                                        deleteTarget.full_name ||
                                        `${deleteTarget.first_name || ""} ${deleteTarget.last_name || ""}`.trim() ||
                                        "this resident"
                                    }
                                </strong>

                                ?

                                <br />

                                This action cannot be undone.

                            </p>

                        </div>


                        <div className="rems-modal-footer">

                            <button
                                type="button"
                                className="rems-secondary-button"
                                onClick={() =>
                                    setDeleteTarget(
                                        null
                                    )
                                }
                                disabled={
                                    saving
                                }
                            >

                                Cancel

                            </button>


                            <button
                                type="button"
                                className="btn btn-danger d-inline-flex align-items-center justify-content-center gap-2"
                                onClick={
                                    handleDelete
                                }
                                disabled={
                                    saving
                                }
                            >

                                {saving ? (

                                    <>

                                        <span className="spinner-border spinner-border-sm" />

                                        Deleting...

                                    </>

                                ) : (

                                    <>

                                        <BsTrash />

                                        Delete

                                    </>

                                )}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}
