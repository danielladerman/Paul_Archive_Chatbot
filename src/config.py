import os
from dotenv import load_dotenv

# Load environment variables from .env file right at the beginning
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not set. Please create a .env file with OPENAI_API_KEY=...")

# --- Project Paths ---
# Use absolute paths for robustness
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(PROJECT_ROOT, "data")
VECTOR_STORE_PATH = os.path.join(PROJECT_ROOT, "faiss_index")

# --- Data Processing ---
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# --- Model Configuration ---
EMBEDDING_MODEL = "text-embedding-3-small"
CHAT_MODEL = "gpt-4o-mini"

# --- Pinecone Configuration (optional) ---
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX", "paul-archive")
PINECONE_CLOUD = os.getenv("PINECONE_CLOUD", "aws")
PINECONE_REGION = os.getenv("PINECONE_REGION", "us-east-1")
