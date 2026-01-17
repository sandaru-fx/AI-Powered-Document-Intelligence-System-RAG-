from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.rag_service import rag_service
import os
import shutil

router = APIRouter()

UPLOAD_DIR = "backend/data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
async def query_documents(request: dict):
    question = request.get("question")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    
    try:
        response = rag_service.query(question)
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
