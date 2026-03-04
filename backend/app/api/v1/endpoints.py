from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import StreamingResponse
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

class UpdateSessionTitle(BaseModel):
    title: str

@router.post("/upload")
async def upload_documents(
    files: list[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.id
    temp_dir = os.path.join(UPLOAD_DIR, str(user_id)) 
    os.makedirs(temp_dir, exist_ok=True)
    
    # Validation constants
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS = {".pdf"}

    file_paths = []
    try:
        # Pre-validate all files before processing any
        for file in files:
            # 1. Validate Extension
            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(status_code=400, detail=f"File {file.filename} is not a PDF.")

            # 2. Validate Size
            file.file.seek(0, 2)
            file_size = file.file.tell()
            file.file.seek(0)
            if file_size > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail=f"File {file.filename} exceeds 10MB limit.")

        # If all valid, save and log
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

@router.get("/documents")
async def get_documents(current_user: dict = Depends(get_current_user)):
    """Returns the authenticated user's recently uploaded documents."""
    try:
        user_id = current_user.id
        res = supabase.table("documents") \
            .select("id, filename, size_bytes, created_at") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(10) \
            .execute()
        return res.data
    except Exception as e:
        logger.warning(f"Failed to fetch documents for user: {e}")
        # Return empty list instead of crashing — the feature is non-critical
        return []

@router.post("/query")
async def query_documents(
    request: QueryRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        user_id = current_user.id
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

@router.post("/query/stream")
async def query_documents_stream(
    request: QueryRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        user_id = current_user.id
        
        # Log User message to Supabase immediately
        if request.session_id:
            supabase.table("chat_messages").insert({
                "session_id": request.session_id,
                "role": "user",
                "content": request.question
            }).execute()

        async def event_generator():
            full_answer = ""
            sources = []
            
            async for chunk_json in rag_service.stream_query(user_id, request.question):
                chunk = json.loads(chunk_json)
                if chunk["type"] == "token":
                    full_answer += chunk["content"]
                    yield f"data: {chunk_json}\n\n"
                elif chunk["type"] == "sources":
                    sources = chunk["content"]
                    yield f"data: {chunk_json}\n\n"
            
            # Log Assistant message to Supabase after stream finishes
            if request.session_id and full_answer:
                supabase.table("chat_messages").insert({
                    "session_id": request.session_id,
                    "role": "assistant",
                    "content": full_answer,
                    "sources": sources
                }).execute()

        return StreamingResponse(event_generator(), media_type="text/event-stream")
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

@router.get("/sessions")
async def get_sessions(current_user: dict = Depends(get_current_user)):
    """Returns all chat sessions for the authenticated user."""
    try:
        user_id = current_user.id
        res = supabase.table("chat_sessions") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .execute()
        return res.data
    except Exception as e:
        logger.error(f"Failed to fetch sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/sessions/{session_id}")
async def update_session_title(
    session_id: str,
    request: UpdateSessionTitle,
    current_user: dict = Depends(get_current_user)
):
    """Updates the title of a specific chat session."""
    try:
        user_id = current_user.id
        res = supabase.table("chat_sessions") \
            .update({"title": request.title}) \
            .eq("id", session_id) \
            .eq("user_id", user_id) \
            .execute()
        return res.data
    except Exception as e:
        logger.error(f"Failed to update session title: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Deletes a chat session and all its messages."""
    try:
        user_id = current_user.id
        # Messages will be deleted automatically due to ON DELETE CASCADE
        res = supabase.table("chat_sessions") \
            .delete() \
            .eq("id", session_id) \
            .eq("user_id", user_id) \
            .execute()
        return {"status": "success", "message": "Session deleted"}
    except Exception as e:
        logger.error(f"Failed to delete session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compare")
async def compare_documents(
    request: CompareRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        user_id = current_user.id
        response = rag_service.compare_documents(
            user_id=user_id, 
            filenames=request.filenames, 
            aspect=request.aspect
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/{session_id}")
async def export_report(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generates a professional PDF report of the chat session."""
    from fastapi.responses import StreamingResponse
    from backend.app.utils.reporting import generate_session_report
    
    try:
        user_id = current_user.id
        user_email = current_user.email
        
        # Fetch session title and history (ensure user owns the session)
        session_res = supabase.table("chat_sessions") \
            .select("title") \
            .eq("id", session_id) \
            .eq("user_id", user_id) \
            .single() \
            .execute()
            
        res = supabase.table("chat_messages") \
            .select("*") \
            .eq("session_id", session_id) \
            .order("created_at") \
            .execute()
        
        messages = res.data
        title = session_res.data.get("title") if session_res.data else "Research Report"
        
        pdf_buffer = generate_session_report(title, messages, user_email=user_email)
        
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Research_Report_{session_id[:8]}.pdf"}
        )
    except Exception as e:
        logger.error(f"Export failed for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/files/{filename}")
async def get_file(
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Serves an uploaded PDF file securely."""
    import os
    from fastapi.responses import FileResponse
    
    user_id = current_user.id
    file_path = f"backend/data/uploads/{user_id}/{filename}"
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found or access denied.")
    
    return FileResponse(file_path)
