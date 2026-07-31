export declare const TICKET_STATUS: {
    readonly OPEN: "OPEN";
    readonly ASSIGNED: "ASSIGNED";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly PENDING_CUSTOMER: "PENDING_CUSTOMER";
    readonly PENDING_VENDOR: "PENDING_VENDOR";
    readonly RESOLVED: "RESOLVED";
    readonly CLOSED: "CLOSED";
};
export type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS];
export declare const TICKET_PRIORITY: {
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
    readonly CRITICAL: "CRITICAL";
};
export type TicketPriority = typeof TICKET_PRIORITY[keyof typeof TICKET_PRIORITY];
//# sourceMappingURL=tickets.d.ts.map