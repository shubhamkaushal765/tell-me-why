"""
Document ingestion script for the RAG system.
Loads documents from the specified directory, processes them, and stores in ChromaDB.
"""
import logging
from pathlib import Path
from typing import List

from langchain.schema import Document
from langchain.text_splitter import (
    RecursiveCharacterTextSplitter,
    Language,
)
from langchain_community.document_loaders import (
    TextLoader,
    UnstructuredMarkdownLoader,
    PyPDFLoader,
)
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

from config import settings, validate_settings

# Setup logging
logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class DocumentIngestor:
    """Handles document loading, splitting, and ingestion into vector store."""

    def __init__(self):
        """Initialize the document ingestor with embeddings and vector store."""
        logger.info("Initializing DocumentIngestor...")

        # Initialize embeddings (local HuggingFace model)
        logger.info(f"Loading embedding model: {settings.embedding_model}")
        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.embedding_model,
            model_kwargs={'device': 'cpu'},  # Use 'cuda' if GPU available
            encode_kwargs={'normalize_embeddings': True}
        )

        # Initialize text splitters
        self.doc_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )

        # Code-aware splitter for TypeScript/Angular files
        self.code_splitter = RecursiveCharacterTextSplitter.from_language(
            language=Language.TS,
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
        )

        # HTML splitter for Angular templates
        self.html_splitter = RecursiveCharacterTextSplitter.from_language(
            language=Language.HTML,
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
        )

    def load_documents(self, path: Path) -> List[Document]:
        """Load documents from various file types in the specified path."""
        documents = []

        # Load Markdown files
        md_files = list(path.rglob("*.md"))
        if md_files:
            logger.info(f"Loading {len(md_files)} Markdown files...")
            for md_file in md_files:
                try:
                    loader = UnstructuredMarkdownLoader(str(md_file))
                    docs = loader.load()
                    for doc in docs:
                        doc.metadata["source_type"] = "documentation"
                        doc.metadata["file_type"] = "markdown"
                    documents.extend(docs)
                except Exception as e:
                    logger.error(f"Error loading {md_file}: {e}")

        # Load PDF files
        pdf_files = list(path.rglob("*.pdf"))
        if pdf_files:
            logger.info(f"Loading {len(pdf_files)} PDF files...")
            for pdf_file in pdf_files:
                try:
                    loader = PyPDFLoader(str(pdf_file))
                    docs = loader.load()
                    for doc in docs:
                        doc.metadata["source_type"] = "documentation"
                        doc.metadata["file_type"] = "pdf"
                    documents.extend(docs)
                except Exception as e:
                    logger.error(f"Error loading {pdf_file}: {e}")

        # Load TypeScript files
        ts_files = list(path.rglob("*.ts"))
        if ts_files:
            logger.info(f"Loading {len(ts_files)} TypeScript files...")
            for ts_file in ts_files:
                try:
                    loader = TextLoader(str(ts_file), encoding="utf-8")
                    docs = loader.load()
                    for doc in docs:
                        doc.metadata["source_type"] = "code"
                        doc.metadata["file_type"] = "typescript"
                        doc.metadata["language"] = "typescript"
                    documents.extend(docs)
                except Exception as e:
                    logger.error(f"Error loading {ts_file}: {e}")

        # Load HTML files (Angular templates)
        html_files = list(path.rglob("*.html"))
        if html_files:
            logger.info(f"Loading {len(html_files)} HTML files...")
            for html_file in html_files:
                try:
                    loader = TextLoader(str(html_file), encoding="utf-8")
                    docs = loader.load()
                    for doc in docs:
                        doc.metadata["source_type"] = "code"
                        doc.metadata["file_type"] = "html"
                        doc.metadata["language"] = "html"
                    documents.extend(docs)
                except Exception as e:
                    logger.error(f"Error loading {html_file}: {e}")

        # Load CSS/SCSS files
        css_files = list(path.rglob("*.css")) + list(path.rglob("*.scss"))
        if css_files:
            logger.info(f"Loading {len(css_files)} CSS/SCSS files...")
            for css_file in css_files:
                try:
                    loader = TextLoader(str(css_file), encoding="utf-8")
                    docs = loader.load()
                    for doc in docs:
                        doc.metadata["source_type"] = "code"
                        doc.metadata["file_type"] = "css"
                    documents.extend(docs)
                except Exception as e:
                    logger.error(f"Error loading {css_file}: {e}")

        logger.info(f"Loaded {len(documents)} documents total")
        return documents

    def split_documents(self, documents: List[Document]) -> List[Document]:
        """Split documents using appropriate splitters based on file type."""
        logger.info("Splitting documents into chunks...")

        all_chunks = []

        for doc in documents:
            file_type = doc.metadata.get("file_type", "")

            try:
                if file_type in ["typescript", "ts"]:
                    chunks = self.code_splitter.split_documents([doc])
                elif file_type == "html":
                    chunks = self.html_splitter.split_documents([doc])
                else:
                    chunks = self.doc_splitter.split_documents([doc])

                all_chunks.extend(chunks)
            except Exception as e:
                logger.error(f"Error splitting document {doc.metadata.get('source', 'unknown')}: {e}")

        logger.info(f"Created {len(all_chunks)} chunks from {len(documents)} documents")
        return all_chunks

    def ingest_to_vectorstore(self, documents: List[Document]) -> Chroma:
        """Ingest document chunks into ChromaDB vector store."""
        logger.info("Ingesting documents into vector store...")

        # Create or load vector store
        vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory=str(settings.chroma_db_path),
            collection_name="code_docs"
        )

        logger.info(f"✓ Successfully ingested {len(documents)} chunks into ChromaDB")
        return vectorstore

    def run_ingestion(self) -> None:
        """Run the complete ingestion pipeline."""
        logger.info("=" * 60)
        logger.info("Starting document ingestion pipeline")
        logger.info("=" * 60)

        # Load documents
        documents = self.load_documents(settings.docs_path)

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
