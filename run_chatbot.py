from dotenv import load_dotenv
import os
import sys

# Load environment variables from .env file at the absolute earliest point.
# This ensures that all modules, including config, will see the environment variables
# when they are imported.
load_dotenv()

if __name__ == "__main__":
    # Optional: force rebuild the vector store
    if "--rebuild" in sys.argv:
        from src.vector_store import build_vector_store
        from src.data_processing import load_documents
        print("Rebuilding vector store...")
        docs = load_documents()
        build_vector_store(docs, force_recreate=True)

    # Now that the environment is set, we can import and run the chatbot application.
    from src.chatbot import launch_app
    print("Environment loaded. Starting chatbot application...")
    launch_app()