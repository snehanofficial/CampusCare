import { useState, useEffect } from "react";
import { SyncManager } from "../offline/sync/sync.manager.js";

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Kickstart background sync queue replay
      SyncManager.triggerSync().catch((err) => {
        console.error("[useOfflineStatus] Failed to trigger sync on restore:", err);
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}
export default useOfflineStatus;
