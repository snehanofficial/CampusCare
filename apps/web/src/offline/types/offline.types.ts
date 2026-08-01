export interface PendingAction {
  id: string;
  actionType: string; // e.g. "CREATE_TICKET", "UPDATE_TICKET"
  endpoint: string;
  payload: any;
  createdAt: number;
  retryCount: number;
  status: "PENDING" | "PROCESSING" | "FAILED";
  error?: string;
}

export interface SyncMetadata {
  key: string; // e.g. "status"
  lastSyncTime: number | null;
  syncStatus: "IDLE" | "SYNCING" | "FAILED";
  failedCount: number;
}

export interface OfflineConflict {
  id: string; // maps to entityId
  actionId: string;
  clientData: any;
  serverData: any;
  status: "PENDING_REVIEW" | "RESOLVED" | "FAILED";
  createdAt: number;
}
