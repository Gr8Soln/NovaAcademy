import os
import uuid
from io import BytesIO
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile
from PIL import Image

from app.application.interfaces import IStorageService
from app.core.logging import get_logger

logger = get_logger(__name__)


class StorageError(Exception):
    """Custom exception for storage operations."""
    pass


class LocalStorageService(IStorageService):
    """Local file storage implementation with image compression."""
    
    # Image file types
    ALLOWED_IMAGE_TYPES = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }
    
    # Document file types
    ALLOWED_DOCUMENT_TYPES = {
        "application/pdf": ".pdf",
        "application/msword": ".doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "text/plain": ".txt",
        "text/csv": ".csv",
        "application/vnd.ms-excel": ".xls",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    }
    
    def __init__(self, upload_dir: str, base_url: str):
        """
        Initialize storage service.
        
        Args:
            upload_dir: Directory to store uploaded files
            base_url: Base URL for file access
        """
        self.upload_dir = Path(upload_dir)
        self.images_dir = self.upload_dir / "images"
        self.documents_dir = self.upload_dir / "documents"
        self.base_url = base_url.rstrip('/')
        
        # Create directories
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Create upload directories if they don't exist."""
        try:
            self.images_dir.mkdir(parents=True, exist_ok=True)
            self.documents_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"Storage directories ensured: {self.upload_dir}")
        except PermissionError as e:
            logger.error(f"Permission denied creating upload directories: {e}")
            raise StorageError("Permission denied creating upload directories")
        except Exception as e:
            logger.error(f"Failed to create upload directories: {e}")
            raise StorageError("Failed to create upload directories")
    
    async def upload_image(
        self, 
        file: UploadFile,
        max_size_kb: int = 2048,
        optimize: bool = True
    ) -> dict:
        """Upload and compress an image file."""
        try:
            # Validate file type
            if file.content_type not in self.ALLOWED_IMAGE_TYPES:
                raise ValueError(
                    f"Unsupported image type: {file.content_type}. "
                    f"Allowed: {', '.join(self.ALLOWED_IMAGE_TYPES.keys())}"
                )
            
            # Read file content
            content = await file.read()
            if not content:
                raise ValueError("Empty file")
            
            # Generate unique filename
            file_id = str(uuid.uuid4())
            extension = self.ALLOWED_IMAGE_TYPES[file.content_type]
            
            # Compress/optimize image if requested
            if optimize:
                content = await self._compress_image(
                    content, 
                    extension,
                    max_size_kb=max_size_kb
                )
            
            # Save file
            file_path = self.images_dir / f"{file_id}{extension}"
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Get file size
            file_size = os.path.getsize(file_path)
            
            logger.info(
                f"Image uploaded: {file_id}{extension} "
                f"({file_size} bytes, original: {file.filename})"
            )
            
            return {
                "file_id": file_id,
                "file_url": self.get_file_url(file_id, extension),
                "file_size": file_size,
                "file_extension": extension,
                "mime_type": file.content_type,
                "original_name": file.filename,
            }
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to upload image: {e}")
            raise StorageError(f"Failed to upload image: {str(e)}")
    
    async def upload_document(
        self, 
        file: UploadFile,
        max_size_mb: int = 10
    ) -> dict:
        """Upload a document file."""
        try:
            # Validate file type
            if file.content_type not in self.ALLOWED_DOCUMENT_TYPES:
                raise ValueError(
                    f"Unsupported document type: {file.content_type}. "
                    f"Allowed: {', '.join(self.ALLOWED_DOCUMENT_TYPES.keys())}"
                )
            
            # Read file content
            content = await file.read()
            if not content:
                raise ValueError("Empty file")
            
            # Check file size
            file_size_mb = len(content) / (1024 * 1024)
            if file_size_mb > max_size_mb:
                raise ValueError(
                    f"File size ({file_size_mb:.2f}MB) exceeds limit ({max_size_mb}MB)"
                )
            
            # Generate unique filename
            file_id = str(uuid.uuid4())
            extension = self.ALLOWED_DOCUMENT_TYPES[file.content_type]
            
            # Save file
            file_path = self.documents_dir / f"{file_id}{extension}"
            with open(file_path, "wb") as f:
                f.write(content)
            
            file_size = os.path.getsize(file_path)
            
            logger.info(
                f"Document uploaded: {file_id}{extension} "
                f"({file_size} bytes, original: {file.filename})"
            )
            
            return {
                "file_id": file_id,
                "file_url": self.get_file_url(file_id, extension),
                "file_size": file_size,
                "file_extension": extension,
                "mime_type": file.content_type,
                "original_name": file.filename,
            }
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to upload document: {e}")
            raise StorageError(f"Failed to upload document: {str(e)}")
    
    async def delete_file(self, file_id: str, extension: str) -> bool:
        """Delete a file from storage."""
        try:
            # Check in both directories
            for directory in [self.images_dir, self.documents_dir]:
                file_path = directory / f"{file_id}{extension}"
                if file_path.exists():
                    file_path.unlink()
                    logger.info(f"File deleted: {file_id}{extension}")
                    return True
            
            logger.warning(f"File not found for deletion: {file_id}{extension}")
            return False
            
        except Exception as e:
            logger.error(f"Failed to delete file {file_id}{extension}: {e}")
            raise StorageError(f"Failed to delete file: {str(e)}")
    
    def get_file_path(self, file_id: str, extension: str) -> str:
        """Get the local file path."""
        # Check in both directories
        for directory in [self.images_dir, self.documents_dir]:
            file_path = directory / f"{file_id}{extension}"
            if file_path.exists():
                return str(file_path)
        
        # Default to images directory if file doesn't exist yet
        return str(self.images_dir / f"{file_id}{extension}")
    
    def get_file_url(self, file_id: str, extension: str) -> str:
        """Get the public URL for a file."""
        # Determine file type from extension
        if extension in self.ALLOWED_IMAGE_TYPES.values():
            return f"{self.base_url}/api/v1/files/images/{file_id}{extension}"
        else:
            return f"{self.base_url}/api/v1/files/documents/{file_id}{extension}"
    
    async def _compress_image(
        self, 
        content: bytes, 
        extension: str,
        max_size_kb: int = 2048,
        quality: int = 85,
        max_width: int = 1920,
        max_height: int = 1080
    ) -> bytes:
        """
        Compress and resize an image.
        
        Args:
            content: Image bytes
            extension: File extension
            max_size_kb: Target maximum size in KB
            quality: JPEG quality (1-100)  
            max_width: Maximum width in pixels
            max_height: Maximum height in pixels
            
        Returns:
            Compressed image bytes
        """
        try:
            # Open image
            img = Image.open(BytesIO(content))
            
            # Convert RGBA to RGB if saving as JPEG
            if extension in ['.jpg', '.jpeg'] and img.mode in ('RGBA', 'LA', 'P'):
                # Create white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            
            # Resize if image is too large
            if img.width > max_width or img.height > max_height:
                img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
                logger.info(f"Image resized to {img.width}x{img.height}")
            
            # Save with compression
            output = BytesIO()
            save_format = 'JPEG' if extension in ['.jpg', '.jpeg'] else 'PNG'
            
            if save_format == 'JPEG':
                img.save(output, format=save_format, quality=quality, optimize=True)
            else:
                img.save(output, format=save_format, optimize=True)
            
            compressed_content = output.getvalue()
            
            # If still too large, reduce quality further
            if len(compressed_content) > max_size_kb * 1024 and save_format == 'JPEG':
                quality = max(50, quality - 15)
                output = BytesIO()
                img.save(output, format=save_format, quality=quality, optimize=True)
                compressed_content = output.getvalue()
                logger.info(f"Image recompressed with quality={quality}")
            
            original_size_kb = len(content) / 1024
            compressed_size_kb = len(compressed_content) / 1024
            reduction = ((original_size_kb - compressed_size_kb) / original_size_kb) * 100
            
            logger.info(
                f"Image compressed: {original_size_kb:.2f}KB → {compressed_size_kb:.2f}KB "
                f"({reduction:.1f}% reduction)"
            )
            
            return compressed_content
            
        except Exception as e:
            logger.error(f"Image compression failed: {e}")
            # Return original content if compression fails
            return content
