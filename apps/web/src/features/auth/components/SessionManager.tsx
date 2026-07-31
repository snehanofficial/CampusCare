import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth.api.js";
import { Laptop, Smartphone, Tablet, XCircle, AlertCircle, Shield } from "lucide-react";
import { toast } from "sonner";

export function SessionManager() {
  const queryClient = useQueryClient();

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ["auth", "sessions"],
    queryFn: authApi.getSessions,
  });

  const revokeMutation = useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] });
      toast.success("Device session revoked successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to revoke device session");
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: authApi.logoutAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] });
      toast.success("All other device sessions revoked");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to revoke sessions");
    },
  });

  const getDeviceIcon = (type?: string) => {
    switch (type) {
      case "mobile":
        return <Smartphone className="size-5 text-muted-foreground" />;
      case "tablet":
        return <Tablet className="size-5 text-muted-foreground" />;
      default:
        return <Laptop className="size-5 text-muted-foreground" />;
    }
  };

  const parseActivityDate = (dateStr: string | Date) => {
    try {
      const elapsed = Date.now() - new Date(dateStr).getTime();
      const seconds = Math.floor(elapsed / 1000);
      if (seconds < 60) return "just now";
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return "recently";
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-5 rounded bg-muted w-1/4" />
        <div className="space-y-2">
          <div className="h-12 rounded bg-muted w-full" />
          <div className="h-12 rounded bg-muted w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive flex items-center justify-center gap-2">
        <AlertCircle className="size-5" />
        <span className="text-sm font-medium">Failed to load active sessions</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-border/60 bg-muted/20 gap-3">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Active Sessions</h3>
            <p className="text-xs text-muted-foreground">
              Devices currently signed in to your account
            </p>
          </div>
        </div>
        {sessions && sessions.length > 1 && (
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to log out from all other devices?")) {
                revokeAllMutation.mutate();
              }
            }}
            disabled={revokeAllMutation.isPending}
            className="rounded bg-destructive/15 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
          >
            Sign Out All Other Devices
          </button>
        )}
      </div>

      <div className="divide-y divide-border/60">
        {sessions?.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between p-4 hover:bg-accent/10 transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="rounded-md bg-muted/65 p-2 mt-0.5">
                {getDeviceIcon(session.deviceType)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  {session.deviceName || "Unknown Device"}{" "}
                  {session.ipAddress && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      ({session.ipAddress})
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {session.browser || "Unknown Browser"} on {session.os || "Unknown OS"}
                </p>
                <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                  Active {parseActivityDate(session.lastActivity)}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                if (window.confirm("Revoke this session and force sign-out?")) {
                  revokeMutation.mutate(session.id);
                }
              }}
              disabled={revokeMutation.isPending}
              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors focus:outline-none"
              title="Revoke Session"
              aria-label="Revoke Session"
            >
              <XCircle className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
export default SessionManager;
