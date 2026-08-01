import { isMockEnabled, simulateDelay } from "../../mocks/index.js";
import { mockAssets } from "../../mocks/assets.js";
import { sdkRequest } from "../api-sdk.js";

export interface IHeatmapRepository {
  getHealthDashboard(filters?: any): Promise<any>;
  getHeatmap(filters?: any): Promise<any>;
  getHealthConfig(): Promise<any>;
  updateHealthConfig(config: any): Promise<any>;
  recalculateHealth(filters?: any): Promise<any>;
}

// In-memory weights for mock config
let mockWeightsConfig = {
  weights: {
    age: 0.25,
    maintenanceOverdue: 0.25,
    failures: 0.25,
    openTickets: 0.25
  },
  lifespanYearsDefault: 5,
  categoryLifespans: {
    "Wi-Fi & Network": 6,
    "Software Licenses": 3,
    "Hardware Repair": 4,
    "User Accounts": 2,
    "Software & Access": 3,
    "Hardware & Devices": 5
  },
  deductions: {
    overdueMaintenance: 15,
    failedMaintenance: 20,
    openCriticalTicket: 25,
    openHighTicket: 15,
    openMediumTicket: 5,
    openLowTicket: 2
  }
};

class MockHeatmapRepository implements IHeatmapRepository {
  private applyFilters(list: any[], filters: any): any[] {
    let result = [...list];
    if (filters) {
      if (filters.healthStatus) {
        result = result.filter(a => a.healthStatus === filters.healthStatus);
      }
      if (filters.lifecycleStage) {
        result = result.filter(a => a.lifecycleStage === filters.lifecycleStage);
      }
      if (filters.status) {
        result = result.filter(a => a.status === filters.status);
      }
      if (filters.departmentId) {
        result = result.filter(a => a.departmentId === filters.departmentId);
      }
      if (filters.categoryId) {
        result = result.filter(a => a.categoryId === filters.categoryId);
      }
      if (filters.building) {
        const bLower = filters.building.toLowerCase();
        result = result.filter(a => a.building && a.building.toLowerCase().includes(bLower));
      }
    }
    return result;
  }

  async getHealthDashboard(filters?: any): Promise<any> {
    const list = this.applyFilters(mockAssets, filters);
    
    let healthyCount = 0;
    let monitorCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    let totalScore = 0;
    let maintenanceCount = 0;

    let trendImproved = 0;
    let trendStable = 0;
    let trendDegraded = 0;

    const buildingMap: Record<string, { totalScore: number; count: number; criticalCount: number }> = {};
    const deptMap: Record<string, { totalScore: number; count: number; name: string }> = {};

    const deptNames: Record<string, string> = {
      "d-1": "Information Technology Support",
      "d-2": "Computer Science Dept",
      "d-3": "Mechanical Engineering"
    };

    for (const asset of list) {
      const score = asset.healthScore || 100;
      totalScore += score;

      if (score >= 75) healthyCount++;
      else if (score >= 50) monitorCount++;
      else if (score >= 25) warningCount++;
      else criticalCount++;

      if (asset.status === "MAINTENANCE" || asset.lifecycleStage === "MAINTENANCE") {
        maintenanceCount++;
      }

      if (asset.prevHealthScore === undefined || asset.prevHealthScore === null) {
        trendStable++;
      } else if (score > asset.prevHealthScore) {
        trendImproved++;
      } else if (score < asset.prevHealthScore) {
        trendDegraded++;
      } else {
        trendStable++;
      }

      const bName = asset.building || "Unassigned Building";
      if (!buildingMap[bName]) {
        buildingMap[bName] = { totalScore: 0, count: 0, criticalCount: 0 };
      }
      buildingMap[bName].totalScore += score;
      buildingMap[bName].count++;
      if (score < 25) buildingMap[bName].criticalCount++;

      const dId = asset.departmentId;
      const dName = deptNames[dId] || "Other Departments";
      if (!deptMap[dId]) {
        deptMap[dId] = { totalScore: 0, count: 0, name: dName };
      }
      deptMap[dId].totalScore += score;
      deptMap[dId].count++;
    }

    const buildingHealthRanking = Object.entries(buildingMap).map(([building, stats]) => ({
      building,
      assetCount: stats.count,
      averageHealth: stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0,
      criticalCount: stats.criticalCount
    })).sort((a, b) => b.averageHealth - a.averageHealth);

    const departmentHealthRanking = Object.entries(deptMap).map(([id, stats]) => ({
      id,
      name: stats.name,
      assetCount: stats.count,
      averageHealth: stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0
    })).sort((a, b) => b.averageHealth - a.averageHealth);

    const topFailureCategories = [
      { name: "Hardware Repair", count: 5 },
      { name: "Wi-Fi & Network", count: 3 },
      { name: "Software Licenses", count: 1 }
    ];

    return simulateDelay({
      totalAssets: list.length,
      averageHealth: list.length > 0 ? Math.round(totalScore / list.length) : 100,
      healthyAssets: healthyCount,
      monitorAssets: monitorCount,
      warningAssets: warningCount,
      criticalAssets: criticalCount,
      assetsInMaintenance: maintenanceCount,
      buildingHealthRanking,
      departmentHealthRanking,
      topFailureCategories,
      trends: {
        improved: trendImproved,
        stable: trendStable,
        degraded: trendDegraded
      }
    });
  }

  async getHeatmap(filters?: any): Promise<any> {
    const list = this.applyFilters(mockAssets, filters);

    const tree: any = {
      name: "Campus",
      assetCount: 0,
      maintenanceCount: 0,
      criticalCount: 0,
      warningCount: 0,
      lowHealthCount: 0,
      totalHealthScore: 0,
      averageHealth: 0,
      buildings: {}
    };

    const lowStockItems = [
      { id: "inv-1", name: "Cat6 Ethernet Cable 5m", itemCode: "INV-2026-0001", currentStock: 4, reorderLevel: 10, location: "IT Center Basement" },
      { id: "inv-2", name: "SATA Cable 0.5m", itemCode: "INV-2026-0002", currentStock: 2, reorderLevel: 5, location: "Science Hall Room 102" }
    ];

    for (const asset of list) {
      const bName = asset.building || "Unassigned Building";
      const fName = asset.floor || "Unassigned Floor";
      const rName = asset.room || "Unassigned Room";

      const score = asset.healthScore || 100;
      const isMaint = asset.status === "MAINTENANCE" || asset.lifecycleStage === "MAINTENANCE";
      const isCritical = score < 25;
      const isWarning = score >= 25 && score < 50;
      const isLowHealth = score < 50;

      tree.assetCount++;
      if (isMaint) tree.maintenanceCount++;
      if (isCritical) tree.criticalCount++;
      if (isWarning) tree.warningCount++;
      if (isLowHealth) tree.lowHealthCount++;
      tree.totalHealthScore += score;

      if (!tree.buildings[bName]) {
        tree.buildings[bName] = {
          name: bName,
          assetCount: 0,
          maintenanceCount: 0,
          criticalCount: 0,
          warningCount: 0,
          lowHealthCount: 0,
          totalHealthScore: 0,
          averageHealth: 0,
          floors: {}
        };
      }
      const b = tree.buildings[bName];
      b.assetCount++;
      if (isMaint) b.maintenanceCount++;
      if (isCritical) b.criticalCount++;
      if (isWarning) b.warningCount++;
      if (isLowHealth) b.lowHealthCount++;
      b.totalHealthScore += score;

      if (!b.floors[fName]) {
        b.floors[fName] = {
          name: fName,
          assetCount: 0,
          maintenanceCount: 0,
          criticalCount: 0,
          warningCount: 0,
          lowHealthCount: 0,
          totalHealthScore: 0,
          averageHealth: 0,
          rooms: {}
        };
      }
      const f = b.floors[fName];
      f.assetCount++;
      if (isMaint) f.maintenanceCount++;
      if (isCritical) f.criticalCount++;
      if (isWarning) f.warningCount++;
      if (isLowHealth) f.lowHealthCount++;
      f.totalHealthScore += score;

      if (!f.rooms[rName]) {
        f.rooms[rName] = {
          name: rName,
          assetCount: 0,
          maintenanceCount: 0,
          criticalCount: 0,
          warningCount: 0,
          lowHealthCount: 0,
          totalHealthScore: 0,
          averageHealth: 0,
          assets: []
        };
      }
      const r = f.rooms[rName];
      r.assetCount++;
      if (isMaint) r.maintenanceCount++;
      if (isCritical) r.criticalCount++;
      if (isWarning) r.warningCount++;
      if (isLowHealth) r.lowHealthCount++;
      r.totalHealthScore += score;
      r.assets.push(asset);
    }

    tree.averageHealth = tree.assetCount > 0 ? Math.round(tree.totalHealthScore / tree.assetCount) : 0;
    
    const buildingsList = Object.values(tree.buildings).map((b: any) => {
      b.averageHealth = b.assetCount > 0 ? Math.round(b.totalHealthScore / b.assetCount) : 0;
      
      const floorsList = Object.values(b.floors).map((f: any) => {
        f.averageHealth = f.assetCount > 0 ? Math.round(f.totalHealthScore / f.assetCount) : 0;
        
        const roomsList = Object.values(f.rooms).map((r: any) => {
          r.averageHealth = r.assetCount > 0 ? Math.round(r.totalHealthScore / r.assetCount) : 0;
          return r;
        });
        
        f.rooms = roomsList;
        return f;
      });
      
      b.floors = floorsList;
      
      b.inventoryHotspots = lowStockItems
        .filter(item => item.location && item.location.toLowerCase().includes(b.name.toLowerCase()))
        .map(item => ({
          id: item.id,
          name: item.name,
          itemCode: item.itemCode,
          currentStock: item.currentStock,
          reorderLevel: item.reorderLevel,
          location: item.location
        }));

      return b;
    });

    tree.buildings = buildingsList;

    return simulateDelay(tree);
  }

  async getHealthConfig(): Promise<any> {
    return simulateDelay(mockWeightsConfig);
  }

  async updateHealthConfig(config: any): Promise<any> {
    mockWeightsConfig = { ...mockWeightsConfig, ...config };
    return simulateDelay(mockWeightsConfig);
  }

  async recalculateHealth(filters?: any): Promise<any> {
    // Simulate updating mock assets scores slightly
    for (const asset of mockAssets) {
      if (asset.healthScore !== undefined) {
        asset.prevHealthScore = asset.healthScore;
        // Introduce small random variations (+/- 5 points)
        const diff = Math.floor(Math.random() * 11) - 5;
        asset.healthScore = Math.max(0, Math.min(100, asset.healthScore + diff));
        
        if (asset.healthScore >= 75) asset.healthStatus = "HEALTHY";
        else if (asset.healthScore >= 50) asset.healthStatus = "MONITOR";
        else if (asset.healthScore >= 25) asset.healthStatus = "WARNING";
        else asset.healthStatus = "CRITICAL";
      }
    }
    return simulateDelay({ updatedCount: mockAssets.length });
  }
}

class HttpHeatmapRepository implements IHeatmapRepository {
  async getHealthDashboard(filters?: any): Promise<any> {
    return sdkRequest<any>({
      method: "GET",
      url: "/assets/health/dashboard",
      params: filters
    });
  }

  async getHeatmap(filters?: any): Promise<any> {
    return sdkRequest<any>({
      method: "GET",
      url: "/assets/health/heatmap",
      params: filters
    });
  }

  async getHealthConfig(): Promise<any> {
    return sdkRequest<any>({
      method: "GET",
      url: "/assets/health/config"
    });
  }

  async updateHealthConfig(config: any): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: "/assets/health/config",
      data: config
    });
  }

  async recalculateHealth(filters?: any): Promise<any> {
    return sdkRequest<any>({
      method: "POST",
      url: "/assets/health/recalculate",
      data: filters
    });
  }
}

export const heatmapRepository: IHeatmapRepository = new Proxy(
  {} as IHeatmapRepository,
  {
    get: (target, prop) => {
      const activeRepo = isMockEnabled() ? new MockHeatmapRepository() : new HttpHeatmapRepository();
      return Reflect.get(activeRepo, prop);
    }
  }
);
