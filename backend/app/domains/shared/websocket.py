import logging
from typing import Dict, List
from fastapi import WebSocket
from app.domains.shared.metrics import ACTIVE_WEBSOCKET_CONNECTIONS

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps session_id to a list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    def _total_connections(self) -> int:
        return sum(len(conns) for conns in self.active_connections.values())

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)
        
        total = self._total_connections()
        ACTIVE_WEBSOCKET_CONNECTIONS.set(total)
        logger.info(f"WebSocket connected for session {session_id}. Active: {len(self.active_connections[session_id])}, Total: {total}")

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
                
        total = self._total_connections()
        ACTIVE_WEBSOCKET_CONNECTIONS.set(total)
        logger.info(f"WebSocket disconnected for session {session_id}. Total: {total}")

    async def broadcast_to_session(self, session_id: str, payload: dict):
        if session_id in self.active_connections:
            disconnected_sockets = []
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_json(payload)
                except Exception as e:
                    logger.error(f"Error sending message to WebSocket for session {session_id}: {e}")
                    disconnected_sockets.append(connection)
            
            # Clean up dead connections
            for dead_conn in disconnected_sockets:
                self.disconnect(dead_conn, session_id)

manager = ConnectionManager()
