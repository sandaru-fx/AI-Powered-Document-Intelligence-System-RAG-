import streamlit as st
import os
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Page Config
st.set_page_config(page_title="Doc Intelligence RAG", page_icon="🤖", layout="wide")

# Custom CSS for a Premium look
st.markdown("""
<style>
    /* Main Background */
    .stApp {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: #f8fafc;
    }
    
    /* Sidebar styling */
    section[data-testid="stSidebar"] {
        background-color: rgba(30, 41, 59, 0.7) !important;
        backdrop-filter: blur(10px);
        border-right: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    /* Chat Message Styling */
    .stChatMessage {
        background-color: rgba(51, 65, 85, 0.5) !important;
        border-radius: 15px !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        margin-bottom: 15px !important;
        padding: 15px !important;
    }
    
    /* Input Box */
    .stChatInputContainer {
        padding-bottom: 20px !important;
    }
    
    /* Headings */
    h1, h2, h3 {
        color: #38bdf8 !important;
        font-weight: 700 !important;
    }
    
    /* Progress Bar Color */
    .stProgress > div > div > div > div {
        background-color: #38bdf8 !important;
    }

    /* Source Box */
    .source-box {
        background-color: rgba(15, 23, 42, 0.4);
        border-left: 3px solid #38bdf8;
        padding: 8px 12px;
        margin-top: 10px;
        font-size: 0.85rem;
        color: #94a3b8;
    }
</style>
""", unsafe_allow_html=True)

# Application Title
st.title("🤖 AI Document Intelligence")
st.markdown("*Your intelligent companion for PDF analysis and retrieval.*")

# Initialize Session State
if "messages" not in st.session_state:
    st.session_state.messages = []
if "vector_store" not in st.session_state:
    st.session_state.vector_store = None
if "qa_chain" not in st.session_state:
    st.session_state.qa_chain = None

# Sidebar
with st.sidebar:
    st.image("https://cdn-icons-png.flaticon.com/512/4712/4712035.png", width=80)
    st.header("Settings")
    
    # Clear Chat Button
    if st.button("🗑️ Clear Chat History", use_container_width=True):
        st.session_state.messages = []
        st.rerun()
        
    st.markdown("---")
    st.header("📂 Upload Documents")
    uploaded_files = st.file_uploader("Upload PDFs to start", type=['pdf'], accept_multiple_files=True, label_visibility="collapsed")
    
    if uploaded_files:
        if st.session_state.vector_store is None:
            progress_bar = st.progress(0, text="Initializing...")
            status_text = st.empty()
            
            def update_progress(current, total):
                percent = int((current / total) * 100)
                progress_bar.progress(percent, text=f"Processing: {percent}%")
                status_text.text(f"Chunk {current} of {total} processed...")

            try:
                from rag_engine import process_document_to_vector_store, create_qa_chain
                st.session_state.vector_store = process_document_to_vector_store(uploaded_files, progress_callback=update_progress)
                st.session_state.qa_chain = create_qa_chain(st.session_state.vector_store)
                st.success(f"✅ {len(uploaded_files)} Documents Ready!")
                progress_bar.empty()
                status_text.empty()
            except Exception as e:
                st.error(f"❌ Error: {e}")
        else:
            st.info(f"💡 {len(uploaded_files)} documents loaded.")

    st.markdown("---")
    st.markdown("### 🛠️ Built with")
    st.caption("• Google Gemini 1.5 Flash")
    st.caption("• LangChain & FAISS")
    st.caption("• Streamlit")

# Main Interface
# Display chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if "sources" in message:
            with st.expander("Show Sources"):
                for src in message["sources"]:
                    st.markdown(f"<div class='source-box'>{src}</div>", unsafe_allow_html=True)

# User Input
if prompt := st.chat_input("Ask a question about your documents..."):
    # Add user message to history
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # RAG Response
    if st.session_state.qa_chain:
        with st.chat_message("assistant"):
            with st.spinner("Analyzing documents..."):
                try:
                    # Request answer and sources
                    result = st.session_state.qa_chain({"query": prompt})
                    response_text = result["result"]
                    source_docs = result["source_documents"]
                    
                    st.markdown(response_text)
                    
                    # Process sources with page numbers
                    unique_sources = []
                    for doc in source_docs:
                        filename = doc.metadata.get("source", "Unknown")
                        page = doc.metadata.get("page", 0) + 1
                        snippet = doc.page_content[:200] + "..."
                        source_info = f"**File:** {filename}, **Page:** {page}<br>{snippet}"
                        if source_info not in unique_sources:
                            unique_sources.append(source_info)
                    
                    with st.expander("Show Sources"):
                        for src in unique_sources:
                            st.markdown(f"<div class='source-box'>{src}</div>", unsafe_allow_html=True)
                    
                    # Store message with sources
                    st.session_state.messages.append({
                        "role": "assistant", 
                        "content": response_text,
                        "sources": unique_sources
                    })
                except Exception as e:
                    st.error(f"An error occurred: {e}")
    else:
        with st.chat_message("assistant"):
            st.warning("Please upload a PDF document in the sidebar first!")
