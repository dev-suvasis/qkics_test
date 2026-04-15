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
  const [remoteVideoTrack, setRemoteVideoTrack] = useState(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState(null);
  const [screenShareTrack, setScreenShareTrack] = useState(null);
  const [screenShareAudioTrack, setScreenShareAudioTrack] = useState(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const connect = useCallback(async (livekitUrl, livekitToken) => {
    if (connectPromiseRef.current) return connectPromiseRef.current;

    const promise = (async () => {
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        stopLocalTrackOnUnpublish: true,
      });

      // ───────── CONNECTION STATE ─────────
      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionState(state);
      });

      // ───────── TRACK ROUTING ─────────
      const routeTrackIn = (track) => {
        const src = track.source;

        const isScreen =
          src === Track.Source.ScreenShare ||
          src === Track.Source.ScreenShareAudio;

        if (track.kind === "video") {
          if (isScreen) {
            setScreenShareTrack(track);
          } else {
            setRemoteVideoTrack(track); // always overwrite (important)
          }
        } else if (track.kind === "audio") {
          if (isScreen) {
            setScreenShareAudioTrack(track);
          } else {
            setRemoteAudioTrack(track);
          }
        }
      };

      const routeTrackOut = (track) => {
        const src = track?.source;

        const isScreen =
          src === Track.Source.ScreenShare ||
          src === Track.Source.ScreenShareAudio;

        if (track?.kind === "video") {
          if (isScreen) {
            setScreenShareTrack(null);
          } else {
            setRemoteVideoTrack(null);
          }
        } else if (track?.kind === "audio") {
          if (isScreen) {
            setScreenShareAudioTrack(null);
          } else {
            setRemoteAudioTrack(null);
          }
        }
      };

      // ───────── EVENTS ─────────
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log("🎥 Subscribed:", participant.identity, track.kind);
        routeTrackIn(track);
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        routeTrackOut(track);
      });

      room.on(RoomEvent.TrackPublished, async (publication) => {
        try {
          await publication.setSubscribed(true);
        } catch (e) {
          console.warn("Subscription failed:", e);
        }
      });

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log("👤 Participant joined:", participant.identity);

        // delayed sync for late join
        setTimeout(() => {
          participant.tracks.forEach(async (publication) => {
            try {
              await publication.setSubscribed(true);
            } catch {}

            if (publication.track) {
              routeTrackIn(publication.track);
            }
          });
        }, 500);
      });

      // ───────── LOCAL TRACK EVENTS ─────────
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

      // ───────── CONNECT ─────────
      try {
        await room.connect(livekitUrl.trim(), livekitToken.trim());

        await room.localParticipant.enableCameraAndMicrophone();

        const camPub = room.localParticipant.getTrack(Track.Source.Camera);
        if (camPub?.track) setLocalVideoTrack(camPub.track);

        // 🔥 CRITICAL FIX: FORCE TRACK SYNC (multi-pass)
        const forceTrackSync = () => {
          console.log("🔁 Force syncing tracks...");

          room.participants.forEach((participant) => {
            participant.tracks.forEach(async (publication) => {
              try {
                await publication.setSubscribed(true);
              } catch {}

              if (publication.track) {
                routeTrackIn(publication.track);
              }
            });
          });
        };

        // run multiple times to defeat race conditions
        forceTrackSync();
        setTimeout(forceTrackSync, 500);
        setTimeout(forceTrackSync, 1500);
        setTimeout(forceTrackSync, 3000);

        roomRef.current = room;

        setIsMicOn(room.localParticipant.isMicrophoneEnabled);
        setIsCamOn(room.localParticipant.isCameraEnabled);

        return room;
      } catch (err) {
        connectPromiseRef.current = null;
        try {
          await room.disconnect();
        } catch {}
        throw err;
      }
    })();

    connectPromiseRef.current = promise;
    return promise;
  }, []);

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

    const next = !room.localParticipant.isScreenShareEnabled;
    await room.localParticipant.setScreenShareEnabled(next);
    setIsScreenSharing(next);
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
    setRemoteVideoTrack(null);
    setRemoteAudioTrack(null);
    setScreenShareTrack(null);
    setScreenShareAudioTrack(null);
  }, []);

  // ───────── CLEANUP ─────────
  useEffect(() => {
    return () => {
      connectPromiseRef.current = null;
      const room = roomRef.current;
      roomRef.current = null;
      room?.removeAllListeners();
      room?.disconnect().catch(() => {});
    };
  }, []);

  return {
    connect,
    disconnect,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    connectionState,
    localVideoTrack,
    remoteVideoTrack,
    remoteAudioTrack,
    screenShareTrack,
    screenShareAudioTrack,
    isMicOn,
    isCamOn,
    isScreenSharing,
    isConnected: connectionState === ConnectionState.Connected,
  };
}