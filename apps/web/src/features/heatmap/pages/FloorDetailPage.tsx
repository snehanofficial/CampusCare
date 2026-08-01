import React from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Layers,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  Wrench,
  Activity,
  MapPin,
  TrendingUp
} from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader.js";
import { StatCard } from "../../../components/common/StatCard.js";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card.js";
import { Button } from "../../../components/ui/button.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table.js";
import { heatmapRepository } from "../../../lib/repositories/heatmap.repository.js";

export function FloorDetailPage() {
  const { buildingName, floorName } = useParams();
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-sm text-muted-foreground animate-pulse">Loading location coordinates...</span>
      </div>
    );
  }

  if (!building || !floor) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/heatmap")} className="h-8 text-xs gap-1 cursor-pointer">
          <ArrowLeft className="size-3.5" />
          <span>Back to Heatmap</span>
        </Button>
        <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg bg-card/25 p-4 text-center">
          <Layers className="size-10 text-muted-foreground mb-2" />
          <h3 className="font-semibold text-sm">Floor Not Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            This floor level could not be located under the specified building node.
          </p>
        </div>
      </div>
    );
  }

  // Aggregate assets on this floor
  const floorAssets: any[] = [];
  if (floor.rooms) {
    Object.values(floor.rooms).forEach((room: any) => {
      if (room.assets) {
        floorAssets.push(...room.assets);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Back navigation */}
      <Button
        variant="ghost"
        onClick={() => navigate(`/heatmap/building/${encodeURIComponent(building.name)}`)}
        className="h-8 text-xs gap-1 cursor-pointer"
      >
        <ArrowLeft className="size-3.5" />
        <span>Back to {building.name}</span>
      </Button>

      {/* Header */}
      <PageHeader
        title={`${building.name} - ${floor.name}`}
        description={`Operational status of assets positioned on floor level ${floor.name}.`}
      />

      {/* Floor Scorecard */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Floor Average Health"
          value={`${floor.averageHealth}%`}
          icon={Activity}
        />
        <StatCard
          title="Total Assets"
          value={floor.assetCount}
          icon={Layers}
        />
        <StatCard
          title="Under Maintenance"
          value={floor.maintenanceCount}
          icon={Wrench}
        />
        <StatCard
          title="Critical Alerts"
          value={floor.criticalCount}
          icon={ShieldAlert}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Room List */}
        <Card className="border border-border bg-card">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              <span>Rooms on this Level</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-[10px] font-semibold tracking-wider h-8">Room Number</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wider h-8 text-center">Assets</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wider h-8 text-right">Avg Health</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wider h-8 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {floor.rooms && Object.keys(floor.rooms).length > 0 ? (
                  Object.values(floor.rooms).map((room: any) => (
                    <TableRow key={room.name} className="hover:bg-muted/10 h-10">
                      <TableCell className="text-xs font-semibold py-1.5">{room.name || "Unassigned Room"}</TableCell>
                      <TableCell className="text-xs text-center py-1.5">{room.assetCount}</TableCell>
                      <TableCell className="text-xs font-bold text-right py-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          room.averageHealth >= 75 ? "bg-emerald-500/10 text-emerald-500" :
                          room.averageHealth >= 50 ? "bg-blue-500/10 text-blue-500" :
                          room.averageHealth >= 25 ? "bg-amber-500/10 text-amber-500" :
                          "bg-red-500/10 text-red-500"
                        }`}>
                          {room.averageHealth}%
                        </span>
                      </TableCell>
                      <TableCell className="py-1.5 text-right">
                        <Button
                          onClick={() => navigate(`/heatmap/building/${encodeURIComponent(building.name)}/floor/${encodeURIComponent(floor.name)}/room/${encodeURIComponent(room.name)}`)}
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
                    <TableCell colSpan={4} className="text-xs text-center text-muted-foreground py-4">No rooms mapped on this level.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Floor Assets Summary Table */}
        <Card className="lg:col-span-2 border border-border bg-card">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <span>Asset Summary on this Level</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-[10px] font-semibold tracking-wider h-8">Asset Name</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wider h-8">Tag</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wider h-8">Room</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wider h-8">Status</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wider h-8 text-right">Health %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {floorAssets.length > 0 ? (
                  floorAssets.map((asset: any) => (
                    <TableRow key={asset.id} className="hover:bg-muted/10 h-10 cursor-pointer" onClick={() => navigate(`/assets/${asset.id}`)}>
                      <TableCell className="text-xs font-semibold py-1.5">{asset.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground py-1.5">{asset.tag}</TableCell>
                      <TableCell className="text-xs py-1.5">{asset.room || "Unassigned"}</TableCell>
                      <TableCell className="text-xs py-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                          asset.status === "OPERATIONAL" ? "bg-emerald-500/10 text-emerald-500" :
                          asset.status === "MAINTENANCE" ? "bg-blue-500/10 text-blue-500" :
                          "bg-red-500/10 text-red-500"
                        }`}>{asset.status}</span>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-right py-1.5 flex items-center justify-end gap-1.5">
                        <span>{asset.healthScore}%</span>
                        {asset.prevHealthScore !== null && asset.prevHealthScore !== undefined && (
                          asset.healthScore > asset.prevHealthScore ? <ArrowLeft className="-rotate-45 size-3 text-emerald-500" /> :
                          asset.healthScore < asset.prevHealthScore ? <ArrowLeft className="rotate-135 size-3 text-red-500" /> :
                          null
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-xs text-center text-muted-foreground py-4">No assets found on this floor.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export default FloorDetailPage;
