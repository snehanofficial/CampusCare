import React, { useState, useEffect } from "react";
import { useOfflineStatus } from "../../../hooks/useOfflineStatus.js";
import { useSyncStatus } from "../../../hooks/useSyncStatus.js";
import { useOfflineQueue } from "../../../hooks/useOfflineQueue.js";
import { ConflictResolver } from "../../../offline/sync/conflict.resolver.js";
import type { OfflineConflict } from "../../../offline/types/offline.types.js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card.js";
import { Button } from "../../../components/ui/button.js";
import { Switch } from "../../../components/ui/switch.js";
import { Loader2, RefreshCw, AlertOctagon, Trash, ShieldCheck, Check } from "lucide-react";
import { toast } from "sonner";

export function OfflineSyncSettings() {
  const { isOnline } = useOfflineStatus();
  const { pendingCount, syncing, lastSync } = useSyncStatus();
  const { queue, removeAction, triggerSync } = useOfflineQueue();
  const [conflicts, setConflicts] = useState<OfflineConflict[]>([]);

  const loadConflicts = async () => {
    const list = await ConflictResolver.getPendingConflicts();
    setConflicts(list);
  };

  useEffect(() => {
    loadConflicts();
    window.addEventListener("offline-conflicts-changed", loadConflicts);
    return () => {
      window.removeEventListener("offline-conflicts-changed", loadConflicts);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) {
      toast.error("Cannot sync while offline. Check your internet connection.");
      return;
    }
    toast.info("Starting synchronization...");
    await triggerSync();
    toast.success("Sync complete.");
  };

  const handleResolve = async (conflictId: string, decision: "OVERWRITE" | "DISCARD") => {
    await ConflictResolver.resolveConflict(conflictId, decision);
    toast.success(`Conflict resolved with decision: ${decision}`);
    loadConflicts();
  };

  return (
    <div className="space-y-6">
      {/* 1. Connection & Queue Status Header */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 py-4 px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">Offline Connection Dashboard</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5 leading-normal">
                Manage transactions queued during internet service interruptions.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isOnline
                  ? "bg-success/10 text-success border border-success/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20 animate-pulse"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-success" : "bg-destructive"}`} />
                {isOnline ? "CONNECTED" : "OFFLINE"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-muted/10 border border-border/30">
            <h4 className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Queue Size</h4>
            <p className="text-2xl font-black text-foreground mt-1">{pendingCount} actions</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/10 border border-border/30">
            <h4 className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Sync State</h4>
            <p className="text-2xl font-black text-foreground mt-1 flex items-center gap-2">
              {syncing ? (
                <>
                  <Loader2 className="size-5 text-primary animate-spin" />
                  Syncing...
                </>
              ) : (
                "Idle"
              )}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/10 border border-border/30">
            <h4 className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Last Synced</h4>
            <p className="text-sm font-bold text-foreground mt-2 leading-relaxed">
              {lastSync ? lastSync.toLocaleTimeString() : "Never"}
            </p>
          </div>
        </CardContent>
        <div className="border-t border-border/40 p-4 bg-muted/5 flex justify-end">
          <Button
            size="sm"
            onClick={handleManualSync}
            disabled={syncing || !isOnline}
            className="text-xs font-bold gap-1.5 cursor-pointer"
          >
            {syncing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Force Synchronization
          </Button>
        </div>
      </Card>

      {/* 2. Concurrency Conflict Panel */}
      {conflicts.length > 0 && (
        <Card className="border border-destructive bg-destructive/5">
          <CardHeader className="border-b border-destructive/20 py-4 px-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertOctagon className="size-5" />
              <div>
                <CardTitle className="text-sm font-bold">Unresolved Sync Conflicts</CardTitle>
                <CardDescription className="text-xs text-destructive/80 leading-normal mt-0.5">
                  Server records have changed since you last worked. Choose which values to write.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 divide-y divide-destructive/10">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="py-4 first:pt-0 last:pb-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Client Data */}
                  <div className="p-4 rounded bg-background border border-border">
                    <h5 className="text-xs font-bold text-primary mb-2">Your Offline Changes</h5>
                    <pre className="text-[11px] font-mono text-muted-foreground bg-muted/20 p-2.5 rounded overflow-x-auto leading-normal">
                      {JSON.stringify(conflict.clientData, null, 2)}
                    </pre>
                  </div>
                  {/* Server Data */}
                  <div className="p-4 rounded bg-background border border-border">
                    <h5 className="text-xs font-bold text-foreground mb-2">Current Server Record</h5>
                    <pre className="text-[11px] font-mono text-muted-foreground bg-muted/20 p-2.5 rounded overflow-x-auto leading-normal">
                      {JSON.stringify(conflict.serverData, null, 2)}
                    </pre>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolve(conflict.id, "DISCARD")}
                    className="text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10 cursor-pointer"
                  >
                    Discard Local
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleResolve(conflict.id, "OVERWRITE")}
                    className="text-xs font-bold bg-success hover:bg-success/90 text-white cursor-pointer"
                  >
                    Overwrite Server
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 3. Action Queue Registry List */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 py-4 px-6">
          <CardTitle className="text-sm font-bold text-foreground">Sync Action Queue</CardTitle>
          <CardDescription className="text-xs text-muted-foreground leading-normal mt-0.5">
            Active list of operations awaiting internet service recovery.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {queue.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground leading-normal">
              No actions pending in the offline queue.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {queue.map((action) => (
                <div key={action.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{action.actionType}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${
                        action.status === "PENDING"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : action.status === "PROCESSING"
                          ? "bg-primary/10 text-primary border-primary/20 animate-pulse"
                          : "bg-destructive/10 text-destructive border-destructive/20"
                      }`}>
                        {action.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Retries: {action.retryCount}/3</span>
                    </div>
                    <p className="text-[11px] font-mono text-muted-foreground leading-normal">URL: {action.endpoint}</p>
                    {action.error && (
                      <p className="text-[10px] text-destructive leading-normal">Error: {action.error}</p>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeAction(action.id)}
                    className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <Trash className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
export default OfflineSyncSettings;
