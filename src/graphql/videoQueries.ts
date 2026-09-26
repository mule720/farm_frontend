// ─── Video Call GraphQL operations ───────────────────────────────────────────

export const START_VIDEO_CALL = `
  mutation StartVideoCall(
    $providerUserId: String
    $providerId: String
    $providerName: String
    $subject: String
  ) {
    startVideoCall(
      providerUserId: $providerUserId
      providerId: $providerId
      providerName: $providerName
      subject: $subject
    ) {
      success
      error
      roomName
      jitsiDomain
      token
      call {
        id
        status
      }
    }
  }
`;

export const JOIN_VIDEO_CALL = `
  mutation JoinVideoCall($callId: String!) {
    joinVideoCall(callId: $callId) {
      success
      error
      roomName
      jitsiDomain
      token
      call {
        id
        status
      }
    }
  }
`;

export const END_VIDEO_CALL = `
  mutation EndVideoCall($callId: String!) {
    endVideoCall(callId: $callId) {
      success
      error
      call {
        id
        status
      }
    }
  }
`;

export const MY_VIDEO_CALLS = `
  query MyVideoCalls($status: String, $limit: Int) {
    myVideoCalls(status: $status, limit: $limit) {
      id
      roomName
      providerName
      subject
      status
      startedAt
      joinedAt
      endedAt
    }
  }
`;
