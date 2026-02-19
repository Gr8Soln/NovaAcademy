from abc import ABC, abstractmethod
from io import BytesIO
from typing import Optional, Union

from fastapi import UploadFile


class IStorageService(ABC):
    """Interface for file storage operations."""
    
    @abstractmethod
    async def upload_image(
        self, 
        file: UploadFile,
        max_size_kb: int = 2048,
        optimize: bool = True
    ) -> dict:
        """
        Upload and optionally compress an image file.
        
        Args:
            file: The uploaded image file
            max_size_kb: Maximum file size in KB after compression
            optimize: Whether to optimize/compress the image
            
        Returns:
            dict with file_id, file_url, file_size, file_extension, mime_type
            
        Raises:
            ValueError: If file type is not supported
            StorageError: If upload fails
        """
        ...
    
    @abstractmethod
    async def upload_document(
        self, 
        file: UploadFile,
        max_size_mb: int = 10
    ) -> dict:
        """
        Upload a document file (PDF, DOC, TXT, etc.).
        
        Args:
            file: The uploaded document file
            max_size_mb: Maximum file size in MB
            
        Returns:
            dict with file_id, file_url, file_size, file_extension, mime_type
            
        Raises:
            ValueError: If file type is not supported or size exceeds limit
            StorageError: If upload fails
        """
        ...
    
    @abstractmethod
    async def delete_file(self, file_id: str, extension: str) -> bool:
        """
        Delete a file from storage.
        
        Args:
            file_id: Unique identifier of the file
            extension: File extension (e.g., .jpg, .pdf)
            
        Returns:
            True if deletion was successful
            
        Raises:
            StorageError: If deletion fails
        """
        ...
    
    @abstractmethod
    def get_file_path(self, file_id: str, extension: str) -> str:
        """
        Get the local file path for a stored file.
        
        Args:
            file_id: Unique identifier of the file
            extension: File extension
            
        Returns:
            Absolute path to the file
        """
        ...
    
    @abstractmethod
    def get_file_url(self, file_id: str, extension: str) -> str:
        """
        Get the public URL for a stored file.
        
        Args:
            file_id: Unique identifier of the file
            extension: File extension
            
        Returns:
            Public URL to access the file
        """
        ...
