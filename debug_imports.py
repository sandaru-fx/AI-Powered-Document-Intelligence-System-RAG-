try:
    import langchain
    print(f"LangChain version: {langchain.__version__}")
    import langchain.chains
    print("langchain.chains imported successfully")
    from langchain.chains import RetrievalQA
    print("RetrievalQA imported successfully")
except ImportError as e:
    print(f"ImportError: {e}")
except Exception as e:
    print(f"Error: {e}")
