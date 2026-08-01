import { Bell, Check, Info, AlertTriangle, CheckCircle, AlertOctagon, Trash, ExternalLink } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover.js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationRepository } from "../../lib/repositories/notification.repository.js";
import { toast } from "sonner";
import { Link } from "react-router";

export function NotificationBell() {
  const queryClient = useQueryClient();

  // 1. Query unread count
  const { data: unreadResponse } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationRepository.list({ filters: { isRead: "false" } }),
    refetchInterval: 30000, // Poll every 30s for live-feeling feed
  });

  // 2. Query recent notifications
  const { data: recentResponse, isLoading } = useQuery({
    queryKey: ["notifications", "recent"],
    queryFn: () => notificationRepository.list({ page: 1, pageSize: 5 }),
    refetchInterval: 30000,
  });

  const unreadCount = unreadResponse?.total ?? 0;
  const notifications = recentResponse?.data ?? [];

  // 3. Mutations
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationRepository.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All announcements marked as read.");
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationRepository.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification dismissed.");
    },
  });

  const getIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case "WARNING":
        return <AlertTriangle className="size-4 text-warning" />;
      case "ERROR":
        return <AlertOctagon className="size-4 text-destructive" />;
      case "SUCCESS":
        return <CheckCircle className="size-4 text-success" />;
      case "TICKET":
        return <Info className="size-4 text-primary" />;
      default:
        return <Info className="size-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center justify-center p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all focus:outline-none cursor-pointer"
          aria-label="View notifications"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 overflow-hidden border border-border shadow-lg bg-card">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20">
          <h3 className="text-xs font-bold text-foreground">Announcements</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-50"
            >
              <Check className="size-3" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto py-0.5 divide-y divide-border/40 select-none">
          {isLoading ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              No new alerts
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`flex gap-3 p-3 transition-colors hover:bg-accent/40 ${
                  item.isRead ? "opacity-60" : "bg-primary/5"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">{getIcon(item.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {item.title}
                    </p>
                    <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                      {typeof item.createdAt === "string" ? item.createdAt : new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                  {!item.isRead && (
                    <button
                      onClick={() => markReadMutation.mutate(item.id)}
                      className="text-[9px] text-primary font-bold hover:underline mt-1 cursor-pointer block"
                    >
                      Mark read
                    </button>
                  )}
                </div>
                <div className="flex-shrink-0 flex flex-col justify-between items-end gap-2">
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded-sm hover:bg-muted cursor-pointer"
                    title="Dismiss"
                  >
                    <Trash className="size-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border/40 bg-muted/10 p-2 text-center">
          <Link
            to="/notifications"
            className="text-[11px] text-primary hover:underline flex items-center justify-center gap-1 font-bold cursor-pointer"
          >
            View Notification History
            <ExternalLink className="size-3" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
export default NotificationBell;
