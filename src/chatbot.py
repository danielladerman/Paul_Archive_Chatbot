import re
import random
import os
import json
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema.runnable import RunnablePassthrough, RunnableLambda
from langchain.schema.output_parser import StrOutputParser
from src.data_processing import load_documents

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
            search_kwargs={"k": 12, "fetch_k": 40, "lambda_mult": 0.6}
        )
        self.llm = ChatOpenAI(
            model=config.CHAT_MODEL, 
            temperature=0.7,
            openai_api_key=config.OPENAI_API_KEY
        )
        self.chain = self._create_rag_chain()
        print("Chatbot initialized successfully.")

    def generate_suggestions(self, num_suggestions=4):
        """
        Generates a list of interesting questions based on random documents.
        """
        print("Generating dynamic suggestions...")
        docs = load_documents()
        if not docs:
            return []

        # Select a larger, diverse random sample of documents for richer suggestions
        num_to_sample = min(len(docs), 40)
        sampled_docs = random.sample(docs, num_to_sample)
        
        # Combine the content of the sampled documents
        combined_content = "\n\n---\n\n".join([doc.page_content for doc in sampled_docs])

        # Use a specific prompt to extract topics
        extraction_prompt = PromptTemplate.from_template(
            """
            Read the following text which is a collection of excerpts from a person's life writings.
            Identify {num_suggestions} unique, specific, and interesting topics, events, people, or places mentioned.
            Do not list generic topics like "family" or "life". Focus on specific, named entities or concepts.
            Return these topics as a comma-separated list.

            Example: "Trip to Europe in 1948, Open Hillel at Berkeley, The First Intifada, Community Center in 1983"

            Text:
            {text}

            Topics:
            """
        )

        # Create a simple chain to extract the topics
        extraction_chain = extraction_prompt | self.llm | StrOutputParser()
        
        try:
            result = extraction_chain.invoke({
                "text": combined_content,
                "num_suggestions": num_suggestions
            })
            
            # Clean up the output and format into questions
            topics = [topic.strip() for topic in result.split(',') if topic.strip()]
            
            # De-duplicate while preserving order
            seen = set()
            unique_topics = [t for t in topics if not (t in seen or seen.add(t))]
            
            questions = [f"Tell me about {topic.strip()}" for topic in unique_topics]
            print(f"Generated suggestions: {questions}")
            return questions[:num_suggestions]
        except Exception as e:
            print(f"Error generating suggestions: {e}")
            return []

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

    def _strip_sources(self, text: str) -> str:
        """Remove any trailing Sources section, CITED_SOURCES line, and inline citations if the model adds them."""
        # Remove Sources section
        text = re.sub(r"\n+Sources:\s*\n[\s\S]*$", "", text, flags=re.IGNORECASE)
        # Remove CITED_SOURCES line
        text = re.sub(r'\n*CITED_SOURCES:.*$', '', text, flags=re.IGNORECASE)
        # Remove inline citations like (Source 1), (Source 5), etc.
        text = re.sub(r'\s*\(Source\s+\d+\)', '', text, flags=re.IGNORECASE)
        return text.strip()

    def _extract_cited_sources(self, answer: str, total_sources: int) -> list:
        """Extract which source numbers the LLM actually cited."""
        # First, look for CITED_SOURCES: 1, 3, 5 pattern
        match = re.search(r'CITED_SOURCES:\s*([\d,\s]+)', answer, re.IGNORECASE)

        if match:
            # Parse the numbers
            numbers_str = match.group(1)
            cited_nums = [int(n.strip()) for n in numbers_str.split(',') if n.strip().isdigit()]
            # Convert to 0-indexed and filter valid indices
            return [n - 1 for n in cited_nums if 1 <= n <= total_sources]

        # Fallback: Look for inline citations like (Source 1), (Source 5), etc.
        inline_citations = re.findall(r'\(Source\s+(\d+)\)', answer, re.IGNORECASE)
        if inline_citations:
            cited_nums = [int(n) for n in inline_citations]
            # Remove duplicates while preserving order
            seen = set()
            unique_cited = []
            for n in cited_nums:
                if n not in seen and 1 <= n <= total_sources:
                    seen.add(n)
                    unique_cited.append(n - 1)  # Convert to 0-indexed
            if unique_cited:
                return unique_cited

        # Final fallback: return top 5 sources if LLM didn't cite at all
        return list(range(min(5, total_sources)))

    def _expand_query(self, question: str) -> str:
        """
        Expands acronyms and adds context to query for better retrieval.
        """
        expansions_path = os.path.join(config.DATA_PATH, "query_expansions.json")

        if not os.path.exists(expansions_path):
            return question  # Fail gracefully if file doesn't exist

        try:
            with open(expansions_path, 'r') as f:
                expansions = json.load(f)
        except Exception as e:
            print(f"Error loading query expansions: {e}")
            return question

        expanded = question

        # Expand acronyms (case-insensitive word boundary matching)
        for acronym, full_form in expansions.get("acronyms", {}).items():
            pattern = r'\b' + re.escape(acronym) + r'\b'
            if re.search(pattern, expanded, re.IGNORECASE):
                # Add expansion in parentheses without removing acronym
                expanded = re.sub(
                    pattern,
                    f"{acronym} ({full_form})",
                    expanded,
                    flags=re.IGNORECASE,
                    count=1
                )

        # Add contextual terms
        for term, context in expansions.get("contextual_terms", {}).items():
            if term.lower() in expanded.lower() and context not in expanded:
                expanded += f" {context}"

        # Add event context
        for event, context in expansions.get("event_patterns", {}).items():
            if event.lower() in expanded.lower() and context not in expanded:
                expanded += f" {context}"

        return expanded

    def _detect_no_information(self, answer: str) -> bool:
        """Detects if the LLM indicated insufficient information."""
        no_info_patterns = [
            "provided documents do not contain",
            "existing documents do not yet address",
            "no information",
            "i don't have enough information",
            "cannot find information",
            "not enough context",
            "archive is incomplete"
        ]
        return any(pattern in answer.lower() for pattern in no_info_patterns)

    def _fallback_similarity_search(self, question: str, k: int = 15):
        """Fallback: Pure similarity search (no MMR) with higher k."""
        print(f"Fallback Stage 2: Similarity search with k={k}")
        expanded_query = self._expand_query(question)

        fallback_retriever = self.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": k}
        )

        try:
            docs = fallback_retriever.invoke(expanded_query)
        except Exception:
            docs = fallback_retriever.get_relevant_documents(expanded_query)

        return docs

    def _fallback_keyword_search(self, question: str):
        """Fallback Stage 3: Extract keywords and search separately, combine results."""
        print("Fallback Stage 3: Keyword-based search")

        # Extract keywords (remove stopwords)
        stopwords = {'tell', 'me', 'about', 'what', 'who', 'when', 'where', 'how', 'the', 'a', 'an', 'is', 'was', 'were', 'did', 'do', 'does'}
        words = question.lower().split()
        keywords = [w for w in words if w not in stopwords and len(w) > 3]

        # Extract capitalized terms (likely proper nouns)
        proper_nouns = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', question)
        keywords.extend(proper_nouns)

        # Search for each keyword
        all_docs = []
        seen_ids = set()

        for keyword in keywords[:5]:  # Limit to 5 keywords
            try:
                docs = self.vector_store.similarity_search(keyword, k=5)
                for doc in docs:
                    doc_id = id(doc.page_content)
                    if doc_id not in seen_ids:
                        all_docs.append(doc)
                        seen_ids.add(doc_id)
            except Exception as e:
                print(f"Error searching for keyword '{keyword}': {e}")
                continue

        return all_docs[:12]

    def _is_greeting(self, message: str) -> bool:
        """Detect if message is a greeting."""
        greetings = [
            'hi', 'hello', 'hey', 'greetings', 'good morning',
            'good afternoon', 'good evening', 'howdy', 'yo',
            'sup', "what's up", 'whats up'
        ]
        normalized = message.lower().strip().rstrip('.,!?')

        # Check if entire message is just a greeting
        if normalized in greetings:
            return True

        # Check if message starts with greeting and is very short
        words = normalized.split()
        if len(words) <= 3 and any(normalized.startswith(g) for g in greetings):
            return True

        return False

    def _get_greeting_response(self) -> dict:
        """Return a friendly greeting with guidance."""
        greeting_text = """Hello! I'm here to help you learn about Rabbi Paul Z"L and his remarkable life.

You can ask me questions like:
• "Tell me about Paul's time at Berkeley"
• "What was Paul's involvement in the peace movement?"
• "Tell me about Paul's rabbinical work"
• "Who were important people in Paul's life?"

Or you can browse the Topics tab to see curated questions. What would you like to know?"""

        return {
            "answer": greeting_text,
            "sources": []
        }

    def _is_too_vague(self, message: str) -> bool:
        """Detect if query is too short/vague to answer meaningfully."""
        words = message.strip().split()

        # Very short non-greeting queries
        if len(words) <= 2 and not self._is_greeting(message):
            return True

        # Single-word queries (not greetings)
        if len(words) == 1 and words[0].lower() not in ['who', 'what', 'when', 'where', 'how', 'why']:
            return True

        return False

    def _get_vague_query_response(self, question: str) -> dict:
        """Suggest how to formulate a better question."""
        response_text = f"""I'd be happy to help you learn about Rabbi Paul Z"L!

To give you the best answer, could you provide more details? For example:
• Instead of "{question}", try "Tell me about Paul's {question}"
• Or ask a specific question like "What did Paul do related to {question}?"

You can also browse the Topics tab for curated questions on various aspects of Paul's life."""

        return {
            "answer": response_text,
            "sources": []
        }

    def _is_question_too_long(self, question: str, max_chars: int = 500) -> bool:
        """Check if question exceeds character limit."""
        return len(question.strip()) > max_chars

    def _get_question_too_long_response(self, max_chars: int = 500) -> dict:
        """Return error message for overly long questions."""
        response_text = f"""Your question is too long (maximum {max_chars} characters).

Please try to:
• Ask a more focused question
• Break it into multiple smaller questions
• Remove unnecessary details

For example, instead of a long paragraph, ask: "Tell me about Rabbi Paul's work with Ethiopian Jewry" """

        return {
            "answer": response_text,
            "sources": []
        }

    def _create_rag_chain(self):
        """Creates the full RAG chain for the chatbot."""
        
        template = """
        You are a knowledgeable archivist and guide helping people learn about the life and legacy of Rabbi Paul S. Laderman Z"L. Your role is to share his story with accuracy, warmth, and respect using the documents preserved in his archive.

        When answering, you must adhere to the following rules:
        1.  **Tone & Respect:** Your tone should be warm yet scholarly—like a knowledgeable family friend sharing stories. Always refer to him as "Rabbi Paul Z"L" on first mention, then "Rabbi Paul" or "he" thereafter. Use "Z"L" (zichrono livracha - may his memory be a blessing) consistently.
        2.  **Narrative Storytelling:** Weave facts into engaging narratives. When multiple sources provide information about a topic, synthesize them into a coherent story rather than listing facts separately. Provide historical and temporal context to help readers understand the significance of events.
        3.  **Use Only Provided Context:** Base your answers exclusively on the context provided below. Do not invent or speculate beyond what the documents contain.
        4.  **Distinguish Authorship Clearly:** The archive contains both writings BY Rabbi Paul and documents he preserved/collected. When citing something written by someone else, make this crystal clear: "In his archives, Rabbi Paul preserved an article by [Author] which states..." Never present others' words as his own.
        5.  **Handle Incomplete Information Gracefully:** If the context doesn't contain the answer, respond: "The existing documents do not yet address this question directly. The archive is incomplete by nature, and additional sources may eventually provide clarity."
        6.  **No Inline Citations:** Write naturally without citations like (Source 1) in your answer text.
        7.  **Cite Your Sources at the End:** After your answer, add a new line: "CITED_SOURCES: [numbers]" listing ONLY the source numbers you actually referenced (e.g., "CITED_SOURCES: 1, 3, 5").
        8.  **Do NOT add a Sources section** - this is appended automatically.

        CONTEXT:
        {context}

        QUESTION:
        {question}

        ANSWER:
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
        # Newer LangChain recommends using .invoke() on retrievers
        try:
            docs = self.retriever.invoke(question)
        except Exception:
            # Fallback for older versions
            docs = self.retriever.get_relevant_documents(question)

        # 2) Build context from docs
        context = self._format_context(docs)

        # 3) Use the same instruction template as the chain
        template = """
        You are a knowledgeable archivist and guide helping people learn about the life and legacy of Rabbi Paul S. Laderman Z"L. Your role is to share his story with accuracy, warmth, and respect using the documents preserved in his archive.

        When answering, you must adhere to the following rules:
        1.  **Tone & Respect:** Your tone should be warm yet scholarly—like a knowledgeable family friend sharing stories. Always refer to him as "Rabbi Paul Z"L" on first mention, then "Rabbi Paul" or "he" thereafter. Use "Z"L" (zichrono livracha - may his memory be a blessing) consistently.
        2.  **Narrative Storytelling:** Weave facts into engaging narratives. When multiple sources provide information about a topic, synthesize them into a coherent story rather than listing facts separately. Provide historical and temporal context to help readers understand the significance of events.
        3.  **Use Only Provided Context:** Base your answers exclusively on the context provided below. Do not invent or speculate beyond what the documents contain.
        4.  **Distinguish Authorship Clearly:** The archive contains both writings BY Rabbi Paul and documents he preserved/collected. When citing something written by someone else, make this crystal clear: "In his archives, Rabbi Paul preserved an article by [Author] which states..." Never present others' words as his own.
        5.  **Handle Incomplete Information Gracefully:** If the context doesn't contain the answer, respond: "The existing documents do not yet address this question directly. The archive is incomplete by nature, and additional sources may eventually provide clarity."
        6.  **No Inline Citations:** Write naturally without citations like (Source 1) in your answer text.
        7.  **Cite Your Sources at the End:** After your answer, add a new line: "CITED_SOURCES: [numbers]" listing ONLY the source numbers you actually referenced (e.g., "CITED_SOURCES: 1, 3, 5").
        8.  **Do NOT add a Sources section** - this is appended automatically.

        CONTEXT:
        {context}

        QUESTION:
        {question}

        ANSWER:
        """

        prompt = PromptTemplate(template=template, input_variables=["context", "question"])
        answer = (prompt | self.llm | StrOutputParser()).invoke({"context": context, "question": question})

        # Remove any accidental Sources section added by the model
        clean_answer = self._strip_sources(answer)

        # 4) Deterministically append sources from metadata, de-duplicating identical title/link pairs
        def _format_sources(docs_list):
            items = []
            seen = set()
            for d in docs_list:
                m = d.metadata or {}
                title = m.get("title", "Untitled Document")
                links = m.get("source_links") or ([m["source_link"]] if m.get("source_link") else [])
                if not isinstance(links, list):
                    links = [str(links)]
                for idx, link in enumerate(links, 1):
                    if not link:
                        continue
                    key = (title, link)
                    if key in seen:
                        continue
                    seen.add(key)
                    items.append(f"- [{title} - Source {idx}]({link})")
            return "\n".join(items) if items else "- No link available"

        sources = _format_sources(docs)
        return f"{clean_answer}\n\nSources:\n{sources}"

    def get_response_with_sources(self, question):
        """Return answer text and structured sources separately for API/clients."""
        if not question:
            return {"answer": "Please ask a question.", "sources": []}

        # Check if question is too long
        if self._is_question_too_long(question, config.MAX_QUESTION_LENGTH):
            return self._get_question_too_long_response(config.MAX_QUESTION_LENGTH)

        # Handle greetings conversationally
        if self._is_greeting(question):
            return self._get_greeting_response()

        # Handle very short/vague queries with guidance
        if self._is_too_vague(question):
            return self._get_vague_query_response(question)

        print(f"Received question: {question}")

        # Expand query before retrieval
        expanded_query = self._expand_query(question)
        if expanded_query != question:
            print(f"Expanded query: {expanded_query}")

        # Retrieve docs once using expanded query
        try:
            docs = self.retriever.invoke(expanded_query)
        except Exception:
            docs = self.retriever.get_relevant_documents(expanded_query)

        # Build context
        context = self._format_context(docs)

        # Use same instruction template
        template = """
        You are a knowledgeable archivist and guide helping people learn about the life and legacy of Rabbi Paul S. Laderman Z"L. Your role is to share his story with accuracy, warmth, and respect using the documents preserved in his archive.

        When answering, you must adhere to the following rules:
        1.  **Tone & Respect:** Your tone should be warm yet scholarly—like a knowledgeable family friend sharing stories. Always refer to him as "Rabbi Paul Z"L" on first mention, then "Rabbi Paul" or "he" thereafter. Use "Z"L" (zichrono livracha - may his memory be a blessing) consistently.
        2.  **Narrative Storytelling:** Weave facts into engaging narratives. When multiple sources provide information about a topic, synthesize them into a coherent story rather than listing facts separately. Provide historical and temporal context to help readers understand the significance of events.
        3.  **Use Only Provided Context:** Base your answers exclusively on the context provided below. Do not invent or speculate beyond what the documents contain.
        4.  **Distinguish Authorship Clearly:** The archive contains both writings BY Rabbi Paul and documents he preserved/collected. When citing something written by someone else, make this crystal clear: "In his archives, Rabbi Paul preserved an article by [Author] which states..." Never present others' words as his own.
        5.  **Handle Incomplete Information Gracefully:** If the context doesn't contain the answer, respond: "The existing documents do not yet address this question directly. The archive is incomplete by nature, and additional sources may eventually provide clarity."
        6.  **No Inline Citations:** Write naturally without citations like (Source 1) in your answer text.
        7.  **Cite Your Sources at the End:** After your answer, add a new line: "CITED_SOURCES: [numbers]" listing ONLY the source numbers you actually referenced (e.g., "CITED_SOURCES: 1, 3, 5").
        8.  **Do NOT add a Sources section** - this is appended automatically.

        CONTEXT:
        {context}

        QUESTION:
        {question}

        ANSWER:
        """

        prompt = PromptTemplate(template=template, input_variables=["context", "question"])
        answer_text = (prompt | self.llm | StrOutputParser()).invoke({"context": context, "question": question})

        # Extract which sources were cited before stripping
        cited_indices = self._extract_cited_sources(answer_text, len(docs))

        # Now strip sources and CITED_SOURCES line
        clean_answer = self._strip_sources(answer_text)

        # Check if we need fallback retrieval
        if self._detect_no_information(clean_answer):
            print("Primary retrieval failed, attempting fallback...")

            # Stage 2: Similarity search fallback
            docs = self._fallback_similarity_search(question, k=15)
            context = self._format_context(docs)
            answer_text = (prompt | self.llm | StrOutputParser()).invoke({"context": context, "question": question})
            # Re-extract citations after fallback
            cited_indices = self._extract_cited_sources(answer_text, len(docs))
            clean_answer = self._strip_sources(answer_text)

            # Stage 3: Keyword-based fallback (if still no information)
            if self._detect_no_information(clean_answer):
                print("Similarity fallback failed, attempting keyword search...")
                docs = self._fallback_keyword_search(question)
                context = self._format_context(docs)
                answer_text = (prompt | self.llm | StrOutputParser()).invoke({"context": context, "question": question})
                # Re-extract citations after keyword search
                cited_indices = self._extract_cited_sources(answer_text, len(docs))
                clean_answer = self._strip_sources(answer_text)

        # Filter docs to only cited ones
        cited_docs = [docs[i] for i in cited_indices if i < len(docs)]

        # Structured sources (deduplicated by title + link)
        structured_sources = []
        seen = set()
        for d in cited_docs:
            m = d.metadata or {}
            title = m.get("title", "Untitled Document")
            links = m.get("source_links") or ([m["source_link"]] if m.get("source_link") else [])
            if not isinstance(links, list):
                links = [str(links)]
            for link in links:
                if not link:
                    continue
                key = (title, link)
                if key in seen:
                    continue
                seen.add(key)
                structured_sources.append({"title": title, "link": link})

        return {"answer": clean_answer, "sources": structured_sources}

# --- Gradio Interface ---
def launch_app():
    """Launches the Gradio web interface for the chatbot."""
    try:
        import gradio as gr  # Lazy import so server environments without gradio won't fail
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
        
    except Exception as e:
        print(f"Error launching app: {e}")
        # Attempt to show a simple error page if gradio is available
        try:
            import gradio as gr
            with gr.Blocks() as demo:
                gr.Markdown(f"# Error\n\nCould not start the chatbot. Please check the console for details.\n\n**Details:** {e}")
            demo.launch()
        except Exception:
            pass


if __name__ == "__main__":
    launch_app()
