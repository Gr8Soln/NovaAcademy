from abc import ABC, abstractmethod


class IEmailService(ABC):
    
    @abstractmethod
    async def send_verification_email(
        self, 
        email: str, 
        first_name: str, 
        token: str
    ) -> None:
        """
        Send account email verification link.
        
        Args:
            email: Recipient's email address
            first_name: User's first name for personalization
            token: Unique verification token (JWT, random string, etc.)
            
        Raises:
            EmailSendError: If email fails to send
        """
        ...

    @abstractmethod
    async def send_password_reset_email(
        self, 
        email: str, 
        first_name: str, 
        token: str
    ) -> None:
        """
        Send password reset link.
        
        Args:
            email: Recipient's email address
            first_name: User's first name (can be empty string if not available)
            token: Unique password reset token
            
        Raises:
            EmailSendError: If email fails to send
        """
        ...