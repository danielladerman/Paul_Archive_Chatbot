import os
from dotenv import load_dotenv

# Load environment variables from .env file right at the beginning
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# --- Project Paths ---
# Use absolute paths for robustness
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(PROJECT_ROOT, "data")
VECTOR_STORE_PATH = os.path.join(PROJECT_ROOT, "faiss_index")

# --- Data Processing ---
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# --- Model Configuration ---
EMBEDDING_MODEL = "text-embedding-ada-002"
CHAT_MODEL = "gpt-3.5-turbo"
