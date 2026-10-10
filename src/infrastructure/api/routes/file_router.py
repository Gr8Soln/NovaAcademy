from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.logging import get_logger

router = APIRouter(tags=["Files"])
logger = get_logger(__name__)


def get_safe_path(requested_path: str, base_directory: str, check_exists: bool = True) -> Optional[Path]:
    """
    Resolve and validate that the requested path is within the base directory.
    Returns the absolute Path object if valid.
    Raises HTTPException if invalid or not found.
    """
    try:
        # Resolve base directory to absolute path
        base_path = Path(base_directory).resolve()
        
        # requested_path comes from the URL path parameter, which might have forward slashes
        # even on Windows. Path() handles this, but we should be careful.
        # Joining base_path with requested_path
        # Note: If requested_path starts with /, Path.joinpath treats it as absolute, 
        # so we strip leading slashes.
        safe_requested = requested_path.lstrip("/").lstrip("\\")
        target_path = (base_path / safe_requested).resolve()
        
        if not str(target_path).startswith(str(base_path)):
            logger.warning(f"Directory traversal attempt: {requested_path}")
            raise HTTPException(status_code=403, detail="Access denied")
            
        if check_exists and not target_path.exists():
            return None
            
        return target_path

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error resolving path {requested_path}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/documents/{file_path:path}")
async def get_file(file_path: str):
    """
    Serve a file from the configured files directory.
    """
    target_path = get_safe_path(file_path, f"{settings.UPLOAD_DIR}/documents")
    
    if not target_path or not target_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(path=target_path)


@router.get("/images/{file_path:path}")
async def get_image(file_path: str):
    """
    Serve an images file from the configured images directory.
    """
    target_path = get_safe_path(file_path, f"{settings.UPLOAD_DIR}/images")
    
    if not target_path or not target_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(path=target_path)

@router.get("/avatars/{file_path:path}")
async def get_avatar(file_path: str):
    """
    Serve an avatar file from the configured avatar directory.
    """
    target_path = get_safe_path(file_path, f"{settings.UPLOAD_DIR}/avatars")
    
    if not target_path or not target_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(path=target_path)



