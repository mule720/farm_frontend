import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import { END_VIDEO_CALL } from '@/graphql/videoQueries';

// Hand-declared types for the Jitsi IFrame API (loaded dynamically — no npm package)
declare global {
  interface Window {
    JitsiMeetExternalAPI: new (
      domain: string,
      options: {
        roomName: string;
        jwt?: string;
        parentNode: HTMLElement;
        width: string | number;
        height: string | number;
        userInfo?: { displayName: string; email?: string };
        configOverwrite?: Record<string, unknown>;
        interfaceConfigOverwrite?: Record<string, unknown>;
      }
    ) => JitsiMeetAPI;
  }
}

interface JitsiMeetAPI {
  addEventListeners(events: Record<string, () => void>): void;
  dispose(): void;
}

interface VideoConsultationRoomProps {
  callId: string;
  jitsiDomain: string;
  roomName: string;
  token: string;
  displayName: string;
  onClose: () => void;
}

/**
 * Full-screen Jitsi video room.  Loads external_api.js dynamically so no npm
 * package is needed.  Fires endVideoCall mutation when the user leaves.
 */
const VideoConsultationRoom: React.FC<VideoConsultationRoomProps> = ({
  callId, jitsiDomain, roomName, token, displayName, onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef       = useRef<JitsiMeetAPI | null>(null);

  useEffect(() => {
    const scriptSrc = `https://${jitsiDomain}/external_api.js`;

    function initJitsi() {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

      apiRef.current = new window.JitsiMeetExternalAPI(jitsiDomain, {
        roomName,
        jwt: token,
        parentNode: containerRef.current,
        width:  '100%',
        height: '100%',
        userInfo: { displayName },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking:  true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop',
            'fullscreen', 'fodeviceselection', 'hangup', 'chat',
            'settings', 'raisehand', 'videoquality', 'tileview',
          ],
        },
      });

      apiRef.current.addEventListeners({
        readyToClose: handleClose,
        videoConferenceLeft: handleClose,
      });
    }

    async function handleClose() {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
      try {
        await gqlRequest(END_VIDEO_CALL, { callId });
      } catch (_) { /* best-effort */ }
      onClose();
    }

    // Load Jitsi script once, then init
    if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else {
      const existing = document.querySelector(`script[src="${scriptSrc}"]`);
      if (existing) {
        existing.addEventListener('load', initJitsi);
      } else {
        const script = document.createElement('script');
        script.src   = scriptSrc;
        script.async = true;
        script.onload = initJitsi;
        document.head.appendChild(script);
      }
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white text-sm">
        <span className="font-medium">📹 Video Consultation — AgroNexus</span>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-gray-700 transition-colors"
          aria-label="Close room"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Jitsi renders here */}
      <div ref={containerRef} className="flex-1" />
    </div>
  );
};

export default VideoConsultationRoom;
