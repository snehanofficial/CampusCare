# STATE_MANAGEMENT.md
## CampusCare — State Management Architecture

> **Status:** Phase 1 Implementation Reference  
> **Stack:** TanStack Query v5 · React Context · React 19 · Zustand (optional, not yet used)

---

## 1. Purpose

This document defines the state management strategy for CampusCare. The goal is to use the **right tool for the right kind of state**, avoiding both over-engineering (global state for everything) and under-engineering (prop-drilling through 10 components).

---

## 2. State Taxonomy

CampusCare state is classified into four categories, each with its own management strategy:

| Category | Examples | Tool |
|:---|:---|:---|
| **Server State** | Tickets, Assets, Users (from API) | TanStack Query v5 |
| **Auth State** | Current user, access token, permissions | React Context (`AuthContext`) |
| **UI State** | Sidebar open/closed, modal visibility, theme | `useState` / Custom Hooks |
| **Form State** | Form field values, validation errors | React Hook Form |

**Philosophy:** There is no global state management library (no Redux, no Zustand). React Context is used only for truly global concerns (auth, theme). Everything else is either server state (TanStack Query) or local component state.

---

## 3. Server State — TanStack Query v5

### Why TanStack Query?
- Handles loading, error, and success states automatically
- Deduplicates identical requests
- Background refetching keeps data fresh
- Cache invalidation on mutation
- Built-in pagination, infinite scroll support
- Devtools for debugging cache state
- Optimistic updates for responsive UI

### Core Concepts in Our Stack

**Query Key Convention:**
```typescript
// Every feature defines its own query keys as a factory
export const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  list: (filters: TicketFilters) => [...ticketKeys.lists(), filters] as const,
  details: () => [...ticketKeys.all, "detail"] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
};
```

**Why factories?** Enables hierarchical invalidation — `queryClient.invalidateQueries({ queryKey: ticketKeys.all })` invalidates ALL ticket queries (lists + details).

**Stale Time Configuration by Feature:**
```typescript
// Tickets change frequently
const TICKETS_STALE_TIME = 30_000; // 30 seconds

// Assets change infrequently
const ASSETS_STALE_TIME = 5 * 60_000; // 5 minutes

// Roles/Permissions rarely change
const RBAC_STALE_TIME = 30 * 60_000; // 30 minutes

// User profile
const PROFILE_STALE_TIME = 5 * 60_000; // 5 minutes
```

### Standard Query Pattern
```typescript
// Each feature exports typed hooks from hooks/ directory
export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.detail(ticketId),
    queryFn: () => ticketsApi.getById(ticketId),
    enabled: !!ticketId, // Only run if ticketId exists
    staleTime: TICKETS_STALE_TIME,
  });
}
```

### Standard Mutation Pattern
```typescript
export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateTicketInput & { id: string }) =>
      ticketsApi.update(id, input),

    // Optimistic update
    onMutate: async ({ id, ...newData }) => {
      await queryClient.cancelQueries({ queryKey: ticketKeys.detail(id) });
      const previous = queryClient.getQueryData(ticketKeys.detail(id));
      queryClient.setQueryData(ticketKeys.detail(id), (old: Ticket) => ({
        ...old,
        ...newData,
      }));
      return { previous };
    },

    onError: (err, { id }, context) => {
      // Rollback optimistic update
      queryClient.setQueryData(ticketKeys.detail(id), context?.previous);
      toast.error("Failed to update ticket");
    },

    onSuccess: (updated, { id }) => {
      queryClient.setQueryData(ticketKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      toast.success("Ticket updated");
    },
  });
}
```

---

## 4. Auth State — React Context

### Why React Context (not TanStack Query)?
Auth state is global client-side state — it does not need caching, deduplication, or background refetching. It changes infrequently (login/logout/session restore). Context is the correct, simple solution.

### AuthContext Shape
```typescript
// features/auth/store/auth-context.tsx
interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
}

interface AuthContextValue {
  // State
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";

  // Actions
  login: (credentials: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

### Provider Initialization Flow
```tsx
// features/auth/store/AuthProvider.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("loading");

  // Session restore on mount — runs ONCE
  useEffect(() => {
    authService.refreshSession()
      .then((user) => {
        setUser(user);
        setStatus("authenticated");
      })
      .catch(() => {
        setStatus("unauthenticated");
      });
  }, []);

  // ... login/logout implementations

  return (
    <AuthContext.Provider value={{ user, status, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Custom Hook
```typescript
// features/auth/hooks/useAuth.ts
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

---

## 5. UI State — Local State + Custom Hooks

### 5.1 `useDisclosure` — Modal/Sheet/Drawer State
```typescript
// hooks/useDisclosure.ts
interface UseDisclosureReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useDisclosure(initialState = false): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState(initialState);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}

// Usage:
const { isOpen, open, close } = useDisclosure();
<Button onClick={open}>Create Ticket</Button>
<CreateTicketDialog isOpen={isOpen} onClose={close} />
```

### 5.2 `useTheme` — Dark/Light/System Theme
```typescript
// hooks/useTheme.ts
type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>("campuscare-theme", "system");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(systemDark ? "dark" : "light");
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return { theme, setTheme };
}
```

### 5.3 `useDebounce` — Search Input Debouncing
```typescript
// hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage:
const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 300);
const { data } = useTickets({ search: debouncedSearch });
```

### 5.4 `useLocalStorage` — Persistent UI State
```typescript
// hooks/useLocalStorage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = typeof newValue === "function"
        ? (newValue as (prev: T) => T)(prev)
        : newValue;
      localStorage.setItem(key, JSON.stringify(resolved));
      return resolved;
    });
  }, [key]);

  return [value, setStoredValue] as const;
}
```

---

## 6. Form State — React Hook Form

Form state is always local to the form component. Never lift form state into global stores.

See [FORM_VALIDATION.md](./FORM_VALIDATION.md) for full specification.

---

## 7. State Colocation Rules

1. **Start local:** Begin with `useState` in the component
2. **Lift when shared:** Move state to the nearest common ancestor if two sibling components need it
3. **Context for global:** Use Context only for truly app-wide state (auth, theme)
4. **Query for server:** All data from the API belongs in TanStack Query

### Anti-Patterns to Avoid

❌ **Don't do this:**
```typescript
// Global "tickets store" with all tickets in memory
const globalTicketStore = create<{ tickets: Ticket[] }>(...);
```

✅ **Do this instead:**
```typescript
// TanStack Query manages server data
const { data: tickets } = useTickets({ page: 1 });
```

❌ **Don't do this:**
```typescript
// Storing API response in useState
const [tickets, setTickets] = useState([]);
useEffect(() => {
  fetchTickets().then(setTickets);
}, []);
```

✅ **Do this instead:**
```typescript
// Let TanStack Query handle it
const { data: tickets, isLoading, error } = useTickets();
```

---

## 8. React 19 Features Used

### `use()` Hook
React 19 introduces `use()` for reading promises and context. For context reading:
```typescript
// React 19 syntax (alternative to useContext)
const auth = use(AuthContext);
```

We continue to use `useContext(AuthContext)` via the `useAuth()` hook wrapper for better error handling.

### Concurrent Mode
React 19 is in concurrent mode by default. All data fetching is through TanStack Query's Suspense mode:
```typescript
const { data } = useQuery({
  queryKey: ...,
  queryFn: ...,
  // No need for manual Suspense integration — TanStack Query handles it
});
```

---

## 9. DevTools Setup

Both TanStack Query DevTools (development only) and React DevTools support our state model:

```tsx
// app/app.tsx
const ReactQueryDevtools = import.meta.env.DEV
  ? (await import("@tanstack/react-query-devtools")).ReactQueryDevtools
  : () => null;

// In JSX:
<ReactQueryDevtools initialIsOpen={false} />
```

---

## 10. Future Extensibility

- **Zustand for complex UI state:** If a feature requires complex multi-component UI state (e.g., a multi-step wizard with shared state), add Zustand as a scoped feature store rather than lifting to global Context
- **Offline support:** TanStack Query's `networkMode: "offlineFirst"` enables the PWA to serve stale data when offline
- **Optimistic UI:** All mutations can be upgraded with `onMutate` optimistic updates without architectural changes
- **Real-time updates:** Socket.IO events invalidate TanStack Query cache keys, triggering automatic re-renders
