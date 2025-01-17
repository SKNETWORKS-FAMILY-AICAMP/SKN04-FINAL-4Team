import os
from typing import List
from langgraph.graph import StateGraph
from langchain_huggingface import HuggingFaceEndpoint
from langchain_community.llms.huggingface_pipeline import HuggingFacePipeline
from langchain_community.llms import Llamafile
from transformers import AutoModelForCausalLM, AutoTokenizer
from langchain_community.llms import Ollama
from langchain_ollama.llms import OllamaLLM
from langchain_ollama import ChatOllama
from langgraph.graph import StateGraph, START, END
from langchain_core.tools import tool
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages
from langchain_core.messages import AIMessageChunk, HumanMessage
from langchain_teddynote.graphs import visualize_graph
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_teddynote.messages import stream_graph, random_uuid
from typing import Literal
from langchain_core.runnables import RunnableConfig
from langchain_teddynote.tools.tavily import TavilySearch
from langchain_community.retrievers import TavilySearchAPIRetriever
from langchain_openai import ChatOpenAI
from langchain_chroma import Chroma
from langchain.embeddings import SentenceTransformerEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain.retrievers import BM25Retriever
from chromadb.utils import embedding_functions
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain.llms import HuggingFaceHub
from langchain_huggingface import HuggingFaceEndpoint
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
from langchain_teddynote import logging
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import OpenAIEmbeddings
from langgraph_utill import *
from functools import partial
import chromadb
import pandas as pd
from tqdm import tqdm
from bs4 import BeautifulSoup
from langchain_core.documents import Document
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings


load_dotenv('./.env',verbose=True)

# 프로젝트 이름을 입력합니다.
logging.langsmith("qa_langgraph")

chroma_client = chromadb.HttpClient(host='44.223.22.232', port=8000)
em = OpenAIEmbeddings(model="text-embedding-3-small")
law_db = Chroma(collection_name='law', client=chroma_client,embedding_function=em)

law_retriever = law_db.as_retriever(
    search_kwargs={"k": 4},  # 상위 3개 문서를 가져옴
)

documents = [Document(page_content=doc) for doc in law_db._collection.get().get("documents")]

bm25_retriever = BM25Retriever.from_documents(documents)
bm25_retriever.k = 3  # BM25에서 상위 3개 문서를 가져옴

law_retriever = law_retriever
manual_retriever = ...


final_prompt = """
Context:
{context}

User question: {question}

Answer:
"""

final_llm = ChatOllama(model="cqmodel:latest", num_thread=12, top_k=5) 

memory = MemorySaver()
graph_builder = StateGraph(State)

# 노드 등록 (Rewrite -> Domain -> Retrieve -> LLM -> END)

graph_builder.add_node(
    "RewriteQuery",
    partial(query_rewrite_llm)
)

graph_builder.add_node(
    "RouteDomain",
    partial(route_domain_llm)
)

graph_builder.add_node(
    "RetrieveLaw",
    partial(retrieve_document_law, law_retriever=law_retriever, bm25_retriever=bm25_retriever)
)

graph_builder.add_node(
    "RetrieveManual",
    partial(retrieve_document_manual, manual_retriever=manual_retriever, bm25_retriever=bm25_retriever)
)

graph_builder.add_node(
    "LLM",
    partial(call_model, prompt=final_prompt, llm=final_llm)
)

graph_builder.add_edge("RewriteQuery", "RouteDomain")

graph_builder.add_conditional_edges(
    "RouteDomain",
    domain_condition,
    {
        "law": "RetrieveLaw",
        "manual": "RetrieveManual"
    }
)

graph_builder.add_edge("RetrieveLaw", "LLM")
graph_builder.add_edge("RetrieveManual", "LLM")
graph_builder.add_edge("LLM", END)

graph_builder.set_entry_point("RewriteQuery")
graph = graph_builder.compile(checkpointer=memory)

config = RunnableConfig(
    recursion_limit=10,  # 최대 10개의 노드까지 방문. 그 이상은 RecursionError 발생
    configurable={"thread_id": "6344"},  # 스레드 ID 설정
)

inputs = State(question="관세법 제89조는 어떤 법이야?")

prev_node = ""
node_names = ["RewriteQuery", "RouteDomain", "RetrieveLaw", "RetrieveManual", "LLM"]
for chunk_msg, metadata in graph.stream(inputs, config, stream_mode="messages"):
    curr_node = metadata["langgraph_node"]
    # print(curr_node)
    # node_names가 비어있거나 현재 노드가 node_names에 있는 경우에만 처리
    
    if not node_names or curr_node in node_names:
        # 콜백 함수가 있는 경우 실행
        # if callback:
        #     callback({"node": curr_node, "content": chunk_msg.content})
        # 콜백이 없는 경우 기본 출력
        
        # if curr_node == "RewriteQuery":
        #     print(chunk_msg.content, end="")

            # 노드가 변경된 경우에만 구분선 출력
        if curr_node != prev_node:
            print("\n" + "=" * 50)
            print(f"🔄 Node: \033[1;36m{curr_node}\033[0m 🔄")
            print("- " * 25)
        print(chunk_msg.content, end="", flush=True)

        prev_node = curr_node