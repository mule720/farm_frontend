import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PhoneIncoming, PhoneOff } from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import { JOIN_VIDEO_CALL } from '@/graphql/videoQueries';
import VideoConsultationRoom from './VideoConsultationRoom';
import { useAuth } from '@/contexts/AuthContext';

// ─── Polling query ────────────────────────────────────────────────────────────
const POLL_INCOMING = `
  query IncomingVideoCall {
    notifications(unreadOnly: true, category: "video_call", limit: 1) {
      id
      title
      message
      refId
    }
  }
`;

const MARK_READ = `
  mutation MarkRead($id: String!) {
    markNotificationRead(id: $id) {
      ok
    }
  }
`;

interface Notification {
  id: string;
  title: string;
  message: string;
  refId: string;
}

interface ActiveRoom {
  callId: string;
  jitsiDomain: string;
  roomName: string;
  token: string;
}

/**
 * Polls for video_call notifications every 30 s.  When one arrives, shows a
 * ringing banner.  The user can Join (→ full-screen Jitsi room) or Decline.
 *
 * Mount this once in AppLayout so it's visible on every page.
 */
const IncomingCallBanner: React.FC = () => {
  const { profile } = useAuth();
  const user = profile;
  const [incoming, setIncoming] = useState<Notification | null>(null);
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);
  const [joining, setJoining] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());

  const poll = useCallback(async () => {
    if (!user) return;
    try {
      const data = await gqlRequest<{ notifications: Notification[] }>(POLL_INCOMING, {});
      const notif = data?.notifications?.[0];
      if (notif && !seenIds.current.has(notif.id)) {
        setIncoming(notif);
      }
    } catch (_) { /* offline — skip */ }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    poll(); // immediate check on mount / login
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [user, poll]);

  if (activeRoom) {
    return (
      <VideoConsultationRoom
        callId={activeRoom.callId}
        jitsiDomain={activeRoom.jitsiDomain}
        roomName={activeRoom.roomName}
        token={activeRoom.token}
        displayName={user?.full_name || user?.email || 'Farmer'}
        onClose={() => setActiveRoom(null)}
      />
    );
  }

  if (!incoming) return null;

  const handleDecline = async () => {
    seenIds.current.add(incoming.id);
    try { await gqlRequest(MARK_READ, { id: incoming.id }); } catch (_) { /* best-effort */ }
    setIncoming(null);
  };

  const handleJoin = async () => {
    setJoining(true);
    seenIds.current.add(incoming.id);
    try { await gqlRequest(MARK_READ, { id: incoming.id }); } catch (_) { /* best-effort */ }
    try {
      const data = await gqlRequest<{ joinVideoCall: { success: boolean; error?: string; roomName: string; jitsiDomain: string; token: string; call: { id: string } } }>(
        JOIN_VIDEO_CALL, { callId: incoming.refId }
      );
      const result = data?.joinVideoCall;
      if (result?.success) {
        setIncoming(null);
        setActiveRoom({
          callId: result.call.id,
          jitsiDomain: result.jitsiDomain,
          roomName: result.roomName,
          token: result.token,
        });
      } else {
        console.error('Join failed:', result?.error);
        setIncoming(null);
      }
    } catch (e) {
      console.error('Join error:', e);
      setIncoming(null);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="fixed top-4 inset-x-0 z-[90] flex justify-center px-4 pointer-events-none">
      <div className="bg-white rounded-xl border shadow-xl px-5 py-4 flex items-center gap-4 max-w-md w-full pointer-events-auto">
        <div className="p-2.5 rounded-full bg-green-100 text-green-700 animate-pulse flex-shrink-0">
          <PhoneIncoming className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Incoming video call</p>
          <p className="text-xs text-gray-500 truncate">{incoming.message}</p>
        </div>
        <button
          onClick={handleDecline}
          disabled={joining}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-400 flex-shrink-0"
          aria-label="Decline"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
        <button
          onClick={handleJoin}
          disabled={joining}
          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-60 flex-shrink-0"
        >
          {joining ? 'Joining…' : 'Join'}
        </button>
      </div>
    </div>
  );
};

export default IncomingCallBanner;
