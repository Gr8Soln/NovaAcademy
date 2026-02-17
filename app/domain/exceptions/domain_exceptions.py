"""Domain exceptions — business-rule violations independent of any framework."""


class DomainException(Exception):
    """Base class for all domain exceptions."""


# ── Auth Exceptions ─────────────────────────────────────────────
class AuthenticationError(DomainException):
    """Invalid credentials or token."""


class AuthorizationError(DomainException):
    """User lacks permission for the requested action."""


class UserAlreadyExistsError(DomainException):
    """Attempt to register with an email that already exists."""


class UserNotFoundError(DomainException):
    """Requested user does not exist."""



# ── Document-related exceptions ─────────────────────────────────
class DocumentNotFoundError(DomainException):
    """Requested document does not exist."""


class DocumentProcessingError(DomainException):
    """Failure during document parsing / chunking."""


class QuizNotFoundError(DomainException):
    """Requested quiz does not exist."""


class InvalidFileTypeError(DomainException):
    """Uploaded file type is not supported."""


class VectorStoreError(DomainException):
    """Failure communicating with the vector database."""


class LLMError(DomainException):
    """Failure communicating with the language model."""


# ── Social feature exceptions ───────────────────────────────

class AlreadyFollowingError(DomainException):
    """User is already following the target user."""


class NotFollowingError(DomainException):
    """User is not following the target user."""


class PostNotFoundError(DomainException):
    """Requested post does not exist."""


class AlreadyLikedError(DomainException):
    """User has already liked this post."""


class ChallengeNotFoundError(DomainException):
    """Requested challenge does not exist."""


class ChallengeValidationError(DomainException):
    """Invalid challenge configuration or action."""


class InsufficientPointsError(DomainException):
    """User does not have enough points for the requested action."""


class PointCapReachedError(DomainException):
    """Daily or action-specific point cap reached."""


class StudySessionNotFoundError(DomainException):
    """Requested study session does not exist."""


class NotificationNotFoundError(DomainException):
    """Requested notification does not exist."""
