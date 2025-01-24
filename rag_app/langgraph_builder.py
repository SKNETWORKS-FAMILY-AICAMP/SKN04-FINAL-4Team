from langgraph_state import State
from langgraph_node import *

from langgraph.graph import StateGraph, START, END
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_ollama import ChatOllama
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_teddynote.retrievers import KiwiBM25Retriever
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.retrievers import EnsembleRetriever
import os
import chromadb
import torch
from functools import partial
from dotenv import load_dotenv

from utill import ChromaEmbeddingFunction

class GraphBuilder():

    def __init__(self):
        load_dotenv()
        self.graph_builder = StateGraph(State)
        self.__init_retriver()
        self.__init_models()
        self.__add_nodes_to_graph()
        self.__add_edges_to_graph()

    def __init_retriver(self):
        host = os.environ.get('CHROMA_DB_HOST')
        port = os.environ.get('CHROMA_DB_PORT')
        self.chroma_client = chromadb.HttpClient(host=host, port=port)
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"현재 디바이스: {device}")
        embedding_model = "nlpai-lab/KURE-v1"
        print(f'임베딩 모델 로드: {embedding_model}')
        base_embeddings = HuggingFaceEmbeddings(
            model_name=embedding_model,
            model_kwargs={'device': device},
            encode_kwargs={'device': device, 'batch_size': 100}
        )
        embedding_function = ChromaEmbeddingFunction(base_embeddings)
        top_k = 5
        print(f'크로마 리트리버 생성중...')
        self.law_db = Chroma(collection_name='full_law_db', client=self.chroma_client,embedding_function=embedding_function)
        self.law_retriever = self.law_db.as_retriever(
            search_kwargs={"k": top_k},
        )
        self.manual_db = Chroma(collection_name='manual_db', client=self.chroma_client,embedding_function=embedding_function)
        self.manual_retriever = self.manual_db.as_retriever(
            search_kwargs={"k": top_k},
        )
        print(f'크로마 리트리버 생성완료.')

        print("BM25 리트리버 생성중...")
        documents = [Document(page_content=doc) for doc in self.law_db._collection.get().get("documents")]
        ## 현재 문서가많아 bm25 검색기 만드는데 시간이 3~4분정도 가량 걸림
        self.bm25_law_retriever = KiwiBM25Retriever.from_documents(documents)
        self.bm25_law_retriever.k = top_k
        documents = [Document(page_content=doc) for doc in self.manual_db._collection.get().get("documents")]
        self.bm25_manual_retriever = KiwiBM25Retriever.from_documents(documents)
        self.bm25_manual_retriever.k = top_k
        print("BM25 리트리버 생성완료.")
        law_weight = 0.7
        law_bm25_weight = 0.3

        self.law_ensemble_retriever = EnsembleRetriever(
            retrievers=[self.law_retriever, self.bm25_law_retriever],
            weights=[law_weight, law_bm25_weight],
        )

        self.manual_ensemble_retriever = EnsembleRetriever(
            retrievers=[self.bm25_law_retriever, self.bm25_manual_retriever],
            weights=[law_weight, law_bm25_weight],
        )


    def __init_models(self):
        print("모델 로드중...")
        self.rewriter_llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0)
        self.routing_llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0)
        ## 모델이 올라마에 정상적으로 올라가있는지 확인하기
        self.final_llm = ChatOllama(model="qa_law_v1:latest", num_thread=12, top_k=5, repeat_penalty=1.2, temperature=0.1, num_predict=254) 
        print("모델 로드완료")

    def __add_nodes_to_graph(self):
        print("그래프 노드 생성")
        nodes = {
            "RewriteQuery": (rewrite_query, {"llm": self.rewriter_llm}),
            "RouteDomain": (route_query, {"llm": self.routing_llm}),
            "RetrieveLaw": (
                ensemble_retriever,
                {"retriever": self.law_ensemble_retriever}
            ),
            "RetrieveManual": (
                ensemble_retriever,
                {"retriever": self.law_ensemble_retriever}
            ),
            "LLM": (call_model, {"llm": self.final_llm}),
        }

        for node_name, (func, kwargs) in nodes.items():
            self.graph_builder.add_node(node_name, partial(func, **kwargs))

    def __add_edges_to_graph(self):
        print("그래프 엣지 생성")
        edges = [
            (START, "RewriteQuery"),
            ("RewriteQuery", "RouteDomain"), 
            ("RetrieveLaw", "LLM"),
            ("RetrieveManual", "LLM"),
            ("LLM", END)
        ]
        conditional_edges = [
            ("RouteDomain", domain_condition, {"law": "RetrieveLaw", "manual": "RetrieveManual"}),
        ]

        for fr, to in edges:
            self.graph_builder.add_edge(fr, to)

        for fr, cond_fn, branch_map in conditional_edges:
            self.graph_builder.add_conditional_edges(
                fr,
                cond_fn,
                branch_map
            )