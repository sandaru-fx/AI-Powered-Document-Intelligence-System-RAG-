# 🤖 AI-Powered Document Intelligence System

An advanced RAG (Retrieval-Augmented Generation) system built with **Python**, **LangChain**, and **Google Gemini 1.5 Flash**. This application allows users to upload multiple PDF documents and engage in a smart conversation based on the document's content.

## 🚀 Key Features

- **Multi-PDF Support**: Upload and analyze multiple documents simultaneously.
- **Smart RAG Logic**: Uses FAISS vector storage and Gemini embeddings for highly accurate retrieval.
- **Premium UI**: Modern dark-themed interface built with Streamlit and custom CSS.
- **Rate Limit Resilience**: Implements strict serial processing and exponential backoff to handle API quotas gracefully.
- **Source Attribution**: See exactly which part of which document was used to generate an answer.
- **Real-time Feedback**: Live progress bar showing document processing status.

## 🛠️ Tech Stack

- **Large Language Model**: Google Gemini 1.5 Flash
- **Embeddings**: Google Text Embedding 004
- **Orchestration**: LangChain
- **Vector Database**: FAISS (Facebook AI Similarity Search)
- **Frontend**: Streamlit
- **Backend Environment**: Python 3.12+

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sandaru-fx/AI-Powered-Document-Intelligence-System-RAG-.git
   cd AI-Powered-Document-Intelligence-System-RAG-
   ```

2. **Create a Virtual Environment**:
   ```bash
   python -m venv venv
   .\venv\Scripts\Activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up Environment Variables**:
   Create a `.env` file in the root directory and add your Google API Key:
   ```env
   GOOGLE_API_KEY=your_api_key_here
   ```

5. **Run the Application**:
   ```bash
   .\run.ps1
   ```

## 🏗️ Architecture

1. **Document Loading**: PDFs are loaded using `PyPDFLoader`.
2. **Text Splitting**: Content is broken into 1000-character chunks with overlap.
3. **Embedding**: Each chunk is converted into a vector using Google's embedding model.
4. **Storage**: Vectors are stored in a FAISS index.
5. **Retrieval**: When a question is asked, the system finds the most relevant chunks.
6. **Generation**: Gemini 1.5 Flash synthesizes an answer using the retrieved context.

## 👤 Author
Developed as a high-tier portfolio project for IT Internship applications.
