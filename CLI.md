# CLI Commands Reference

After installing the package with `pip install -e .`, you get access to convenient CLI commands for managing the RAG
system.

## 📦 Installation

```bash
# Navigate to project directory
cd tell-me-why

# Install in editable mode
pip install -e .

# Now all CLI commands are available globally!
```

## 🚀 Quick Start Commands

### `tell-me-why` - Complete Quick Start

Runs the full setup and immediately starts the API server.

```bash
tell-me-why
```

**What it does:**

1. ✅ Checks Python version
2. ✅ Verifies Ollama installation
3. ✅ Creates directories
4. ✅ Generates config.yaml
5. ✅ Installs dependencies
6. ✅ Starts the API server

**Use case:** First-time setup or when you want everything in one command.

---

### `tmw-setup` - Setup Only

Runs the setup process without starting the server.

```bash
tmw-setup
```

**What it does:**

- Same as `tell-me-why` but stops after setup
- Doesn't start the API server
- Gives you a chance to configure before starting

**Use case:** When you want to edit `config.yaml` before starting.

**Example workflow:**

```bash
tmw-setup                    # Run setup
nano config.yaml             # Edit configuration
tmw-ingest                   # Ingest documents
tmw-start                    # Start API
```

---

## 🎯 Main Commands

### `tmw-start` - Start API Server

Starts the FastAPI server.

```bash
tmw-start
```

**Options:**

- Reads configuration from `config.yaml`
- Supports auto-reload in development mode
- Runs on configured host:port (default: 0.0.0.0:8000)

**Use case:** Start the API after setup and ingestion.

**Access:**

- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

### `tmw-ingest` - Ingest Documents

Processes and indexes your documents into the vector store.

```bash
tmw-ingest
```

**What it does:**

1. Loads documents from `paths.docs_path` (config.yaml)
2. Splits them using code-aware chunkers
3. Generates embeddings (local HuggingFace model)
4. Stores in ChromaDB vector database

**When to run:**

- First time setup (after `tmw-setup`)
- When you add new documents
- When you modify existing documents
- When you change chunking settings

**Example:**

```bash
# Add new documents
cp -r /path/to/new/docs private_docs/docs/

# Re-ingest
tmw-ingest
```

---

### `tmw-test` - Run API Tests

Runs the API test suite to verify everything is working.

```bash
tmw-test
```

**What it tests:**

- ✅ Health check endpoint
- ✅ Stats endpoint
- ✅ Models endpoint
- ✅ Query functionality (Ollama)
- ✅ Query functionality (Claude, if configured)

**Requirements:**

- API server must be running (`tmw-start` in another terminal)
- Or the test will start and stop the server automatically

**Example output:**

```
============================================================
  RAG Code Assistant - API Test Suite
============================================================

============================================================
  Testing Health Endpoint
============================================================
Status: healthy
Version: 0.1.0
✓ Health check passed

✓ PASS - Health Check
✓ PASS - Stats Check
✓ PASS - Models Check
✓ PASS - Query Test (Ollama)

Overall: 4/4 tests passed
```

---

## 🔄 Alternative Command Names

Some commands have aliases for convenience:

### `rag-setup` (alias for `tmw-setup`)

```bash
rag-setup
```

### `rag-serve` (alias for `tmw-start`)

```bash
rag-serve
```

---

## 💡 Common Workflows

### First-Time Setup

```bash
# Option 1: All-in-one
tell-me-why

# Option 2: Step-by-step
tmw-setup                    # Setup
cp -r /path/to/docs private_docs/  # Add documents
tmw-ingest                   # Ingest
tmw-start                    # Start API
```

### Daily Development

```bash
# Terminal 1: Start API with auto-reload
tmw-start

# Terminal 2: Run tests
tmw-test

# Terminal 3: Work on your code
code .
```

### Adding New Documents

```bash
# 1. Copy documents
cp -r /path/to/new/docs private_docs/

# 2. Re-ingest
tmw-ingest

# 3. Restart API (if running)
# Kill with Ctrl+C, then:
tmw-start
```

### Configuration Updates

```bash
# 1. Edit config
nano config.yaml

# 2. Restart API
tmw-start

# Or use the API to update config without restart:
curl -X PUT http://localhost:8000/config \
  -H "Content-Type: application/json" \
  -d '{"llm": {"default": "claude"}}'
```

### Testing After Changes

```bash
# In one terminal
tmw-start

# In another terminal
tmw-test
```

---

## 🐛 Troubleshooting

### Command Not Found

```bash
# Make sure you installed with -e flag
pip install -e .

# Verify installation
pip show tell-me-why

# Check if commands are available
which tmw-start
```

### Import Errors

```bash
# Reinstall the package
pip install -e . --force-reinstall

# Clear Python cache
find . -type d -name __pycache__ -exec rm -rf {} +
```

### Port Already in Use

```bash
# Check what's using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or change port in config.yaml
nano config.yaml
# Edit: api.port: 8001

# Then restart
tmw-start
```

---

## 🔧 Advanced Usage

### Running with Custom Config

```bash
# Currently config.yaml is read from current directory
# To use a different config:
cd /path/to/different/config
tmw-start
```

### Development Mode

```bash
# Enable auto-reload (already default in config.yaml)
# Edit config.yaml:
api:
  reload: true

# Start
tmw-start
```

### Production Mode

```bash
# Disable auto-reload
# Edit config.yaml:
api:
  reload: false
  
# Use a process manager
# Install gunicorn
pip install gunicorn

# Run with gunicorn
gunicorn tell_me_why.app:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

---

## 📊 Command Comparison

| Command       | What It Does      | When to Use                |
|---------------|-------------------|----------------------------|
| `tell-me-why` | Setup + Start API | First time, quick start    |
| `tmw-setup`   | Setup only        | Before editing config      |
| `tmw-start`   | Start API         | After setup, daily dev     |
| `tmw-ingest`  | Index documents   | After adding/changing docs |
| `tmw-test`    | Run tests         | Verify everything works    |
| `rag-setup`   | Same as tmw-setup | Alternative name           |
| `rag-serve`   | Same as tmw-start | Alternative name           |

---

## 🎯 Quick Reference Card

```bash
# SETUP
tmw-setup              # Initial setup
tell-me-why           # Setup + start (all-in-one)

# OPERATIONS  
tmw-ingest            # Process documents
tmw-start             # Start API server
tmw-test              # Run tests

# DEVELOPMENT
tmw-start             # Start with auto-reload
# Edit code, server restarts automatically

# PRODUCTION
# Edit config.yaml: api.reload = false
tmw-start             # Start without auto-reload
```

---

## 📝 Environment Variables

While the system uses `config.yaml`, you can override settings with environment variables:

```bash
# Override API port
export API_PORT=8001
tmw-start

# Override log level  
export LOG_LEVEL=DEBUG
tmw-start
```

Note: `config.yaml` takes precedence over environment variables.

---

## 🔗 Related Documentation

- **Setup Guide**: `SETUP.md` - Detailed setup instructions
- **Configuration**: `config.yaml` - Main configuration file
- **API Reference**: `http://localhost:8000/docs` - Interactive API docs
- **Config UI**: `CONFIG_UI_EXAMPLES.md` - UI examples for config management

---

## ❓ FAQ

**Q: Can I run commands from any directory?**  
A: Commands are global after `pip install -e .`, but they read `config.yaml` from the current directory.

**Q: How do I uninstall the CLI commands?**  
A: `pip uninstall tell-me-why`

**Q: Can I customize command names?**  
A: Yes, edit `[project.scripts]` in `pyproject.toml` and reinstall.

**Q: Do I need to be in a virtual environment?**  
A: Recommended but not required. Install in a venv to avoid conflicts.

---

**Happy coding!** 🚀

For more help, run `tmw-start` and visit `http://localhost:8000/docs`