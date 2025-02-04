from langgraph_builder import GraphBuilder
from langgraph_state import State
import uvicorn
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from langchain_core.runnables import RunnableConfig
from langchain_teddynote.messages import random_uuid
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.postgres import PostgresSaver
from psycopg import Connection
from dotenv import load_dotenv
import os
import asyncio

app = FastAPI()
graph_builder = GraphBuilder()
load_dotenv()
memory_db_uri = f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
memory_connection_kwargs = {
    "autocommit": True,
    "prepare_threshold": 0,
}
# graph = graph_builder.graph_builder.compile(checkpointer=memory)
# print(f'랭그래프 빌드완료 __name__={__name__}')

@app.websocket("/ws/query")
async def query_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        msg = await websocket.receive_text()
        print("데이터 수신")
        data = json.loads(msg)
        user_query = data.get("query", "")
        if user_query == "":
            return
            
        pool = Connection.connect(memory_db_uri, **memory_connection_kwargs)
        checkpointer = PostgresSaver(pool)
        checkpointer.setup()
        graph = graph_builder.graph_builder.compile(checkpointer=checkpointer)
        print('랭그래프 빌드')
        
        thread_id = data.get("thread_id", random_uuid())
        if not thread_id or thread_id == "":
            thread_id = random_uuid()
        config = RunnableConfig(
            recursion_limit=10,  # 최대 10개의 노드까지 방문. 그 이상은 RecursionError 발생
            configurable={"thread_id": thread_id},  # 스레드 ID 설정
        )
        filter = data.get("filter", "-1")
        inputs = State(question=user_query, filter=filter)
        node_names = ["LLM"]
        print("데이터 송신")
        await websocket.send_text("=== Start ===")
        await websocket.send_text(f"=== Thread_Id ===:{thread_id}")
        for chunk_msg, metadata in graph.stream(inputs, config, stream_mode="messages"):
            curr_node = metadata["langgraph_node"]
            if not node_names or curr_node in node_names:
                # print(chunk_msg.content, end="\n", flush=True)
                await websocket.send_text(chunk_msg.content)
                await asyncio.sleep(0)
        
        await websocket.send_text("=== Done ===")
        
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print("Error during WebSocket streaming:", e)
        await websocket.close()
    
    finally:
        if pool and not pool.closed:
            pool.close()        

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9779, reload=False, workers=1)