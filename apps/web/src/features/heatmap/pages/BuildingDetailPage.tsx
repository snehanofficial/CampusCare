import React from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building,
  Layers,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  Wrench,
  CheckCircle,
  Activity,
  Package,
  Info
} from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader.js";
import { StatCard } from "../../../components/common/StatCard.js";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card.js";
import { Button } from "../../../components/ui/button.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table.js";
import { heatmapRepository } from "../../../lib/repositories/heatmap.repository.js";

export function BuildingDetailPage() {
  const { buildingName } = useParams();
  const navigate = useNavigate();

  const { data: heatmapData, isLoading } = useQuery({
    queryKey: ["campusHeatmap"],
    queryFn: () => heatmapRepository.getHeatmap()
  });

  const building = heatmapData?.buildings?.find(
    (b: any) => b.name.toLowerCase() === decodeURIComponent(buildingName || "").toLowerCase()
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-sm text-muted-foreground animate-pulse">Loading location coordinates...</span>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/heatmap")} className="h-8 text-xs gap-1 cursor-pointer">
          <ArrowLeft className="size-3.5" />
          <span>Back to Heatmap</span>
        </Button>
        <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg bg-card/25 p-4 text-center">
          <Building className="size-10 text-muted-foreground mb-2" />
          <h3 className="font-semibold text-sm">Building Not Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            This building could not be located in the current campus hierarchy, or it has zero registered assets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back navigation */}
      <Button variant="ghost" onClick={() => navigate("/heatmap")} className="h-8 text-xs gap-1 cursor-pointer">
        <ArrowLeft className="size-3.5" />
        <span>Back to Heatmap</span>
      </Button>

      {/* Header */}
      <PageHeader
        title={`${building.name} - Location Detail`}
        description={`Detailed operational intelligence for assets positioned in ${building.name}.`}
      />

      {/* Building Scorecard */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Building Average Health"
          value={`${building.averageHealth}%`}
          icon={Activity}
        />
        <StatCard
          title="Total Assets"
          value={building.assetCount}
          icon={Layers}
        />
        <StatCard
          title="Under Maintenance"
          value={building.maintenanceCount}
          icon={Wrench}
        />
        <StatCard
          title="Critical Alerts"
          value={building.criticalCount}
          icon={ShieldAlert}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Floor List */}
        <Card className="lg:col-span-2 border border-border bg-card">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <span>Campus Floors Scoreboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-[10px] font-semibold tracking-wider h-8">Floor Level</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wider h-8 text-center">Total Assets</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wider h-8 text-center">In Repair</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wider h-8 text-center">Critical</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wider h-8 text-right">Avg Health</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wider h-8 w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {building.floors && Object.keys(building.floors).length > 0 ? (
                  Object.values(building.floors).map((floor: any) => (
                    <TableRow key={floor.name} className="hover:bg-muted/10 h-10">
                      <TableCell className="text-xs font-semibold py-1.5">{floor.name || "Unassigned Floor"}</TableCell>
                      <TableCell className="text-xs text-center py-1.5">{floor.assetCount}</TableCell>
                      <TableCell className="text-xs text-center py-1.5">{floor.maintenanceCount}</TableCell>
                      <TableCell className="text-xs text-center py-1.5">
                        <span className={floor.criticalCount > 0 ? "text-red-500 font-bold" : ""}>
                          {floor.criticalCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-right py-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          floor.averageHealth >= 75 ? "bg-emerald-500/10 text-emerald-500" :
                          floor.averageHealth >= 50 ? "bg-blue-500/10 text-blue-500" :
                          floor.averageHealth >= 25 ? "bg-amber-500/10 text-amber-500" :
                          "bg-red-500/10 text-red-500"
                        }`}>
                          {floor.averageHealth}%
                        </span>
                      </TableCell>
                      <TableCell className="py-1.5 text-right">
                        <Button
                          onClick={() => navigate(`/heatmap/building/${encodeURIComponent(building.name)}/floor/${encodeURIComponent(floor.name)}`)}
                          size="xs"
                          variant="ghost"
                          className="h-6 w-6 p-0 cursor-pointer"
                        >
                          <ChevronRight className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-xs text-center text-muted-foreground py-4">No floor coordinates found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Hotspots Card */}
        <Card className="border border-border bg-card flex flex-col justify-between">
          <div>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-500">
                <Package className="size-4" />
                <span>Inventory Part Hotspots</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2 max-h-64 overflow-y-auto">
              {building.inventoryHotspots?.length > 0 ? (
                building.inventoryHotspots.map((item: any) => (
                  <div key={item.id} className="p-2 border border-amber-500/10 bg-amber-500/5 rounded-md flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground">{item.itemCode} • {item.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-500">{item.currentStock} {item.unit || "pcs"}</div>
                      <div className="text-[9px] text-muted-foreground">Min: {item.reorderLevel}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-36 flex-col items-center justify-center text-center text-muted-foreground text-xs">
                  <CheckCircle className="size-8 text-emerald-500 mb-1" />
                  <span>No low stock spare parts at this location.</span>
                </div>
              )}
            </CardContent>
          </div>
          <div className="p-3 border-t border-border bg-muted/10 text-[10px] text-muted-foreground flex items-center gap-1">
            <Info className="size-3 text-blue-500 shrink-0" />
            <span>Spare parts stock levels in this building are tracked in real-time.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
export default BuildingDetailPage;
