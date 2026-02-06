// src/components/hooks/useChatSocket.jsx
import { useEffect, useRef, useState } from "react";

export default function useChatSocket({
  roomId,
  token,
  onMessage,
  onTyping,
  onUserStatus,
}) {
  const socketRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Store callbacks in refs to avoid reconnecting when they change
  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  const onUserStatusRef = useRef(onUserStatus);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onTypingRef.current = onTyping;
    onUserStatusRef.current = onUserStatus;
  });

  useEffect(() => {
    if (!roomId || !token) return;

    // Use env var if set, otherwise derive from current hostname + port 8000
    // This allows it to work on localhost, 127.0.0.1, or 192.168.x.x automatically
    const WS_HOST = import.meta.env.VITE_WS_HOST || window.location.host;
    // const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const protocol = "ws"; // Force WS as requested
    const wsUrl = `${protocol}://${window.location.host}/ws/chat/${roomId}/?token=${token}`;

    console.log("🔌 Connecting WS:", wsUrl);

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ WS connected");
      setIsReady(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

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

    socket.onclose = () => {
      console.log("🔌 WS closed");
      setIsReady(false);
    };

    return () => {
      socket.close();
    };
  }, [roomId, token]);

  const send = (payload) => {
    if (
      !socketRef.current ||
      socketRef.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }
    socketRef.current.send(JSON.stringify(payload));
  };

  return { send, isReady };
}
