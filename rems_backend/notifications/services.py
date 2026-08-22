from .models import Notification


class NotificationService:

    @staticmethod
    def create(
        *,
        recipient,
        title,
        message,
        category=Notification.Category.SYSTEM,
        priority=Notification.Priority.INFO,
        action_url="",
        metadata=None,
        actor=None,
    ):

        return Notification.objects.create(

            recipient=recipient,

            actor=actor,

            title=title,

            message=message,

            category=category,

            priority=priority,

            action_url=action_url,

            metadata=metadata or {},

        )


    @staticmethod
    def visitor(
        *,
        recipient,
        title,
        message,
        action_url="",
        metadata=None,
        actor=None,
        priority=Notification.Priority.INFO,
    ):

        return NotificationService.create(

            recipient=recipient,

            title=title,

            message=message,

            category=Notification.Category.VISITOR,

            priority=priority,

            action_url=action_url,

            metadata=metadata,

            actor=actor,

        )


    @staticmethod
    def vehicle(
        *,
        recipient,
        title,
        message,
        action_url="",
        metadata=None,
        actor=None,
        priority=Notification.Priority.INFO,
    ):

        return NotificationService.create(

            recipient=recipient,

            title=title,

            message=message,

            category=Notification.Category.VEHICLE,

            priority=priority,

            action_url=action_url,

            metadata=metadata,

            actor=actor,

        )


    @staticmethod
    def sticker(
        *,
        recipient,
        title,
        message,
        action_url="",
        metadata=None,
        actor=None,
        priority=Notification.Priority.INFO,
    ):

        return NotificationService.create(

            recipient=recipient,

            title=title,

            message=message,

            category=Notification.Category.STICKER,

            priority=priority,

            action_url=action_url,

            metadata=metadata,

            actor=actor,

        )


    @staticmethod
    def security(
        *,
        recipient,
        title,
        message,
        action_url="",
        metadata=None,
        actor=None,
        priority=Notification.Priority.INFO,
    ):

        return NotificationService.create(

            recipient=recipient,

            title=title,

            message=message,

            category=Notification.Category.SECURITY,

            priority=priority,

            action_url=action_url,

            metadata=metadata,

            actor=actor,

        )
    
    @staticmethod
    def property(
        *,
        recipient,
        title,
        message,
        action_url="",
        metadata=None,
        actor=None,
        priority=Notification.Priority.INFO,
    ):

        return NotificationService.create(

            recipient=recipient,

            title=title,

            message=message,

            category=Notification.Category.PROPERTY,

            priority=priority,

            action_url=action_url,

            metadata=metadata,

            actor=actor,

        )


    @staticmethod
    def account(
        *,
        recipient,
        title,
        message,
        action_url="",
        metadata=None,
        actor=None,
        priority=Notification.Priority.INFO,
    ):

        return NotificationService.create(

            recipient=recipient,

            title=title,

            message=message,

            category=Notification.Category.ACCOUNT,

            priority=priority,

            action_url=action_url,

            metadata=metadata,

            actor=actor,

        )