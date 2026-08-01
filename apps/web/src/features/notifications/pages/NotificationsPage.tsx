import { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { notificationRepository } from "../../../lib/repositories/notification.repository.js";
import { CRUDDialogTemplate } from "../../../components/templates/CRUDDialogTemplate.js";
import { Input } from "../../../components/ui/input.js";
import { Switch } from "../../../components/ui/switch.js";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../components/ui/select.js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { MockNotification } from "../../../mocks/notifications.js";
import { Plus, Trash, Check, Info, AlertTriangle, AlertOctagon, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { usePermission } from "../../../hooks/usePermission.js";

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canSend = hasPermission("notifications:send");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    isRead: "",
    category: "",
    type: "",
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("INFO");
  const [category, setCategory] = useState("SYSTEM");
  const [sendEmail, setSendEmail] = useState(false);

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["notifications", page, search, filters],
    queryFn: () =>
      notificationRepository.list({
        page,
        pageSize: 10,
        search,
        filters,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (variables: any) => notificationRepository.create(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Broadcast announcement sent!");
      setIsCreateOpen(false);
      setTitle("");
      setMessage("");
      setSendEmail(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification dismissed.");
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationRepository.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationRepository.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All announcements marked as read.");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    createMutation.mutate({
      title,
      message,
      type: type as any,
      category: category as any,
      sendEmail
    });
  };

  const getAlertIcon = (t: string) => {
    switch (t?.toUpperCase()) {
      case "WARNING":
        return <AlertTriangle className="size-4 text-warning" />;
      case "ERROR":
        return <AlertOctagon className="size-4 text-destructive" />;
      case "SUCCESS":
        return <CheckCircle className="size-4 text-success" />;
      default:
        return <Info className="size-4 text-primary" />;
    }
  };

  const getTypeStyle = (t: string) => {
    switch (t?.toUpperCase()) {
      case "ERROR":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "WARNING":
        return "bg-warning/10 text-warning border-warning/20";
      case "SUCCESS":
        return "bg-success/10 text-success border-success/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const columns: ColumnDef<MockNotification>[] = [
    {
      accessorKey: "title",
      header: "Announcement Details",
      cell: ({ row }) => (
        <div className="flex gap-2.5 items-start">
          <span className="mt-0.5">{getAlertIcon(row.original.type)}</span>
          <div>
            <p className="text-xs font-bold text-foreground">
              {row.getValue("title")}
              {!row.original.isRead && (
                <span className="ml-2 inline-flex items-center rounded-xs bg-primary text-primary-foreground px-1 py-0.5 text-[8px] font-extrabold uppercase select-none animate-pulse">
                  New
                </span>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-lg leading-relaxed">
              {row.original.message}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Domain Category",
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-sm border border-border px-2 py-0.5 text-[9px] font-bold uppercase select-none bg-muted/30 text-muted-foreground">
          {row.original.category || "SYSTEM"}
        </span>
      ),
    },
    {
      accessorKey: "type",
      header: "Severity profile",
      cell: ({ row }) => (
        <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[9px] font-extrabold uppercase select-none ${getTypeStyle(row.getValue("type"))}`}>
          {row.getValue("type")}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Dispatched Time",
      cell: ({ row }) => {
        const val = row.getValue("createdAt");
        return (
          <span className="text-[10px] text-muted-foreground font-semibold">
            {typeof val === "string" ? val : new Date(val as any).toLocaleString()}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Manage",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {!row.original.isRead && (
            <button
              onClick={() => markReadMutation.mutate(row.original.id)}
              className="p-1 hover:bg-primary/5 rounded text-muted-foreground hover:text-primary cursor-pointer focus:outline-none"
              title="Mark as read"
            >
              <Check className="size-3.5" />
            </button>
          )}
          <button
            onClick={() => deleteMutation.mutate(row.original.id)}
            className="p-1 hover:bg-destructive/5 rounded text-muted-foreground hover:text-destructive cursor-pointer focus:outline-none"
            title="Dismiss Announcement"
          >
            <Trash className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <EntityListTemplate
        title="Notification Center Queue"
        description="View past notification logs, monitor announcements, and configure alert schedules."
        columns={columns}
        data={response?.data || []}
        loading={isLoading}
        error={error ? error.message : null}
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filterOptions={[
          {
            key: "isRead",
            label: "Read State",
            options: [
              { value: "true", label: "Read" },
              { value: "false", label: "Unread" },
            ],
          },
          {
            key: "category",
            label: "Domain Category",
            options: [
              { value: "TICKET", label: "Tickets" },
              { value: "INCIDENT", label: "Incidents" },
              { value: "ASSET", label: "Assets" },
              { value: "MAINTENANCE", label: "Maintenance" },
              { value: "INVENTORY", label: "Inventory" },
              { value: "SLA", label: "SLA Warnings" },
              { value: "SYSTEM", label: "System Alerts" },
            ],
          },
          {
            key: "type",
            label: "Severity Profile",
            options: [
              { value: "INFO", label: "Info" },
              { value: "SUCCESS", label: "Success" },
              { value: "WARNING", label: "Warning" },
              { value: "ERROR", label: "Error" },
            ],
          },
        ]}
        activeFilters={filters}
        onFilterChange={(k, v) => {
          setFilters((prev) => ({ ...prev, [k]: v }));
          setPage(1);
        }}
        onClearFilters={() => {
          setSearch("");
          setFilters({ isRead: "", category: "", type: "" });
          setPage(1);
        }}
        actions={
          canSend
            ? [
                {
                  label: "Broadcast Alert",
                  onClick: () => setIsCreateOpen(true),
                  icon: Plus,
                },
              ]
            : []
        }
        bulkActions={[
          {
            label: "Mark All Read",
            onClick: () => markAllReadMutation.mutate(),
            icon: Check,
          },
        ]}
        pageIndex={page}
        pageSize={10}
        pageCount={response?.pageCount || 1}
        onPageChange={(p) => setPage(p)}
        onRetry={refetch}
      />

      <CRUDDialogTemplate
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Broadcast System Announcement"
        description="Publishes a campus-wide alert notification visible to all active user modules."
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
              placeholder="e.g. Wi-Fi network maintenance scheduled"
              className="text-xs"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Alert Severity</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="text-xs h-9 bg-card">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INFO">Information (Blue)</SelectItem>
                  <SelectItem value="SUCCESS">Success (Green)</SelectItem>
                  <SelectItem value="WARNING">Warning (Orange)</SelectItem>
                  <SelectItem value="ERROR">Critical/Error (Red)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Domain Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="text-xs h-9 bg-card">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SYSTEM">System/Global</SelectItem>
                  <SelectItem value="TICKET">Ticket updates</SelectItem>
                  <SelectItem value="INCIDENT">Incidents/Outages</SelectItem>
                  <SelectItem value="ASSET">Assets</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="INVENTORY">Inventory</SelectItem>
                  <SelectItem value="SLA">SLA Policies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Announcement Details</label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe details, times, locations, and actions..."
              className="text-xs"
              required
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/45">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-foreground">Send Email Notification</label>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Deliver this broadcast directly to user mailbox channels (respects preferences).
              </p>
            </div>
            <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
          </div>
        </div>
      </CRUDDialogTemplate>
    </>
  );
}
export default NotificationsPage;
