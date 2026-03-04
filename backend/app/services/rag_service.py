import os
import asyncio
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
from langchain_core.documents import Document
import shutil
from dotenv import load_dotenv

load_dotenv()

class RAGService:
    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        self.llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
        # Store vector stores by user_id
        self.user_vector_stores = {}
        self.user_bm25_retrievers = {}
        self.index_dir = os.path.join("backend", "data", "vector_index")
        os.makedirs(self.index_dir, exist_ok=True)

    async def _describe_image(self, image_path: str):
        """Uses Gemini Vision to describe an extracted image/chart/table."""
        try:
            with open(image_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode("utf-8")
            
            # Specialized technical prompt for research document visuals
            prompt = """
            Analyze the provided image from a technical document. 
            Identify the element type (Chart, Diagram, Table, Figure).
            
            Extract technical data:
            1. If it's a chart/graph: Identify axes (X/Y), legends, data points, and clearly state the overall trend or conclusion.
            2. If it's a table: Summarize the key data and rows/columns.
            3. If it's a diagram: Describe the flow, components, and relationships.
            
            Provide a comprehensive textual description that can be used for semantic search.
            """
            
            message = HumanMessage(
                content=[
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_data}"},
                    },
                ]
            )
            response = self.llm.invoke([message])
            return response.content
        except Exception as e:
            print(f"Vision error: {e}")
            return ""

    async def process_pdfs(self, file_paths: list[str], user_id: str):
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


            # --- Multimodal Extraction (Elite AI Researcher Mode using PyPDF) ---
            try:
                print(f"Starting Multimodal Extraction for {filename}...")
                extract_dir = os.path.join("backend/data/extracted", filename.replace(" ", "_"))
                os.makedirs(extract_dir, exist_ok=True)
                
                # Using the existing 'loader' (PyPDFLoader) to access the underlying pdf reader
                from pypdf import PdfReader
                reader = PdfReader(file_path)
                img_count = 0
                
                for page_index, page in enumerate(reader.pages):
                    if img_count >= 15: break # Global limit per doc
                    
                    # Check for images on the page
                    if "/Resources" in page and "/XObject" in page["/Resources"]:
                        xObject = page["/Resources"]["/XObject"].get_object()
                        
                        for obj in xObject:
                            if xObject[obj]["/Subtype"] == "/Image":
                                if img_count >= 15: break
                                
                                z = xObject[obj]
                                data = z.get_data()
                                # Filter small icons (<10KB)
                                if len(data) < 10000: continue
                                
                                ext = ".png" if z["/ColorSpace"] == "/DeviceRGB" else ".jpg"
                                image_filename = f"image_p{page_index+1}_{img_count}{ext}"
                                image_path = os.path.join(extract_dir, image_filename)
                                
                                with open(image_path, "wb") as f:
                                    f.write(data)
                                
                                # Describe with Gemini
                                description = await self._describe_image(image_path)
                                if description:
                                    all_docs.append(Document(
                                        page_content=f"[VISUAL SOURCE - {filename}, Page {page_index+1}]: {description}",
                                        metadata={
                                            "source": filename, 
                                            "page": page_index + 1, 
                                            "type": "visual_element"
                                        }
                                    ))
                                    img_count += 1
                                    print(f"Analyzed visual element {img_count} from {filename} page {page_index+1}")

                print(f"Successfully extracted and indexed {img_count} visual elements from {filename}")
                
                # Clean up
                if os.path.exists(extract_dir):
                    shutil.rmtree(extract_dir)

            except Exception as e:
                print(f"Multimodal extraction alert (continuing with text-only) for {filename}: {e}")

        if not all_docs:
            print(f"No documents extracted from files: {file_paths}")
            return None

        # 2. FAISS creation with improved batch processing
        batch_size = 50
        vector_store = None
        
        print(f"Processing {len(all_docs)} document chunks...")
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
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2
                        retries -= 1
                    else:
                        raise e
        
        if vector_store:
            self.user_vector_stores[user_id] = vector_store
            
            # Save FAISS index
            user_index_path = os.path.join(self.index_dir, str(user_id))
            vector_store.save_local(user_index_path)
            
            # 1. Initialize BM25 Retriever for the user
            self.user_bm25_retrievers[user_id] = BM25Retriever.from_documents(all_docs)
            self.user_bm25_retrievers[user_id].k = 3 # Number of keyword results
        
        return vector_store

    def query(self, question: str, user_id: str):
        vector_store = self.user_vector_stores.get(user_id)
        
        if not vector_store:
            # Try loading from disk
            user_index_path = os.path.join(self.index_dir, str(user_id))
            if os.path.exists(user_index_path):
                print(f"Loading vector store for user {user_id} from disk...")
                vector_store = FAISS.load_local(
                    user_index_path, 
                    self.embeddings, 
                    allow_dangerous_deserialization=True
                )
                self.user_vector_stores[user_id] = vector_store
            else:
                raise ValueError("No documents processed for this user. Please upload PDFs first.")

        bm25_retriever = self.user_bm25_retrievers.get(user_id)
        
        # If BM25 is missing (e.g. after restart), we fallback to pure Vector Search
        # or we could implement doc persistence to rebuild it.
        # For now, let's use FAISS if BM25 is missing.
        if not bm25_retriever:
            print(f"BM25 retriever missing for user {user_id}, using FAISS only.")
            retriever = vector_store.as_retriever(search_kwargs={"k": 5})
        else:
            # Create the Ensemble Retriever (Weighted Hybrid Search)
            retriever = EnsembleRetriever(
                retrievers=[
                    bm25_retriever, 
                    vector_store.as_retriever(search_kwargs={"k": 5})
                ],
                weights=[0.4, 0.6] # 40% Keyword, 60% Semantic
            )

        qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True
        )
        
        result = qa_chain.invoke({"query": question})
        return {
            "answer": result["result"],
            "sources": [
                {
                    "content": doc.page_content,
                    "metadata": {
                        **doc.metadata,
                        # Normalize PyPDFLoader's 0-indexed page to 1-indexed
                        "page": doc.metadata.get("page", 0) + 1
                    }
                }
                for doc in result["source_documents"]
            ]
        }

    def compare_documents(self, user_id: str, filenames: list[str], aspect: str = "general"):
        """Specialized logic for cross-document analysis."""
        vector_store = self.user_vector_stores.get(user_id)
        if not vector_store:
            raise ValueError("No vector store found for user.")

        # Filter documents by filenames if provided
        # Note: FAISS filtering can be tricky, typically done via metadata
        filter_dict = {"source": filenames}
        
        # We manually query for related snippets across these specific files
        comparison_prompt = f"""
        Analyze the following documents: {', '.join(filenames)}.
        Focus specifically on: {aspect}.
        
        Identify:
        1. Key similarities / Consensus points.
        2. Significant contradictions or differing viewpoints.
        3. Unique insights found in only one of the documents.
        
        Structure your response with clear headings and bullet points.
        """
        
        # We use a retriever with filtering
        retriever = vector_store.as_retriever(
            search_kwargs={"k": 10, "filter": {"source": {"$in": filenames}}}
        )
        
        qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True
        )
        
        result = qa_chain.invoke({"query": comparison_prompt})
        return {
            "analysis": result["result"],
            "sources": [
                {
                    "content": doc.page_content,
                    "metadata": {
                        **doc.metadata,
                        # Normalize PyPDFLoader's 0-indexed page to 1-indexed
                        "page": doc.metadata.get("page", 0) + 1
                    }
                }
                for doc in result["source_documents"]
            ]
        }

rag_service = RAGService()
