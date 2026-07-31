export interface Ticket {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    creatorId: string;
    assigneeId?: string;
    categoryId: string;
    departmentId: string;
    assetId?: string;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
}
export interface TicketComment {
    id: string;
    ticketId: string;
    authorId: string;
    content: string;
    isInternal: boolean;
    createdAt: Date;
}
export interface TicketAttachment {
    id: string;
    ticketId: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedById: string;
    createdAt: Date;
}
//# sourceMappingURL=ticket.d.ts.map