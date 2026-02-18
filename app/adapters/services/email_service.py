from app.application.interfaces import IEmailService
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class ConsoleEmailService(IEmailService):
    """
    Development email service — prints email content to the console/log.
    Swap this out for SMTP / SendGrid / Resend in production.
    """

    async def send_verification_email(self, email: str, first_name: str, token: str) -> None:
        link = f"{settings.BASE_URL}/auth/confirm-email?token={token}"
        logger.info(
            f"\n{'='*60}\n"
            f"  📧  EMAIL VERIFICATION\n"
            f"  To: {email} ({first_name})\n"
            f"  Link: {link}\n"
            f"{'='*60}"
        )

    async def send_password_reset_email(self, email: str, first_name: str, token: str) -> None:
        link = f"{settings.BASE_URL}/auth/reset-password?token={token}"
        logger.info(
            f"\n{'='*60}\n"
            f"  🔑  PASSWORD RESET\n"
            f"  To: {email} ({first_name})\n"
            f"  Link: {link}\n"
            f"{'='*60}"
        )
