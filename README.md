# Tell Me Why - Privacy-Preserving RAG Code Assistant

A local-first RAG (Retrieval-Augmented Generation) system for Angular/React development that keeps your private
framework and codebase completely secure.

## 🔒 Privacy First

- **Local Processing**: Uses Ollama for fully private, on-device LLM inference
- **Local Embeddings**: HuggingFace sentence-transformers run on your machine
- **Local Vector Store**: ChromaDB stores all embeddings locally
- **Optional Cloud**: Claude API available for better performance (with privacy warnings)

## 🚀 Features

- **Code Generation**: Generate Angular/React components based on your framework
- **Code Debugging**: Analyze and fix code snippets with context awareness
- **Code Explanation**: Understand your codebase and documentation
- **RAG-Powered**: Retrieves relevant context from your private docs and code
- **REST API**: Easy integration with any frontend (Next.js, React, Angular)

## 📋 Prerequisites

### Required

- **Python 3.12+**
- **Ollama** (for local LLM)
  ```bash
  # Install Ollama: https://ollama.ai/download
  
  # Pull a code model (choose one):
  ollama pull codellama      # Meta's specialized code model (7B)
  ollama pull llama3        # General purpose, great for explanations (8B)
  ollama pull deepseek-coder # Excellent for code (6.7B)
  ```

### Optional

- **Anthropic API Key** (for Claude - better performance, but sends data to cloud)
    - Get key from: https://console.anthropic.com/
    - Only needed if you want to use Claude instead of Ollama

## 🛠️ Installation

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo>
cd tell-me-why

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e .
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Critical Configuration:**

```env
# Path to your private docs/code
DOCS_PATH=/path/to/your/private_angular_framework

# Default LLM (ollama = private, claude = cloud)
DEFAULT_LLM=ollama

# Only needed for Claude
ANTHROPIC_API_KEY=your_key_here
```

### 3. Organize Your Documents

Structure your documents directory like this:

```
/path/to/private_docs/
├── docs/                    # Documentation files
│   ├── architecture.md
│   ├── api-reference.pdf
│   └── best-practices.md
├── src/                     # Source code
│   ├── components/
│   │   ├── auth/
│   │   │   ├── login.component.ts
│   │   │   ├── login.component.html
│   │   │   └── login.component.css
│   │   └── shared/
│   └── services/
│       └── auth.service.ts
└── examples/                # Code examples
    └── sample-component.ts
```

**Supported file types:**

- Documentation: `.md`, `.pdf`, `.txt`
- Code: `.ts`, `.js`, `.html`, `.css`, `.scss`

### 4. Ingest Documents

Run the ingestion script to process and index your documents:

```bash
python ingest.py
```

**What this does:**

- Loads all documents from your configured path
- Splits them into chunks (code-aware splitting for TS/HTML)
- Generates embeddings using local HuggingFace model
- Stores in ChromaDB vector database

**Expected output:**

```
Loading 45 Markdown files...
Loading 12 PDF files...
Loading 234 TypeScript files...
Loading 187 HTML files...
Loaded 478 documents total
Splitting documents into chunks...
Created 2,341 chunks from 478 documents
Ingesting documents into vector store...
✓ Successfully ingested 2,341 chunks into ChromaDB
```

⏱️ **Time estimate**: ~5-10 minutes for 500 documents

## 🚀 Running the API

### Start the FastAPI Server

```bash
# Development mode (auto-reload)
python app.py

# Production mode
uvicorn app:app --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

### Verify It's Running

```bash
# Health check
curl http://localhost:8000/health

# Get statistics
curl http://localhost:8000/stats

# List available models
curl http://localhost:8000/models
```

## 📡 API Usage

### Query Endpoint

**POST** `/query`

Generate code, debug, or explain using your RAG system.

```bash
# Using Ollama (private, local)
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Generate an Angular component for user login with form validation",
    "llm_type": "ollama"
  }'

# Using Claude (cloud, better performance)
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Debug this code: export class MyComponent { constructor() { this.init() } }",
    "llm_type": "claude"
  }'
```

**Response:**

```json
{
  "answer": "Based on your framework, here's a login component...",
  "sources": [
    {
      "content": "// Relevant code snippet from your docs...",
      "metadata": {
        "source": "/path/to/file.ts",
        "source_type": "code",
        "file_type": "typescript"
      }
    }
  ],
  "llm_type": "ollama",
  "privacy_note": "Processed locally with Ollama - your code stayed private."
}
```

### Example Queries

```javascript
// Code Generation
{
  "query": "Generate an Angular component for user profile with image upload",
  "llm_type": "ollama"
}

// Debugging
{
  "query": "Debug this code: @Component({ selector: 'app-test' }) export class TestComponent { private data: string }",
  "llm_type": "claude"
}

// Explanation
{
  "query": "Explain how the authentication service handles token refresh",
  "llm_type": "ollama"
}

// Best Practices
{
  "query": "What's the best way to implement lazy loading in our framework?",
  "llm_type": "ollama"
}
```

### Ingestion Endpoint

**POST** `/ingest`

Update the vector store with new or modified documents.

```bash
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{"force_reingest": false}'
```

⚠️ **Note**: Runs in background. Check logs for progress.

## 🔧 Configuration Options

### Environment Variables

| Variable        | Default                    | Description                        |
|-----------------|----------------------------|------------------------------------|
| `DOCS_PATH`     | `/path/to/private_docs`    | Path to your documents             |
| `DEFAULT_LLM`   | `ollama`                   | Default LLM (`ollama` or `claude`) |
| `OLLAMA_MODEL`  | `codellama`                | Ollama model name                  |
| `CLAUDE_MODEL`  | `claude-sonnet-4-20250514` | Claude model                       |
| `CHUNK_SIZE`    | `1000`                     | Document chunk size                |
| `CHUNK_OVERLAP` | `200`                      | Chunk overlap for context          |
| `RETRIEVAL_K`   | `5`                        | Number of docs to retrieve         |

### Choosing an LLM

**Ollama (Recommended for Privacy)**

- ✅ Fully local - data never leaves your machine
- ✅ No API costs
- ✅ No internet required after model download
- ⚠️ Slower than Claude
- ⚠️ May have lower quality responses

**Claude**

- ✅ Higher quality responses
- ✅ Better at complex reasoning
- ✅ Faster responses
- ⚠️ Sends context to Anthropic servers
- ⚠️ Requires API key and costs money
- ⚠️ **Your private code is sent to the cloud**

**Recommendation**: Start with Ollama for privacy, use Claude only when you need the extra performance and understand
the privacy implications.

## 🎨 Next.js Integration

See [nextjs-outline.md](nextjs-outline.md) for detailed frontend integration guide.

**Quick Start:**

```typescript
// In your Next.js component
const response = await fetch('http://localhost:8000/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: userQuestion,
    llm_type: selectedModel  // 'ollama' or 'claude'
  })
});

const data = await response.json();
console.log(data.answer);
```

## 🐛 Troubleshooting

### Ollama Connection Error

```bash
# Check if Ollama is running
ollama list

# Start Ollama service
ollama serve

# Test model
ollama run codellama "Hello"
```

### ChromaDB Issues

```bash
# Clear and reingest
rm -rf ./chroma_db
python ingest.py
```

### Import Errors

```bash
# Reinstall dependencies
pip install -e . --force-reinstall
```

### No Documents Found

Check your `DOCS_PATH` in `.env`:

```bash
# Verify path exists
ls -la $DOCS_PATH

# Check for files
find $DOCS_PATH -type f \( -name "*.ts" -o -name "*.md" \)
```

## 📊 Monitoring

### View Logs

```bash
# Follow API logs
tail -f api.log

# View last 100 lines
tail -n 100 api.log
```

### Check Vector Store Stats

```bash
curl http://localhost:8000/stats
```

## 🔄 Updating Documents

When you add or modify documents:

```bash
# Re-run ingestion
python ingest.py

# Or use the API (runs in background)
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{"force_reingest": false}'
```

## 🚀 Production Deployment

### Using Docker (Recommended)

```dockerfile
# Dockerfile coming soon
```

### Using systemd

```bash
# Create service file
sudo nano /etc/systemd/system/rag-api.service
```

```ini
[Unit]
Description = RAG Code Assistant API
After = network.target

[Service]
Type = simple
User = your-user
WorkingDirectory = /path/to/tell-me-why
Environment = "PATH=/path/to/tell-me-why/venv/bin"
ExecStart = /path/to/tell-me-why/venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000
Restart = always

[Install]
WantedBy = multi-user.target
```

```bash
# Enable and start
sudo systemctl enable rag-api
sudo systemctl start rag-api
```

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📄 License

MIT License - See LICENSE file

## ⚠️ Privacy & Security Notice

- **Local Mode (Ollama)**: All processing happens on your machine. Your code never leaves your device.
- **Cloud Mode (Claude)**: Query context is sent to Anthropic's servers. Do not use for highly sensitive code without
  proper authorization.
- Always review your organization's data handling policies before using cloud services.
- Consider using Ollama exclusively for maximum privacy.

## 🆘 Support

- **Issues**: Open a GitHub issue
- **Docs**: See the [API documentation](http://localhost:8000/docs) when running
- **Ollama Help**: https://ollama.ai/
- **Claude API**: https://docs.anthropic.com/

---

**Built with ❤️ for privacy-conscious developers**