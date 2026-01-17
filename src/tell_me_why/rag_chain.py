"""
RAG chain implementation supporting both Ollama (local) and Claude (cloud) LLMs.
"""
import logging
from typing import Dict, Any, Literal

from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_anthropic import ChatAnthropic
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.llms import Ollama
from langchain_community.vectorstores import Chroma

from config import settings

logger = logging.getLogger(__name__)

# Custom prompt template for code assistance
PROMPT_TEMPLATE = """You are an expert Angular and React developer assistant with access to the company's private framework documentation and codebase.

Use the following context from company docs and code to answer the question. Be precise, follow Angular/React best practices, and provide code examples when appropriate.

Context:
{context}

Question: {question}

Answer: Let me help you with that based on the provided context."""


class RAGChain:
    """RAG chain for code generation, debugging, and explanation."""

    def __init__(self, llm_type: Literal["ollama", "claude"] = "ollama"):
        """
        Initialize the RAG chain with the specified LLM.

        Args:
            llm_type: Either "ollama" for local processing or "claude" for cloud-based
        """
        self.llm_type = llm_type

        # Initialize embeddings (same as used during ingestion)
        logger.info(f"Loading embedding model: {settings.embedding_model}")
        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.embedding_model,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )

        # Load vector store
        logger.info(f"Loading vector store from: {settings.chroma_db_path}")
        self.vectorstore = Chroma(
            persist_directory=str(settings.chroma_db_path),
            embedding_function=self.embeddings,
            collection_name="code_docs"
        )

        # Initialize LLM based on type
        self.llm = self._initialize_llm(llm_type)

        # Create prompt template
        self.prompt = PromptTemplate(
            template=PROMPT_TEMPLATE,
            input_variables=["context", "question"]
        )

        # Create retrieval chain
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vectorstore.as_retriever(
                search_kwargs={"k": settings.retrieval_k}
            ),
            chain_type_kwargs={"prompt": self.prompt},
            return_source_documents=True
        )

        logger.info(f"✓ RAG chain initialized with {llm_type} LLM")

    def _initialize_llm(self, llm_type: str):
        """Initialize the appropriate LLM based on type."""
        if llm_type == "ollama":
            logger.info(f"Initializing Ollama LLM: {settings.ollama_model}")
            return Ollama(
                model=settings.ollama_model,
                base_url=settings.ollama_base_url,
                temperature=0.1,  # Low temperature for code generation
            )

        elif llm_type == "claude":
            if not settings.anthropic_api_key:
                raise ValueError(
                    "ANTHROPIC_API_KEY not set. Please set it in your .env file to use Claude."
                )

            logger.warning(
                "⚠ WARNING: Using Claude API will send your private code context to Anthropic's servers. "
                "For complete privacy, use Ollama instead."
            )

            logger.info(f"Initializing Claude LLM: {settings.claude_model}")
            return ChatAnthropic(
                model=settings.claude_model,
                anthropic_api_key=settings.anthropic_api_key,
                temperature=0.1,
                max_tokens=4096,
            )

        else:
            raise ValueError(f"Unsupported LLM type: {llm_type}")

    def query(self, question: str) -> Dict[str, Any]:
        """
        Query the RAG chain with a question.

        Args:
            question: The user's question

        Returns:
            Dictionary containing the answer and source documents
        """
        logger.info(f"Processing query with {self.llm_type}: {question[:100]}...")

        try:
            # Run the chain
            result = self.qa_chain.invoke({"query": question})

            # Extract answer and sources
            answer = result.get("result", "")
            source_docs = result.get("source_documents", [])

            # Format source information
            sources = []
            for doc in source_docs:
                source_info = {
                    "content": doc.page_content[:200] + "...",  # First 200 chars
                    "metadata": doc.metadata
                }
                sources.append(source_info)

            response = {
                "answer": answer,
                "sources": sources,
                "llm_type": self.llm_type,
                "privacy_note": (
                    "Processed locally with Ollama - your code stayed private."
                    if self.llm_type == "ollama"
                    else "⚠ Processed with Claude API - context was sent to Anthropic servers."
                )
            }

            logger.info(f"✓ Query processed successfully, retrieved {len(sources)} sources")
            return response

        except Exception as e:
            logger.error(f"Error processing query: {e}", exc_info=True)
            raise

    def get_relevant_docs(self, question: str, k: int = None) -> list:
        """
        Retrieve relevant documents without running the full chain.
        Useful for debugging or custom workflows.

        Args:
            question: The search query
            k: Number of documents to retrieve (defaults to settings.retrieval_k)

        Returns:
            List of relevant documents
        """
        k = k or settings.retrieval_k
        docs = self.vectorstore.similarity_search(question, k=k)
        return docs


class RAGChainManager:
    """Manages multiple RAG chains for different LLM types."""

    def __init__(self):
        """Initialize the chain manager."""
        self.chains: Dict[str, RAGChain] = {}

    def get_chain(self, llm_type: Literal["ollama", "claude"]) -> RAGChain:
        """
        Get or create a RAG chain for the specified LLM type.
        Chains are cached for reuse.

        Args:
            llm_type: Either "ollama" or "claude"

        Returns:
            RAGChain instance
        """
        if llm_type not in self.chains:
            logger.info(f"Creating new RAG chain for {llm_type}")
            self.chains[llm_type] = RAGChain(llm_type=llm_type)

        return self.chains[llm_type]

    def query(self, question: str, llm_type: Literal["ollama", "claude"] = "ollama") -> Dict[str, Any]:
        """
        Query using the specified LLM type.

        Args:
            question: The user's question
            llm_type: Either "ollama" or "claude"

        Returns:
            Dictionary containing the answer and metadata
        """
        chain = self.get_chain(llm_type)
        return chain.query(question)


# Global chain manager instance
chain_manager = RAGChainManager()
