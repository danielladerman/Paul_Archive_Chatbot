from dotenv import load_dotenv
load_dotenv()

from src.data_processing import load_documents
from src.vector_store import build_vector_store


def main():
    docs = load_documents()
    if not docs:
        print("No documents found in data/. Nothing to ingest.")
        return
    build_vector_store(docs, force_recreate=True)


if __name__ == "__main__":
    main()


