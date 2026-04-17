import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaDesktop,
  FaRegCommentDots,
  FaRegStickyNote,
  FaPaperPlane,
  FaPaperclip,
  FaPhoneSlash,
  FaTimes,
  FaCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { getAccessToken } from "../redux/store/tokenManager";
import ModalOverlay from "./ui/ModalOverlay";
import { useLiveKit } from "./hooks/useLiveKit";
import { useCallChat } from "./hooks/useCallChat";
import {
  getCallRoom,
  getCallMessages,
  getMyNote,
  uploadCallFile,
  saveMyNote,
  endCall,
} from "./utils/callApi";

/**
 * Enhanced Video Renderer that handles orientation and aspect ratios safely.
 * Prevents stretching, cropping, and rotation issues in cross-platform calls.
 */
function SafeVideoRenderer({ track, isLocal = false, isScreen = false, className = "" }) {
  const videoRef = useRef(null);
  // eslint-disable-next-line no-unused-vars
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!track || !el) return;

    track.attach(el);

    if (track.dimensions) {
      setIsPortrait(track.dimensions.height > track.dimensions.width);
    }

    const handleDimensions = (dims) => {
      setIsPortrait(dims.height > dims.width);
    };
    
    track.on("dimensionsChanged", handleDimensions);
    return () => {
      track.off("dimensionsChanged", handleDimensions);
      track.detach(el);
    };
  }, [track]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={true} // Always mute video tags as audio is handled separately; ensures auto-play on mobile
      style={{ objectFit: isScreen ? "contain" : (isLocal ? "cover" : "contain") }}
      className={`w-full h-full bg-black/40 transition-opacity duration-300 ${className}`}
    />
  );
}

export default function VideoCallComponent({ call_room_id, token, onCallEnd }) {
  const remoteAudioRef = useRef(null);
  const screenAudioRef = useRef(null);
  const chatEndRef = useRef(null);
  const fileRef = useRef(null);

  const lk = useLiveKit();
  const chat = useCallChat(call_room_id, token);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [activePanel, setActivePanel] = useState(null); // "chat" | "notes" | null
  const [note, setNote] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const timerRef = useRef(null);

  const unreadCount = activePanel === "chat" ? 0 : Math.max(0, chat.messages.length - lastSeenCount);

  const openPanel = useCallback((panel) => {
    setActivePanel((curr) => {
      const next = curr === panel ? null : panel;
      if (next === "chat") setLastSeenCount(chat.messages.length);
      return next;
    });
  }, [chat.messages.length]);

  useEffect(() => {
    (async () => {
      try {
        const roomData = await getCallRoom(call_room_id);
        if (!roomData.can_join) {
          setError("This call is not available right now or has already ended.");
          setLoading(false);
          return;
        }
        if (!roomData.livekit_token || !roomData.livekit_url) {
          setError("Video server is unavailable. Please try again in a moment.");
          setLoading(false);
          return;
        }
        const history = await getCallMessages(call_room_id);
        const noteData = await getMyNote(call_room_id);
        setNote(noteData.content || "");
        await lk.connect(roomData.livekit_url, roomData.livekit_token);
        chat.connect(history);
        if (roomData.scheduled_end) {
          const secs = Math.max(
            0,
            Math.floor((new Date(roomData.scheduled_end).getTime() - Date.now()) / 1000)
          );
          setRemaining(secs);
        }
        setLoading(false);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    })();
    return () => {
      clearInterval(timerRef.current);
      lk.disconnect();
      chat.disconnect();
    };
  }, [call_room_id, lk.connect, chat.connect, lk.disconnect, chat.disconnect]);

  useEffect(() => {
    if (remaining === null) return;
    timerRef.current = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [remaining === null]);

  useEffect(() => {
    const track = lk.remoteAudioTrack;
    const el = remoteAudioRef.current;
    if (!track || !el) return;
    track.attach(el);
    return () => { track.detach(el); };
  }, [lk.remoteAudioTrack]);

  useEffect(() => {
    const track = lk.screenShareAudioTrack;
    const el = screenAudioRef.current;
    if (!track || !el) return;
    track.attach(el);
    return () => { track.detach(el); };
  }, [lk.screenShareAudioTrack]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  const [isEnding, setIsEnding] = useState(false);

  const handleEndCall = useCallback(async () => {
    setIsEnding(true);
    try {
      await lk.disconnect().catch(() => {});
      await chat.disconnect().catch(() => {});
      // Allow endCall to fail quietly if the room is already gone
      await endCall(call_room_id).catch(() => {});
    } finally {
      // Force navigation back to bookings no matter what
      onCallEnd?.();
    }
  }, [lk, chat, call_room_id, onCallEnd]);

  const triggerEndCall = () => {
    if (isEnding) return;
    setShowEndConfirm(true);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    chat.sendMessage(chatInput);
    setChatInput("");
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const msg = await uploadCallFile(call_room_id, file);
      chat.notifyFileShared(msg);
    } catch (err) {
      alert(err.message);
    }
    e.target.value = "";
  };

  const handleNoteSave = () => saveMyNote(call_room_id, note);

  const fmt = (s) => {
    if (s === null || s === undefined) return "";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(sec).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-neutral-950 text-white">
      <div className="w-12 h-12 rounded-full border-4 border-neutral-800 border-t-blue-500 animate-spin" />
      <p className="mt-4 text-neutral-400 text-sm">Connecting to meeting…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen bg-neutral-950 text-white gap-4 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
        <FaPhoneSlash className="text-red-400 text-2xl" />
      </div>
      <p className="text-neutral-200">{error}</p>
      <button
        onClick={onCallEnd}
        className="px-5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm transition"
      >
        Go back
      </button>
    </div>
  );

  const isTimerLow = remaining !== null && remaining < 120;

  return (
    <div className="relative flex flex-col h-screen bg-neutral-950 text-white overflow-hidden">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 bg-neutral-900/80 backdrop-blur border-b border-neutral-800 z-20">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 shrink-0">
            <FaCircle className="text-red-500 text-[8px] animate-pulse" />
            <span className="text-[10px] sm:text-xs font-medium text-red-300">LIVE</span>
          </div>
          <h1 className="text-xs sm:text-sm font-medium text-neutral-200 truncate hidden xs:block sm:block">
            Meeting in progress
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {remaining !== null && (
            <div
              className={`px-2 sm:px-3 py-1 rounded-md font-mono text-xs sm:text-sm tabular-nums ${
                isTimerLow
                  ? "bg-red-500/15 text-red-300 border border-red-500/30"
                  : "bg-neutral-800 text-neutral-200"
              }`}
            >
              {fmt(remaining)}
            </div>
          )}
          <span
            className={`hidden sm:inline text-xs px-2 py-1 rounded ${
              lk.isConnected ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
            }`}
          >
            {lk.isConnected ? "Connected" : "Reconnecting…"}
          </span>
        </div>
      </header>

      {/* ── Stage ── */}
      <div className="flex-1 flex overflow-hidden">
        <section className="relative flex-1 bg-black flex items-center justify-center">
          {lk.screenShareTrack ? (
            <SafeVideoRenderer track={lk.screenShareTrack} isScreen={true} />
          ) : lk.remoteVideoTrack ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <SafeVideoRenderer track={lk.remoteVideoTrack} />
              {lk.remoteName && (
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-xs font-bold tracking-wide animate-fadeIn">
                  {lk.remoteName}
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 gap-3">
              <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center">
                <FaVideo className="text-2xl text-neutral-600" />
              </div>
              <p className="text-sm">
                {lk.isConnected ? "Waiting for the other participant to join…" : "Connecting…"}
              </p>
            </div>
          )}

          {/* Remote Side-PiP (Visible when screen sharing) */}
          {lk.screenShareTrack && lk.remoteVideoTrack && (
            <div className="absolute bottom-28 sm:bottom-40 right-2 sm:right-4 w-28 sm:w-48 aspect-video rounded-lg overflow-hidden border border-neutral-700 shadow-2xl z-20">
              <SafeVideoRenderer track={lk.remoteVideoTrack} />
            </div>
          )}

          {/* Self PiP */}
          <div className="absolute bottom-20 sm:bottom-24 right-2 sm:right-4 w-24 sm:w-44 aspect-video rounded-lg overflow-hidden border border-neutral-700 shadow-xl bg-neutral-800">
            {lk.isCamOn && lk.localVideoTrack ? (
              <SafeVideoRenderer track={lk.localVideoTrack} isLocal={true} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                <FaVideoSlash className="text-neutral-600 text-lg sm:text-xl" />
              </div>
            )}
            <span className="absolute bottom-1 left-1 sm:left-2 text-[9px] sm:text-[10px] font-medium px-1 sm:px-1.5 py-0.5 rounded bg-black/60">
              You
            </span>
          </div>

          {/* Hidden audio sinks */}
          <audio ref={remoteAudioRef} autoPlay className="hidden" />
          <audio ref={screenAudioRef} autoPlay className="hidden" />
        </section>

        {/* ── Side panel (desktop) / bottom sheet (mobile) ── */}
        {activePanel && (
          <>
            <div
              onClick={() => setActivePanel(null)}
              className="sm:hidden fixed inset-0 bg-black/60 z-20"
            />
            <aside className="fixed sm:static inset-x-0 bottom-0 sm:inset-auto z-30 sm:z-10 h-[75vh] max-h-[75vh] sm:h-auto sm:max-h-none w-full sm:w-[360px] bg-neutral-900 border-t sm:border-t-0 sm:border-l border-neutral-800 flex flex-col rounded-t-2xl sm:rounded-none overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    if (activePanel !== "chat") openPanel("chat");
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                    activePanel === "chat"
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => {
                    if (activePanel !== "notes") setActivePanel("notes");
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                    activePanel === "notes"
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  My Notes
                </button>
              </div>
              <button
                onClick={() => setActivePanel(null)}
                className="p-2 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>

            {activePanel === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {chat.messages.length === 0 && (
                    <p className="text-center text-xs text-neutral-500 mt-8">
                      No messages yet. Start the conversation.
                    </p>
                  )}
                  {chat.messages.map((m, i) => (
                    <div key={m.id || i} className="flex flex-col">
                      <span className="text-xs font-medium text-blue-400">{m.senderUsername}</span>
                      {m.isFile ? (
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-emerald-400 hover:underline break-all"
                        >
                          <FaPaperclip className="inline mr-1 text-xs" />
                          {m.fileName}
                        </a>
                      ) : (
                        <span className="text-sm text-neutral-200 whitespace-pre-wrap break-words">
                          {m.text}
                        </span>
                      )}
                    </div>
                  ))}
                  {chat.isTyping && (
                    <div className="text-xs text-neutral-500 italic">Typing…</div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form
                  onSubmit={handleSend}
                  className="flex items-center gap-2 px-3 pt-3 pb-24 sm:pb-3 border-t border-neutral-800"
                >
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="p-2 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition"
                    title="Attach file"
                  >
                    <FaPaperclip />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    onChange={handleFile}
                  />
                  <input
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      chat.sendTyping(e.target.value.length > 0);
                    }}
                    onBlur={() => chat.sendTyping(false)}
                    placeholder="Type a message"
                    className="flex-1 bg-neutral-800 border border-neutral-700 focus:border-blue-500 focus:outline-none rounded-md px-3 py-2 text-sm placeholder-neutral-500"
                  />
                  <button
                    type="submit"
                    className="p-2 text-white bg-blue-600 hover:bg-blue-500 rounded-md transition disabled:opacity-40"
                    disabled={!chatInput.trim()}
                  >
                    <FaPaperPlane className="text-sm" />
                  </button>
                </form>
              </>
            )}

            {activePanel === "notes" && (
              <div className="flex-1 flex flex-col p-4 gap-3 pb-24 sm:pb-4">
                <p className="text-[11px] text-neutral-500 uppercase tracking-wide">
                  Private — only you can see these
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={handleNoteSave}
                  placeholder="Write your notes here…"
                  className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-blue-500 focus:outline-none rounded-md p-3 text-sm placeholder-neutral-600 text-neutral-200 resize-none"
                />
                <button
                  onClick={handleNoteSave}
                  className="py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-sm font-medium transition"
                >
                  Save note
                </button>
              </div>
            )}
          </aside>
          </>
        )}
      </div>

      {/* ── Floating toolbar ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-1.5 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-full px-2 py-2 shadow-2xl">
          <ToolbarButton
            onClick={lk.toggleMic}
            active={lk.isMicOn}
            icon={lk.isMicOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
            label={lk.isMicOn ? "Mute" : "Unmute"}
          />
          <ToolbarButton
            onClick={lk.toggleCamera}
            active={lk.isCamOn}
            icon={lk.isCamOn ? <FaVideo /> : <FaVideoSlash />}
            label={lk.isCamOn ? "Stop video" : "Start video"}
          />
          <ToolbarButton
            onClick={async () => {
              try {
                await lk.toggleScreenShare();
              } catch (err) {
                // If the user simply cancelled the share dialog, don't show an error alert
                if (err.name === "NotAllowedError" || err.message?.includes("Permission denied")) {
                  return;
                }
                alert("Screen sharing failed: It may be unsupported on this device or blocked by your browser settings.");
              }
            }}
            highlight={lk.isScreenSharing}
            icon={<FaDesktop />}
            label={lk.isScreenSharing ? "Stop share" : "Share"}
            disabled={!lk.isScreenSharing && false} // Removed hardware gate to allow attempts
          />
          <ToolbarButton
            onClick={() => openPanel("chat")}
            highlight={activePanel === "chat"}
            icon={<FaRegCommentDots />}
            label="Chat"
            badge={unreadCount}
          />
          <ToolbarButton
            onClick={() => openPanel("notes")}
            highlight={activePanel === "notes"}
            icon={<FaRegStickyNote />}
            label="Notes"
          />

          <div className="w-px h-8 bg-neutral-800 mx-0.5 sm:mx-1" />

          <button
            onClick={triggerEndCall}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 h-10 sm:h-12 rounded-full bg-red-600 hover:bg-red-500 transition shadow-lg shadow-red-500/20"
            title="End call"
          >
            <FaPhoneSlash className="text-sm sm:text-base" />
            <span className="text-xs sm:text-sm font-medium">End</span>
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showEndConfirm}
        onCancel={() => setShowEndConfirm(false)}
        onConfirm={() => {
          setShowEndConfirm(false);
          handleEndCall();
        }}
        title="End Call?"
        message="Are you sure you want to leave this meeting?"
      />
    </div>
  );
}

function ConfirmationModal({ isOpen, onConfirm, onCancel, title, message }) {
  if (!isOpen) return null;
  return (
    <ModalOverlay close={onCancel}>
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scaleIn text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <FaExclamationTriangle className="text-red-500 text-xl" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-neutral-400 mb-6 text-sm">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium transition"
          >
            Go back
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition shadow-lg shadow-red-600/20"
          >
            End Call
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function ToolbarButton({ onClick, active = true, highlight = false, icon, label, badge = 0, disabled = false }) {
  const base = "relative flex flex-col items-center justify-center w-11 sm:w-14 h-10 sm:h-12 rounded-full transition text-[10px] gap-0.5";
  const style = highlight
    ? "bg-blue-600 hover:bg-blue-500 text-white"
    : active
    ? "bg-neutral-800 hover:bg-neutral-700 text-white"
    : "bg-red-600/90 hover:bg-red-500 text-white";
  
  const disabledStyle = disabled ? "opacity-30 cursor-not-allowed grayscale" : "";

  return (
    <button 
      onClick={disabled ? undefined : onClick} 
      className={`${base} ${style} ${disabledStyle}`} 
      title={label}
      disabled={disabled}
    >
      <span className="text-sm sm:text-base">{icon}</span>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-1 rounded-full bg-red-500 text-[9px] sm:text-[10px] font-semibold flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

export function VideoCallPage() {
  const { call_room_id } = useParams();
  const navigate = useNavigate();
  const token = getAccessToken();

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-950 text-white">
        Session expired. Please login again.
      </div>
    );
  }

  if (!call_room_id) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-950 text-white">
        Call session ID was not found. Please join from your bookings.
      </div>
    );
  }

  return (
    <VideoCallComponent
      call_room_id={call_room_id}
      token={token}
      onCallEnd={() => navigate("/my-bookings")}
    />
  );
}
