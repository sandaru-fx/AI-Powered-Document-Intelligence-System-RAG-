from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.services.rag_service import rag_service
from app.api.v1.auth import get_current_user, supabase
from typing import Optional
from pydantic import BaseModel
import os
import shutil
import json

router = APIRouter()

UPLOAD_DIR = "backend/data/uploads" # This will be modified per user in the upload endpoint
os.makedirs(UPLOAD_DIR, exist_ok=True)

class QueryRequest(BaseModel):
    question: str
    session_id: str = "default"

@router.post("/upload")
async def upload_documents(files: list[UploadFile] = File(...), user = Depends(get_current_user)):
    user_id = user.id
    temp_dir = os.path.join(UPLOAD_DIR, str(user_id)) # Use user_id to create a user-specific directory
    os.makedirs(temp_dir, exist_ok=True)
    
    file_paths = []
    try:
        for file in files:
            file_path = os.path.join(temp_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            file_paths.append(file_path)
            
            # Log to Supabase DB
            supabase.table("documents").insert({
                "user_id": user_id,
                "filename": file.filename,
                "storage_path": file_path,
                "size_bytes": os.path.getsize(file_path)
            }).execute()

        await rag_service.process_pdfs(file_paths, user_id=user_id)
        return {"message": f"Successfully processed {len(files)} files", "filenames": [f.filename for f in files]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def query_documents(request: QueryRequest, user: dict = Depends(get_current_user)):
    try:
        user_id = user.id
        response = rag_service.query(request.question, user_id=user_id)
        
        # Persist message to Supabase
        if request.session_id:
            supabase.table("chat_messages").insert({
                "session_id": request.session_id,
                "role": "user",
                "content": request.question
            }).execute()
            
            supabase.table("chat_messages").insert({
                "session_id": request.session_id,
                "role": "assistant",
                "content": response["answer"],
                "sources": response["sources"]
            }).execute()
            
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{session_id}")
async def get_history(session_id: str, user: dict = Depends(get_current_user)):
    try:
        res = supabase.table("chat_messages").select("*").eq("session_id", session_id).order("created_at").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
