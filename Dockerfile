# Root Dockerfile for Render Compatibility
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy from backend directory
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ .

# Production uvicorn command
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
