
# ── Auth ────────────────────────────────────────────────────

class AuthenticationError(Exception):
    """Raised when authentication fails due to invalid credentials or tokens."""
    
class AuthorizationError(Exception):
    """Raised when a user tries to access a resource they don't have permissions for."""

class TokenError(Exception):
    """Raised when there is an issue with token generation or validation."""
    
class UserNotFoundError(Exception):
    """Raised when a user is not found in the database."""
    
class PasswordResetError(Exception):
    """Raised when there is an issue with password reset process."""
    
class UserAlreadyExistsError(Exception):
    """Raised when trying to register a user with an email that already exists."""    