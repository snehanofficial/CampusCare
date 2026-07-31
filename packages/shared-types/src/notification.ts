export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string; // e.g. "TICKET_ASSIGNED", "TICKET_RESOLVED", "SLA_BREACH"
  referenceId?: string;
  createdAt: Date;
}

export interface WebPushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: Date;
}
