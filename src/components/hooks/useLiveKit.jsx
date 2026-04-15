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
        if (isScreen) user.screen = track;
        else user.video = track;
      }

      if (track.kind === "audio") {
        if (isScreen) user.screenAudio = track;
        else user.audio = track;
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
  const connect = useCallback(async (url, token) => {
    if (connectPromiseRef.current) return connectPromiseRef.current;

    const promise = (async () => {
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        stopLocalTrackOnUnpublish: true,
      });

      // connection state
      room.on(RoomEvent.ConnectionStateChanged, setConnectionState);

      // track events
      room.on(RoomEvent.TrackSubscribed, (track, _, participant) => {
        routeTrackIn(track, participant);
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, _, participant) => {
        routeTrackOut(track, participant);
      });

      room.on(RoomEvent.TrackPublished, async (pub) => {
        try {
          await pub.setSubscribed(true);
        } catch {}
      });

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        // delayed sync for late join
        setTimeout(() => {
          participant.tracks.forEach(async (pub) => {
            try {
              await pub.setSubscribed(true);
            } catch {}

            if (pub.track) {
              routeTrackIn(pub.track, participant);
            }
          });
        }, 500);
      });

      // local track events
      room.on(RoomEvent.LocalTrackPublished, (pub) => {
        if (pub.source === Track.Source.Camera) {
          setLocalVideoTrack(pub.track || null);
          setIsCamOn(true);
        }
        if (pub.source === Track.Source.Microphone) setIsMicOn(true);
        if (pub.source === Track.Source.ScreenShare)
          setIsScreenSharing(true);
      });

      room.on(RoomEvent.LocalTrackUnpublished, (pub) => {
        if (pub.source === Track.Source.Camera) {
          setLocalVideoTrack(null);
          setIsCamOn(false);
        }
        if (pub.source === Track.Source.Microphone) setIsMicOn(false);
        if (pub.source === Track.Source.ScreenShare)
          setIsScreenSharing(false);
      });

      // CONNECT
      await room.connect(url.trim(), token.trim());

      const p = room.localParticipant;

      // 🔥 CRITICAL FIX: camera renegotiation
      await p.enableMicrophone();

      await p.setCameraEnabled(false);
      await new Promise((r) => setTimeout(r, 300));
      await p.setCameraEnabled(true);

      // 🔥 EXTRA SAFETY (handles late join perfectly)
      setTimeout(async () => {
        if (p.isCameraEnabled) {
          await p.setCameraEnabled(false);
          await new Promise((r) => setTimeout(r, 500));
          await p.setCameraEnabled(true);
        }
      }, 1000);

      // get local camera
      const camPub = p.getTrack(Track.Source.Camera);
      if (camPub?.track) setLocalVideoTrack(camPub.track);

      // 🔥 FORCE SYNC TRACKS
      const forceSync = () => {
        room.participants.forEach((participant) => {
          participant.tracks.forEach(async (pub) => {
            try {
              await pub.setSubscribed(true);
            } catch {}

            if (pub.track) {
              routeTrackIn(pub.track, participant);
            }
          });
        });
      };

      forceSync();
      setTimeout(forceSync, 500);
      setTimeout(forceSync, 1500);

      roomRef.current = room;

      setIsMicOn(p.isMicrophoneEnabled);
      setIsCamOn(p.isCameraEnabled);

      return room;
    })();

    connectPromiseRef.current = promise;
    return promise;
  }, []);

  // ───────── CONTROLS ─────────
  const toggleMic = useCallback(async () => {
    const r = roomRef.current;
    if (!r) return;
    const next = !r.localParticipant.isMicrophoneEnabled;
    await r.localParticipant.setMicrophoneEnabled(next);
    setIsMicOn(next);
  }, []);

  const toggleCamera = useCallback(async () => {
    const r = roomRef.current;
    if (!r) return;
    const next = !r.localParticipant.isCameraEnabled;
    await r.localParticipant.setCameraEnabled(next);
    setIsCamOn(next);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const r = roomRef.current;
    if (!r) return;
    const next = !r.localParticipant.isScreenShareEnabled;
    await r.localParticipant.setScreenShareEnabled(next);
    setIsScreenSharing(next);
  }, []);

  // ───────── DISCONNECT ─────────
  const disconnect = useCallback(async () => {
    const room = roomRef.current;
    roomRef.current = null;
    connectPromiseRef.current = null;

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

  // cleanup
  useEffect(() => {
    return () => {
      roomRef.current?.removeAllListeners();
      roomRef.current?.disconnect().catch(() => {});
    };
  }, []);

  // extract single remote (1:1)
  const remote = Object.values(remoteTracks)[0] || {};

  return {
    connect,
    disconnect,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    connectionState,
    localVideoTrack,
    remoteVideoTrack: remote.video || null,
    remoteAudioTrack: remote.audio || null,
    screenShareTrack: remote.screen || null,
    screenShareAudioTrack: remote.screenAudio || null,
    isMicOn,
    isCamOn,
    isScreenSharing,
    isConnected: connectionState === ConnectionState.Connected,
  };
}