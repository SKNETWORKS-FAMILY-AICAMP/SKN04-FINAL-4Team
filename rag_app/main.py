from langgraph_builder import GraphBuilder
from langgraph_state import State
import uvicorn
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.memory import MemorySaver
import os
import asyncio

app = FastAPI()
graph_builder = GraphBuilder()
memory = MemorySaver()
graph = graph_builder.graph_builder.compile(checkpointer=memory)
print(f'랭그래프 빌드완료 __name__={__name__}')

@app.websocket("/ws/query")
async def query_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        msg = await websocket.receive_text()
        data = json.loads(msg)
        user_query = data.get("query", "")
        if user_query == "":
            return

        thread_id = data.get("id", "1")
        config = RunnableConfig(
            recursion_limit=10,  # 최대 10개의 노드까지 방문. 그 이상은 RecursionError 발생
            configurable={"thread_id": thread_id},  # 스레드 ID 설정
        )

        inputs = State(question=user_query)
        node_names = ["LLM"]
        await websocket.send_text("=== Start ===")
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


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9779, reload=False, workers=1)