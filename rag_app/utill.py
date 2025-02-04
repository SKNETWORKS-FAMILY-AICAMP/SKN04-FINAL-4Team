import numpy as np


class ChromaEmbeddingFunction:
    """
    ChromaDB에서 요구하는 EmbeddingFunction 래퍼 클래스
    (LangChain의 HuggingFaceEmbeddings와 호환)
    """
    def __init__(self, hf_embedding):
        self.hf_embedding = hf_embedding
    
    def embed_documents(self, texts):
        embeddings = self.hf_embedding.embed_documents(texts)
        return [np.array(emb) for emb in embeddings]
    
    def embed_query(self, text):
        embedding = self.hf_embedding.embed_query(text)
        return np.array(embedding)