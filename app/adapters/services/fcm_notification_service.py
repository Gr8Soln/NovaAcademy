# from uuid import UUID

# import firebase_admin
# from firebase_admin import credentials, messaging

# from app.application.interfaces import IChatNotificationInterface
# from app.core.logging import get_logger
# from app.domain.entities import ChatMessage

# logger = get_logger(__name__)


# class FirebasePushNotificationService(IChatNotificationInterface):
#     def __init__(self, credentials_path: str):
#         cred = credentials.Certificate(credentials_path)
#         firebase_admin.initialize_app(cred)
        
#     async def notify_mention(self, mentioned_user_id: UUID, message: ChatMessage, group_name: str):
#         # Get user's FCM token from database
#         fcm_token = await self.get_user_fcm_token(mentioned_user_id)
        
#         if not fcm_token:
#             return
        
#         notification = messaging.ChatMessage(
#             notification=messaging.Notification(
#                 title=f"Mentioned in {group_name}",
#                 body=message.content[:100],
#             ),
#             data={
#                 "type": "mention",
#                 "message_id": str(message.id),
#                 "group_id": str(message.group_id),
#             },
#             token=fcm_token,
#         )
        
#         try:
#             response = messaging.send(notification)
#             logger.info(f"Notification sent: {response}")
#         except Exception as e:
#             logger.error(f"Failed to send notification: {e}")
# """


# # =============================================================================
# # EXAMPLE: Email Notification Implementation
# # =============================================================================

# """
# from ...adapters.email.smtp_email_service import SMTPEmailService


# class EmailNotificationService(IChatNotificationInterface):
#     def __init__(self, email_service: SMTPEmailService):
#         self.email_service = email_service
    
#     async def notify_mention(self, mentioned_user_id: UUID, message: ChatMessage, group_name: str):
#         # Get user's email and preferences
#         user = await self.get_user(mentioned_user_id)
        
#         if not user.email_notifications_enabled:
#             return
        
#         # Send email
#         subject = f"You were mentioned in {group_name}"
#         body = f'''
#         Hi {user.first_name},
        
#         You were mentioned in {group_name}:
        
#         "{message.content}"
        
#         Reply in the app: {BASE_URL}/groups/{message.group_id}
#         '''
        
#         await self.email_service.send_email(
#             to=user.email,
#             subject=subject,
#             body=body,
#         )
