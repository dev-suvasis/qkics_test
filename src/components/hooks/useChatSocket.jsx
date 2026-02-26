// src/components/hooks/useChatSocket.jsx
import { useEffect, useRef, useState, useCallback } from "react";

const RECONNECT_BASE_DELAY = 1000; // 1s
const RECONNECT_MAX_DELAY = 30000; // 30s
const RECONNECT_MAX_ATTEMPTS = 8;

export default function useChatSocket({
  roomId,
  token,
  onMessage,
  onTyping,
  onUserStatus,
}) {
  const socketRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef(null);
  // Track whether the hook is still mounted so we don't reconnect after unmount
  const isMounted = useRef(true);

  // Store callbacks in refs to avoid reconnecting when they change
  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  const onUserStatusRef = useRef(onUserStatus);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onTypingRef.current = onTyping;
    onUserStatusRef.current = onUserStatus;
  });

  const connect = useCallback(() => {
    if (!roomId || !token || !isMounted.current) return;

    // ✅ FIX #1: Actually USE the VITE_WS_HOST env var so production deployments
    //    with separate frontend/backend domains work correctly.
    const WS_HOST =
      import.meta.env.VITE_WS_HOST ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/^https?:\/\//, "")
        : window.location.host);

    // ✅ FIX #2: Auto-detect protocol — use wss:// on HTTPS pages to avoid
    //    mixed-content blocking in production (browsers block ws:// on https://).
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";

    const wsUrl = `${protocol}://${WS_HOST}/ws/chat/${roomId}/?token=${token}`;
    console.log("🔌 Connecting WS:", wsUrl);

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      if (!isMounted.current) return;
      console.log("✅ WS connected");
      setIsReady(true);
      reconnectAttempts.current = 0; // reset backoff on successful connect
    };

    // ✅ FIX #12: Wrap JSON.parse in try/catch so malformed server messages
    //    don't crash the handler.
    socket.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (err) {
        console.error("❌ WS: failed to parse message", event.data, err);
        return;
      }

      switch (data.type) {
        case "chat_message":
          onMessageRef.current?.(data);
          break;
        case "typing":
          onTypingRef.current?.(data);
          break;
        case "user_status":
          onUserStatusRef.current?.(data);
          break;
        default:
          break;
      }
    };

    socket.onerror = (err) => {
      console.error("❌ WS error", err);
    };

    // ✅ FIX #8: Reconnect with exponential backoff when the socket drops
    //    (network blip, server restart). Stops after RECONNECT_MAX_ATTEMPTS.
    socket.onclose = (event) => {
      if (!isMounted.current) return;
      console.log(`🔌 WS closed (code ${event.code})`);
      setIsReady(false);

      // Don't reconnect on clean/intentional close (code 1000) or auth failure (4001)
      if (event.code === 1000 || event.code === 4001) return;

      if (reconnectAttempts.current >= RECONNECT_MAX_ATTEMPTS) {
        console.warn("🔌 WS: max reconnect attempts reached");
        return;
      }

      const delay = Math.min(
        RECONNECT_BASE_DELAY * 2 ** reconnectAttempts.current,
        RECONNECT_MAX_DELAY
      );
      reconnectAttempts.current += 1;
      console.log(`🔄 WS: reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);

      reconnectTimer.current = setTimeout(() => {
        if (isMounted.current) connect();
      }, delay);
    };
  }, [roomId, token]);

  useEffect(() => {
    isMounted.current = true;
    reconnectAttempts.current = 0;
    connect();

    return () => {
      isMounted.current = false;
      clearTimeout(reconnectTimer.current);
      if (socketRef.current) {
        // Close with code 1000 = intentional, suppresses reconnect
        socketRef.current.close(1000);
      }
    };
  }, [connect]);

  const send = useCallback((payload) => {
    if (
      !socketRef.current ||
      socketRef.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }
    socketRef.current.send(JSON.stringify(payload));
  }, []);

  return { send, isReady };
}