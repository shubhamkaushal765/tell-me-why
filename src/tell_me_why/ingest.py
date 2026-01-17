"""
Document ingestion script for the RAG system.
Loads documents from the specified directory, processes them, and stores in ChromaDB.
"""
import logging
from pathlib import Path
from typing import List, Dict, Set

from langchain_community.document_loaders import (
    TextLoader,
    UnstructuredMarkdownLoader,
    PyPDFLoader,
)
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
    Language,
)

from .config import get_settings, validate_settings

# Setup logging
settings = get_settings()
logging.basicConfig(
    level=settings.logging.level,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class DocumentIngestor:
    """Handles document loading, splitting, and ingestion into vector store."""

    # Map file extensions to language-aware splitters
    LANGUAGE_SPLITTER_MAP = {
        # JavaScript/TypeScript
        '.js': Language.JS,
        '.jsx': Language.JS,
        '.ts': Language.TS,
        '.tsx': Language.TS,
        '.mjs': Language.JS,
        '.cjs': Language.JS,

        # Python
        '.py': Language.PYTHON,
        '.pyx': Language.PYTHON,
        '.pyi': Language.PYTHON,

        # Rust
        '.rs': Language.RUST,

        # C#
        '.cs': Language.CSHARP,
        '.csx': Language.CSHARP,

        # Java and JVM
        '.java': Language.JAVA,
        '.kt': Language.KOTLIN,
        '.scala': Language.SCALA,

        # C/C++
        '.c': Language.C,
        '.cpp': Language.CPP,
        '.cc': Language.CPP,
        '.cxx': Language.CPP,
        '.h': Language.CPP,
        '.hpp': Language.CPP,
        '.hxx': Language.CPP,

        # Go
        '.go': Language.GO,

        # Ruby
        '.rb': Language.RUBY,

        # PHP
        '.php': Language.PHP,

        # HTML/Markdown
        '.html': Language.HTML,
        '.md': Language.MARKDOWN,
        '.rst': Language.RST,

        # Lua
        '.lua': Language.LUA,

        # Haskell
        '.hs': Language.HASKELL,

        # Swift
        '.swift': Language.SWIFT,

        # Perl
        '.pl': Language.PERL,
    }

    def __init__(self):
        """Initialize the document ingestor with embeddings and vector store."""
        logger.info("Initializing DocumentIngestor...")

        settings = get_settings()

        # Initialize embeddings (local HuggingFace model)
        logger.info(f"Loading embedding model: {settings.embedding.model}")
        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.embedding.model,
            model_kwargs={'device': settings.embedding.device},
            encode_kwargs={'normalize_embeddings': True}
        )

        # Initialize text splitters
        self.doc_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunking.chunk_size,
            chunk_overlap=settings.chunking.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )

        # Cache for language-specific splitters
        self.language_splitters: Dict[Language, RecursiveCharacterTextSplitter] = {}

    def get_language_splitter(self, language: Language) -> RecursiveCharacterTextSplitter:
        """Get or create a language-specific splitter."""
        if language not in self.language_splitters:
            settings = get_settings()
            self.language_splitters[language] = RecursiveCharacterTextSplitter.from_language(
                language=language,
                chunk_size=settings.chunking.chunk_size,
                chunk_overlap=settings.chunking.chunk_overlap,
            )
        return self.language_splitters[language]

    def get_all_supported_extensions(self) -> Set[str]:
        """Get all supported file extensions from config."""
        settings = get_settings()
        extensions = set()
        for category, exts in settings.ingestion.supported_file_types.items():
            extensions.update(exts)
        return extensions

    def categorize_file(self, file_path: Path) -> Dict[str, str]:
        """Determine file category and type based on extension."""
        settings = get_settings()
        ext = file_path.suffix.lower()

        for category, extensions in settings.ingestion.supported_file_types.items():
            if ext in extensions:
                return {
                    "category": category,
                    "extension": ext,
                    "is_code": category not in ["documentation", "data"],
                    "is_documentation": category == "documentation"
                }

        return {
            "category": "unknown",
            "extension": ext,
            "is_code": False,
            "is_documentation": False
        }

    def load_single_file(self, file_path: Path) -> List[Document]:
        """Load a single file based on its type."""
        file_info = self.categorize_file(file_path)
        ext = file_info["extension"]

        try:
            # Special handling for specific file types
            if ext == ".md":
                loader = UnstructuredMarkdownLoader(str(file_path))
            elif ext == ".pdf":
                loader = PyPDFLoader(str(file_path))
            else:
                # Default to TextLoader for all other files
                loader = TextLoader(str(file_path), encoding="utf-8")

            docs = loader.load()

            # Add metadata to each document
            for doc in docs:
                doc.metadata["source_type"] = "code" if file_info["is_code"] else "documentation"
                doc.metadata["file_type"] = ext.lstrip(".")
                doc.metadata["category"] = file_info["category"]
                doc.metadata["source_file"] = str(file_path)

                # Add language metadata if it's a code file
                if ext in self.LANGUAGE_SPLITTER_MAP:
                    doc.metadata["language"] = self.LANGUAGE_SPLITTER_MAP[ext].value

            return docs

        except Exception as e:
            logger.error(f"Error loading {file_path}: {e}")
            return []

    def load_documents(self, path: Path) -> List[Document]:
        """Load documents from various file types in the specified path."""
        documents = []
        supported_extensions = self.get_all_supported_extensions()

        logger.info(f"Scanning directory: {path}")
        logger.info(f"Supporting {len(supported_extensions)} file types")

        # Collect all files with supported extensions
        files_by_category = {}

        for ext in supported_extensions:
            matching_files = list(path.rglob(f"*{ext}"))
            if matching_files:
                # Categorize files
                for file_path in matching_files:
                    file_info = self.categorize_file(file_path)
                    category = file_info["category"]

                    if category not in files_by_category:
                        files_by_category[category] = []
                    files_by_category[category].append(file_path)

        # Load files by category
        for category, files in sorted(files_by_category.items()):
            logger.info(f"Loading {len(files)} {category} files...")

            for file_path in files:
                docs = self.load_single_file(file_path)
                documents.extend(docs)

        logger.info(
            f"Loaded {len(documents)} documents total from {sum(len(f) for f in files_by_category.values())} files")
        return documents

    def split_documents(self, documents: List[Document]) -> List[Document]:
        """Split documents using appropriate splitters based on file type."""
        logger.info("Splitting documents into chunks...")

        all_chunks = []

        for doc in documents:
            ext = doc.metadata.get("file_type", "")
            if ext and not ext.startswith('.'):
                ext = f".{ext}"

            try:
                # Use language-specific splitter if available
                if ext in self.LANGUAGE_SPLITTER_MAP:
                    language = self.LANGUAGE_SPLITTER_MAP[ext]
                    splitter = self.get_language_splitter(language)
                    chunks = splitter.split_documents([doc])
                else:
                    # Use default splitter
                    chunks = self.doc_splitter.split_documents([doc])

                all_chunks.extend(chunks)
            except Exception as e:
                logger.error(f"Error splitting document {doc.metadata.get('source', 'unknown')}: {e}")
                # Fallback to default splitter
                try:
                    chunks = self.doc_splitter.split_documents([doc])
                    all_chunks.extend(chunks)
                except Exception as e2:
                    logger.error(f"Fallback splitting also failed: {e2}")

        logger.info(f"Created {len(all_chunks)} chunks from {len(documents)} documents")
        return all_chunks

    def ingest_to_vectorstore(self, documents: List[Document]) -> Chroma:
        """Ingest document chunks into ChromaDB vector store."""
        logger.info("Ingesting documents into vector store...")

        settings = get_settings()

        # Create or load vector store
        vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory=str(settings.paths.chroma_db_path),
            collection_name="code_docs"
        )

        logger.info(f"✓ Successfully ingested {len(documents)} chunks into ChromaDB")
        return vectorstore

    def run_ingestion(self) -> None:
        """Run the complete ingestion pipeline."""
        logger.info("=" * 60)
        logger.info("Starting document ingestion pipeline")
        logger.info("=" * 60)

        settings = get_settings()

        # Load documents
        documents = self.load_documents(settings.paths.docs_path)

        if not documents:
            logger.warning("No documents found to ingest!")
            return

        # Split documents
        chunks = self.split_documents(documents)

        if not chunks:
            logger.warning("No chunks created from documents!")
            return

        # Ingest to vector store
        self.ingest_to_vectorstore(chunks)

        logger.info("=" * 60)
        logger.info("✓ Ingestion complete!")
        logger.info("=" * 60)


def main():
    """Main entry point for the ingestion script."""
    try:
        # Validate settings
        validate_settings()

        # Run ingestion
        ingestor = DocumentIngestor()
        ingestor.run_ingestion()

    except Exception as e:
        logger.error(f"Ingestion failed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    main()
