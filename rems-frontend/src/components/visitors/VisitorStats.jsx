import {
    BsPeople,
    BsPersonCheck,
    BsPersonX,
    BsQrCodeScan,
} from "react-icons/bs";

export default function VisitorStats({
    invitations = [],
    visits = [],
}) {
    const pendingInvitations =
        invitations.filter(
            (item) =>
                item.status === "PENDING"
        ).length;

    const activeVisitors =
        visits.filter(
            (item) =>
                item.status === "INSIDE"
        ).length;

    const completedVisits =
        visits.filter(
            (item) =>
                item.status === "COMPLETED"
        ).length;

    const totalInvitations =
        invitations.length;

    const cards = [
        {
            title: "Total Invitations",
            value: totalInvitations,
            description:
                "Visitor invitations recorded",
            icon: BsPeople,
            className:
                "rems-stat-primary",
        },

        {
            title: "Pending",
            value: pendingInvitations,
            description:
                "Awaiting visitor arrival",
            icon: BsQrCodeScan,
            className:
                "rems-stat-warning",
        },

        {
            title: "Currently Inside",
            value: activeVisitors,
            description:
                "Visitors inside the estate",
            icon: BsPersonCheck,
            className:
                "rems-stat-info",
        },

        {
            title: "Completed Visits",
            value: completedVisits,
            description:
                "Completed gate visits",
            icon: BsPersonX,
            className:
                "rems-stat-success",
        },
    ];

    return (
        <div className="row g-3 mb-4">
            {cards.map((card) => {
                const Icon =
                    card.icon;

                return (
                    <div
                        className="col-12 col-sm-6 col-xl-3"
                        key={card.title}
                    >
                        <div
                            className={`rems-stat-card ${card.className}`}
                        >
                            <div className="rems-stat-card-top">
                                <div>
                                    <div className="rems-stat-title">
                                        {card.title}
                                    </div>

                                    <div className="rems-stat-value">
                                        {card.value}
                                    </div>
                                </div>

                                <div className="rems-stat-icon">
                                    <Icon />
                                </div>
                            </div>

                            <div className="rems-stat-description">
                                {card.description}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}