import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./useSocket.js";
import { toast } from "sonner";

export function useRealtimeNotifications() {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new, live notification updates
    socket.on("notification:new", (notification: any) => {
      // 1. Refetch and invalidate notifications list/unread counts
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      // 2. Dispatch a notification toast alert
      toast(notification.title || "New Announcement", {
        description: notification.message,
        action: notification.actionUrl
          ? {
              label: "View Details",
              onClick: () => {
                window.location.href = notification.actionUrl;
              },
            }
          : undefined,
      });
    });

    return () => {
      socket.off("notification:new");
    };
  }, [socket, isConnected, queryClient]);

  return { isConnected };
}
export default useRealtimeNotifications;
