from langgraph.graph import StateGraph
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages
from langchain_core.messages import AIMessageChunk, HumanMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv


load_dotenv('./.env',verbose=True)
class State(TypedDict):
    # 메시지 정의(list type 이며 add_messages 함수를 사용하여 메시지를 추가)
    question: Annotated[list, add_messages]
    context: Annotated[str, "Context"]
    answer: Annotated[str, "Answer"]
    generation: Annotated[str, "LLM generated answer"]
    # messages: Annotated[list, add_messages]
    domain: Annotated[str, "Domain"]

# re_write_prompt = PromptTemplate(
#     template="""벡터DB 검색을 위한 질문 재구성

# 초기 질문을 분석하여 명확성, 구체성, 관련성 측면에서 개선할 부분을 식별합니다.
# 검색 최적화를 위해 맥락과 잠재적 키워드를 고려합니다.
# 원래 질문의 의도를 유지하면서 문장 구조와 어휘를 개선합니다.
# 단계

# 원래 질문 이해하기: 질문의 핵심 의도와 주요 키워드를 식별합니다.
# 명확성 향상: 언어를 단순화하고 질문이 직접적이고 명확하도록 합니다.
# 검색 최적화: 벡터DB 인덱싱에 더 잘 맞도록 키워드를 추가하거나 재배치합니다.
# 검토: 재작성된 질문이 원래 의도를 정확하게 반영하고 모호하지 않은지 확인합니다.
# 출력 형식

# 하나의 개선된 질문을 제공합니다.
# 소개나 설명 없이 재작성된 질문만 작성합니다.
# 예시

# 입력:
# "재생 가능 에너지원이 화석 연료보다 가지는 장점은 무엇인가요?"
# 출력:
# "재생 가능 에너지원이 화석 연료와 비교해 어떤 장점을 가지고 있나요?"

# 입력:
# "기후 변화가 북극곰 개체 수에 미치는 영향은 무엇인가요?"
# 출력:
# "기후 변화가 북극곰 개체 수에 끼치는 영향은?"

# 참고사항

# 개선된 질문은 간결하고 맥락에 맞아야 합니다.
# 질문의 근본적인 의도나 의미를 변경하지 마세요.
# 재작성된 질문은 원본과 동일한 언어로 작성해야 합니다.

# # 아래가 원본 재작성해야할 원본 질문이야
# {question}
# """,
#     input_variables=["question"],
# )

# question_rewriter = (
#     re_write_prompt | ChatOpenAI(model_name = "gpt-4o-mini") | StrOutputParser()
# )

# def query_rewrite(state: State, config: RunnableConfig):
#     latest_question = state["question"][-1].content
#     print(f'원본 쿼리:{latest_question}')
#     question_rewritten = question_rewriter.invoke({"question": latest_question},config=config)
#     print(f'재작성된 쿼리:{question_rewritten}')
#     return State(question=question_rewritten)

# def query_rewrite(state: State, rewriter_llm, rewrite_prompt, config: RunnableConfig):
#     """
#     state["question"][-1] (마지막 사용자 메시지)를 rewriter_llm로 재작성.
#     rewrite_prompt.format(original_question=...)
#     """
#     original_q = state["question"][-1].content
#     prompt_txt = rewrite_prompt.format(original_question=original_q)
#     rewritten = rewriter_llm.invoke(prompt_txt, config)
    
#     # 결과를 다시 state["question"]에 추가
    
#     state["question"].append(HumanMessage(content=rewritten))
    
#     return state

def query_rewrite_llm(state: State, rewriter_llm, rewrite_prompt, config: RunnableConfig):
    """
    1) 'rewriter_llm'와 'rewrite_prompt'를 사용해, 
       state["question"][-1] (마지막 사용자 질문)을 재작성
    2) 재작성된 질문을 state["question"]에 갱신(또는 append)
    3) return state
    """
    original_query = state["question"][-1].content
    final_prompt = rewrite_prompt.format(query=original_query)
    new_query = rewriter_llm.invoke(final_prompt, config).content.strip()
    
    # 새 질의를 HumanMessage로 추가 (append)
    return State(question=new_query)


# def retrieve_document(state: State, retriever, config: RunnableConfig):
#     # 질문을 상태에서 가져옵니다.
#     latest_question = state["question"][-1].content

#     # 문서에서 검색하여 관련성 있는 문서를 찾습니다.
#     retrieved_docs = retriever.invoke(latest_question,config=config)

#     # 검색된 문서를 형식화합니다.(프롬프트 입력으로 넣어주기 위함)
#     retrieved_docs = retrieved_docs[0].page_content# '\n\n'.join([d.page_content for d in retrieved_docs])

#     # 검색된 문서를 context 키에 저장합니다.
#     return State(context=retrieved_docs)

def call_model(state: State, prompt, llm, config: RunnableConfig):
    question = state["question"][-1].content
    context = state["context"]
    final_prompt = prompt.format(context=context, question=question)
    response = llm.invoke(final_prompt, config)
    model_result = response
    return State(generation=model_result)


routing_prompt = """
아래 사용자 질문을 보고 'law' 또는 'manual' 중 하나를 골라 출력해.
조건:
- 'law': 법령, 조항, 규정 관련
- 'manual': 제품 사용법, 기능 설명, 제품 고장 등

결과 형식: 'law' 혹은 'manual' 소문자로만 작성.
질문:
{query}
"""


# def route_domain_llm(state: State, routing_llm, routing_prompt, config: RunnableConfig):
#     """
#     LLM을 사용하여 질의를 분석하고, state["domain"]에 'law' 또는 'manual'을 설정.
#     routing_llm : 도메인 분류에 사용할 LLM (예: ChatOpenAI, OllamaLLM 등)
#     routing_prompt : 사용자 질의를 어떻게 분류할지 유도하는 프롬프트
#     config : RunnableConfig (LangGraph 실행 시 전달되는 설정)
    
#     반환: 수정된 state (항상 state 반환)
#     """
#     user_query = state["question"][-1].content  # 마지막 사용자 질문
    
#     # 1) 프롬프트 구성
#     final_prompt = routing_prompt.format(query=user_query)
    
#     # 2) LLM 호출
#     llm_output = routing_llm.invoke(final_prompt, config)
#     domain_str = llm_output.strip().lower()  # 예: "law" 혹은 "manual"
    
#     # 3) state["domain"] 에 결과 저장
#     state["domain"] = domain_str
#     return state

def route_domain_llm(state: State, routing_llm, routing_prompt, config: RunnableConfig):
    """
    LLM을 사용하여 질의를 분석하고, state["domain"]에 'law' 또는 'manual'을 설정.
    routing_llm : 도메인 분류에 사용할 LLM (예: ChatOpenAI, OllamaLLM 등)
    routing_prompt : 사용자 질의를 어떻게 분류할지 유도하는 프롬프트
    config : RunnableConfig (LangGraph 실행 시 전달되는 설정)
    
    반환: 수정된 state (항상 state 반환)
    """
    user_query = state["question"][-1].content  # 마지막 사용자 질문
    
    # 1) 프롬프트 구성
    final_prompt = routing_prompt.format(query=user_query)
    
    # 2) LLM 호출
    llm_output = routing_llm.invoke(final_prompt, config).content
    domain_str = llm_output.strip().lower()  # 예: "law" 혹은 "manual"
    
    # 3) state["domain"] 에 결과 저장
    # state["domain"] = domain_str
    return State(domain=domain_str)

    
def retrieve_document_law(state: State, law_retriever, config: RunnableConfig):
    question = state["question"][-1].content
    docs = law_retriever.invoke(question, config)
    retriver_result = docs[0].page_content if docs else ""
    return State(context=retriver_result)

def retrieve_document_manual(state: State, manual_retriever, config: RunnableConfig):
    question = state["question"][-1].content
    docs = manual_retriever.invoke(question, config)
    retriver_result = docs[0].page_content if docs else ""
    return State(context=retriver_result)

def domain_condition(state: State):
    return state["domain"]