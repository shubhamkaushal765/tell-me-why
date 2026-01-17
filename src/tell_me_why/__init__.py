"""
Tell Me Why - Privacy-Preserving RAG Code Assistant

This module provides automatic setup and initialization for the RAG system.
"""
import logging
import subprocess
import sys
from pathlib import Path
from typing import Optional

__version__ = "0.1.0"
__author__ = "Shubham Kaushal (shubhamkaushal765@gmail.com)"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    filename="./tmw.log"
)
logger = logging.getLogger(__name__)


class SetupManager:
    """Manages automatic setup and initialization of the RAG system."""

    def __init__(self, root_dir: Optional[Path] = None):
        """
        Initialize the setup manager.

        Args:
            root_dir: Root directory of the project. If None, uses current directory.
        """
        self.root_dir = root_dir or Path.cwd()
        self.config_path = self.root_dir / "config.yaml"
        self.venv_path = self.root_dir / "venv"
        self.docs_path = self.root_dir / "private_docs"
        self.chroma_path = self.root_dir / "chroma_db"

    def check_python_version(self) -> bool:
        """Check if Python version meets requirements (>=3.11)."""
        version_info = sys.version_info
        if version_info < (3, 11):
            logger.error(
                f"Python 3.11+ required. You have {version_info.major}.{version_info.minor}"
            )
            return False
        logger.info(f"✓ Python {version_info.major}.{version_info.minor}.{version_info.micro}")
        return True

    def check_uv(self) -> bool:
        """Check if uv is installed."""
        try:
            result = subprocess.run(
                ["uv", "--version"],
                capture_output=True,
                timeout=5
            )
            if result.returncode == 0:
                version = result.stdout.decode().strip()
                logger.info(f"✓ uv is installed ({version})")
                return True
        except FileNotFoundError:
            logger.error("✗ uv not found. Install from: https://docs.astral.sh/uv/getting-started/installation/")
            logger.error("   Quick install: curl -LsSf https://astral.sh/uv/install.sh | sh")
            return False
        except subprocess.TimeoutExpired:
            logger.warning("⚠ uv command timed out")
            return False
        except Exception as e:
            logger.error(f"✗ Error checking uv: {e}")
            return False

    def check_ollama(self) -> bool:
        """Check if Ollama is installed and running."""
        try:
            result = subprocess.run(
                ["ollama", "list"],
                capture_output=True,
                timeout=5
            )
            if result.returncode == 0:
                logger.info("✓ Ollama is installed")

                # Check if Ollama server is running
                import requests
                try:
                    response = requests.get("http://localhost:11434/api/tags", timeout=2)
                    if response.status_code == 200:
                        logger.info("✓ Ollama server is running")

                        # Check for code models
                        models = result.stdout.decode()
                        if any(model in models.lower() for model in ["codellama", "llama3", "deepseek"]):
                            logger.info("✓ Code model found")
                        else:
                            logger.warning("⚠ No code model found. Run: ollama pull codellama")
                    else:
                        logger.warning("⚠ Ollama server not responding")
                except requests.RequestException:
                    logger.warning("⚠ Ollama server not running. Start with: ollama serve")

                return True
        except FileNotFoundError:
            logger.error("✗ Ollama not found. Install from: https://ollama.ai")
            return False
        except subprocess.TimeoutExpired:
            logger.warning("⚠ Ollama command timed out")
            return False
        except Exception as e:
            logger.error(f"✗ Error checking Ollama: {e}")
            return False

    def create_directories(self) -> None:
        """Create necessary directories."""
        directories = [
            self.docs_path,
            self.docs_path / "docs",
            self.docs_path / "src",
            self.chroma_path
        ]

        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            logger.info(f"✓ Created directory: {directory}")

    def create_default_config(self) -> None:
        """Create default config.yaml if it doesn't exist."""
        if self.config_path.exists():
            logger.info(f"✓ Config file exists: {self.config_path}")
            return

        default_config = f"""# RAG Code Assistant Configuration

# API Keys
api_keys:
  anthropic_api_key: null  # Set your Claude API key here or leave null

# Paths
paths:
  docs_path: "{self.docs_path}"
  chroma_db_path: "{self.chroma_path}"

# Embedding Model
embedding:
  model: "sentence-transformers/all-MiniLM-L6-v2"
  device: "cpu"

# Text Splitting
chunking:
  chunk_size: 1000
  chunk_overlap: 200

# Retrieval
retrieval:
  top_k: 5

# LLM Settings
llm:
  default: "ollama"
  
  ollama:
    model: "codellama"
    base_url: "http://localhost:11434"
    temperature: 0.1
  
  claude:
    model: "claude-sonnet-4-20250514"
    temperature: 0.1
    max_tokens: 4096

# API Server Settings
api:
  host: "0.0.0.0"
  port: 8000
  cors_origins:
    - "http://localhost:3000"
    - "http://127.0.0.1:3000"
  reload: true

# Logging
logging:
  level: "INFO"

# Ingestion Settings
ingestion:
  supported_file_types:
    documentation:
      - ".md"
      - ".pdf"
      - ".txt"
    code:
      - ".ts"
      - ".js"
      - ".tsx"
      - ".jsx"
      - ".html"
      - ".css"
      - ".scss"
  
  auto_ingest_on_startup: false
"""

        with open(self.config_path, 'w') as f:
            f.write(default_config)

        logger.info(f"✓ Created config file: {self.config_path}")

    def install_dependencies(self) -> bool:
        """Install required dependencies using uv."""
        try:
            logger.info("Installing dependencies with uv...")
            result = subprocess.run(
                ["uv", "pip", "install", "-e", "."],
                cwd=self.root_dir,
                capture_output=True,
                text=True
            )

            if result.returncode == 0:
                logger.info("✓ Dependencies installed")
                return True
            else:
                logger.error(f"✗ Failed to install dependencies: {result.stderr}")
                return False

        except Exception as e:
            logger.error(f"✗ Error installing dependencies: {e}")
            return False

    def check_dependencies(self) -> bool:
        """Check if required packages are installed."""
        required_packages = [
            "langchain",
            "fastapi",
            "chromadb",
            "sentence_transformers",
            "pyyaml",
            "typer",
            "rich"
        ]

        missing = []
        for package in required_packages:
            try:
                __import__(package.replace("-", "_"))
            except ImportError:
                missing.append(package)

        if missing:
            logger.warning(f"⚠ Missing packages: {', '.join(missing)}")
            return False

        logger.info("✓ All required packages installed")
        return True

    def run_setup(self, auto_install: bool = True) -> bool:
        """
        Run the complete setup process.

        Args:
            auto_install: If True, automatically install dependencies

        Returns:
            True if setup successful, False otherwise
        """
        logger.info("=" * 60)
        logger.info("Tell Me Why - RAG Code Assistant Setup")
        logger.info("=" * 60)
        logger.info("")

        # Check Python version
        if not self.check_python_version():
            return False

        # Check uv
        if not self.check_uv():
            logger.error("\nPlease install uv before continuing.")
            logger.error("Installation instructions: https://docs.astral.sh/uv/getting-started/installation/")
            return False

        # Check Ollama
        self.check_ollama()  # Non-blocking

        # Create directories
        logger.info("\nCreating directories...")
        self.create_directories()

        # Create config file
        logger.info("\nSetting up configuration...")
        self.create_default_config()

        # Check/install dependencies
        logger.info("\nChecking dependencies...")
        if not self.check_dependencies():
            if auto_install:
                logger.info("Attempting to install missing dependencies...")
                if not self.install_dependencies():
                    logger.error("Failed to install dependencies")
                    return False
            else:
                logger.error("Please install dependencies: uv pip install -e .")
                return False

        logger.info("\n" + "=" * 60)
        logger.info("✓ Setup Complete!")
        logger.info("=" * 60)
        logger.info("")
        logger.info("Next steps:")
        logger.info("")
        logger.info("1. Add your documents to:")
        logger.info(f"   {self.docs_path}")
        logger.info("")
        logger.info("2. Edit config.yaml if needed:")
        logger.info(f"   {self.config_path}")
        logger.info("")
        logger.info("3. Ingest documents:")
        logger.info("   tmw ingest")
        logger.info("")
        logger.info("4. Start the API:")
        logger.info("   tmw start")
        logger.info("")
        logger.info("Or use: tmw --help for all commands")
        logger.info("")

        return True


# Export main components
__all__ = [
    "SetupManager",
    "__version__",
    "__author__",
]
