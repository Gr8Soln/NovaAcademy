from abc import ABC, abstractmethod


class IEmailService(ABC):

    @abstractmethod
    async def send_verification_email(self, email: str, first_name: str, token: str) -> None:
        """Send account email verification link."""
        ...

    @abstractmethod
    async def send_password_reset_email(self, email: str, first_name: str, token: str) -> None:
        """Send password reset link."""
        ...
