# The Paul Project: A Digital Legacy

An AI-trained window into the life and legacy of Paul Laderman, built to share his stories, wisdom, and experiences with the world.

## 📖 Overview

This project is an AI-powered chatbot that acts as a digital archive and research assistant for the collected writings of Paul Laderman. The chatbot is designed to answer questions about Paul's life in the persona of an expert researcher, drawing exclusively from the documents provided in its knowledge base. It uses a Retrieval-Augmented Generation (RAG) architecture to provide accurate, context-aware, and citable answers.

The ultimate goal is to evolve this application from a local tool into a public website where anyone can interact with the Paul Scholar chatbot [[memory:494183]].

### Key Features
- **Researcher Persona:** The chatbot answers questions about Paul in the third person, as a scholar who has studied his work.
- **Source-Grounded Answers:** Responses are based *only* on the provided documents, preventing the AI from fabricating information.
- **Footnote Citations:** Every answer includes a "Sources" section with clickable links to the original document(s) in a shared repository, allowing for easy verification.
- **Dynamic Knowledge Base:** The chatbot's knowledge can be easily expanded by adding new, cleaned Markdown files to the `data` directory.

## 🛠️ Tech Stack

- **RAG Orchestration:** LangChain
- **AI Models:** OpenAI (`gpt-4o-mini` for chat, `text-embedding-3-small` for embeddings)
- **Vector Store:** Pinecone (managed) with local FAISS fallback for offline dev
- **Backend API:** FastAPI (`src/api.py`)
- **Web UI:** React + Vite + Tailwind CSS + shadcn (`frontend/`)
- **Language:** Python (backend), TypeScript (frontend)

## 📂 Project Structure

```
Saba_Paul_AI/
├── venv/                        # Python virtual environment
├── data/                        # Source documents (cleaned .md files)
├── faiss_index/                 # Local vector store (auto-generated if used)
├── src/
│   ├── api.py                   # FastAPI app (POST /chat)
│   ├── chatbot.py               # Core chatbot logic + legacy Gradio launcher
│   ├── data_processing.py       # Loads and chunks documents
│   ├── vector_store.py          # Pinecone or FAISS vector store
│   ├── ingest_to_pinecone.py    # Ingestion script to upsert all docs to Pinecone
│   └── config.py                # Project configuration (paths, models, env)
├── frontend/                    # React + Vite + Tailwind + shadcn UI
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── components/ui/...    # shadcn components
│   └── index.html
├── .env                         # Environment variables (API keys)
├── .env.example                 # Example environment file
├── requirements.txt             # Python dependencies
└── run_chatbot.py               # Legacy Gradio entry (local-only)
```

## 🚀 Getting Started

Follow these instructions to set up and run the project on your local machine.

### 1. Prerequisites
- Python 3.9+
- An OpenAI API Key

### 2. Clone the Repository
```bash
git clone <repository-url>
cd Saba_Paul_AI
```

### 3. Set Up the Environment

**Create a Virtual Environment:**
This project uses a virtual environment to manage dependencies and avoid conflicts.
```bash
python3 -m venv venv
```

**Activate the Environment:**
- On macOS/Linux:
  ```bash
  source venv/bin/activate
  ```
- On Windows:
  ```bash
  .\venv\Scripts\activate
  ```

### 4. Install Dependencies
- Backend (Python):
```bash
pip install -r requirements.txt
```
- Frontend (Node 18+):
```bash
cd frontend && npm install
```

### 5. Configure API Keys
Create a `.env` file in the project root by copying the example file.
```bash
cp .env.example .env
```
Now, open the newly created `.env` file and add your keys:
```env
# Required
OPENAI_API_KEY="sk-..."

# Pinecone (managed vector DB)
PINECONE_API_KEY="pcn-..."
PINECONE_INDEX="paul-archive"
PINECONE_CLOUD="aws"
PINECONE_REGION="us-east-1"
```

### 6. Prepare the Data
The chatbot's knowledge comes from the Markdown files in the `data/` directory.

- **Delete any old `.doc` or `.docx` files** from the `data/` directory.
- Add your cleaned and formatted `.md` files to this directory.
- Ensure each `.md` file includes a YAML frontmatter block at the top with metadata like `title`, `author`, `date`, and `source_link`. See the existing documents for an example.

### 7. Build vectors and run locally

- Ingest all documents into Pinecone (one-time or whenever `data/` changes):
```bash
python -m src.ingest_to_pinecone
```

- Start the API (FastAPI):
```bash
uvicorn src.api:app --host 127.0.0.1 --port 7860
```
Open API docs: `http://127.0.0.1:7860/docs`

- Start the Web UI (Vite dev server):
```bash
cd frontend
npm run dev
```
Open UI: `http://127.0.0.1:5173` (or whichever port Vite prints)

- Optional (legacy local UI):
```bash
python3 run_chatbot.py
```
Note: the legacy Gradio UI is for local use only and may show upstream client warnings; prefer the React UI.

### 8. Deploy

- Backend (Render recommended):
  - Build: `pip install -r requirements.txt`
  - Start: `uvicorn src.api:app --host 0.0.0.0 --port $PORT`
  - Env: `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX`, `PINECONE_CLOUD`, `PINECONE_REGION`

- Frontend (Vercel recommended):
  - Project root: `frontend/`
  - Build: `npm run build`
  - Output: `dist`
  - Env: `VITE_API_BASE=https://<your-render-api>.onrender.com`

### 9. Verify Pinecone contains all chunks

Compare expected chunk count to vectors stored:
```bash
# expected
python - <<'PY'
from src.data_processing import load_documents, split_text
docs = load_documents()
chunks = split_text(docs)
print('Expected chunk count:', len(chunks))
PY

# actual in Pinecone
python - <<'PY'
from dotenv import load_dotenv; load_dotenv()
from pinecone import Pinecone
from src import config
pc = Pinecone(api_key=config.PINECONE_API_KEY)
idx = pc.Index(config.PINECONE_INDEX_NAME)
stats = idx.describe_index_stats()
print('Pinecone vector count:', stats.get('total_vector_count'))
print('Stats:', stats)
PY
```

## 📈 Future Development Roadmap

- **CI ingestion**: GitHub Action to auto-upsert to Pinecone on `data/**/*.md` changes
- **Public deploy**: Harden API rate limiting/auth; add analytics
- **UI features**: Suggested questions, topic filters, and shareable links