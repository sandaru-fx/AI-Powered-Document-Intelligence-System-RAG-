import os
import tempfile
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_google_genai import ChatGoogleGenerativeAI

def process_document_to_vector_store(uploaded_file, progress_callback=None):
    """
    Step 4-7: Processes the PDF and returns a FAISS vector store.
    """
    # Python's tempfile to handle the uploaded stream as a file path for PyPDFLoader
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        tmp_file.write(uploaded_file.getvalue()) # Streamlit UploadedFile use getvalue()
        tmp_file_path = tmp_file.name

    try:
        # Step 4: PDF Loading Logic
        loader = PyPDFLoader(tmp_file_path)
        documents = loader.load()

    # Step 5: Text Chunking
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        texts = text_splitter.split_documents(documents)

        # Step 6: Embeddings Generation
        # Switching to newer model which might have better rate limits/availability
        embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
        
        # Step 7: Vector Store Creation - STRICT SERIAL PROCESSING
        # Processing one by one to avoid any rate limit bursts
        import time
        vector_store = None
        
        total_chunks = len(texts)
        
        for i, text_chunk in enumerate(texts):
            # Update progress callback
            if progress_callback:
                progress_callback(i + 1, total_chunks)
                
            success = False
            retries = 3
            retry_delay = 30 # Start with 30s delay
            
            while not success and retries > 0:
                try:
                    # Create a single-item list for the loader
                    batch = [text_chunk]
                    
                    if vector_store is None:
                        vector_store = FAISS.from_documents(batch, embeddings)
                    else:
                        vector_store.add_documents(batch)
                        
                    success = True
                    # Small delay after each successful add
                    time.sleep(0.5) 
                    
                except Exception as e:
                    if "429" in str(e):
                        time.sleep(retry_delay) 
                        retry_delay *= 2 # Exponential backoff: 30 -> 60 -> 120
                        retries -= 1
                    else:
                        raise e
            
            if not success:
                raise Exception(f"Failed to process chunk {i+1} due to rate limits after retries.")
        
        return vector_store
    finally:
        # Cleanup temp file
        if os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)

def create_qa_chain(vector_store):
    """
    Step 10: Setup LLM Chain with the vector store retriever.
    """
    # Using gemini-flash-latest as it is confirmed available in the user's list
    llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", temperature=0)
    
    # Step 9: Prompt Engineering
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vector_store.as_retriever(),
        return_source_documents=True
    )
    return qa_chain
