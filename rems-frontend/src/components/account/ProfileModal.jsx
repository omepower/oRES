import {
    useEffect,
    useState,
} from "react";

import {
    BsPersonCircle,
    BsX,
} from "react-icons/bs";

import {
    getProfile,
    updateProfile,
} from "../../api/account";


export default function ProfileModal({
    show,
    onClose,
    onSuccess,
}) {

    const [
        loading,
        setLoading,
    ] = useState(false);


    const [
        saving,
        setSaving,
    ] = useState(false);


    const [
        errors,
        setErrors,
    ] = useState({});


    const [
        form,
        setForm,
    ] = useState({

        first_name:
            "",

        last_name:
            "",

        email:
            "",

        phone:
            "",

    });


    /* =========================================================
       LOAD PROFILE
    ========================================================= */

    useEffect(() => {

        if (!show) {

            return;
        }


        const loadProfile =
            async () => {

                setLoading(
                    true
                );

                setErrors({});


                try {

                    const data =
                        await getProfile();


                    setForm({

                        first_name:
                            data?.first_name ||
                            "",

                        last_name:
                            data?.last_name ||
                            "",

                        email:
                            data?.email ||
                            "",

                        phone:
                            data?.phone ||
                            "",

                    });

                } catch (
                    error
                ) {

                    console.error(
                        "Profile loading failed:",
                        error
                    );


                    setErrors({

                        general:
                            error?.response?.data?.detail ||
                            "Unable to load your profile.",

                    });

                } finally {

                    setLoading(
                        false
                    );
                }

            };


        loadProfile();

    }, [
        show,
    ]);


    /* =========================================================
       HANDLE CHANGE
    ========================================================= */

    const handleChange = (
        event
    ) => {

        const {
            name,
            value,
        } = event.target;


        setForm(
            (
                previous
            ) => ({

                ...previous,

                [name]:
                    value,

            })
        );


        setErrors(
            (
                previous
            ) => ({

                ...previous,

                [name]:
                    undefined,

                general:
                    undefined,

            })
        );

    };


    /* =========================================================
       SAVE
    ========================================================= */

    const handleSubmit =
        async (
            event
        ) => {

            event.preventDefault();


            setSaving(
                true
            );

            setErrors({});


            try {

                const response =
                    await updateProfile({

                        first_name:
                            form.first_name.trim(),

                        last_name:
                            form.last_name.trim(),

                        email:
                            form.email.trim(),

                        phone:
                            form.phone.trim(),

                    });


                if (
                    onSuccess
                ) {

                    await onSuccess(
                        response
                    );
                }


                onClose();

            } catch (
                error
            ) {

                console.error(
                    "Profile update failed:",
                    error
                );


                const responseData =
                    error?.response?.data;


                setErrors(
                    responseData &&
                    typeof responseData ===
                        "object"
                        ? responseData
                        : {
                            general:
                                "Unable to update your profile.",
                        }
                );

            } finally {

                setSaving(
                    false
                );
            }

        };


    if (!show) {

        return null;
    }


    const getError = (
        field
    ) => {

        const value =
            errors?.[field];


        if (
            Array.isArray(
                value
            )
        ) {

            return value.join(
                " "
            );
        }


        return value ||
            "";
    };


    return (

        <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            style={{
                background:
                    "rgba(15, 23, 42, 0.42)",
                backdropFilter:
                    "blur(4px)",
                WebkitBackdropFilter:
                    "blur(4px)",
            }}
        >

            <div className="modal-dialog modal-dialog-centered">

                <div className="modal-content rems-modal">


                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div className="rems-modal-header">

                        <div>

                            <div className="rems-modal-icon">

                                <BsPersonCircle />

                            </div>


                            <h5 className="rems-modal-title mb-0">

                                My Profile

                            </h5>


                            <div className="rems-modal-subtitle">

                                View and update your account information.

                            </div>

                        </div>


                        <button
                            type="button"
                            className="btn border-0 p-1 text-secondary"
                            onClick={onClose}
                            disabled={saving}
                            aria-label="Close"
                        >

                            <BsX />

                        </button>

                    </div>


                    {/* =================================================
                        BODY
                    ================================================= */}

                    <form
                        onSubmit={
                            handleSubmit
                        }
                    >

                        <div className="rems-modal-body">


                            {errors.general && (

                                <div className="alert alert-danger rems-alert">

                                    {errors.general}

                                </div>

                            )}


                            {loading ? (

                                <div className="text-center py-4">

                                    <div
                                        className="spinner-border"
                                        role="status"
                                    />

                                    <div className="mt-3 small text-muted">

                                        Loading profile...

                                    </div>

                                </div>

                            ) : (

                                <div className="rems-form-section">

                                    <div className="rems-form-section-title">

                                        <BsPersonCircle className="me-2" />

                                        Account Information

                                    </div>


                                    <div className="row g-3">


                                        <div className="col-12 col-md-6">

                                            <label
                                                className="rems-form-label"
                                            >

                                                First Name

                                            </label>


                                            <input
                                                type="text"
                                                name="first_name"
                                                className={`form-control rems-form-control ${
                                                    getError(
                                                        "first_name"
                                                    )
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                value={
                                                    form.first_name
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                disabled={
                                                    saving
                                                }
                                            />

                                        </div>


                                        <div className="col-12 col-md-6">

                                            <label
                                                className="rems-form-label"
                                            >

                                                Last Name

                                            </label>


                                            <input
                                                type="text"
                                                name="last_name"
                                                className={`form-control rems-form-control ${
                                                    getError(
                                                        "last_name"
                                                    )
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                value={
                                                    form.last_name
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                disabled={
                                                    saving
                                                }
                                            />

                                        </div>


                                        <div className="col-12">

                                            <label
                                                className="rems-form-label"
                                            >

                                                Email Address

                                            </label>


                                            <input
                                                type="email"
                                                name="email"
                                                className={`form-control rems-form-control ${
                                                    getError(
                                                        "email"
                                                    )
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
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


                                        <div className="col-12">

                                            <label
                                                className="rems-form-label"
                                            >

                                                Phone Number

                                            </label>


                                            <input
                                                type="text"
                                                name="phone"
                                                className={`form-control rems-form-control ${
                                                    getError(
                                                        "phone"
                                                    )
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
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

                                    </div>

                                </div>

                            )}

                        </div>


                        {/* =================================================
                            FOOTER
                        ================================================= */}

                        <div className="rems-modal-footer d-flex justify-content-end gap-2">

                            <button
                                type="button"
                                className="rems-btn"
                                onClick={
                                    onClose
                                }
                                disabled={
                                    saving
                                }
                                style={{
                                    color:
                                        "#5f6b7c",
                                    background:
                                        "rgba(15, 23, 42, 0.05)",
                                }}
                            >

                                Close

                            </button>


                            {!loading && (

                                <button
                                    type="submit"
                                    className="rems-btn rems-btn-primary"
                                    disabled={
                                        saving
                                    }
                                >

                                    {saving ? (

                                        <>
                                            <span className="spinner-border spinner-border-sm" />
                                            Saving...
                                        </>

                                    ) : (

                                        <>
                                            <i className="bi bi-check-lg" />
                                            Save Changes
                                        </>

                                    )}

                                </button>

                            )}

                        </div>

                    </form>

                </div>

            </div>

        </div>

    );
}