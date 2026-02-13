"""Domain exceptions — business-rule violations independent of any framework."""


class DomainException(Exception):
    """Base class for all domain exceptions."""


class AuthenticationError(DomainException):
    """Invalid credentials or token."""


class AuthorizationError(DomainException):
    """User lacks permission for the requested action."""


class UserAlreadyExistsError(DomainException):
    """Attempt to register with an email that already exists."""


class UserNotFoundError(DomainException):
    """Requested user does not exist."""


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
