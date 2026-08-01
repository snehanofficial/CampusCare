import { prisma } from "../../../database/prisma.js";
import { logger } from "../../../utils/logger.js";
import { HealthStatus, LifecycleStage } from "@campuscare/shared-types";
import { sharedEventBus } from "@campuscare/shared-utils";

import { AgeRule } from "./rules/AgeRule.js";
import { MaintenanceRule } from "./rules/MaintenanceRule.js";
import { FailureRule } from "./rules/FailureRule.js";
import { IncidentRule } from "./rules/IncidentRule.js";
import { LifecycleRule } from "./rules/LifecycleRule.js";
import { RuleEvaluator } from "./rules/index.js";

const DEFAULT_CONFIG = {
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
    "Hardware & Devices": 5,
    "Network & Connectivity": 6,
    "Classroom Technology": 4,
    "Accounts & ID Cards": 2,
    "Facilities & Maintenance": 8
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

export class HealthService {
  private static configCache: any = null;
  private static dashboardCache: Record<string, any> = {};
  private static heatmapCache: Record<string, any> = {};

  private static readonly rules: RuleEvaluator[] = [
    new AgeRule(),
    new MaintenanceRule(),
    new FailureRule(),
    new IncidentRule(),
    new LifecycleRule()
  ];

  static clearAggregationCache(): void {
    logger.debug("Clearing Health Engine dashboard and heatmap caches.");
    this.dashboardCache = {};
    this.heatmapCache = {};
  }

  static async getConfig(): Promise<any> {
    if (this.configCache) return this.configCache;
    try {
      const configRecord = await prisma.healthConfiguration.findUnique({
        where: { key: "health_rules" }
      });
      if (configRecord) {
        this.configCache = configRecord.value;
        return this.configCache;
      }
    } catch (err) {
      logger.error(err as any, "Error loading health configuration from DB");
    }
    return DEFAULT_CONFIG;
  }

  static async updateConfig(value: any): Promise<any> {
    const updatedRecord = await prisma.healthConfiguration.upsert({
      where: { key: "health_rules" },
      update: { value },
      create: { key: "health_rules", value }
    });
    this.configCache = updatedRecord.value;
    this.clearAggregationCache();
    return this.configCache;
  }

  private static async getSystemUserId(): Promise<string> {
    const admin = await prisma.user.findFirst({
      where: { email: "admin@campuscare.edu" }
    });
    if (admin) return admin.id;
    
    const anyUser = await prisma.user.findFirst();
    if (anyUser) return anyUser.id;
    
    return "00000000-0000-0000-0000-000000000000";
  }

  static async recalculateAssetHealth(assetId: string): Promise<any> {
    try {
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        include: {
          category: true,
          maintenanceSchedules: {
            include: {
              records: true
            }
          },
          maintenanceRecords: true,
          tickets: true
        }
      });
      if (!asset || !asset.isActive) return null;

      const config = await this.getConfig();
      
      let totalDeductions = 0;
      for (const rule of this.rules) {
        totalDeductions += rule.evaluate(asset, config);
      }

      let score = Math.max(0, Math.min(100, Math.round(100 - totalDeductions)));

      // Apply overrides
      for (const rule of this.rules) {
        if (rule.overrideScore) {
          score = rule.overrideScore(asset, score);
        }
      }

      let status: HealthStatus;
      if (score >= 90) status = HealthStatus.HEALTHY;
      else if (score >= 75) status = HealthStatus.HEALTHY;
      else if (score >= 50) status = HealthStatus.MONITOR;
      else if (score >= 25) status = HealthStatus.WARNING;
      else status = HealthStatus.CRITICAL;

      const prevScore = asset.healthScore;
      const prevStatus = asset.healthStatus;

      if (prevScore !== score || prevStatus !== status) {
        const systemUserId = await this.getSystemUserId();
        
        await prisma.asset.update({
          where: { id: assetId },
          data: {
            healthScore: score,
            prevHealthScore: prevScore,
            healthStatus: status
          }
        });

        // Record history
        await prisma.assetHistory.create({
          data: {
            assetId,
            actionType: "STATUS_CHANGE",
            notes: `Asset health score recalculated from ${prevScore}% (${prevStatus}) to ${score}% (${status}).`,
            performedById: systemUserId
          }
        });

        // Publish AssetHealthUpdated domain event
        sharedEventBus.publish("AssetHealthUpdated", {
          assetId,
          healthScore: score,
          healthStatus: status,
          previousScore: prevScore,
          previousStatus: prevStatus
        });
      }

      return { score, status };
    } catch (err) {
      logger.error(err as any, `Error calculating health for asset ${assetId}`);
      return null;
    }
  }

  static async recalculateHealth(filters: { building?: string; departmentId?: string; categoryId?: string }): Promise<number> {
    const where: any = { isActive: true };
    if (filters.building) where.building = filters.building;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.categoryId) where.categoryId = filters.categoryId;

    const assets = await prisma.asset.findMany({
      where,
      select: { id: true }
    });

    let updatedCount = 0;
    for (const asset of assets) {
      await this.recalculateAssetHealth(asset.id);
      updatedCount++;
    }

    // Clear caches
    this.clearAggregationCache();

    // Publish HealthRecalculationCompleted domain event
    sharedEventBus.publish("HealthRecalculationCompleted", {
      filters,
      updatedCount,
      timestamp: new Date().toISOString()
    });

    return updatedCount;
  }

  private static buildWhereClause(filters: any): any {
    const where: any = { isActive: true };
    if (filters.healthStatus) {
      where.healthStatus = filters.healthStatus;
    }
    if (filters.lifecycleStage) {
      where.lifecycleStage = filters.lifecycleStage;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters.building) {
      where.building = { contains: filters.building, mode: "insensitive" };
    }
    return where;
  }

  private static async aggregateBuildingHealth(buildingName: string): Promise<{ averageHealth: number; assetCount: number }> {
    const agg = await prisma.asset.aggregate({
      where: {
        building: buildingName,
        isActive: true
      },
      _avg: {
        healthScore: true
      },
      _count: {
        id: true
      }
    });
    return {
      averageHealth: agg._avg.healthScore ? Math.round(agg._avg.healthScore) : 100,
      assetCount: agg._count.id
    };
  }

  static async getHealthDashboard(filters: any): Promise<any> {
    const cacheKey = JSON.stringify(filters);
    if (this.dashboardCache[cacheKey]) {
      logger.debug("Serving health dashboard summary from cache.");
      return this.dashboardCache[cacheKey];
    }

    const where = this.buildWhereClause(filters);
    const assets = await prisma.asset.findMany({
      where,
      include: {
        department: true,
        category: true
      }
    });

    const buildingMap: Record<string, { totalScore: number; count: number; criticalCount: number }> = {};
    const deptMap: Record<string, { totalScore: number; count: number; name: string }> = {};

    let totalScore = 0;
    let healthyCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    let monitorCount = 0;
    let maintenanceCount = 0;
    
    let trendImproved = 0;
    let trendStable = 0;
    let trendDegraded = 0;

    for (const asset of assets) {
      const score = asset.healthScore;
      totalScore += score;

      if (score >= 90) healthyCount++; // Excellent / Good mapping
      else if (score >= 75) healthyCount++;
      else if (score >= 50) monitorCount++;
      else if (score >= 25) warningCount++;
      else criticalCount++;

      if (asset.status === "MAINTENANCE" || asset.lifecycleStage === "MAINTENANCE") {
        maintenanceCount++;
      }

      if (asset.prevHealthScore === null) {
        trendStable++;
      } else if (asset.healthScore > asset.prevHealthScore) {
        trendImproved++;
      } else if (asset.healthScore < asset.prevHealthScore) {
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
      const dName = asset.department?.name || "Unassigned Department";
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

    // Get top failure categories
    const failedRecords = await prisma.maintenanceRecord.findMany({
      where: {
        outcome: "FAILED",
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      },
      include: {
        asset: {
          include: { category: true }
        }
      }
    });

    const categoryFailures: Record<string, number> = {};
    for (const record of failedRecords) {
      const catName = record.asset?.category?.name || "Uncategorized";
      categoryFailures[catName] = (categoryFailures[catName] || 0) + 1;
    }

    const topFailureCategories = Object.entries(categoryFailures)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const data = {
      totalAssets: assets.length,
      averageHealth: assets.length > 0 ? Math.round(totalScore / assets.length) : 100,
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
    };

    this.dashboardCache[cacheKey] = data;
    return data;
  }

  static async getHeatmap(filters: any): Promise<any> {
    const cacheKey = JSON.stringify(filters);
    if (this.heatmapCache[cacheKey]) {
      logger.debug("Serving heatmap statistics from cache.");
      return this.heatmapCache[cacheKey];
    }

    const where = this.buildWhereClause(filters);
    const assets = await prisma.asset.findMany({
      where,
      include: {
        category: true,
        department: true
      }
    });

    const items = await prisma.inventoryItem.findMany({
      where: { isActive: true }
    });
    const lowStockItems = items.filter(item => item.currentStock <= item.reorderLevel);

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

    for (const asset of assets) {
      const bName = asset.building || "Unassigned Building";
      const fName = asset.floor || "Unassigned Floor";
      const rName = asset.room || "Unassigned Room";

      const score = asset.healthScore;
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
      
      // Calculate building inventory hotspots
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

    this.heatmapCache[cacheKey] = tree;
    return tree;
  }
}
