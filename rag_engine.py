import os
import tempfile
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_google_genai import ChatGoogleGenerativeAI

def process_document_to_vector_store(uploaded_file):
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
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        
        # Step 7: Vector Store Creation
        vector_store = FAISS.from_documents(texts, embeddings)
        
        return vector_store
    finally:
        # Cleanup temp file
        if os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)

def create_qa_chain(vector_store):
    """
    Step 10: Setup LLM Chain with the vector store retriever.
    """
    llm = ChatGoogleGenerativeAI(model="gemini-pro", temperature=0)
    
    # Step 9: Prompt Engineering (Hidden in 'stuff' chain type default prompt, or can be customized)
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vector_store.as_retriever()
    )
    return qa_chain
