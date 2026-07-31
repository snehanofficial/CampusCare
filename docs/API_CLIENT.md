# API_CLIENT.md
## CampusCare — API Client Architecture

> **Status:** Phase 1 Implementation Reference  
> **Stack:** Axios · TanStack Query v5 · TypeScript  
> **File:** `apps/web/src/lib/api-client.ts`

---

## 1. Purpose

This document defines the API client layer for CampusCare. It covers the Axios instance configuration, request/response interceptors, automatic refresh token rotation, typed API responses, and the integration pattern with TanStack Query.

---

## 2. Architecture Overview

```
React Component / Hook
        │
        ▼
TanStack Query (useQuery / useMutation)
        │  Calls query functions from feature api/ files
        ▼
Feature API Layer  (features/tickets/api/tickets.api.ts)
        │  Calls apiClient methods
        ▼
API Client (lib/api-client.ts)  ← Axios Instance
        │
        ├─ Request Interceptor: Attach Authorization header
        │
        ▼
Express API (apps/api)
        │
        ▼
Response Interceptor: Handle errors, refresh logic
        │
        ├─ 401 + no refresh in progress → Try /auth/refresh
        │     ├─ Success → Retry original request with new token
        │     └─ Failure → Clear auth state, redirect to /login
        │
        └─ Other errors → Normalize into AppError
```

---

## 3. API Response Envelope

All CampusCare API responses follow a standard envelope defined by the backend:

```typescript
// packages/shared-types/src/api.ts
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;      // Machine-readable code: "INVALID_CREDENTIALS"
    message: string;   // Human-readable message
    details?: unknown; // Validation errors, field-level errors
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

## 4. Axios Instance Configuration

```typescript
// lib/api-client.ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";
const TIMEOUT_MS = 15_000; // 15 seconds

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  withCredentials: true,  // CRITICAL: enables HttpOnly cookie to be sent
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});
```

**`withCredentials: true` is mandatory.** Without it, the browser will not send the `refreshToken` HttpOnly cookie with cross-origin requests.

---

## 5. Request Interceptor — Token Attachment

```typescript
// Attach the access token from AuthStore to every outgoing request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStore.getAccessToken(); // Reads from in-memory store
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

**Note:** The access token is read from `authStore` — a module-level singleton that holds the token in memory. This is separate from React Context to allow non-React code (like Axios interceptors) to access it.

---

## 6. Response Interceptor — Refresh Logic

```typescript
let isRefreshing = false;
let pendingRequests: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

apiClient.interceptors.response.use(
  (response) => response, // Pass through successful responses
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only handle 401 on non-auth endpoints and non-retried requests
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/login")
    ) {
      return Promise.reject(normalizeError(error));
    }

    // Mark this request as a retry to prevent infinite loops
    originalRequest._retry = true;

    if (isRefreshing) {
      // Queue this request until refresh completes
      return new Promise((resolve, reject) => {
        pendingRequests.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newAccessToken = data.data.accessToken;
      authStore.setAccessToken(newAccessToken);

      // Retry all queued requests
      pendingRequests.forEach(({ resolve }) => resolve(newAccessToken));
      pendingRequests = [];

      // Retry the original request
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed — clear auth state and redirect
      pendingRequests.forEach(({ reject }) => reject(refreshError));
      pendingRequests = [];
      authStore.clearTokens();
      window.location.href = "/login"; // Hard redirect to clear React state
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
```

### Why a Queue (pendingRequests)?
When multiple API requests fire simultaneously and the access token expires, only ONE refresh request should be made. All other concurrent requests are held in the queue and retried once the refresh succeeds.

---

## 7. Error Normalization

All Axios errors are normalized into a consistent `AppError` shape:

```typescript
// lib/errors.ts
export interface AppError {
  code: string;
  message: string;
  status: number;
  details?: unknown;
}

export function normalizeError(error: AxiosError<ApiErrorResponse>): AppError {
  if (error.response) {
    // Server responded with an error status
    const apiError = error.response.data?.error;
    return {
      code: apiError?.code ?? "SERVER_ERROR",
      message: apiError?.message ?? "An unexpected error occurred",
      status: error.response.status,
      details: apiError?.details,
    };
  }

  if (error.request) {
    // Request was made but no response received
    return {
      code: "NETWORK_ERROR",
      message: "Unable to reach the server. Please check your connection.",
      status: 0,
    };
  }

  // Error in request setup
  return {
    code: "CLIENT_ERROR",
    message: error.message,
    status: 0,
  };
}
```

---

## 8. AuthStore (In-Memory Token Storage)

The `authStore` is a module-level singleton that provides non-reactive access to the access token for the Axios interceptor:

```typescript
// lib/auth-store.ts
// This is NOT a React context — it's a plain module for use by Axios interceptors
let accessToken: string | null = null;

export const authStore = {
  getAccessToken: () => accessToken,
  setAccessToken: (token: string) => { accessToken = token; },
  clearTokens: () => { accessToken = null; },
};
```

The `AuthContext` (React) and `authStore` (module) are kept in sync:
- On login → set both `AuthContext.user` and `authStore.accessToken`
- On logout → clear both
- On session restore → set both

---

## 9. Feature API Layer Pattern

Each feature module has its own API layer that wraps `apiClient`:

```typescript
// features/tickets/api/tickets.api.ts
import { apiClient } from "@/lib/api-client";
import type { Ticket, CreateTicketInput } from "@campuscare/shared-types";
import type { ApiSuccessResponse, PaginationMeta } from "@campuscare/shared-types";

export const ticketsApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const { data } = await apiClient.get<ApiSuccessResponse<Ticket[]>>("/tickets", { params });
    return data; // { data: Ticket[], meta: PaginationMeta }
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiSuccessResponse<Ticket>>(`/tickets/${id}`);
    return data.data;
  },

  create: async (input: CreateTicketInput) => {
    const { data } = await apiClient.post<ApiSuccessResponse<Ticket>>("/tickets", input);
    return data.data;
  },

  update: async (id: string, input: Partial<CreateTicketInput>) => {
    const { data } = await apiClient.patch<ApiSuccessResponse<Ticket>>(`/tickets/${id}`, input);
    return data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/tickets/${id}`);
  },
};
```

---

## 10. TanStack Query Integration

### Query Keys Convention
```typescript
// features/tickets/api/query-keys.ts
export const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  list: (filters: TicketFilters) => [...ticketKeys.lists(), filters] as const,
  details: () => [...ticketKeys.all, "detail"] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
};
```

### Query Hook Pattern
```typescript
// features/tickets/hooks/useTickets.ts
export function useTickets(filters: TicketFilters) {
  return useQuery({
    queryKey: ticketKeys.list(filters),
    queryFn: () => ticketsApi.getAll(filters),
    staleTime: 30_000,       // 30 seconds — ticket data changes often
    gcTime: 5 * 60_000,      // 5 minutes garbage collection time
    placeholderData: keepPreviousData, // Prevents flash on filter change
  });
}
```

### Mutation Hook Pattern
```typescript
// features/tickets/hooks/useCreateTicket.ts
export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ticketsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      toast.success("Ticket created successfully");
    },
    onError: (error: AppError) => {
      toast.error(error.message);
    },
  });
}
```

---

## 11. QueryClient Global Configuration

```typescript
// app/app.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,            // 1 minute default stale time
      gcTime: 10 * 60_000,          // 10 minutes garbage collection
      retry: (failureCount, error: AppError) => {
        // Don't retry on 401/403 — these are auth/permission issues
        if (error.status === 401 || error.status === 403) return false;
        return failureCount < 2;   // Retry up to 2 times for other errors
      },
      refetchOnWindowFocus: false,  // Avoid refetch on tab switch (enterprise app)
      refetchOnReconnect: true,     // Refetch on network reconnect
    },
    mutations: {
      retry: false, // Never auto-retry mutations
    },
  },
});
```

---

## 12. File Upload (Multipart)

For file uploads (ticket attachments, profile avatars):

```typescript
// lib/api-client.ts — Additional upload method
export async function uploadFile(
  endpoint: string,
  file: File,
  additionalData?: Record<string, string>
) {
  const formData = new FormData();
  formData.append("file", file);
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const { data } = await apiClient.post(endpoint, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent) => {
      // Emit progress if needed
    },
  });

  return data;
}
```

---

## 13. Environment Variables

```env
# apps/web/.env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
VITE_PORT=5173
```

All `VITE_` prefixed variables are exposed to client-side code. **Never** put secrets in client-side env vars.

---

## 14. Trade-offs & Decisions

| Decision | Alternative | Why We Chose This |
|:---|:---|:---|
| Axios | `fetch` | Interceptors, better TypeScript support, automatic JSON parsing, simpler error handling |
| In-memory token | `sessionStorage` | `sessionStorage` is accessible by JS; in-memory is truly XSS-safe |
| Request queue for refresh | Re-throw 401 | Queue prevents duplicate refresh calls and handles concurrent expired requests correctly |
| Feature-level API files | One global API file | Colocation: API, hooks, and types for a feature are together, not scattered |
| `ApiSuccessResponse<T>` generic | Direct return type | Consistent unwrapping pattern; response envelope is always present |

---

## 15. Future Extensibility

- **WebSocket integration:** Socket.IO client is initialized separately (`lib/socket-client.ts`) and does not go through Axios
- **Request cancellation:** Add AbortController support to query functions for cancelling in-flight requests when component unmounts
- **Optimistic updates:** Use TanStack Query's `onMutate` to optimistically update UI before server confirms
- **Offline queue:** Use TanStack Query's `networkMode: "offlineFirst"` for offline support in the PWA context
