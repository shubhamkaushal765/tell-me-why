# Docker Deployment Guide

This guide shows how to run the RAG Code Assistant using Docker and Docker Compose.

## 🐳 Prerequisites

- Docker Desktop or Docker Engine (20.10+)
- Docker Compose (2.0+)

## 🚀 Quick Start with Docker Compose

### 1. Prepare Your Environment

```bash
# Clone the repository
git clone <your-repo>
cd tell-me-why

# Create .env file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 2. Set Up Document Directory

```bash
# Create a directory for your private docs
mkdir -p private_docs

# Copy your Angular/React docs and code
cp -r /path/to/your/framework/* private_docs/
```

### 3. Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

This will start:

- **rag-api**: The FastAPI backend on port 8000
- **ollama**: Local Ollama service on port 11434

### 4. Pull Ollama Model

```bash
# Pull codellama model
docker exec -it ollama-service ollama pull codellama

# Or pull llama3
docker exec -it ollama-service ollama pull llama3

# Verify models
docker exec -it ollama-service ollama list
```

### 5. Ingest Documents

```bash
# Run ingestion inside container
docker exec -it rag-code-assistant python ingest.py
```

### 6. Test the API

```bash
# Health check
curl http://localhost:8000/health

# Query the API
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Generate an Angular login component",
    "llm_type": "ollama"
  }'
```

## 🛠️ Building and Running Manually

### Build the Image

```bash
docker build -t rag-code-assistant .
```

### Run the Container

```bash
docker run -d \
  --name rag-api \
  -p 8000:8000 \
  -v $(pwd)/private_docs:/app/private_docs:ro \
  -v $(pwd)/chroma_db:/app/chroma_db \
  -v $(pwd)/.env:/app/.env:ro \
  --network host \
  rag-code-assistant
```

**Note**: `--network host` allows the container to access Ollama running on the host machine.

## 📝 Docker Compose Configuration

### Basic Configuration

```yaml
# docker-compose.yml
services:
  rag-api:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./private_docs:/app/private_docs:ro
      - ./chroma_db:/app/chroma_db
      - ./.env:/app/.env:ro
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
```

### Using System Ollama

If you want to use Ollama installed on your host system instead of the containerized version:

```yaml
services:
  rag-api:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./private_docs:/app/private_docs:ro
      - ./chroma_db:/app/chroma_db
      - ./.env:/app/.env:ro
    environment:
      - OLLAMA_BASE_URL=http://host.docker.internal:11434
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

Then comment out the `ollama` service in `docker-compose.yml`.

### GPU Support for Ollama

For GPU acceleration with Ollama:

```yaml
services:
  ollama:
    image: ollama/ollama:latest
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [ gpu ]
```

**Requirements**: NVIDIA GPU, Docker with GPU support

## 🔧 Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f rag-api
docker-compose logs -f ollama
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart rag-api
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Execute Commands in Container

```bash
# Open shell
docker exec -it rag-code-assistant bash

# Run ingestion
docker exec -it rag-code-assistant python ingest.py

# Check stats
docker exec -it rag-code-assistant python -c "from config import validate_settings; validate_settings()"
```

### Update Models

```bash
# Pull new Ollama model
docker exec -it ollama-service ollama pull deepseek-coder

# Update .env to use new model
# Edit .env: OLLAMA_MODEL=deepseek-coder

# Restart API
docker-compose restart rag-api
```

## 🔍 Troubleshooting

### Ollama Connection Issues

**Error**: "Failed to connect to Ollama"

```bash
# Check if Ollama container is running
docker-compose ps

# Check Ollama logs
docker-compose logs ollama

# Test Ollama connection from API container
docker exec -it rag-code-assistant curl http://ollama:11434/api/tags
```

### Volume Permission Issues

**Error**: "Permission denied" when accessing volumes

```bash
# Fix permissions on host
chmod -R 755 private_docs
chmod -R 755 chroma_db

# Or run container as root (not recommended for production)
docker-compose run --user root rag-api bash
```

### Out of Memory

**Error**: Container crashes or becomes unresponsive

```bash
# Increase Docker memory limit (Docker Desktop)
# Settings > Resources > Memory > Increase to 8GB+

# Or limit model size
# Use smaller models: llama3:8b instead of llama3:70b
```

### Documents Not Found

**Error**: "No documents found to ingest"

```bash
# Check volume mount
docker exec -it rag-code-assistant ls -la /app/private_docs

# Verify DOCS_PATH in .env
docker exec -it rag-code-assistant env | grep DOCS_PATH

# Check permissions
docker exec -it rag-code-assistant ls -la /app/private_docs
```

## 🌐 Production Deployment

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml rag-stack

# Check services
docker stack services rag-stack
```

### Using Kubernetes

Create a `deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rag-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: rag-api
  template:
    metadata:
      labels:
        app: rag-api
    spec:
      containers:
        - name: rag-api
          image: rag-code-assistant:latest
          ports:
            - containerPort: 8000
          volumeMounts:
            - name: docs
              mountPath: /app/private_docs
              readOnly: true
            - name: chroma
              mountPath: /app/chroma_db
          env:
            - name: OLLAMA_BASE_URL
              value: "http://ollama-service:11434"
      volumes:
        - name: docs
          persistentVolumeClaim:
            claimName: docs-pvc
        - name: chroma
          persistentVolumeClaim:
            claimName: chroma-pvc
```

### Environment Variables in Production

```bash
# Use Docker secrets for sensitive data
echo "sk-ant-..." | docker secret create anthropic_key -

# Reference in docker-compose.yml
services:
  rag-api:
    secrets:
      - anthropic_key
    environment:
      - ANTHROPIC_API_KEY_FILE=/run/secrets/anthropic_key
```

## 📊 Monitoring

### Health Checks

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' rag-code-assistant

# Manual health check
curl http://localhost:8000/health
```

### Resource Usage

```bash
# Monitor resource usage
docker stats rag-code-assistant ollama-service

# Detailed container info
docker inspect rag-code-assistant
```

## 🔄 Updates and Maintenance

### Update Application Code

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Re-ingest if needed
docker exec -it rag-code-assistant python ingest.py
```

### Backup Vector Database

```bash
# Create backup
docker run --rm -v $(pwd)/chroma_db:/data -v $(pwd)/backup:/backup \
  alpine tar czf /backup/chroma_db_$(date +%Y%m%d).tar.gz -C /data .

# Restore from backup
docker run --rm -v $(pwd)/backup:/backup -v $(pwd)/chroma_db:/data \
  alpine tar xzf /backup/chroma_db_20250117.tar.gz -C /data
```

## 🚀 Performance Optimization

### Use BuildKit

```bash
# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1
docker-compose build
```

### Multi-stage Builds

Already implemented in the Dockerfile for smaller image size.

### Resource Limits

```yaml
services:
  rag-api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          memory: 2G
```

---

**For more help, see the main README.md or open an issue on GitHub.**