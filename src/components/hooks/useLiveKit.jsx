import { useState, useRef, useCallback, useEffect } from "react";
import { Room, RoomEvent, Track, ConnectionState, setLogLevel } from "livekit-client";

setLogLevel("warn");

export function useLiveKit() {
  const roomRef = useRef(null);
  const connectPromiseRef = useRef(null);

  const [connectionState, setConnectionState] = useState(ConnectionState.Disconnected);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState(null);
  const [screenShareTrack, setScreenShareTrack] = useState(null);
  const [screenShareAudioTrack, setScreenShareAudioTrack] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const connect = useCallback((livekitUrl, livekitToken) => {
    if (connectPromiseRef.current) return connectPromiseRef.current;

    const promise = (async () => {
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        stopLocalTrackOnUnpublish: true,
      });

      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionState(state);
      });

      const routeTrackIn = (track, publication) => {
        const isScreen = publication.source === Track.Source.ScreenShare
          || publication.source === Track.Source.ScreenShareAudio;
        if (track.kind === "video") {
          if (isScreen) setScreenShareTrack(track);
          else setRemoteVideoTrack(track);
        } else if (track.kind === "audio") {
          if (isScreen) setScreenShareAudioTrack(track);
          else setRemoteAudioTrack(track);
        }
      };

      const routeTrackOut = (track, publication) => {
        const isScreen = publication.source === Track.Source.ScreenShare
          || publication.source === Track.Source.ScreenShareAudio;
        if (track?.kind === "video") {
          if (isScreen) setScreenShareTrack(null);
          else setRemoteVideoTrack(null);
        } else if (track?.kind === "audio") {
          if (isScreen) setScreenShareAudioTrack(null);
          else setRemoteAudioTrack(null);
        }
      };

      room.on(RoomEvent.TrackSubscribed, routeTrackIn);
      room.on(RoomEvent.TrackUnsubscribed, routeTrackOut);

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

      const absorbExistingTracks = (participant) => {
        participant.tracks.forEach((publication) => {
          if (!publication.isSubscribed) {
            try { publication.setSubscribed(true); } catch { /* ignore */ }
          }
          if (publication.track) routeTrackIn(publication.track, publication);
        });
      };

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        absorbExistingTracks(participant);
      });

      try {
        await room.connect(livekitUrl.trim(), livekitToken.trim());
        await room.localParticipant.enableCameraAndMicrophone();

        const camPub = room.localParticipant.getTrack(Track.Source.Camera);
        if (camPub?.track) setLocalVideoTrack(camPub.track);

        room.participants.forEach(absorbExistingTracks);

        roomRef.current = room;
        setIsMicOn(room.localParticipant.isMicrophoneEnabled);
        setIsCamOn(room.localParticipant.isCameraEnabled);
        return room;
      } catch (err) {
        connectPromiseRef.current = null;
        try { await room.disconnect(); } catch { /* ignore */ }
        throw err;
      }
    })();

    connectPromiseRef.current = promise;
    return promise;
  }, []);

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
    if (!next) setLocalVideoTrack(null);
    else {
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
      try { await pending; } catch { /* ignore */ }
    }
    const room = roomRef.current;
    roomRef.current = null;
    if (room) {
      try { await room.disconnect(); } catch { /* ignore */ }
    }
    setConnectionState(ConnectionState.Disconnected);
    setLocalVideoTrack(null);
    setRemoteVideoTrack(null);
    setRemoteAudioTrack(null);
    setScreenShareTrack(null);
    setScreenShareAudioTrack(null);
  }, []);

  useEffect(() => {
    return () => {
      connectPromiseRef.current = null;
      const room = roomRef.current;
      roomRef.current = null;
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
