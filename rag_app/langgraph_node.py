from langgraph_state import State
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import AIMessageChunk


def domain_condition(state: State):
    return state["domain"]

def get_rewrite_template():
    rewrite_prompt = """
    # Instruction:
        - 아래 질문을 더 간결하고 명확하게 재작성하세요.
        - 질문의 핵심 의도를 유지하면서 문장 구조를 개선하고, 명확성, 구체성, 관련성을 높이세요.
        - 검색 최적화를 위해 벡터DB 인덱싱에 적합한 키워드를 추가하거나 재배치하세요.
        - 출력은 원문과 동일한 언어로 작성하며, 한 문장으로만 구성하세요.

    # Steps:
        1. 질문의 의도를 파악하고 주요 키워드를 식별합니다.
        2. 언어를 간결하게 다듬어 질문이 명확하고 직접적으로 전달되도록 합니다.
        3. 잠재적 검색 키워드를 추가하거나 배치하여 벡터DB 검색 효율성을 높입니다.
        4. 재작성된 질문이 원래 의도와 일치하며, 모호하지 않은지 확인합니다.

    # Output:
        - 개선된 질문을 한 문장으로 제공합니다.
        - 설명이나 추가 정보 없이 재작성된 질문만 출력합니다.

    # Example:
        Query: 재생 가능 에너지원이 화석 연료보다 가지는 장점은 무엇인가요?
        Answer: 재생 가능 에너지원이 화석 연료와 비교해 어떤 장점을 가지고 있나요?

        Query: 기후 변화가 북극곰 개체 수에 미치는 영향은 무엇인가요?
        Answer: 기후 변화가 북극곰 개체 수에 끼치는 영향은?

    Query: {query}
    Answer:
    """
    return rewrite_prompt


def rewrite_query(state: State, llm, config: RunnableConfig):
    original_query = state["question"][-1].content
    rewrite_prompt = get_rewrite_template()
    final_prompt = rewrite_prompt.format(query=original_query)
    new_query = llm.invoke(final_prompt, config).content.strip()

    return State(question=new_query)


def get_prompt(context, question):
    messages = [
        ("system", """너는 내용만을보고 질문대해 추론하고 그에대한 답을하는 역할이야. 반드시 한국어로만 대답해줘.
         내용이 없거나 질문이 내용과 관련이 없으면 해당 질문을 문서에서 찾을 수 없다고 알려줘.
        """),
        ("human", 
        f"""
        ## 내용: {context}

        ## 질문: {question}
        """),
    ]
    return messages

def call_model(state: State, llm, config: RunnableConfig):
    question = state["question"][-1].content
    context = state["context"]
    prompt = get_prompt(context, question)
    response = llm.invoke(prompt, config)
    model_result = response
    return State(generation=model_result)


def get_routing_template():
    routing_prompt = """
    # Instruction:
        - 아래 질문이 'law'인지 'manual'인지 분류하세요.
        - 조건:
            1. 법령, 조항, 규정, 법률과 관련된 경우 -> 'law'
            2. 제품(예: 냉장고, 세타기, 에어컨, TV등..)의 사용 설명이나 기능과 관련된 경우 -> 'manual'
        - 출력은 반드시 소문자로 'law' 또는 'manual'만 작성하세요.

    # Output:
        - 입력 질문의 분류 결과를 출력합니다.
        - 추가 설명 없이 'law' 또는 'manual'만 출력합니다.

    # Example:
        Query: 관세법제89조는 어떤 법이야?
        Answer: law

        Query: 「약사법」 제50조제1항 본문의 “약국개설자 및 의약품판매업자”에 같은 법 제91조에 따라 설립된 “한국희귀ㆍ필수의약품센터”(이하 “의약품센터”라 함)가 포함되는지?
        Answer: law

        Query: 이 제품의 사용법이 궁금해요.
        Answer: manual

        Query: 세탁기의 청소방법은 뭐야?
        Answer: manual

    Query: {query}
    Answer:
    """
    return routing_prompt


def route_query(state: State, llm, config: RunnableConfig):
    user_query = state["question"][-1].content  # 마지막 사용자 질문
    routing_prompt = get_routing_template()
    final_prompt = routing_prompt.format(query=user_query)
    llm_output = llm.invoke(final_prompt, config).content
    domain_str = llm_output.strip().lower()  # 예: "law" 혹은 "manual"
    
    # 3) state["domain"] 에 결과 저장
    # state["domain"] = domain_str
    return State(domain=domain_str)

def ensemble_search(query, chroma_retriever, bm25_retriever, alpha=0.5, k=3):
    # Chroma 검색
    chroma_results = chroma_retriever.get_relevant_documents(query)
    chroma_scored = [
        (doc.page_content, doc.metadata.get("score", 1.0) * alpha)
        for doc in chroma_results
    ]

    # BM25 검색
    bm25_results = bm25_retriever.get_relevant_documents(query)
    bm25_scored = [(doc.page_content, 1.0 * (1 - alpha)) for doc in bm25_results]

    # 결과 결합
    combined_results = chroma_scored + bm25_scored
    combined_results = sorted(combined_results, key=lambda x: x[1], reverse=True)

    # 상위 k개 문서 반환
    return combined_results[:k]


def retrieve_document_law(state: State, law_retriever, bm25_retriever, config: RunnableConfig, alpha=0.7, k=3):
    # 사용자 질문 추출
    question = state["question"][-1].content

    # 앙상블 검색 수행
    documents = ensemble_search(
        query=question,
        chroma_retriever=law_retriever,
        bm25_retriever=bm25_retriever,
        alpha=alpha,
        k=k
    )

    retrieved_content = documents[0][0] if documents else ""

    chunk = AIMessageChunk(content=retrieved_content)
    return State(context=chunk)

def ensemble_retriever(state: State, retriever, config: RunnableConfig):
    question = state["question"][-1].content

    result = retriever.invoke(question)
    docs = '\n'.join([doc.page_content for doc in result])

    return State(context=docs)

def retrieve_document_manual(state: State, manual_retriever, bm25_retriever, config: RunnableConfig, alpha=0.7, k=3):
    # 사용자 질문 추출
    question = state["question"][-1].content

    # 앙상블 검색 수행
    documents = ensemble_search(
        query=question,
        chroma_retriever=manual_retriever,
        bm25_retriever=bm25_retriever,
        alpha=alpha,
        k=k
    )

    retrieved_content = documents[0][0] if documents else ""

    chunk = AIMessageChunk(content=retrieved_content)
    return State(context=chunk)