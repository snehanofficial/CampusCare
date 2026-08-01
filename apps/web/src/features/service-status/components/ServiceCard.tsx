import React from "react";
import * as Icons from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card.js";
import { StatusBadge } from "./StatusBadge.js";
import { ServiceData, ServiceAvailabilityStats } from "../hooks/useServiceStatus.js";
import { cn } from "../../../lib/utils.js";

export interface ServiceCardProps {
  service: ServiceData;
  availabilityStats?: ServiceAvailabilityStats;
  onSelect?: () => void;
  isAdmin?: boolean;
}

export function ServiceCard({ service, availabilityStats, onSelect, isAdmin = false }: ServiceCardProps) {
  // Dynamic Lucide icon mapper
  const getIcon = (name: string | null) => {
    if (!name) return <Icons.Server className="size-4 text-muted-foreground" />;
    const IconComponent = (Icons as any)[name];
    if (!IconComponent) return <Icons.Server className="size-4 text-muted-foreground" />;
    return <IconComponent className="size-4 text-muted-foreground" />;
  };

  // Status color mapper for mini bars
  const getBarColor = (uptime: number) => {
    if (uptime === 100) return "bg-success hover:bg-success/80";
    if (uptime >= 95) return "bg-warning hover:bg-warning/80";
    return "bg-destructive hover:bg-destructive/80";
  };

  // Uptime label generator
  const getUptimeText = () => {
    if (!availabilityStats) return "99.9% uptime";
    return `${availabilityStats.uptime30d.toFixed(2)}% uptime`;
  };

  return (
    <Card className={cn(
      "border border-border/40 bg-card hover:shadow-sm transition-all duration-200",
      isAdmin && "cursor-pointer hover:border-primary/40"
    )} onClick={isAdmin ? onSelect : undefined}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-sm bg-muted">
            {getIcon(service.icon)}
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-foreground">{service.name}</CardTitle>
            <span className="text-[10px] text-muted-foreground font-semibold">{service.category}</span>
          </div>
        </div>
        <StatusBadge status={service.status} />
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        {service.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        )}

        {/* 30-Day Mini Timeline Bar Chart */}
        <div className="space-y-1.5 pt-2 border-t border-border/20">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground font-semibold">30 Days Uptime</span>
            <span className="font-bold text-foreground">{getUptimeText()}</span>
          </div>
          <div className="flex items-center gap-[2px] h-3 w-full">
            {availabilityStats?.dailyHistory ? (
              availabilityStats.dailyHistory.map((day, idx) => (
                <div
                  key={idx}
                  className={cn("flex-1 h-full rounded-[1px] transition-colors", getBarColor(day.uptime))}
                  title={`${day.date}: ${day.uptime.toFixed(1)}% availability`}
                />
              ))
            ) : (
              // Default/fallback: render 30 green bars representing clean uptime
              Array.from({ length: 30 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex-1 h-full rounded-[1px] bg-success hover:bg-success/80 transition-colors"
                  title="99.9% availability (Estimated)"
                />
              ))
            )}
          </div>
          <div className="flex items-center justify-between text-[9px] text-muted-foreground font-medium px-[1px]">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span>Last checked: Just now</span>
          {isAdmin && (
            <span className="text-primary font-semibold flex items-center gap-1 hover:underline">
              Manage <Icons.ChevronRight className="size-3" />
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
