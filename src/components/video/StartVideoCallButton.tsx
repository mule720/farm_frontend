import React, { useState } from 'react';
import { Video } from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import { START_VIDEO_CALL } from '@/graphql/videoQueries';
import VideoConsultationRoom from './VideoConsultationRoom';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  /** Marketplace provider UUID — stored on VideoCall.provider_id */
  providerId: string;
  providerName: string;
  subject?: string;
  /**
   * If the provider has a linked Django user (provider_user_id) the backend
   * will push a ring notification to them.  Optional — leave blank if
   * provider user linking isn't set up yet.
   */
  providerUserId?: string;
  className?: string;
}

interface ActiveRoom {
  callId: string;
  jitsiDomain: string;
  roomName: string;
  token: string;
}

/**
 * Drop into any provider detail view to start an instant Jitsi consultation.
 * Creates a VideoCall record, generates a JWT room token, and opens the room.
 * If providerUserId is supplied the backend pushes a ring notification to
 * the provider so they can join.
 */
const StartVideoCallButton: React.FC<Props> = ({
  providerId, providerName, subject, providerUserId, className,
}) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (activeRoom && profile) {
    return (
      <VideoConsultationRoom
        callId={activeRoom.callId}
        jitsiDomain={activeRoom.jitsiDomain}
        roomName={activeRoom.roomName}
        token={activeRoom.token}
        displayName={profile.full_name || profile.email}
        onClose={() => setActiveRoom(null)}
      />
    );
  }

  const handleStart = async () => {
    if (!profile) { setError('Sign in to start a video call'); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await gqlRequest<{
        startVideoCall: {
          success: boolean;
          error?: string;
          roomName: string;
          jitsiDomain: string;
          token: string;
          call: { id: string };
        };
      }>(START_VIDEO_CALL, {
        providerUserId,
        providerId,
        providerName,
        subject: subject || `Video call with ${providerName}`,
      });
      const result = data?.startVideoCall;
      if (!result?.success) {
        setError(result?.error || 'Could not start call');
        return;
      }
      setActiveRoom({
        callId:      result.call.id,
        jitsiDomain: result.jitsiDomain,
        roomName:    result.roomName,
        token:       result.token,
      });
    } catch (e: any) {
      setError(e.message || 'Could not start call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleStart}
        disabled={loading}
        className={className || 'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-green-600 hover:bg-green-700 text-white disabled:opacity-60'}
      >
        <Video size={13} />
        {loading ? 'Starting…' : 'Video Call'}
      </button>
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </div>
  );
};

export default StartVideoCallButton;
