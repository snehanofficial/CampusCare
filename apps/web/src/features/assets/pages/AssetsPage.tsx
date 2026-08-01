import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Plus, Trash, Pencil, MoreVertical, ArrowLeftRight, CheckSquare, Clipboard, Undo, Calendar } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Asset } from "@campuscare/shared-types";
import { AssetStatus, LifecycleStage, HealthStatus, ProcurementStatus, AssignmentStatus } from "@campuscare/shared-types";

// Design System & Shared Components using path aliases
import { EntityListTemplate } from "@/components/templates/EntityListTemplate.js";
import { CRUDDialogTemplate } from "@/components/templates/CRUDDialogTemplate.js";
import { Input } from "@/components/ui/input.js";
import { Tag } from "@/components/ui/tag.js";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select.js";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.js";
import { Textarea } from "@/components/ui/textarea.js";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown.js";

// Repositories
import { assetRepository } from "@/lib/repositories/asset.repository.js";
import { assetCategoryRepository } from "@/lib/repositories/asset-category.repository.js";
import { departmentRepository } from "@/lib/repositories/department.repository.js";
import { userRepository } from "@/lib/repositories/user.repository.js";

export function AssetsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Active tab state ("assets" | "procurements")
  const [activeTab, setActiveTab] = useState("assets");

  // ==========================================
  // MASTER ASSETS REGISTRY STATE & MUTATIONS
  // ==========================================
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Core Asset Form Fields
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
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyStart, setWarrantyStart] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // ==========================================
  // PHASE 2 ASSIGNMENT & TRANSFERS STATE
  // ==========================================
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isLifecycleOpen, setIsLifecycleOpen] = useState(false);
  const [targetAsset, setTargetAsset] = useState<Asset | null>(null);

  // Assign form state
  const [assigneeType, setAssigneeType] = useState<"USER" | "DEPARTMENT" | "LOCATION">("USER");
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [assigneeDeptId, setAssigneeDeptId] = useState("");
  const [assigneeLoc, setAssigneeLoc] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");

  // Transfer form state
  const [transferType, setTransferType] = useState<"USER" | "DEPARTMENT" | "LOCATION">("USER");
  const [transferUserId, setTransferUserId] = useState("");
  const [transferDeptId, setTransferDeptId] = useState("");
  const [transferLoc, setTransferLoc] = useState("");
  const [transferBuilding, setTransferBuilding] = useState("");
  const [transferFloor, setTransferFloor] = useState("");
  const [transferRoom, setTransferRoom] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  // Return form state
  const [returnNotes, setReturnNotes] = useState("");

  // Lifecycle stage change state
  const [targetStage, setTargetStage] = useState<LifecycleStage>(LifecycleStage.AVAILABLE);
  const [lifecycleNotes, setLifecycleNotes] = useState("");

  // ==========================================
  // PROCUREMENT WORKFLOW STATE & MUTATIONS
  // ==========================================
  const [procSearch, setProcSearch] = useState("");
  const [procPage, setProcPage] = useState(1);
  const [procStatus, setProcStatus] = useState("");
  const [isCreateProcOpen, setIsCreateProcOpen] = useState(false);
  const [isEditProcOpen, setIsEditProcOpen] = useState(false);
  const [editingProc, setEditingProc] = useState<any | null>(null);

  // Procurement Request Form Fields
  const [procPONumber, setProcPONumber] = useState("");
  const [procInvoiceNumber, setProcInvoiceNumber] = useState("");
  const [procDate, setProcDate] = useState("");
  const [procCost, setProcCost] = useState("");
  const [procVendorRef, setProcVendorRef] = useState("");
  const [procStatusField, setProcStatusField] = useState<ProcurementStatus>(ProcurementStatus.REQUESTED);
  const [procAssetName, setProcAssetName] = useState("");
  const [procModel, setProcModel] = useState("");
  const [procManufacturer, setProcManufacturer] = useState("");
  const [procCategoryId, setProcCategoryId] = useState("");
  const [procDeptId, setProcDeptId] = useState("");
  const [procQuantity, setProcQuantity] = useState("1");

  // Batch Registration Dialog Fields
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registeringProc, setRegisteringProc] = useState<any | null>(null);
  const [registerBatchCount, setRegisterBatchCount] = useState(1);
  const [batchAssets, setBatchAssets] = useState<Array<{ serialNumber: string; tag: string; location: string; building: string; floor: string; room: string }>>([]);

  // ==========================================
  // QUERIES
  // ==========================================
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

  const { data: procResponse, isLoading: isProcLoading, error: procError, refetch: refetchProc } = useQuery({
    queryKey: ["procurements", procSearch, procStatus, procPage],
    queryFn: () =>
      assetRepository.listProcurements({
        search: procSearch,
        filters: { status: procStatus },
        page: procPage,
        pageSize: 10
      }),
    enabled: activeTab === "procurements"
  });

  const { data: deptsRes } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentRepository.list(),
  });

  const { data: catsRes } = useQuery({
    queryKey: ["asset-categories"],
    queryFn: () => assetCategoryRepository.list(),
  });

  const { data: usersRes } = useQuery({
    queryKey: ["users-assignment"],
    queryFn: () => userRepository.list(),
  });

  const departmentsList = deptsRes?.data || [];
  const categoriesList = catsRes?.data || [];
  const usersList = usersRes?.data || [];

  // ==========================================
  // MUTATIONS
  // ==========================================
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

  // Assignment Mutations
  const assignMutation = useMutation({
    mutationFn: (variables: { id: string; payload: any }) => assetRepository.assignAsset(variables.id, variables.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset assigned successfully.");
      setIsAssignOpen(false);
      setTargetAsset(null);
      resetAssignForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to assign asset.");
    }
  });

  const returnMutation = useMutation({
    mutationFn: (variables: { id: string; payload: any }) => assetRepository.returnAsset(variables.id, variables.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset returned to inventory.");
      setIsReturnOpen(false);
      setTargetAsset(null);
      setReturnNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to return asset.");
    }
  });

  const transferMutation = useMutation({
    mutationFn: (variables: { id: string; payload: any }) => assetRepository.transferAsset(variables.id, variables.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset transferred successfully.");
      setIsTransferOpen(false);
      setTargetAsset(null);
      resetTransferForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to transfer asset.");
    }
  });

  const changeLifecycleMutation = useMutation({
    mutationFn: (variables: { id: string; payload: any }) => assetRepository.changeAssetLifecycle(variables.id, variables.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset lifecycle stage changed.");
      setIsLifecycleOpen(false);
      setTargetAsset(null);
      setLifecycleNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to change lifecycle stage.");
    }
  });

  // Procurement Mutations
  const createProcMutation = useMutation({
    mutationFn: (variables: any) => assetRepository.createProcurement(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurements"] });
      toast.success("Procurement request created.");
      setIsCreateProcOpen(false);
      resetProcForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create procurement.");
    }
  });

  const updateProcMutation = useMutation({
    mutationFn: (variables: { id: string; data: any }) => assetRepository.updateProcurement(variables.id, variables.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurements"] });
      toast.success("Procurement updated successfully.");
      setIsEditProcOpen(false);
      setEditingProc(null);
      resetProcForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update procurement.");
    }
  });

  const deleteProcMutation = useMutation({
    mutationFn: (id: string) => assetRepository.deleteProcurement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurements"] });
      toast.success("Procurement request deleted.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete procurement.");
    }
  });

  const registerAssetsMutation = useMutation({
    mutationFn: (variables: { id: string; payload: any }) => assetRepository.registerProcurementAssets(variables.id, variables.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurements"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Batch assets registered successfully.");
      setIsRegisterOpen(false);
      setRegisteringProc(null);
      setBatchAssets([]);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to register batch assets.");
    }
  });

  // ==========================================
  // FORM RESET & LOAD HELPERS
  // ==========================================
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

  const resetAssignForm = () => {
    setAssigneeType("USER");
    setAssigneeUserId("");
    setAssigneeDeptId("");
    setAssigneeLoc("");
    setAssignmentNotes("");
  };

  const resetTransferForm = () => {
    setTransferType("USER");
    setTransferUserId("");
    setTransferDeptId("");
    setTransferLoc("");
    setTransferBuilding("");
    setTransferFloor("");
    setTransferRoom("");
    setTransferNotes("");
  };

  const resetProcForm = () => {
    setProcPONumber("");
    setProcInvoiceNumber("");
    setProcDate("");
    setProcCost("");
    setProcVendorRef("");
    setProcStatusField(ProcurementStatus.REQUESTED);
    setProcAssetName("");
    setProcModel("");
    setProcManufacturer("");
    setProcCategoryId("");
    setProcDeptId("");
    setProcQuantity("1");
  };

  const loadProcForm = (proc: any) => {
    setProcPONumber(proc.purchaseOrderNumber || "");
    setProcInvoiceNumber(proc.invoiceNumber || "");
    setProcDate(proc.purchaseDate ? new Date(proc.purchaseDate).toISOString().split("T")[0]! : "");
    setProcCost(String(proc.purchaseCost));
    setProcVendorRef(proc.vendorReference || "");
    setProcStatusField(proc.status);
    setProcAssetName(proc.assetName);
    setProcModel(proc.model);
    setProcManufacturer(proc.manufacturer || "");
    setProcCategoryId(proc.categoryId || "");
    setProcDeptId(proc.departmentId);
    setProcQuantity(String(proc.quantity));
  };

  // Renders asset forms inside Register dialog based on count
  const initializeBatchFields = (count: number) => {
    const assets = [];
    for (let i = 0; i < count; i++) {
      assets.push({
        serialNumber: "",
        tag: "",
        location: registeringProc?.department?.name || "Central Storage",
        building: "",
        floor: "",
        room: ""
      });
    }
    setBatchAssets(assets);
  };

  // ==========================================
  // HANDLERS
  // ==========================================
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

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAsset) return;
    if (assigneeType === "USER" && !assigneeUserId) {
      toast.error("Please select a user.");
      return;
    }
    if (assigneeType === "DEPARTMENT" && !assigneeDeptId) {
      toast.error("Please select a department.");
      return;
    }
    if (assigneeType === "LOCATION" && !assigneeLoc.trim()) {
      toast.error("Please fill in location label.");
      return;
    }

    assignMutation.mutate({
      id: targetAsset.id,
      payload: {
        assigneeType,
        userId: assigneeType === "USER" ? assigneeUserId : undefined,
        departmentId: assigneeType === "DEPARTMENT" ? assigneeDeptId : undefined,
        location: assigneeType === "LOCATION" ? assigneeLoc : undefined,
        notes: assignmentNotes,
        clientUpdatedAt: targetAsset.updatedAt,
      }
    });
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAsset) return;
    returnMutation.mutate({
      id: targetAsset.id,
      payload: {
        notes: returnNotes,
        clientUpdatedAt: targetAsset.updatedAt,
      }
    });
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAsset) return;
    if (transferType === "USER" && !transferUserId) {
      toast.error("Please select a target user.");
      return;
    }
    if (transferType === "DEPARTMENT" && !transferDeptId) {
      toast.error("Please select a target department.");
      return;
    }
    if (transferType === "LOCATION" && !transferLoc.trim()) {
      toast.error("Please input location label.");
      return;
    }

    transferMutation.mutate({
      id: targetAsset.id,
      payload: {
        transferType,
        userId: transferType === "USER" ? transferUserId : undefined,
        departmentId: transferType === "DEPARTMENT" ? transferDeptId : undefined,
        location: transferLoc,
        building: transferType === "LOCATION" ? transferBuilding : undefined,
        floor: transferType === "LOCATION" ? transferFloor : undefined,
        room: transferType === "LOCATION" ? transferRoom : undefined,
        notes: transferNotes,
        clientUpdatedAt: targetAsset.updatedAt
      }
    });
  };

  const handleLifecycleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAsset) return;
    changeLifecycleMutation.mutate({
      id: targetAsset.id,
      payload: {
        lifecycleStage: targetStage,
        notes: lifecycleNotes,
        clientUpdatedAt: targetAsset.updatedAt
      }
    });
  };

  const handleCreateProc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!procAssetName.trim() || !procModel.trim() || !procDeptId || !procCost || !procQuantity) {
      toast.error("Please fill in all required fields.");
      return;
    }
    createProcMutation.mutate({
      assetName: procAssetName,
      model: procModel,
      manufacturer: procManufacturer || undefined,
      categoryId: procCategoryId || undefined,
      departmentId: procDeptId,
      quantity: parseInt(procQuantity, 10),
      purchaseCost: parseFloat(procCost),
      purchaseOrderNumber: procPONumber || undefined,
      invoiceNumber: procInvoiceNumber || undefined,
      purchaseDate: procDate ? new Date(procDate) : undefined,
      vendorReference: procVendorRef || undefined,
      status: procStatusField
    });
  };

  const handleEditProcSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProc) return;
    updateProcMutation.mutate({
      id: editingProc.id,
      data: {
        assetName: procAssetName,
        model: procModel,
        manufacturer: procManufacturer || undefined,
        categoryId: procCategoryId || undefined,
        departmentId: procDeptId,
        quantity: parseInt(procQuantity, 10),
        purchaseCost: parseFloat(procCost),
        purchaseOrderNumber: procPONumber || undefined,
        invoiceNumber: procInvoiceNumber || undefined,
        purchaseDate: procDate ? new Date(procDate) : undefined,
        vendorReference: procVendorRef || undefined,
        status: procStatusField
      }
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringProc) return;
    
    // Validate locations
    for (let i = 0; i < batchAssets.length; i++) {
      if (!batchAssets[i]?.location?.trim()) {
        toast.error(`Please specify a location for Asset #${i+1}`);
        return;
      }
    }

    registerAssetsMutation.mutate({
      id: registeringProc.id,
      payload: {
        assets: batchAssets
      }
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

  const getProcStatusColor = (status: ProcurementStatus) => {
    switch (status) {
      case ProcurementStatus.REGISTERED:
        return "success";
      case ProcurementStatus.RECEIVED:
        return "warning";
      case ProcurementStatus.ORDERED:
        return "primary";
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
      cell: ({ row }) => {
        const isAssigned = row.original.lifecycleStage === LifecycleStage.ASSIGNED || row.original.lifecycleStage === LifecycleStage.IN_USE;
        const isTerminal = row.original.lifecycleStage === LifecycleStage.RETIRED || row.original.lifecycleStage === LifecycleStage.DISPOSED;
        
        return (
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none">
                  <MoreVertical className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Lifecycle Actions</DropdownMenuLabel>
                
                {!isAssigned && !isTerminal && (
                  <DropdownMenuItem
                    onClick={() => {
                      setTargetAsset(row.original);
                      resetAssignForm();
                      setIsAssignOpen(true);
                    }}
                  >
                    <CheckSquare className="size-3.5 mr-2 text-success" />
                    Assign Asset
                  </DropdownMenuItem>
                )}
                
                {isAssigned && (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        setTargetAsset(row.original);
                        setReturnNotes("");
                        setIsReturnOpen(true);
                      }}
                    >
                      <Undo className="size-3.5 mr-2 text-warning" />
                      Return Asset
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setTargetAsset(row.original);
                        resetTransferForm();
                        setIsTransferOpen(true);
                      }}
                    >
                      <ArrowLeftRight className="size-3.5 mr-2 text-primary" />
                      Transfer Asset
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                
                <DropdownMenuItem
                  disabled={isTerminal}
                  onClick={() => {
                    setTargetAsset(row.original);
                    setTargetStage(row.original.lifecycleStage);
                    setLifecycleNotes("");
                    setIsLifecycleOpen(true);
                  }}
                >
                  <Clipboard className="size-3.5 mr-2 text-muted-foreground" />
                  Transition lifecycle
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    if (confirm("Are you sure you want to soft delete this asset?")) {
                      deleteMutation.mutate(row.original.id);
                    }
                  }}
                  className="text-destructive focus:bg-destructive/10"
                >
                  <Trash className="size-3.5 mr-2" />
                  Soft Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Procurement table columns
  const procColumns: ColumnDef<any>[] = [
    {
      accessorKey: "requestNumber",
      header: "PR Number",
      cell: ({ row }) => <span className="font-mono font-bold text-xs text-foreground">{row.getValue("requestNumber")}</span>
    },
    {
      accessorKey: "assetName",
      header: "Procurement Items",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-bold text-foreground">{row.getValue("assetName")}</p>
          <p className="text-[9px] text-muted-foreground truncate">{row.original.model} • {row.original.manufacturer || "Generic"}</p>
        </div>
      )
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => (
        <span className="text-xs font-bold text-foreground">
          {row.original.registeredCount} / {row.original.quantity}
        </span>
      )
    },
    {
      accessorKey: "purchaseCost",
      header: "Cost Budget",
      cell: ({ row }) => <span className="text-xs font-semibold text-foreground">${parseFloat(row.original.purchaseCost).toFixed(2)}</span>
    },
    {
      accessorKey: "status",
      header: "Workflow Status",
      cell: ({ row }) => {
        const val = row.getValue("status") as ProcurementStatus;
        return <Tag variant={getProcStatusColor(val)}>{val}</Tag>;
      }
    },
    {
      accessorKey: "vendorReference",
      header: "Vendor/Ref",
      cell: ({ row }) => <span className="text-[10px] font-semibold text-muted-foreground">{row.original.vendorReference || "N/A"}</span>
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const status = row.original.status as ProcurementStatus;
        const remaining = row.original.quantity - row.original.registeredCount;

        return (
          <div className="flex justify-end gap-1.5">
            <button
              onClick={() => {
                setEditingProc(row.original);
                loadProcForm(row.original);
                setIsEditProcOpen(true);
              }}
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
              title="Edit details"
            >
              <Pencil className="size-3.5" />
            </button>

            {remaining > 0 && (status === ProcurementStatus.ORDERED || status === ProcurementStatus.RECEIVED) && (
              <button
                onClick={() => {
                  setRegisteringProc(row.original);
                  setRegisterBatchCount(remaining);
                  initializeBatchFields(remaining);
                  setIsRegisterOpen(true);
                }}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-primary/20 text-primary hover:bg-primary/5 text-[10px] font-bold cursor-pointer focus:outline-none"
              >
                <Plus className="size-3" />
                Register
              </button>
            )}

            {row.original.registeredCount === 0 && (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this procurement request?")) {
                    deleteProcMutation.mutate(row.original.id);
                  }
                }}
                className="p-1 hover:bg-destructive/5 rounded text-muted-foreground hover:text-destructive cursor-pointer focus:outline-none"
                title="Delete"
              >
                <Trash className="size-3.5" />
              </button>
            )}
          </div>
        );
      }
    }
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
        { value: LifecycleStage.AVAILABLE, label: "Available" },
        { value: LifecycleStage.ASSIGNED, label: "Assigned" },
        { value: LifecycleStage.IN_USE, label: "In Use" },
        { value: LifecycleStage.MAINTENANCE, label: "Maintenance" },
        { value: LifecycleStage.RESERVED, label: "Reserved" },
        { value: LifecycleStage.RETURNED, label: "Returned" },
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

  const handlePageTabChange = (val: string) => {
    setActiveTab(val);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Underline Tabs Selector */}
        <Tabs value={activeTab} onValueChange={handlePageTabChange}>
          <TabsList className="mb-1">
            <TabsTrigger value="assets">Asset Registry</TabsTrigger>
            <TabsTrigger value="procurements">Procurement Workflow</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assets">
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
          </TabsContent>

          <TabsContent value="procurements">
            <EntityListTemplate
              title="Procurement Workflow"
              description="Manage hardware request flows, purchase order bounds, and batch register goods received."
              columns={procColumns}
              data={procResponse?.data || []}
              loading={isProcLoading}
              error={procError ? (procError as Error).message : null}
              searchQuery={procSearch}
              onSearchChange={setProcSearch}
              filterOptions={[
                {
                  key: "status",
                  label: "Workflow Status",
                  options: [
                    { value: ProcurementStatus.REQUESTED, label: "Requested" },
                    { value: ProcurementStatus.ORDERED, label: "Ordered" },
                    { value: ProcurementStatus.RECEIVED, label: "Received" },
                    { value: ProcurementStatus.REGISTERED, label: "Registered" },
                  ]
                }
              ]}
              activeFilters={{ status: procStatus }}
              onFilterChange={(k, v) => {
                setProcStatus(v);
                setProcPage(1);
              }}
              onClearFilters={() => {
                setProcSearch("");
                setProcStatus("");
                setProcPage(1);
              }}
              actions={[
                {
                  label: "Create Request",
                  onClick: () => {
                    resetProcForm();
                    setIsCreateProcOpen(true);
                  },
                  icon: Plus,
                },
              ]}
              pageIndex={procPage}
              pageCount={procResponse?.pageCount || 1}
              onPageChange={setProcPage}
              onRetry={refetchProc}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* ==========================================
          DIALOGS FOR MASTER REGISTRY
          ========================================== */}
      
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
                <SelectItem value={LifecycleStage.AVAILABLE}>Available</SelectItem>
                <SelectItem value={LifecycleStage.ASSIGNED}>Assigned</SelectItem>
                <SelectItem value={LifecycleStage.IN_USE}>In Use</SelectItem>
                <SelectItem value={LifecycleStage.MAINTENANCE}>Maintenance</SelectItem>
                <SelectItem value={LifecycleStage.RESERVED}>Reserved</SelectItem>
                <SelectItem value={LifecycleStage.RETURNED}>Returned</SelectItem>
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

      {/* ==========================================
          PHASE 2 ASSIGNMENT & LIFECYCLE DIALOGS
          ========================================== */}

      {/* ASSIGN ASSET DIALOG */}
      <CRUDDialogTemplate
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Assign Asset"
        description={`Allocate "${targetAsset?.name || ""}" to institutional entities.`}
        onSubmit={handleAssignSubmit}
        submitLabel="Assign Asset"
        isSubmitting={assignMutation.isPending}
      >
        <div className="space-y-3.5 px-1 py-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Assignee Type</label>
            <Select value={assigneeType} onValueChange={(v: any) => setAssigneeType(v)}>
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Student / Faculty / Staff Member</SelectItem>
                <SelectItem value="DEPARTMENT">Department Scope</SelectItem>
                <SelectItem value="LOCATION">Room / Laboratory</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {assigneeType === "USER" && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Select Institutional User *</label>
              <Select value={assigneeUserId} onValueChange={setAssigneeUserId}>
                <SelectTrigger className="text-xs h-9 bg-card"><SelectValue placeholder="Select Assignee User" /></SelectTrigger>
                <SelectContent>
                  {usersList.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {assigneeType === "DEPARTMENT" && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Select Institutional Department *</label>
              <Select value={assigneeDeptId} onValueChange={setAssigneeDeptId}>
                <SelectTrigger className="text-xs h-9 bg-card"><SelectValue placeholder="Select Assignee Department" /></SelectTrigger>
                <SelectContent>
                  {departmentsList.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {assigneeType === "LOCATION" && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Specify Laboratory / Room *</label>
              <Input
                value={assigneeLoc}
                onChange={(e) => setAssigneeLoc(e.target.value)}
                placeholder="e.g. Room 304, CS Laboratory"
                className="text-xs h-9 bg-card"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Allocation / Return notes</label>
            <Textarea
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              placeholder="Input details on usage guidelines or setup requirements..."
              className="text-xs bg-card"
            />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* TRANSFER ASSET DIALOG */}
      <CRUDDialogTemplate
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Transfer Asset"
        description={`Relocate "${targetAsset?.name || ""}" to another entity or department.`}
        onSubmit={handleTransferSubmit}
        submitLabel="Execute Transfer"
        isSubmitting={transferMutation.isPending}
      >
        <div className="space-y-3.5 max-h-[70vh] overflow-y-auto px-1 py-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Transfer Destination Type</label>
            <Select value={transferType} onValueChange={(v: any) => setTransferType(v)}>
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Re-allocate to another User</SelectItem>
                <SelectItem value="DEPARTMENT">Re-allocate to another Department</SelectItem>
                <SelectItem value="LOCATION">Re-locate to new Room / Laboratory</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {transferType === "USER" && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Select Destination User *</label>
              <Select value={transferUserId} onValueChange={setTransferUserId}>
                <SelectTrigger className="text-xs h-9 bg-card"><SelectValue placeholder="Select Destination User" /></SelectTrigger>
                <SelectContent>
                  {usersList.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {transferType === "DEPARTMENT" && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Select Destination Department *</label>
              <Select value={transferDeptId} onValueChange={setTransferDeptId}>
                <SelectTrigger className="text-xs h-9 bg-card"><SelectValue placeholder="Select Destination Department" /></SelectTrigger>
                <SelectContent>
                  {departmentsList.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {transferType === "LOCATION" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Location Text Description *</label>
                <Input value={transferLoc} onChange={(e) => setTransferLoc(e.target.value)} placeholder="e.g. Mechanical Lab, Floor 1" className="text-xs h-9 bg-card" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Building</label>
                  <Input value={transferBuilding} onChange={(e) => setTransferBuilding(e.target.value)} placeholder="Building A" className="text-xs h-9 bg-card" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Floor</label>
                  <Input value={transferFloor} onChange={(e) => setTransferFloor(e.target.value)} placeholder="1st Floor" className="text-xs h-9 bg-card" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Room</label>
                  <Input value={transferRoom} onChange={(e) => setTransferRoom(e.target.value)} placeholder="104" className="text-xs h-9 bg-card" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Transfer Reason / logs</label>
            <Textarea
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              placeholder="Reason for transferring the asset..."
              className="text-xs bg-card"
            />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* RETURN ASSET DIALOG */}
      <CRUDDialogTemplate
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        title="Return Asset"
        description={`De-allocate "${targetAsset?.name || ""}" and return it to availability storage.`}
        onSubmit={handleReturnSubmit}
        submitLabel="De-allocate & Return"
        isSubmitting={returnMutation.isPending}
      >
        <div className="space-y-3 px-1 py-1">
          <p className="text-xs text-muted-foreground">This will close the active assignment record and update the asset stage back to Available.</p>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Return status / logs</label>
            <Textarea
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="Enter notes on device condition, return state..."
              className="text-xs bg-card"
            />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* TRANSITION LIFECYCLE DIALOG */}
      <CRUDDialogTemplate
        isOpen={isLifecycleOpen}
        onClose={() => setIsLifecycleOpen(false)}
        title="Transition Lifecycle Stage"
        description={`Manually update the lifecycle stage for "${targetAsset?.name || ""}".`}
        onSubmit={handleLifecycleSubmit}
        submitLabel="Transition Stage"
        isSubmitting={changeLifecycleMutation.isPending}
      >
        <div className="space-y-3.5 px-1 py-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Select Target Lifecycle Stage</label>
            <Select value={targetStage} onValueChange={(v: any) => setTargetStage(v)}>
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={LifecycleStage.PROCURED}>Procured</SelectItem>
                <SelectItem value={LifecycleStage.AVAILABLE}>Available</SelectItem>
                <SelectItem value={LifecycleStage.ASSIGNED}>Assigned</SelectItem>
                <SelectItem value={LifecycleStage.IN_USE}>In Use</SelectItem>
                <SelectItem value={LifecycleStage.MAINTENANCE}>Maintenance (Placeholder)</SelectItem>
                <SelectItem value={LifecycleStage.RESERVED}>Reserved</SelectItem>
                <SelectItem value={LifecycleStage.RETURNED}>Returned</SelectItem>
                <SelectItem value={LifecycleStage.RETIRED}>Retired</SelectItem>
                <SelectItem value={LifecycleStage.DISPOSED}>Disposed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Lifecycle changes log notes</label>
            <Textarea
              value={lifecycleNotes}
              onChange={(e) => setLifecycleNotes(e.target.value)}
              placeholder="Notes on why stage is changing..."
              className="text-xs bg-card"
            />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* ==========================================
          DIALOGS FOR PROCUREMENT WORKFLOW
          ========================================== */}

      {/* CREATE PROCUREMENT DIALOG */}
      <CRUDDialogTemplate
        isOpen={isCreateProcOpen}
        onClose={() => setIsCreateProcOpen(false)}
        title="Initiate Procurement Flow"
        description="Raise a new purchase request for hardware supplies."
        onSubmit={handleCreateProc}
        submitLabel="Raise Request"
        isSubmitting={createProcMutation.isPending}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto px-1 py-1">
          <div className="space-y-1 col-span-1 md:col-span-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Item / Asset Name *</label>
            <Input value={procAssetName} onChange={(e) => setProcAssetName(e.target.value)} placeholder="e.g. Dell Latitude Workstation" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Model Specs *</label>
            <Input value={procModel} onChange={(e) => setProcModel(e.target.value)} placeholder="e.g. Latitude 5440" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Manufacturer</label>
            <Input value={procManufacturer} onChange={(e) => setProcManufacturer(e.target.value)} placeholder="e.g. Dell" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Total Quantity Required *</label>
            <Input value={procQuantity} onChange={(e) => setProcQuantity(e.target.value)} type="number" min="1" placeholder="10" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Budget / Cost Cost *</label>
            <Input value={procCost} onChange={(e) => setProcCost(e.target.value)} type="number" placeholder="2400.00" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Allocating Department *</label>
            <Select value={procDeptId} onValueChange={setProcDeptId}>
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
            <Select value={procCategoryId} onValueChange={setProcCategoryId}>
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue placeholder="Select Category" /></SelectTrigger>
              <SelectContent>
                {categoriesList.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t border-border col-span-1 md:col-span-2 my-1" />
          <h4 className="text-xs font-bold text-primary col-span-1 md:col-span-2 flex items-center gap-1.5"><Calendar className="size-3.5" /> Order Bounds Details</h4>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">PO Number</label>
            <Input value={procPONumber} onChange={(e) => setProcPONumber(e.target.value)} placeholder="e.g. PO-2026-908" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Invoice Number</label>
            <Input value={procInvoiceNumber} onChange={(e) => setProcInvoiceNumber(e.target.value)} placeholder="e.g. INV-98234" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Purchase Date</label>
            <Input value={procDate} onChange={(e) => setProcDate(e.target.value)} type="date" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Vendor / Supplier reference</label>
            <Input value={procVendorRef} onChange={(e) => setProcVendorRef(e.target.value)} placeholder="e.g. Dell Sales Division" className="text-xs h-9 bg-card" />
          </div>

          <div className="space-y-1 col-span-1 md:col-span-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Flow Status</label>
            <Select value={procStatusField} onValueChange={(v: any) => setProcStatusField(v)}>
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ProcurementStatus.REQUESTED}>Requested (Purchase Request)</SelectItem>
                <SelectItem value={ProcurementStatus.ORDERED}>Ordered (Purchase Order Issued)</SelectItem>
                <SelectItem value={ProcurementStatus.RECEIVED}>Received (Goods Arrived)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* EDIT PROCUREMENT DIALOG */}
      <CRUDDialogTemplate
        isOpen={isEditProcOpen}
        onClose={() => {
          setIsEditProcOpen(false);
          setEditingProc(null);
        }}
        title="Update Procurement Flow"
        description="Amend purchase order descriptions, quantities, invoice parameters, or workflow stage."
        onSubmit={handleEditProcSubmit}
        submitLabel="Save Changes"
        isSubmitting={updateProcMutation.isPending}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto px-1 py-1">
          <div className="space-y-1 col-span-1 md:col-span-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Item / Asset Name *</label>
            <Input value={procAssetName} onChange={(e) => setProcAssetName(e.target.value)} placeholder="e.g. Dell Latitude Workstation" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Model Specs *</label>
            <Input value={procModel} onChange={(e) => setProcModel(e.target.value)} placeholder="e.g. Latitude 5440" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Manufacturer</label>
            <Input value={procManufacturer} onChange={(e) => setProcManufacturer(e.target.value)} placeholder="e.g. Dell" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Total Quantity Required *</label>
            <Input value={procQuantity} onChange={(e) => setProcQuantity(e.target.value)} type="number" min="1" placeholder="10" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Budget / Cost *</label>
            <Input value={procCost} onChange={(e) => setProcCost(e.target.value)} type="number" placeholder="2400.00" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Allocating Department *</label>
            <Select value={procDeptId} onValueChange={setProcDeptId}>
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
            <Select value={procCategoryId} onValueChange={setProcCategoryId}>
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue placeholder="Select Category" /></SelectTrigger>
              <SelectContent>
                {categoriesList.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t border-border col-span-1 md:col-span-2 my-1" />
          <h4 className="text-xs font-bold text-primary col-span-1 md:col-span-2 flex items-center gap-1.5"><Calendar className="size-3.5" /> Order Bounds Details</h4>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">PO Number</label>
            <Input value={procPONumber} onChange={(e) => setProcPONumber(e.target.value)} placeholder="e.g. PO-2026-908" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Invoice Number</label>
            <Input value={procInvoiceNumber} onChange={(e) => setProcInvoiceNumber(e.target.value)} placeholder="e.g. INV-98234" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Purchase Date</label>
            <Input value={procDate} onChange={(e) => setProcDate(e.target.value)} type="date" className="text-xs h-9 bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Vendor / Supplier reference</label>
            <Input value={procVendorRef} onChange={(e) => setProcVendorRef(e.target.value)} placeholder="e.g. Dell Sales Division" className="text-xs h-9 bg-card" />
          </div>

          <div className="space-y-1 col-span-1 md:col-span-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Flow Status</label>
            <Select value={procStatusField} onValueChange={(v: any) => setProcStatusField(v)}>
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ProcurementStatus.REQUESTED}>Requested (Purchase Request)</SelectItem>
                <SelectItem value={ProcurementStatus.ORDERED}>Ordered (Purchase Order Issued)</SelectItem>
                <SelectItem value={ProcurementStatus.RECEIVED}>Received (Goods Arrived)</SelectItem>
                <SelectItem value={ProcurementStatus.REGISTERED}>Registered (Assets Generated)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* REGISTER ASSETS DIALOG (BATCH & PARTIAL SUPPORT) */}
      <CRUDDialogTemplate
        isOpen={isRegisterOpen}
        onClose={() => {
          setIsRegisterOpen(false);
          setRegisteringProc(null);
          setBatchAssets([]);
        }}
        title="Batch Register Assets"
        description={`Generate assets for completed procurement order "${registeringProc?.requestNumber || ""}".`}
        onSubmit={handleRegisterSubmit}
        submitLabel="Register Batch"
        isSubmitting={registerAssetsMutation.isPending}
      >
        <div className="space-y-3.5 px-1 py-1 max-h-[70vh] overflow-y-auto">
          <div className="bg-surface-subtle p-3 rounded-sm border border-border flex justify-between items-center text-xs font-semibold text-muted-foreground">
            <span>Total Quantity: {registeringProc?.quantity}</span>
            <span>Registered: {registeringProc?.registeredCount}</span>
            <span className="text-primary font-bold">Remaining: {registeringProc?.quantity - registeringProc?.registeredCount}</span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Select Batch Size to Register Now</label>
            <Select
              value={String(registerBatchCount)}
              onValueChange={(v) => {
                const num = parseInt(v, 10);
                setRegisterBatchCount(num);
                initializeBatchFields(num);
              }}
            >
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: (registeringProc?.quantity || 0) - (registeringProc?.registeredCount || 0) }, (_, i) => i + 1).map((val) => (
                  <SelectItem key={val} value={String(val)}>{val} asset{val > 1 ? "s" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {batchAssets.map((asset, index) => (
            <div key={index} className="border border-border rounded-sm p-3.5 space-y-2 bg-card/40">
              <h5 className="text-[10px] font-black uppercase text-primary tracking-wider">Asset Item #{index + 1}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Serial Number</label>
                  <Input
                    value={asset.serialNumber}
                    onChange={(e) => {
                      const updated = [...batchAssets];
                      updated[index]!.serialNumber = e.target.value;
                      setBatchAssets(updated);
                    }}
                    placeholder="e.g. SN-82937A"
                    className="text-xs h-8 bg-card"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Asset Tag (leave empty to auto-generate)</label>
                  <Input
                    value={asset.tag}
                    onChange={(e) => {
                      const updated = [...batchAssets];
                      updated[index]!.tag = e.target.value;
                      setBatchAssets(updated);
                    }}
                    placeholder="e.g. CC-LAP-0012"
                    className="text-xs h-8 bg-card"
                  />
                </div>
                <div className="space-y-1 col-span-1 md:col-span-2">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Storage / Room Location *</label>
                  <Input
                    value={asset.location}
                    onChange={(e) => {
                      const updated = [...batchAssets];
                      updated[index]!.location = e.target.value;
                      setBatchAssets(updated);
                    }}
                    placeholder="e.g. IT Department Depot, Room 3"
                    className="text-xs h-8 bg-card"
                  />
                </div>
                <div className="grid grid-cols-3 gap-1 col-span-1 md:col-span-2">
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-bold text-muted-foreground uppercase">Building</label>
                    <Input
                      value={asset.building}
                      onChange={(e) => {
                        const updated = [...batchAssets];
                        updated[index]!.building = e.target.value;
                        setBatchAssets(updated);
                      }}
                      placeholder="Building B"
                      className="text-xs h-8 bg-card"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-bold text-muted-foreground uppercase">Floor</label>
                    <Input
                      value={asset.floor}
                      onChange={(e) => {
                        const updated = [...batchAssets];
                        updated[index]!.floor = e.target.value;
                        setBatchAssets(updated);
                      }}
                      placeholder="Floor 2"
                      className="text-xs h-8 bg-card"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-bold text-muted-foreground uppercase">Room</label>
                    <Input
                      value={asset.room}
                      onChange={(e) => {
                        const updated = [...batchAssets];
                        updated[index]!.room = e.target.value;
                        setBatchAssets(updated);
                      }}
                      placeholder="Room 12"
                      className="text-xs h-8 bg-card"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CRUDDialogTemplate>
    </>
  );
}
export default AssetsPage;
