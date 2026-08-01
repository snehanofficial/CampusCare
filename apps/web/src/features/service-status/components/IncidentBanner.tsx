import React from "react";
import { AlertCircle, ShieldCheck, HelpCircle } from "lucide-react";
import { Tag } from "../../../components/ui/tag.js";
import { ServiceData } from "../hooks/useServiceStatus.js";

export interface IncidentBannerProps {
  services: ServiceData[];
}

export function IncidentBanner({ services }: IncidentBannerProps) {
  // Extract all active incidents across all services
  const activeIncidents = services.flatMap((s) =>
    (s.incidents || []).map((inc) => ({
      ...inc,
      serviceName: s.name,
    }))
  );

  const totalDownCount = services.filter((s) => s.status === "DOWN").length;
  const totalDegradedCount = services.filter((s) => s.status === "DEGRADED").length;

  const isHealthy = totalDownCount === 0 && totalDegradedCount === 0;

  if (isHealthy) {
    return (
      <div className="flex items-center justify-between p-4 rounded bg-success/10 border border-success/30 text-success text-xs font-bold shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-full bg-success/20 text-success">
            <ShieldCheck className="size-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold">All Campus Systems Operational</h3>
            <p className="text-[10.5px] font-semibold text-success/80">No active incidents reported. Uptime looks solid.</p>
          </div>
        </div>
        <Tag variant="success" className="rounded-full px-3 py-0.5">Uptime: 100%</Tag>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Overview Status Alert Bar */}
      <div className="flex items-center justify-between p-4 rounded bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-full bg-destructive/20 text-destructive">
            <AlertCircle className="size-4 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold">
              {totalDownCount > 0
                ? `${totalDownCount} Campus Service ${totalDownCount > 1 ? "Outages" : "Outage"} Active`
                : `${totalDegradedCount} Campus Service ${totalDegradedCount > 1 ? "Degradations" : "Degradation"} Active`}
            </h3>
            <p className="text-[10.5px] font-semibold text-destructive/80">
              Our operations center is actively troubleshooting the affected platforms.
            </p>
          </div>
        </div>
        <Tag variant="destructive" className="rounded-full px-3 py-0.5 animate-pulse">Service Alert</Tag>
      </div>

      {/* List of Detailed Active Incident Logs */}
      {activeIncidents.length > 0 && (
        <div className="grid gap-2 grid-cols-1">
          {activeIncidents.map((inc) => (
            <div
              key={inc.id}
              className="flex items-center justify-between p-3 bg-card border border-border/40 rounded-[4px] text-xs hover:border-destructive/30 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-foreground text-xs">{inc.title}</span>
                  <Tag variant="destructive" className="rounded text-[9px] px-1.5 py-0">OUTAGE</Tag>
                </div>
                <p className="text-[10px] text-primary font-bold">
                  Affected Service: <span className="underline">{inc.serviceName}</span>
                </p>
                <span className="text-[9.5px] text-muted-foreground block font-medium">
                  Started: {new Date(inc.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Tag variant="warning" className="rounded px-2.5 py-0.5 font-bold uppercase tracking-wider text-[9px]">
                  {inc.status}
                </Tag>
                <span className="text-[10px] font-bold text-foreground bg-muted px-2 py-0.5 rounded-[2px] flex items-center gap-1">
                  <HelpCircle className="size-3 text-muted-foreground" />
                  Investigating
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
