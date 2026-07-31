export const TICKET_STATUS = {
  OPEN: "OPEN",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  PENDING_CUSTOMER: "PENDING_CUSTOMER",
  PENDING_VENDOR: "PENDING_VENDOR",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED"
} as const;

export type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS];

export const TICKET_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
} as const;

export type TicketPriority = typeof TICKET_PRIORITY[keyof typeof TICKET_PRIORITY];
