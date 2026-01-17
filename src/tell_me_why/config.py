"""
Configuration management for the RAG system.
Handles environment variables and application settings.
"""
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Keys
    anthropic_api_key: str | None = None

    # Paths
    docs_path: Path = Path("~/PycharmProjects/tell-me-why/rag_documents").expanduser()
    chroma_db_path: Path = Path("./chroma_db")

    # Embedding Model
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Text Splitting
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # Retrieval
    retrieval_k: int = 5  # Top K documents to retrieve

    # LLM Settings
    default_llm: Literal["ollama", "claude"] = "ollama"
    ollama_model: str = "codellama"  # or "llama3"
    ollama_base_url: str = "http://localhost:11434"
    claude_model: str = "claude-sonnet-4-20250514"

    # API Settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Logging
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


# Global settings instance
settings = Settings()


def validate_settings() -> None:
    """Validate critical settings before running the application."""
    if not settings.docs_path.exists():
        raise ValueError(f"Documents path does not exist: {settings.docs_path}")

    # Create chroma_db directory if it doesn't exist
    settings.chroma_db_path.mkdir(parents=True, exist_ok=True)

    print(f"✓ Documents path: {settings.docs_path}")
    print(f"✓ Vector DB path: {settings.chroma_db_path}")
    print(f"✓ Default LLM: {settings.default_llm}")

    if settings.default_llm == "claude" and not settings.anthropic_api_key:
        print("⚠ WARNING: Claude selected but ANTHROPIC_API_KEY not set!")
