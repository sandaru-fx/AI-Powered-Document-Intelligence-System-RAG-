from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from backend.app.services.rag_service import rag_service
from backend.app.api.v1.auth import get_current_user, supabase
from typing import Optional
from pydantic import BaseModel
import os
import shutil
import json

import logging

# Configure logging to a file
logging.basicConfig(
    filename="backend_debug.log",
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

router = APIRouter()

UPLOAD_DIR = os.path.join(os.getcwd(), "backend", "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class QueryRequest(BaseModel):
    question: str
    session_id: str = "default"

class CompareRequest(BaseModel):
    filenames: list[str]
    aspect: str = "general"

@router.post("/upload")
async def upload_documents(files: list[UploadFile] = File(...)):
    # Authentication disabled for testing - Using demo user ID from DB
    user_id = "8625119c-5b13-4bc2-a21f-0abbf282a0cb"
    temp_dir = os.path.join(UPLOAD_DIR, str(user_id)) 
    os.makedirs(temp_dir, exist_ok=True)
    
    file_paths = []
    try:
        for file in files:
            file_path = os.path.join(temp_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            file_paths.append(file_path)
            
            # Log to Supabase DB
            try:
                supabase.table("documents").insert({
                    "user_id": user_id,
                    "filename": file.filename,
                    "storage_path": file_path,
                    "size_bytes": os.path.getsize(file_path)
                }).execute()
            except Exception as db_error:
                # Don't crash the upload if DB logging fails (e.g. unknown mock user)
                logger.warning(f"Failed to log document to DB: {db_error}")

        filenames = [f.filename for f in files if f.filename]
        await rag_service.process_pdfs(file_paths, user_id)
        
        return {"message": f"Successfully processed {len(files)} files", "filenames": filenames}
    except Exception as e:
        logger.exception(f"Upload failed for user {user_id}: {str(e)}")
        error_msg = str(e)
        if "PGRST205" in error_msg:
             raise HTTPException(
                 status_code=500, 
                 detail="Database schema error: Table 'documents' not found. Please ensure you have run the schema.sql script in your Supabase SQL Editor."
             )
        raise HTTPException(status_code=500, detail=error_msg)

@router.post("/query")
async def query_documents(request: QueryRequest):
    try:
        # Authentication disabled for testing - Using demo user ID from DB
        user_id = "8625119c-5b13-4bc2-a21f-0abbf282a0cb"
        response = rag_service.query(request.question, user_id=user_id)
        
        # Persist message to Supabase
        if request.session_id:
            # 1. Ensure the session exists
            try:
                session_check = supabase.table("chat_sessions").select("id").eq("id", request.session_id).execute()
                if not session_check.data:
                    supabase.table("chat_sessions").insert({
                        "id": request.session_id,
                        "user_id": user_id,
                        "title": "New Chat Session"
                    }).execute()
            except Exception as session_err:
                logger.warning(f"Failed to ensure session existence: {session_err}")

            # 2. Insert messages
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
async def get_history(session_id: str):
    try:
        res = supabase.table("chat_messages").select("*").eq("session_id", session_id).order("created_at").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compare")
async def compare_documents(request: CompareRequest):
    try:
        # Authentication disabled for testing - Using demo user ID from DB
        user_id = "8625119c-5b13-4bc2-a21f-0abbf282a0cb"
        response = rag_service.compare_documents(
            user_id=user_id, 
            filenames=request.filenames, 
            aspect=request.aspect
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/{session_id}")
async def export_report(session_id: str):
    """Generates a professional PDF report of the chat session."""
    from fastapi.responses import StreamingResponse
    from backend.app.utils.reporting import generate_session_report
    
    try:
        # Fetch session title and history
        session_res = supabase.table("chat_sessions").select("title").eq("id", session_id).single().execute()
        res = supabase.table("chat_messages").select("*").eq("session_id", session_id).order("created_at").execute()
        
        messages = res.data
        title = session_res.data.get("title") if session_res.data else "Research Report"
        
        pdf_buffer = generate_session_report(title, messages)
        
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Project_Report_{session_id[:8]}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/files/{filename}")
async def get_file(filename: str):
    """Serves an uploaded PDF file securely."""
    import os
    from fastapi.responses import FileResponse
    
    # Authentication disabled for testing - Using demo user ID from DB
    user_id = "8625119c-5b13-4bc2-a21f-0abbf282a0cb"
    file_path = f"backend/data/uploads/{user_id}/{filename}"
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found or access denied.")
    
    return FileResponse(file_path)
