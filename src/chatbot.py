import gradio as gr
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema.runnable import RunnablePassthrough, RunnableLambda
from langchain.schema.output_parser import StrOutputParser

from src import config
from src.vector_store import get_vector_store

# --- Load Environment Variables ---
# This is now handled in config.py
# load_dotenv()


class PaulChatbot:
    """A chatbot designed to emulate Paul based on his writings."""

    def __init__(self):
        print("Initializing Paul Chatbot...")
        self.vector_store = get_vector_store()
        if self.vector_store is None:
            raise ValueError("Vector store could not be initialized. Please check your data directory and API keys.")
        
        self.retriever = self.vector_store.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 5, "fetch_k": 20, "lambda_mult": 0.5}
        )
        self.llm = ChatOpenAI(
            model=config.CHAT_MODEL, 
            temperature=0.7,
            openai_api_key=config.OPENAI_API_KEY
        )
        self.chain = self._create_rag_chain()
        print("Chatbot initialized successfully.")

    def _format_context(self, docs: list) -> str:
        """
        Formats the retrieved documents into a single string for the prompt.
        Handles both single 'source_link' and a list of 'source_links'.
        """
        formatted_context = []
        for i, doc in enumerate(docs):
            metadata = doc.metadata or {}
            title = metadata.get("title", "Untitled Document")
            author = metadata.get("author", "Unknown Author")
            archived_by = metadata.get("archived_by") # NEW: Check for this field
            
            # Check for 'source_links' (plural list) first, then fall back to 'source_link'
            links = metadata.get("source_links", [])
            if not isinstance(links, list):  # Ensure links is a list
                links = []

            if not links:
                single_link = metadata.get("source_link")
                if single_link:
                    links = [single_link] # Treat the single link as a list with one item
            
            # Format the links for display in the prompt
            links_str = "\n".join(links) if links else "No link available"

            # Build the context block with the new field
            context_block = f"""---
Source {i+1}:
Title: {title}
Author: {author}
"""
            if archived_by:
                context_block += f"Archived By: {archived_by}\n"
            
            context_block += f"""Source Links:
{links_str}

Content:
{doc.page_content}
"""
            formatted_context.append(context_block)
        return "\n".join(formatted_context)


    def _create_rag_chain(self):
        """Creates the full RAG chain for the chatbot."""
        
        template = """
        You are an AI assistant and expert researcher specializing in the life and writings of a man named Paul. Your task is to answer questions about him using only the provided excerpts from his documents.

        When answering, you must adhere to the following rules:
        1.  **Adopt a Researcher's Persona:** Your tone should be objective, informative, and academic. Refer to Paul in the third person.
        2.  **Use Only Provided Context:** Base your answers *exclusively* on the context provided below.
        3.  **Distinguish Authorship:** If the context shows a document was written by someone else but archived by Paul (indicated by the "Archived By" field), you MUST make this distinction clear. Use phrases like, "In his archives, Paul kept an article by [Author] which states..." or "While not his own writing, a document he preserved was..." Never present others' words as Paul's own.
        4.  **Cite Your Sources:** At the end of your response, you MUST include a "Sources" section. For each document you used, create a numbered footnote for *each link* provided in its "Source Links" section. If a source has multiple links, create a separate entry for each one, and append a number to the title (e.g., "[Document Title - Source 1](Link)", "[Document Title - Source 2](Link)").
        5.  **Handle "I Don't Know":** If the provided context does not contain the answer to the question, respond with: "The provided documents do not contain information on that topic."
        6.  **Focus on Storytelling:** Weave the facts into a narrative while maintaining a researcher's tone.

        CONTEXT:
        {context}

        QUESTION:
        {question}

        ANSWER (as a researcher):
        """
        
        prompt = PromptTemplate(template=template, input_variables=["context", "question"])

        rag_chain = (
            {
                "context": self.retriever | RunnableLambda(self._format_context),
                "question": RunnablePassthrough()
            }
            | prompt
            | self.llm
            | StrOutputParser()
        )
        return rag_chain

    def get_response(self, question):
        """Gets a response with deterministic citations."""
        if not question:
            return "Please ask a question."
        print(f"Received question: {question}")

        # 1) Retrieve relevant docs deterministically once
        docs = self.retriever.get_relevant_documents(question)

        # 2) Build context from docs
        context = self._format_context(docs)

        # 3) Use the same instruction template as the chain
        template = """
        You are an AI assistant and expert researcher specializing in the life and writings of a man named Paul. Your task is to answer questions about him using only the provided excerpts from his documents.

        When answering, you must adhere to the following rules:
        1.  **Adopt a Researcher's Persona:** Your tone should be objective, informative, and academic. Refer to Paul in the third person.
        2.  **Use Only Provided Context:** Base your answers *exclusively* on the context provided below.
        3.  **Distinguish Authorship:** If the context shows a document was written by someone else but archived by Paul (indicated by the "Archived By" field), you MUST make this distinction clear. Use phrases like, "In his archives, Paul kept an article by [Author] which states..." or "While not his own writing, a document he preserved was..." Never present others' words as Paul's own.
        4.  **Cite Your Sources:** At the end of your response, you MUST include a "Sources" section. For each document you used, create a numbered footnote for *each link* provided in its "Source Links" section. If a source has multiple links, create a separate entry for each one, and append a number to the title (e.g., "[Document Title - Source 1](Link)", "[Document Title - Source 2](Link)").
        5.  **Handle "I Don't Know":** If the provided context does not contain the answer to the question, respond with: "The provided documents do not contain information on that topic."
        6.  **Focus on Storytelling:** Weave the facts into a narrative while maintaining a researcher's tone.

        CONTEXT:
        {context}

        QUESTION:
        {question}

        ANSWER (as a researcher):
        """

        prompt = PromptTemplate(template=template, input_variables=["context", "question"])
        answer = (prompt | self.llm | StrOutputParser()).invoke({"context": context, "question": question})

        # 4) Deterministically append sources from metadata
        def _format_sources(docs_list):
            items = []
            for d in docs_list:
                m = d.metadata or {}
                title = m.get("title", "Untitled Document")
                links = m.get("source_links") or ([m["source_link"]] if m.get("source_link") else [])
                if not isinstance(links, list):
                    links = [str(links)]
                for idx, link in enumerate(links, 1):
                    if link:
                        items.append(f"- [{title} - Source {idx}]({link})")
            return "\n".join(items) if items else "- No link available"

        sources = _format_sources(docs)
        return f"{answer}\n\nSources:\n{sources}"

# --- Gradio Interface ---
def launch_app():
    """Launches the Gradio web interface for the chatbot."""
    try:
        chatbot = PaulChatbot()
        
        def handle_chat_submission(message, history):
            """Handles the chat submission, gets a response, and updates the history."""
            response = chatbot.get_response(message)
            history.append((message, response))
            return "", history

        # Using a soft theme and some custom CSS to approximate the design
        with gr.Blocks() as demo:
            gr.Markdown("# The Paul Project\n*An AI-trained window into the life and legacy of Paul*")
            
            with gr.Row():
                with gr.Column(scale=2):
                    # The initial welcome message for the chatbot
                    welcome_message = "Welcome! I'm Paul Scholar, and I've spent considerable time studying Paul's letters, journals, and personal reflections. His words reveal a man of deep thoughtfulness, unwavering integrity, and profound love for his family. I'm here to share insights from his remarkable life and wisdom. What would you like to know about Paul?"
                    
                    chatbot_display = gr.Chatbot(
                        label="Paul Scholar",
                        value=[(None, welcome_message)],
                    )
                    
                    text_input = gr.Textbox(
                        show_label=False,
                        placeholder="What would you like to know about Paul?",
                    )
                    # Link the textbox submission to the chat handler
                    text_input.submit(handle_chat_submission, [text_input, chatbot_display], [text_input, chatbot_display])

                with gr.Column(scale=1):
                    gr.Markdown("## Explore Paul's Legacy\nDiscover different aspects of Paul's life and wisdom")
                    gr.Button("🔀 Surprise Me")
                    gr.Button("💌 Family Letters")
                    gr.Button("📖 Philosophy")
                    gr.Button("⚔️ Stories from the War")
                    gr.Button("🙏 Faith & Reflections")
                    gr.Markdown('> "Every conversation with Paul Scholar draws from a carefully preserved collection of personal letters, journals, and reflections—a digital archive of a life well-lived."')
        
        print("Launching new Gradio interface...")
        demo.launch(share=True)
        
    except ValueError as e:
        print(f"Error launching app: {e}")
        # Display a Gradio interface with the error message
        with gr.Blocks() as demo:
            gr.Markdown(f"# Error\n\nCould not start the chatbot. Please check the console for details.\n\n**Details:** {e}")
        demo.launch()


if __name__ == "__main__":
    launch_app()
