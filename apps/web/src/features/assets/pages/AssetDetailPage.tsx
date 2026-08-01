import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Calendar, DollarSign, MapPin, User, Tag as TagIcon, Server, Shield, FileText, Clipboard, Clock, Heart } from "lucide-react";
import { assetRepository } from "@/lib/repositories/asset.repository.js";
import { Tag } from "@/components/ui/tag.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.js";
import { PageSkeleton } from "@/components/feedback/PageSkeleton.js";
import { formatDate, formatBytes } from "@campuscare/shared-utils";
import { AssetStatus, LifecycleStage, HealthStatus } from "@campuscare/shared-types";

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "relations" | "documents" | "activity">("overview");

  const { data: asset, isLoading, error, refetch } = useQuery({
    queryKey: ["asset", id],
    queryFn: () => assetRepository.get(id!),
    enabled: !!id,
  });

  if (isLoading) return <PageSkeleton />;
  if (error || !asset) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-card border border-border rounded-sm">
        <h3 className="text-sm font-bold text-destructive">Failed to Load Asset</h3>
        <p className="text-xs text-muted-foreground mt-1">{(error as Error)?.message || "Asset not found."}</p>
        <button onClick={() => navigate("/assets")} className="mt-4 text-xs font-bold text-primary hover:underline cursor-pointer">
          Return to Registry
        </button>
      </div>
    );
  }

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

  const tabs = [
    { id: "overview", label: "Overview", icon: Server },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "relations", label: "Relations", icon: Heart },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "activity", label: "Activity", icon: Clipboard },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Back button and title */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => navigate("/assets")}
          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider select-none">Asset ID: {asset.assetCode}</span>
          <h2 className="text-sm font-bold text-foreground">{asset.name}</h2>
        </div>
      </div>

      {/* Grid of status badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Card className="rounded-sm border border-border bg-card">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
            <Tag variant={getStatusColor(asset.status)}>{asset.status}</Tag>
          </CardContent>
        </Card>
        <Card className="rounded-sm border border-border bg-card">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Lifecycle</span>
            <Tag variant={getLifecycleColor(asset.lifecycleStage)}>{asset.lifecycleStage}</Tag>
          </CardContent>
        </Card>
        <Card className="rounded-sm border border-border bg-card">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Health</span>
            <Tag variant={getHealthColor(asset.healthStatus)}>{asset.healthStatus}</Tag>
          </CardContent>
        </Card>
        <Card className="rounded-sm border border-border bg-card">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Tag</span>
            <span className="font-mono text-xs font-bold text-foreground">{asset.tag}</span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-border gap-1 overflow-x-auto select-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-semibold cursor-pointer focus:outline-none transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tabs Content */}
      <div className="mt-3">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-sm border border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-extrabold uppercase text-primary">Specifications</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold">Model / Brand</span>
                  <span className="text-foreground font-bold">{asset.model}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold">Manufacturer</span>
                  <span className="text-foreground font-bold">{asset.manufacturer || "Generic"}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold">Serial Number</span>
                  <span className="text-foreground font-mono font-bold">{asset.serialNumber || "SN-UNKNOWN"}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold">Asset Category</span>
                  <span className="text-foreground font-bold">{(asset as any).category?.name || "None"}</span>
                </div>
                <div className="flex justify-between text-xs pb-0">
                  <span className="text-muted-foreground font-semibold">Department Scope</span>
                  <span className="text-foreground font-bold">{(asset as any).department?.name || "Global"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-sm border border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-extrabold uppercase text-primary">Physical Location</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1"><MapPin className="size-3.5" /> Building</span>
                  <span className="text-foreground font-bold">{asset.building || "N/A"}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1"><Server className="size-3.5" /> Floor</span>
                  <span className="text-foreground font-bold">{asset.floor || "N/A"}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1"><TagIcon className="size-3.5" /> Room / Office</span>
                  <span className="text-foreground font-bold">{asset.room || "N/A"}</span>
                </div>
                <div className="flex justify-between text-xs pb-0">
                  <span className="text-muted-foreground font-semibold">Full Location Text</span>
                  <span className="text-foreground font-semibold max-w-[200px] truncate">{asset.location}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "timeline" && (
          <Card className="rounded-sm border border-border bg-card">
            <CardHeader className="p-4 pb-2 border-b border-border">
              <CardTitle className="text-xs font-extrabold uppercase text-primary">Audit Log History</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {(asset as any).history && (asset as any).history.length > 0 ? (
                <div className="relative border-l border-border pl-4 space-y-4">
                  {(asset as any).history.map((h: any, i: number) => (
                    <div key={h.id} className="relative">
                      <div className="absolute -left-[21px] mt-1 size-2 rounded-full bg-primary border-2 border-background" />
                      <div className="text-xs">
                        <span className="font-bold text-foreground mr-2">{h.actionType}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">{formatDate(h.createdAt)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{h.notes}</p>
                      <div className="text-[9px] text-muted-foreground flex items-center gap-1 mt-1 font-bold">
                        <User className="size-3" /> Performed By: {h.performedBy ? `${h.performedBy.firstName} ${h.performedBy.lastName}` : "System"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No history records logged for this asset.</p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "relations" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-sm border border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-extrabold uppercase text-primary">Linked Support Tickets</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {(asset as any).tickets && (asset as any).tickets.length > 0 ? (
                  <div className="space-y-3.5">
                    {(asset as any).tickets.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between border-b border-muted pb-2 last:border-b-0 last:pb-0">
                        <div>
                          <p className="text-xs font-bold text-foreground">{t.ticketNumber}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{t.title}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag variant="primary">{t.priority}</Tag>
                          <span className="text-[10px] font-bold text-muted-foreground">{t.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No open tickets linked to this asset tag.</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-sm border border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-extrabold uppercase text-primary">Active Maintenance Orders</CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col items-center justify-center h-32">
                <Shield className="size-6 text-muted-foreground/60 mb-1.5" />
                <p className="text-xs font-bold text-muted-foreground">Maintenance Operations</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Plugged in during Phase 4: Preventative maintenance</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-sm border border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-extrabold uppercase text-primary">Procurement Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold">Purchase PO Number</span>
                  <span className="text-foreground font-mono font-bold">{asset.purchaseOrderNumber || "PO-NONE"}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold flex items-center gap-0.5"><DollarSign className="size-3.5" /> Cost Price</span>
                  <span className="text-foreground font-bold">{asset.purchasePrice ? `$${asset.purchasePrice}` : "N/A"}</span>
                </div>
                <div className="flex justify-between text-xs pb-0">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1"><Calendar className="size-3.5" /> Purchase Date</span>
                  <span className="text-foreground font-bold">{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-sm border border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-extrabold uppercase text-primary">Warranty / AMC Contract</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold">Contract Number</span>
                  <span className="text-foreground font-mono font-bold">{asset.contractNumber || "CON-NONE"}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold">Warranty Start</span>
                  <span className="text-foreground font-bold">{asset.warrantyStart ? new Date(asset.warrantyStart).toLocaleDateString() : "N/A"}</span>
                </div>
                <div className="flex justify-between text-xs pb-0">
                  <span className="text-muted-foreground font-semibold">Warranty Expiry</span>
                  <span className="text-foreground font-bold">{asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : "N/A"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "activity" && (
          <Card className="rounded-sm border border-border bg-card">
            <CardHeader className="p-4 pb-2 border-b border-border">
              <CardTitle className="text-xs font-extrabold uppercase text-primary">Technician Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col items-center justify-center h-32">
              <FileText className="size-6 text-muted-foreground/60 mb-1.5" />
              <p className="text-xs font-bold text-muted-foreground font-sans">No recent technician activity notes.</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Technicians can add custom status comments here in a future release.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
export default AssetDetailPage;
