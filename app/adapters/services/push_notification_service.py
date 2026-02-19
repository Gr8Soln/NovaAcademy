from uuid import UUID

from app.application.interfaces import IChatNotificationInterface
from app.core.logging import get_logger
from app.domain.entities import ChatMessage

logger = get_logger(__name__)


class PushNotificationService(IChatNotificationInterface):
    """
    Push notification service for mentions and new messages.
    
    IMPLEMENTATION OPTIONS:
    - Firebase Cloud Messaging (FCM) for mobile push
    - OneSignal for cross-platform push
    - WebPush for browser notifications
    - Email for offline users
    - Webhook to your own notification service
    
    This is a stub implementation. Integrate with your notification provider.
    """
    
    def __init__(self):
        """Initialize notification service."""
        # TODO: Initialize your notification provider
        # Example: self.fcm_client = initialize_fcm()
        pass
    
    async def notify_mention(
        self,
        mentioned_user_id: UUID,
        message: ChatMessage,
        group_name: str,
    ) -> None:
        """
        Notify a user they were mentioned.
        
        Implementation example with Firebase:
        
        notification = {
            "title": f"Mentioned in {group_name}",
            "body": message.content[:100],
            "data": {
                "type": "mention",
                "message_id": str(message.id),
                "group_id": str(message.group_id),
            }
        }
        
        await self.fcm_client.send_to_user(mentioned_user_id, notification)
        """
        logger.info(
            f"Notification: User {mentioned_user_id} mentioned in group {group_name}"
        )
        
        # TODO: Implement actual notification delivery
        # For now, just log it
        pass
    
    async def notify_new_message(
        self,
        user_ids: list[UUID],
        message: ChatMessage,
        group_name: str,
    ) -> None:
        """
        Notify users of a new message (if they have notifications enabled).
        
        This is typically for users who:
        - Have the app in background
        - Are offline
        - Have enabled notifications for this group
        """
        logger.info(
            f"Notification: New message in {group_name} for {len(user_ids)} users"
        )
        
        # TODO: Implement actual notification delivery
        pass

