import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/stores";

interface UseWebSocketOptions {
    onMessage?: (data: any) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
}

export function useWebSocket(url: string | null, options: UseWebSocketOptions = {}) {
    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
    const wsRef = useRef<WebSocket | null>(null);
    const token = useAuthStore((state) => state.accessToken);
    const { onMessage, onConnected, onDisconnected } = options;

    const connect = useCallback(() => {
        if (!url || !token) return;

        setStatus("connecting");
        const fullUrl = `${url}?token=${token}`;
        const ws = new WebSocket(fullUrl);

        ws.onopen = () => {
            setStatus("connected");
            onConnected?.();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage?.(data);
            } catch (err) {
                console.error("WS parse error:", err);
            }
        };

        ws.onclose = () => {
            setStatus("disconnected");
            onDisconnected?.();
            // Reconnect logic could be added here
        };

        ws.onerror = (err) => {
            console.error("WS error:", err);
            setStatus("disconnected");
        };

        wsRef.current = ws;
    }, [url, token, onMessage, onConnected, onDisconnected]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const send = useCallback((data: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        } else {
            console.error("WS not open. ReadyState:", wsRef.current?.readyState);
        }
    }, []);

    useEffect(() => {
        connect();
        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return { status, send, connect, disconnect };
}
