import { useState, useEffect } from "react";
import { IndexedDBHelper } from "../offline/db/indexeddb.js";
import { SyncQueue } from "../offline/queue/sync.queue.js";

export function useSyncStatus() {
  const [status, setStatus] = useState<{
    pendingCount: number;
    syncing: boolean;
    lastSync: Date | null;
  }>({
    pendingCount: 0,
    syncing: false,
    lastSync: null,
  });

  const loadStatus = async () => {
    try {
      const pending = await SyncQueue.getPending();
      const meta = await IndexedDBHelper.get("sync_metadata", "status");

      setStatus({
        pendingCount: pending.length,
        syncing: meta?.syncStatus === "SYNCING",
        lastSync: meta?.lastSyncTime ? new Date(meta.lastSyncTime) : null,
      });
    } catch (err) {
      console.error("[useSyncStatus] Error loading sync status:", err);
    }
  };

  useEffect(() => {
    loadStatus();

    window.addEventListener("sync-metadata-changed", loadStatus);
    window.addEventListener("offline-queue-changed", loadStatus);

    return () => {
      window.removeEventListener("sync-metadata-changed", loadStatus);
      window.removeEventListener("offline-queue-changed", loadStatus);
    };
  }, []);

  return status;
}
export default useSyncStatus;
