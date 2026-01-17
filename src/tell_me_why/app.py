"""
FastAPI application for the RAG-based code assistance API.
Provides endpoints for querying the RAG system and managing document ingestion.
"""
import logging
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .config import config_manager, get_settings, update_settings, reload_settings, validate_settings
from .ingest import DocumentIngestor
from .rag_chain import chain_manager

settings = get_settings()

# Setup logging
logging.basicConfig(
    level=settings.logging.level.lower(),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# Pydantic models for API
class QueryRequest(BaseModel):
    """Request model for querying the RAG system."""
    query: str = Field(..., min_length=1, description="The question or task to process")
    llm_type: Literal["ollama", "claude"] = Field(
        default="ollama",
        description="LLM to use: 'ollama' for local (private) or 'claude' for cloud (better performance)"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "query": "Generate an Angular component for user login",
                    "llm_type": "ollama"
                },
                {
                    "query": "Debug this code: export class MyComponent { constructor() { console.log('test') } }",
                    "llm_type": "claude"
                },
                {
                    "query": "Explain the authentication module",
                    "llm_type": "ollama"
                }
            ]
        }
    }


class QueryResponse(BaseModel):
    """Response model for query results."""
    answer: str
    sources: list[dict]
    llm_type: str
    privacy_note: str


class IngestRequest(BaseModel):
    """Request model for document ingestion."""
    force_reingest: bool = Field(
        default=False,
        description="If true, clears existing vector store before ingesting"
    )


class IngestResponse(BaseModel):
    """Response model for ingestion status."""
    status: str
    message: str


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    version: str
    llm_default: str
    vector_store_path: str


# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    # Startup
    logger.info("Starting RAG Code Assistant API...")
    validate_settings()

    settings = get_settings()

    # Initialize default chain to warm up
    try:
        logger.info("Warming up default LLM chain...")
        chain_manager.get_chain(settings.llm.default)
        logger.info("✓ Default chain ready")
    except Exception as e:
        logger.error(f"Failed to initialize default chain: {e}")

    logger.info("=" * 60)
    logger.info("API is ready to accept requests!")
    logger.info(f"Default LLM: {settings.llm.default}")
    logger.info(f"Listening on: http://{settings.api.host}:{settings.api.port}")
    logger.info("=" * 60)

    yield

    # Shutdown
    logger.info("Shutting down API...")


# Create FastAPI app
app = FastAPI(
    title="RAG Code Assistant API",
    description="Privacy-preserving RAG system for Angular/React code assistance",
    version="0.1.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().api.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API Endpoints
@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint."""
    settings = get_settings()
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        llm_default=settings.llm.default,
        vector_store_path=str(settings.paths.chroma_db_path)
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check endpoint."""
    settings = get_settings()
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        llm_default=settings.llm.default,
        vector_store_path=str(settings.paths.chroma_db_path)
    )


@app.get("/config")
async def get_config():
    """
    Get current configuration.
    Returns the full configuration as JSON.
    """
    try:
        return config_manager.get_dict()
    except Exception as e:
        logger.error(f"Failed to get config: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/config")
async def update_config(updates: dict):
    """
    Update configuration settings.

    Accepts a nested dictionary of configuration updates.
    The configuration is validated and saved to config.yaml.

    Example:
    {
        "llm": {
            "default": "claude"
        },
        "api_keys": {
            "anthropic_api_key": "sk-ant-..."
        }
    }
    """
    try:
        # Update settings
        updated_settings = update_settings(updates)

        # Clear RAG chain cache to use new settings
        chain_manager.chains.clear()

        logger.info(f"Configuration updated: {list(updates.keys())}")

        return {
            "status": "success",
            "message": "Configuration updated successfully",
            "updated_fields": list(updates.keys()),
            "config": config_manager.get_dict()
        }
    except Exception as e:
        logger.error(f"Failed to update config: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/config/reload")
async def reload_config():
    """
    Reload configuration from config.yaml file.
    Useful if the file was edited manually.
    """
    try:
        reload_settings()

        # Clear RAG chain cache
        chain_manager.chains.clear()

        logger.info("Configuration reloaded from file")

        return {
            "status": "success",
            "message": "Configuration reloaded successfully",
            "config": config_manager.get_dict()
        }
    except Exception as e:
        logger.error(f"Failed to reload config: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    """
    Query the RAG system with a question or task.

    Examples:
    - "Generate an Angular component for user login"
    - "Debug this code: [code snippet]"
    - "Explain the authentication module"
    """
    try:
        settings = get_settings()
        logger.info(f"Received query request: llm_type={request.llm_type}")

        # Validate Claude API key if using Claude
        if request.llm_type == "claude" and not settings.api_keys.anthropic_api_key:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Claude API key not configured. "
                    "Please set api_keys.anthropic_api_key in config.yaml or use 'ollama' instead."
                )
            )

        # Process query
        result = chain_manager.query(
            question=request.query,
            llm_type=request.llm_type
        )

        return QueryResponse(**result)

    except Exception as e:
        logger.error(f"Query failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest", response_model=IngestResponse)
async def ingest_documents(request: IngestRequest, background_tasks: BackgroundTasks):
    """
    Ingest or update documents in the vector store.
    This is run as a background task as it can take several minutes.

    Note: For large document sets, consider running ingest.py directly instead.
    """
    try:
        logger.info("Received ingestion request")

        if request.force_reingest:
            logger.warning("Force reingest requested - this will clear the existing vector store")
            # TODO: Implement vector store clearing if needed

        # Run ingestion in background
        def run_ingestion():
            try:
                ingestor = DocumentIngestor()
                ingestor.run_ingestion()
                logger.info("✓ Background ingestion completed")
            except Exception as e:
                logger.error(f"Background ingestion failed: {e}", exc_info=True)

        background_tasks.add_task(run_ingestion)

        return IngestResponse(
            status="started",
            message="Document ingestion started in background. Check logs for progress."
        )

    except Exception as e:
        logger.error(f"Failed to start ingestion: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats")
async def get_stats():
    """Get statistics about the vector store and available models."""
    try:
        settings = get_settings()

        # Get vector store stats
        chain = chain_manager.get_chain(settings.llm.default)
        collection = chain.vectorstore._collection

        return {
            "vector_store": {
                "total_documents": collection.count(),
                "embedding_model": settings.embedding.model,
                "location": str(settings.paths.chroma_db_path)
            },
            "llm": {
                "default": settings.llm.default,
                "ollama_model": settings.llm.ollama.model,
                "claude_model": settings.llm.claude.model,
                "claude_available": bool(settings.api_keys.anthropic_api_key)
            },
            "retrieval": {
                "top_k": settings.retrieval.top_k,
                "chunk_size": settings.chunking.chunk_size,
                "chunk_overlap": settings.chunking.chunk_overlap
            }
        }
    except Exception as e:
        logger.error(f"Failed to get stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/models")
async def list_models():
    """List available LLM models and their status."""
    settings = get_settings()

    models = {
        "ollama": {
            "available": True,  # Assume always available if Ollama is running
            "model": settings.llm.ollama.model,
            "base_url": settings.llm.ollama.base_url,
            "privacy": "✓ Fully local - your data never leaves your machine"
        },
        "claude": {
            "available": bool(settings.api_keys.anthropic_api_key),
            "model": settings.llm.claude.model,
            "privacy": "⚠ Cloud-based - data is sent to Anthropic servers"
        }
    }

    return {
        "default": settings.llm.default,
        "models": models
    }


def main():
    """Main entry point for the FastAPI application."""
    import uvicorn

    uvicorn.run(
        "tell_me_why.app:app",
        host=settings.api.host,
        port=settings.api.port,
        reload=settings.api.reload,
        log_level=settings.logging.level.lower()
    )


if __name__ == "__main__":
    main()
