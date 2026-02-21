from typing import Optional

from app.application.interfaces import IDocumentExtractorInterface


class DocumentExtractorService(IDocumentExtractorInterface):
    """Concrete text extractor using pypdf and python-docx."""

    SUPPORTED_TYPES = {"pdf", "txt", "docx", "md"}

    async def extract_text(
        self, file_path: str, file_type: str
    ) -> tuple[str, Optional[int]]:
        """
        Extract raw text from a stored file.

        Returns:
            (text, page_count) – page_count is None for non-paginated formats.
        """
        ft = file_type.lower().lstrip(".")

        if ft == "pdf":
            return await self._extract_pdf(file_path)
        elif ft in ("txt", "md"):
            return await self._extract_text_file(file_path)
        elif ft == "docx":
            return await self._extract_docx(file_path)
        else:
            raise ValueError(
                f"Unsupported file type '{ft}'. "
                f"Supported: {', '.join(sorted(self.SUPPORTED_TYPES))}"
            )

    @staticmethod
    async def _extract_pdf(file_path: str) -> tuple[str, int]:
        try:
            from pypdf import PdfReader  # type: ignore
        except ImportError as exc:
            raise RuntimeError(
                "pypdf is required for PDF extraction. "
                "Install it with: pip install pypdf"
            ) from exc

        reader = PdfReader(file_path)
        pages: list[str] = []
        for page in reader.pages:
            text = page.extract_text() or ""
            pages.append(text)

        full_text = "\n\n".join(pages)
        return full_text, len(reader.pages)

    @staticmethod
    async def _extract_text_file(file_path: str) -> tuple[str, None]:
        with open(file_path, encoding="utf-8", errors="replace") as fh:
            content = fh.read()
        return content, None

    @staticmethod
    async def _extract_docx(file_path: str) -> tuple[str, None]:
        try:
            import docx  # type: ignore  # python-docx
        except ImportError as exc:
            raise RuntimeError(
                "python-docx is required for DOCX extraction. "
                "Install it with: pip install python-docx"
            ) from exc

        doc = docx.Document(file_path)
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        return "\n\n".join(paragraphs), None

    # ── Chunking ─────────────────────────────────────────────────

    def chunk_text(
        self,
        text: str,
        chunk_size: int = 500,
        overlap: int = 50,
    ) -> list[str]:
        """
        Split text into overlapping chunks measured in words.

        Strategy: sliding window over whitespace-split tokens.
        The overlap allows embeddings to capture context that spans
        a chunk boundary, improving retrieval accuracy.

        Args:
            text: Full extracted document text.
            chunk_size: Approximate number of words per chunk.
            overlap: Words shared between consecutive chunks.

        Returns:
            List of text chunks (strings).
        """
        if not text or not text.strip():
            return []

        # Normalize whitespace
        words = text.split()
        if not words:
            return []

        if len(words) <= chunk_size:
            return [" ".join(words)]

        chunks: list[str] = []
        step = max(1, chunk_size - overlap)
        start = 0

        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunk = " ".join(words[start:end])
            if chunk.strip():
                chunks.append(chunk)
            if end == len(words):
                break
            start += step

        return chunks
