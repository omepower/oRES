import {
    useState,
} from "react";

import {
    BsKey,
    BsX,
} from "react-icons/bs";

import {
    changePassword,
} from "../../api/account";


const initialForm = {

    current_password:
        "",

    new_password:
        "",

    confirm_password:
        "",

};


export default function ChangePasswordModal({
    show,
    onClose,
    onSuccess,
}) {

    const [
        form,
        setForm,
    ] = useState(
        initialForm
    );


    const [
        saving,
        setSaving,
    ] = useState(false);


    const [
        errors,
        setErrors,
    ] = useState({});


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


    const handleSubmit =
        async (
            event
        ) => {

            event.preventDefault();


            if (
                form.new_password !==
                form.confirm_password
            ) {

                setErrors({

                    confirm_password:
                        "Passwords do not match.",

                });

                return;
            }


            setSaving(
                true
            );

            setErrors({});


            try {

                await changePassword({
                    current_password:
                        form.current_password,

                    new_password:
                        form.new_password,

                    confirm_password:
                        form.confirm_password,
                });


                setForm(
                    initialForm
                );


                if (
                    onSuccess
                ) {

                    await onSuccess();
                }


                onClose();

            } catch (
                error
            ) {

                console.error(
                    "Password change failed:",
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
                                "Unable to change password.",
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

                                <BsKey />

                            </div>


                            <h5 className="rems-modal-title mb-0">

                                Change Password

                            </h5>


                            <div className="rems-modal-subtitle">

                                Update your account password securely.

                            </div>

                        </div>


                        <button
                            type="button"
                            className="btn border-0 p-1 text-secondary"
                            onClick={
                                onClose
                            }
                            disabled={
                                saving
                            }
                            aria-label="Close"
                        >

                            <BsX />

                        </button>

                    </div>


                    {/* =================================================
                        FORM
                    ================================================= */}

                    <form
                        onSubmit={
                            handleSubmit
                        }
                    >

                        <div className="rems-modal-body">


                            {errors.general && (

                                <div className="alert alert-danger rems-alert">

                                    <i className="bi bi-exclamation-circle me-2" />

                                    {errors.general}

                                </div>

                            )}


                            <div className="rems-form-section">

                                <div className="rems-form-section-title">

                                    <BsKey className="me-2" />

                                    Password Security

                                </div>


                                <div className="row g-3">


                                    <div className="col-12">

                                        <label
                                            className="rems-form-label"
                                        >

                                            Current Password

                                        </label>


                                        <input
                                            type="password"
                                            name="current_password"
                                            className={`form-control rems-form-control ${
                                                getError(
                                                    "current_password"
                                                )
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={
                                                form.current_password
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                saving
                                            }
                                            autoComplete="current-password"
                                            required
                                        />


                                        {getError(
                                            "current_password"
                                        ) && (

                                            <div className="invalid-feedback">

                                                {
                                                    getError(
                                                        "current_password"
                                                    )
                                                }

                                            </div>

                                        )}

                                    </div>


                                    <div className="col-12">

                                        <label
                                            className="rems-form-label"
                                        >

                                            New Password

                                        </label>


                                        <input
                                            type="password"
                                            name="new_password"
                                            className={`form-control rems-form-control ${
                                                getError(
                                                    "new_password"
                                                )
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={
                                                form.new_password
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                saving
                                            }
                                            autoComplete="new-password"
                                            required
                                        />


                                        {getError(
                                            "new_password"
                                        ) && (

                                            <div className="invalid-feedback">

                                                {
                                                    getError(
                                                        "new_password"
                                                    )
                                                }

                                            </div>

                                        )}

                                    </div>


                                    <div className="col-12">

                                        <label
                                            className="rems-form-label"
                                        >

                                            Confirm New Password

                                        </label>


                                        <input
                                            type="password"
                                            name="confirm_password"
                                            className={`form-control rems-form-control ${
                                                getError(
                                                    "confirm_password"
                                                )
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            value={
                                                form.confirm_password
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                saving
                                            }
                                            autoComplete="new-password"
                                            required
                                        />


                                        {getError(
                                            "confirm_password"
                                        ) && (

                                            <div className="invalid-feedback">

                                                {
                                                    getError(
                                                        "confirm_password"
                                                    )
                                                }

                                            </div>

                                        )}

                                    </div>

                                </div>

                            </div>


                            <div
                                className="mt-3"
                                style={{
                                    color:
                                        "#929baa",
                                    fontSize:
                                        "0.64rem",
                                    lineHeight:
                                        1.55,
                                }}
                            >

                                Your current password will be verified
                                before the new password is accepted.

                            </div>

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

                                Cancel

                            </button>


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
                                        Updating...
                                    </>

                                ) : (

                                    <>
                                        <i className="bi bi-shield-lock" />
                                        Change Password
                                    </>

                                )}

                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </div>

    );
}