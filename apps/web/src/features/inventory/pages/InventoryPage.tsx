import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  Trash2,
  Calendar,
  Layers,
  FileText,
  AlertTriangle,
  History,
  BookOpen,
  Plus,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Upload,
  QrCode,
  Save,
  Wifi,
  WifiOff
} from "lucide-react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { CRUDDialogTemplate } from "../../../components/templates/CRUDDialogTemplate.js";
import { ImportExportWizard } from "../../../components/common/ImportExportWizard.js";
import { Tag } from "../../../components/ui/tag.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card.js";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../components/ui/select.js";
import { Input } from "../../../components/ui/input.js";
import { Textarea } from "../../../components/ui/textarea.js";
import { Checkbox } from "../../../components/ui/checkbox.js";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../../components/ui/dropdown.js";
import { Button } from "../../../components/ui/button.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table.js";
import { inventoryRepository } from "../../../lib/repositories/inventory.repository.js";
import { 
  computeAvailableStock, 
  getStockAlertLevel, 
  computeInventoryValue 
} from "../utils/inventory-calculations.js";
import { formatDate } from "@campuscare/shared-utils";
import type { ColumnDef, ColumnPinningState, ColumnSizingState, VisibilityState } from "@tanstack/react-table";
import type { 
  InventoryItemWithAvailable, 
  InventoryTransaction,
  InventoryReservation
} from "@campuscare/shared-types";
import { 
  InventoryCategory, 
  InventoryStatus, 
  InventoryTransactionType, 
  ReservationStatus 
} from "@campuscare/shared-types";

export function InventoryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"dashboard" | "items" | "transactions" | "reservations" | "reports">("dashboard");

  // Selection state
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const selectedIds = Object.entries(rowSelection).filter(([_, v]) => v).map(([k]) => k);
  const selectedCount = selectedIds.length;

  // Single Item dialog states
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithAvailable | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Bulk dialog states
  const [isBulkStockInOpen, setIsBulkStockInOpen] = useState(false);
  const [isBulkStockOutOpen, setIsBulkStockOutOpen] = useState(false);
  const [isBulkAdjustOpen, setIsBulkAdjustOpen] = useState(false);
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<InventoryCategory>(InventoryCategory.SPARE_PART);
  const [formStatus, setFormStatus] = useState<InventoryStatus>(InventoryStatus.ACTIVE);
  const [formUnit, setFormUnit] = useState("pcs");
  const [formManufacturer, setFormManufacturer] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formBarcodeQr, setFormBarcodeQr] = useState("");
  const [formCurrentStock, setFormCurrentStock] = useState("0");
  const [formMinimumStock, setFormMinimumStock] = useState("0");
  const [formMaximumStock, setFormMaximumStock] = useState("10");
  const [formReorderLevel, setFormReorderLevel] = useState("5");
  const [formUnitCost, setFormUnitCost] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Transaction form states
  const [txQuantity, setTxQuantity] = useState("1");
  const [txReason, setTxReason] = useState("");
  const [txNotes, setTxNotes] = useState("");

  // Reservation form states
  const [resQuantity, setResQuantity] = useState("1");
  const [resModuleRef, setResModuleRef] = useState("Manual");
  const [resReferenceId, setResReferenceId] = useState("");
  const [resExpiresAt, setResExpiresAt] = useState("");
  const [resNotes, setResNotes] = useState("");

  // Report states
  const [reportDateFrom, setReportDateFrom] = useState("");
  const [reportDateTo, setReportDateTo] = useState("");

  // Search & Filter state for Items list
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    category: "",
    status: "",
    stockLevel: "ALL",
  });

  // React Table Sizing, Pinning & Visibility States
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({ left: [], right: [] });
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Online / Offline State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection restored. Write operations enabled.");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Network connection lost. Switch to read-only mode.");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Saved Views State
  const [savedViews, setSavedViews] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem("campuscare_inventory_views");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [selectedView, setSelectedView] = useState<string>("");
  const [newViewName, setNewViewName] = useState<string>("");

  const handleSaveView = () => {
    if (!newViewName.trim()) return;
    const viewConfig = {
      search,
      filters,
      columnPinning,
      columnSizing,
      columnVisibility,
    };
    const updated = { ...savedViews, [newViewName]: viewConfig };
    setSavedViews(updated);
    localStorage.setItem("campuscare_inventory_views", JSON.stringify(updated));
    setSelectedView(newViewName);
    setNewViewName("");
    toast.success(`View "${newViewName}" saved successfully`);
  };

  const handleApplyView = (name: string) => {
    const view = savedViews[name];
    if (!view) return;
    setSearch(view.search || "");
    setFilters(view.filters || {});
    setColumnPinning(view.columnPinning || { left: [], right: [] });
    setColumnSizing(view.columnSizing || {});
    setColumnVisibility(view.columnVisibility || {});
    setSelectedView(name);
    toast.success(`Applied view "${name}"`);
  };

  const handleDeleteView = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...savedViews };
    delete updated[name];
    setSavedViews(updated);
    localStorage.setItem("campuscare_inventory_views", JSON.stringify(updated));
    if (selectedView === name) {
      setSelectedView("");
    }
    toast.success(`Deleted view "${name}"`);
  };

  const [isExporting, setIsExporting] = useState(false);

  // Export handlers
  const handleExport = async (format: "csv" | "xlsx") => {
    setIsExporting(true);
    try {
      const blob = await inventoryRepository.exportCSV({ ...filters, search, format });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory-export-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Successfully exported inventory items as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async (format: "csv" | "xlsx") => {
    try {
      const blob = await inventoryRepository.downloadCSVTemplate(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory-import-template.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded template for ${format.toUpperCase()}`);
    } catch (err) {
      toast.error("Failed to download template.");
    }
  };

  // Search & Filter state for Transactions list
  const [txSearch, setTxSearch] = useState("");
  const [txFilters, setTxFilters] = useState<Record<string, string>>({
    transactionType: "",
  });

  // Query - Dashboard Summary
  const { data: dashboard, isLoading: isDashLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ["inventory-dashboard"],
    queryFn: () => inventoryRepository.getDashboardSummary(),
  });

  // Query - Items List
  const { data: itemsResponse, isLoading: isItemsLoading, error: itemsError, refetch: refetchItems } = useQuery({
    queryKey: ["inventory-items", search, filters],
    queryFn: () => {
      const queryParams: any = {
        search,
        category: filters.category || undefined,
        status: filters.status || undefined,
      };
      if (filters.stockLevel === "LOW") queryParams.isLowStock = true;
      if (filters.stockLevel === "CRITICAL") queryParams.isCriticalStock = true;
      if (filters.stockLevel === "OUT") queryParams.isOutOfStock = true;
      return inventoryRepository.list(queryParams);
    },
  });

  // Query - Transactions list
  const { data: txResponse, isLoading: isTxLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ["inventory-transactions", txFilters],
    queryFn: () => {
      return inventoryRepository.getAllTransactions({
        transactionType: (txFilters.transactionType as any) || undefined,
      });
    },
  });

  // Query - Reservations list
  const { data: reservationsResponse, isLoading: isResLoading, refetch: refetchReservations } = useQuery({
    queryKey: ["inventory-reservations"],
    queryFn: () => inventoryRepository.listReservations(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => inventoryRepository.create(payload),
    onSuccess: () => {
      toast.success("Inventory item created successfully");
      setIsAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create item");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => inventoryRepository.update(id, data),
    onSuccess: () => {
      toast.success("Inventory item updated successfully");
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update item");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryRepository.delete(id),
    onSuccess: () => {
      toast.success("Item deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete item");
    }
  });

  const stockInMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => inventoryRepository.stockIn(id, payload),
    onSuccess: () => {
      toast.success("Stock checked in successfully");
      setIsStockInOpen(false);
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to stock in");
    }
  });

  const stockOutMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => inventoryRepository.stockOut(id, payload),
    onSuccess: () => {
      toast.success("Stock checked out successfully");
      setIsStockOutOpen(false);
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to stock out");
    }
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => inventoryRepository.stockAdjust(id, payload),
    onSuccess: () => {
      toast.success("Stock level adjusted successfully");
      setIsAdjustOpen(false);
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to adjust stock");
    }
  });

  const reserveMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => inventoryRepository.reserveStock(id, payload),
    onSuccess: () => {
      toast.success("Inventory stock reserved successfully");
      setIsReserveOpen(false);
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reserve stock");
    }
  });

  const releaseResMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => inventoryRepository.releaseReservation(id, payload),
    onSuccess: () => {
      toast.success("Reservation released successfully");
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to release reservation");
    }
  });

  // Bulk Operations mutations
  const bulkStockInMutation = useMutation({
    mutationFn: (payload: any) => inventoryRepository.bulkStockIn(payload),
    onSuccess: (res) => {
      toast.success(`Bulk stock in complete: ${res.succeeded.length} succeeded, ${res.failed.length} failed.`);
      setIsBulkStockInOpen(false);
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    }
  });

  const bulkStockOutMutation = useMutation({
    mutationFn: (payload: any) => inventoryRepository.bulkStockOut(payload),
    onSuccess: (res) => {
      toast.success(`Bulk stock out complete: ${res.succeeded.length} succeeded, ${res.failed.length} failed.`);
      setIsBulkStockOutOpen(false);
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    }
  });

  const bulkAdjustMutation = useMutation({
    mutationFn: (payload: any) => inventoryRepository.bulkStockAdjust(payload),
    onSuccess: (res) => {
      toast.success(`Bulk adjust complete: ${res.succeeded.length} succeeded, ${res.failed.length} failed.`);
      setIsBulkAdjustOpen(false);
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (payload: any) => inventoryRepository.bulkSoftDelete(payload),
    onSuccess: (res) => {
      toast.success(`Bulk delete complete: ${res.succeeded.length} deleted, ${res.failed.length} failed.`);
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    }
  });

  // Automation mutations
  const detectLowStockMutation = useMutation({
    mutationFn: () => inventoryRepository.detectLowStock(),
    onSuccess: (res) => {
      toast.info(`Low stock scanning completed: ${res.detectedCount} items currently below reorder levels.`);
    }
  });

  const detectCriticalStockMutation = useMutation({
    mutationFn: () => inventoryRepository.detectCriticalStock(),
    onSuccess: (res) => {
      toast.warning(`Critical stock scanning completed: ${res.detectedCount} items currently below minimum safety stocks.`);
    }
  });

  // Reset form helper
  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormCategory(InventoryCategory.SPARE_PART);
    setFormStatus(InventoryStatus.ACTIVE);
    setFormUnit("pcs");
    setFormManufacturer("");
    setFormModel("");
    setFormBarcodeQr("");
    setFormCurrentStock("0");
    setFormMinimumStock("0");
    setFormMaximumStock("10");
    setFormReorderLevel("5");
    setFormUnitCost("");
    setFormLocation("");
    setFormNotes("");
  };

  // Submit handlers
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formName,
      description: formDescription || null,
      category: formCategory,
      status: formStatus,
      unit: formUnit,
      manufacturer: formManufacturer || null,
      model: formModel || null,
      barcodeQr: formBarcodeQr || null,
      currentStock: parseInt(formCurrentStock, 10),
      minimumStock: parseInt(formMinimumStock, 10),
      maximumStock: parseInt(formMaximumStock, 10),
      reorderLevel: parseInt(formReorderLevel, 10),
      unitCost: formUnitCost ? parseFloat(formUnitCost) : null,
      location: formLocation || null,
      notes: formNotes || null,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    updateMutation.mutate({
      id: selectedItem.id,
      data: {
        name: formName,
        description: formDescription || null,
        category: formCategory,
        status: formStatus,
        unit: formUnit,
        manufacturer: formManufacturer || null,
        model: formModel || null,
        barcodeQr: formBarcodeQr || null,
        minimumStock: parseInt(formMinimumStock, 10),
        maximumStock: parseInt(formMaximumStock, 10),
        reorderLevel: parseInt(formReorderLevel, 10),
        unitCost: formUnitCost ? parseFloat(formUnitCost) : null,
        location: formLocation || null,
        notes: formNotes || null,
      }
    });
  };

  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    stockInMutation.mutate({
      id: selectedItem.id,
      payload: {
        quantity: parseInt(txQuantity, 10),
        reason: txReason || "Stock replenishment",
        notes: txNotes || null,
      }
    });
  };

  const handleStockOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    stockOutMutation.mutate({
      id: selectedItem.id,
      payload: {
        quantity: parseInt(txQuantity, 10),
        reason: txReason,
        notes: txNotes || null,
      }
    });
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    adjustMutation.mutate({
      id: selectedItem.id,
      payload: {
        newQuantity: parseInt(txQuantity, 10),
        reason: txReason,
        notes: txNotes || null,
      }
    });
  };

  const handleReserveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    reserveMutation.mutate({
      id: selectedItem.id,
      payload: {
        quantity: parseInt(resQuantity, 10),
        moduleRef: resModuleRef,
        referenceId: resReferenceId || null,
        expiresAt: resExpiresAt || null,
        notes: resNotes || null,
      }
    });
  };

  const handleBulkStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bulkStockInMutation.mutate({
      items: selectedIds.map(id => ({ itemId: id, quantity: parseInt(txQuantity, 10) })),
      reason: txReason || "Bulk stock in",
      notes: txNotes || null,
    });
  };

  const handleBulkStockOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bulkStockOutMutation.mutate({
      items: selectedIds.map(id => ({ itemId: id, quantity: parseInt(txQuantity, 10) })),
      reason: txReason,
      notes: txNotes || null,
    });
  };

  const handleBulkAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bulkAdjustMutation.mutate({
      items: selectedIds.map(id => ({ itemId: id, newQuantity: parseInt(txQuantity, 10) })),
      reason: txReason,
      notes: txNotes || null,
    });
  };

  const handleBulkSoftDelete = () => {
    if (confirm("Are you sure you want to soft delete these selected items?")) {
      bulkDeleteMutation.mutate({ itemIds: selectedIds });
    }
  };


  // Helper colors
  const getAlertBadgeColor = (level: string) => {
    switch (level) {
      case "OUT_OF_STOCK": return "destructive";
      case "CRITICAL": return "destructive";
      case "LOW": return "warning";
      default: return "success";
    }
  };

  const getStatusBadgeColor = (status: InventoryStatus) => {
    switch (status) {
      case InventoryStatus.ACTIVE: return "success";
      case InventoryStatus.INACTIVE: return "outline";
      default: return "destructive";
    }
  };

  const columns: ColumnDef<InventoryItemWithAvailable>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={selectedCount > 0 && selectedCount === table.getRowModel().rows.length}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const checked = e.target.checked;
            const newSel: Record<string, boolean> = {};
            if (checked) {
              table.getRowModel().rows.forEach((row) => {
                newSel[row.original.id] = true;
              });
            }
            setRowSelection(newSel);
          }}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={!!rowSelection[row.original.id]}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const checked = e.target.checked;
            setRowSelection((prev) => ({
              ...prev,
              [row.original.id]: checked,
            }));
          }}
          aria-label="Select row"
          className="translate-y-[2px]"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "itemCode",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-primary">
          {row.getValue("itemCode")}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Item Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground max-w-[200px] truncate">
            {row.getValue("name")}
          </span>
          <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
            {row.original.manufacturer} · {row.original.model}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Tag variant="outline">{String(row.getValue("category"))}</Tag>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Tag variant={getStatusBadgeColor(row.getValue("status") as InventoryStatus)}>
          {String(row.getValue("status"))}
        </Tag>
      ),
    },
    {
      accessorKey: "currentStock",
      header: "Stock Levels",
      cell: ({ row }) => {
        const current = row.getValue("currentStock") as number;
        const reserved = row.original.reservedStock;
        const avail = computeAvailableStock(current, reserved);
        const alert = getStockAlertLevel(row.original);
        
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground">{current}</span>
              <span className="text-[10px] text-muted-foreground">({row.original.unit})</span>
              <Tag variant={getAlertBadgeColor(alert)} className="text-[9px] py-0 px-1 font-bold">
                {alert}
              </Tag>
            </div>
            <span className="text-[10px] text-muted-foreground font-semibold">
              Avail: <span className="text-foreground">{avail}</span> | Rsvd: {reserved}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "unitCost",
      header: "Unit Cost",
      cell: ({ row }) => {
        const val = row.getValue("unitCost");
        return (
          <span className="text-xs font-bold text-muted-foreground">
            {val ? `$${Number(val).toFixed(2)}` : "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground max-w-[120px] truncate block">
          {row.getValue("location") || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="xs" className="h-6 w-6 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
                <span className="font-bold text-xs">···</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedItem(item);
                  setIsDetailOpen(true);
                }}
                className="text-xs font-semibold"
              >
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedItem(item);
                  resetForm();
                  setFormName(item.name);
                  setFormDescription(item.description || "");
                  setFormCategory(item.category);
                  setFormStatus(item.status);
                  setFormUnit(item.unit);
                  setFormManufacturer(item.manufacturer || "");
                  setFormModel(item.model || "");
                  setFormBarcodeQr(item.barcodeQr || "");
                  setFormMinimumStock(String(item.minimumStock));
                  setFormMaximumStock(String(item.maximumStock));
                  setFormReorderLevel(String(item.reorderLevel));
                  setFormUnitCost(item.unitCost ? String(item.unitCost) : "");
                  setFormLocation(item.location || "");
                  setFormNotes(item.notes || "");
                  setIsEditOpen(true);
                }}
                className="text-xs font-semibold"
              >
                Edit Item
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedItem(item);
                  setTxQuantity("1");
                  setTxReason("Stock refill");
                  setTxNotes("");
                  setIsStockInOpen(true);
                }}
                className="text-xs font-semibold"
              >
                Stock In
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedItem(item);
                  setTxQuantity("1");
                  setTxReason("");
                  setTxNotes("");
                  setIsStockOutOpen(true);
                }}
                className="text-xs font-semibold"
                disabled={item.availableStock <= 0}
              >
                Stock Out
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedItem(item);
                  setTxQuantity(String(item.currentStock));
                  setTxReason("");
                  setTxNotes("");
                  setIsAdjustOpen(true);
                }}
                className="text-xs font-semibold"
              >
                Adjust Stock
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedItem(item);
                  setResQuantity("1");
                  setResModuleRef("Manual");
                  setResReferenceId("");
                  setResExpiresAt("");
                  setResNotes("");
                  setIsReserveOpen(true);
                }}
                className="text-xs font-semibold"
              >
                Reserve Stock
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  if (confirm("Are you sure you want to delete this item?")) {
                    deleteMutation.mutate(item.id);
                  }
                }}
                className="text-xs font-semibold text-destructive hover:bg-destructive/10"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }
  ];

  return (
    <div className="space-y-4">
      {/* Offline Read-Only Banner */}
      {!isOnline && (
        <div className="bg-amber-950/40 border border-amber-500/50 p-3 rounded-lg text-amber-400 text-sm font-semibold flex items-center justify-between gap-4 mb-4">
          <span className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-500" />
            You are currently offline. CampusCare is running in read-only mode. Database modifications are disabled.
          </span>
          <span className="bg-amber-500/20 text-[10px] px-2 py-0.5 rounded font-extrabold uppercase text-amber-300">Offline Mode</span>
        </div>
      )}

      {/* Premium Tab Navigation Row */}
      <div className="flex border-b border-border bg-surface-subtle/40 p-1.5 rounded-sm gap-1 select-none">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xs transition-all cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-surface-subtle"
          }`}
        >
          <Package className="size-3.5" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("items")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xs transition-all cursor-pointer ${
            activeTab === "items"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-surface-subtle"
          }`}
        >
          <Layers className="size-3.5" />
          Spare Parts List
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xs transition-all cursor-pointer ${
            activeTab === "transactions"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-surface-subtle"
          }`}
        >
          <History className="size-3.5" />
          Transactions
        </button>
        <button
          onClick={() => setActiveTab("reservations")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xs transition-all cursor-pointer ${
            activeTab === "reservations"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-surface-subtle"
          }`}
        >
          <Calendar className="size-3.5" />
          Reservations
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xs transition-all cursor-pointer ${
            activeTab === "reports"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-surface-subtle"
          }`}
        >
          <FileText className="size-3.5" />
          Audit Reports
        </button>
      </div>

      {/* ==========================================
          TAB 1: DASHBOARD VIEW
          ========================================== */}
      {activeTab === "dashboard" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-bold text-foreground">Inventory Dashboard</h1>
            <p className="text-xs text-muted-foreground">Asset storage metrics and stock health alerts.</p>
          </div>

          {/* Alert Summaries Row */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <Card className="md:col-span-1 border-border/80 shadow-xs bg-card">
              <CardHeader className="pb-1.5 pt-3.5 px-4"><CardTitle className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Parts</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">{dashboard?.totalItems || 0}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">items</span>
              </CardContent>
            </Card>

            <Card className="md:col-span-1 border-border/80 shadow-xs bg-card">
              <CardHeader className="pb-1.5 pt-3.5 px-4"><CardTitle className="text-[10px] uppercase font-bold tracking-wider text-warning">Low Stock</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-warning">{dashboard?.lowStockItems || 0}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">reorder</span>
              </CardContent>
            </Card>

            <Card className="md:col-span-1 border-border/80 shadow-xs bg-card">
              <CardHeader className="pb-1.5 pt-3.5 px-4"><CardTitle className="text-[10px] uppercase font-bold tracking-wider text-orange-500">Critical Stock</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-orange-500">{dashboard?.criticalStockItems || 0}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">safety min</span>
              </CardContent>
            </Card>

            <Card className="md:col-span-1 border-border/80 shadow-xs bg-card">
              <CardHeader className="pb-1.5 pt-3.5 px-4"><CardTitle className="text-[10px] uppercase font-bold tracking-wider text-destructive">Out of Stock</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-destructive">{dashboard?.outOfStockItems || 0}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">zero level</span>
              </CardContent>
            </Card>

            <Card className="md:col-span-1 border-border/80 shadow-xs bg-card">
              <CardHeader className="pb-1.5 pt-3.5 px-4"><CardTitle className="text-[10px] uppercase font-bold tracking-wider text-primary">Available Stock</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-primary">{dashboard?.totalAvailableStock || 0}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">usable</span>
              </CardContent>
            </Card>

            <Card className="md:col-span-1 border-border/80 shadow-xs bg-card">
              <CardHeader className="pb-1.5 pt-3.5 px-4"><CardTitle className="text-[10px] uppercase font-bold tracking-wider text-success">Total Value</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3.5 flex items-baseline gap-1.5">
                <span className="text-xl font-black text-success">
                  {dashboard?.totalInventoryValue ? `$${Number(dashboard.totalInventoryValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "$0"}
                </span>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quick Actions Board */}
            <Card className="border-border/80 shadow-xs bg-card">
              <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-xs font-bold">Automation Operations</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="p-3.5 rounded-sm border border-border bg-surface-subtle/50 space-y-2">
                  <span className="text-[11px] font-bold text-foreground block">SCAN STOCK THRESHOLDS</span>
                  <p className="text-[10px] text-muted-foreground">Scan all active items for stock deficiencies and trigger alerts.</p>
                  <div className="flex gap-2 pt-1">
                    <Button 
                      onClick={() => detectLowStockMutation.mutate()} 
                      size="xs" 
                      variant="outline"
                      className="text-xs flex items-center gap-1.5 h-8 font-semibold cursor-pointer"
                    >
                      <RefreshCw className="size-3" />
                      Scan Low
                    </Button>
                    <Button 
                      onClick={() => detectCriticalStockMutation.mutate()} 
                      size="xs" 
                      variant="outline"
                      className="text-xs flex items-center gap-1.5 h-8 text-orange-500 hover:bg-orange-50/10 border-orange-500/20 font-semibold cursor-pointer"
                    >
                      <AlertTriangle className="size-3" />
                      Scan Critical
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent activity list */}
            <Card className="md:col-span-2 border-border/80 shadow-xs bg-card">
              <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-xs font-bold">Recent Stock movements</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4">
                {dashboard?.recentTransactions && dashboard.recentTransactions.length > 0 ? (
                  <div className="rounded-sm border border-border bg-surface overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px]">Time</TableHead>
                          <TableHead className="text-[10px]">Item Code</TableHead>
                          <TableHead className="text-[10px]">Type</TableHead>
                          <TableHead className="text-[10px] text-right">Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboard.recentTransactions.slice(0, 5).map((tx: any) => (
                          <TableRow key={tx.id}>
                            <TableCell className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
                            <TableCell className="text-xs font-mono font-bold text-primary">{tx.item?.itemCode || tx.itemId}</TableCell>
                            <TableCell className="text-xs"><Tag variant={tx.transactionType === "STOCK_IN" ? "success" : "outline"}>{tx.transactionType}</Tag></TableCell>
                            <TableCell className="text-xs font-bold text-right">{tx.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">No transaction records logged.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: SPARE PARTS LIST VIEW
          ========================================== */}
      {activeTab === "items" && (
        <div className="space-y-3">
          {/* Saved Views Control Panel */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg mb-3">
            <div className="flex items-center gap-3">
              <Layers className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-semibold text-zinc-300">Saved Views:</span>
              <div className="flex gap-1.5 flex-wrap">
                {Object.keys(savedViews).length === 0 ? (
                  <span className="text-zinc-500 text-xs py-1">No saved views</span>
                ) : (
                  Object.keys(savedViews).map((name) => (
                    <Button
                      key={name}
                      variant={selectedView === name ? "default" : "outline"}
                      size="xs"
                      onClick={() => handleApplyView(name)}
                      className="h-7 text-xs flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300"
                    >
                      {name}
                      <Trash2
                        className="h-3 w-3 text-red-400 hover:text-red-600 ml-1 cursor-pointer"
                        onClick={(e) => handleDeleteView(name, e)}
                      />
                    </Button>
                  ))
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="New view name..."
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                className="h-8 max-w-[160px] text-xs bg-zinc-950 border-zinc-800 text-zinc-300"
              />
              <Button onClick={handleSaveView} size="xs" variant="outline" className="h-8 gap-1 text-zinc-300 border-zinc-700">
                <Save className="h-3.5 w-3.5" />
                Save View
              </Button>
            </div>
          </div>

          <EntityListTemplate
            title="Spare Parts Storage"
            description="Consumable infrastructure inventory database and reorder tracking."
            columns={columns}
            data={itemsResponse?.data || []}
            loading={isItemsLoading}
            error={itemsError ? itemsError.message : null}
            searchQuery={search}
            onSearchChange={setSearch}
            filterOptions={[
              {
                key: "category",
                label: "Category Filter",
                options: Object.values(InventoryCategory).map(v => ({ value: v, label: v })),
              },
              {
                key: "status",
                label: "Status Filter",
                options: Object.values(InventoryStatus).map(v => ({ value: v, label: v })),
              },
              {
                key: "stockLevel",
                label: "Stock Level",
                options: [
                  { value: "ALL", label: "All Items" },
                  { value: "LOW", label: "Low Stock Alert Only" },
                  { value: "CRITICAL", label: "Critical Safety Stocks" },
                  { value: "OUT", label: "Out of Stock" },
                ],
              },
            ]}
            activeFilters={filters}
            onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
            onClearFilters={() => {
              setSearch("");
              setFilters({ category: "", status: "", stockLevel: "ALL" });
            }}
            actions={[
              {
                label: "Add Item",
                onClick: () => {
                  resetForm();
                  setIsAddOpen(true);
                },
                icon: Plus,
                variant: "primary",
                disabled: !isOnline,
              },
              {
                label: "Import Sheets",
                onClick: () => setIsCSVImportOpen(true),
                icon: FileSpreadsheet,
                variant: "outline",
                disabled: !isOnline,
              },
              {
                label: "Export CSV",
                onClick: () => handleExport("csv"),
                icon: Download,
                variant: "outline",
              },
              {
                label: "Export Excel",
                onClick: () => handleExport("xlsx"),
                icon: FileSpreadsheet,
                variant: "outline",
              },
            ]}
            selectedCount={selectedCount}
            bulkActions={[
              {
                label: "Bulk Stock In",
                onClick: () => {
                  setTxQuantity("1");
                  setTxReason("Bulk replenishment");
                  setTxNotes("");
                  setIsBulkStockInOpen(true);
                },
                icon: ArrowDownToLine,
                disabled: !isOnline,
              },
              {
                label: "Bulk Stock Out",
                onClick: () => {
                  setTxQuantity("1");
                  setTxReason("");
                  setTxNotes("");
                  setIsBulkStockOutOpen(true);
                },
                icon: ArrowUpFromLine,
                disabled: !isOnline,
              },
              {
                label: "Bulk Adjust Stock",
                onClick: () => {
                  setTxQuantity("0");
                  setTxReason("");
                  setTxNotes("");
                  setIsBulkAdjustOpen(true);
                },
                icon: SlidersHorizontal,
                disabled: !isOnline,
              },
              {
                label: "Bulk Delete (Soft)",
                onClick: handleBulkSoftDelete,
                icon: Trash2,
                variant: "destructive",
                disabled: !isOnline,
              },
            ]}
            pageIndex={itemsResponse?.page || 1}
            pageCount={itemsResponse?.pageCount || 1}
            onPageChange={(page) => refetchItems()}
            onRetry={refetchItems}
            columnPinning={columnPinning}
            onColumnPinningChange={setColumnPinning}
            columnSizing={columnSizing}
            onColumnSizingChange={setColumnSizing}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        </div>
      )}

      {/* ==========================================
          TAB 3: TRANSACTIONS HISTORY VIEW
          ========================================== */}
      {activeTab === "transactions" && (
        <EntityListTemplate
          title="Stock Transaction Audit Logs"
          description="Chronological log history of all items issued, replenished, or adjusted."
          columns={[
            {
              accessorKey: "createdAt",
              header: "Timestamp",
              cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                  {formatDate(row.getValue("createdAt"))}
                </span>
              ),
            },
            {
              accessorKey: "item.itemCode",
              header: "Item Code",
              cell: ({ row }) => (
                <span className="font-mono font-bold text-xs text-primary">
                  {(row.original as any).item?.itemCode || "—"}
                </span>
              ),
            },
            {
              accessorKey: "item.name",
              header: "Part Name",
              cell: ({ row }) => (
                <span className="text-xs font-semibold text-foreground truncate max-w-[150px] block">
                  {(row.original as any).item?.name || "Deleted Item"}
                </span>
              ),
            },
            {
              accessorKey: "transactionType",
              header: "Type",
              cell: ({ row }) => (
                <Tag variant={row.getValue("transactionType") === "STOCK_IN" ? "success" : "outline"}>
                  {String(row.getValue("transactionType"))}
                </Tag>
              ),
            },
            {
              accessorKey: "quantity",
              header: "Quantity",
              cell: ({ row }) => (
                <span className="text-xs font-bold">{row.getValue("quantity")}</span>
              ),
            },
            {
              accessorKey: "newStock",
              header: "New Level",
              cell: ({ row }) => (
                <span className="text-xs text-muted-foreground font-bold">
                  {row.original.previousStock} → {row.original.newStock}
                </span>
              ),
            },
            {
              accessorKey: "reason",
              header: "Reason / Notes",
              cell: ({ row }) => (
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground max-w-[200px] truncate">
                    {row.getValue("reason") || "No reason"}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                    {row.original.notes}
                  </span>
                </div>
              ),
            },
            {
              accessorKey: "performedBy",
              header: "Operator",
              cell: ({ row }) => (
                <span className="text-xs font-semibold">
                  {(row.original as any).performedBy ? `${(row.original as any).performedBy.firstName} ${(row.original as any).performedBy.lastName}` : "System"}
                </span>
              ),
            }
          ]}
          data={txResponse?.data || []}
          loading={isTxLoading}
          searchQuery={txSearch}
          onSearchChange={setTxSearch}
          filterOptions={[
            {
              key: "transactionType",
              label: "Tx Type",
              options: Object.values(InventoryTransactionType).map(v => ({ value: v, label: v })),
            }
          ]}
          activeFilters={txFilters}
          onFilterChange={(k, v) => setTxFilters(prev => ({ ...prev, [k]: v }))}
          onClearFilters={() => {
            setTxSearch("");
            setTxFilters({ transactionType: "" });
          }}
          pageIndex={txResponse?.page || 1}
          pageCount={txResponse?.pageCount || 1}
          onPageChange={() => refetchTransactions()}
          onRetry={refetchTransactions}
        />
      )}

      {/* ==========================================
          TAB 4: RESERVATIONS VIEW
          ========================================== */}
      {activeTab === "reservations" && (
        <div className="space-y-3">
          <div className="flex flex-col gap-1 border-b border-border pb-3">
            <h1 className="text-lg font-bold text-foreground">Spare Part Reservations</h1>
            <p className="text-xs text-muted-foreground">Active holds allocated to upcoming maintenance record dispatches.</p>
          </div>

          <div className="rounded-sm border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Item Code</TableHead>
                  <TableHead className="text-[10px]">Part Name</TableHead>
                  <TableHead className="text-[10px] text-right">Hold Qty</TableHead>
                  <TableHead className="text-[10px]">Status</TableHead>
                  <TableHead className="text-[10px]">Module Ref</TableHead>
                  <TableHead className="text-[10px]">Reference ID</TableHead>
                  <TableHead className="text-[10px]">Expires At</TableHead>
                  <TableHead className="text-[10px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isResLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-xs text-muted-foreground text-center py-6">Loading reservations...</TableCell></TableRow>
                ) : reservationsResponse?.data && reservationsResponse.data.length > 0 ? (
                  reservationsResponse.data.map((res: InventoryReservation) => (
                    <TableRow key={res.id}>
                      <TableCell className="text-xs font-mono font-bold text-primary">{(res as any).item?.itemCode}</TableCell>
                      <TableCell className="text-xs font-bold">{(res as any).item?.name}</TableCell>
                      <TableCell className="text-xs font-bold text-right">{res.quantity}</TableCell>
                      <TableCell className="text-xs">
                        <Tag variant={res.status === ReservationStatus.ACTIVE ? "success" : "outline"}>
                          {res.status}
                        </Tag>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-semibold">{res.moduleRef || "Manual"}</TableCell>
                      <TableCell className="text-xs font-mono">{res.referenceId || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {res.expiresAt ? formatDate(res.expiresAt) : "Never"}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {res.status === ReservationStatus.ACTIVE && (
                          <Button
                            onClick={() => {
                              if (confirm("Release this hold back to available shelf inventory?")) {
                                releaseResMutation.mutate({ id: res.id, payload: {} });
                              }
                            }}
                            variant="outline"
                            size="xs"
                            className="h-7 text-xs font-bold cursor-pointer"
                          >
                            Release
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={8} className="text-xs text-muted-foreground text-center py-12">No holds or reserved stock items currently active.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 5: AUDIT REPORTS VIEW
          ========================================== */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-1 border-b border-border pb-3">
            <h1 className="text-lg font-bold text-foreground">Inventory Audits & Reports</h1>
            <p className="text-xs text-muted-foreground">Real-time status summaries and historical stock logs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Snapshot report card */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-1 pt-3.5"><CardTitle className="text-xs font-bold flex items-center gap-1.5"><FileSpreadsheet className="size-4 text-success" /> Current Stock Snapshot</CardTitle></CardHeader>
              <CardContent className="space-y-2 pt-2">
                <p className="text-[11px] text-muted-foreground">Download the entire storage ledger with current stock metrics and storage locations.</p>
                <Button onClick={() => handleExport("csv")} size="xs" variant="outline" className="w-full flex items-center gap-1.5 h-8 font-bold mt-2 cursor-pointer">
                  <Download className="size-3.5" />
                  Download CSV Ledger
                </Button>
              </CardContent>
            </Card>

            {/* Low stock report */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-1 pt-3.5"><CardTitle className="text-xs font-bold flex items-center gap-1.5"><AlertTriangle className="size-4 text-warning" /> Low Stock Ledger</CardTitle></CardHeader>
              <CardContent className="space-y-2 pt-2">
                <p className="text-[11px] text-muted-foreground">Print or display items that are critically deficient or below safety stocks.</p>
                <Button 
                  onClick={async () => {
                    try {
                      const rep = await inventoryRepository.getLowStockReport();
                      toast.info(`Deficiency report: ${rep.length} parts currently require reordering.`);
                    } catch (e) {
                      toast.error("Failed to run report");
                    }
                  }} 
                  size="xs" 
                  variant="outline" 
                  className="w-full flex items-center gap-1.5 h-8 text-warning border-warning/30 hover:bg-warning/10 font-bold mt-2 cursor-pointer"
                >
                  <AlertCircle className="size-3.5" />
                  Inspect Deficiencies
                </Button>
              </CardContent>
            </Card>

            {/* Custom stock movement report */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-1 pt-3.5"><CardTitle className="text-xs font-bold flex items-center gap-1.5"><History className="size-4 text-primary" /> Stock Movement Logs</CardTitle></CardHeader>
              <CardContent className="space-y-2 pt-2">
                <p className="text-[11px] text-muted-foreground">Select date filters to compile incoming vs outgoing logs.</p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Input type="date" value={reportDateFrom} onChange={(e) => setReportDateFrom(e.target.value)} className="h-8 text-xs bg-surface" />
                  <Input type="date" value={reportDateTo} onChange={(e) => setReportDateTo(e.target.value)} className="h-8 text-xs bg-surface" />
                </div>
                <Button 
                  onClick={async () => {
                    try {
                      const hist = await inventoryRepository.getStockMovementHistory({ fromDate: reportDateFrom, toDate: reportDateTo });
                      toast.success(`Movement ledger compiled: ${hist.total} records found.`);
                    } catch (e) {
                      toast.error("Failed to generate movement log");
                    }
                  }}
                  size="xs" 
                  variant="outline" 
                  className="w-full flex items-center gap-1.5 h-8 font-bold mt-1 cursor-pointer"
                  disabled={!reportDateFrom || !reportDateTo}
                >
                  <FileText className="size-3.5" />
                  Compile Movements
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ==========================================
          MODALS / DIALOGS FOR INVENTORY OPERATIONS
          ========================================== */}

      {/* ADD ITEM DIALOG */}
      <CRUDDialogTemplate
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Storage Part"
        description="Register a new item code for spare part monitoring."
        onSubmit={handleAddSubmit}
        submitLabel="Create Item"
        isSubmitting={createMutation.isPending}
      >
        <div className="space-y-3.5 max-h-[70vh] overflow-y-auto px-1 py-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Part Name *</label>
            <Input required value={formName} onChange={(e) => setFormName(e.target.value)} className="text-xs h-9 bg-card" placeholder="e.g. Cat6 Ethernet Cable" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Description</label>
            <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="text-xs bg-card" placeholder="Brief technical specifications..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Category</label>
              <Select value={formCategory} onValueChange={(val) => setFormCategory(val as InventoryCategory)}>
                <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(InventoryCategory).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Unit descriptor *</label>
              <Input required value={formUnit} onChange={(e) => setFormUnit(e.target.value)} className="text-xs h-9 bg-card" placeholder="e.g. pcs, metres" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Manufacturer</label>
              <Input value={formManufacturer} onChange={(e) => setFormManufacturer(e.target.value)} className="text-xs h-9 bg-card" placeholder="e.g. Intel" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Model</label>
              <Input value={formModel} onChange={(e) => setFormModel(e.target.value)} className="text-xs h-9 bg-card" placeholder="e.g. i7-13700K" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Barcode / QR</label>
              <Input value={formBarcodeQr} onChange={(e) => setFormBarcodeQr(e.target.value)} className="text-xs h-9 bg-card" placeholder="e.g. UPC-001" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Start Stock</label>
              <Input type="number" required value={formCurrentStock} onChange={(e) => setFormCurrentStock(e.target.value)} className="text-xs h-9 bg-card" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Min Stock</label>
              <Input type="number" required value={formMinimumStock} onChange={(e) => setFormMinimumStock(e.target.value)} className="text-xs h-9 bg-card" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Max Stock</label>
              <Input type="number" required value={formMaximumStock} onChange={(e) => setFormMaximumStock(e.target.value)} className="text-xs h-9 bg-card" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Reorder Lvl</label>
              <Input type="number" required value={formReorderLevel} onChange={(e) => setFormReorderLevel(e.target.value)} className="text-xs h-9 bg-card" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Unit Cost ($)</label>
              <Input type="number" step="0.01" value={formUnitCost} onChange={(e) => setFormUnitCost(e.target.value)} className="text-xs h-9 bg-card" placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Storage Location</label>
              <Input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} className="text-xs h-9 bg-card" placeholder="e.g. Shelf A-3" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Storage Notes</label>
            <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="text-xs bg-card" placeholder="Any handling instructions..." />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* EDIT ITEM DIALOG */}
      <CRUDDialogTemplate
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Storage Part Details"
        description="Update technical specifications or storage reorder settings."
        onSubmit={handleEditSubmit}
        submitLabel="Save Specifications"
        isSubmitting={updateMutation.isPending}
      >
        <div className="space-y-3.5 max-h-[70vh] overflow-y-auto px-1 py-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Part Name *</label>
            <Input required value={formName} onChange={(e) => setFormName(e.target.value)} className="text-xs h-9 bg-card" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Description</label>
            <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="text-xs bg-card" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Category</label>
              <Select value={formCategory} onValueChange={(val) => setFormCategory(val as InventoryCategory)}>
                <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(InventoryCategory).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Unit descriptor *</label>
              <Input required value={formUnit} onChange={(e) => setFormUnit(e.target.value)} className="text-xs h-9 bg-card" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Manufacturer</label>
              <Input value={formManufacturer} onChange={(e) => setFormManufacturer(e.target.value)} className="text-xs h-9 bg-card" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Model</label>
              <Input value={formModel} onChange={(e) => setFormModel(e.target.value)} className="text-xs h-9 bg-card" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Barcode / QR</label>
              <Input value={formBarcodeQr} onChange={(e) => setFormBarcodeQr(e.target.value)} className="text-xs h-9 bg-card" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Min Stock</label>
              <Input type="number" required value={formMinimumStock} onChange={(e) => setFormMinimumStock(e.target.value)} className="text-xs h-9 bg-card" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Max Stock</label>
              <Input type="number" required value={formMaximumStock} onChange={(e) => setFormMaximumStock(e.target.value)} className="text-xs h-9 bg-card" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Reorder Lvl</label>
              <Input type="number" required value={formReorderLevel} onChange={(e) => setFormReorderLevel(e.target.value)} className="text-xs h-9 bg-card" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Unit Cost ($)</label>
              <Input type="number" step="0.01" value={formUnitCost} onChange={(e) => setFormUnitCost(e.target.value)} className="text-xs h-9 bg-card" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Storage Location</label>
              <Input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} className="text-xs h-9 bg-card" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Storage Notes</label>
            <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="text-xs bg-card" />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* STOCK IN DIALOG */}
      <CRUDDialogTemplate
        isOpen={isStockInOpen}
        onClose={() => setIsStockInOpen(false)}
        title={`Stock In: ${selectedItem?.name}`}
        description="Add replenishment stock quantity to storage ledger."
        onSubmit={handleStockInSubmit}
        submitLabel="Replenish Stock"
        isSubmitting={stockInMutation.isPending}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Refill Quantity ({selectedItem?.unit}) *</label>
            <Input type="number" required min="1" value={txQuantity} onChange={(e) => setTxQuantity(e.target.value)} className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Replenishment Reason *</label>
            <Input required value={txReason} onChange={(e) => setTxReason(e.target.value)} className="text-xs h-9 bg-card" placeholder="e.g. Regular order refill" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Additional Notes</label>
            <Textarea value={txNotes} onChange={(e) => setTxNotes(e.target.value)} className="text-xs bg-card" placeholder="e.g. Order reference numbers..." />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* STOCK OUT DIALOG */}
      <CRUDDialogTemplate
        isOpen={isStockOutOpen}
        onClose={() => setIsStockOutOpen(false)}
        title={`Stock Out: ${selectedItem?.name}`}
        description="Deduct stock for deployment."
        onSubmit={handleStockOutSubmit}
        submitLabel="Check Out Stock"
        isSubmitting={stockOutMutation.isPending}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Issue Quantity ({selectedItem?.unit}) *</label>
            <Input type="number" required min="1" max={selectedItem?.availableStock} value={txQuantity} onChange={(e) => setTxQuantity(e.target.value)} className="text-xs h-9 bg-card" />
            <span className="text-[10px] text-muted-foreground block font-bold">Max available: {selectedItem?.availableStock}</span>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Issue Reason *</label>
            <Input required value={txReason} onChange={(e) => setTxReason(e.target.value)} className="text-xs h-9 bg-card" placeholder="e.g. Lab 4 wiring upgrade" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Additional Notes</label>
            <Textarea value={txNotes} onChange={(e) => setTxNotes(e.target.value)} className="text-xs bg-card" />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* STOCK ADJUST DIALOG */}
      <CRUDDialogTemplate
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title={`Adjust Stock: ${selectedItem?.name}`}
        description="Directly override current stock level in storage database."
        onSubmit={handleAdjustSubmit}
        submitLabel="Set Stock Level"
        isSubmitting={adjustMutation.isPending}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">New Stock quantity ({selectedItem?.unit}) *</label>
            <Input type="number" required min={selectedItem?.reservedStock} value={txQuantity} onChange={(e) => setTxQuantity(e.target.value)} className="text-xs h-9 bg-card" />
            <span className="text-[10px] text-muted-foreground block font-bold">Must be at least reserved quantity: {selectedItem?.reservedStock}</span>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Adjustment Justification *</label>
            <Input required value={txReason} onChange={(e) => setTxReason(e.target.value)} className="text-xs h-9 bg-card" placeholder="e.g. Audited warehouse discrepancy" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Additional Notes</label>
            <Textarea value={txNotes} onChange={(e) => setTxNotes(e.target.value)} className="text-xs bg-card" />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* RESERVE STOCK DIALOG */}
      <CRUDDialogTemplate
        isOpen={isReserveOpen}
        onClose={() => setIsReserveOpen(false)}
        title={`Reserve Hold: ${selectedItem?.name}`}
        description="Allocate reserved hold stock for upcoming dispatches."
        onSubmit={handleReserveSubmit}
        submitLabel="Place Hold"
        isSubmitting={reserveMutation.isPending}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Reserve Quantity *</label>
              <Input type="number" required min="1" max={selectedItem?.availableStock} value={resQuantity} onChange={(e) => setResQuantity(e.target.value)} className="text-xs h-9 bg-card" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Module Reference</label>
              <Select value={resModuleRef} onValueChange={setResModuleRef}>
                <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Manual Hold</SelectItem>
                  <SelectItem value="Maintenance">Maintenance dispatch</SelectItem>
                  <SelectItem value="Procurement">Procurement allocation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Reference Record ID</label>
              <Input value={resReferenceId} onChange={(e) => setResReferenceId(e.target.value)} className="text-xs h-9 bg-card" placeholder="e.g. rec-1" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Expires Date</label>
              <Input type="datetime-local" value={resExpiresAt} onChange={(e) => setResExpiresAt(e.target.value)} className="text-xs h-9 bg-card" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Hold Notes</label>
            <Textarea value={resNotes} onChange={(e) => setResNotes(e.target.value)} className="text-xs bg-card" />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* BULK STOCK IN DIALOG */}
      <CRUDDialogTemplate
        isOpen={isBulkStockInOpen}
        onClose={() => setIsBulkStockInOpen(false)}
        title={`Bulk Replenish (${selectedCount} items)`}
        description="Add identical stock quantities to all selected items."
        onSubmit={handleBulkStockInSubmit}
        submitLabel="Bulk Replenish"
        isSubmitting={bulkStockInMutation.isPending}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Quantity to add (per item) *</label>
            <Input type="number" required min="1" value={txQuantity} onChange={(e) => setTxQuantity(e.target.value)} className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Reason *</label>
            <Input required value={txReason} onChange={(e) => setTxReason(e.target.value)} className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Additional Notes</label>
            <Textarea value={txNotes} onChange={(e) => setTxNotes(e.target.value)} className="text-xs bg-card" />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* BULK STOCK OUT DIALOG */}
      <CRUDDialogTemplate
        isOpen={isBulkStockOutOpen}
        onClose={() => setIsBulkStockOutOpen(false)}
        title={`Bulk Stock Issue (${selectedCount} items)`}
        description="Issue identical stock quantities from all selected items."
        onSubmit={handleBulkStockOutSubmit}
        submitLabel="Bulk Issue"
        isSubmitting={bulkStockOutMutation.isPending}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Quantity to deduct (per item) *</label>
            <Input type="number" required min="1" value={txQuantity} onChange={(e) => setTxQuantity(e.target.value)} className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Reason *</label>
            <Input required value={txReason} onChange={(e) => setTxReason(e.target.value)} className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Notes</label>
            <Textarea value={txNotes} onChange={(e) => setTxNotes(e.target.value)} className="text-xs bg-card" />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* BULK STOCK ADJUST DIALOG */}
      <CRUDDialogTemplate
        isOpen={isBulkAdjustOpen}
        onClose={() => setIsBulkAdjustOpen(false)}
        title={`Bulk Stock Override (${selectedCount} items)`}
        description="Override stock values for all selected items."
        onSubmit={handleBulkAdjustSubmit}
        submitLabel="Bulk Adjust"
        isSubmitting={bulkAdjustMutation.isPending}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">New stock level (for all selected) *</label>
            <Input type="number" required min="0" value={txQuantity} onChange={(e) => setTxQuantity(e.target.value)} className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Reason *</label>
            <Input required value={txReason} onChange={(e) => setTxReason(e.target.value)} className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Notes</label>
            <Textarea value={txNotes} onChange={(e) => setTxNotes(e.target.value)} className="text-xs bg-card" />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* Reusable Sheet Import / Column Mapping Wizard */}
      <ImportExportWizard
        isOpen={isCSVImportOpen}
        onClose={() => setIsCSVImportOpen(false)}
        fields={[
          { key: "name", label: "Part Name", required: true },
          { key: "category", label: "Category (SPARE_PART/CABLE/TOOL/CONSUMABLE)", required: true },
          { key: "unit", label: "Unit (pcs/meters/packs)", required: true },
          { key: "description", label: "Description", required: false },
          { key: "status", label: "Status (ACTIVE/INACTIVE)", required: false },
          { key: "manufacturer", label: "Manufacturer", required: false },
          { key: "model", label: "Model", required: false },
          { key: "barcodeQr", label: "Barcode/QR", required: false },
          { key: "currentStock", label: "Current Stock", required: false },
          { key: "minimumStock", label: "Minimum Stock", required: false },
          { key: "maximumStock", label: "Maximum Stock", required: false },
          { key: "reorderLevel", label: "Reorder Level", required: false },
          { key: "unitCost", label: "Unit Cost", required: false },
          { key: "location", label: "Warehouse Location", required: false },
          { key: "notes", label: "Warehouse Notes", required: false },
        ]}
        onValidate={async (file, mapping) => {
          return inventoryRepository.validateCSVImport(file, mapping);
        }}
        onCommit={async (validData) => {
          return inventoryRepository.importCommit(validData);
        }}
        onSuccess={() => {
          setIsCSVImportOpen(false);
          queryClient.invalidateQueries({ queryKey: ["inventory-items"] }); // wait, is the query key inventory-items or inventory? Let's check or invalidate both!
          queryClient.invalidateQueries({ queryKey: ["inventory"] });
          toast.success("Inventory items imported successfully!");
        }}
        title="Import Warehouse Ledger"
      />

      {/* READ ONLY DETAIL SLIDE PANEL */}
      <CRUDDialogTemplate
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Part Ledger: ${selectedItem?.itemCode}`}
        description="Comprehensive specifications and warehouse details."
        onSubmit={(e) => { e.preventDefault(); setIsDetailOpen(false); }}
        submitLabel="Done"
        cancelLabel=""
      >
        {selectedItem && (
          <div className="space-y-3 max-h-[70vh] overflow-y-auto px-1 py-1">
            <div className="flex justify-between items-start border-b border-border pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-foreground">{selectedItem.name}</h3>
                <span className="text-[10px] text-muted-foreground font-semibold">{selectedItem.manufacturer} · {selectedItem.model}</span>
              </div>
              <Tag variant={getStatusBadgeColor(selectedItem.status)}>{selectedItem.status}</Tag>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-sm border border-border bg-surface-subtle/50">
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block mb-0.5">Category</span>
                <span className="font-bold">{selectedItem.category}</span>
              </div>
              <div className="p-2.5 rounded-sm border border-border bg-surface-subtle/50">
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block mb-0.5">Location</span>
                <span className="font-bold">{selectedItem.location || "Unspecified"}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-sm border border-border bg-surface-subtle/30 text-center">
                <span className="text-[9px] font-bold text-muted-foreground block mb-0.5">Current Stock</span>
                <span className="font-black text-sm">{selectedItem.currentStock}</span>
              </div>
              <div className="p-2 rounded-sm border border-border bg-surface-subtle/30 text-center">
                <span className="text-[9px] font-bold text-muted-foreground block mb-0.5">Reserved Holds</span>
                <span className="font-black text-sm">{selectedItem.reservedStock}</span>
              </div>
              <div className="p-2 rounded-sm border border-border bg-surface-subtle/30 text-center">
                <span className="text-[9px] font-bold text-muted-foreground block mb-0.5">Available Stock</span>
                <span className="font-black text-sm text-primary">{selectedItem.availableStock}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="p-1.5 rounded-sm border border-border text-center">
                <span className="text-[8px] font-bold text-muted-foreground block">Safety Min</span>
                <span className="font-bold">{selectedItem.minimumStock}</span>
              </div>
              <div className="p-1.5 rounded-sm border border-border text-center">
                <span className="text-[8px] font-bold text-muted-foreground block">Maximum Cap</span>
                <span className="font-bold">{selectedItem.maximumStock}</span>
              </div>
              <div className="p-1.5 rounded-sm border border-border text-center">
                <span className="text-[8px] font-bold text-muted-foreground block">Reorder Lvl</span>
                <span className="font-bold">{selectedItem.reorderLevel}</span>
              </div>
              <div className="p-1.5 rounded-sm border border-border text-center">
                <span className="text-[8px] font-bold text-muted-foreground block">Unit Cost</span>
                <span className="font-bold">{selectedItem.unitCost ? `$${Number(selectedItem.unitCost).toFixed(2)}` : "—"}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-sm border border-border bg-surface-subtle/50 text-xs">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block mb-0.5">Barcode / QR Identifier</span>
              <div className="flex items-center gap-1.5 font-bold font-mono">
                <QrCode className="size-3.5 text-muted-foreground" />
                {selectedItem.barcodeQr || "No scanner code registered"}
              </div>
            </div>

            {selectedItem.description && (
              <div className="p-2.5 rounded-sm border border-border bg-surface-subtle/30 text-xs">
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block mb-0.5">Description</span>
                <p className="text-muted-foreground font-semibold leading-relaxed">{selectedItem.description}</p>
              </div>
            )}

            {selectedItem.notes && (
              <div className="p-2.5 rounded-sm border border-border bg-surface-subtle/30 text-xs">
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block mb-0.5">Warehouse Notes</span>
                <p className="text-muted-foreground font-semibold leading-relaxed">{selectedItem.notes}</p>
              </div>
            )}
          </div>
        )}
      </CRUDDialogTemplate>
    </div>
  );
}
export default InventoryPage;
