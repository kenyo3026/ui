import asyncio
import json
import os
import pathlib
from typing import Any, Dict

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from drowdroid.registry import DrowAgentRegister
from drowdroid.verbose import UIMessageVerboser

load_dotenv(dotenv_path=pathlib.Path(__file__).parent / ".env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

AGENT_CONFIG = os.getenv("AGENT_CONFIG")
AGENT_WORKSPACE = os.getenv("AGENT_WORKSPACE")

if AGENT_WORKSPACE:
    os.chdir(AGENT_WORKSPACE)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    loop = asyncio.get_event_loop()

    def _serialize(msg: Dict[str, Any]) -> Dict[str, Any]:
        """Convert litellm objects to JSON-serializable dict."""
        def default(obj):
            if hasattr(obj, "__dict__"):
                return obj.__dict__
            return str(obj)
        return json.loads(json.dumps(msg, default=default))

    async def send_message(msg: Dict[str, Any]):
        await websocket.send_json(_serialize(msg))

    agent = DrowAgentRegister.from_config(
        config=AGENT_CONFIG,
        workspace=AGENT_WORKSPACE,
        verbose_style="silent",
    )
    agent.verboser = UIMessageVerboser(
        on_message=lambda msg: asyncio.run_coroutine_threadsafe(
            send_message(msg), loop
        )
    )
    agent.init()

    try:
        async for data in websocket.iter_json():
            if data.get("type") == "user_message":
                content = data["content"]

                def run_agent():
                    try:
                        agent.receive(content)
                        agent.complete()
                    except Exception as e:
                        asyncio.run_coroutine_threadsafe(
                            websocket.send_json({"role": "error", "content": str(e)}),
                            loop,
                        )
                    finally:
                        asyncio.run_coroutine_threadsafe(
                            websocket.send_json({"role": "done"}),
                            loop,
                        )

                await loop.run_in_executor(None, run_agent)
    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "7414"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
