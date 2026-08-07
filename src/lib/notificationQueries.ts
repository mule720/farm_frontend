// ─── GraphQL documents for the notification system ───────────────────────────

export const NOTIFICATIONS_QUERY = `
  query Notifications($unreadOnly: Boolean, $limit: Int) {
    notifications(unreadOnly: $unreadOnly, limit: $limit) {
      id
      title
      message
      category
      priority
      isRead
      readAt
      actionUrl
      createdAt
    }
    unreadCount
  }
`;

export const MARK_READ_MUTATION = `
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      notification { id isRead readAt }
    }
  }
`;

export const MARK_ALL_READ_MUTATION = `
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead { count }
  }
`;

export const DELETE_NOTIFICATION_MUTATION = `
  mutation DeleteNotification($id: ID!) {
    deleteNotification(id: $id) { success }
  }
`;

export const CLEAR_ALL_MUTATION = `
  mutation ClearAllNotifications {
    clearAllNotifications { count }
  }
`;
