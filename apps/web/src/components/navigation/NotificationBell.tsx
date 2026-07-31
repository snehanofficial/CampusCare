import { useState } from "react";
import { Bell, Check, Info, AlertTriangle, CheckCircle, AlertOctagon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover.js";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "New Assignment",
      message: "Ticket INC-1029 has been assigned to you.",
      type: "TICKET",
      isRead: false,
      createdAt: "5m ago",
    },
    {
      id: "2",
      title: "SLA Warning",
      message: "Ticket INC-1025 is nearing SLA response breach.",
      type: "WARNING",
      isRead: false,
      createdAt: "1h ago",
    },
    {
      id: "3",
      title: "System Update",
      message: "Campus Wi-Fi status updated to operational.",
      type: "SYSTEM",
      isRead: true,
      createdAt: "1d ago",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "WARNING":
        return <AlertTriangle className="size-4 text-warning" />;
      case "ERROR":
        return <AlertOctagon className="size-4 text-destructive" />;
      case "TICKET":
        return <Info className="size-4 text-primary" />;
      default:
        return <CheckCircle className="size-4 text-success" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center justify-center p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus:outline-none cursor-pointer"
          aria-label="View notifications"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 overflow-hidden border border-border">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20">
          <h3 className="text-xs font-bold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Check className="size-3" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto py-0.5 divide-y divide-border/40 select-none">
          {notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`flex gap-3 p-3 transition-colors hover:bg-accent/40 ${
                  item.isRead ? "opacity-75" : "bg-primary/5"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">{getIcon(item.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {item.title}
                    </p>
                    <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                      {item.createdAt}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {item.message}
                  </p>
                </div>
                <div className="flex-shrink-0 self-center">
                  <button
                    onClick={() => toggleRead(item.id)}
                    className={`size-2.5 rounded-full border border-primary/20 cursor-pointer ${
                      item.isRead ? "bg-transparent" : "bg-primary"
                    }`}
                    title={item.isRead ? "Mark unread" : "Mark read"}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
export default NotificationBell;
