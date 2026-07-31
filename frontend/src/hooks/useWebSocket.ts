import { useEffect, useState, useRef } from "react";

export type JobStatusEvent = {
  job_id: string;
  session_id: string;
  event_type: string;
  payload: {
    status?: string;
    current_stage?: string;
    progress?: number;
    error_message?: string;
  };
};

export const useJobWebSocket = (sessionId: string | null) => {
  const [jobStatus, setJobStatus] = useState<JobStatusEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    if (!sessionId) return;

    const connect = () => {
      // Use NEXT_PUBLIC_API_URL to construct the WebSocket URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const wsUrl = apiUrl.replace(/^http/, "ws") + `/jobs/ws/${sessionId}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        console.log(`[WebSocket] Connected for session ${sessionId}`);
        
        // Ping mechanism
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
          }
        }, 30000);
        
        ws.addEventListener('close', () => clearInterval(pingInterval));
      };

      ws.onmessage = (event) => {
        try {
          if (event.data === "pong") return;
          const data: JobStatusEvent = JSON.parse(event.data);
          setJobStatus(data);
        } catch (e) {
          console.error("[WebSocket] Error parsing message:", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log(`[WebSocket] Disconnected for session ${sessionId}`);
        
        // Reconnect with exponential backoff (max 10s)
        const backoff = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
        reconnectAttempts.current += 1;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, backoff);
      };

      ws.onerror = (err) => {
        console.error("[WebSocket] Error:", err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId]);

  return { jobStatus, isConnected };
};
