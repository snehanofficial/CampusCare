export interface MockNotification {
  id: string;
  title: string;
  message: string;
  type: "TICKET" | "WARNING" | "SYSTEM" | "SUCCESS";
  isRead: boolean;
  createdAt: string;
}

export const mockNotifications: MockNotification[] = [
  {
    id: "n-1",
    title: "New Assignment",
    message: "Ticket INC-1029 has been assigned to you.",
    type: "TICKET",
    isRead: false,
    createdAt: "5m ago",
  },
  {
    id: "n-2",
    title: "SLA Warning",
    message: "Ticket INC-1025 is nearing SLA response breach.",
    type: "WARNING",
    isRead: false,
    createdAt: "1h ago",
  },
  {
    id: "n-3",
    title: "System Update",
    message: "Campus Wi-Fi status updated to operational.",
    type: "SYSTEM",
    isRead: true,
    createdAt: "1d ago",
  },
  {
    id: "n-4",
    title: "Projector Repaired",
    message: "Maintenance request for Seminar Hall B has been resolved.",
    type: "SUCCESS",
    isRead: true,
    createdAt: "2d ago",
  }
];
