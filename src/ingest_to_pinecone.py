from dotenv import load_dotenv
load_dotenv()
import time
from src import config
from src.data_processing import load_documents
from src.vector_store import build_vector_store


def clear_pinecone_index():
    """Clears all vectors from the Pinecone index and waits until it's empty."""
    if not config.PINECONE_API_KEY:
        print("Pinecone API key not found. Skipping clearing process.")
        return

    try:
        from pinecone import Pinecone
        print("Connecting to Pinecone to clear the index...")
        pc = Pinecone(api_key=config.PINECONE_API_KEY)
        index_name = config.PINECONE_INDEX_NAME
        
        index_list = pc.list_indexes()
        index_names = [i['name'] for i in index_list]

        if index_name in index_names:
            index = pc.Index(index_name)
            print(f"Clearing all vectors from index '{index_name}'...")
            index.delete(delete_all=True)
            
            # Wait for the deletion to complete
            print("Waiting for index to be empty...")
            while True:
                stats = index.describe_index_stats()
                if stats['total_vector_count'] == 0:
                    break
                print(f"Index still contains {stats['total_vector_count']} vectors. Waiting...")
                time.sleep(5) # Wait 5 seconds before checking again
            
            print("Index cleared successfully.")
        else:
            print(f"Index '{index_name}' does not exist. No need to clear.")
            
    except ImportError:
        print("pinecone-client is not installed. Cannot clear index.")
    except Exception as e:
        print(f"An error occurred while clearing the Pinecone index: {e}")


def main():
    # First, clear the existing index to prevent duplicates
    clear_pinecone_index()

    # Now, load and ingest the documents
    docs = load_documents()
    if not docs:
        print("No documents found in data/. Nothing to ingest.")
        return
    build_vector_store(docs, force_recreate=True)


if __name__ == "__main__":
    main()


