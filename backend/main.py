from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import shutil
from backend.engine import process_document_to_vector_store, create_qa_chain

app = FastAPI(title="AI Document Intelligence API")

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state for simplicity (In production, use a proper session/database)
vector_store = None
qa_chain = None

@app.get("/")
def read_root():
    return {"status": "AI Document Intelligence API is running"}

@app.post("/upload")
async def upload_documents(files: List[UploadFile] = File(...)):
    global vector_store, qa_chain
    
    # Save uploaded files temporarily
    temp_dir = "temp_uploads"
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
        
    uploaded_file_paths = []
    # Mocking the UploadedFile object expected by our engine
    class MockUploadedFile:
        def __init__(self, name, content):
            self.name = name
            self.content = content
        def getvalue(self):
            return self.content

    mock_files = []
    for file in files:
        content = await file.read()
        mock_files.append(MockUploadedFile(file.filename, content))

    try:
        # Step: Process documents
        vector_store = process_document_to_vector_store(mock_files)
        qa_chain = create_qa_chain(vector_store)
        return {"message": f"Successfully processed {len(files)} files", "status": "ready"}
    except Exception as e:
        return {"error": str(e), "status": "error"}

@app.post("/query")
async def query_document(query: str = Form(...)):
    global qa_chain
    if not qa_chain:
        return {"error": "Please upload documents first", "status": "not_ready"}
    
    try:
        # Run RAG chain
        result = qa_chain({"query": query})
        response_text = result["result"]
        source_docs = result["source_documents"]
        
        # Format sources
        sources = []
        for doc in source_docs:
            sources.append({
                "file": doc.metadata.get("source", "Unknown"),
                "page": doc.metadata.get("page", 0) + 1,
                "snippet": doc.page_content[:200] + "..."
            })
            
        return {
            "answer": response_text,
            "sources": sources,
            "status": "success"
        }
    except Exception as e:
        return {"error": str(e), "status": "error"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
