from langgraph_state import State
from langgraph_node import *

from langgraph.graph import StateGraph, START, END
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_ollama import ChatOllama
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_teddynote.retrievers import KiwiBM25Retriever

import os
import chromadb
from functools import partial
from dotenv import load_dotenv


class GraphBuilder():

    def __init__(self):
        load_dotenv(r"D:\SKN04-FINAL-4Team-1\rag_app\.env")
        self.graph_builder = StateGraph(State)
        self.__init_retriver()
        self.__init_models()
        self.__add_nodes_to_graph()
        self.__add_edges_to_graph()


    def __init_retriver(self):
        host = os.environ.get('CHROMA_DB_HOST')
        port = os.environ.get('CHROMA_DB_PORT')
        self.chroma_client = chromadb.HttpClient(host=host, port=port)
        em = OpenAIEmbeddings(model="text-embedding-3-small")
        self.law_db = Chroma(collection_name='law', client=self.chroma_client,embedding_function=em)
        self.law_retriever = self.law_db.as_retriever(
            search_kwargs={"k": 4},
        )
        documents = [Document(page_content=doc) for doc in self.law_db._collection.get().get("documents")]
        ## 현재 문서가많아 bm25 검색기 만드는데 시간이 3~4분정도 가량 걸림
        self.bm25_retriever = KiwiBM25Retriever.from_documents(documents[:2])
        self.bm25_retriever.k = 3
        self.manual_retriever = None

    def __init_models(self):
        self.rewriter_llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0)
        self.routing_llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0)
        ## 모델이 올라마에 정상적으로 올라가있는지 확인하기
        self.final_llm = ChatOllama(model="qa_v4:latest", num_thread=12, top_k=5, repeat_penalty=1.2, temperature=0.1, num_predict=254) 

    def __add_nodes_to_graph(self):
        nodes = {
            "RewriteQuery": (rewrite_query, {"llm": self.rewriter_llm}),
            "RouteDomain": (route_query, {"llm": self.routing_llm}),
            "RetrieveLaw": (
                retrieve_document_law,
                {"law_retriever": self.law_retriever, "bm25_retriever": self.bm25_retriever}
            ),
            "RetrieveManual": (
                retrieve_document_manual,
                {"manual_retriever": self.manual_retriever, "bm25_retriever": self.bm25_retriever}
            ),
            "LLM": (call_model, {"llm": self.final_llm}),
        }

        for node_name, (func, kwargs) in nodes.items():
            self.graph_builder.add_node(node_name, partial(func, **kwargs))

    def __add_edges_to_graph(self):
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