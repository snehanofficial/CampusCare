export type AudienceType =
  | "ALL_USERS"
  | "STUDENTS"
  | "FACULTY"
  | "TECHNICIANS"
  | "DEPARTMENT_ADMIN"
  | "CUSTOM_USERS";

export type RecipientType = "USER" | "ROLE" | "DEPARTMENT" | "ALL_USERS";

export interface ResolvedRecipient {
  email: string;
  userId: string;
  recipientType: RecipientType;
}
