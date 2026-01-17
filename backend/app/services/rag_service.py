import os
import time
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from dotenv import load_dotenv

load_dotenv()

class RAGService:
    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
        self.llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", temperature=0)
        self.vector_store = None

    async def process_pdfs(self, file_paths: list[str]):
        all_texts = []
        for file_path in file_paths:
            loader = PyPDFLoader(file_path)
            documents = loader.load()
            
            # Tag with source filename
            filename = os.path.basename(file_path)
            for doc in documents:
                doc.metadata["source"] = filename

            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            all_texts.extend(text_splitter.split_documents(documents))

        # FAISS creation with retry logic
        vector_store = None
        for i, text_chunk in enumerate(all_texts):
            success = False
            retries = 3
            retry_delay = 30
            
            while not success and retries > 0:
                try:
                    if vector_store is None:
                        vector_store = FAISS.from_documents([text_chunk], self.embeddings)
                    else:
                        vector_store.add_documents([text_chunk])
                    success = True
                except Exception as e:
                    if "429" in str(e):
                        time.sleep(retry_delay)
                        retry_delay *= 2
                        retries -= 1
                    else:
                        raise e
        
        self.vector_store = vector_store
        return vector_store

    def query(self, question: str):
        if not self.vector_store:
            raise ValueError("No documents processed. Please upload PDFs first.")

        qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vector_store.as_retriever(),
            return_source_documents=True
        )
        
        result = qa_chain.invoke({"query": question})
        return {
            "answer": result["result"],
            "sources": [
                {"content": doc.page_content, "metadata": doc.metadata} 
                for doc in result["source_documents"]
            ]
        }

rag_service = RAGService()
