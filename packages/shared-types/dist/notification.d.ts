export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    isRead: boolean;
    type: string;
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
//# sourceMappingURL=notification.d.ts.map