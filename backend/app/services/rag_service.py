import os
import time
import base64
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever
from langchain.chains import RetrievalQA
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv

load_dotenv()

class RAGService:
    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
        self.llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)
        self.vector_store = None
        self.bm25_retriever = None

    async def _describe_image(self, image_path: str):
        """Uses Gemini Vision to describe an extracted image/chart."""
        try:
            with open(image_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode("utf-8")
            
            message = HumanMessage(
                content=[
                    {"type": "text", "text": "Describe this image/chart/table from a technical document in detail for search indexing. Include labels, values, and trends if it is a graph."},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_data}"},
                    },
                ]
            )
            response = self.llm.invoke([message])
            return response.content
        except Exception as e:
            print(f"Error describing image {image_path}: {e}")
            return ""

    async def process_pdfs(self, file_paths: list[str]):
        all_docs = []
        for file_path in file_paths:
            loader = PyPDFLoader(file_path)
            documents = loader.load()
            
            # Tag with source filename
            filename = os.path.basename(file_path)
            for doc in documents:
                doc.metadata["source"] = filename

            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            all_docs.extend(text_splitter.split_documents(documents))

            # --- Multimodal Extraction (Optional/Experimental) ---
            # Try to extract images from PDF using unstructured if available
            try:
                from unstructured.partition.pdf import partition_pdf
                
                extract_dir = os.path.join("backend/data/extracted", filename)
                os.makedirs(extract_dir, exist_ok=True)
                
                elements = partition_pdf(
                    filename=file_path,
                    extract_images_in_pdf=True,
                    infer_table_structure=True,
                    chunking_strategy="by_title",
                    max_characters=4000,
                    new_after_n_chars=3800,
                    extract_image_block_output_dir=extract_dir,
                )
                
                for i, el in enumerate(elements):
                    if el.category == "Image" or el.category == "Table":
                        # If it's a table, we already have the text/html
                        # If it's an image, we need to describe it
                        content = str(el)
                        # Find related image if category is Image
                        # (Simplified logic: unstructured usually saves images in the dir)
                        
                        image_files = list(Path(extract_dir).glob("*.jpg")) + list(Path(extract_dir).glob("*.png"))
                        if el.category == "Image" and image_files:
                            # This is a bit tricky as unstructured doesn't always map back perfectly in this simple loop
                            # For now, let's just describe the latest image if we're in Image category
                            latest_img = max(image_files, key=os.path.getctime)
                            description = await self._describe_image(str(latest_img))
                            content = f"[Visual Content Description]: {description}"
                        
                        from langchain_core.documents import Document
                        all_docs.append(Document(
                            page_content=content,
                            metadata={"source": filename, "page": el.metadata.page_number if el.metadata.page_number else 0, "type": el.category}
                        ))
            except ImportError:
                print("Unstructured not installed or dependencies missing. Skipping multimodal extraction.")
            except Exception as e:
                print(f"Multimodal extraction error for {filename}: {e}")

        # 1. Initialize BM25 Retriever
        self.bm25_retriever = BM25Retriever.from_documents(all_docs)
        self.bm25_retriever.k = 3 # Number of keyword results

        # 2. FAISS creation with improved batch processing
        batch_size = 50
        vector_store = None
        
        for i in range(0, len(all_docs), batch_size):
            batch = all_docs[i:i + batch_size]
            success = False
            retries = 3
            retry_delay = 5
            
            while not success and retries > 0:
                try:
                    if vector_store is None:
                        vector_store = FAISS.from_documents(batch, self.embeddings)
                    else:
                        vector_store.add_documents(batch)
                    success = True
                except Exception as e:
                    if "429" in str(e):
                        print(f"Rate limited. Waiting {retry_delay}s... (Batch {i//batch_size})")
                        time.sleep(retry_delay)
                        retry_delay *= 2
                        retries -= 1
                    else:
                        raise e
        
        self.vector_store = vector_store
        return vector_store

    def query(self, question: str):
        if not self.vector_store or not self.bm25_retriever:
            raise ValueError("No documents processed. Please upload PDFs first.")

        # Create the Ensemble Retriever (Weighted Hybrid Search)
        ensemble_retriever = EnsembleRetriever(
            retrievers=[
                self.bm25_retriever, 
                self.vector_store.as_retriever(search_kwargs={"k": 5})
            ],
            weights=[0.4, 0.6] # 40% Keyword, 60% Semantic
        )

        qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=ensemble_retriever,
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
