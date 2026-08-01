import React, { useState, useEffect } from "react";
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
import { ticketRepository } from "../../../lib/repositories/ticket.repository.js";
import { userRepository } from "../../../lib/repositories/user.repository.js";
import { apiClient } from "../../../lib/api-client.js";
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

const PRIORITY_VARIANTS: Record<string, "destructive" | "warning" | "primary" | "secondary"> = {
  CRITICAL: "destructive",
  HIGH: "warning",
  MEDIUM: "primary",
  LOW: "secondary",
};

const STATUS_CLASS: Record<string, string> = {
  RESOLVED: "bg-success/15 text-success",
  CLOSED: "bg-success/15 text-success",
  IN_PROGRESS: "bg-primary/15 text-primary",
  ASSIGNED: "bg-blue-500/15 text-blue-500",
  PENDING: "bg-orange-500/15 text-orange-500",
  OPEN: "bg-warning/15 text-warning animate-pulse",
};

// ── SLA Countdown Hook ────────────────────────────────────────────────────────
function useSlaCountdown(dueAtStr?: string | null, status?: string) {
  const [timeLeft, setTimeLeft] = useState<{ text: string; isBreached: boolean; isUrgent: boolean }>({
    text: "—",
    isBreached: false,
    isUrgent: false
  });

  useEffect(() => {
    if (!dueAtStr) {
      setTimeLeft({ text: "—", isBreached: false, isUrgent: false });
      return;
    }

    if (status === "CLOSED" || status === "RESOLVED") {
      setTimeLeft({ text: "Met", isBreached: false, isUrgent: false });
      return;
    }

    const updateTimer = () => {
      const deadline = new Date(dueAtStr).getTime();
      const now = Date.now();
      const diffMs = deadline - now;

      if (diffMs <= 0) {
        setTimeLeft({ text: "Breached", isBreached: true, isUrgent: false });
        return;
      }

      const diffMins = Math.floor(diffMs / (1000 * 60));
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      const hoursText = String(hrs).padStart(2, "0");
      const minsText = String(mins).padStart(2, "0");
      const secsText = String(secs).padStart(2, "0");

      setTimeLeft({
        text: `${hoursText}h ${minsText}m ${secsText}s left`,
        isBreached: false,
        isUrgent: diffMins < 60
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [dueAtStr, status]);

  return timeLeft;
}

export function TicketDetailsPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // ── Role flags ─────────────────────────────────────────────────────────────
  const role = currentUser?.role ?? "STUDENT";
  const isAdmin = role === "SYSTEM_ADMIN";
  const isDeptAdmin = role === "DEPT_ADMIN";
  const isTechnician = role === "TECHNICIAN";
  const isRequester = role === "STUDENT" || role === "FACULTY";
  const canAssign = isAdmin || isDeptAdmin;       // Assign technician: Admin + DeptAdmin
  const canEditInfo = isAdmin || isDeptAdmin;    // Edit ticket metadata: Admin + DeptAdmin only
  const canChangeStatus = isAdmin || isDeptAdmin || isTechnician; // Status changes
  const canLinkIncident = isAdmin;               // Only System Admin can link incidents

  const [activeTab, setActiveTab] = useState<"comments" | "timeline" | "rules" | "history">("comments");
  const [commentText, setCommentText] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [showReopenInput, setShowReopenInput] = useState(false);
  // Technician quick-status state
  const [techStatus, setTechStatus] = useState("");
  const [techRemarks, setTechRemarks] = useState("");

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => ticketRepository.get(ticketId!),
    enabled: !!ticketId,
  });

  const { data: techUsersRes } = useQuery({
    queryKey: ["users", "technicians"],
    queryFn: () => userRepository.list({ filters: { role: "TECHNICIAN" }, pageSize: 100 }),
    enabled: canAssign,
  });
  const technicians = techUsersRes?.data ?? [];

  const { data: activeIncidentsRes } = useQuery({
    queryKey: ["incidents", "active"],
    queryFn: () => incidentRepository.list({ filters: { status: "OPEN" }, pageSize: 100 }),
  });
  const activeIncidents = activeIncidentsRes?.data ?? [];

  // ── Mutations ───────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data: Partial<any>) => ticketRepository.update(ticketId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      toast.success("Ticket details updated.");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update details."),
  });

  const verifyMutation = useMutation({
    mutationFn: () => ticketRepository.verifyTicket(ticketId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      toast.success("Resolution verified. Ticket closed.");
    },
    onError: (err: any) => toast.error(err.message || "Failed to verify resolution."),
  });

  const reopenMutation = useMutation({
    mutationFn: (reason: string) => ticketRepository.reopenTicket(ticketId!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      toast.success("Ticket reopened successfully.");
      setShowReopenInput(false);
      setReopenReason("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to reopen ticket."),
  });

  const addCommentMutation = useMutation({
    mutationFn: (payload: { content: string; isInternal: boolean }) =>
      apiClient.post(`/tickets/${ticketId}/comments`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      toast.success("Comment posted.");
      setCommentText("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to post comment."),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      apiClient.delete(`/tickets/${ticketId}/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      toast.success("Comment deleted.");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete comment."),
  });

  // ── SLA timer countdown calculations ─────────────────────────────────────────
  const slaStatus = useSlaCountdown(ticket?.dueAt, ticket?.status);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const handleAssignChange = (value: string) => {
    const assigneeId = value === "UNASSIGNED" ? null : value;
    updateMutation.mutate({ assigneeId });
  };

  const handleLinkIncident = (incidentId: string) => {
    const linkId = incidentId === "NONE" ? null : incidentId;
    // We can update the ticket isIncident field or link via incident repository updates.
    // In our backend, updating the ticket's incident properties directly updates relations or triggers incidents endpoints.
    // To link ticket to incident, we can trigger incident update containing ticketId in incident tickets list,
    // or set incidentId directly if the backend supports it.
    // Let's call update incident endpoint since incident update links ticket ids.
    if (linkId) {
      incidentRepository.update(linkId, { ticketIds: [ticketId!] })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
          toast.success("Incident linked successfully.");
        })
        .catch(err => toast.error("Failed to link incident: " + err.message));
    }
  };

  const handleTechStatusUpdate = () => {
    if (!techStatus) return;
    updateMutation.mutate(
      { status: techStatus },
      {
        onSuccess: () => {
          if (techRemarks.trim()) {
            addCommentMutation.mutate({ content: techRemarks.trim(), isInternal: false });
          }
          setTechStatus("");
          setTechRemarks("");
        },
      },
    );
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ content: commentText, isInternal: isInternalComment });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-xs text-muted-foreground">Retrieving ticket folder...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <h3 className="font-bold text-sm">Failed to load ticket</h3>
          <p className="text-xs text-muted-foreground">{error?.message || "Ticket files missing."}</p>
          <Button onClick={() => navigate("/tickets")} size="sm" variant="outline">
            Return to Dispatch Queue
          </Button>
        </div>
      </div>
    );
  }

  const isResolved = ticket.status === "RESOLVED";
  const isClosed = ticket.status === "CLOSED";
  const comments = (ticket as any).comments ?? [];
  const auditLogs = (ticket as any).auditLogs ?? [];
  const automationLogs = (ticket as any).automationLogs ?? [];

  return (
    <div className="space-y-4">
      {/* ── Breadcrumbs & Back ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
          <span>/</span>
          <Link to="/tickets" className="hover:text-primary transition-colors">Tickets</Link>
          <span>/</span>
          <span className="font-semibold text-foreground">{ticket.ticketNumber}</span>
        </div>
        <Button onClick={() => navigate("/tickets")} variant="outline" size="xs" className="w-fit">
          <ArrowLeft className="size-3 mr-1" /> Back to Dispatch Queue
        </Button>
      </div>

      {/* ── Title Banner ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-sm text-primary">{ticket.ticketNumber}</span>
            <Tag variant={PRIORITY_VARIANTS[ticket.priority] ?? "secondary"}>{ticket.priority}</Tag>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CLASS[ticket.status]}`}>
              {ticket.status.replace("_", " ")}
            </span>
            {ticket.reopenCount && ticket.reopenCount > 0 ? (
              <span className="inline-flex px-1.5 py-0.5 bg-destructive/15 text-destructive rounded text-[10px] font-bold">
                Reopened {ticket.reopenCount}x
              </span>
            ) : null}
          </div>
          <h1 className="text-xl font-bold text-foreground mt-1">{ticket.title}</h1>
        </div>

        {/* ── Actions panel ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {/* Verify & Close / Reopen: only for the ticket creator (Student/Faculty) on their own resolved tickets */}
          {isResolved && isRequester && ticket.creatorId === currentUser?.id && (
            <>
              <Button
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending}
                size="sm"
                className="bg-success text-success-foreground hover:bg-success/90"
              >
                <Check className="size-3.5 mr-1" /> Verify &amp; Close
              </Button>
              <Button
                onClick={() => setShowReopenInput(!showReopenInput)}
                size="sm"
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
              >
                <RotateCcw className="size-3.5 mr-1" /> Reopen Ticket
              </Button>
            </>
          )}
          {/* Admin: can verify/reopen any resolved ticket */}
          {isResolved && (isAdmin || isDeptAdmin) && (
            <>
              <Button
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending}
                size="sm"
                className="bg-success text-success-foreground hover:bg-success/90"
              >
                <Check className="size-3.5 mr-1" /> Verify &amp; Close
              </Button>
              <Button
                onClick={() => setShowReopenInput(!showReopenInput)}
                size="sm"
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
              >
                <RotateCcw className="size-3.5 mr-1" /> Reopen Ticket
              </Button>
            </>
          )}
          {/* Technician: Quick status change — IN_PROGRESS or RESOLVED only */}
          {isTechnician && !isResolved && ticket.status !== "CLOSED" && (
            <div className="flex items-center gap-2">
              <Select
                value={techStatus}
                onValueChange={setTechStatus}
              >
                <SelectTrigger className="text-xs h-8 w-36 bg-card">
                  <SelectValue placeholder="Change status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Technician Status Update Remarks Box */}
      {isTechnician && !isResolved && ticket.status !== "CLOSED" && techStatus && (
        <Card className="border-primary/30 bg-primary/5 max-w-xl">
          <CardHeader className="p-3">
            <CardTitle className="text-xs text-primary font-bold">
              Remarks — Mark as {techStatus === "IN_PROGRESS" ? "In Progress" : "Resolved"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            <Textarea
              value={techRemarks}
              onChange={(e) => setTechRemarks(e.target.value)}
              placeholder="Optional remarks about the work performed..."
              className="text-xs"
              rows={2}
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setTechStatus(""); setTechRemarks(""); }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleTechStatusUpdate}
                disabled={updateMutation.isPending}
              >
                Update Status
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reopen Action Reason Box */}
      {showReopenInput && (
        <Card className="border-destructive/30 bg-destructive/5 max-w-xl">
          <CardHeader className="p-3">
            <CardTitle className="text-xs text-destructive font-bold">State Reopen Reason</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            <Textarea
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Provide context explaining why resolution is incomplete..."
              className="text-xs"
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => reopenMutation.mutate(reopenReason)}
                disabled={reopenMutation.isPending || !reopenReason.trim()}
                size="xs"
                variant="destructive"
              >
                Submit Reopen
              </Button>
              <Button onClick={() => setShowReopenInput(false)} size="xs" variant="outline">
                Cancel
              </Button>
            </div>
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
                Description
              </div>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
              <div className="grid grid-cols-2 gap-3 pt-3 text-xs border-t border-border">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-semibold text-foreground">{(ticket as any).categoryName || ticket.categoryId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Department</span>
                  <span className="font-semibold text-foreground">{(ticket as any).departmentName || ticket.departmentId}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Incident Outage Panel */}
          {ticket.isIncident && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-3 items-start">
                  <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-destructive">Associated with Active Outage Incident</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      This ticket is linked to a major system outage event. It will be bulk resolved automatically upon incident closure.
                    </p>
                  </div>
                </div>
                {((ticket as any).incidentLinks ?? []).length > 0 && (
                  <div className="space-y-1.5 pl-8">
                    {((ticket as any).incidentLinks as Array<{id: string; title: string; status: string; severity: string}>).map((inc) => (
                      <button
                        key={inc.id}
                        onClick={() => navigate(`/incidents/${inc.id}`)}
                        className="flex items-center gap-2 text-xs text-destructive hover:underline font-semibold w-full text-left focus:outline-none"
                      >
                        <LinkIcon className="size-3 shrink-0" />
                        <span>INC-{inc.id.slice(0, 8).toUpperCase()} — {inc.title}</span>
                        <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold ${inc.status === "RESOLVED" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                          {inc.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tab lists */}
          <div className="space-y-2">
            <div className="flex border-b border-border text-xs gap-1.5 flex-wrap">
              <button
                onClick={() => setActiveTab("comments")}
                className={`pb-2 px-1 focus:outline-none transition-colors border-b-2 ${
                  activeTab === "comments" ? "border-primary text-primary font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Comments ({comments.length})
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`pb-2 px-1 focus:outline-none transition-colors border-b-2 ${
                  activeTab === "timeline" ? "border-primary text-primary font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Timeline Logs ({comments.length + auditLogs.length})
              </button>
              <button
                onClick={() => setActiveTab("rules")}
                className={`pb-2 px-1 focus:outline-none transition-colors border-b-2 ${
                  activeTab === "rules" ? "border-primary text-primary font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Workflows ({automationLogs.length})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`pb-2 px-1 focus:outline-none transition-colors border-b-2 ${
                  activeTab === "history" ? "border-primary text-primary font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Audit Trails ({auditLogs.length})
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="pt-2">
              {activeTab === "comments" && (
                <div className="space-y-4">
                  {/* Write comment */}
                  <form onSubmit={handlePostComment} className="space-y-2 bg-card p-3 border border-border rounded">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Post a diagnostic update or instructions..."
                      className="text-xs"
                      rows={2}
                    />
                    <div className="flex items-center justify-between">
                      {currentUser?.role === "SYSTEM_ADMIN" || currentUser?.role === "TECHNICIAN" ? (
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
                          <input
                            type="checkbox"
                            checked={isInternalComment}
                            onChange={(e) => setIsInternalComment(e.target.checked)}
                          />
                          <span>Flag as Internal Note</span>
                        </label>
                      ) : <div />}
                      <Button
                        type="submit"
                        disabled={addCommentMutation.isPending || !commentText.trim()}
                        size="xs"
                      >
                        <Send className="size-3 mr-1" /> Post Message
                      </Button>
                    </div>
                  </form>

                  {/* Comments list */}
                  <div className="space-y-3">
                    {comments.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-4">
                        No messages logged.
                      </p>
                    ) : (
                      comments.map((c: any) => (
                        <div
                          key={c.id}
                          className={`p-3 rounded border text-xs relative ${
                            c.isInternal ? "bg-orange-500/5 border-orange-500/20" : "bg-card border-border"
                          }`}
                        >
                          <div className="flex justify-between items-center pb-1 border-b border-border/40 mb-1.5">
                            <span className="font-semibold text-foreground">
                              {c.authorName}
                              {c.isInternal && (
                                <span className="ml-1.5 text-[9px] font-bold text-orange-500 bg-orange-500/10 px-1 py-0.2 rounded uppercase">
                                  Internal
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(c.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-muted-foreground whitespace-pre-wrap">{c.content}</p>
                          
                          {(currentUser?.role === "SYSTEM_ADMIN" || c.authorId === currentUser?.id) && (
                            <button
                              onClick={() => void (confirm("Delete comment?") && deleteCommentMutation.mutate(c.id))}
                              className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-destructive transition-colors focus:outline-none"
                              title="Delete comment"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "timeline" && (
                <div className="space-y-3 pl-3 border-l-2 border-border/80">
                  {/* Mix created, comments, and status updates */}
                  {[
                    {
                      id: "created",
                      time: new Date(ticket.createdAt).getTime(),
                      title: "Ticket Logged in Queue",
                      description: `Logged under category ${(ticket as any).categoryName} and routed to ${(ticket as any).departmentName}.`,
                      icon: Clock,
                      color: "text-primary bg-primary/10 border-primary/20"
                    },
                    ...comments.map((c: any) => ({
                      id: c.id,
                      time: new Date(c.createdAt).getTime(),
                      title: `Message from ${c.authorName}`,
                      description: c.content,
                      icon: MessageSquare,
                      color: c.isInternal ? "text-orange-500 bg-orange-500/10 border-orange-500/20" : "text-blue-500 bg-blue-500/10 border-blue-500/20"
                    })),
                    ...auditLogs.map((l: any) => ({
                      id: l.id,
                      time: new Date(l.createdAt).getTime(),
                      title: `Log Update: ${l.action.replace("TICKET_", "")}`,
                      description: `Performed by ${l.performedByName}.`,
                      icon: Activity,
                      color: "text-muted-foreground bg-muted border-border"
                    }))
                  ]
                    .sort((a, b) => b.time - a.time)
                    .map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.id} className="relative pb-4 pl-4 text-xs">
                          <span className="absolute -left-[21px] top-1 flex size-5 items-center justify-center rounded-full border bg-background text-[9px] font-bold">
                            <Icon className="size-2.5 text-muted-foreground" />
                          </span>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="font-semibold text-foreground">{item.title}</span>
                            <span>{new Date(item.time).toLocaleString()}</span>
                          </div>
                          <p className="text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                        </div>
                      );
                    })}
                </div>
              )}

              {activeTab === "rules" && (
                <div className="space-y-3">
                  {automationLogs.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">
                      No automated triggers logged.
                    </p>
                  ) : (
                    automationLogs.map((log: any) => (
                      <div key={log.id} className="p-3 rounded border border-border bg-card text-xs flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-foreground">Rule: {log.ruleName}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Actions executed: {JSON.stringify(log.actionsRun)}
                          </p>
                        </div>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.triggered ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}>
                          {log.triggered ? "Triggered" : "Ignored"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "history" && (
                <div className="space-y-3">
                  {auditLogs.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">
                      No historical operations logged.
                    </p>
                  ) : (
                    auditLogs.map((log: any) => (
                      <div key={log.id} className="p-3 rounded border border-border bg-card text-xs space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                          <span className="font-bold text-foreground uppercase tracking-wider">{log.action}</span>
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-muted-foreground">
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
          <Card className={`${slaStatus.isBreached ? "border-destructive bg-destructive/5" : "border-border bg-card"}`}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                <span>SLA Countdown Clock</span>
                <Clock className={`size-3.5 ${slaStatus.isUrgent ? "text-warning animate-pulse" : "text-muted-foreground"}`} />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className={`text-2xl font-black font-mono tracking-tight ${
                slaStatus.isBreached ? "text-destructive" : slaStatus.isUrgent ? "text-warning animate-pulse" : "text-primary"
              }`}>
                {slaStatus.text}
              </div>
              <div className="text-[11px] text-muted-foreground border-t border-border pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="font-semibold text-foreground">{new Date(ticket.createdAt).toLocaleString()}</span>
                </div>
                {ticket.dueAt && (
                  <div className="flex justify-between">
                    <span>Deadline Target:</span>
                    <span className="font-semibold text-foreground">{new Date(ticket.dueAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Allocation & Info Details */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
                Metadata Details
              </div>

              {/* Requester Profile */}
              <div className="flex items-center gap-2.5 text-xs text-foreground">
                <AvatarFallback className="size-7 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                  <User className="size-3.5" />
                </AvatarFallback>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Requester</span>
                  <span className="font-semibold">{ticket.creatorName}</span>
                </div>
              </div>

              {/* Assignee Allocator: only for Admin and Dept Admin */}
              {canAssign ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">
                    Assign Technician
                  </label>
                  <Select
                    value={ticket.assigneeId || "UNASSIGNED"}
                    onValueChange={handleAssignChange}
                  >
                    <SelectTrigger className="text-xs h-9 bg-card">
                      <SelectValue placeholder="Assign technician..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                      {technicians.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.firstName} {t.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="text-xs">
                  <span className="text-[10px] text-muted-foreground block font-bold uppercase">Technician</span>
                  <span className="font-semibold">{ticket.assigneeName || "Unassigned"}</span>
                </div>
              )}

              {/* Incident Linker: System Admin only */}
              {canLinkIncident && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">
                    Associate Outage Incident
                  </label>
                  <Select
                    value={ticket.isIncident ? "LINKED" : "NONE"}
                    onValueChange={handleLinkIncident}
                  >
                    <SelectTrigger className="text-xs h-9 bg-card">
                      <SelectValue placeholder="Link active incident..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Unlinked</SelectItem>
                      {activeIncidents.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.title.slice(0, 30)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Simple avatar fallback implementation
function AvatarFallback({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export default TicketDetailsPage;
