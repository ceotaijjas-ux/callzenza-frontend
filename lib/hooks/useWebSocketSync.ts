"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import { getTenantSubdomain } from "@/lib/api-client";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

export interface WebSocketEventMessage {
  event: string;
  call_id?: string;
  status?: string;
  lead_name?: string;
  client_name?: string;
  client_phone?: string;
  agent_status?: string;
  user_id?: string;
  reason?: string;
  [key: string]: any;
}

const MAX_RECONNECT_ATTEMPTS = 5;

export function useWebSocketSync(onMessageReceived?: (data: WebSocketEventMessage) => void, onReconnect?: () => void) {
  const storeToken = useAuthStore((s) => s.token);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const socketRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  const onMessageRef = useRef(onMessageReceived);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onMessageRef.current = onMessageReceived;
    onReconnectRef.current = onReconnect;
  }, [onMessageReceived, onReconnect]);

  const getToken = useCallback(() => {
    if (storeToken) return storeToken;
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("callzenza-auth") || localStorage.getItem("callzenza-auth");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.state?.token) return parsed.state.token;
        }
      } catch (_) {}
      return localStorage.getItem("token") || "";
    }
    return "";
  }, [storeToken]);

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return;
    const activeToken = getToken();
    if (!activeToken || typeof window === "undefined") return;

    if (socketRef.current) {
      const oldWs = socketRef.current;
      socketRef.current = null;
      oldWs.onclose = null;
      oldWs.onerror = null;
      oldWs.close();
    }

    let host = "";
    if (process.env.NEXT_PUBLIC_WS_URL) {
      host = process.env.NEXT_PUBLIC_WS_URL;
    } else if (typeof window !== "undefined") {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const portNum = parseInt(window.location.port, 10);
      if (portNum >= 3000 && portNum <= 3010) {
        host = `${proto}//${window.location.hostname}:8000`;
      } else if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith("http")) {
        host = process.env.NEXT_PUBLIC_API_URL.replace(/^http/, "ws");
      } else {
        host = `${proto}//${window.location.host}`;
      }
    } else {
      host = "ws://127.0.0.1:8000";
    }

    const tenant = getTenantSubdomain();
    const url = `${host}/api/ws/call-events?token=${encodeURIComponent(activeToken)}${tenant ? `&tenant_subdomain=${encodeURIComponent(tenant)}` : ""}`;

    try {
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) {
          ws.close();
          return;
        }
        setStatus("connected");
        const wasReconnecting = retryCountRef.current > 0;
        retryCountRef.current = 0;
        if (wasReconnecting && onReconnectRef.current) {
          onReconnectRef.current();
        }
      };

      ws.onmessage = (event) => {
        if (isUnmountedRef.current) return;
        try {
          const data: WebSocketEventMessage = JSON.parse(event.data);
          if (onMessageRef.current) {
            onMessageRef.current(data);
          }
        } catch (_) {}
      };

      ws.onerror = () => {
        if (isUnmountedRef.current) return;
        setStatus("reconnecting");
      };

      ws.onclose = () => {
        if (isUnmountedRef.current) return;
        if (retryCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setStatus("disconnected");
          return;
        }

        setStatus("reconnecting");
        const backoffMs = Math.min(1000 * Math.pow(2, retryCountRef.current), 15000);
        retryCountRef.current += 1;

        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => {
          if (!isUnmountedRef.current) {
            connect();
          }
        }, backoffMs);
      };
    } catch (_) {
      if (!isUnmountedRef.current) {
        setStatus("disconnected");
      }
    }
  }, [getToken]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();
    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (socketRef.current) {
        const ws = socketRef.current;
        socketRef.current = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      }
    };
  }, [connect]);

  return { status, reconnect: connect };
}
