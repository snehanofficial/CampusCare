import React from "react";
import { PageHeader } from "../common/PageHeader.js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card.js";
import { Button } from "../ui/button.js";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar.js";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../ui/table.js";
import { LoadingSpinner } from "../ui/loading-spinner.js";
import { Laptop, Smartphone, Tablet, KeyRound, User, Mail, ShieldAlert } from "lucide-react";
import type { AuthUser, Session } from "@campuscare/shared-types";

interface ProfileTemplateProps {
  user: AuthUser | null;
  sessions: Session[];
  activeSessionId: string | null;
  onRevokeSession: (id: string) => void;
  onRevokeAll: () => void;
  isRevoking: boolean;
  isRevokingAll: boolean;
  isSessionsLoading: boolean;
  sessionsError?: string | null;
  children?: React.ReactNode;
}

export function ProfileTemplate({
  user,
  sessions,
  activeSessionId,
  onRevokeSession,
  onRevokeAll,
  isRevoking,
  isRevokingAll,
  isSessionsLoading,
  sessionsError,
  children,
}: ProfileTemplateProps) {
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

  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
    : "";

  const otherSessionsCount = sessions.filter((s) => s.id !== activeSessionId).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Workspace"
        description="Manage your profile settings, view permissions, and audit active browser sessions."
      />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Profile Avatar Card and details */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-border bg-card">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Avatar className="size-20 border border-border/80 shadow-md">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />}
                <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <h3 className="mt-4 text-sm font-bold text-foreground">
                {user ? `${user.firstName} ${user.lastName}` : "User Profile"}
              </h3>
              <span className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 mt-1.5 text-[9px] font-bold text-primary select-none uppercase">
                {user?.role || "STUDENT"}
              </span>

              <div className="w-full space-y-2 mt-6 border-t border-border/40 pt-4 text-left">
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="size-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{user?.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User System Permissions List */}
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 py-3 px-6">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Authorized Scopes</CardTitle>
            </CardHeader>
            <CardContent className="p-4 max-h-48 overflow-y-auto">
              <div className="flex flex-wrap gap-1.5 select-none">
                {user?.permissions?.map((perm) => (
                  <span
                    key={perm}
                    className="inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground border border-border/40"
                  >
                    {perm}
                  </span>
                )) || <span className="text-xs text-muted-foreground">No permissions configured</span>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profiles edit details and sessions table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Account details form placeholders */}
          {children && (
            <Card className="border border-border bg-card">
              <CardHeader className="border-b border-border/40 py-4 px-6">
                <CardTitle className="text-sm font-bold text-foreground">Personal Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6">{children}</CardContent>
            </Card>
          )}

          {/* Active Sessions Panel */}
          <Card className="border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 py-4 px-6 gap-4">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">Logged-In Devices</CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground leading-normal mt-0.5 block">
                  Active login records on your account across web browsers and phones.
                </CardDescription>
              </div>
              {otherSessionsCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRevokeAll}
                  disabled={isRevokingAll}
                  className="text-destructive border-destructive/20 hover:bg-destructive/5 hover:border-destructive/40 font-semibold text-[10px] h-8 cursor-pointer shrink-0"
                >
                  Revoke Others
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {isSessionsLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <LoadingSpinner size="sm" />
                </div>
              ) : sessionsError ? (
                <div className="flex h-32 flex-col items-center justify-center p-4">
                  <ShieldAlert className="size-6 text-destructive mb-1" />
                  <p className="text-xs font-semibold text-destructive">Failed to load active sessions</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-xs text-muted-foreground font-semibold">
                  No active session listings.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-4 py-2 bg-muted/10">Device</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-4 py-2 bg-muted/10">IP Address</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-4 py-2 bg-muted/10">Last Active</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-4 py-2 bg-muted/10 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session) => {
                        const isCurrent = session.id === activeSessionId;
                        return (
                          <TableRow key={session.id}>
                            <TableCell className="px-4 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <div className="flex size-7 items-center justify-center rounded bg-muted/65">
                                  {getDeviceIcon(session.deviceType)}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-foreground">
                                    {session.deviceName || "Unknown Device"}
                                    {isCurrent && (
                                      <span className="ml-1.5 inline-flex items-center rounded bg-success/10 px-1 py-0.5 text-[8px] font-bold text-success select-none">
                                        Current
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[9px] text-muted-foreground">
                                    {session.browser || "Unknown Browser"} on {session.os || "Unknown OS"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-muted-foreground px-4 py-2.5">
                              {session.ipAddress || "—"}
                            </TableCell>
                            <TableCell className="text-[11px] font-semibold text-muted-foreground px-4 py-2.5">
                              {isCurrent ? "Active now" : new Date(session.lastActivity).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right px-4 py-2.5">
                              {!isCurrent && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onRevokeSession(session.id)}
                                  disabled={isRevoking}
                                  className="text-destructive hover:bg-destructive/5 font-semibold text-[10px] h-7 px-2 cursor-pointer"
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
      </div>
    </div>
  );
}
export default ProfileTemplate;
