import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Clock,
  Calendar,
  AlertTriangle,
  User,
  Shield,
  Send,
  Check,
  RotateCcw,
  MessageSquare,
  Activity,
  Trash2,
  AlertCircle,
  Link as LinkIcon,
  Tag as TagIcon
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../../../hooks/useAuth.js";
import { incidentRepository } from "../../../lib/repositories/incident.repository.js";
import { Button } from "../../../components/ui/button.js";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card.js";
import { Input } from "../../../components/ui/input.js";
import { Textarea } from "../../../components/ui/textarea.js";
import { Tag } from "../../../components/ui/tag.js";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "../../../components/ui/select.js";

const SEVERITY_VARIANTS: Record<string, "destructive" | "warning" | "primary" | "secondary"> = {
  CRITICAL: "destructive",
  HIGH: "warning",
  MEDIUM: "primary",
  LOW: "secondary",
};

const STATUS_CLASS: Record<string, string> = {
  RESOLVED: "bg-success/15 text-success",
  CLOSED: "bg-success/15 text-success",
  INVESTIGATING: "bg-primary/15 text-primary animate-pulse",
  OPEN: "bg-destructive/15 text-destructive animate-pulse",
};

export function IncidentDetailsPage() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"tickets" | "timeline" | "comments">("tickets");
  const [commentText, setCommentText] = useState("");
  const [rootCauseInput, setRootCauseInput] = useState("");
  const [showCauseForm, setShowCauseForm] = useState(false);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: incident, isLoading, error } = useQuery({
    queryKey: ["incident", incidentId],
    queryFn: () => incidentRepository.get(incidentId!),
    enabled: !!incidentId,
  });

  const { data: timelineLogs, isLoading: isTimelineLoading } = useQuery({
    queryKey: ["incident-timeline", incidentId],
    queryFn: () => incidentRepository.getTimeline(incidentId!),
    enabled: !!incidentId,
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data: Partial<any>) => incidentRepository.update(incidentId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", incidentId] });
      queryClient.invalidateQueries({ queryKey: ["incident-timeline", incidentId] });
      toast.success("Incident updated successfully.");
      setShowCauseForm(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update incident."),
  });

  const handleResolveIncident = () => {
    if (!incident?.rootCause) {
      toast.error("Please state the Root Cause before resolving the incident.");
      setShowCauseForm(true);
      return;
    }
    updateMutation.mutate({ status: "RESOLVED" });
  };

  const handleSaveRootCause = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootCauseInput.trim()) return;
    updateMutation.mutate({ rootCause: rootCauseInput });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-xs text-muted-foreground">Opening outage incident records...</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <h3 className="font-bold text-sm">Incident File Not Found</h3>
          <p className="text-xs text-muted-foreground">{error?.message || "Outage details unreadable."}</p>
          <Button onClick={() => navigate("/incidents")} size="sm" variant="outline">
            Return to Incident Queue
          </Button>
        </div>
      </div>
    );
  }

  const linkedTickets = incident.linkedTickets ?? [];
  const statusLogs = timelineLogs ?? [];

  return (
    <div className="space-y-4">
      {/* ── Breadcrumbs & Back ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
          <span>/</span>
          <Link to="/incidents" className="hover:text-primary transition-colors">Incidents</Link>
          <span>/</span>
          <span className="font-semibold text-foreground">{incident.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <Button onClick={() => navigate("/incidents")} variant="outline" size="xs" className="w-fit">
          <ArrowLeft className="size-3 mr-1" /> Back to Incident Queue
        </Button>
      </div>

      {/* ── Title Banner ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-xs text-destructive">INC-{incident.id.slice(0, 8).toUpperCase()}</span>
            <Tag variant={SEVERITY_VARIANTS[incident.severity] ?? "secondary"}>{incident.severity}</Tag>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CLASS[incident.status]}`}>
              {incident.status.replace("_", " ")}
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground mt-1">{incident.title}</h1>
        </div>

        {/* ── Actions panel ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {incident.status !== "RESOLVED" && incident.status !== "CLOSED" && (
            <Button
              onClick={handleResolveIncident}
              disabled={updateMutation.isPending}
              size="sm"
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              <Check className="size-3.5 mr-1" /> Mark Resolved
            </Button>
          )}
          <Button
            onClick={() => setShowCauseForm(!showCauseForm)}
            size="sm"
            variant="outline"
          >
            Update Root Cause
          </Button>
        </div>
      </div>

      {/* Root Cause Input Dialog Form */}
      {showCauseForm && (
        <Card className="border-border bg-card max-w-xl">
          <CardHeader className="p-3">
            <CardTitle className="text-xs font-bold text-foreground">Document Root Cause & Resolution details</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            <form onSubmit={handleSaveRootCause} className="space-y-2">
              <Textarea
                value={rootCauseInput}
                onChange={(e) => setRootCauseInput(e.target.value)}
                placeholder="State the core root cause of this outage, and steps taken to resolve it..."
                className="text-xs"
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || !rootCauseInput.trim()}
                  size="xs"
                >
                  Save Documentation
                </Button>
                <Button onClick={() => setShowCauseForm(false)} size="xs" variant="outline">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Layout Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MAIN COLUMN */}
        <div className="lg:col-span-2 space-y-4">
          {/* General specs */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
                Incident Summary & Description
              </div>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {incident.description}
              </p>
              {incident.rootCause && (
                <div className="bg-success/5 border border-success/20 p-3 rounded mt-3 text-xs">
                  <span className="text-[10px] text-success font-bold uppercase tracking-wider block mb-1">Identified Root Cause & Fix Details</span>
                  <p className="text-muted-foreground leading-relaxed font-semibold">{incident.rootCause}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tab lists */}
          <div className="space-y-2">
            <div className="flex border-b border-border text-xs gap-1.5 flex-wrap">
              <button
                onClick={() => setActiveTab("tickets")}
                className={`pb-2 px-1 focus:outline-none transition-colors border-b-2 ${
                  activeTab === "tickets" ? "border-primary text-primary font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Linked Tickets ({linkedTickets.length})
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`pb-2 px-1 focus:outline-none transition-colors border-b-2 ${
                  activeTab === "timeline" ? "border-primary text-primary font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Audit Timeline ({statusLogs.length})
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="pt-2">
              {activeTab === "tickets" && (
                <div className="space-y-3">
                  {linkedTickets.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">
                      No tickets linked to this outage incident.
                    </p>
                  ) : (
                    <div className="border border-border rounded overflow-hidden">
                      <table className="min-w-full divide-y divide-border text-xs text-left">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-3 py-2 font-bold text-muted-foreground uppercase">Ticket #</th>
                            <th className="px-3 py-2 font-bold text-muted-foreground uppercase">Title</th>
                            <th className="px-3 py-2 font-bold text-muted-foreground uppercase">Status</th>
                            <th className="px-3 py-2 font-bold text-muted-foreground uppercase">Priority</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                          {linkedTickets.map((t: any) => (
                            <tr
                              key={t.id}
                              onClick={() => navigate(`/tickets/${t.id}`)}
                              className="hover:bg-muted/50 cursor-pointer transition-colors"
                            >
                              <td className="px-3 py-2 font-mono font-bold text-primary">{t.ticketNumber}</td>
                              <td className="px-3 py-2 text-foreground font-semibold truncate max-w-xs">{t.title}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold ${STATUS_CLASS[t.status] || "bg-muted text-muted-foreground"}`}>
                                  {t.status.replace("_", " ")}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <Tag variant={SEVERITY_VARIANTS[t.priority] ?? "secondary"}>{t.priority}</Tag>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "timeline" && (
                <div className="space-y-3 pl-3 border-l-2 border-border/80">
                  {statusLogs.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">
                      No timeline actions logged.
                    </p>
                  ) : (
                    statusLogs.map((log: any) => (
                      <div key={log.id} className="relative pb-4 pl-4 text-xs">
                        <span className="absolute -left-[21px] top-1 flex size-5 items-center justify-center rounded-full border bg-background text-[9px] font-bold">
                          <Activity className="size-2.5 text-muted-foreground" />
                        </span>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="font-bold text-foreground uppercase tracking-wider">{log.action}</span>
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-muted-foreground mt-0.5">
                          Performed by <span className="font-semibold text-foreground">{log.performedByName}</span>.
                        </p>
                        {log.newValue && (
                          <div className="bg-muted p-2 rounded text-[10px] font-mono mt-1 space-y-0.5">
                            {Object.entries(log.newValue).map(([k, v]) => (
                              <div key={k}>
                                <span className="text-primary">{k}</span>: {JSON.stringify(v)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SIDEBAR METADATA COLUMN */}
        <div className="space-y-4">
          {/* SLA countdown panel */}
          <Card className="border-border bg-card">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                <span>Incident SLA Policies</span>
                <Clock className="size-3.5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                As a priority <strong className="text-foreground">{incident.severity}</strong> outage event, this incident targets response compliance limits of <strong className="text-foreground">2 hours</strong>.
              </p>
              <div className="text-[11px] border-t border-border pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Declared:</span>
                  <span className="font-semibold text-foreground">{new Date(incident.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="font-semibold text-foreground">{new Date(incident.updatedAt).toLocaleString()}</span>
                </div>
                {incident.resolvedAt && (
                  <div className="flex justify-between">
                    <span>Resolved Target Met:</span>
                    <span className="font-semibold text-success">{new Date(incident.resolvedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Allocation & Info Details */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
                Outage Metadata
              </div>
              <div className="text-xs space-y-3">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Affiliated Categories</span>
                  <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                    <TagIcon className="size-3 text-primary shrink-0" />
                    {linkedTickets.length > 0
                      ? Array.from(new Set(linkedTickets.map((t: any) => t.priority))).join(", ")
                      : "General Services"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Assigned Technicians Scope</span>
                  <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                    <User className="size-3 text-primary shrink-0" />
                    IT Networks & Admin Security
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default IncidentDetailsPage;
