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

- **Core Framework:** LangChain
- **AI Models:** OpenAI (`gpt-3.5-turbo` for chat, `text-embedding-ada-002` for embeddings)
- **Vector Store:** FAISS (local development)
- **User Interface:** Gradio
- **Programming Language:** Python

## 📂 Project Structure

```
Saba_Paul_AI/
├── venv/                   # Isolated Python virtual environment
├── data/                   # Source documents (cleaned .md files)
├── faiss_index/            # Local vector store (auto-generated)
├── src/                    # Main application source code
│   ├── chatbot.py          # Core chatbot logic and Gradio UI
│   ├── data_processing.py  # Loads and chunks documents
│   ├── vector_store.py     # Manages the FAISS vector store
│   └── config.py           # Project configuration (paths, models)
├── .env                    # Local environment variables (API keys)
├── .env.example            # Example environment file
├── requirements.txt        # Python dependencies
└── run_chatbot.py          # Main entry point to run the application
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
Install all the required Python packages from the `requirements.txt` file.
```bash
pip install -r requirements.txt
```

### 5. Configure API Keys
Create a `.env` file in the project root by copying the example file.
```bash
cp .env.example .env
```
Now, open the newly created `.env` file and add your OpenAI API key:
```env
# Replace with your actual OpenAI API key
OPENAI_API_KEY="sk-..."
```

### 6. Prepare the Data
The chatbot's knowledge comes from the Markdown files in the `data/` directory.

- **Delete any old `.doc` or `.docx` files** from the `data/` directory.
- Add your cleaned and formatted `.md` files to this directory.
- Ensure each `.md` file includes a YAML frontmatter block at the top with metadata like `title`, `author`, `date`, and `source_link`. See the existing documents for an example.

### 7. Run the Application
Once the setup is complete, you can launch the chatbot. The first time you run it, it will automatically build the FAISS vector store from the documents in the `data/` directory.

```bash
python3 run_chatbot.py
```
The application will start and provide a local and a public URL. Open one of these in your browser to interact with the chatbot.

## 📈 Future Development Roadmap

This project is currently in its initial development phase. The plan is to enhance it with more robust, scalable technologies suitable for a public-facing web application [[memory:494183]].

- **[ ] Migrate to a Cloud Vector Store:** The local FAISS index will be replaced with a managed, server-based vector store like **Pinecone** or **ChromaDB**. This is the highest priority for scalability and data management.
- **[ ] Develop a Custom Web Interface:** The Gradio UI will be replaced with a more robust and customizable web framework, likely a **Flask** or **FastAPI** backend with a **React** or **Vue.js** frontend.
- **[ ] Enhance Data Processing Pipeline:** Implement the automated Scan -> OCR -> AI Structuring pipeline to streamline the process of adding new documents to the knowledge base.
- **[ ] Implement Advanced UI Features:** Add functionality to the "Explore Paul's Legacy" buttons, allowing users to browse and filter documents by the tags defined in the Markdown files. 