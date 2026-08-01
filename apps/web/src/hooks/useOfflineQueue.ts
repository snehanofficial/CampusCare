import { useState, useEffect } from "react";
import { SyncQueue } from "../offline/queue/sync.queue.js";
import { SyncManager } from "../offline/sync/sync.manager.js";
import type { PendingAction } from "../offline/types/offline.types.js";

export function useOfflineQueue() {
  const [queue, setQueue] = useState<PendingAction[]>([]);

  const loadQueue = async () => {
    try {
      const pending = await SyncQueue.getPending();
      setQueue(pending);
    } catch (err) {
      console.error("[useOfflineQueue] Error loading action queue:", err);
    }
  };

  useEffect(() => {
    loadQueue();
    window.addEventListener("offline-queue-changed", loadQueue);
    return () => {
      window.removeEventListener("offline-queue-changed", loadQueue);
    };
  }, []);

  const enqueueAction = async (actionType: string, endpoint: string, payload: any) => {
    return await SyncQueue.enqueue(actionType, endpoint, payload);
  };

  const removeAction = async (id: string) => {
    await SyncQueue.remove(id);
  };

  const triggerSync = async () => {
    await SyncManager.triggerSync();
  };

  return {
    queue,
    enqueueAction,
    removeAction,
    triggerSync,
  };
}
export default useOfflineQueue;
