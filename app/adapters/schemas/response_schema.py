import math
from enum import Enum
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel

from app.core.logging import get_logger

logger = get_logger(__name__)

# Generic type variable for response data
T = TypeVar("T")


class Pagination(BaseModel):
    current_page: int
    page_size: int
    total_data: int
    total_data_fetched: int
    total_pages: Optional[int] = None
    previous_page: Optional[int] = None
    next_page: Optional[int] = None


class ResponseStatus(str, Enum):
    SUCCESS = "success"
    FAILED = "failed"


class ResponseModel(BaseModel, Generic[T]):
    """Generic response model that accepts a type parameter for the data field."""
    status: ResponseStatus
    message: str
    data: Optional[T] = None
    metadata: Optional[Pagination] = None

    class Config:
        from_attributes = True


# ================ Typed Response Models ================

class MessageOnlyResponse(ResponseModel[None]):
    """Response model for endpoints that only return a message."""
    pass


class DataResponse(ResponseModel[T], Generic[T]):
    """Response model for endpoints that return data."""
    pass


# ================ Http Response Functions ================

def create_response(
    status: ResponseStatus, 
    message: str, 
    data: Optional[Any] = None, 
    metadata: Optional[Pagination] = None
) -> ResponseModel[Any]:
    return ResponseModel(status=status, message=message, data=data, metadata=metadata)

def success_response(
    message: str,
    data: Optional[Any] = None,
    metadata: Optional[Pagination] = None
) -> ResponseModel[Any]:
    """Create a standardized success response."""
    return ResponseModel(status=ResponseStatus.SUCCESS, message=message, data=data, metadata=metadata)

def error_response(
    message: str,
    data: Optional[Any] = None
) -> ResponseModel[Any]:
    """Create a standardized error response."""
    return ResponseModel(status=ResponseStatus.FAILED, message=message, data=data)


# ================ Pagination Functions ================
    
def generate_pagination(current_page: int, page_size: int, total_data: int, total_fetched: int) -> Pagination:
    total_pages = math.ceil(total_data / page_size)

    return Pagination(
        current_page=current_page,
        page_size=page_size,
        total_data=total_data,
        total_data_fetched=total_fetched,
        total_pages=total_pages,
        previous_page=current_page - 1 if current_page > 1 else None,
        next_page=current_page + 1 if current_page < total_pages else None,
    )


