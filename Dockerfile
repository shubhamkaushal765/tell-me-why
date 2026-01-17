# Dockerfile for RAG Code Assistant
# This allows you to run the entire backend in a container

FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY pyproject.toml requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -e .

# Copy application code
COPY . .

# Create directory for vector database
RUN mkdir -p /app/chroma_db

# Create directory for documents (mount point)
RUN mkdir -p /app/private_docs

# Expose API port
EXPOSE 8000

# Environment variables (override with -e or docker-compose)
ENV DOCS_PATH=/app/private_docs
ENV CHROMA_DB_PATH=/app/chroma_db
ENV API_HOST=0.0.0.0
ENV API_PORT=8000
ENV DEFAULT_LLM=ollama
ENV OLLAMA_BASE_URL=http://host.docker.internal:11434

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python", "app.py"]