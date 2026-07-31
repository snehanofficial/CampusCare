import React from "react";
import { Info, AlertTriangle, CheckCircle2, AlertOctagon } from "lucide-react";

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  type?: "info" | "warn" | "success" | "error";
  performedBy?: string;
}

interface ActivityTimelineProps {
  items: TimelineItem[];
  maxHeight?: string;
}

export function ActivityTimeline({ items, maxHeight = "350px" }: ActivityTimelineProps) {
  const getIcon = (type?: string) => {
    switch (type) {
      case "warn":
        return <AlertTriangle className="size-4 text-warning" />;
      case "error":
        return <AlertOctagon className="size-4 text-destructive" />;
      case "success":
        return <CheckCircle2 className="size-4 text-success" />;
      default:
        return <Info className="size-4 text-primary" />;
    }
  };

  return (
    <div className="overflow-y-auto pr-1" style={{ maxHeight }}>
      {items.length === 0 ? (
        <div className="flex h-20 items-center justify-center text-xs text-muted-foreground font-semibold">
          No activity logs recorded.
        </div>
      ) : (
        <div className="relative border-l border-border/70 ml-2 pl-5 space-y-4 py-1.5 select-none">
          {items.map((item) => (
            <div key={item.id} className="relative group">
              {/* Bullet Node */}
              <div className="absolute -left-[29px] top-1 flex size-5 items-center justify-center rounded-full bg-card border border-border/80 shadow-sm">
                {getIcon(item.type)}
              </div>

              {/* Text Context */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-foreground leading-normal">
                    {item.title}
                  </h4>
                  <span className="text-[9px] text-muted-foreground font-semibold whitespace-nowrap leading-none mt-0.5">
                    {item.time}
                  </span>
                </div>
                {item.description && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                )}
                {item.performedBy && (
                  <p className="text-[10px] text-muted-foreground/80 font-medium">
                    By: <span className="text-foreground/90">{item.performedBy}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default ActivityTimeline;
