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

  // 🔥 NEW: store tracks per participant
  const [remoteTracks, setRemoteTracks] = useState({});

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // ───────── TRACK ROUTING ─────────
  const routeTrackIn = (track, participant) => {
    const id = participant.identity;

    setRemoteTracks((prev) => {
      const user = prev[id] || {};

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
  };

  const routeTrackOut = (track, participant) => {
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
  };

  // ───────── CONNECT ─────────
  const connect = useCallback(async (livekitUrl, livekitToken) => {
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

      // TRACK EVENTS
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log("🎥 Subscribed:", participant.identity, track.kind);
        routeTrackIn(track, participant);
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        routeTrackOut(track, participant);
      });

      room.on(RoomEvent.TrackPublished, async (publication) => {
        try {
          await publication.setSubscribed(true);
        } catch {}
      });

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log("👤 Joined:", participant.identity);

        // delayed sync
        setTimeout(() => {
          participant.tracks.forEach(async (publication) => {
            try {
              await publication.setSubscribed(true);
            } catch {}

            if (publication.track) {
              routeTrackIn(publication.track, participant);
            }
          });
        }, 500);
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

        await room.localParticipant.enableCameraAndMicrophone();

        const camPub = room.localParticipant.getTrack(Track.Source.Camera);
        if (camPub?.track) setLocalVideoTrack(camPub.track);

        // 🔥 FORCE SYNC (multi-pass)
        const forceSync = () => {
          room.participants.forEach((participant) => {
            participant.tracks.forEach(async (publication) => {
              try {
                await publication.setSubscribed(true);
              } catch {}

              if (publication.track) {
                routeTrackIn(publication.track, participant);
              }
            });
          });
        };

        forceSync();
        setTimeout(forceSync, 500);
        setTimeout(forceSync, 1500);
        setTimeout(forceSync, 3000);

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
  const remoteParticipant = Object.values(remoteTracks)[0] || {};

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
    isMicOn,
    isCamOn,
    isScreenSharing,
    isConnected: connectionState === ConnectionState.Connected,
  };
}