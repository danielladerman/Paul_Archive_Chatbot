import os
from glob import glob
import yaml
import re
from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from src import config

def _parse_frontmatter(file_content):
    """Parses YAML frontmatter from a file's content."""
    frontmatter_match = re.search(r'^---\s*\n(.*?)\n---\s*\n', file_content, re.DOTALL | re.MULTILINE)
    if frontmatter_match:
        try:
            frontmatter = yaml.safe_load(frontmatter_match.group(1))
            content = file_content[frontmatter_match.end():]
            return frontmatter, content
        except yaml.YAMLError:
            # Failed to parse YAML, treat the whole thing as content
            return {}, file_content
    # No frontmatter found
    return {}, file_content

def load_documents(data_path=config.DATA_PATH):
    """
    Loads all Markdown (.md) documents from the specified directory, manually
    parsing YAML frontmatter to ensure metadata is captured correctly.
    """
    print(f"Loading markdown documents from: {data_path}")
    
    md_files = glob(os.path.join(data_path, "**/*.md"), recursive=True)
    all_documents = []
    print(f"Found {len(md_files)} markdown files to load.")

    for file_path in md_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                file_content = f.read()
            
            metadata, content = _parse_frontmatter(file_content)
            # Add the source file path to the metadata, which is used by the loader
            metadata['source'] = file_path
            
            doc = Document(page_content=content, metadata=metadata)
            all_documents.append(doc)

            print(f"--> Successfully loaded {os.path.basename(file_path)}. Metadata found: {'title' in metadata}")

        except Exception as e:
            print(f"--> ERROR: Failed to load file {os.path.basename(file_path)}. Reason: {e}")

    print(f"Loaded a total of {len(all_documents)} documents from {len(md_files)} files.")
    if all_documents:
        print("Final sample of metadata from first document:", all_documents[0].metadata)
        
    return all_documents

def split_text(documents):
    """
    Splits the loaded documents into smaller chunks.
    """
    print("Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=config.CHUNK_SIZE,
        chunk_overlap=config.CHUNK_OVERLAP,
        length_function=len
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Created {len(chunks)} chunks.")
    return chunks

if __name__ == "__main__":
    # This allows us to run this script directly for testing or initial setup
    docs = load_documents()
    chunks = split_text(docs)
    # Later, we will add the code to save these chunks to the vector store here.
    print("Data processing complete.")
    print(f"First chunk example:\n{chunks[0].page_content if chunks else 'No chunks were created.'}")
