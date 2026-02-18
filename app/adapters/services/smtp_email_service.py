import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Optional

from app.application.interfaces import IEmailService
from app.core.logging import get_logger

logger = get_logger(__name__)


class SMTPEmailService(IEmailService):
    def __init__(
        self,
        smtp_host: str,
        smtp_port: int,
        smtp_username: str,
        smtp_password: str,
        from_email: str,
        from_name: str = "NovaAcademy",
        template_dir: Optional[str] = None,
        base_url: str = "https://novaacademy.com",
        use_tls: bool = True,
        use_ssl: bool = False,
    ):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.smtp_username = smtp_username
        self.smtp_password = smtp_password
        self.from_email = from_email
        self.from_name = from_name
        self.base_url = base_url.rstrip('/')
        self.use_tls = use_tls
        self.use_ssl = use_ssl
        
        # Set template directory
        if template_dir is None:
            self.template_dir = Path(__file__).parent.parent.parent.parent / "templates"
        else:
            self.template_dir = Path(template_dir)
        
        # Verify template directory exists
        if not self.template_dir.exists():
            logger.warning(f"Template directory does not exist: {self.template_dir}")
            self.template_dir.mkdir(parents=True, exist_ok=True)
    
    async def send_verification_email(
        self, 
        email: str, 
        first_name: str, 
        token: str
    ) -> None:
        confirmation_url = f"{self.base_url}/auth/confirm-email?token={token}"
        
        # Load and populate template
        html_body = self._load_template("confirm_email.html")
        html_body = html_body.replace("{{USER_NAME}}", first_name)
        html_body = html_body.replace("{{CONFIRMATION_URL}}", confirmation_url)
        
        # Create plain text fallback
        text_body = self._create_verification_text(first_name, confirmation_url)
        
        subject = f"{first_name}, you're in! Let's get started 🎉"
        
        await self._send_email(
            to_email=email,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
        )
        
        logger.info(f"Verification email sent to {email}")
    
    async def send_password_reset_email(
        self, 
        email: str, 
        first_name: str, 
        token: str
    ) -> None:
        reset_url = f"{self.base_url}/auth/reset-password?token={token}"
        
        # Load and populate template
        html_body = self._load_template("forgot_password.html")
        html_body = html_body.replace("{{RESET_PASSWORD_URL}}", reset_url)
        
        # Create plain text fallback
        text_body = self._create_password_reset_text(reset_url)
        
        subject = "Brain fart? Reset your password 🔐"
        
        await self._send_email(
            to_email=email,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
        )
        
        logger.info(f"Password reset email sent to {email}")
    
    async def _send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
    ) -> None:
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{self.from_name} <{self.from_email}>"
        message["To"] = to_email
        
        # Attach both plain text and HTML versions
        # Email clients will prefer HTML if available, fall back to text otherwise
        text_part = MIMEText(text_body, "plain", "utf-8")
        html_part = MIMEText(html_body, "html", "utf-8")
        
        message.attach(text_part)
        message.attach(html_part)
        
        try:
            # Create SMTP connection
            if self.use_ssl:
                # Use SSL from the start (port 465)
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port)
            else:
                # Use regular connection, optionally upgrade with STARTTLS
                server = smtplib.SMTP(self.smtp_host, self.smtp_port)
                if self.use_tls:
                    server.starttls()
            
            # Login and send
            server.login(self.smtp_username, self.smtp_password)
            server.send_message(message)
            server.quit()
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP authentication failed: {e}")
            raise EmailSendError(f"Authentication failed: {e}") from e
        
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error: {e}")
            raise EmailSendError(f"Failed to send email: {e}") from e
        
        except Exception as e:
            logger.error(f"Unexpected error sending email: {e}")
            raise EmailSendError(f"Unexpected error: {e}") from e
    
    def _load_template(self, template_name: str) -> str:
        template_path = self.template_dir / template_name
        
        if not template_path.exists():
            logger.error(f"Template not found: {template_path}")
            raise FileNotFoundError(f"Email template not found: {template_name}")
        
        try:
            return template_path.read_text(encoding="utf-8")
        except Exception as e:
            logger.error(f"Error reading template {template_name}: {e}")
            raise EmailSendError(f"Failed to read template: {e}") from e
    
    def _create_verification_text(self, first_name: str, confirmation_url: str) -> str:
        """Create plain text version of verification email."""
        return f"""
            Welcome to NovaAcademy, {first_name}!

            You're just one step away from unlocking your study superpowers.

            Confirm your email by clicking this link:
            {confirmation_url}

            Or copy and paste it into your browser.

            This link expires in 24 hours.

            Questions? Reply to this email or contact support@novaacademy.com

            Welcome to the squad!
            — NovaAcademy Team

            Study smarter, not harder 🚀
                    """.strip()
    
    def _create_password_reset_text(self, reset_url: str) -> str:
        """Create plain text version of password reset email."""
        return f"""
            Brain fart moment? No stress!

            We received a request to reset your NovaAcademy password.

            Reset your password by clicking this link:
            {reset_url}

            Or copy and paste it into your browser.

            This link expires in 1 hour.

            Didn't request this? Just ignore this email and your password stays the same.

            Need help? Contact support@novaacademy.com

            — NovaAcademy Team
                    """.strip()


class EmailSendError(Exception):
    """Raised when an email fails to send."""
    pass