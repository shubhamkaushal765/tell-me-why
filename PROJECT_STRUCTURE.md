# Project Structure

This document explains the organization and purpose of each file in the RAG Code Assistant project.

## 📁 Directory Tree

```
tell-me-why/
├── src/tell_me_why/
│   ├── __init__.py                 
│   ├── app.py                  # Main FastAPI application
│   ├── config.py               # Configuration management
│   ├── ingest.py               # Document ingestion script
│   └── rag_chain.py            # RAG chain implementation
│
├── tests/
│   └── test_api.py             # API testing script
│
├── pyproject.toml              # Python project metadata and dependencies
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
│
├── README.md                   # Main documentation
├── nextjs-outline.md           # Next.js frontend guide
├── DOCKER.md                   # Docker deployment guide
├── PROJECT_STRUCTURE.md        # This file
├── LICENSE                     # MIT License
│
├── Dockerfile                  # Container image definition
├── docker-compose.yml          # Multi-container orchestration
├── quickstart.sh               # Quick setup script
│
├── chroma_db/                  # Vector database (created during ingestion)
│   └── [auto-generated]
│
└── private_docs/               # Your private documentation (not in repo)
    ├── docs/                   # Documentation files
    │   ├── *.md
    │   └── *.pdf
    └── src/                    # Source code
        ├── *.ts
        ├── *.html
        └── *.css
```

## 📄 Core Files

### `app.py` - FastAPI Application

**Purpose**: Main API server that handles HTTP requests

**Key Components**:

- `QueryRequest` / `QueryResponse`: Pydantic models for type safety
- `@app.post("/query")`: Main endpoint for RAG queries
- `@app.post("/ingest")`: Endpoint to trigger document ingestion
- `@app.get("/stats")`: System statistics
- `@app.get("/models")`: List available LLM models
- CORS middleware for Next.js integration

**Dependencies**: FastAPI, Uvicorn, rag_chain, config

### `config.py` - Configuration Management

**Purpose**: Centralized configuration using Pydantic settings

**Key Components**:

- `Settings` class: Loads config from environment variables
- `validate_settings()`: Validates paths and dependencies
- Default values for all parameters

**Environment Variables**:

- Paths (docs, vector DB)
- LLM settings (Ollama, Claude)
- API configuration
- Chunking parameters

### `ingest.py` - Document Ingestion

**Purpose**: Processes and indexes documents into the vector store

**Key Components**:

- `DocumentIngestor` class: Manages entire ingestion pipeline
- `load_documents()`: Loads various file types (.md, .pdf, .ts, .html, .css)
- `split_documents()`: Code-aware chunking for different file types
- `ingest_to_vectorstore()`: Stores embeddings in ChromaDB

**Supported File Types**:

- Documentation: Markdown, PDF
- Code: TypeScript, HTML, CSS/SCSS
- Uses different splitters for code vs. docs

### `rag_chain.py` - RAG Implementation

**Purpose**: Core RAG logic with LLM integration

**Key Components**:

- `RAGChain` class: Single RAG chain for one LLM type
- `RAGChainManager` class: Manages multiple chains (caching)
- `query()`: Main method to run RAG queries
- `_initialize_llm()`: Sets up Ollama or Claude

**Features**:

- Retrieves top K relevant documents
- Uses custom prompt template for code assistance
- Returns answer + source documents
- Privacy warnings for cloud models

## 🔧 Configuration Files

### `pyproject.toml` - Python Project Definition

**Purpose**: Modern Python packaging standard

**Contains**:

- Project metadata (name, version, description)
- Python version requirement (>=3.11)
- All dependencies with version constraints
- Dev dependencies (pytest, black, ruff)
- Tool configurations (black, ruff)

**Usage**:

```bash
pip install -e .  # Installs project + dependencies
```

### `requirements.txt` - Pip Dependencies

**Purpose**: Traditional dependency list (alternative to pyproject.toml)

**Usage**:

```bash
pip install -r requirements.txt
```

### `.env.example` - Environment Template

**Purpose**: Template for user configuration

**Critical Variables**:

- `DOCS_PATH`: Path to your private documents
- `ANTHROPIC_API_KEY`: Claude API key (optional)
- `DEFAULT_LLM`: Which model to use by default
- `OLLAMA_MODEL`: Local model name

**Setup**:

```bash
cp .env.example .env
nano .env  # Edit with your values
```

## 📚 Documentation Files

### `README.md` - Main Documentation

**Covers**:

- Overview and features
- Installation instructions
- Configuration guide
- API usage examples
- Troubleshooting

### `nextjs-outline.md` - Frontend Guide

**Covers**:

- Next.js project structure
- Component examples (full code)
- API integration patterns
- State management options
- Styling tips

### `DOCKER.md` - Deployment Guide

**Covers**:

- Docker build and run
- Docker Compose usage
- Production deployment
- Troubleshooting
- Monitoring

### `PROJECT_STRUCTURE.md` - This File

**Purpose**: Explains codebase organization

## 🧪 Testing & Scripts

### `test_api.py` - API Test Suite

**Purpose**: Automated testing of all endpoints

**Tests**:

- Health check
- Stats endpoint
- Models listing
- Query functionality (Ollama and Claude)
- Response time measurement

**Usage**:

```bash
python test_api.py
```

### `quickstart.sh` - Setup Script

**Purpose**: Automated setup for new users

**Does**:

- Checks Python version
- Verifies Ollama installation
- Creates virtual environment
- Installs dependencies
- Creates .env file
- Validates configuration

**Usage**:

## 🐳 Docker Files

### `Dockerfile` - Container Image

**Purpose**: Defines containerized environment

**Features**:

- Python 3.11 slim base
- All dependencies installed
- Volume mount points for docs and DB
- Health check endpoint
- Optimized for size

### `docker-compose.yml` - Multi-Container Setup

**Purpose**: Orchestrates API + Ollama services

**Services**:

- `rag-api`: The FastAPI backend
- `ollama`: Local LLM service
- Shared network
- Persistent volumes

**Usage**:

```bash
docker-compose up -d
```

## 📦 Generated Directories

### `chroma_db/` - Vector Database

**Created By**: `ingest.py`

**Contains**:

- Embeddings for all document chunks
- Metadata (file paths, types)
- ChromaDB internal files

**Size**: Varies based on document count (typically 100MB-1GB)

**Backup**: Can be tar.gz'd for backup/restore

### `venv/` - Virtual Environment

**Created By**: `python -m venv venv` or `quickstart.sh`

**Contains**:

- Python interpreter
- All installed packages
- Isolated from system Python

**Should NOT** be committed to Git

## 🔐 Security & Privacy

### `.gitignore` - Git Exclusions

**Excludes**:

- Virtual environments (`venv/`)
- Environment files (`.env`)
- Vector database (`chroma_db/`)
- Private documents (`private_docs/`)
- Python cache (`__pycache__/`)
- IDE files (`.vscode/`, `.idea/`)

**Purpose**: Prevents sensitive data from being committed

### `LICENSE` - MIT License

**Purpose**: Open source license

**Allows**:

- Commercial use
- Modification
- Distribution
- Private use

**Requires**:

- License and copyright notice

## 🔄 Data Flow

### Ingestion Flow

```
User Documents
    ↓
ingest.py loads files
    ↓
Files split into chunks (code-aware)
    ↓
Chunks embedded (HuggingFace local model)
    ↓
Embeddings stored in ChromaDB
```

### Query Flow

```
User Query (from Next.js or curl)
    ↓
FastAPI receives POST /query
    ↓
RAGChain retrieves relevant chunks
    ↓
Chunks sent to LLM (Ollama or Claude)
    ↓
LLM generates answer
    ↓
Response returned with sources
```

## 📊 File Responsibilities

| File           | Reads                   | Writes       | External Services  |
|----------------|-------------------------|--------------|--------------------|
| `config.py`    | `.env`                  | -            | -                  |
| `ingest.py`    | `private_docs/`, `.env` | `chroma_db/` | HuggingFace        |
| `rag_chain.py` | `.env`, `chroma_db/`    | -            | Ollama, Claude API |
| `app.py`       | `.env`, `chroma_db/`    | Logs         | Calls rag_chain.py |
| `test_api.py`  | -                       | Console      | API endpoints      |

## 🎯 Key Design Decisions

### 1. **Modular Architecture**

- Separate files for config, ingestion, RAG, and API
- Easier to test and maintain
- Can run ingestion independently

### 2. **Privacy First**

- Local embeddings (no external API calls)
- Local vector DB (ChromaDB)
- Ollama as default (fully local)
- Clear warnings when using cloud services

### 3. **Code-Aware Processing**

- Different splitters for code vs. docs
- Preserves code structure (functions, classes)
- Better context for TypeScript/Angular code

### 4. **Flexible LLM Support**

- Abstracted LLM interface
- Easy to add new providers
- Chain caching for performance

### 5. **Developer Experience**

- Clear documentation
- Automated setup script
- Comprehensive testing
- Example configurations

## 🚀 Extension Points

### Adding New File Types

Edit `ingest.py`:

```python
# In load_documents()
vue_files = list(path.rglob("*.vue"))
for vue_file in vue_files:
# Load and tag appropriately
```

### Adding New LLM Providers

Edit `rag_chain.py`:

```python
def _initialize_llm(self, llm_type: str):
    if llm_type == "your_provider":
        return YourProviderLLM(...)
```

### Adding New API Endpoints

Edit `app.py`:

```python
@app.post("/your-endpoint")
async def your_endpoint(request: YourRequest):
# Implementation
```

### Custom Prompt Templates

Edit `rag_chain.py`:

```python
PROMPT_TEMPLATE = """Your custom template..."""
```

## 📖 Learning Path

**For Beginners**:

1. Read `README.md`
2. Run `quickstart.sh`
3. Study `config.py` (simple, clear)
4. Look at `test_api.py` (shows how to use API)

**For Intermediate**:

1. Study `rag_chain.py` (core RAG logic)
2. Examine `ingest.py` (document processing)
3. Read `app.py` (API patterns)

**For Advanced**:

1. Modify prompt templates
2. Add custom document loaders
3. Implement new retrieval strategies
4. Optimize chunking for your use case

---

**Questions?** Check the README.md or open an issue on GitHub.