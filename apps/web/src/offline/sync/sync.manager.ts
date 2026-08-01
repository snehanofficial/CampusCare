import { SyncQueue } from "../queue/sync.queue.js";
import { ConflictResolver } from "./conflict.resolver.js";
import { apiClient } from "../../lib/api-client.js";
import { IndexedDBHelper } from "../db/indexeddb.js";

export class SyncManager {
  private static isSyncing = false;

  /**
   * Run synchronization loop. Processes all pending actions sequentially.
   */
  static async triggerSync(): Promise<void> {
    if (this.isSyncing) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    this.isSyncing = true;
    await this.updateMetadata("SYNCING");

    try {
      const pendingActions = await SyncQueue.getPending();

      for (const action of pendingActions) {
        if (action.status === "PROCESSING") continue;

        try {
          await SyncQueue.updateStatus(action.id, "PROCESSING");

          // 1. Concurrency Conflict Checks for updates
          if (action.actionType === "UPDATE_TICKET") {
            const ticketId = action.payload.id;
            const clientBaseUpdatedAt = action.payload.baseUpdatedAt;

            // Fetch current ticket state from database to inspect timestamps
            const serverResponse = await apiClient.get(`/tickets/${ticketId}`);
            const serverTicket = serverResponse.data?.data;

            if (serverTicket && clientBaseUpdatedAt) {
              const hasConflict = await ConflictResolver.detectConflict(
                action.id,
                ticketId,
                clientBaseUpdatedAt,
                serverTicket.updatedAt,
                action.payload.updates,
                serverTicket
              );

              if (hasConflict) {
                // Halt this action in failed/review state and proceed
                await SyncQueue.updateStatus(
                  action.id,
                  "FAILED",
                  "Conflict detected: Server has newer changes"
                );
                continue;
              }
            }
          }

          // 2. Dispatch REST API call
          if (action.actionType === "CREATE_TICKET") {
            await apiClient.post("/tickets", action.payload);
          } else if (action.actionType === "UPDATE_TICKET") {
            const ticketId = action.payload.id;
            await apiClient.patch(`/tickets/${ticketId}`, action.payload.updates);
          } else {
            // General endpoint replayer for future extensibility
            await apiClient.post(action.endpoint, action.payload);
          }

          // 3. Remove completed action from database queue
          await SyncQueue.remove(action.id);
        } catch (err: any) {
          const retryCount = action.retryCount + 1;
          const status = retryCount >= 3 ? "FAILED" : "PENDING";
          const errorMsg = err.response?.data?.message || err.message || "Network request failed";

          await SyncQueue.updateStatus(action.id, status, errorMsg, retryCount);

          if (retryCount >= 3) {
            console.error(`[SyncManager] Action ${action.id} permanently failed after 3 retries.`);
          }
        }
      }

      await this.updateMetadata("IDLE");
    } catch (err) {
      console.error("[SyncManager] Synchronization error occurred:", err);
      await this.updateMetadata("FAILED");
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Save status configurations to sync metadata store.
   */
  private static async updateMetadata(status: "IDLE" | "SYNCING" | "FAILED"): Promise<void> {
    const meta = {
      key: "status",
      lastSyncTime: status === "IDLE" ? Date.now() : null,
      syncStatus: status,
      failedCount: 0,
    };
    await IndexedDBHelper.put("sync_metadata", meta);
    window.dispatchEvent(new CustomEvent("sync-metadata-changed"));
  }
}
export default SyncManager;
