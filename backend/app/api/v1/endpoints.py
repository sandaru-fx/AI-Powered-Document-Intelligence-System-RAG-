from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.rag_service import rag_service
from pydantic import BaseModel
import os
import shutil
import json

router = APIRouter()

UPLOAD_DIR = "backend/data/uploads"
HISTORY_FILE = "backend/data/history.json"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)

class QueryRequest(BaseModel):
    question: str
    session_id: str = "default"

def save_history(session_id, question, answer):
    history = {}
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r") as f:
                history = json.load(f)
        except:
            history = {}
    
    if session_id not in history:
        history[session_id] = []
    
    history[session_id].append({
        "question": question,
        "answer": answer,
        "timestamp": os.path.getmtime(HISTORY_FILE) if os.path.exists(HISTORY_FILE) else 0 # Simple timestamp
    })
    
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=4)

@router.post("/upload")
async def upload_documents(files: list[UploadFile] = File(...)):
    file_paths = []
    for file in files:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_paths.append(file_path)
    
    try:
        await rag_service.process_pdfs(file_paths)
        return {"message": f"Successfully processed {len(files)} files."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def query_documents(request: QueryRequest):
    try:
        response = rag_service.query(request.question)
        save_history(request.session_id, request.question, response["answer"])
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{session_id}")
async def get_history(session_id: str):
    if not os.path.exists(HISTORY_FILE):
        return []
    
    try:
        with open(HISTORY_FILE, "r") as f:
            history = json.load(f)
        return history.get(session_id, [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
