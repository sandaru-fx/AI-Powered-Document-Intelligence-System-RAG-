import streamlit as st
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Page Config
st.set_page_config(page_title="Doc Intelligence RAG", page_icon="📝", layout="wide")

# Custom CSS for modern UI
st.markdown("""
<style>
    .stChatMessage {
        border-radius: 10px;
        padding: 10px;
        margin-bottom: 10px;
    }
</style>
""", unsafe_allow_html=True)

# Application Title
st.title("🤖 AI-Powered Document Intelligence System")
st.markdown("Upload a PDF and ask questions about its content.")

# Sidebar - Step 11
with st.sidebar:
    st.header("📂 Document Upload")
    uploaded_file = st.file_uploader("Upload your PDF here", type=['pdf'])
    
    st.markdown("---")
    st.markdown("### How it works:")
    st.markdown("1. Upload a PDF.")
    st.markdown("2. The system reads and 'memorizes' it.")
    st.markdown("3. Ask questions in the chat!")
    
    # Processing Logic
    if uploaded_file:
        if "vector_store" not in st.session_state:
            with st.spinner("Processing Document..."):
                try:
                    from rag_engine import process_document_to_vector_store, create_qa_chain
                    st.session_state.vector_store = process_document_to_vector_store(uploaded_file)
                    st.session_state.qa_chain = create_qa_chain(st.session_state.vector_store)
                    st.success("Document Processed Successfully!")
                except Exception as e:
                    st.error(f"Error processing document: {e}")
        else:
             st.info("Document loaded. Ready to chat!")

# Session State - Step 13
if "messages" not in st.session_state:
    st.session_state.messages = []

# Chat Interface - Step 12
# Display chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# User Input
if prompt := st.chat_input("Ask something about your document..."):
    # Add user message to history
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # RAG Response
    if "qa_chain" in st.session_state:
        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                response = st.session_state.qa_chain.run(prompt)
                st.markdown(response)
        st.session_state.messages.append({"role": "assistant", "content": response})
    else:
        with st.chat_message("assistant"):
            st.markdown("Please upload a document first!")
