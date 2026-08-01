export interface MockTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  creatorId: string;
  assigneeId?: string;
  categoryId: string;
  departmentId: string;
  isIncident: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  reopenCount?: number;
  reopenReason?: string;
  dueAt?: string;
  creatorName?: string;
  assigneeName?: string;
  categoryName?: string;
  departmentName?: string;
}


export const mockTickets: MockTicket[] = [
  {
    id: "t-1",
    ticketNumber: "INC-1029",
    title: "Wi-Fi connectivity dropped in Library 2nd Floor",
    description: "Students are reporting constant authentication errors when connecting to Campus-Secure Wi-Fi. AP seems to reject new associations.",
    status: "OPEN",
    priority: "CRITICAL",
    creatorId: "u-3",
    categoryId: "cat-1",
    departmentId: "d-1",
    isIncident: true,
    createdAt: "2026-07-30T10:00:00Z",
    updatedAt: "2026-07-30T10:00:00Z",
    dueAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Breached
  },
  {
    id: "t-2",
    ticketNumber: "INC-1030",
    title: "Software license activation issue on Lab PC #12",
    description: "MATLAB software license expired and needs verification under campus academic bundle.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    creatorId: "u-4",
    assigneeId: "u-2",
    categoryId: "cat-2",
    departmentId: "d-1",
    isIncident: false,
    createdAt: "2026-07-30T14:30:00Z",
    updatedAt: "2026-07-31T09:00:00Z",
    dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(), // 4h 15m remaining
  },
  {
    id: "t-3",
    ticketNumber: "INC-1031",
    title: "Broken projector in Seminar Hall B",
    description: "The ceiling mounted EPSON projector does not turn on. Status indicator flashing amber. Needs technician evaluation.",
    status: "ASSIGNED",
    priority: "HIGH",
    creatorId: "u-1",
    assigneeId: "u-2",
    categoryId: "cat-3",
    departmentId: "d-1",
    isIncident: false,
    createdAt: "2026-07-31T08:15:00Z",
    updatedAt: "2026-07-31T08:30:00Z",
  },
  {
    id: "t-4",
    ticketNumber: "INC-1032",
    title: "Reset password support for SIS student portal",
    description: "Locked out of my Student Information System account. Need a temporary security key to restore authentication.",
    status: "RESOLVED",
    priority: "LOW",
    creatorId: "u-3",
    assigneeId: "u-2",
    categoryId: "cat-4",
    departmentId: "d-1",
    isIncident: false,
    createdAt: "2026-07-29T11:00:00Z",
    updatedAt: "2026-07-29T16:00:00Z",
    resolvedAt: "2026-07-29T16:00:00Z",
  },
  {
    id: "t-5",
    ticketNumber: "INC-1033",
    title: "Main switchboard fiber link down",
    description: "Core fiber link between Building A and central IT datacenter is reporting packet loss and interface flaps.",
    status: "OPEN",
    priority: "CRITICAL",
    creatorId: "u-4",
    categoryId: "cat-1",
    departmentId: "d-1",
    isIncident: true,
    createdAt: "2026-07-31T20:00:00Z",
    updatedAt: "2026-07-31T20:00:00Z",
  },
  {
    id: "t-6",
    ticketNumber: "INC-1034",
    title: "Request for CAD software installation on Mech Lab Workstations",
    description: "Mechanical Engineering students require Autodesk Inventor pre-installed on 30 workstations for the upcoming semester labs.",
    status: "OPEN",
    priority: "MEDIUM",
    creatorId: "u-4",
    categoryId: "cat-2",
    departmentId: "d-3",
    isIncident: false,
    createdAt: "2026-07-31T22:30:00Z",
    updatedAt: "2026-07-31T22:30:00Z",
  }
];
