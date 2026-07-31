export const QUERY_KEYS = {
  auth: {
    me: ["auth", "me"] as const,
    sessions: ["auth", "sessions"] as const,
  },
  tickets: {
    list: (filters?: any) => ["tickets", "list", filters] as const,
    detail: (id: string) => ["tickets", "detail", id] as const,
  },
  assets: {
    list: (filters?: any) => ["assets", "list", filters] as const,
    detail: (id: string) => ["assets", "detail", id] as const,
  },
  inventory: {
    list: (filters?: any) => ["inventory", "list", filters] as const,
    detail: (id: string) => ["inventory", "detail", id] as const,
  },
  departments: {
    list: () => ["departments", "list"] as const,
  },
  users: {
    list: (filters?: any) => ["users", "list", filters] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  audit: {
    list: (filters?: any) => ["audit", "list", filters] as const,
  },
} as const;
