from langgraph.graph import StateGraph
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages
from langchain_core.messages import AIMessageChunk, HumanMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv('./.env',verbose=True)
class State(TypedDict):
    # 메시지 정의(list type 이며 add_messages 함수를 사용하여 메시지를 추가)
    question: Annotated[str, add_messages]
    context: Annotated[str, "Context"]
    answer: Annotated[str, "Answer"]
    generation: Annotated[str, "LLM generated answer"]
    messages: Annotated[list, add_messages]

re_write_prompt = PromptTemplate(
    template="""벡터DB 검색을 위한 질문 재구성

초기 질문을 분석하여 명확성, 구체성, 관련성 측면에서 개선할 부분을 식별합니다.
검색 최적화를 위해 맥락과 잠재적 키워드를 고려합니다.
원래 질문의 의도를 유지하면서 문장 구조와 어휘를 개선합니다.
단계

원래 질문 이해하기: 질문의 핵심 의도와 주요 키워드를 식별합니다.
명확성 향상: 언어를 단순화하고 질문이 직접적이고 명확하도록 합니다.
검색 최적화: 벡터DB 인덱싱에 더 잘 맞도록 키워드를 추가하거나 재배치합니다.
검토: 재작성된 질문이 원래 의도를 정확하게 반영하고 모호하지 않은지 확인합니다.
출력 형식

하나의 개선된 질문을 제공합니다.
소개나 설명 없이 재작성된 질문만 작성합니다.
예시

입력:
"재생 가능 에너지원이 화석 연료보다 가지는 장점은 무엇인가요?"
출력:
"재생 가능 에너지원이 화석 연료와 비교해 어떤 장점을 가지고 있나요?"

입력:
"기후 변화가 북극곰 개체 수에 미치는 영향은 무엇인가요?"
출력:
"기후 변화가 북극곰 개체 수에 끼치는 영향은?"

참고사항

개선된 질문은 간결하고 맥락에 맞아야 합니다.
질문의 근본적인 의도나 의미를 변경하지 마세요.
재작성된 질문은 원본과 동일한 언어로 작성해야 합니다.

# 아래가 원본 재작성해야할 원본 질문이야
{question}
""",
    input_variables=["question"],
)

question_rewriter = (
    re_write_prompt | ChatOpenAI(model_name = "gpt-4o-mini") | StrOutputParser()
)

def query_rewrite(state: State, config: RunnableConfig):
    latest_question = state["question"][-1].content
    print(f'원본 쿼리:{latest_question}')
    question_rewritten = question_rewriter.invoke({"question": latest_question},config=config)
    print(f'재작성된 쿼리:{question_rewritten}')
    return State(question=question_rewritten)

def retrieve_document(state: State, retriever, config: RunnableConfig):
    # 질문을 상태에서 가져옵니다.
    latest_question = state["question"][-1].content

    # 문서에서 검색하여 관련성 있는 문서를 찾습니다.
    retrieved_docs = retriever.invoke(latest_question,config=config)

    # 검색된 문서를 형식화합니다.(프롬프트 입력으로 넣어주기 위함)
    retrieved_docs = retrieved_docs[0].page_content# '\n\n'.join([d.page_content for d in retrieved_docs])

    # 검색된 문서를 context 키에 저장합니다.
    return State(context=retrieved_docs)

def call_model(state: State, prompt, llm, config: RunnableConfig):
    messages = state["context"]
    question = state['question'][-1].content
    # messages = state['prompt'].format(messages)
    # Note: Passing the config through explicitly is required for python < 3.11
    # Since context var support wasn't added before then: https://docs.python.org/3/library/asyncio-task.html#creating-tasks
    messages = prompt.format(messages, question)
    response = llm.invoke(messages, config)
    # We return a list, because this will get added to the existing list
    return State(generation=response)