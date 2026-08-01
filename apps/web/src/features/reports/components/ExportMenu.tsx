import React from "react";
import { Download, FileText, Table, Sheet, Loader2 } from "lucide-react";
import type { ReportType, ExportFormat } from "../hooks/useReports.js";

interface ExportMenuProps {
  selectedType: ReportType | null;
  onExport: (type: ReportType, format: ExportFormat) => void;
  isExporting: boolean;
}

const FORMAT_CONFIG: { format: ExportFormat; icon: React.ElementType; label: string; desc: string }[] = [
  { format: "PDF", icon: FileText, label: "PDF", desc: "Formatted document" },
  { format: "EXCEL", icon: Sheet, label: "Excel", desc: "Spreadsheet (.xlsx)" },
  { format: "CSV", icon: Table, label: "CSV", desc: "Raw data (.csv)" },
];

export function ExportMenu({ selectedType, onExport, isExporting }: ExportMenuProps) {
  if (!selectedType) return null;

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <Download className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Export Report</span>
      </div>
      <div className="flex gap-2">
        {FORMAT_CONFIG.map(({ format, icon: Icon, label, desc }) => (
          <button
            key={format}
            id={`export-menu-${format.toLowerCase()}`}
            disabled={isExporting}
            onClick={() => onExport(selectedType, format)}
            className="flex flex-1 flex-col items-center gap-1.5 rounded-lg border border-border
              bg-muted/40 p-3 text-center transition-all hover:border-primary/50 hover:bg-primary/5
              disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {isExporting ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <Icon className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="text-xs font-bold text-foreground">{label}</span>
            <span className="text-[10px] text-muted-foreground">{desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
