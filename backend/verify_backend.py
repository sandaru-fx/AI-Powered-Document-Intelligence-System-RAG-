from app.services.rag_service import rag_service
from app.api.v1.endpoints import router
import asyncio

async def test_rag():
    print("Testing RAG Service initialization...")
    print(f"Embeddings: {rag_service.embeddings.model}")
    print(f"LLM: {rag_service.llm.model}")
    print("Backend check complete.")

if __name__ == "__main__":
    asyncio.run(test_rag())
