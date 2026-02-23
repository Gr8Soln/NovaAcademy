import os
from typing import Optional

import fitz  # PyMuPDF
import pandas as pd
import pytesseract
from docx import Document
from PIL import Image
from pptx import Presentation

from app.application.interfaces import IDocumentExtractorInterface


class DocumentExtractor(IDocumentExtractorInterface):
    async def extract(self, file_path: str) -> tuple[str, Optional[int]]:
        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".pdf":
            return self._extract_pdf(file_path)

        if ext in [".png", ".jpg", ".jpeg"]:
            return self._extract_image(file_path)

        if ext == ".csv":
            return self._extract_csv(file_path)

        if ext in [".xlsx", ".xls"]:
            return self._extract_excel(file_path)

        if ext == ".pptx":
            return self._extract_pptx(file_path)

        if ext == ".docx":
            return self._extract_docx(file_path)

        raise ValueError(f"Unsupported file type: {ext}")
    
    
    def chunk(self, text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
        ...


    # -----------------------------
    # PDF
    # -----------------------------

    def _extract_pdf(self, file_path: str) -> tuple[str, int]:
        doc = fitz.open(file_path)
        text = ""
        page_count = 0

        for page in doc:
            page_count += 1
            page_text = page.get_text()
            if not isinstance(page_text, str):
                page_text = str(page_text)

            # If PDF has no text (scanned)
            if not page_text.strip():
                pix = page.get_pixmap()
                img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
                page_text = pytesseract.image_to_string(img)

            text += page_text + "\n"

        return text, page_count

    # -----------------------------
    # Images
    # -----------------------------

    def _extract_image(self, file_path: str) -> tuple[str, int]:
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)
        return text, 1

    # -----------------------------
    # CSV
    # -----------------------------

    def _extract_csv(self, file_path: str) -> tuple[str, int]:
        df = pd.read_csv(file_path)
        return df.to_string(), 1

    # -----------------------------
    # Excel
    # -----------------------------

    def _extract_excel(self, file_path: str) -> tuple[str, int]:
        df = pd.read_excel(file_path, sheet_name=None)
        text = ""
        total_sheets = 0
        for sheet, data in df.items():
            text += f"\nSheet: {sheet}\n"
            text += data.to_string()
            total_sheets += 1
        return text, total_sheets

    # -----------------------------
    # PPTX
    # -----------------------------

    def _extract_pptx(self, file_path: str) -> tuple[str, int]:
        prs = Presentation(file_path)
        text = ""
        total_slides = len(prs.slides)
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text += shape.text + "\n"
        return text, total_slides

    # -----------------------------
    # DOCX
    # -----------------------------

    def _extract_docx(self, file_path: str) -> tuple[str, int]:
        doc = Document(file_path)
        text = "\n".join([p.text for p in doc.paragraphs])
        return text, 1
    
    
    
    
    
    
# class DocumentExtractor(IDocumentExtractorInterface):
#     """Concrete text extractor using pypdf and python-docx."""

#     SUPPORTED_TYPES = {"pdf", "txt", "docx", "md"}

#     async def extract_text(
#         self, file_path: str, file_type: str
#     ) -> tuple[str, Optional[int]]:
#         """
#         Extract raw text from a stored file.

#         Returns:
#             (text, page_count) – page_count is None for non-paginated formats.
#         """
#         ft = file_type.lower().lstrip(".")

#         if ft == "pdf":
#             return await self._extract_pdf(file_path)
#         elif ft in ("txt", "md"):
#             return await self._extract_text_file(file_path)
#         elif ft == "docx":
#             return await self._extract_docx(file_path)
#         else:
#             raise ValueError(
#                 f"Unsupported file type '{ft}'. "
#                 f"Supported: {', '.join(sorted(self.SUPPORTED_TYPES))}"
#             )

#     @staticmethod
#     async def _extract_pdf(file_path: str) -> tuple[str, int]:
#         try:
#             from pypdf import PdfReader  # type: ignore
#         except ImportError as exc:
#             raise RuntimeError(
#                 "pypdf is required for PDF extraction. "
#                 "Install it with: pip install pypdf"
#             ) from exc

#         reader = PdfReader(file_path)
#         pages: list[str] = []
#         for page in reader.pages:
#             text = page.extract_text() or ""
#             pages.append(text)

#         full_text = "\n\n".join(pages)
#         return full_text, len(reader.pages)

#     @staticmethod
#     async def _extract_text_file(file_path: str) -> tuple[str, None]:
#         with open(file_path, encoding="utf-8", errors="replace") as fh:
#             content = fh.read()
#         return content, None

#     @staticmethod
#     async def _extract_docx(file_path: str) -> tuple[str, None]:
#         try:
#             import docx  # type: ignore  # python-docx
#         except ImportError as exc:
#             raise RuntimeError(
#                 "python-docx is required for DOCX extraction. "
#                 "Install it with: pip install python-docx"
#             ) from exc

#         doc = docx.Document(file_path)
#         paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
#         return "\n\n".join(paragraphs), None

#     # ── Chunking ─────────────────────────────────────────────────

#     def chunk_text(
#         self,
#         text: str,
#         chunk_size: int = 500,
#         overlap: int = 50,
#     ) -> list[str]:
#         """
#         Split text into overlapping chunks measured in words.

#         Strategy: sliding window over whitespace-split tokens.
#         The overlap allows embeddings to capture context that spans
#         a chunk boundary, improving retrieval accuracy.

#         Args:
#             text: Full extracted document text.
#             chunk_size: Approximate number of words per chunk.
#             overlap: Words shared between consecutive chunks.

#         Returns:
#             List of text chunks (strings).
#         """
#         if not text or not text.strip():
#             return []

#         # Normalize whitespace
#         words = text.split()
#         if not words:
#             return []

#         if len(words) <= chunk_size:
#             return [" ".join(words)]

#         chunks: list[str] = []
#         step = max(1, chunk_size - overlap)
#         start = 0

#         while start < len(words):
#             end = min(start + chunk_size, len(words))
#             chunk = " ".join(words[start:end])
#             if chunk.strip():
#                 chunks.append(chunk)
#             if end == len(words):
#                 break
#             start += step

#         return chunks
