import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Plus, Trash, Pencil } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Asset } from "@campuscare/shared-types";
import { AssetStatus, LifecycleStage, HealthStatus } from "@campuscare/shared-types";

// Design System & Shared Components using path aliases
import { EntityListTemplate } from "@/components/templates/EntityListTemplate.js";
import { CRUDDialogTemplate } from "@/components/templates/CRUDDialogTemplate.js";
import { Input } from "@/components/ui/input.js";
import { Tag } from "@/components/ui/tag.js";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select.js";

// Repositories
import { assetRepository } from "@/lib/repositories/asset.repository.js";
import { assetCategoryRepository } from "@/lib/repositories/asset-category.repository.js";
import { departmentRepository } from "@/lib/repositories/department.repository.js";

export function AssetsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Search & Filters state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "",
    lifecycleStage: "",
    healthStatus: "",
    categoryId: "",
    departmentId: "",
    building: "",
  });

  // Selected row tracking for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog open state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Form Fields state
  const [name, setName] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [tag, setTag] = useState("");
  const [qrCodeId, setQrCodeId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [model, setModel] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [status, setStatus] = useState<AssetStatus>(AssetStatus.OPERATIONAL);
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>(LifecycleStage.PROCURED);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>(HealthStatus.HEALTHY);
  const [location, setLocation] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");
  
  // Procurement & Warranty Fields state
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyStart, setWarrantyStart] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  
  const [departmentId, setDepartmentId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Queries
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["assets", search, filters, page],
    queryFn: () =>
      assetRepository.list({
        search,
        filters,
        page,
        pageSize: 10,
      }),
  });

  const { data: deptsRes } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentRepository.list(),
  });

  const { data: catsRes } = useQuery({
    queryKey: ["asset-categories"],
    queryFn: () => assetCategoryRepository.list(),
  });

  const departmentsList = deptsRes?.data || [];
  const categoriesList = catsRes?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (variables: Partial<Asset>) => assetRepository.create(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset registered successfully.");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to register asset.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: (variables: { id: string; data: Partial<Asset> }) =>
      assetRepository.update(variables.id, variables.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset updated successfully.");
      setIsEditOpen(false);
      setEditingAsset(null);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update asset.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setSelectedIds((prev) => prev.filter((x) => x !== editingAsset?.id));
      toast.success("Asset removed from active registry.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete asset.");
    }
  });

  const bulkMutation = useMutation({
    mutationFn: (variables: {
      action: "validate" | "create" | "update" | "assign" | "transfer" | "retire" | "qr";
      assetIds: string[];
      payload?: any;
    }) => assetRepository.bulkAction(variables.action, variables.assetIds, undefined, variables.payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setSelectedIds([]);
      toast.success(`Bulk action '${variables.action}' executed successfully.`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Bulk operation failed.");
    }
  });

  // Resets
  const resetForm = () => {
    setName("");
    setAssetCode("");
    setTag("");
    setQrCodeId("");
    setSerialNumber("");
    setModel("");
    setManufacturer("");
    setStatus(AssetStatus.OPERATIONAL);
    setLifecycleStage(LifecycleStage.PROCURED);
    setHealthStatus(HealthStatus.HEALTHY);
    setLocation("");
    setBuilding("");
    setFloor("");
    setRoom("");
    setPurchaseOrderNumber("");
    setVendorId("");
    setPurchasePrice("");
    setPurchaseDate("");
    setWarrantyStart("");
    setWarrantyExpiry("");
    setContractNumber("");
    setDepartmentId("");
    setCategoryId("");
  };

  const loadForm = (asset: Asset) => {
    setName(asset.name);
    setAssetCode(asset.assetCode);
    setTag(asset.tag);
    setQrCodeId(asset.qrCodeId || "");
    setSerialNumber(asset.serialNumber || "");
    setModel(asset.model);
    setManufacturer(asset.manufacturer || "");
    setStatus(asset.status);
    setLifecycleStage(asset.lifecycleStage);
    setHealthStatus(asset.healthStatus);
    setLocation(asset.location);
    setBuilding(asset.building || "");
    setFloor(asset.floor || "");
    setRoom(asset.room || "");
    setPurchaseOrderNumber(asset.purchaseOrderNumber || "");
    setVendorId(asset.vendorId || "");
    setPurchasePrice(asset.purchasePrice ? String(asset.purchasePrice) : "");
    setPurchaseDate(asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split("T")[0]! : "");
    setWarrantyStart(asset.warrantyStart ? new Date(asset.warrantyStart).toISOString().split("T")[0]! : "");
    setWarrantyExpiry(asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toISOString().split("T")[0]! : "");
    setContractNumber(asset.contractNumber || "");
    setDepartmentId(asset.departmentId);
    setCategoryId(asset.categoryId || "");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tag.trim() || !model.trim() || !location.trim() || !departmentId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    createMutation.mutate({
      name,
      assetCode: assetCode.trim() || undefined,
      tag,
      qrCodeId: qrCodeId.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      model,
      manufacturer: manufacturer.trim() || undefined,
      status,
      lifecycleStage,
      healthStatus,
      location,
      building: building.trim() || undefined,
      floor: floor.trim() || undefined,
      room: room.trim() || undefined,
      purchaseOrderNumber: purchaseOrderNumber.trim() || undefined,
      vendorId: vendorId.trim() || undefined,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      warrantyStart: warrantyStart ? new Date(warrantyStart) : undefined,
      warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
      contractNumber: contractNumber.trim() || undefined,
      departmentId,
      categoryId: categoryId || undefined,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    if (!name.trim() || !tag.trim() || !model.trim() || !location.trim() || !departmentId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    updateMutation.mutate({
      id: editingAsset.id,
      data: {
        name,
        tag,
        qrCodeId: qrCodeId.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        model,
        manufacturer: manufacturer.trim() || undefined,
        status,
        lifecycleStage,
        healthStatus,
        location,
        building: building.trim() || undefined,
        floor: floor.trim() || undefined,
        room: room.trim() || undefined,
        purchaseOrderNumber: purchaseOrderNumber.trim() || undefined,
        vendorId: vendorId.trim() || undefined,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        warrantyStart: warrantyStart ? new Date(warrantyStart) : undefined,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
        contractNumber: contractNumber.trim() || undefined,
        departmentId,
        categoryId: categoryId || undefined,
      },
    });
  };

  // Color mappings
  const getStatusColor = (s: AssetStatus) => {
    switch (s) {
      case AssetStatus.OPERATIONAL:
        return "success";
      case AssetStatus.MAINTENANCE:
        return "warning";
      case AssetStatus.BROKEN:
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getLifecycleColor = (l: LifecycleStage) => {
    switch (l) {
      case LifecycleStage.IN_USE:
      case LifecycleStage.ASSIGNED:
        return "success";
      case LifecycleStage.MAINTENANCE:
        return "warning";
      case LifecycleStage.RETIRED:
      case LifecycleStage.DISPOSED:
        return "destructive";
      default:
        return "primary";
    }
  };

  const getHealthColor = (h: HealthStatus) => {
    switch (h) {
      case HealthStatus.HEALTHY:
        return "success";
      case HealthStatus.MONITOR:
      case HealthStatus.WARNING:
        return "warning";
      case HealthStatus.CRITICAL:
      case HealthStatus.FAILING:
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Row selection helpers
  const toggleSelectAll = (checked: boolean, rows: Asset[]) => {
    if (checked) {
      setSelectedIds(rows.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRow = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  // Columns definition
  const columns: ColumnDef<Asset>[] = [
    {
      id: "select",
      header: () => (
        <input
          type="checkbox"
          checked={response?.data?.length ? selectedIds.length === response.data.length : false}
          onChange={(e) => toggleSelectAll(e.target.checked, response?.data || [])}
          className="rounded border-border text-primary focus:ring-primary size-3.5 cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.original.id)}
          onChange={(e) => toggleSelectRow(e.target.checked, row.original.id)}
          className="rounded border-border text-primary focus:ring-primary size-3.5 cursor-pointer"
        />
      ),
    },
    {
      accessorKey: "assetCode",
      header: "Asset Code",
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/assets/${row.original.id}`)}
          className="font-mono font-bold text-xs text-primary hover:underline cursor-pointer focus:outline-none"
        >
          {row.getValue("assetCode")}
        </button>
      ),
    },
    {
      accessorKey: "name",
      header: "Device Specs",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-bold text-foreground truncate">{row.getValue("name")}</p>
          <p className="text-[9px] text-muted-foreground truncate">{row.original.model} • {row.original.tag}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const val = row.getValue("status") as AssetStatus;
        return <Tag variant={getStatusColor(val)}>{val}</Tag>;
      },
    },
    {
      accessorKey: "lifecycleStage",
      header: "Stage",
      cell: ({ row }) => {
        const val = row.getValue("lifecycleStage") as LifecycleStage;
        return <Tag variant={getLifecycleColor(val)}>{val}</Tag>;
      },
    },
    {
      accessorKey: "healthStatus",
      header: "Health",
      cell: ({ row }) => {
        const val = row.getValue("healthStatus") as HealthStatus;
        return <Tag variant={getHealthColor(val)}>{val}</Tag>;
      },
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => (
        <span className="text-[10px] text-muted-foreground font-semibold">
          {row.original.building ? `${row.original.building} - R${row.original.room || ""}` : row.getValue("location")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => navigate(`/assets/${row.original.id}`)}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
            title="Inspect"
          >
            <Eye className="size-3.5" />
          </button>
          <button
            onClick={() => {
              setEditingAsset(row.original);
              loadForm(row.original);
              setIsEditOpen(true);
            }}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
            title="Edit Details"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to soft delete this asset?")) {
                deleteMutation.mutate(row.original.id);
              }
            }}
            className="p-1 hover:bg-destructive/5 rounded text-muted-foreground hover:text-destructive cursor-pointer focus:outline-none"
            title="Delete"
          >
            <Trash className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Filters configurations
  const filterOptions = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: AssetStatus.OPERATIONAL, label: "Operational" },
        { value: AssetStatus.MAINTENANCE, label: "Maintenance" },
        { value: AssetStatus.DECOMMISSIONED, label: "Decommissioned" },
        { value: AssetStatus.BROKEN, label: "Broken" },
      ],
    },
    {
      key: "lifecycleStage",
      label: "Stage",
      options: [
        { value: LifecycleStage.PROCURED, label: "Procured" },
        { value: LifecycleStage.ASSIGNED, label: "Assigned" },
        { value: LifecycleStage.IN_USE, label: "In Use" },
        { value: LifecycleStage.MAINTENANCE, label: "Maintenance" },
        { value: LifecycleStage.RESERVED, label: "Reserved" },
        { value: LifecycleStage.RETIRED, label: "Retired" },
        { value: LifecycleStage.DISPOSED, label: "Disposed" },
      ],
    },
    {
      key: "healthStatus",
      label: "Health",
      options: [
        { value: HealthStatus.HEALTHY, label: "Healthy" },
        { value: HealthStatus.MONITOR, label: "Monitor" },
        { value: HealthStatus.WARNING, label: "Warning" },
        { value: HealthStatus.CRITICAL, label: "Critical" },
        { value: HealthStatus.FAILING, label: "Failing" },
      ],
    },
    {
      key: "categoryId",
      label: "Category",
      options: categoriesList.map((c) => ({ value: c.id, label: c.name })),
    },
    {
      key: "departmentId",
      label: "Department",
      options: departmentsList.map((d) => ({ value: d.id, label: d.name })),
    },
  ];

  // Bulk actions handlers
  const handleBulkAction = (action: "assign" | "transfer" | "retire" | "qr") => {
    if (selectedIds.length === 0) {
      toast.warning("Please select at least one asset.");
      return;
    }

    if (action === "retire") {
      if (confirm(`Are you sure you want to retire ${selectedIds.length} assets?`)) {
        bulkMutation.mutate({ action: "retire", assetIds: selectedIds, payload: { notes: "Bulk retirement from dashboard" } });
      }
    } else if (action === "qr") {
      bulkMutation.mutate({ action: "qr", assetIds: selectedIds });
    } else {
      // Transfer / Assignment would open payload prompts
      const deptId = prompt("Enter target Department ID:");
      const loc = prompt("Enter new Location Text:");
      if (!deptId || !loc) return;
      bulkMutation.mutate({ action, assetIds: selectedIds, payload: { departmentId: deptId, location: loc } });
    }
  };

  const bulkActions = [
    { label: "Assign Selected", onClick: () => handleBulkAction("assign") },
    { label: "Transfer Selected", onClick: () => handleBulkAction("transfer") },
    { label: "Retire Selected", onClick: () => handleBulkAction("retire") },
    { label: "Generate QR Labels", onClick: () => handleBulkAction("qr") },
  ];

  return (
    <>
      <EntityListTemplate
        title="Asset Registry"
        description="University hardware and IT asset tracking index."
        columns={columns}
        data={response?.data || []}
        loading={isLoading}
        error={error ? (error as Error).message : null}
        searchQuery={search}
        onSearchChange={setSearch}
        filterOptions={filterOptions}
        activeFilters={filters}
        onFilterChange={(k, v) => {
          setFilters((prev) => ({ ...prev, [k]: v }));
          setPage(1);
        }}
        onClearFilters={() => {
          setSearch("");
          setFilters({ status: "", lifecycleStage: "", healthStatus: "", categoryId: "", departmentId: "", building: "" });
          setPage(1);
        }}
        actions={[
          {
            label: "Register Asset",
            onClick: () => {
              resetForm();
              setIsCreateOpen(true);
            },
            icon: Plus,
          },
        ]}
        selectedCount={selectedIds.length}
        bulkActions={bulkActions}
        pageIndex={page}
        pageCount={response?.pageCount || 1}
        onPageChange={setPage}
        onRetry={refetch}
      />

      {/* CREATE ASSET DIALOG */}
      <CRUDDialogTemplate
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Campus Asset"
        description="Add a new workstation, server, printer, or network device to the registry."
        onSubmit={handleCreate}
        submitLabel="Register Asset"
        isSubmitting={createMutation.isPending}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Asset Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CS Lab Laptop #12" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Asset Code (Auto-generated if empty)</label>
            <Input value={assetCode} onChange={(e) => setAssetCode(e.target.value)} placeholder="e.g. AST-2026-0092" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Asset Tag / QR Code *</label>
            <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. CC-LAP-0021" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Serial Number</label>
            <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="e.g. SN-892740-DELL" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Model / Brand *</label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. ThinkPad T14 Gen 4" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Manufacturer</label>
            <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="e.g. Lenovo" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Department *</label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue placeholder="Select Department" /></SelectTrigger>
              <SelectContent>
                {departmentsList.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Category</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue placeholder="Select Category" /></SelectTrigger>
              <SelectContent>
                {categoriesList.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Physical Location Text *</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. CS Building, 3rd Floor Room 304" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Building</label>
            <Input value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="e.g. CS Building" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Floor</label>
            <Input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="e.g. 3rd Floor" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Room</label>
            <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. 304" className="text-xs h-9 bg-card" />
          </div>
          
          <div className="border-t border-border col-span-1 md:col-span-2 my-1" />
          <h4 className="text-xs font-bold text-primary col-span-1 md:col-span-2">Procurement & Warranty</h4>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Purchase Order Number</label>
            <Input value={purchaseOrderNumber} onChange={(e) => setPurchaseOrderNumber(e.target.value)} placeholder="e.g. PO-90823" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Purchase Price</label>
            <Input value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} type="number" placeholder="e.g. 1200" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Purchase Date</label>
            <Input value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} type="date" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Warranty Start Date</label>
            <Input value={warrantyStart} onChange={(e) => setWarrantyStart(e.target.value)} type="date" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Warranty Expiry Date</label>
            <Input value={warrantyExpiry} onChange={(e) => setWarrantyExpiry(e.target.value)} type="date" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Contract Number (Warranty/AMC)</label>
            <Input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} placeholder="e.g. CON-8902-IT" className="text-xs h-9 bg-card" />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* EDIT ASSET DIALOG */}
      <CRUDDialogTemplate
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingAsset(null);
        }}
        title="Modify Campus Asset"
        description="Update device specifications, physical location parameters, and warranty bounds."
        onSubmit={handleEditSubmit}
        submitLabel="Save Changes"
        isSubmitting={updateMutation.isPending}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Asset Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CS Lab Laptop #12" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Asset Code (Immutable)</label>
            <Input value={assetCode} disabled className="text-xs h-9 bg-card opacity-60" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Asset Tag / QR Code *</label>
            <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. CC-LAP-0021" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Serial Number</label>
            <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="e.g. SN-892740-DELL" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Model / Brand *</label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. ThinkPad T14 Gen 4" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Manufacturer</label>
            <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="e.g. Lenovo" className="text-xs h-9 bg-card" />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as AssetStatus)}>
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={AssetStatus.OPERATIONAL}>Operational</SelectItem>
                <SelectItem value={AssetStatus.MAINTENANCE}>Maintenance</SelectItem>
                <SelectItem value={AssetStatus.DECOMMISSIONED}>Decommissioned</SelectItem>
                <SelectItem value={AssetStatus.BROKEN}>Broken</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Lifecycle Stage</label>
            <Select value={lifecycleStage} onValueChange={(v) => setLifecycleStage(v as LifecycleStage)}>
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={LifecycleStage.PROCURED}>Procured</SelectItem>
                <SelectItem value={LifecycleStage.ASSIGNED}>Assigned</SelectItem>
                <SelectItem value={LifecycleStage.IN_USE}>In Use</SelectItem>
                <SelectItem value={LifecycleStage.MAINTENANCE}>Maintenance</SelectItem>
                <SelectItem value={LifecycleStage.RESERVED}>Reserved</SelectItem>
                <SelectItem value={LifecycleStage.RETIRED}>Retired</SelectItem>
                <SelectItem value={LifecycleStage.DISPOSED}>Disposed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 col-span-1 md:col-span-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Health Status</label>
            <Select value={healthStatus} onValueChange={(v) => setHealthStatus(v as HealthStatus)}>
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={HealthStatus.HEALTHY}>Healthy</SelectItem>
                <SelectItem value={HealthStatus.MONITOR}>Monitor</SelectItem>
                <SelectItem value={HealthStatus.WARNING}>Warning</SelectItem>
                <SelectItem value={HealthStatus.CRITICAL}>Critical</SelectItem>
                <SelectItem value={HealthStatus.FAILING}>Failing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Department *</label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                {departmentsList.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Category</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Category</SelectItem>
                {categoriesList.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Physical Location Text *</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. CS Building, 3rd Floor Room 304" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Building</label>
            <Input value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="e.g. CS Building" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Floor</label>
            <Input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="e.g. 3rd Floor" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Room</label>
            <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. 304" className="text-xs h-9 bg-card" />
          </div>
          
          <div className="border-t border-border col-span-1 md:col-span-2 my-1" />
          <h4 className="text-xs font-bold text-primary col-span-1 md:col-span-2">Procurement & Warranty</h4>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Purchase Order Number</label>
            <Input value={purchaseOrderNumber} onChange={(e) => setPurchaseOrderNumber(e.target.value)} placeholder="e.g. PO-90823" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Purchase Price</label>
            <Input value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} type="number" placeholder="e.g. 1200" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Purchase Date</label>
            <Input value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} type="date" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Warranty Start Date</label>
            <Input value={warrantyStart} onChange={(e) => setWarrantyStart(e.target.value)} type="date" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Warranty Expiry Date</label>
            <Input value={warrantyExpiry} onChange={(e) => setWarrantyExpiry(e.target.value)} type="date" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Contract Number (Warranty/AMC)</label>
            <Input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} placeholder="e.g. CON-8902-IT" className="text-xs h-9 bg-card" />
          </div>
        </div>
      </CRUDDialogTemplate>
    </>
  );
}
export default AssetsPage;
