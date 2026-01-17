# tell-me-why

You are an expert in building AI-powered code assistants using LangChain, with a focus on privacy-preserving RAG systems
for code generation, debugging, and explanation. The user is a React and Angular developer with a private Angular
framework that cannot be shared online. They have two types of documents: code documentation (e.g., Markdown, PDFs) and
source code files (e.g., .ts, .html in a directory).

Generate a complete, working codebase for a local RAG setup that integrates LLMs (Claude API and local Ollama) to
perform:

- Code generation: Given a task, generate Angular code using the private framework.
- Debugging: Analyze and fix provided code snippets.
- Explanation: Explain parts of the code or docs.

The system must keep everything private: Use local embeddings (HuggingFace's sentence-transformers/all-MiniLM-L6-v2), a
local vector DB (Chroma), and ingest documents from a local directory (/path/to/private_docs/ with subfolders for docs
and code).

Key requirements:

- Use LangChain for RAG: Load docs, split into chunks (recursive splitter, chunk_size=1000, overlap=200; semantic for
  code), embed, store in Chroma.
- Support both LLMs: Local Ollama (e.g., llama3 or codellama) for fully private use, and Claude API (with privacy
  warning) for better performance.
- Custom prompt template: "Use the following context from company docs and code to answer. Be precise, use Angular/React
  best practices. Context: {context} Question: {question} Answer:"
- Retrieval: Top 5 relevant chunks.
- Examples: Queries like "Generate an Angular component for user login", "Debug this code: [snippet]", "Explain the auth
  module".

The user plans to build a Next.js frontend for this. Expose the backend as a REST API (use FastAPI for simplicity) with
endpoints:

- POST /ingest: Ingest/update documents into the vector store.
- POST /query: Accept a JSON body with { "query": "user question", "llm_type": "ollama" or "claude" }, retrieve relevant
  context, run the RAG chain, and return the response.
- Include API key handling for Claude if used.
- Make the API CORS-enabled for localhost Next.js (e.g., port 3000).
- Suggest a basic Next.js structure: Pages or app router with a form to input queries, select LLM, display responses;
  use fetch or axios for API calls.

Output the codebase as:

1. pyproject.toml for dependencies.
2. ingest.py: Script to ingest docs (run once).
3. app.py and other files for good project structure: FastAPI backend with API endpoints and RAG chain.
4. README.md: Setup instructions, including running Ollama, env vars (e.g., ANTHROPIC_API_KEY), and Next.js integration.
5. nextjs-outline.md: High-level outline for the Next.js frontend (components, pages, API integration; no full code,
   just structure and key snippets).

Ensure code is Python 3.11+, error-handled, and commented. For privacy, emphasize local Ollama as default. If using
Claude API, warn about sending context to servers.
