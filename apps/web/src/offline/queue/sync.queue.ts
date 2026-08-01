import { IndexedDBHelper } from "../db/indexeddb.js";
import type { PendingAction } from "../types/offline.types.js";

export class SyncQueue {
  /**
   * Add a pending REST action to the offline sync queue.
   */
  static async enqueue(actionType: string, endpoint: string, payload: any): Promise<PendingAction> {
    const action: PendingAction = {
      id: crypto.randomUUID(),
      actionType,
      endpoint,
      payload,
      createdAt: Date.now(),
      retryCount: 0,
      status: "PENDING",
    };

    await IndexedDBHelper.put("pending_actions", action);

    // Broadcast change events to reactive components and hooks
    window.dispatchEvent(new CustomEvent("offline-queue-changed"));
    return action;
  }

  /**
   * Retrieve all pending sync actions sorted by creation timestamp.
   */
  static async getPending(): Promise<PendingAction[]> {
    const actions = await IndexedDBHelper.getAll("pending_actions");
    return actions.sort((a, b) => a.createdAt - b.createdAt);
  }

  /**
   * Remove a completed or discarded action from the queue.
   */
  static async remove(id: string): Promise<void> {
    await IndexedDBHelper.delete("pending_actions", id);
    window.dispatchEvent(new CustomEvent("offline-queue-changed"));
  }

  /**
   * Update the status, error text, and retry attempts of a pending action in IndexedDB.
   */
  static async updateStatus(
    id: string,
    status: "PENDING" | "PROCESSING" | "FAILED",
    error?: string,
    retryCount?: number
  ): Promise<void> {
    const action = await IndexedDBHelper.get("pending_actions", id);
    if (!action) return;

    action.status = status;
    if (error !== undefined) action.error = error;
    if (retryCount !== undefined) action.retryCount = retryCount;

    await IndexedDBHelper.put("pending_actions", action);
    window.dispatchEvent(new CustomEvent("offline-queue-changed"));
  }
}
export default SyncQueue;
