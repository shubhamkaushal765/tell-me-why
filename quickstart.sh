#!/bin/bash
# Quick start script for RAG Code Assistant

set -e  # Exit on error

echo "========================================="
echo "RAG Code Assistant - Quick Start"
echo "========================================="
echo ""

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
required_version="3.11"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python $required_version or higher is required. You have $python_version"
    exit 1
fi
echo "✓ Python $python_version"
echo ""

# Check if Ollama is installed
echo "Checking for Ollama..."
if command -v ollama &> /dev/null; then
    echo "✓ Ollama is installed"

    # Check if Ollama is running
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✓ Ollama is running"
    else
        echo "⚠ Ollama is installed but not running. Starting Ollama..."
        echo "Run: ollama serve &"
    fi

    # Check for code models
    echo "Checking for code models..."
    models=$(ollama list 2>/dev/null || echo "")
    if echo "$models" | grep -q "codellama\|llama3\|deepseek"; then
        echo "✓ Code model found"
    else
        echo "⚠ No code model found. Pulling codellama..."
        echo "Run: ollama pull codellama"
    fi
else
    echo "❌ Ollama not found. Please install from https://ollama.ai"
    exit 1
fi
echo ""

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment exists"
fi
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"
echo ""

# Install dependencies
echo "Installing dependencies..."
pip install -e . --quiet
echo "✓ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠ IMPORTANT: Edit .env and set your DOCS_PATH"
    echo "   Example: DOCS_PATH=/home/user/my_angular_project"
    echo ""
else
    echo "✓ .env file exists"
    echo ""
fi

# Check if DOCS_PATH is set
source .env
if [ -z "$DOCS_PATH" ] || [ "$DOCS_PATH" = "/path/to/private_docs" ]; then
    echo "⚠ WARNING: DOCS_PATH not configured in .env"
    echo "   Please edit .env and set DOCS_PATH to your documents directory"
    echo ""
else
    if [ -d "$DOCS_PATH" ]; then
        echo "✓ Documents path exists: $DOCS_PATH"
        echo ""
    else
        echo "❌ Documents path does not exist: $DOCS_PATH"
        echo "   Please create the directory or update DOCS_PATH in .env"
        exit 1
    fi
fi

echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Configure your .env file (if not already done):"
echo "   nano .env"
echo ""
echo "2. Ingest your documents:"
echo "   python ingest.py"
echo ""
echo "3. Start the API server:"
echo "   python app.py"
echo ""
echo "4. Test the API:"
echo "   curl http://localhost:8000/health"
echo ""
echo "For Next.js frontend setup, see nextjs-outline.md"
echo ""
echo "Happy coding! 🚀"