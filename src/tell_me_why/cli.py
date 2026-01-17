"""
Tell Me Why - CLI Interface

Main command-line interface using Click for all commands.
Provides a clean, modern CLI with help documentation and colored output.
"""
import sys
from pathlib import Path
from typing import Optional

import click
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

console = Console()


@click.group(
    name="tmw",
    help="Tell Me Why - Privacy-preserving RAG system for Angular/React code assistance",
    context_settings=dict(help_option_names=['-h', '--help']),
    invoke_without_command=True,
)
@click.pass_context
def app(ctx):
    """
    Tell Me Why - Privacy-preserving RAG system for Angular/React code assistance

    Use 'tmw COMMAND --help' for more information on a command.
    """
    if ctx.invoked_subcommand is None:
        click.echo(ctx.get_help())


@app.command("setup")
@click.option(
    "--auto-install/--no-auto-install",
    default=True,
    help="Automatically install missing dependencies"
)
@click.option(
    "--root-dir",
    "-r",
    type=click.Path(exists=False, file_okay=False, dir_okay=True, resolve_path=True, path_type=Path),
    default=None,
    help="Root directory of the project (defaults to current directory)",
)
def setup_command(root_dir: Optional[Path], auto_install: bool = True) -> None:
    """
    Setup the RAG Code Assistant.

    This command will:
    - Check Python version (3.11+ required)
    - Check if Ollama is installed and running
    - Create necessary directories
    - Generate default config.yaml
    - Install dependencies (if --auto-install)
    """
    from tell_me_why import SetupManager

    console.print(Panel.fit(
        "[bold cyan]Tell Me Why - RAG Code Assistant Setup[/bold cyan]",
        border_style="cyan"
    ))

    try:
        manager = SetupManager(root_dir)
        success = manager.run_setup(auto_install=auto_install)

        if success:
            console.print("\n[bold green]✓[/bold green] Setup completed successfully!", style="green")
            sys.exit(0)
        else:
            console.print("\n[bold red]✗[/bold red] Setup failed. Check ./tmw.log file for more details.", style="red")
    except KeyboardInterrupt:
        console.print("\n[yellow]Setup cancelled by user.[/yellow]")
        sys.exit(130)
    except Exception as e:
        console.print(f"\n[bold red]Error:[/bold red] {e}", style="red")
        console.print("[dim]Check ./tmw.log file for more details.[/dim]")
        sys.exit(1)


@app.command("start")
@click.option(
    "--host",
    "-h",
    type=str,
    default=None,
    help="Host to bind the API server (overrides config.yaml)"
)
@click.option(
    "--port",
    "-p",
    type=int,
    default=None,
    help="Port to bind the API server (overrides config.yaml)"
)
@click.option(
    "--reload/--no-reload",
    default=None,
    help="Enable auto-reload on code changes (overrides config.yaml)"
)
@click.option(
    "--log-level",
    "-l",
    type=str,
    default=None,
    help="Logging level: debug, info, warning, error, critical"
)
def start_command(
        host: Optional[str],
        port: Optional[int],
        reload: Optional[bool],
        log_level: Optional[str],
) -> None:
    """
    Start the FastAPI server for the RAG Code Assistant.

    The server provides REST API endpoints for:
    - Querying the RAG system
    - Managing document ingestion
    - Checking system health and statistics
    - Configuring LLM settings
    """
    import uvicorn
    from tell_me_why.config import get_settings

    console.print(Panel.fit(
        "[bold cyan]Starting RAG Code Assistant API Server[/bold cyan]",
        border_style="cyan"
    ))

    try:
        settings = get_settings()

        # Use command line arguments if provided, otherwise use config
        final_host = host if host is not None else settings.api.host
        final_port = port if port is not None else settings.api.port
        final_reload = reload if reload is not None else settings.api.reload
        final_log_level = (log_level if log_level is not None else settings.logging.level).lower()

        console.print(f"\n[cyan]Host:[/cyan] {final_host}")
        console.print(f"[cyan]Port:[/cyan] {final_port}")
        console.print(f"[cyan]Reload:[/cyan] {final_reload}")
        console.print(f"[cyan]Log Level:[/cyan] {final_log_level}")
        console.print(f"[cyan]Default LLM:[/cyan] {settings.llm.default}\n")

        console.print(f"[green]Server will be available at:[/green] http://{final_host}:{final_port}")
        console.print("[dim]Press CTRL+C to stop the server[/dim]\n")

        uvicorn.run(
            "tell_me_why.app:app",
            host=final_host,
            port=final_port,
            reload=final_reload,
            log_level=final_log_level
        )
    except KeyboardInterrupt:
        console.print("\n[yellow]Server stopped by user.[/yellow]")
        sys.exit(0)
    except Exception as e:
        console.print(f"\n[bold red]Error starting server:[/bold red] {e}", style="red")
        console.print("[dim]Check ./tmw.log file for more details.[/dim]")
        sys.exit(1)


@app.command("ingest")
@click.option(
    "--docs-path",
    "-d",
    type=click.Path(exists=True, file_okay=False, dir_okay=True, resolve_path=True, path_type=Path),
    default=None,
    help="Path to documents directory (overrides config.yaml)",
)
@click.option(
    "--force",
    "-f",
    is_flag=True,
    default=False,
    help="Force re-ingestion (clears existing vector store)"
)
def ingest_command(docs_path: Optional[Path], force: bool) -> None:
    """
    Ingest documents into the vector store.

    This command will:
    - Load documents from the specified directory
    - Process and split them into chunks
    - Generate embeddings using the local model
    - Store them in ChromaDB for retrieval

    Supported file types:
    - Documentation: .md, .pdf, .txt
    - Code: .ts, .js, .tsx, .jsx, .html, .css, .scss
    """
    from tell_me_why.ingest import DocumentIngestor
    from tell_me_why.config import get_settings, validate_settings
    import shutil

    console.print(Panel.fit(
        "[bold cyan]Document Ingestion Pipeline[/bold cyan]",
        border_style="cyan"
    ))

    try:
        # Validate settings
        validate_settings()
        settings = get_settings()

        # Use provided docs path or config
        final_docs_path = docs_path if docs_path is not None else settings.paths.docs_path

        console.print(f"\n[cyan]Documents Path:[/cyan] {final_docs_path}")
        console.print(f"[cyan]Vector Store:[/cyan] {settings.paths.chroma_db_path}")
        console.print(f"[cyan]Embedding Model:[/cyan] {settings.embedding.model}\n")

        # Handle force re-ingestion
        if force:
            if settings.paths.chroma_db_path.exists():
                console.print("[yellow]⚠ Force flag detected - clearing existing vector store...[/yellow]")
                if click.confirm("Are you sure you want to delete the existing vector store?"):
                    shutil.rmtree(settings.paths.chroma_db_path)
                    console.print("[green]✓[/green] Vector store cleared\n")
                else:
                    console.print("[yellow]Cancelled. Keeping existing vector store.[/yellow]")
                    sys.exit(0)

        # Run ingestion with progress
        with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console,
        ) as progress:
            task = progress.add_task("Ingesting documents...", total=None)

            ingestor = DocumentIngestor()

            # Update task for loading
            progress.update(task, description="Loading documents...")
            documents = ingestor.load_documents(final_docs_path)

            if not documents:
                progress.stop()
                console.print("[red]No documents found to ingest![/red]")
                console.print("[dim]Check ./tmw.log file for more details.[/dim]")
                sys.exit(1)

            # Update task for splitting
            progress.update(task, description=f"Splitting {len(documents)} documents...")
            chunks = ingestor.split_documents(documents)

            if not chunks:
                progress.stop()
                console.print("[red]No chunks created from documents![/red]")
                console.print("[dim]Check ./tmw.log file for more details.[/dim]")
                sys.exit(1)

            # Update task for ingestion
            progress.update(task, description=f"Ingesting {len(chunks)} chunks to vector store...")
            ingestor.ingest_to_vectorstore(chunks)

            progress.update(task, description="[green]✓ Ingestion complete!")

        console.print(
            f"\n[bold green]Success![/bold green] Ingested {len(chunks)} chunks from {len(documents)} documents")

    except KeyboardInterrupt:
        console.print("\n[yellow]Ingestion cancelled by user.[/yellow]")
        sys.exit(130)
    except Exception as e:
        console.print(f"\n[bold red]Ingestion failed:[/bold red] {e}", style="red")
        console.print("[dim]Check ./tmw.log file for more details.[/dim]")
        import traceback
        console.print(f"[dim]{traceback.format_exc()}[/dim]")
        sys.exit(1)


@app.command("test")
@click.option(
    "--url",
    "-u",
    type=str,
    default="http://localhost:8000",
    help="API base URL to test"
)
@click.option(
    "--skip-claude",
    is_flag=True,
    default=False,
    help="Skip Claude API tests even if available"
)
def test_command(url: str, skip_claude: bool) -> None:
    """
    Test the RAG Code Assistant API.

    Runs a comprehensive test suite including:
    - Health check
    - Statistics endpoint
    - Available models
    - Query endpoint (Ollama)
    - Query endpoint (Claude, if available)
    """
    import requests
    import time

    console.print(Panel.fit(
        "[bold cyan]RAG Code Assistant - API Test Suite[/bold cyan]",
        border_style="cyan"
    ))

    console.print(f"\n[cyan]Testing API at:[/cyan] {url}")
    console.print("[dim]Make sure the API is running (tmw start)[/dim]\n")

    if not click.confirm("Continue with tests?", default=True):
        console.print("[yellow]Tests cancelled.[/yellow]")
        sys.exit(0)

    results = {}

    # Test 1: Health Check
    console.print("\n[bold]1. Health Check[/bold]")
    try:
        response = requests.get(f"{url}/health", timeout=5)
        response.raise_for_status()
        data = response.json()
        console.print(f"  [green]✓[/green] Status: {data['status']}")
        console.print(f"  [green]✓[/green] Version: {data['version']}")
        console.print(f"  [green]✓[/green] Default LLM: {data['llm_default']}")
        results["Health Check"] = True
    except Exception as e:
        console.print(f"  [red]✗[/red] Failed: {e}")
        results["Health Check"] = False

    # Test 2: Stats
    console.print("\n[bold]2. Statistics[/bold]")
    try:
        response = requests.get(f"{url}/stats", timeout=5)
        response.raise_for_status()
        data = response.json()
        console.print(f"  [green]✓[/green] Documents: {data['vector_store']['total_documents']}")
        console.print(f"  [green]✓[/green] Embedding Model: {data['vector_store']['embedding_model']}")
        console.print(f"  [green]✓[/green] Default LLM: {data['llm']['default']}")
        results["Statistics"] = True
    except Exception as e:
        console.print(f"  [red]✗[/red] Failed: {e}")
        results["Statistics"] = False

    # Test 3: Models
    console.print("\n[bold]3. Available Models[/bold]")
    try:
        response = requests.get(f"{url}/models", timeout=5)
        response.raise_for_status()
        data = response.json()

        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("Model")
        table.add_column("Available")
        table.add_column("Details")

        for model_name, model_info in data['models'].items():
            status = "[green]✓[/green]" if model_info['available'] else "[red]✗[/red]"
            table.add_row(model_name, status, model_info['model'])

        console.print(table)
        results["Models"] = True
    except Exception as e:
        console.print(f"  [red]✗[/red] Failed: {e}")
        results["Models"] = False

    # Test 4: Query (Ollama)
    console.print("\n[bold]4. Query Test (Ollama)[/bold]")
    test_query = "Explain what TypeScript interfaces are."
    try:
        console.print(f"  Query: [dim]{test_query}[/dim]")
        console.print("  [dim]Waiting for response...[/dim]")

        start_time = time.time()
        response = requests.post(
            f"{url}/query",
            json={"query": test_query, "llm_type": "ollama"},
            timeout=120
        )
        elapsed = time.time() - start_time
        response.raise_for_status()
        data = response.json()

        console.print(f"  [green]✓[/green] Response time: {elapsed:.2f}s")
        console.print(f"  [green]✓[/green] Answer length: {len(data['answer'])} chars")
        console.print(f"  [green]✓[/green] Sources: {len(data['sources'])} documents")
        results["Query (Ollama)"] = True
    except requests.exceptions.Timeout:
        console.print("  [red]✗[/red] Timeout (Ollama may be slow or not running)")
        results["Query (Ollama)"] = False
    except Exception as e:
        console.print(f"  [red]✗[/red] Failed: {e}")
        results["Query (Ollama)"] = False

    # Test 5: Query (Claude) - Optional
    if not skip_claude:
        console.print("\n[bold]5. Query Test (Claude)[/bold]")
        try:
            # Check if Claude is available
            models_response = requests.get(f"{url}/models", timeout=5)
            if models_response.json()['models']['claude']['available']:
                console.print(f"  Query: [dim]{test_query}[/dim]")
                console.print("  [dim]Waiting for response...[/dim]")

                start_time = time.time()
                response = requests.post(
                    f"{url}/query",
                    json={"query": test_query, "llm_type": "claude"},
                    timeout=60
                )
                elapsed = time.time() - start_time
                response.raise_for_status()
                data = response.json()

                console.print(f"  [green]✓[/green] Response time: {elapsed:.2f}s")
                console.print(f"  [green]✓[/green] Answer length: {len(data['answer'])} chars")
                console.print(f"  [green]✓[/green] Sources: {len(data['sources'])} documents")
                results["Query (Claude)"] = True
            else:
                console.print("  [yellow]⊘[/yellow] Skipped (Claude API key not configured)")
                results["Query (Claude)"] = None
        except Exception as e:
            console.print(f"  [red]✗[/red] Failed: {e}")
            results["Query (Claude)"] = False

    # Summary
    console.print("\n" + "=" * 60)
    console.print("[bold]Test Summary[/bold]")
    console.print("=" * 60)

    passed = sum(1 for v in results.values() if v is True)
    failed = sum(1 for v in results.values() if v is False)
    skipped = sum(1 for v in results.values() if v is None)
    total = len(results)

    table = Table(show_header=True, header_style="bold")
    table.add_column("Test")
    table.add_column("Status")

    for test_name, result in results.items():
        if result is True:
            status = "[green]✓ PASS[/green]"
        elif result is False:
            status = "[red]✗ FAIL[/red]"
        else:
            status = "[yellow]⊘ SKIP[/yellow]"
        table.add_row(test_name, status)

    console.print(table)
    console.print(f"\n[bold]Results:[/bold] {passed} passed, {failed} failed, {skipped} skipped")

    if failed == 0:
        console.print("\n[bold green]🎉 All tests passed![/bold green]")
        sys.exit(0)
    else:
        console.print("\n[bold yellow]⚠ Some tests failed. Check the output above.[/bold yellow]")
        console.print("[dim]Check ./tmw.log file for more details.[/dim]")
        sys.exit(1)


@app.command("config")
@click.option(
    "--show",
    "-s",
    is_flag=True,
    default=False,
    help="Show current configuration"
)
@click.option(
    "--edit",
    "-e",
    is_flag=True,
    default=False,
    help="Open config file in default editor"
)
def config_command(show: bool, edit: bool) -> None:
    """
    Manage configuration settings.

    View or edit the config.yaml file that controls:
    - API keys (Anthropic)
    - File paths
    - LLM settings
    - Embedding model
    - Chunking parameters
    - API server settings
    """
    from tell_me_why.config import get_settings, config_manager
    import subprocess
    import os

    settings = get_settings()
    config_path = config_manager.config_path

    if edit:
        # Open in default editor
        console.print(f"[cyan]Opening config file:[/cyan] {config_path}")
        editor = os.environ.get('EDITOR', 'nano')
        try:
            subprocess.run([editor, str(config_path)])
            console.print("[green]✓[/green] Config file closed")
        except Exception as e:
            console.print(f"[red]Error opening editor:[/red] {e}")
            console.print(f"[dim]You can manually edit: {config_path}[/dim]")
            console.print("[dim]Check ./tmw.log file for more details.[/dim]")
            sys.exit(1)
    elif show:
        # Display current config
        import yaml
        console.print(Panel.fit(
            "[bold cyan]Current Configuration[/bold cyan]",
            border_style="cyan"
        ))
        console.print(f"\n[cyan]Config file:[/cyan] {config_path}\n")

        config_dict = config_manager.get_dict()
        # Mask API keys
        if 'api_keys' in config_dict and config_dict['api_keys'].get('anthropic_api_key'):
            key = config_dict['api_keys']['anthropic_api_key']
            config_dict['api_keys']['anthropic_api_key'] = f"{key[:8]}...{key[-4:]}" if len(key) > 12 else "***"

        yaml_str = yaml.dump(config_dict, default_flow_style=False, sort_keys=False)
        console.print(yaml_str)
    else:
        console.print(f"[cyan]Config file location:[/cyan] {config_path}")
        console.print("\n[dim]Use --show to view or --edit to modify[/dim]")


@app.command("quick-start")
@click.option(
    "--skip-setup",
    is_flag=True,
    default=False,
    help="Skip setup and go straight to starting the server"
)
@click.pass_context
def quick_start_command(ctx: click.Context, skip_setup: bool) -> None:
    """
    Quick start - setup and launch the API in one command.

    This is a convenience command that:
    1. Runs setup (unless --skip-setup)
    2. Starts the API server
    """
    if not skip_setup:
        console.print(Panel.fit(
            "[bold cyan]Quick Start - Setup & Launch[/bold cyan]",
            border_style="cyan"
        ))

        from tell_me_why import SetupManager

        try:
            manager = SetupManager()
            success = manager.run_setup(auto_install=True)

            if not success:
                console.print("\n[red]Setup failed. Cannot start server.[/red]")
                console.print("[dim]Check ./tmw.log file for more details.[/dim]")
                sys.exit(1)
            console.print("\n[bold green]✓[/bold green] Setup completed successfully!", style="green")
        except Exception as e:
            console.print(f"\n[red]Setup error:[/red] {e}")
            console.print("[dim]Check ./tmw.log file for more details.[/dim]")
            sys.exit(1)

    # Start the server
    console.print("\n[cyan]Starting API server...[/cyan]\n")
    ctx.invoke(start_command, host=None, port=None, reload=None, log_level=None)


@app.command("version")
def version_command() -> None:
    """Show version information."""
    from tell_me_why import __version__, __author__

    console.print(f"\n[bold cyan]Tell Me Why[/bold cyan] v{__version__}")
    console.print(f"[dim]Author: {__author__}[/dim]\n")


if __name__ == "__main__":
    app()
