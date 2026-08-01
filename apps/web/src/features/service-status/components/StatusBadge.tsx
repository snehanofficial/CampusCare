import React from "react";
import { Tag } from "../../../components/ui/tag.js";
import { ServiceStatus } from "../hooks/useServiceStatus.js";

export interface StatusBadgeProps {
  status: ServiceStatus;
  showPulse?: boolean;
}

export function StatusBadge({ status, showPulse = true }: StatusBadgeProps) {
  const getVariant = (s: ServiceStatus) => {
    switch (s) {
      case "OPERATIONAL":
        return "success";
      case "DEGRADED":
        return "warning";
      case "DOWN":
        return "destructive";
      case "MAINTENANCE":
        return "info";
      default:
        return "secondary";
    }
  };

  const getLabel = (s: ServiceStatus) => {
    switch (s) {
      case "OPERATIONAL":
        return "Operational";
      case "DEGRADED":
        return "Degraded";
      case "DOWN":
        return "Outage";
      case "MAINTENANCE":
        return "Maintenance";
      default:
        return s;
    }
  };

  const getPulseColor = (s: ServiceStatus) => {
    switch (s) {
      case "OPERATIONAL":
        return "bg-success";
      case "DEGRADED":
        return "bg-warning";
      case "DOWN":
        return "bg-destructive";
      case "MAINTENANCE":
        return "bg-info";
      default:
        return "bg-muted-foreground";
    }
  };

  return (
    <Tag variant={getVariant(status)} className="flex items-center gap-1.5 py-0.5 px-2 rounded text-xs select-none">
      {showPulse && (
        <span className="relative flex size-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getPulseColor(status)}`} />
          <span className={`relative inline-flex rounded-full size-2 ${getPulseColor(status)}`} />
        </span>
      )}
      <span>{getLabel(status)}</span>
    </Tag>
  );
}
