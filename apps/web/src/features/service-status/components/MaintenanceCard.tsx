import React from "react";
import { Calendar, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card.js";
import { Tag } from "../../../components/ui/tag.js";
import { MaintenanceWindowData, ServiceData } from "../hooks/useServiceStatus.js";

export interface MaintenanceCardProps {
  maintenances: MaintenanceWindowData[];
  services: ServiceData[];
}

export function MaintenanceCard({ maintenances, services }: MaintenanceCardProps) {
  const getServiceName = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    return service ? service.name : "Unknown Service";
  };

  const formatDuration = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const durationMs = end.getTime() - start.getTime();
    const durationMin = Math.round(durationMs / 60000);
    
    if (durationMin < 60) {
      return `${durationMin} mins`;
    }
    const hours = Math.floor(durationMin / 60);
    const mins = durationMin % 60;
    return mins > 0 ? `${hours} hrs ${mins} mins` : `${hours} hrs`;
  };

  const getStatusTag = (status: "SCHEDULED" | "ACTIVE" | "COMPLETED") => {
    switch (status) {
      case "ACTIVE":
        return <Tag variant="warning" className="animate-pulse">Active Maintenance</Tag>;
      case "SCHEDULED":
        return <Tag variant="info">Scheduled</Tag>;
      default:
        return <Tag variant="secondary">Completed</Tag>;
    }
  };

  const activeOrScheduled = maintenances.filter((m) => m.status !== "COMPLETED");

  return (
    <Card className="border border-border/40 bg-card">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/20">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-primary" />
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
            Maintenance Schedule
          </CardTitle>
        </div>
        <span className="text-[10px] text-muted-foreground font-semibold">
          {activeOrScheduled.length} windows
        </span>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-border/20">
        {activeOrScheduled.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
            <ShieldCheck className="size-8 text-success" />
            <p className="text-xs font-semibold text-foreground">No Upcoming Maintenance</p>
            <p className="text-[10px] text-muted-foreground">All systems have clean schedules.</p>
          </div>
        ) : (
          activeOrScheduled.map((mw) => (
            <div key={mw.id} className="p-4 space-y-2 text-xs hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-foreground text-xs">{mw.title}</h4>
                  <p className="text-[10px] text-primary font-semibold">
                    Affected: {getServiceName(mw.serviceId)}
                  </p>
                </div>
                {getStatusTag(mw.status)}
              </div>

              {mw.description && (
                <p className="text-[11px] text-muted-foreground leading-relaxed italic bg-surface-subtle/40 p-2 rounded-[2px] border border-border/10">
                  "{mw.description}"
                </p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-muted-foreground font-medium pt-1">
                <div className="flex items-center gap-1">
                  <Clock className="size-3 text-muted-foreground" />
                  <span>
                    {new Date(mw.startTime).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-foreground">
                    Duration: {formatDuration(mw.startTime, mw.endTime)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
