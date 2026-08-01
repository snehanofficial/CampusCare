import { IndexedDBHelper } from "../db/indexeddb.js";
import type { OfflineConflict } from "../types/offline.types.js";

export class ConflictResolver {
  /**
   * Compare timestamps. Creates a conflict log entry if the server record
   * is newer than the client's base model.
   */
  static async detectConflict(
    actionId: string,
    entityId: string,
    clientBaseUpdatedAt: string | Date,
    serverUpdatedAt: string | Date,
    clientData: any,
    serverData: any
  ): Promise<boolean> {
    const clientTime = new Date(clientBaseUpdatedAt).getTime();
    const serverTime = new Date(serverUpdatedAt).getTime();

    // If server's last updated timestamp is newer than what client loaded, it is a conflict
    if (serverTime > clientTime) {
      const conflict: OfflineConflict = {
        id: entityId,
        actionId,
        clientData,
        serverData,
        status: "PENDING_REVIEW",
        createdAt: Date.now(),
      };
      
      await IndexedDBHelper.put("conflicts", conflict);
      window.dispatchEvent(new CustomEvent("offline-conflicts-changed"));
      return true;
    }

    return false;
  }

  /**
   * Resolve a recorded conflict. Marks the log resolved, and delegates cleanup.
   */
  static async resolveConflict(id: string, decision: "OVERWRITE" | "DISCARD"): Promise<void> {
    const conflict = await IndexedDBHelper.get("conflicts", id);
    if (!conflict) return;

    // 1. Mark conflict resolved in DB
    conflict.status = "RESOLVED";
    await IndexedDBHelper.put("conflicts", conflict);

    const actionId = conflict.actionId;

    if (decision === "OVERWRITE") {
      // Overwrite: Fetch the action and bypass conflict comparisons in next sync
      // Reset action status to PENDING and retryCount to 0 so the sync loop executes it
      const action = await IndexedDBHelper.get("pending_actions", actionId);
      if (action) {
        // Change actionType to bypass or flag bypass settings
        action.status = "PENDING";
        action.retryCount = 0;
        // Strip baseUpdatedAt to force bypass timestamp validation
        if (action.payload) {
          action.payload.baseUpdatedAt = new Date().toISOString(); // make it equal to bypass
        }
        await IndexedDBHelper.put("pending_actions", action);
      }
    } else {
      // Discard: Remove the action from the Sync Queue completely
      await IndexedDBHelper.delete("pending_actions", actionId);
    }

    window.dispatchEvent(new CustomEvent("offline-conflicts-changed"));
    window.dispatchEvent(new CustomEvent("offline-queue-changed"));
  }

  /**
   * Retrieve all recorded active conflicts.
   */
  static async getPendingConflicts(): Promise<OfflineConflict[]> {
    const conflicts = await IndexedDBHelper.getAll("conflicts");
    return conflicts.filter((c) => c.status === "PENDING_REVIEW");
  }
}
export default ConflictResolver;
