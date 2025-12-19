# The Paul Project: A Digital Legacy

An AI-trained window into the life and legacy of Paul Laderman, built to share his stories, wisdom, and experiences with the world.

## 📖 Overview

This project is an AI-powered application featuring a chatbot, timeline, and gallery dedicated to preserving and sharing the life and writings of Paul Laderman. The chatbot acts as a digital archive and research assistant, answering questions in the persona of an expert researcher and drawing exclusively from a knowledge base of his documents. It uses a Retrieval-Augmented Generation (RAG) architecture to provide accurate, context-aware, and citable answers.

### Key Features
- **Researcher Persona:** The chatbot answers questions about Paul in the third person, as a scholar who has studied his work.
- **Source-Grounded Answers:** Responses are based *only* on the provided documents, preventing the AI from fabricating information.
- **Footnote Citations:** Every answer includes a "Sources" section with clickable links to the original document(s).
- **Persistent Data:** The application includes a timeline of life events and an image gallery, with data persisted in a PostgreSQL database.
- **Modern UI:** The frontend is a responsive and user-friendly single-page application.

## 🛠️ Tech Stack

### Backend
- **Language:** Python 3.9+
- **API Framework:** FastAPI
- **RAG Orchestration:** LangChain
- **AI Models:** OpenAI (`gpt-4o-mini` for chat, `text-embedding-3-small` for embeddings)
- **Vector Store:** Pinecone (managed) with a local FAISS fallback for offline development.
- **Database:** PostgreSQL (using Neon serverless provider)
- **ORM:** SQLAlchemy

### Frontend
- **Framework:** React.js with Vite
- **Language:** JavaScript
- **Styling:** Tailwind CSS with shadcn/ui components
- **Image Storage:** Supabase Storage

### Deployment
- **Backend API:** Render
- **Frontend App:** Vercel
- **Database:** Neon
- **Vector Store:** Pinecone

## 📂 Project Structure

```
Saba_Paul_AI/
├── venv/                      # Python virtual environment
├── data/                      # Source documents for the chatbot (.md files)
├── faiss_index/               # Local vector store (auto-generated for offline use)
├── src/                       # Backend Python source code
│   ├── api.py                 # FastAPI application (endpoints for chat, timeline, gallery)
│   ├── chatbot.py             # Core chatbot RAG logic
│   ├── database.py            # SQLAlchemy models and database connection
│   ├── data_processing.py     # Loads and chunks documents for ingestion
│   ├── vector_store.py        # Logic for Pinecone and FAISS vector stores
│   └── ingest_to_pinecone.py  # Script to ingest data into Pinecone
├── frontend_base44/           # React frontend application
│   ├── src/
│   │   ├── pages/             # Main pages (Chat, Timeline, Gallery, About)
│   │   ├── entities/          # Frontend data models and API interaction logic
│   │   ├── integrations/      # Connectors to backend services
│   │   └── lib/utils/         # Utility functions, including name formatting
│   └── vercel.json            # Vercel deployment configuration for SPA routing
├── .env                       # Environment variables (API keys, database URLs)
├── .env.example               # Template for the .env file
├── requirements.txt           # Python dependencies for the backend
└── render.yaml                # Render deployment configuration for the backend
```

## 🚀 Getting Started

Follow these instructions to set up and run the project on your local machine.

### 1. Prerequisites
- Python 3.9+
- Node.js 18+
- An OpenAI API Key
- A Pinecone API Key and a pre-configured index (e.g., `paul-archive`)
- A Neon (or other PostgreSQL) database URL
- A Supabase project with a public storage bucket (e.g., `paul-gallery`)

### 2. Set Up the Environment

**Clone the Repository:**
```bash
git clone <repository-url>
cd Saba_Paul_AI
```

**Create and Activate a Python Virtual Environment:**
```bash
python3 -m venv venv
source venv/bin/activate
# On Windows, use: .\venv\Scripts\activate
```
If you already have a virtual environment such as `.dev_venv` in this folder, you can activate it instead:
```bash
source .dev_venv/bin/activate
```

### 3. Install Dependencies

**Backend (Python):**
```bash
pip install -r requirements.txt
```

**Frontend (Node.js):**
```bash
cd frontend_base44
npm install
cd ..
```

### 4. Configure API Keys and Environment Variables

Create a `.env` file in the project root by copying the example template.
```bash
cp .env.example .env
```
Now, open the `.env` file and fill in your keys and URLs:
```env
# Required for chatbot
OPENAI_API_KEY="sk-..."

# Required for RAG knowledge base
PINECONE_API_KEY="..."
PINECONE_INDEX="paul-archive" # Or your index name
PINECONE_CLOUD="aws"
PINECONE_REGION="us-east-1"

# Required for timeline and gallery metadata
DATABASE_URL="postgresql://..."

# A secret key for protecting admin endpoints
X_API_KEY="..." # Generate a secure, random string

# Required for gallery image uploads
VITE_SUPABASE_URL="..."
VITE_SUPABASE_ANON_KEY="..."
```

### 5. Prepare the Data and Database

**Ingest Chatbot Knowledge:**
Run the ingestion script to populate your Pinecone index with the documents from the `/data` directory. This needs to be done once, or whenever the documents change.
```bash
python -m src.ingest_to_pinecone
```

**Initialize the Database Tables:**
The first time you run the API, it will automatically create the necessary tables in your PostgreSQL database.

## 🏃‍♀️ Running Locally

You will need to run two processes in separate terminals.

**Terminal 1: Start the Backend API**
```bash
# From the project root
# Make sure your virtual environment is activated first, for example:
#   source venv/bin/activate
#   # or, if you are using the dev environment:
#   source .dev_venv/bin/activate
python -m uvicorn src.api:app --host 127.0.0.1 --port 7860 --reload
```
The API will be available at `http://127.0.0.1:7860`.

**Terminal 2: Start the Frontend UI**
```bash
cd frontend_base44
VITE_API_BASE=http://127.0.0.1:7860 VITE_API_KEY=<Your_X_API_KEY> npm run dev
```
Replace `<Your_X_API_KEY>` with the secret key you set in your `.env` file. The application will be available at `http://localhost:5173` (or, if that port is in use, Vite will automatically choose the next available port such as `http://localhost:5174`—check the terminal output for the exact URL).

## ☁️ Deployment

The application is designed to be deployed to separate services for the frontend and backend.

- **Backend (Render):** The `render.yaml` file is configured for deployment on Render. You will need to set the same environment variables from your `.env` file in the Render dashboard.
- **Frontend (Vercel):** The `frontend_base44` directory can be deployed as a Vercel project. Set `VITE_API_BASE` to your live Render API URL and the other `VITE_*` variables in the Vercel dashboard. The `vercel.json` file is included to handle client-side routing correctly.