"""
Test script for the RAG Code Assistant API.
Run this after starting the API to verify everything works.
"""
import time

import requests

API_URL = "http://localhost:8000"


def print_section(title: str):
    """Print a formatted section header."""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def test_health() -> bool:
    """Test the health endpoint."""
    print_section("Testing Health Endpoint")
    try:
        response = requests.get(f"{API_URL}/health")
        response.raise_for_status()
        data = response.json()

        print(f"Status: {data['status']}")
        print(f"Version: {data['version']}")
        print(f"Default LLM: {data['llm_default']}")
        print(f"Vector Store: {data['vector_store_path']}")
        print("✓ Health check passed")
        return True
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False


def test_stats() -> bool:
    """Test the stats endpoint."""
    print_section("Testing Stats Endpoint")
    try:
        response = requests.get(f"{API_URL}/stats")
        response.raise_for_status()
        data = response.json()

        print("Vector Store:")
        print(f"  - Documents: {data['vector_store']['total_documents']}")
        print(f"  - Embedding Model: {data['vector_store']['embedding_model']}")

        print("\nLLM Configuration:")
        print(f"  - Default: {data['llm']['default']}")
        print(f"  - Ollama Model: {data['llm']['ollama_model']}")
        print(f"  - Claude Available: {data['llm']['claude_available']}")

        print("\nRetrieval Settings:")
        print(f"  - Top K: {data['retrieval']['top_k']}")
        print(f"  - Chunk Size: {data['retrieval']['chunk_size']}")

        print("✓ Stats check passed")
        return True
    except Exception as e:
        print(f"✗ Stats check failed: {e}")
        return False


def test_models() -> bool:
    """Test the models endpoint."""
    print_section("Testing Models Endpoint")
    try:
        response = requests.get(f"{API_URL}/models")
        response.raise_for_status()
        data = response.json()

        print(f"Default Model: {data['default']}")
        print("\nAvailable Models:")
        for model_name, model_info in data['models'].items():
            print(f"\n{model_name.upper()}:")
            print(f"  - Available: {model_info['available']}")
            print(f"  - Model: {model_info['model']}")
            print(f"  - Privacy: {model_info['privacy']}")

        print("✓ Models check passed")
        return True
    except Exception as e:
        print(f"✗ Models check failed: {e}")
        return False


def test_query(llm_type: str = "ollama") -> bool:
    """Test the query endpoint."""
    print_section(f"Testing Query Endpoint ({llm_type.upper()})")

    test_query = "Explain what TypeScript interfaces are and give a simple example."

    print(f"Query: {test_query}")
    print("Waiting for response...")

    try:
        start_time = time.time()
        response = requests.post(
            f"{API_URL}/query",
            json={
                "query": test_query,
                "llm_type": llm_type
            },
            timeout=120  # 2 minute timeout
        )
        elapsed_time = time.time() - start_time
        response.raise_for_status()
        data = response.json()

        print(f"\n⏱ Response time: {elapsed_time:.2f}s")
        print(f"\nAnswer ({len(data['answer'])} characters):")
        print("-" * 60)
        print(data['answer'][:500] + "..." if len(data['answer']) > 500 else data['answer'])
        print("-" * 60)

        print(f"\nSources: {len(data['sources'])} documents retrieved")
        if data['sources']:
            print("\nFirst source:")
            source = data['sources'][0]
            print(f"  - File: {source['metadata'].get('source', 'Unknown')}")
            print(f"  - Type: {source['metadata'].get('file_type', 'Unknown')}")
            print(f"  - Content preview: {source['content'][:100]}...")

        print(f"\nPrivacy Note: {data['privacy_note']}")
        print("✓ Query test passed")
        return True

    except requests.exceptions.Timeout:
        print("✗ Query timed out (this might mean Ollama is slow or not running)")
        return False
    except Exception as e:
        print(f"✗ Query test failed: {e}")
        return False


def run_all_tests():
    """Run all API tests."""
    print("\n" + "=" * 60)
    print("  RAG Code Assistant - API Test Suite")
    print("=" * 60)
    print(f"\nTesting API at: {API_URL}")
    print("Make sure the API is running (python app.py)")
    print("\nPress Enter to continue...")
    input()

    results = {
        "Health Check": test_health(),
        "Stats Check": test_stats(),
        "Models Check": test_models(),
        "Query Test (Ollama)": test_query("ollama"),
    }

    # Optional: Test Claude if available
    try:
        models_response = requests.get(f"{API_URL}/models")
        if models_response.json()['models']['claude']['available']:
            print("\n⚠ Claude is available. Test with Claude? (y/n): ", end="")
            if input().lower() == 'y':
                results["Query Test (Claude)"] = test_query("claude")
    except:
        pass

    # Print summary
    print_section("Test Summary")
    passed = sum(results.values())
    total = len(results)

    for test_name, passed_test in results.items():
        status = "✓ PASS" if passed_test else "✗ FAIL"
        print(f"{status} - {test_name}")

    print(f"\nOverall: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! Your RAG system is working correctly.")
    else:
        print("\n⚠ Some tests failed. Check the output above for details.")

    return passed == total


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
