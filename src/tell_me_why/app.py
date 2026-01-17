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

from config import settings, validate_settings
from ingest import DocumentIngestor
from rag_chain import chain_manager

# Setup logging
logging.basicConfig(
    level=settings.log_level,
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

    # Initialize default chain to warm up
    try:
        logger.info("Warming up default LLM chain...")
        chain_manager.get_chain(settings.default_llm)
        logger.info("✓ Default chain ready")
    except Exception as e:
        logger.error(f"Failed to initialize default chain: {e}")

    logger.info("=" * 60)
    logger.info("API is ready to accept requests!")
    logger.info(f"Default LLM: {settings.default_llm}")
    logger.info(f"Listening on: http://{settings.api_host}:{settings.api_port}")
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
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API Endpoints
@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        llm_default=settings.default_llm,
        vector_store_path=str(settings.chroma_db_path)
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check endpoint."""
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        llm_default=settings.default_llm,
        vector_store_path=str(settings.chroma_db_path)
    )


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
        logger.info(f"Received query request: llm_type={request.llm_type}")

        # Validate Claude API key if using Claude
        if request.llm_type == "claude" and not settings.anthropic_api_key:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Claude API key not configured. "
                    "Please set ANTHROPIC_API_KEY in your .env file or use 'ollama' instead."
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
        # Get vector store stats
        chain = chain_manager.get_chain(settings.default_llm)
        collection = chain.vectorstore._collection

        return {
            "vector_store": {
                "total_documents": collection.count(),
                "embedding_model": settings.embedding_model,
                "location": str(settings.chroma_db_path)
            },
            "llm": {
                "default": settings.default_llm,
                "ollama_model": settings.ollama_model,
                "claude_model": settings.claude_model,
                "claude_available": bool(settings.anthropic_api_key)
            },
            "retrieval": {
                "top_k": settings.retrieval_k,
                "chunk_size": settings.chunk_size,
                "chunk_overlap": settings.chunk_overlap
            }
        }
    except Exception as e:
        logger.error(f"Failed to get stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/models")
async def list_models():
    """List available LLM models and their status."""
    models = {
        "ollama": {
            "available": True,  # Assume always available if Ollama is running
            "model": settings.ollama_model,
            "base_url": settings.ollama_base_url,
            "privacy": "✓ Fully local - your data never leaves your machine"
        },
        "claude": {
            "available": bool(settings.anthropic_api_key),
            "model": settings.claude_model,
            "privacy": "⚠ Cloud-based - data is sent to Anthropic servers"
        }
    }

    return {
        "default": settings.default_llm,
        "models": models
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,  # Enable auto-reload during development
        log_level=settings.log_level.lower()
    )
