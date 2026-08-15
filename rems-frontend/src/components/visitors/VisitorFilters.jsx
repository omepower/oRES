import {
    BsSearch,
    BsFunnel,
    BsArrowClockwise,
} from "react-icons/bs";

export default function VisitorFilters({
    search,
    setSearch,
    status,
    setStatus,
    onRefresh,
}) {
    return (
        <div className="rems-filter-card mb-4">
            <div className="row g-3 align-items-end">

                {/* Search */}
                <div className="col-12 col-lg-5">
                    <label className="rems-form-label">
                        Search Visitors
                    </label>

                    <div className="rems-input-icon">
                        <BsSearch />

                        <input
                            type="text"
                            className="form-control rems-form-control"
                            placeholder="Search visitor, host, phone..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />
                    </div>
                </div>

                {/* Status */}
                <div className="col-12 col-sm-6 col-lg-3">
                    <label className="rems-form-label">
                        Status
                    </label>

                    <div className="rems-input-icon">
                        <BsFunnel />

                        <select
                            className="form-select rems-form-control"
                            value={status}
                            onChange={(event) =>
                                setStatus(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                All statuses
                            </option>

                            <option value="PENDING">
                                Pending
                            </option>

                            <option value="USED">
                                Used
                            </option>

                            <option value="INSIDE">
                                Inside
                            </option>

                            <option value="COMPLETED">
                                Completed
                            </option>

                            <option value="EXPIRED">
                                Expired
                            </option>

                            <option value="CANCELLED">
                                Cancelled
                            </option>

                            <option value="DENIED">
                                Denied
                            </option>
                        </select>
                    </div>
                </div>

                {/* Refresh */}
                <div className="col-12 col-sm-6 col-lg-2">
                    <button
                        type="button"
                        className="btn rems-btn-secondary w-100"
                        onClick={onRefresh}
                    >
                        <BsArrowClockwise className="me-2" />

                        Refresh
                    </button>
                </div>

            </div>
        </div>
    );
}