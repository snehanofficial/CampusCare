export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "TECHNICIAN" | "STUDENT" | "FACULTY";
  departmentId?: string;
  phone?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
  createdTicketsCount?: number;
  assignedTicketsCount?: number;
}

export const mockUsers: MockUser[] = [
  {
    id: "u-1",
    email: "alex.admin@campuscare.edu",
    firstName: "Alex",
    lastName: "Admin",
    role: "ADMIN",
    departmentId: "d-1",
    phone: "+1 (555) 019-2834",
    status: "ACTIVE",
    createdAt: "2025-01-10T08:00:00Z",
  },
  {
    id: "u-2",
    email: "sarah.tech@campuscare.edu",
    firstName: "Sarah",
    lastName: "Technician",
    role: "TECHNICIAN",
    departmentId: "d-1",
    phone: "+1 (555) 014-9382",
    status: "ACTIVE",
    createdAt: "2025-02-15T09:30:00Z",
  },
  {
    id: "u-3",
    email: "john.student@campuscare.edu",
    firstName: "John",
    lastName: "Student",
    role: "STUDENT",
    departmentId: "d-2",
    phone: "+1 (555) 012-4829",
    status: "ACTIVE",
    createdAt: "2025-09-01T10:00:00Z",
  },
  {
    id: "u-4",
    email: "jane.faculty@campuscare.edu",
    firstName: "Jane",
    lastName: "Faculty",
    role: "FACULTY",
    departmentId: "d-3",
    phone: "+1 (555) 017-3829",
    status: "ACTIVE",
    createdAt: "2025-08-20T11:15:00Z",
  },
  {
    id: "u-5",
    email: "robert.jackson@campuscare.edu",
    firstName: "Robert",
    lastName: "Jackson",
    role: "TECHNICIAN",
    departmentId: "d-1",
    phone: "+1 (555) 018-4920",
    status: "ACTIVE",
    createdAt: "2025-03-01T08:45:00Z",
  },
  {
    id: "u-6",
    email: "emily.watson@campuscare.edu",
    firstName: "Emily",
    lastName: "Watson",
    role: "STUDENT",
    departmentId: "d-2",
    phone: "+1 (555) 011-3049",
    status: "ACTIVE",
    createdAt: "2025-09-05T14:20:00Z",
  },
];
