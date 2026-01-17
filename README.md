# Tell Me Why

Local RAG code assistant that actually keeps your code private.

Works with Python, Rust, C#, Java, JS/TS, Go, and many others.

### Quick Commands

```bash
tmw setup           # first-time setup
tmw ingest          # index your code/docs
tmw start           # run the API
tmw quick-start     # setup + start in one go

# other commands
tmw test            # run API test suite
tmw config          # view or edit config.yaml
tmw version         # show version information

tmw <command> --help   # see options
```

### Privacy

- Everything runs locally by default (Ollama + sentence-transformers + Chroma)
- Your code & docs never leave your machine unless you explicitly choose Claude

### What it can do

- Generate code / components that fit your existing style
- Debug & suggest fixes with real context
- Explain parts of your codebase
- Answer architecture / best-practice questions

### Minimal Setup (≈ 5 min)

1. Clone & install

```bash
git clone <repo>
cd tell-me-why

# Create virtual environment + install dependencies in one command
uv venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
uv pip install -e .
```

2. Copy & edit `config.yaml`

```bash
tmw config --edit
```

3. Install & prepare Ollama

Download and install Ollama from: https://ollama.com/download

After installation:

```bash
# See what models you already have (if any)
ollama list

# Download a good code model (pick one or more)
ollama pull codellama     # Meta's code model (~7B)
# or
ollama pull deepseek-coder  # Often better for coding tasks
# or
ollama pull llama3.1        # Very capable general model
```

Most Operating Systems start the Ollama server automatically after install.  
If your client says "cannot connect to Ollama", run this in a separate terminal:

```bash
ollama serve
```

4. Index your files

```bash
tmw ingest
```

5. Start the server

```bash
# Ollama should be running + model downloaded
tmw start
```

API → http://localhost:8000  
Logs → `./tmw.log`

### Two LLM choices

**ollama** (default)  
→ private, free, slower, good enough for most tasks  
Recommended models: codellama, deepseek-coder, llama3

**claude**  
→ smarter & faster, but sends context to Anthropic  
Only use if privacy is not critical

### Updating code/docs

Just run `tmw ingest` again (or hit `/ingest` endpoint)

### Troubleshooting one-liners

```bash
ollama list                # which models are downloaded?
ollama pull deepseek-coder # download / update a model if needed

# Only if connection fails — check if server is actually running
ollama serve               # (usually not needed — starts automatically)

rm -rf chroma_db           # fresh vector DB start (then re-ingest)
tail -f tmw.log            # watch logs
curl http://localhost:8000/stats
```

MIT license • built for people who don't want their code on someone else's server

