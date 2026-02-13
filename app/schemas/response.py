"""Standardised API response envelope.

Every endpoint returns:
    {
        "status": "success" | "error",
        "message": "Human-readable message",
        "data": <payload>,               # single object, list, or null
        "metadata": { ... } | null        # pagination info for list endpoints
    }
"""

from __future__ import annotations

import math
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, Field
from pydantic.generics import GenericModel

T = TypeVar("T")


class PaginationMetadata(BaseModel):
    """Pagination details for list endpoints."""

    current_page: int
    page_size: int
    total_data: int
    total_data_fetched: int
    total_pages: int
    previous_page: Optional[int] = None
    next_page: Optional[int] = None


class ApiResponse(BaseModel, Generic[T]):
    """Standard API response wrapper."""

    status: str = "success"
    message: str = ""
    data: Optional[T] = None
    metadata: Optional[PaginationMetadata] = None


# ── Helper constructors ─────────────────────────────────────────


def success_response(
    data: Any = None,
    message: str = "Success",
    *,
    status_code: int = 200,
) -> dict:
    """Wrap a single-item response."""
    return {"status": "success", "message": message, "data": data, "metadata": None}


def paginated_response(
    data: list,
    message: str = "Success",
    *,
    total: int,
    offset: int,
    limit: int,
) -> dict:
    """Wrap a paginated list response with metadata."""
    page_size = limit
    current_page = (offset // limit) + 1 if limit > 0 else 1
    total_pages = math.ceil(total / limit) if limit > 0 else 1
    return {
        "status": "success",
        "message": message,
        "data": data,
        "metadata": {
            "current_page": current_page,
            "page_size": page_size,
            "total_data": total,
            "total_data_fetched": len(data),
            "total_pages": total_pages,
            "previous_page": current_page - 1 if current_page > 1 else None,
            "next_page": current_page + 1 if current_page < total_pages else None,
        },
    }
