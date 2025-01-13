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
from langgraph_utill import *


load_dotenv('./.env',verbose=True)

# 프로젝트 이름을 입력합니다.
logging.langsmith("qa_langgraph")

db_embedding = HuggingFaceEmbeddings(model_name="jhgan/ko-sroberta-multitask")
loader = PyPDFLoader('2023년_하반기_법령해석사례집(웹용).pdf')
documents = loader.load()

db_chroma = Chroma.from_documents(
    documents=documents,
    embedding=db_embedding,
    collection_name='law',
    persist_directory='./db'
)
# db_chroma = Chroma(persist_directory="./db", collection_name='law', embedding_function=db_embedding)

# as_retriever
retriever_chroma = db_chroma.as_retriever(
    search_type="similarity_score_threshold", search_kwargs={"k": 4, "score_threshold": 0.8}
)

# retriever_chroma = db_chroma.as_retriever(
#     search_type="mmr", search_kwargs={"k": 4, 'fetch_k':8, "lambda_mult": 0.7}
# )

llm = ChatOllama(model="qa_v4:latest", num_thread=12, top_k=5)


# 메모리 저장소 생성
memory = MemorySaver()
# 그래프 생성
graph_builder = StateGraph(State)

# 노드 이름, 함수 혹은 callable 객체를 인자로 받아 노드를 추가
graph_builder.add_node("Rewrite_Query", query_rewrite)
graph_builder.add_node("Retrieve", retrieve_document)
graph_builder.add_node("LLM", call_model)

# graph_builder.add_edge(START, "Rewrite_Query")
graph_builder.add_edge('Rewrite_Query', 'Retrieve')
graph_builder.add_edge('Retrieve', 'LLM')
# graph_builder.add_conditional_edges(
#     "LLM",
#     hallucination_check,
#     {
#         "hallucination": "LLM",  # Hallucination 발생 시 재생성
#         "fact": END,  # 답변의 관련성 여부 통과
#     },
# )
graph_builder.add_edge("LLM", END)
graph_builder.set_entry_point('Rewrite_Query')
graph = graph_builder.compile(checkpointer=memory)

visualize_graph(graph)