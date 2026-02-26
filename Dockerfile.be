FROM python:3.12-slim AS backend

WORKDIR /app

# Install system deps for document parsing and OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
# We filter out pywin32 as it's Windows-only
COPY requirements.txt .
RUN grep -v "pywin32" requirements.txt > requirements_docker.txt && \
    pip install --no-cache-dir -r requirements_docker.txt

# Copy application code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Default command to run the FastAPI app
CMD ["python", "app/main.py"]

