from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.application.interfaces import IStorageService
from app.domain.entities import User
from app.infrastructure.api.dependencies import (get_current_user,
                                                 get_storage_service)

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/images", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    storage: Annotated[IStorageService, Depends(get_storage_service)] = None,
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """
    Upload an image file (JPEG, PNG, WebP, GIF).
    Images are automatically optimized and compressed.
    """
    try:
        result = await storage.upload_image(file, optimize=True)
        return {
            "status": "success",
            "message": "Image uploaded successfully",
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )


@router.post("/documents", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    storage: Annotated[IStorageService, Depends(get_storage_service)] = None,
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """
    Upload a document file (PDF, DOCX, TXT, CSV, XLSX).
    Maximum file size: 10MB.
    """
    try:
        result = await storage.upload_document(file)
        return {
            "status": "success",
            "message": "Document uploaded successfully",
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )


@router.get("/images/{file_id}")
async def get_image(
    file_id: str,
    storage: Annotated[IStorageService, Depends(get_storage_service)] = None,
):
    """Retrieve an uploaded image file."""
    try:
        # Try common image extensions
        for ext in ['.jpg', '.png', '.webp', '.gif']:
            file_path = storage.get_file_path(file_id, ext)
            import os
            if os.path.exists(file_path):
                return FileResponse(file_path)
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve image: {str(e)}"
        )


@router.get("/documents/{file_id}")
async def get_document(
    file_id: str,
    storage: Annotated[IStorageService, Depends(get_storage_service)] = None,
):
    """Retrieve an uploaded document file."""
    try:
        # Try common document extensions
        for ext in ['.pdf', '.docx', '.doc', '.txt', '.csv', '.xlsx', '.xls']:
            file_path = storage.get_file_path(file_id, ext)
            import os
            if os.path.exists(file_path):
                return FileResponse(file_path)
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve document: {str(e)}"
        )


@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    extension: str,
    storage: Annotated[IStorageService, Depends(get_storage_service)] = None,
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """Delete an uploaded file."""
    try:
        success = await storage.delete_file(file_id, extension)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        return {
            "status": "success",
            "message": "File deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )
