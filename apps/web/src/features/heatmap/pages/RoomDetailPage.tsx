import React from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Activity,
  Layers,
  Wrench,
  ShieldAlert,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader.js";
import { StatCard } from "../../../components/common/StatCard.js";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card.js";
import { Button } from "../../../components/ui/button.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table.js";
import { heatmapRepository } from "../../../lib/repositories/heatmap.repository.js";

export function RoomDetailPage() {
  const { buildingName, floorName, roomName } = useParams();
  const navigate = useNavigate();

  const { data: heatmapData, isLoading } = useQuery({
    queryKey: ["campusHeatmap"],
    queryFn: () => heatmapRepository.getHeatmap()
  });

  const building = heatmapData?.buildings?.find(
    (b: any) => b.name.toLowerCase() === decodeURIComponent(buildingName || "").toLowerCase()
  );
  
  const floor = building?.floors?.find(
    (f: any) => f.name.toLowerCase() === decodeURIComponent(floorName || "").toLowerCase()
  );

  const room = floor?.rooms?.find(
    (r: any) => r.name.toLowerCase() === decodeURIComponent(roomName || "").toLowerCase()
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-sm text-muted-foreground animate-pulse">Loading location coordinates...</span>
      </div>
    );
  }

  if (!building || !floor || !room) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/heatmap")} className="h-8 text-xs gap-1 cursor-pointer">
          <ArrowLeft className="size-3.5" />
          <span>Back to Heatmap</span>
        </Button>
        <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg bg-card/25 p-4 text-center">
          <Layers className="size-10 text-muted-foreground mb-2" />
          <h3 className="font-semibold text-sm">Room Not Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            The specified room could not be located in the campus hierarchy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back navigation */}
      <Button
        variant="ghost"
        onClick={() => navigate(`/heatmap/building/${encodeURIComponent(building.name)}/floor/${encodeURIComponent(floor.name)}`)}
        className="h-8 text-xs gap-1 cursor-pointer"
      >
        <ArrowLeft className="size-3.5" />
        <span>Back to {floor.name}</span>
      </Button>

      {/* Header */}
      <PageHeader
        title={`${building.name} - ${floor.name} - ${room.name}`}
        description={`Operational status of assets positioned in room ${room.name}.`}
      />

      {/* Room Scorecard */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Room Average Health"
          value={`${room.averageHealth}%`}
          icon={Activity}
        />
        <StatCard
          title="Assets in Room"
          value={room.assetCount}
          icon={Layers}
        />
        <StatCard
          title="Under Maintenance"
          value={room.maintenanceCount}
          icon={Wrench}
        />
        <StatCard
          title="Critical Alerts"
          value={room.criticalCount}
          icon={ShieldAlert}
        />
      </div>

      {/* Assets Table */}
      <Card className="border border-border bg-card">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            <span>Room Assets Directory</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-[10px] font-semibold tracking-wider h-8">Asset Name</TableHead>
                <TableHead className="text-[10px] font-semibold tracking-wider h-8">Asset Code</TableHead>
                <TableHead className="text-[10px] font-semibold tracking-wider h-8">Tag</TableHead>
                <TableHead className="text-[10px] font-semibold tracking-wider h-8">Model</TableHead>
                <TableHead className="text-[10px] font-semibold tracking-wider h-8">Status</TableHead>
                <TableHead className="text-[10px] font-semibold tracking-wider h-8">Lifecycle Stage</TableHead>
                <TableHead className="text-[10px] font-semibold tracking-wider h-8 text-right">Health Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {room.assets && room.assets.length > 0 ? (
                room.assets.map((asset: any) => (
                  <TableRow key={asset.id} className="hover:bg-muted/10 h-10 cursor-pointer" onClick={() => navigate(`/assets/${asset.id}`)}>
                    <TableCell className="text-xs font-semibold py-1.5">{asset.name}</TableCell>
                    <TableCell className="text-xs py-1.5">{asset.assetCode || "N/A"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground py-1.5">{asset.tag}</TableCell>
                    <TableCell className="text-xs py-1.5">{asset.model}</TableCell>
                    <TableCell className="text-xs py-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                        asset.status === "OPERATIONAL" ? "bg-emerald-500/10 text-emerald-500" :
                        asset.status === "MAINTENANCE" ? "bg-blue-500/10 text-blue-500" :
                        "bg-red-500/10 text-red-500"
                      }`}>{asset.status}</span>
                    </TableCell>
                    <TableCell className="text-xs py-1.5">{asset.lifecycleStage}</TableCell>
                    <TableCell className="text-xs font-bold text-right py-1.5 flex items-center justify-end gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        asset.healthScore >= 75 ? "text-emerald-500 font-bold" :
                        asset.healthScore >= 50 ? "text-blue-500" :
                        asset.healthScore >= 25 ? "text-amber-500" :
                        "text-red-500 font-bold"
                      }`}>{asset.healthScore}%</span>
                      {asset.prevHealthScore !== null && asset.prevHealthScore !== undefined && (
                        asset.healthScore > asset.prevHealthScore ? <ArrowUp className="size-3 text-emerald-500 shrink-0" /> :
                        asset.healthScore < asset.prevHealthScore ? <ArrowDown className="size-3 text-red-500 shrink-0" /> :
                        null
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-xs text-center text-muted-foreground py-4">No assets in this room.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
export default RoomDetailPage;
