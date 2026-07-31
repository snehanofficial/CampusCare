import React, { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { notificationRepository } from "../../../lib/repositories/notification.repository.js";
import { CRUDDialogTemplate } from "../../../components/templates/CRUDDialogTemplate.js";
import { Input } from "../../../components/ui/input.js";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../components/ui/select.js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { MockNotification } from "../../../mocks/notifications.js";
import { Bell, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    isRead: "",
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("SYSTEM");

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["notifications", search, filters],
    queryFn: () =>
      notificationRepository.list({
        search,
        filters,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (variables: Partial<MockNotification>) => notificationRepository.create(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Broadcast announcement sent!");
      setIsCreateOpen(false);
      setTitle("");
      setMessage("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification dismissed.");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    createMutation.mutate({ title, message, type: type as any });
  };

  const columns: ColumnDef<MockNotification>[] = [
    {
      accessorKey: "title",
      header: "Announcement",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-bold text-foreground">
            {row.getValue("title")}
            {!row.original.isRead && (
              <span className="ml-1.5 inline-flex items-center rounded bg-primary/10 px-1 py-0.5 text-[8px] font-bold text-primary uppercase select-none">
                New
              </span>
            )}
          </p>
          <p className="text-[10px] text-muted-foreground">{row.original.message}</p>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Alert Profile",
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[9px] font-bold uppercase select-none">
          {row.getValue("type")}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Dispatched",
      cell: ({ row }) => (
        <span className="text-[11px] text-muted-foreground font-semibold">
          {row.getValue("createdAt")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Dismiss",
      cell: ({ row }) => (
        <button
          onClick={() => deleteMutation.mutate(row.original.id)}
          className="p-1 hover:bg-destructive/5 rounded text-muted-foreground hover:text-destructive cursor-pointer focus:outline-none"
          title="Dismiss"
        >
          <Trash className="size-3.5" />
        </button>
      ),
    },
  ];

  return (
    <>
      <EntityListTemplate
        title="Announcements Queue"
        description="Broadcast notifications sent to student groups, tech panels, and campus administrations."
        columns={columns}
        data={response?.data || []}
        loading={isLoading}
        error={error ? error.message : null}
        searchQuery={search}
        onSearchChange={setSearch}
        filterOptions={[
          {
            key: "isRead",
            label: "Read Filter",
            options: [
              { value: "true", label: "Read" },
              { value: "false", label: "Unread" },
            ],
          },
        ]}
        activeFilters={filters}
        onFilterChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
        onClearFilters={() => {
          setSearch("");
          setFilters({ isRead: "" });
        }}
        actions={[
          {
            label: "Broadcast Alert",
            onClick: () => setIsCreateOpen(true),
            icon: Plus,
          },
        ]}
        pageIndex={response?.page || 1}
        pageCount={response?.pageCount || 1}
        onPageChange={() => {}}
        onRetry={refetch}
      />

      <CRUDDialogTemplate
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Broadcast System Alert"
        description="Dispatches system-wide alerts to authorized active user profiles."
        onSubmit={handleCreate}
        submitLabel="Send Alert"
        isSubmitting={createMutation.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Alert Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Wi-Fi service maintenance scheduled"
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Alert Profile Category</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="text-xs h-9 bg-card">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SYSTEM">System Alert</SelectItem>
                <SelectItem value="TICKET">Ticket Update</SelectItem>
                <SelectItem value="WARNING">Warning SLA Alert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Broadcast Message</label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe alert particulars..."
              className="text-xs"
            />
          </div>
        </div>
      </CRUDDialogTemplate>
    </>
  );
}
export default NotificationsPage;
