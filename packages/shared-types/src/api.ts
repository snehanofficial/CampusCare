export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: string;
  permissions: string[];
  departmentId?: string | null;
}

export interface Session {
  id: string;
  userId: string;
  deviceName?: string | null;
  deviceType?: string | null;
  browser?: string | null;
  os?: string | null;
  ipAddress?: string | null;
  lastActivity: Date | string;
  expiresAt: Date | string;
  createdAt: Date | string;
}

export interface LoginResult {
  user: AuthUser;
  accessToken: string;
}

export interface RefreshResult {
  accessToken: string;
}
