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

      // Use track.source (on the Track object) — always reliable regardless of
      // how/when the publication arrives. publication.source can be "unknown"
      // for late-joiners or when the track is absorbed from an existing participant.
      const routeTrackIn = (track, _publication) => {
        const src = track.source; // Track.Source enum — always populated
        const isScreen =
          src === Track.Source.ScreenShare ||
          src === Track.Source.ScreenShareAudio;

        if (track.kind === "video") {
          if (isScreen) {
            setScreenShareTrack(track);
          } else {
            // Camera track from remote participant
            setRemoteVideoTrack(track);
          }
        } else if (track.kind === "audio") {
          if (isScreen) {
            setScreenShareAudioTrack(track);
          } else {
            setRemoteAudioTrack(track);
          }
        }
      };

      const routeTrackOut = (track, _publication) => {
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

      // Absorb tracks already published by participants who joined before us.
      // Iterate subscribed publications and call routeTrackIn for each one
      // that already has a live track attached.
      const absorbExistingTracks = (participant) => {
        participant.tracks.forEach((publication) => {
          // Force subscription if not yet subscribed
          if (!publication.isSubscribed) {
            try { publication.setSubscribed(true); } catch { /* ignore */ }
          }
          // Route the track if it's already attached
          if (publication.track) {
            routeTrackIn(publication.track, publication);
          }
        });
      };

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        absorbExistingTracks(participant);
      });

      // Also handle TrackPublished for participants already in room when we join
      // (covers the case where a participant publishes a new track mid-call)
      room.on(RoomEvent.TrackPublished, (publication, participant) => {
        // Subscribe to it so TrackSubscribed fires
        if (!publication.isSubscribed) {
          try { publication.setSubscribed(true); } catch { /* ignore */ }
        }
      });

      try {
        await room.connect(livekitUrl.trim(), livekitToken.trim());
        await room.localParticipant.enableCameraAndMicrophone();

        const camPub = room.localParticipant.getTrack(Track.Source.Camera);
        if (camPub?.track) setLocalVideoTrack(camPub.track);

        // Absorb any remote participants already in the room
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