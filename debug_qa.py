try:
    from langchain.chains import RetrievalQA
    print("Found in langchain.chains")
except ImportError:
    print("Not found in langchain.chains")

try:
    from langchain_community.chains import RetrievalQA
    print("Found in langchain_community.chains")
except ImportError:
    print("Not found in langchain_community.chains")

import pkg_resources
try:
    dist = pkg_resources.get_distribution("langchain")
    print(f"Pkg Resources Version: {dist.version}")
except:
    pass
