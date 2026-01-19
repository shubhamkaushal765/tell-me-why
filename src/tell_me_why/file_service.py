"""
File service for serving folder structure and file contents.
Provides utilities for browsing the document repository via API.
"""
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)


class FileNode:
    """Represents a node in the file tree (file or directory)."""

    def __init__(self, path: Path, relative_to: Path):
        self.path = path
        self.name = path.name
        self.relative_path = str(path.relative_to(relative_to))
        self.is_file = path.is_file()
        self.is_dir = path.is_dir()
        self.size = path.stat().st_size if self.is_file else None
        self.extension = path.suffix if self.is_file else None

    def to_dict(self) -> Dict[str, Any]:
        """Convert node to dictionary representation."""
        result = {
            "name": self.name,
            "path": self.relative_path,
            "type": "file" if self.is_file else "directory",
        }

        if self.is_file:
            result["size"] = self.size
            result["extension"] = self.extension

        return result


class FileService:
    """Service for managing file tree and content operations."""

    def __init__(self, root_path: Path):
        """
        Initialize file service.

        Args:
            root_path: Root directory to serve files from
        """
        self.root_path = Path(root_path).resolve()

        if not self.root_path.exists():
            raise ValueError(f"Root path does not exist: {self.root_path}")

        if not self.root_path.is_dir():
            raise ValueError(f"Root path is not a directory: {self.root_path}")

    def _is_ignored(self, path: Path) -> bool:
        """Check if a path should be ignored."""
        ignored_names = {
            '__pycache__',
            '.git',
            '.gitignore',
            '.DS_Store',
            'node_modules',
            '.venv',
            'venv',
            '.pytest_cache',
            '.mypy_cache',
            '.ruff_cache',
            '.vscode',
            '.idea',
            '*.pyc',
            '*.pyo',
            '*.pyd',
            '.Python',
            'pip-log.txt',
            'pip-delete-this-directory.txt',
            '.tox',
            '.coverage',
            'htmlcov',
            'dist',
            'build',
            '*.egg-info',
        }

        # Check if name matches ignored patterns
        if path.name in ignored_names:
            return True

        # Check for hidden files (starting with .)
        if path.name.startswith('.') and path.name not in {'.env',
                                                           '.env.example'}:
            return True

        return False

    def get_file_tree(
            self,
            max_depth: Optional[int] = None,
            include_files: bool = True,
    ) -> Dict[str, Any]:
        """
        Get the file tree structure.

        Args:
            max_depth: Maximum depth to traverse (None for unlimited)
            include_files: Whether to include files or only directories

        Returns:
            Dictionary representing the file tree
        """
        try:
            tree = self._build_tree(
                self.root_path,
                self.root_path,
                current_depth=0,
                max_depth=max_depth,
                include_files=include_files,
            )

            return {
                "root": str(self.root_path),
                "tree": tree,
            }

        except Exception as e:
            logger.error(f"Error building file tree: {e}", exc_info=True)
            raise

    def _build_tree(
            self,
            path: Path,
            root: Path,
            current_depth: int = 0,
            max_depth: Optional[int] = None,
            include_files: bool = True,
    ) -> Dict[str, Any]:
        """
        Recursively build file tree.

        Args:
            path: Current path to process
            root: Root path for relative path calculation
            current_depth: Current recursion depth
            max_depth: Maximum depth to traverse
            include_files: Whether to include files

        Returns:
            Dictionary representing the tree node
        """
        node = FileNode(path, root)
        result = node.to_dict()

        # If it's a directory and we haven't hit max depth, process children
        if node.is_dir and (max_depth is None or current_depth < max_depth):
            children = []

            try:
                # Sort: directories first, then files, both alphabetically
                items = sorted(
                    path.iterdir(), key=lambda p: (p.is_file(), p.name.lower())
                    )

                for item in items:
                    # Skip ignored files/directories
                    if self._is_ignored(item):
                        continue

                    # Skip files if not including them
                    if item.is_file() and not include_files:
                        continue

                    # Recursively process child
                    child_tree = self._build_tree(
                        item,
                        root,
                        current_depth + 1,
                        max_depth,
                        include_files,
                    )
                    children.append(child_tree)

                if children:
                    result["children"] = children

            except PermissionError:
                logger.warning(f"Permission denied accessing: {path}")
                result["error"] = "Permission denied"

        return result

    def get_file_content(self, relative_path: str) -> Dict[str, Any]:
        """
        Get the content of a specific file.

        Args:
            relative_path: Path relative to root directory

        Returns:
            Dictionary with file metadata and content

        Raises:
            FileNotFoundError: If file doesn't exist
            ValueError: If path is outside root or is a directory
        """
        # Resolve the full path
        file_path = (self.root_path / relative_path).resolve()

        # Security check: ensure path is within root
        try:
            file_path.relative_to(self.root_path)
        except ValueError:
            raise ValueError(
                f"Path is outside root directory: {relative_path}"
                )

        # Check if file exists
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {relative_path}")

        # Check if it's a file
        if not file_path.is_file():
            raise ValueError(f"Path is not a file: {relative_path}")

        # Get file stats
        stats = file_path.stat()

        # Try to read file content
        try:
            # Try reading as text
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                content_type = "text"

        except UnicodeDecodeError:
            # If it fails, it's likely a binary file
            try:
                with open(file_path, 'rb') as f:
                    content = f.read()
                    # Return base64 encoded for binary files
                    import base64
                    content = base64.b64encode(content).decode('ascii')
                    content_type = "binary"

            except Exception as e:
                logger.error(f"Error reading file {file_path}: {e}")
                raise ValueError(f"Could not read file: {str(e)}")

        except Exception as e:
            logger.error(f"Error reading file {file_path}: {e}")
            raise ValueError(f"Could not read file: {str(e)}")

        return {
            "path":         relative_path,
            "name":         file_path.name,
            "extension":    file_path.suffix,
            "size":         stats.st_size,
            "content_type": content_type,
            "content":      content,
            "lines":        content.count(
                '\n'
                ) + 1 if content_type == "text" else None,
        }

    def search_files(
            self,
            pattern: str,
            max_results: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Search for files matching a pattern.

        Args:
            pattern: Search pattern (supports wildcards)
            max_results: Maximum number of results to return

        Returns:
            List of matching file information
        """
        results = []

        try:
            # Use rglob for recursive pattern matching
            for file_path in self.root_path.rglob(pattern):
                # Skip ignored paths
                if any(self._is_ignored(part) for part in file_path.parents):
                    continue

                if self._is_ignored(file_path):
                    continue

                # Only include files
                if file_path.is_file():
                    node = FileNode(file_path, self.root_path)
                    results.append(node.to_dict())

                    if len(results) >= max_results:
                        break

        except Exception as e:
            logger.error(f"Error searching files: {e}", exc_info=True)
            raise

        return results
