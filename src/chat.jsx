import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { getAccessToken } from "./redux/store/tokenManager";

import {
  MdSend,
  MdSearch,
  MdMoreVert,
  MdArrowBack,
  MdChatBubbleOutline,
} from "react-icons/md";
import axiosSecure from "./components/utils/axiosSecure";
import useChatSocket from "./components/hooks/useChatSocket.jsx";
import "./chatPage.css";

// ✅ FIX #10: TypingDots defined outside component to avoid re-creation on every render
function TypingDots() {
  return (
    <span className="flex gap-1">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </span>
  );
}

export default function ChatPage() {
  const { roomId } = useParams();
  const { theme, data: user } = useSelector((state) => state.user);
  const isDark = theme === "dark";

  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState(null);
  const [messagesError, setMessagesError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  // ✅ FIX #6: Track which message IDs we've already sent read receipts for
  const readMessageIds = useRef(new Set());

  // ✅ FIX #5: Read token from a ref that stays current so the WebSocket
  //    reconnects with a fresh token if it rotates during the session.
  const tokenRef = useRef(getAccessToken());
  // We pass the current value to the hook; when the token changes the hook
  // will close and reopen via its [roomId, token] dep.
  const [token, setToken] = useState(tokenRef.current);

  // If the access token is refreshed elsewhere (e.g. axiosSecure interceptor),
  // pick it up so the socket can reconnect with the new token.
  useEffect(() => {
    const interval = setInterval(() => {
      const fresh = getAccessToken();
      if (fresh && fresh !== tokenRef.current) {
        tokenRef.current = fresh;
        setToken(fresh);
      }
    }, 30_000); // check every 30s — tokens typically last 5–15 min
    return () => clearInterval(interval);
  }, []);

  /* ---------------- helpers ---------------- */
  const getOtherParticipant = useCallback(
    (room) => {
      if (!room || !user) return null;
      if (room.user?.id === user.id) return room.expert;
      if (room.expert?.id === user.id) return room.user;
      return null;
    },
    [user]
  );

  const otherUser = getOtherParticipant(selectedRoom);
  const text = isDark ? "text-white" : "text-black";

  /* ---------------- websocket ---------------- */
  const { send: sendWS, isReady } = useChatSocket({
    roomId: selectedRoom?.id,
    token,
    onMessage: (msg) => {
      setMessages((prev) => {
        const isMe =
          msg.sender === user?.username || msg.sender_id === user?.id;
        const incomingMsg = { ...msg, is_mine: isMe };

        // Replace optimistic placeholder for my own messages
        if (isMe) {
          // ✅ FIX #7: Use explicit `isOptimistic` flag instead of ID-length heuristic
          const optimisticIndex = prev.findIndex(
            (m) => m.isOptimistic && m.is_mine && m.text === incomingMsg.text
          );
          if (optimisticIndex !== -1) {
            const newMsgs = [...prev];
            newMsgs[optimisticIndex] = incomingMsg;
            return newMsgs;
          }
        }

        // General deduplication by ID
        if (msg.id && prev.some((m) => m.id === msg.id)) {
          return prev;
        }

        return [...prev, incomingMsg];
      });
    },
    onTyping: (data) => {
      if (data.user === user?.username) return;
      setTypingUser(data.is_typing ? data.user : null);
    },
    onUserStatus: (data) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [data.user_id]: data.online,
      }));
    },
  });

  // ✅ FIX #3: isUserOnline no longer conflates your own socket state with the
  //    other user's presence. It only uses the `onlineUsers` map from server events.
  const isUserOnline = useCallback(
    (userId) => {
      if (!userId) return false;
      return onlineUsers[userId] ?? false;
    },
    [onlineUsers]
  );

  /* ---------------- effects ---------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  // ✅ FIX #6: Only send read receipts for messages we haven't processed yet
  useEffect(() => {
    if (!isReady) return;
    messages.forEach((msg) => {
      if (!msg.is_mine && msg.id && !readMessageIds.current.has(msg.id)) {
        readMessageIds.current.add(msg.id);
        sendWS({ type: "message_read", message_id: msg.id });
      }
    });
  }, [messages, isReady, sendWS]);

  // ✅ FIX #9: Clear typing timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(typingTimeout.current);
    };
  }, []);

  /* ---------------- api ---------------- */
  // ✅ FIX #4: Added catch blocks with error state for user feedback
  const fetchChatRooms = async () => {
    try {
      setLoadingRooms(true);
      setRoomsError(null);
      const res = await axiosSecure.get("/v1/chat/rooms/");
      setChatRooms(res.data || []);

      if (res.data?.length) {
        const room =
          res.data.find((r) => String(r.id) === roomId) || res.data[0];
        setSelectedRoom(room);
        fetchMessages(room.id);
      }
    } catch (err) {
      console.error("Failed to load chat rooms:", err);
      setRoomsError("Failed to load conversations. Please try again.");
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchMessages = async (id) => {
    try {
      setLoadingMessages(true);
      setMessagesError(null);
      // Clear read-receipt cache when switching rooms
      readMessageIds.current = new Set();
      const res = await axiosSecure.get(`/v1/chat/rooms/${id}/messages/`);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setMessagesError("Failed to load messages. Please try again.");
    } finally {
      setLoadingMessages(false);
    }
  };

  /* ---------------- actions ---------------- */
  const handleTyping = (value) => {
    setNewMessage(value);
    if (!isReady) return;

    sendWS({ type: "typing", is_typing: true });

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      sendWS({ type: "typing", is_typing: false });
    }, 800);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedRoom || !isReady) return;

    // ✅ FIX #7: Use explicit `isOptimistic: true` flag instead of ID-length hack
    const optimistic = {
      id: Date.now(),
      isOptimistic: true,
      text: newMessage,
      is_mine: true,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    sendWS({ type: "chat_message", text: newMessage });
    setNewMessage("");
    sendWS({ type: "typing", is_typing: false });
  };

  const filteredRooms = chatRooms.filter((room) => {
    const other = getOtherParticipant(room);
    const name =
      `${other?.first_name || ""} ${other?.last_name || ""}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  /* ============================ UI ============================ */

  return (
    <div
      className={`flex h-[calc(100vh-136px)] md:h-[calc(100vh-80px)] overflow-hidden max-w-7xl mx-auto w-full ${
        isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]"
      }`}
    >
      {/* ================= LEFT SIDEBAR ================= */}
      <aside
        className={`w-full md:w-80 lg:w-[400px] flex flex-col border-r transition-all duration-500 ${
          isDark
            ? "border-white/5 bg-[#0a0a0a]"
            : "border-black/5 bg-white"
        } ${selectedRoom && "hidden md:flex"}`}
      >
        <div className="p-8 pb-6">
          <h2 className={`text-3xl font-black tracking-tighter mb-6 ${text}`}>
            Intel <span className="text-red-600">Feed</span>
          </h2>
          <div
            className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 border transition-all ${
              isDark
                ? "bg-white/5 border-white/5 focus-within:border-red-500/50"
                : "bg-neutral-100 border-black/5 focus-within:border-red-500/50"
            }`}
          >
            <MdSearch size={20} className="opacity-30" />
            <input
              className={`bg-transparent outline-none w-full text-sm font-bold placeholder:opacity-40 placeholder:font-bold ${text}`}
              placeholder="FILTER DISPATCHES..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-8">
          {loadingRooms ? (
            [1, 2, 3].map((n) => (
              <div
                key={n}
                className="flex items-center gap-4 p-4 rounded-2xl animate-pulse"
              >
                <div
                  className={`h-14 w-14 rounded-2xl ${
                    isDark ? "bg-white/5" : "bg-neutral-200"
                  }`}
                />
                <div className="flex-1 space-y-2">
                  <div
                    className={`h-4 w-24 rounded ${
                      isDark ? "bg-white/5" : "bg-neutral-200"
                    }`}
                  />
                  <div
                    className={`h-3 w-32 rounded ${
                      isDark ? "bg-white/5" : "bg-neutral-200"
                    }`}
                  />
                </div>
              </div>
            ))
          ) : roomsError ? (
            // ✅ FIX #4: Show error with retry
            <div className="py-16 text-center px-4">
              <p className="text-red-500 text-xs font-bold mb-3">{roomsError}</p>
              <button
                onClick={fetchChatRooms}
                className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
              >
                Retry
              </button>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="py-20 text-center opacity-20">
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                No frequency found
              </p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const other = getOtherParticipant(room);
              const isActive = selectedRoom?.id === room.id;
              // ✅ FIX #3: Use the fixed isUserOnline (no longer always-true)
              const isOnline = isUserOnline(other?.id);

              return (
                <div
                  key={room.id}
                  onClick={() => {
                    setSelectedRoom(room);
                    fetchMessages(room.id);
                  }}
                  className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 group ${
                    isActive
                      ? "bg-red-600 text-white shadow-xl shadow-red-600/20 translate-x-1"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <div
                    className={`relative h-14 w-14 flex-shrink-0 rounded-2xl overflow-hidden shadow-lg transition-transform duration-500 group-hover:scale-105 ${
                      !isActive && "border border-black/5 dark:border-white/5"
                    }`}
                  >
                    {/* ✅ FIX #11: Added alt attributes for accessibility */}
                    <img
                      src={
                        other?.profile_picture ||
                        `https://ui-avatars.com/api/?name=${other?.first_name}&background=random`
                      }
                      alt={`${other?.first_name} ${other?.last_name}`}
                      className="w-full h-full object-cover"
                    />
                    {isOnline && (
                      <div className="absolute bottom-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white dark:border-black" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-black text-sm truncate leading-none mb-1.5 ${
                        isActive ? "text-white" : text
                      }`}
                    >
                      {other?.first_name} {other?.last_name}
                    </h4>
                    <p
                      className={`text-[11px] truncate font-medium ${
                        isActive ? "text-white/70" : "opacity-40"
                      }`}
                    >
                      {room.last_message && typeof room.last_message === "object"
                        ? room.last_message.text ?? "Awaiting transmission..."
                        : room.last_message || "Awaiting transmission..."}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ================= CHAT WINDOW ================= */}
      <main
        className={`flex-1 flex flex-col ${
          !selectedRoom && "hidden md:flex"
        } animate-fadeIn`}
      >
        {selectedRoom ? (
          <>
            {/* HEADER */}
            <header
              className={`flex items-center justify-between px-8 py-6 border-b z-10 ${
                isDark
                  ? "bg-[#0a0a0a]/80 border-white/5"
                  : "bg-white/80 border-black/5"
              } backdrop-blur-xl`}
            >
              <div className="flex items-center gap-4">
                <button
                  className="md:hidden text-red-600"
                  onClick={() => setSelectedRoom(null)}
                  aria-label="Back to conversations"
                >
                  <MdArrowBack size={24} />
                </button>

                <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-xl border-2 border-red-500/20">
                  {/* ✅ FIX #11: Added alt */}
                  <img
                    src={
                      otherUser?.profile_picture ||
                      `https://ui-avatars.com/api/?name=${otherUser?.first_name}`
                    }
                    alt={`${otherUser?.first_name} ${otherUser?.last_name}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h3
                    className={`font-black text-base tracking-tight ${text}`}
                  >
                    {otherUser?.first_name} {otherUser?.last_name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full shadow-sm ${
                        isUserOnline(otherUser?.id)
                          ? "bg-green-500 animate-pulse shadow-green-500/50"
                          : "bg-neutral-500"
                      }`}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30">
                      {isUserOnline(otherUser?.id) ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                className={`h-11 w-11 flex items-center justify-center rounded-xl border border-black/5 dark:border-white/5 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all group ${text}`}
                aria-label="More options"
              >
                <MdMoreVert
                  size={20}
                  className="opacity-40 group-hover:opacity-100"
                />
              </button>
            </header>

            {/* MESSAGES */}
            <div
              className={`flex-1 overflow-y-auto p-8 space-y-6 ${
                isDark ? "bg-[#0d0d0d]" : "bg-neutral-50"
              }`}
            >
              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Decoding Frequency...
                  </p>
                </div>
              ) : messagesError ? (
                // ✅ FIX #4: Show message error with retry
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-red-500 text-sm font-bold mb-3">
                    {messagesError}
                  </p>
                  <button
                    onClick={() => fetchMessages(selectedRoom.id)}
                    className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
                  >
                    Retry
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20">
                  <MdChatBubbleOutline size={64} className="mb-4" />
                  <p className="font-black text-sm uppercase tracking-widest leading-none">
                    Initialize Stream
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.is_mine;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`group relative px-6 py-4 rounded-3xl text-sm font-medium shadow-sm transition-all duration-300 hover:shadow-lg max-w-[75%] sm:max-w-[70%] wrap-break-words whitespace-pre-wrap break-all border ${
                          isMine
                            ? "bg-red-600 text-white border-red-500 rounded-tr-sm"
                            : isDark
                            ? "bg-white/5 text-white border-white/5 rounded-tl-sm"
                            : "bg-white text-black border-black/5 rounded-tl-sm"
                        }`}
                      >
                        {msg.file ? (
                          <a
                            href={msg.file}
                            target="_blank"
                            rel="noreferrer"
                            className="underline font-bold"
                          >
                            📎 Encrypted Attachment
                          </a>
                        ) : (
                          msg.text
                        )}
                        <span
                          className={`absolute -bottom-5 right-0 text-[9px] font-black uppercase opacity-0 group-hover:opacity-30 transition-opacity tracking-tighter ${text}`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* TYPING INDICATOR */}
            {typingUser && (
              <div
                className={`px-8 py-2 text-xs font-medium flex items-center gap-2 ${
                  isDark ? "text-neutral-400" : "text-neutral-500"
                }`}
              >
                <span>{typingUser} is typing</span>
                <TypingDots />
              </div>
            )}

            {/* INPUT AREA */}
            <div
              className={`p-8 border-t ${
                isDark
                  ? "bg-[#0a0a0a] border-white/5"
                  : "bg-white border-black/5"
              }`}
            >
              {/* Offline warning banner */}
              {!isReady && selectedRoom && (
                <div className="mb-3 text-center text-[10px] font-black uppercase tracking-widest text-amber-500 opacity-70">
                  Reconnecting...
                </div>
              )}
              <div
                className={`flex items-center gap-4 rounded-3xl px-6 py-4 border transition-all ${
                  isDark
                    ? "bg-white/5 border-white/5 focus-within:border-red-500/50"
                    : "bg-neutral-50 border-black/5 focus-within:border-red-500/50"
                }`}
              >
                <input
                  className={`flex-1 bg-transparent outline-none text-sm font-bold placeholder:opacity-30 ${text}`}
                  placeholder="TRANSMIT INTELLIGENCE..."
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !isReady}
                  className={`h-12 w-12 flex items-center justify-center rounded-2xl shadow-xl transition-all duration-300 ${
                    newMessage.trim() && isReady
                      ? "bg-red-600 text-white shadow-red-600/30 hover:scale-110 active:scale-95 translate-x-2"
                      : "bg-neutral-100 dark:bg-white/5 text-neutral-400 cursor-not-allowed"
                  }`}
                  aria-label="Send message"
                >
                  <MdSend size={24} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center animate-fadeIn">
            <div className="h-32 w-32 bg-black/5 dark:bg-white/5 rounded-[40px] flex items-center justify-center text-red-600 mb-8 shadow-inner">
              <MdChatBubbleOutline size={64} className="opacity-40" />
            </div>
            <h2 className={`text-2xl font-black tracking-tighter mb-2 ${text}`}>
              QKICS <span className="text-red-600">Secure Comm</span>
            </h2>
            <p className="opacity-30 font-bold uppercase text-[10px] tracking-[0.4em]">
              Establish valid connection to begin.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}