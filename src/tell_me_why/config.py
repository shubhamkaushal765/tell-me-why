"""
Configuration management for the RAG system.
Loads settings from config.yaml and supports runtime updates via API.
"""
import logging
from pathlib import Path
from typing import Literal, Optional, Dict, Any

import yaml
from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger(__name__)


class APIKeysConfig(BaseModel):
    """API keys configuration."""
    anthropic_api_key: Optional[str] = None


class PathsConfig(BaseModel):
    """File paths configuration."""
    docs_path: Path = Field(default=Path("./rag_documents"))
    chroma_db_path: Path = Field(default=Path("./chroma_db"))

    @field_validator('docs_path', 'chroma_db_path', mode='before')
    @classmethod
    def validate_path(cls, v):
        return Path(v)


class EmbeddingConfig(BaseModel):
    """Embedding model configuration."""
    model: str = "sentence-transformers/all-MiniLM-L6-v2"
    device: str = "cpu"


class ChunkingConfig(BaseModel):
    """Text chunking configuration."""
    chunk_size: int = 1000
    chunk_overlap: int = 200


class RetrievalConfig(BaseModel):
    """Retrieval configuration."""
    top_k: int = 5


class OllamaConfig(BaseModel):
    """Ollama LLM configuration."""
    model: str = "codellama"
    base_url: str = "http://localhost:11434"
    temperature: float = 0.1


class ClaudeConfig(BaseModel):
    """Claude LLM configuration."""
    model: str = "claude-sonnet-4-20250514"
    temperature: float = 0.1
    max_tokens: int = 4096


class LLMConfig(BaseModel):
    """LLM configuration."""
    default: Literal["ollama", "claude"] = "ollama"
    ollama: OllamaConfig = Field(default_factory=OllamaConfig)
    claude: ClaudeConfig = Field(default_factory=ClaudeConfig)


class APIConfig(BaseModel):
    """API server configuration."""
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = Field(default_factory=lambda: [
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ])
    reload: bool = True


class LoggingConfig(BaseModel):
    """Logging configuration."""
    level: str = "INFO"


class IngestionConfig(BaseModel):
    """Document ingestion configuration."""
    supported_file_types: Dict[str, list[str]] = Field(default_factory=lambda: {
        "documentation": [".md", ".pdf", ".txt", ".rst", ".adoc", ".tex"],
        "web": [".html", ".css", ".scss", ".sass", ".less"],
        "javascript": [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"],
        "python": [".py", ".pyx", ".pyi"],
        "rust": [".rs", ".toml"],
        "csharp": [".cs", ".csx", ".cshtml", ".razor"],
        "java": [".java", ".kt", ".kts", ".groovy", ".scala"],
        "cpp": [".c", ".cpp", ".cc", ".cxx", ".h", ".hpp", ".hxx"],
        "go": [".go", ".mod", ".sum"],
        "ruby": [".rb", ".erb", ".rake", ".gemspec"],
        "php": [".php", ".phtml", ".php3", ".php4", ".php5"],
        "shell": [".sh", ".bash", ".zsh", ".fish", ".ps1", ".bat", ".cmd"],
        "data": [".json", ".yaml", ".yml", ".xml", ".toml", ".ini", ".conf", ".cfg", ".ipynb"],
        "database": [".sql", ".prisma", ".graphql", ".gql"],
        "mobile": [".swift", ".m", ".mm", ".dart"],
        "other": [".r", ".jl", ".lua", ".vim", ".el", ".clj", ".erl", ".ex", ".exs"]
    })
    auto_ingest_on_startup: bool = False


class Settings(BaseModel):
    """Main application settings."""
    api_keys: APIKeysConfig = Field(default_factory=APIKeysConfig)
    paths: PathsConfig = Field(default_factory=PathsConfig)
    embedding: EmbeddingConfig = Field(default_factory=EmbeddingConfig)
    chunking: ChunkingConfig = Field(default_factory=ChunkingConfig)
    retrieval: RetrievalConfig = Field(default_factory=RetrievalConfig)
    llm: LLMConfig = Field(default_factory=LLMConfig)
    api: APIConfig = Field(default_factory=APIConfig)
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    ingestion: IngestionConfig = Field(default_factory=IngestionConfig)

    class Config:
        validate_assignment = True


class ConfigManager:
    """Manages configuration loading, saving, and runtime updates."""

    def __init__(self, config_path: str = "config.yaml"):
        """
        Initialize the config manager.

        Args:
            config_path: Path to the YAML config file
        """
        self.config_path = Path(config_path)
        self._settings: Optional[Settings] = None
        self.load()

    def load(self) -> Settings:
        """Load configuration from YAML file."""
        if not self.config_path.exists():
            logger.warning(f"Config file not found at {self.config_path}, using defaults")
            self._settings = Settings()
            self.save()  # Create default config file
            return self._settings

        try:
            with open(self.config_path, 'r') as f:
                config_data = yaml.safe_load(f) or {}

            self._settings = Settings(**config_data)
            logger.info(f"Configuration loaded from {self.config_path}")
            return self._settings

        except Exception as e:
            logger.error(f"Error loading config: {e}, using defaults")
            self._settings = Settings()
            return self._settings

    def save(self) -> None:
        """Save current configuration to YAML file."""
        try:
            config_dict = self._settings.model_dump(mode='python')

            # Convert Path objects to strings for YAML serialization
            config_dict['paths']['docs_path'] = str(config_dict['paths']['docs_path'])
            config_dict['paths']['chroma_db_path'] = str(config_dict['paths']['chroma_db_path'])

            with open(self.config_path, 'w') as f:
                yaml.dump(config_dict, f, default_flow_style=False, sort_keys=False)

            logger.info(f"Configuration saved to {self.config_path}")

        except Exception as e:
            logger.error(f"Error saving config: {e}")
            raise

    def update(self, updates: Dict[str, Any]) -> Settings:
        """
        Update configuration with new values.

        Args:
            updates: Dictionary of configuration updates (nested)

        Returns:
            Updated settings
        """
        try:
            # Get current config as dict
            current_config = self._settings.model_dump(mode='python')

            # Deep merge updates
            self._deep_update(current_config, updates)

            # Validate and create new settings
            self._settings = Settings(**current_config)

            # Save to file
            self.save()

            logger.info("Configuration updated successfully")
            return self._settings

        except Exception as e:
            logger.error(f"Error updating config: {e}")
            raise

    def _deep_update(self, base_dict: dict, update_dict: dict) -> None:
        """Recursively update nested dictionaries."""
        for key, value in update_dict.items():
            if isinstance(value, dict) and key in base_dict and isinstance(base_dict[key], dict):
                self._deep_update(base_dict[key], value)
            else:
                base_dict[key] = value

    @property
    def settings(self) -> Settings:
        """Get current settings."""
        if self._settings is None:
            self.load()
        return self._settings

    def get_dict(self) -> Dict[str, Any]:
        """Get configuration as a dictionary."""
        config_dict = self.settings.model_dump(mode='python')
        # Convert Path objects to strings
        config_dict['paths']['docs_path'] = str(config_dict['paths']['docs_path'])
        config_dict['paths']['chroma_db_path'] = str(config_dict['paths']['chroma_db_path'])
        return config_dict

    def validate_paths(self) -> None:
        """Validate that required paths exist or can be created."""
        # Create chroma_db directory if it doesn't exist
        self.settings.paths.chroma_db_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"✓ Vector DB path: {self.settings.paths.chroma_db_path}")

        # Check docs path
        if not self.settings.paths.docs_path.exists():
            logger.warning(f"⚠ Documents path does not exist: {self.settings.paths.docs_path}")
            logger.warning("  Please create this directory and add your documents")
        else:
            logger.info(f"✓ Documents path: {self.settings.paths.docs_path}")

    def validate_llm(self) -> None:
        """Validate LLM configuration."""
        logger.info(f"✓ Default LLM: {self.settings.llm.default}")

        if self.settings.llm.default == "claude" and not self.settings.api_keys.anthropic_api_key:
            logger.warning("⚠ Claude selected but ANTHROPIC_API_KEY not set!")
            logger.warning("  Set it in config.yaml or use Ollama instead")


# Global config manager instance
config_manager = ConfigManager()

# Convenience accessor for backward compatibility
settings = config_manager.settings


def get_settings() -> Settings:
    """Get current settings."""
    return config_manager.settings


def update_settings(updates: Dict[str, Any]) -> Settings:
    """Update settings and save to file."""
    return config_manager.update(updates)


def reload_settings() -> Settings:
    """Reload settings from file."""
    return config_manager.load()


def validate_settings() -> None:
    """Validate critical settings."""
    config_manager.validate_paths()
    config_manager.validate_llm()
