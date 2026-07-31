import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../../auth/api/auth.api.js";
import { PageHeader } from "../../../components/common/PageHeader.js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card.js";
import { Button } from "../../../components/ui/button.js";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../components/ui/table.js";
import { LoadingSpinner } from "../../../components/ui/loading-spinner.js";
import { isMockEnabled, mockAdapters } from "../../../mocks/index.js";
import { toast } from "sonner";
import { Laptop, Smartphone, Tablet, KeyRound } from "lucide-react";
import { authStore } from "../../../lib/auth-store.js";
import type { Session } from "@campuscare/shared-types";

const getActiveSessionId = (): string | null => {
  const token = authStore.getAccessToken();
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]!));
      return payload.sessionId || null;
    }
  } catch {}
  return null;
};

export function SessionsPage() {
  const queryClient = useQueryClient();
  const activeSessionId = getActiveSessionId();
  const isMock = isMockEnabled();

  const { data: sessions = [], isLoading, error } = useQuery<Session[]>({
    queryKey: ["auth", "sessions"],
    queryFn: () => {
      if (isMock) {
        return mockAdapters.auth.getSessions();
      }
      return authApi.getSessions();
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => {
      if (isMock) {
        return mockAdapters.auth.revokeSession(sessionId);
      }
      return authApi.revokeSession(sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] });
      toast.success("Session revoked successfully.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to revoke session.");
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => {
      if (isMock) {
        return mockAdapters.auth.logoutAll();
      }
      return authApi.logoutAll();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] });
      toast.success("All other sessions revoked successfully.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to revoke other sessions.");
    },
  });

  const getDeviceIcon = (type?: string | null) => {
    switch (type) {
      case "mobile":
        return <Smartphone className="size-4 text-muted-foreground" />;
      case "tablet":
        return <Tablet className="size-4 text-muted-foreground" />;
      default:
        return <Laptop className="size-4 text-muted-foreground" />;
    }
  };

  const otherSessionsCount = sessions.filter((s) => s.id !== activeSessionId).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Active Sessions"
          description="View and manage sessions across your active devices."
        />
        {otherSessionsCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => revokeAllMutation.mutate()}
            disabled={revokeAllMutation.isPending}
            className="w-full sm:w-auto text-destructive border-destructive/20 hover:bg-destructive/5 hover:border-destructive/40 font-semibold text-xs"
          >
            Revoke Other Devices
          </Button>
        )}
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Connected Devices</CardTitle>
          <CardDescription>
            These are the devices currently logged in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : error ? (
            <div className="flex h-40 flex-col items-center justify-center p-4">
              <p className="text-sm font-semibold text-destructive">Failed to load active sessions</p>
              <p className="text-xs text-muted-foreground mt-1">Please try again later.</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground font-semibold">
              No active sessions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => {
                    const isCurrent = session.id === activeSessionId;
                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded bg-muted/65">
                              {getDeviceIcon(session.deviceType)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">
                                {session.deviceName || "Unknown Device"}
                                {isCurrent && (
                                  <span className="ml-2 inline-flex items-center rounded bg-success/10 px-1.5 py-0.5 text-[9px] font-bold text-success select-none">
                                    Current
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {session.browser || "Unknown Browser"} on {session.os || "Unknown OS"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-muted-foreground">
                          {session.ipAddress || "—"}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-muted-foreground">
                          {isCurrent ? "Active now" : new Date(session.lastActivity).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isCurrent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => revokeMutation.mutate(session.id)}
                              disabled={revokeMutation.isPending}
                              className="text-destructive hover:bg-destructive/5 font-semibold text-xs h-8"
                            >
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
export default SessionsPage;
