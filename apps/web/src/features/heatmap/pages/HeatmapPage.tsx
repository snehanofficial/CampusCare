import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  Building,
  Layers,
  MapPin,
  RefreshCw,
  Settings,
  LayoutDashboard,
  Map,
  Info,
  ChevronRight,
  TrendingUp,
  Wrench,
  Package
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

import { PageHeader } from "../../../components/common/PageHeader.js";
import { StatCard } from "../../../components/common/StatCard.js";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../../../components/ui/card.js";
import { Button } from "../../../components/ui/button.js";
import { Input } from "../../../components/ui/input.js";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../components/ui/select.js";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table.js";

import { heatmapRepository } from "../../../lib/repositories/heatmap.repository.js";
import { departmentRepository } from "../../../lib/repositories/department.repository.js";
import { assetCategoryRepository } from "../../../lib/repositories/asset-category.repository.js";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

export function HeatmapPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Filters state
  const [filters, setFilters] = useState({
    healthStatus: "",
    lifecycleStage: "",
    status: "",
    departmentId: "",
    categoryId: "",
    building: ""
  });

  // Queries
  const { data: dashboardData, isLoading: isDashLoading, refetch: refetchDash } = useQuery({
    queryKey: ["healthDashboard", filters],
    queryFn: () => heatmapRepository.getHealthDashboard(filters)
  });

  const { data: heatmapData, isLoading: isHeatmapLoading, refetch: refetchHeatmap } = useQuery({
    queryKey: ["campusHeatmap", filters],
    queryFn: () => heatmapRepository.getHeatmap(filters)
  });

  const { data: configData, isLoading: isConfigLoading } = useQuery({
    queryKey: ["healthConfig"],
    queryFn: () => heatmapRepository.getHealthConfig()
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentRepository.list().then(res => res.data)
  });

  const { data: categories } = useQuery({
    queryKey: ["assetCategories"],
    queryFn: () => assetCategoryRepository.list().then(res => res.data)
  });

  // Configurations edit state
  const [weights, setWeights] = useState<any>(null);
  const [deductions, setDeductions] = useState<any>(null);

  React.useEffect(() => {
    if (configData) {
      setWeights(configData.weights);
      setDeductions(configData.deductions);
    }
  }, [configData]);

  // Mutations
  const updateConfigMutation = useMutation({
    mutationFn: (newConfig: any) => heatmapRepository.updateHealthConfig(newConfig),
    onSuccess: () => {
      toast.success("Health configuration updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["healthConfig"] });
      queryClient.invalidateQueries({ queryKey: ["healthDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["campusHeatmap"] });
    },
    onError: () => {
      toast.error("Failed to update health configuration.");
    }
  });

  const recalculateMutation = useMutation({
    mutationFn: () => heatmapRepository.recalculateHealth(filters),
    onSuccess: (res: any) => {
      toast.success(`Recalculated health for ${res?.updatedCount ?? 0} assets successfully!`);
      queryClient.invalidateQueries({ queryKey: ["healthDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["campusHeatmap"] });
    },
    onError: () => {
      toast.error("Failed to recalculate health.");
    }
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = () => {
    if (!weights || !deductions) return;
    updateConfigMutation.mutate({
      ...configData,
      weights,
      deductions
    });
  };

  const handleRecalculate = () => {
    recalculateMutation.mutate();
  };

  // Pie chart data prep
  const distributionData = dashboardData ? [
    { name: "Healthy", value: dashboardData.healthyAssets },
    { name: "Monitor", value: dashboardData.monitorAssets },
    { name: "Warning", value: dashboardData.warningAssets },
    { name: "Critical", value: dashboardData.criticalAssets }
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-4 max-w-full">
      {/* Header */}
      <PageHeader
        title="Asset Health & Heatmap Center"
        description="Comprehensive институциональный monitoring: dynamic campus health scorecard, failure frequency, and interactive risk analysis."
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRecalculate}
              disabled={recalculateMutation.isPending}
              variant="outline"
              size="sm"
              className="h-8 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${recalculateMutation.isPending ? "animate-spin" : ""}`} />
              <span>Recalculate Health</span>
            </Button>
          </div>
        }
      />

      {/* Unified Filters toolbar */}
      <Card className="border border-border bg-card/40 backdrop-blur-sm">
        <CardContent className="p-3 grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 items-end">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Building</label>
            <Input
              value={filters.building}
              onChange={e => handleFilterChange("building", e.target.value)}
              placeholder="e.g. Science Hall"
              className="h-8 text-xs bg-background/50 border-border"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Health Status</label>
            <Select value={filters.healthStatus} onValueChange={val => handleFilterChange("healthStatus", val)}>
              <SelectTrigger className="h-8 text-xs bg-background/50 border-border">
                <SelectValue placeholder="All Health" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Health</SelectItem>
                <SelectItem value="HEALTHY">Healthy</SelectItem>
                <SelectItem value="MONITOR">Monitor</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Lifecycle Stage</label>
            <Select value={filters.lifecycleStage} onValueChange={val => handleFilterChange("lifecycleStage", val)}>
              <SelectTrigger className="h-8 text-xs bg-background/50 border-border">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Stages</SelectItem>
                <SelectItem value="PROCURED">Procured</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_USE">In Use</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="RESERVED">Reserved</SelectItem>
                <SelectItem value="RETURNED">Returned</SelectItem>
                <SelectItem value="RETIRED">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Status</label>
            <Select value={filters.status} onValueChange={val => handleFilterChange("status", val)}>
              <SelectTrigger className="h-8 text-xs bg-background/50 border-border">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="OPERATIONAL">Operational</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="DECOMMISSIONED">Decommissioned</SelectItem>
                <SelectItem value="BROKEN">Broken</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Department</label>
            <Select value={filters.departmentId} onValueChange={val => handleFilterChange("departmentId", val)}>
              <SelectTrigger className="h-8 text-xs bg-background/50 border-border">
                <SelectValue placeholder="All Depts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {departments?.map((d: any) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Category</label>
            <Select value={filters.categoryId} onValueChange={val => handleFilterChange("categoryId", val)}>
              <SelectTrigger className="h-8 text-xs bg-background/50 border-border">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1 border border-border">
          <TabsTrigger value="dashboard" className="text-xs flex items-center gap-1.5 py-1 px-3">
            <LayoutDashboard className="size-3.5" />
            <span>Executive Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="text-xs flex items-center gap-1.5 py-1 px-3">
            <Map className="size-3.5" />
            <span>Campus Heatmap</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="text-xs flex items-center gap-1.5 py-1 px-3">
            <Settings className="size-3.5" />
            <span>Scoring Config</span>
          </TabsTrigger>
        </TabsList>

        {/* ──────── Dashboard View ──────── */}
        <TabsContent value="dashboard" className="space-y-4 focus-visible:outline-none">
          {isDashLoading ? (
            <div className="flex h-64 items-center justify-center">
              <span className="text-sm text-muted-foreground animate-pulse">Loading dashboard statistics...</span>
            </div>
          ) : dashboardData ? (
            <>
              {/* KPI Cards */}
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard
                  title="Total Monitored Assets"
                  value={dashboardData.totalAssets}
                  icon={Activity}
                />
                <StatCard
                  title="Healthy Assets (>=75%)"
                  value={dashboardData.healthyAssets}
                  icon={CheckCircle}
                />
                <StatCard
                  title="Monitor Required (50-74%)"
                  value={dashboardData.monitorAssets}
                  icon={Info}
                />
                <StatCard
                  title="Warning Status (25-49%)"
                  value={dashboardData.warningAssets}
                  icon={AlertTriangle}
                />
                <StatCard
                  title="Critical Failures (<25%)"
                  value={dashboardData.criticalAssets}
                  icon={ShieldAlert}
                />
              </div>

              {/* Trends & Health charts */}
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                {/* Health Distribution Chart */}
                <Card className="border border-border bg-card">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="size-4 text-emerald-500" />
                      <span>Health Distribution</span>
                    </CardTitle>
                    <CardDescription className="text-xs">Proportional view of asset scores</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 h-56 flex items-center justify-center">
                    {distributionData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {distributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }}
                            itemStyle={{ fontSize: "11px" }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-xs text-muted-foreground">No asset health records available.</span>
                    )}
                  </CardContent>
                </Card>

                {/* Building Health Rankings Chart */}
                <Card className="lg:col-span-2 border border-border bg-card">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Building className="size-4 text-primary" />
                      <span>Building Health Ranking</span>
                    </CardTitle>
                    <CardDescription className="text-xs">Locations sorted by average asset health score</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 h-56">
                    {dashboardData.buildingHealthRanking?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashboardData.buildingHealthRanking} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <YAxis dataKey="building" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={100} />
                          <ChartTooltip
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }}
                            itemStyle={{ fontSize: "11px" }}
                          />
                          <Bar dataKey="averageHealth" name="Avg Health %" fill="#3B82F6" radius={[0, 4, 4, 0]}>
                            {dashboardData.buildingHealthRanking.map((entry: any, index: number) => {
                              let barColor = "#EF4444"; // critical
                              if (entry.averageHealth >= 75) barColor = "#10B981"; // healthy
                              else if (entry.averageHealth >= 50) barColor = "#3B82F6"; // monitor
                              else if (entry.averageHealth >= 25) barColor = "#F59E0B"; // warning
                              return <Cell key={`cell-${index}`} fill={barColor} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-xs text-muted-foreground flex h-full items-center justify-center">No location scores found.</span>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Department Ranking & Failures Grid */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {/* Department Health score card list */}
                <Card className="border border-border bg-card">
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Layers className="size-4 text-primary" />
                      <span>Department Health Scoreboard</span>
                    </CardTitle>
                    <CardDescription className="text-xs">Dynamic health stats by organizational departments</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="text-[10px] font-semibold tracking-wider h-8">Department</TableHead>
                          <TableHead className="text-[10px] font-semibold tracking-wider h-8 text-center">Assets</TableHead>
                          <TableHead className="text-[10px] font-semibold tracking-wider h-8 text-right">Avg Health</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardData.departmentHealthRanking?.length > 0 ? (
                          dashboardData.departmentHealthRanking.map((d: any) => (
                            <TableRow key={d.id} className="hover:bg-muted/10 h-10">
                              <TableCell className="text-xs font-medium py-1.5">{d.name}</TableCell>
                              <TableCell className="text-xs text-center py-1.5">{d.assetCount}</TableCell>
                              <TableCell className="text-xs font-bold text-right py-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                  d.averageHealth >= 75 ? "bg-emerald-500/10 text-emerald-500" :
                                  d.averageHealth >= 50 ? "bg-blue-500/10 text-blue-500" :
                                  d.averageHealth >= 25 ? "bg-amber-500/10 text-amber-500" :
                                  "bg-red-500/10 text-red-500"
                                }`}>
                                  {d.averageHealth}%
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-xs text-center text-muted-foreground py-4">No department metrics available.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Top Failure Categories */}
                <Card className="border border-border bg-card">
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ShieldAlert className="size-4 text-destructive" />
                      <span>Top Failure Categories</span>
                    </CardTitle>
                    <CardDescription className="text-xs">Highest maintenance failure count by asset category (last 90 days)</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 h-64 flex flex-col justify-between">
                    {dashboardData.topFailureCategories?.length > 0 ? (
                      <>
                        <div className="h-44">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dashboardData.topFailureCategories} margin={{ top: 10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={9} />
                              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} allowDecimals={false} />
                              <ChartTooltip
                                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }}
                                itemStyle={{ fontSize: "11px" }}
                              />
                              <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} name="Failures" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 p-2 bg-muted/20 border border-border rounded-md">
                          <Info className="size-3.5 text-blue-500 shrink-0" />
                          <span>Deductions are automatically factored in. Address these categories to boost institutional uptime.</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        No category failures logged. Keep it up!
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground border border-dashed rounded-lg bg-card/20">
              No dashboard summary retrieved. Adjust your filter values or trigger recalculation.
            </div>
          )}
        </TabsContent>

        {/* ──────── Heatmap View ──────── */}
        <TabsContent value="heatmap" className="space-y-4 focus-visible:outline-none">
          {isHeatmapLoading ? (
            <div className="flex h-64 items-center justify-center">
              <span className="text-sm text-muted-foreground animate-pulse">Aggregating campus hierarchy data...</span>
            </div>
          ) : heatmapData ? (
            <div className="space-y-4">
              {/* Campus Aggregates Card */}
              <Card className="border border-border bg-card/60 backdrop-blur-md">
                <CardContent className="p-4 grid gap-4 grid-cols-2 md:grid-cols-5 items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Campus Avg Health</div>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-sm ${
                        heatmapData.averageHealth >= 75 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                        heatmapData.averageHealth >= 50 ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                        heatmapData.averageHealth >= 25 ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                        "bg-red-500/10 text-red-500 border border-red-500/20"
                      }`}>{heatmapData.averageHealth}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Assets</div>
                    <div className="text-2xl font-bold">{heatmapData.assetCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Under Maintenance</div>
                    <div className="text-2xl font-bold text-blue-400">{heatmapData.maintenanceCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Critical Status</div>
                    <div className="text-2xl font-bold text-red-500">{heatmapData.criticalCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Low Health (&lt;50)</div>
                    <div className="text-2xl font-bold text-amber-500">{heatmapData.lowHealthCount}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Building List Map */}
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {heatmapData.buildings?.length > 0 ? (
                  heatmapData.buildings.map((building: any) => {
                    const hotspotCount = building.inventoryHotspots?.length || 0;
                    return (
                      <Card key={building.name} className="border border-border bg-card hover:border-primary/50 transition-colors shadow-sm flex flex-col justify-between">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                              <Building className="size-4 text-muted-foreground" />
                              <span>{building.name}</span>
                            </CardTitle>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              building.averageHealth >= 75 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                              building.averageHealth >= 50 ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                              building.averageHealth >= 25 ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                              "bg-red-500/10 text-red-500 border border-red-500/20"
                            }`}>{building.averageHealth}% Health</span>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-4 pt-1 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-muted/20 border border-border/50 rounded flex flex-col">
                              <span className="text-[10px] text-muted-foreground uppercase">Assets</span>
                              <span className="font-semibold">{building.assetCount}</span>
                            </div>
                            <div className="p-2 bg-muted/20 border border-border/50 rounded flex flex-col">
                              <span className="text-[10px] text-muted-foreground uppercase">In Repair</span>
                              <span className={`font-semibold ${building.maintenanceCount > 0 ? "text-blue-500" : ""}`}>{building.maintenanceCount}</span>
                            </div>
                            <div className="p-2 bg-muted/20 border border-border/50 rounded flex flex-col">
                              <span className="text-[10px] text-muted-foreground uppercase">Critical</span>
                              <span className={`font-semibold ${building.criticalCount > 0 ? "text-red-500" : ""}`}>{building.criticalCount}</span>
                            </div>
                            <div className="p-2 bg-muted/20 border border-border/50 rounded flex flex-col">
                              <span className="text-[10px] text-muted-foreground uppercase">Hotspots</span>
                              <span className={`font-semibold ${hotspotCount > 0 ? "text-amber-500" : ""}`}>{hotspotCount}</span>
                            </div>
                          </div>
                        </CardContent>

                        <div className="p-3 border-t border-border flex items-center justify-between bg-muted/10">
                          {hotspotCount > 0 ? (
                            <span className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Package className="size-3" />
                              <span>{hotspotCount} parts low</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Location healthy</span>
                          )}
                          <Button
                            onClick={() => navigate(`/heatmap/building/${encodeURIComponent(building.name)}`)}
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] px-2 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Drill down</span>
                            <ChevronRight className="size-3" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <div className="col-span-full py-8 text-center text-muted-foreground text-xs bg-muted/15 border border-dashed rounded-md">
                    No building records match current filter settings.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground border border-dashed rounded-lg bg-card/20">
              No campus coordinates found. Ensure assets have Building designations.
            </div>
          )}
        </TabsContent>

        {/* ──────── Configurations View ──────── */}
        <TabsContent value="config" className="space-y-4 focus-visible:outline-none">
          {isConfigLoading || !weights ? (
            <div className="flex h-64 items-center justify-center">
              <span className="text-sm text-muted-foreground animate-pulse">Loading scoring algorithm weights...</span>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {/* Scoring Weights */}
              <Card className="border border-border bg-card">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Settings className="size-4 text-primary" />
                    <span>Factor Scoring Weights</span>
                  </CardTitle>
                  <CardDescription className="text-xs">Distribute contribution ratios totaling 1.0 (100%)</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Asset Age Weight</span>
                      <span>{(weights.age * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={weights.age}
                      onChange={e => setWeights((w: any) => ({ ...w, age: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Maintenance Overdue Weight</span>
                      <span>{(weights.maintenanceOverdue * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={weights.maintenanceOverdue}
                      onChange={e => setWeights((w: any) => ({ ...w, maintenanceOverdue: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Recent Failures Weight</span>
                      <span>{(weights.failures * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={weights.failures}
                      onChange={e => setWeights((w: any) => ({ ...w, failures: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Open Support Tickets Weight</span>
                      <span>{(weights.openTickets * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={weights.openTickets}
                      onChange={e => setWeights((w: any) => ({ ...w, openTickets: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  <div className="text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                    💡 Weights indicate the maximum deductions a rule can apply. Ensure they are balanced.
                  </div>
                </CardContent>
              </Card>

              {/* Deductions Config */}
              <Card className="border border-border bg-card">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ShieldAlert className="size-4 text-amber-500" />
                    <span>Deduction Penalty Settings</span>
                  </CardTitle>
                  <CardDescription className="text-xs">Configure score points subtracted per event occurrence</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground font-semibold block mb-1">Overdue Maintenance</label>
                      <Input
                        type="number"
                        value={deductions.overdueMaintenance}
                        onChange={e => setDeductions((d: any) => ({ ...d, overdueMaintenance: parseInt(e.target.value) || 0 }))}
                        className="h-8 text-xs bg-background border-border"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-semibold block mb-1">Failed Maintenance</label>
                      <Input
                        type="number"
                        value={deductions.failedMaintenance}
                        onChange={e => setDeductions((d: any) => ({ ...d, failedMaintenance: parseInt(e.target.value) || 0 }))}
                        className="h-8 text-xs bg-background border-border"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-semibold block mb-1">Critical Open Ticket</label>
                      <Input
                        type="number"
                        value={deductions.openCriticalTicket}
                        onChange={e => setDeductions((d: any) => ({ ...d, openCriticalTicket: parseInt(e.target.value) || 0 }))}
                        className="h-8 text-xs bg-background border-border"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-semibold block mb-1">High Open Ticket</label>
                      <Input
                        type="number"
                        value={deductions.openHighTicket}
                        onChange={e => setDeductions((d: any) => ({ ...d, openHighTicket: parseInt(e.target.value) || 0 }))}
                        className="h-8 text-xs bg-background border-border"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-semibold block mb-1">Medium Open Ticket</label>
                      <Input
                        type="number"
                        value={deductions.openMediumTicket}
                        onChange={e => setDeductions((d: any) => ({ ...d, openMediumTicket: parseInt(e.target.value) || 0 }))}
                        className="h-8 text-xs bg-background border-border"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-semibold block mb-1">Low Open Ticket</label>
                      <Input
                        type="number"
                        value={deductions.openLowTicket}
                        onChange={e => setDeductions((d: any) => ({ ...d, openLowTicket: parseInt(e.target.value) || 0 }))}
                        className="h-8 text-xs bg-background border-border"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-end">
                    <Button
                      onClick={handleSaveConfig}
                      disabled={updateConfigMutation.isPending}
                      size="sm"
                      className="h-8 text-xs cursor-pointer"
                    >
                      {updateConfigMutation.isPending ? "Saving..." : "Save Algorithm Parameters"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
export default HeatmapPage;
