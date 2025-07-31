import os
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

from src import config
from src.data_processing import load_documents, split_text


def build_vector_store(documents, force_recreate=False):
    """
    Builds the vector store from the documents and saves it to disk.
    """
    if os.path.exists(config.VECTOR_STORE_PATH) and not force_recreate:
        print(f"Vector store already exists at {config.VECTOR_STORE_PATH}. Loading...")
        return FAISS.load_local(
            config.VECTOR_STORE_PATH,
            OpenAIEmbeddings(model=config.EMBEDDING_MODEL),
            allow_dangerous_deserialization=True  # Required for FAISS with langchain
        )
    
    print("Splitting documents for vector store...")
    chunks = split_text(documents)
    
    if not chunks:
        print("No documents were chunked. Cannot build vector store.")
        return None

    print(f"Building vector store with {len(chunks)} chunks...")
    embeddings = OpenAIEmbeddings(
        model=config.EMBEDDING_MODEL, 
        openai_api_key=config.OPENAI_API_KEY
    )
    vector_store = FAISS.from_documents(chunks, embeddings)

    print(f"Saving vector store to: {config.VECTOR_STORE_PATH}")
    vector_store.save_local(config.VECTOR_STORE_PATH)

    print("Vector store built and saved successfully.")
    return vector_store

def get_vector_store():
    """
    Loads the vector store from disk. If it doesn't exist, it builds it first.
    """
    if not os.path.exists(config.VECTOR_STORE_PATH):
        print("Vector store not found. Building it now...")
        docs = load_documents()
        if not docs:
            print("No documents found in the data directory. Cannot build vector store.")
            return None
        return build_vector_store(docs)
    
    print(f"Loading existing vector store from {config.VECTOR_STORE_PATH}...")
    return FAISS.load_local(
        config.VECTOR_STORE_PATH,
        OpenAIEmbeddings(
            model=config.EMBEDDING_MODEL,
            openai_api_key=config.OPENAI_API_KEY
        ),
        allow_dangerous_deserialization=True
    )


# if __name__ == '__main__':
#     # This allows us to run this script directly to build the vector store
#     from dotenv import load_dotenv
#     load_dotenv()
#     print("Starting vector store creation process...")
#     documents = load_documents()
#     if documents:
#         build_vector_store(documents, force_recreate=True)
#     else:
#         print("No documents found. Skipping vector store creation.")
