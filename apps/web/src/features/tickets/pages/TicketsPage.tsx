import React, { useState, useEffect } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { ticketRepository } from "../../../lib/repositories/ticket.repository.js";
import { CRUDDialogTemplate } from "../../../components/templates/CRUDDialogTemplate.js";
import { Input } from "../../../components/ui/input.js";
import { Textarea } from "../../../components/ui/textarea.js";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../components/ui/select.js";
import { Tag } from "../../../components/ui/tag.js";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { MockTicket } from "../../../mocks/tickets.js";
import { Ticket, Plus, Eye, Trash } from "lucide-react";
import { isMockEnabled } from "../../../mocks/index.js";

export function TicketsPage({ mineOnly = false }: { mineOnly?: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "",
    priority: "",
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("MEDIUM");

  // Fetch ticket list using repository
  const queryKey = mineOnly ? ["tickets", "mine", search, filters] : ["tickets", "all", search, filters];
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => {
      const activeFilters = { ...filters };
      if (mineOnly) {
        activeFilters.creatorId = "u-3"; // Mocking current student's tickets
      }
      activeFilters.isIncident = "false"; // General support tickets
      return ticketRepository.list({
        search,
        filters: activeFilters,
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: (variables: { title: string; description: string; priority: string }) =>
      ticketRepository.create({
        title: variables.title,
        description: variables.description,
        priority: variables.priority as any,
        isIncident: false,
        creatorId: mineOnly ? "u-3" : "u-1",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Support ticket logged successfully!");
      setIsCreateOpen(false);
      setNewTitle("");
      setNewDesc("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create ticket.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ticketRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket deleted successfully.");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a ticket title.");
      return;
    }
    createMutation.mutate({
      title: newTitle,
      description: newDesc,
      priority: newPriority,
    });
  };

  const getPriorityVariant = (p: string) => {
    switch (p) {
      case "CRITICAL":
        return "destructive";
      case "HIGH":
        return "warning";
      case "MEDIUM":
        return "primary";
      default:
        return "secondary";
    }
  };

  const columns: ColumnDef<MockTicket>[] = [
    {
      accessorKey: "ticketNumber",
      header: "Ticket ID",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-primary">
          {row.getValue("ticketNumber")}
        </span>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="max-w-[280px] sm:max-w-md truncate">
          <p className="text-xs font-bold text-foreground truncate">{row.getValue("title")}</p>
          <p className="text-[10px] text-muted-foreground truncate">{row.original.description}</p>
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const val = row.getValue("priority") as string;
        return <Tag variant={getPriorityVariant(val)}>{val}</Tag>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold select-none ${
              status === "RESOLVED" || status === "CLOSED"
                ? "bg-success/15 text-success"
                : status === "IN_PROGRESS"
                ? "bg-primary/15 text-primary"
                : "bg-warning/15 text-warning"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => (
        <span className="text-[11px] text-muted-foreground font-semibold">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => toast.info(`Viewing details of ${row.original.ticketNumber}`)}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
            title="View Details"
          >
            <Eye className="size-3.5" />
          </button>
          <button
            onClick={() => deleteMutation.mutate(row.original.id)}
            className="p-1 hover:bg-destructive/5 rounded text-muted-foreground hover:text-destructive cursor-pointer focus:outline-none"
            title="Delete Ticket"
          >
            <Trash className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const filterOptions = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "OPEN", label: "Open" },
        { value: "ASSIGNED", label: "Assigned" },
        { value: "IN_PROGRESS", label: "In Progress" },
        { value: "RESOLVED", label: "Resolved" },
        { value: "CLOSED", label: "Closed" },
      ],
    },
    {
      key: "priority",
      label: "Priority",
      options: [
        { value: "LOW", label: "Low" },
        { value: "MEDIUM", label: "Medium" },
        { value: "HIGH", label: "High" },
        { value: "CRITICAL", label: "Critical" },
      ],
    },
  ];

  return (
    <>
      <EntityListTemplate
        title={mineOnly ? "My Tickets" : "Ticket Dispatch"}
        description={mineOnly ? "Log and manage your personal IT requests." : "Global queue of all registered IT tickets."}
        columns={columns}
        data={response?.data || []}
        loading={isLoading}
        error={error ? error.message : null}
        searchQuery={search}
        onSearchChange={setSearch}
        filterOptions={filterOptions}
        activeFilters={filters}
        onFilterChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
        onClearFilters={() => {
          setSearch("");
          setFilters({ status: "", priority: "" });
        }}
        actions={[
          {
            label: "Log Ticket",
            onClick: () => setIsCreateOpen(true),
            icon: Plus,
          },
        ]}
        pageIndex={response?.page || 1}
        pageCount={response?.pageCount || 1}
        onPageChange={() => {}}
        onRetry={refetch}
      />

      {/* Reusable dialog compose */}
      <CRUDDialogTemplate
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Log Support Request"
        description="Describe the issue and specify its category priority. Our IT staff will assign it shortly."
        onSubmit={handleCreateSubmit}
        submitLabel="Log Ticket"
        isSubmitting={createMutation.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Title</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Printer in Room 102 offline"
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Description</label>
            <Textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Provide exact details of the incident..."
              rows={4}
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Priority</label>
            <Select value={newPriority} onValueChange={setNewPriority}>
              <SelectTrigger className="text-xs h-9 bg-card">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CRUDDialogTemplate>
    </>
  );
}
export default TicketsPage;
