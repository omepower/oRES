import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    BsArrowClockwise,
    BsArchive,
    BsMegaphone,
    BsPlusLg,
    BsSend,
    BsPencil,
    BsTrash,
} from "react-icons/bs";

import {
    createAnnouncement,
    getAnnouncements,
    publishAnnouncement,
    archiveAnnouncement,
    deleteAnnouncement,
} from "../../api/announcements";


const initialForm = {
    title: "",
    content: "",
    category: "GENERAL",
    priority: "INFO",
    audience: "ALL_RESIDENTS",
    status: "DRAFT",
    scheduled_for: "",
    expires_at: "",
};


export default function Announcements() {

    const [
        announcements,
        setAnnouncements,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        showForm,
        setShowForm,
    ] = useState(false);

    const [
        form,
        setForm,
    ] = useState(
        initialForm
    );


    const loadAnnouncements =
        useCallback(
            async (
                refresh = false
            ) => {

                if (refresh) {

                    setRefreshing(true);

                } else {

                    setLoading(true);

                }

                setError("");


                try {

                    const response =
                        await getAnnouncements();


                    const data =
                        Array.isArray(
                            response
                        )
                            ? response
                            : response?.results ||
                              [];


                    setAnnouncements(
                        data
                    );

                } catch (err) {

                    console.error(
                        "[Admin Announcements] Failed:",
                        err
                    );

                    setError(
                        err?.response?.data?.detail ||
                        "Unable to load announcements."
                    );

                } finally {

                    setLoading(false);
                    setRefreshing(false);

                }

            },
            []
        );


    useEffect(() => {

        loadAnnouncements();

    }, [
        loadAnnouncements,
    ]);


    const handleChange = (
        event
    ) => {

        const {
            name,
            value,
        } = event.target;


        setForm(
            previous => ({
                ...previous,
                [name]:
                    value,
            })
        );

    };


    const handleCreate =
        async (
            event
        ) => {

            event.preventDefault();

            setSaving(true);
            setError("");


            try {

                await createAnnouncement({

                    title:
                        form.title.trim(),

                    content:
                        form.content.trim(),

                    category:
                        form.category,

                    priority:
                        form.priority,

                    audience:
                        form.audience,

                    status:
                        "DRAFT",

                    scheduled_for:
                        form.scheduled_for
                            || null,

                    expires_at:
                        form.expires_at
                            || null,

                });


                setForm(
                    initialForm
                );

                setShowForm(
                    false
                );

                await loadAnnouncements();

            } catch (err) {

                console.error(
                    "[Admin Announcements] Create failed:",
                    err
                );

                setError(
                    err?.response?.data ||
                    err?.message ||
                    "Unable to create announcement."
                );

            } finally {

                setSaving(false);

            }

        };


    const handlePublish =
        async (
            id
        ) => {

            try {

                await publishAnnouncement(
                    id
                );

                await loadAnnouncements();

            } catch (err) {

                console.error(
                    "[Admin Announcements] Publish failed:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to publish announcement."
                );

            }

        };


    const handleArchive =
        async (
            id
        ) => {

            try {

                await archiveAnnouncement(
                    id
                );

                await loadAnnouncements();

            } catch (err) {

                console.error(
                    "[Admin Announcements] Archive failed:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to archive announcement."
                );

            }

        };


    const handleDelete =
        async (
            id
        ) => {

            if (
                !window.confirm(
                    "Delete this announcement?"
                )
            ) {

                return;

            }


            try {

                await deleteAnnouncement(
                    id
                );

                await loadAnnouncements();

            } catch (err) {

                console.error(
                    "[Admin Announcements] Delete failed:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to delete announcement."
                );

            }

        };


    return (

        <div className="rems-page-content">

            <div className="rems-page-header">

                <div>

                    <div className="rems-page-eyebrow">
                        ADMINISTRATION
                    </div>

                    <h1 className="rems-page-title">
                        Community Announcements
                    </h1>

                    <p className="rems-page-description">
                        Publish notices, maintenance schedules,
                        community events, policies, and security advisories.
                    </p>

                </div>


                <div className="rems-page-header-actions">

                    <button
                        type="button"
                        className="rems-secondary-button"
                        onClick={() =>
                            loadAnnouncements(true)
                        }
                        disabled={
                            refreshing
                        }
                    >

                        <BsArrowClockwise />

                        Refresh

                    </button>


                    <button
                        type="button"
                        className="rems-primary-button"
                        onClick={() =>
                            setShowForm(
                                true
                            )
                        }
                    >

                        <BsPlusLg />

                        New Announcement

                    </button>

                </div>

            </div>


            {error && (

                <div className="alert alert-danger rems-alert mb-4">

                    {
                        typeof error === "string"
                            ? error
                            : "Unable to complete the announcement action."
                    }

                </div>

            )}


            {showForm && (

                <div className="rems-glass-card mb-4">

                    <div className="rems-card-header">

                        <div>

                            <div className="rems-page-eyebrow">
                                NEW ANNOUNCEMENT
                            </div>

                            <div className="rems-card-title">
                                Create Community Notice
                            </div>

                        </div>

                    </div>


                    <form
                        onSubmit={
                            handleCreate
                        }
                    >

                        <div className="rems-card-body">

                            <div className="rems-form-section">

                                <div className="row g-3">

                                    <div className="col-12">

                                        <label className="rems-form-label">
                                            Title
                                        </label>

                                        <input
                                            type="text"
                                            name="title"
                                            className="form-control rems-form-control"
                                            value={
                                                form.title
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                    </div>


                                    <div className="col-12">

                                        <label className="rems-form-label">
                                            Announcement
                                        </label>

                                        <textarea
                                            name="content"
                                            className="form-control rems-form-control"
                                            rows="5"
                                            value={
                                                form.content
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                    </div>


                                    <div className="col-12 col-md-4">

                                        <label className="rems-form-label">
                                            Category
                                        </label>

                                        <select
                                            name="category"
                                            className="form-select rems-form-control"
                                            value={
                                                form.category
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        >

                                            <option value="GENERAL">
                                                General
                                            </option>

                                            <option value="NOTICE">
                                                Notice
                                            </option>

                                            <option value="MAINTENANCE">
                                                Maintenance
                                            </option>

                                            <option value="COMMUNITY_EVENT">
                                                Community Event
                                            </option>

                                            <option value="POLICY">
                                                Policy
                                            </option>

                                            <option value="SECURITY">
                                                Security
                                            </option>

                                        </select>

                                    </div>


                                    <div className="col-12 col-md-4">

                                        <label className="rems-form-label">
                                            Priority
                                        </label>

                                        <select
                                            name="priority"
                                            className="form-select rems-form-control"
                                            value={
                                                form.priority
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        >

                                            <option value="INFO">
                                                Information
                                            </option>

                                            <option value="IMPORTANT">
                                                Important
                                            </option>

                                            <option value="URGENT">
                                                Urgent
                                            </option>

                                        </select>

                                    </div>


                                    <div className="col-12 col-md-4">

                                        <label className="rems-form-label">
                                            Audience
                                        </label>

                                        <select
                                            name="audience"
                                            className="form-select rems-form-control"
                                            value={
                                                form.audience
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        >

                                            <option value="ALL_RESIDENTS">
                                                All Residents
                                            </option>

                                            <option value="HOMEOWNERS">
                                                Homeowners
                                            </option>

                                            <option value="TENANTS">
                                                Tenants
                                            </option>

                                        </select>

                                    </div>

                                </div>

                            </div>

                        </div>


                        <div className="rems-modal-footer">

                            <button
                                type="button"
                                className="rems-secondary-button"
                                onClick={() =>
                                    setShowForm(
                                        false
                                    )
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
                                    saving
                                }
                            >

                                {
                                    saving
                                        ? "Creating..."
                                        : "Create Draft"
                                }

                            </button>

                        </div>

                    </form>

                </div>

            )}


            <div className="rems-glass-card">

                {loading ? (

                    <div className="rems-loading-state">

                        <div
                            className="spinner-border"
                            role="status"
                        />

                        <div className="mt-3">
                            Loading announcements...
                        </div>

                    </div>

                ) : announcements.length === 0 ? (

                    <div className="rems-empty-state">

                        <div className="rems-empty-icon">
                            <BsMegaphone />
                        </div>

                        <div className="rems-empty-title">
                            No announcements
                        </div>

                        <div className="rems-empty-text">
                            Create your first community announcement.
                        </div>

                    </div>

                ) : (

                    <div className="rems-table-wrapper">

                        <table className="table rems-table align-middle mb-0">

                            <thead>

                                <tr>

                                    <th>
                                        Announcement
                                    </th>

                                    <th>
                                        Category
                                    </th>

                                    <th>
                                        Audience
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

                                {announcements.map(
                                    (
                                        announcement
                                    ) => (

                                        <tr
                                            key={
                                                announcement.id
                                            }
                                        >

                                            <td data-label="Announcement">

                                                <div className="rems-table-primary">

                                                    {
                                                        announcement.title
                                                    }

                                                </div>

                                                <div className="rems-table-secondary">

                                                    {
                                                        announcement.content
                                                    }

                                                </div>

                                            </td>


                                            <td data-label="Category">

                                                {
                                                    announcement.category_display ||
                                                    announcement.category
                                                }

                                            </td>


                                            <td data-label="Audience">

                                                {
                                                    announcement.audience_display ||
                                                    announcement.audience
                                                }

                                            </td>


                                            <td data-label="Status">

                                                <span className="rems-status-badge rems-status-secondary">

                                                    <span className="rems-status-dot" />

                                                    {
                                                        announcement.status_display ||
                                                        announcement.status
                                                    }

                                                </span>

                                            </td>


                                            <td data-label="Actions">

                                                <div className="d-flex justify-content-end gap-1">

                                                    {announcement.status === "DRAFT" && (

                                                        <button
                                                            type="button"
                                                            className="rems-icon-button"
                                                            title="Publish"
                                                            onClick={() =>
                                                                handlePublish(
                                                                    announcement.id
                                                                )
                                                            }
                                                        >

                                                            <BsSend />

                                                        </button>

                                                    )}


                                                    {announcement.status === "PUBLISHED" && (

                                                        <button
                                                            type="button"
                                                            className="rems-icon-button"
                                                            title="Archive"
                                                            onClick={() =>
                                                                handleArchive(
                                                                    announcement.id
                                                                )
                                                            }
                                                        >

                                                            <BsArchive />

                                                        </button>

                                                    )}


                                                    {announcement.status !== "PUBLISHED" && (

                                                        <button
                                                            type="button"
                                                            className="rems-icon-button"
                                                            title="Delete"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    announcement.id
                                                                )
                                                            }
                                                        >

                                                            <BsTrash />

                                                        </button>

                                                    )}

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>

    );
}