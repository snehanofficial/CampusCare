export interface NotificationProvider {
  send(params: {
    userId: string;
    title: string;
    message: string;
    category: string; // TICKET | INCIDENT | ASSET | MAINTENANCE | INVENTORY | SLA | SYSTEM
    type: string; // INFO | SUCCESS | WARNING | ERROR
    referenceId?: string;
    actionUrl?: string;
    recipientType?: string;
    eventType?: string;
  }): Promise<void>;
}
