from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.domains.shared.websocket import manager
from app.domains.shared.logging import logger

ws_router = APIRouter()

@ws_router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    try:
        while True:
            # Keep connection open and listen for client messages (like pings)
            data = await websocket.receive_text()
            # If the client sends a ping, we could respond with a pong.
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        logger.info(f"WebSocket client disconnected from session {session_id}")
    except Exception as e:
        manager.disconnect(websocket, session_id)
        logger.error(f"WebSocket error for session {session_id}: {e}")
