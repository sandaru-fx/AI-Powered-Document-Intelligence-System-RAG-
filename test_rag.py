import asyncio
import os
import sys

# Add root to path
sys.path.append(os.getcwd())

from backend.app.services.rag_service import rag_service

async def test_processing():
    user_id = "test_user_id"
    # Create a dummy pdf if none exists for testing or use an existing one
    upload_dir = "backend/data/uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        
    # Find any pdf in the directory to test
    pdfs = []
    for root, dirs, files in os.walk(upload_dir):
        for file in files:
            if file.endswith(".pdf"):
                pdfs.append(os.path.join(root, file))
    
    if not pdfs:
        print("No PDFs found in backend/data/uploads to test.")
        return

    print(f"Testing processing for: {pdfs[0]}")
    try:
        await rag_service.process_pdfs([pdfs[0]], user_id)
        print("✅ Processing successful!")
    except Exception as e:
        print(f"❌ Processing failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_processing())
