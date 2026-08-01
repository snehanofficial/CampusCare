import { sharedEventBus } from "@campuscare/shared-utils";
import { HealthService } from "../services/health.service.js";
import { logger } from "../../../utils/logger.js";
import { prisma } from "../../../database/prisma.js";

let isInitialized = false;

export function initHealthEventListeners(): void {
  if (isInitialized) return;
  isInitialized = true;

  logger.info("Initializing Health Engine Event Listeners...");

  // Invalidate cache on domain events
  sharedEventBus.subscribe("AssetHealthUpdated", () => {
    HealthService.clearAggregationCache();
  });

  sharedEventBus.subscribe("HeatmapUpdated", () => {
    HealthService.clearAggregationCache();
  });

  sharedEventBus.subscribe("HealthRecalculationCompleted", () => {
    HealthService.clearAggregationCache();
  });

  // Recalculate on Asset creation, updates, and transfers
  sharedEventBus.subscribe("AssetCreated", async (payload) => {
    logger.debug("Health listener: AssetCreated event received.", payload);
    if (payload?.assetId) {
      await HealthService.recalculateAssetHealth(payload.assetId);
    }
  });

  sharedEventBus.subscribe("AssetUpdated", async (payload) => {
    logger.debug("Health listener: AssetUpdated event received.", payload);
    // Avoid recursive recalculation if only healthScore or healthStatus is updated
    if (payload?.assetId) {
      const fields = Object.keys(payload.updatedFields || {});
      const hasOtherChanges = fields.some(f => f !== "healthScore" && f !== "healthStatus" && f !== "prevHealthScore");
      if (hasOtherChanges || fields.length === 0) {
        await HealthService.recalculateAssetHealth(payload.assetId);
      }
    }
  });

  sharedEventBus.subscribe("AssetDeleted", async (payload) => {
    logger.debug("Health listener: AssetDeleted event received.", payload);
    HealthService.clearAggregationCache();
    sharedEventBus.publish("HeatmapUpdated", { timestamp: new Date().toISOString() });
  });

  sharedEventBus.subscribe("AssetTransferred", async (payload) => {
    logger.debug("Health listener: AssetTransferred event received.", payload);
    if (payload?.assetId) {
      await HealthService.recalculateAssetHealth(payload.assetId);
    }
  });

  // Recalculate on Maintenance updates
  sharedEventBus.subscribe("MaintenanceScheduled", async (payload) => {
    logger.debug("Health listener: MaintenanceScheduled event received.", payload);
    if (payload?.assetId) {
      await HealthService.recalculateAssetHealth(payload.assetId);
    }
  });

  sharedEventBus.subscribe("MaintenanceAssigned", async (payload) => {
    logger.debug("Health listener: MaintenanceAssigned event received.", payload);
    if (payload?.assetId) {
      await HealthService.recalculateAssetHealth(payload.assetId);
    }
  });

  sharedEventBus.subscribe("MaintenanceStarted", async (payload) => {
    logger.debug("Health listener: MaintenanceStarted event received.", payload);
    if (payload?.assetId) {
      await HealthService.recalculateAssetHealth(payload.assetId);
    }
  });

  sharedEventBus.subscribe("MaintenanceCompleted", async (payload) => {
    logger.debug("Health listener: MaintenanceCompleted event received.", payload);
    if (payload?.assetId) {
      await HealthService.recalculateAssetHealth(payload.assetId);
    }
  });

  sharedEventBus.subscribe("MaintenanceCancelled", async (payload) => {
    logger.debug("Health listener: MaintenanceCancelled event received.", payload);
    if (payload?.assetId) {
      await HealthService.recalculateAssetHealth(payload.assetId);
    }
  });

  // Recalculate on Inventory consumed for maintenance
  sharedEventBus.subscribe("inventory:consumed_for_maintenance", async (payload) => {
    logger.debug("Health listener: inventory:consumed_for_maintenance event received.", payload);
    if (payload?.maintenanceRecordId) {
      try {
        const record = await prisma.maintenanceRecord.findUnique({
          where: { id: payload.maintenanceRecordId },
          select: { assetId: true }
        });
        if (record?.assetId) {
          await HealthService.recalculateAssetHealth(record.assetId);
        }
      } catch (err) {
        logger.error(err as any, "Error looking up asset for inventory consumption event");
      }
    }
  });
}
