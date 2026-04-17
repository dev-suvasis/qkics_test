import { useState, useRef, useCallback, useEffect } from "react";
import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
  setLogLevel,
} from "livekit-client";

setLogLevel("warn");

export function useLiveKit() {
  const roomRef = useRef(null);
  const connectPromiseRef = useRef(null);

  const [connectionState, setConnectionState] = useState(
    ConnectionState.Disconnected
  );

  const [localVideoTrack, setLocalVideoTrack] = useState(null);

  const [remoteTracks, setRemoteTracks] = useState({});

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isScreenShareSupported, setIsScreenShareSupported] = useState(false);

  useEffect(() => {
    setIsScreenShareSupported(
      !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)
    );
  }, []);

  // ───────── TRACK ROUTING ─────────
  const routeTrackIn = useCallback((track, participant) => {
    const id = participant.identity;

    setRemoteTracks((prev) => {
      // Clone to avoid mutating previous state
      const user = { ...(prev[id] || {}) };
      user.name = participant.name || participant.identity;

      const src = track.source;
      const isScreen =
        src === Track.Source.ScreenShare ||
        src === Track.Source.ScreenShareAudio;

      if (track.kind === "video") {
        if (isScreen) {
          user.screen = track;
        } else {
          user.video = track;
        }
      }

      if (track.kind === "audio") {
        if (isScreen) {
          user.screenAudio = track;
        } else {
          user.audio = track;
        }
      }

      return { ...prev, [id]: user };
    });
  }, []);

  const routeTrackOut = useCallback((track, participant) => {
    const id = participant.identity;

    setRemoteTracks((prev) => {
      const user = prev[id];
      if (!user) return prev;

      const updated = { ...user };

      const isScreen =
        track.source === Track.Source.ScreenShare ||
        track.source === Track.Source.ScreenShareAudio;

      if (track.kind === "video") {
        if (isScreen) delete updated.screen;
        else delete updated.video;
      }

      if (track.kind === "audio") {
        if (isScreen) delete updated.screenAudio;
        else delete updated.audio;
      }

      return { ...prev, [id]: updated };
    });
  }, []);

  // Sync all tracks from all existing remote participants
  const syncExistingParticipants = useCallback((room) => {
    room.remoteParticipants?.forEach((participant) => {
      participant.trackPublications?.forEach((publication) => {
        if (!publication.isSubscribed) {
          try {
            publication.setSubscribed(true);
          } catch { /* subscription in progress */ }
        }
        if (publication.track) {
          routeTrackIn(publication.track, participant);
        }
      });
    });
  }, [routeTrackIn]);

  // ───────── CONNECT ─────────
  const connect = useCallback(async (livekitUrl, livekitToken, onRemoteLeave) => {
    if (connectPromiseRef.current) return connectPromiseRef.current;

    const promise = (async () => {
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        stopLocalTrackOnUnpublish: true,
      });

      // CONNECTION STATE
      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionState(state);
      });

      // TRACK EVENTS — use stable wrappers so we always get the latest routeTrack logic
      room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
        console.log("TrackSubscribed:", participant.identity, track.kind, track.source);
        routeTrackIn(track, participant);
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, _pub, participant) => {
        routeTrackOut(track, participant);
      });

      room.on(RoomEvent.TrackPublished, async (publication) => {
        // Ensure we subscribe to any newly published track
        if (!publication.isSubscribed) {
          try {
            await publication.setSubscribed(true);
          } catch { /* auto-subscribe may handle it */ }
        }
      });

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log("ParticipantConnected:", participant.identity);

        participant.trackPublications?.forEach((publication) => {
          if (!publication.isSubscribed) {
            try {
              publication.setSubscribed(true);
            } catch { /* subscription in progress */ }
          }
          if (publication.track) {
            routeTrackIn(publication.track, participant);
          }
        });
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log("ParticipantDisconnected:", participant.identity);
        setRemoteTracks((prev) => {
          const updated = { ...prev };
          delete updated[participant.identity];
          return updated;
        });
        
        // If the 1:1 partner leaves, notify the component
        if (room.remoteParticipants.size === 0) {
          onRemoteLeave?.();
        }
      });

      // LOCAL TRACKS
      room.on(RoomEvent.LocalTrackPublished, (publication) => {
        if (publication.source === Track.Source.Camera) {
          setLocalVideoTrack(publication.track || null);
          setIsCamOn(true);
        }
        if (publication.source === Track.Source.Microphone) {
          setIsMicOn(true);
        }
        if (publication.source === Track.Source.ScreenShare) {
          setIsScreenSharing(true);
        }
      });

      room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
        if (publication.source === Track.Source.Camera) {
          setLocalVideoTrack(null);
          setIsCamOn(false);
        }
        if (publication.source === Track.Source.Microphone) {
          setIsMicOn(false);
        }
        if (publication.source === Track.Source.ScreenShare) {
          setIsScreenSharing(false);
        }
      });

      // CONNECT
      try {
        await room.connect(livekitUrl.trim(), livekitToken.trim());

        try {
          await room.localParticipant.setCameraEnabled(true);
          const camPub = room.localParticipant.getTrack(Track.Source.Camera);
          if (camPub?.track) setLocalVideoTrack(camPub.track);
          setIsCamOn(true);
        } catch (camErr) {
          console.warn("Camera failed or not found:", camErr);
          setIsCamOn(false);
        }

        try {
          await room.localParticipant.setMicrophoneEnabled(true);
          setIsMicOn(true);
        } catch (micErr) {
          console.warn("Microphone failed or not found:", micErr);
          setIsMicOn(false);
        }

        roomRef.current = room;

        // Sync tracks from participants who were already in the room
        syncExistingParticipants(room);

        setIsMicOn(room.localParticipant.isMicrophoneEnabled);
        setIsCamOn(room.localParticipant.isCameraEnabled);

        return room;
      } catch (err) {
        connectPromiseRef.current = null;
        try {
          await room.disconnect();
        } catch { /* cleanup best-effort */ }
        throw err;
      }
    })();

    connectPromiseRef.current = promise;
    return promise;
  }, [routeTrackIn, routeTrackOut, syncExistingParticipants]);

  // ───────── CONTROLS ─────────
  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(next);
    setIsMicOn(next);
  }, []);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;

    const next = !room.localParticipant.isCameraEnabled;
    await room.localParticipant.setCameraEnabled(next);
    setIsCamOn(next);

    if (!next) {
      setLocalVideoTrack(null);
    } else {
      const camPub = room.localParticipant.getTrack(Track.Source.Camera);
      if (camPub?.track) setLocalVideoTrack(camPub.track);
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;

    try {
      const next = !room.localParticipant.isScreenShareEnabled;
      await room.localParticipant.setScreenShareEnabled(next);
      setIsScreenSharing(next);
    } catch (err) {
      console.error("Failed to toggle screen share:", err);
      // On mobile/unsupported browsers, this will throw
      setIsScreenSharing(false);
      throw err;
    }
  }, []);

  const disconnect = useCallback(async () => {
    const pending = connectPromiseRef.current;
    connectPromiseRef.current = null;

    if (pending) {
      try {
        await pending;
      } catch {}
    }

    const room = roomRef.current;
    roomRef.current = null;

    if (room) {
      try {
        room.removeAllListeners();
        await room.disconnect();
      } catch {}
    }

    setConnectionState(ConnectionState.Disconnected);
    setLocalVideoTrack(null);
    setRemoteTracks({});
  }, []);

  // CLEANUP
  useEffect(() => {
    return () => {
      connectPromiseRef.current = null;
      const room = roomRef.current;
      roomRef.current = null;
      room?.removeAllListeners();
      room?.disconnect().catch(() => {});
    };
  }, []);

  // 🔥 Extract single remote (1:1 call)
  const remoteId = Object.keys(remoteTracks)[0];
  const remoteParticipant = remoteTracks[remoteId] || {};

  return {
    connect,
    disconnect,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    connectionState,
    localVideoTrack,
    remoteVideoTrack: remoteParticipant.video || null,
    remoteAudioTrack: remoteParticipant.audio || null,
    screenShareTrack: remoteParticipant.screen || null,
    screenShareAudioTrack: remoteParticipant.screenAudio || null,
    remoteName: remoteParticipant.name || remoteId || null,
    isMicOn,
    isCamOn,
    isScreenSharing,
    isScreenShareSupported,
    isConnected: connectionState === ConnectionState.Connected,
  };
}