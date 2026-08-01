import { prisma } from "../../../database/prisma.js";
import { LifecycleStage, AssignmentStatus, AssetStatus } from "@campuscare/shared-types";
import { sharedEventBus } from "@campuscare/shared-utils";

export class AssetLifecycleService {
  // State transition matrix definition
  private static readonly VALID_LIFECYCLE_TRANSITIONS: Record<LifecycleStage, LifecycleStage[]> = {
    [LifecycleStage.PROCURED]: [LifecycleStage.AVAILABLE, LifecycleStage.RETIRED, LifecycleStage.DISPOSED],
    [LifecycleStage.AVAILABLE]: [LifecycleStage.ASSIGNED, LifecycleStage.IN_USE, LifecycleStage.MAINTENANCE, LifecycleStage.RETIRED],
    [LifecycleStage.ASSIGNED]: [LifecycleStage.IN_USE, LifecycleStage.RETURNED, LifecycleStage.MAINTENANCE, LifecycleStage.RETIRED],
    [LifecycleStage.IN_USE]: [LifecycleStage.RETURNED, LifecycleStage.MAINTENANCE, LifecycleStage.RETIRED],
    [LifecycleStage.MAINTENANCE]: [LifecycleStage.AVAILABLE, LifecycleStage.ASSIGNED, LifecycleStage.IN_USE, LifecycleStage.RETIRED],
    [LifecycleStage.RETURNED]: [LifecycleStage.AVAILABLE, LifecycleStage.ASSIGNED, LifecycleStage.IN_USE, LifecycleStage.RETIRED, LifecycleStage.DISPOSED],
    [LifecycleStage.RETIRED]: [LifecycleStage.DISPOSED],
    [LifecycleStage.DISPOSED]: [],
    [LifecycleStage.RESERVED]: [LifecycleStage.AVAILABLE, LifecycleStage.ASSIGNED, LifecycleStage.IN_USE, LifecycleStage.RETIRED],
  };

  static async transfer(
    assetId: string,
    data: {
      transferType: "USER" | "DEPARTMENT" | "LOCATION";
      userId?: string | null;
      departmentId?: string | null;
      location?: string | null;
      building?: string | null;
      floor?: string | null;
      room?: string | null;
      notes?: string | null;
      clientUpdatedAt?: string | null;
    },
    userId: string
  ) {
    let fromInfo: any = null;
    let toInfo: any = null;

    const result = await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({
        where: { id: assetId }
      });

      if (!asset || !asset.isActive) {
        throw new Error("Asset not found or is inactive.");
      }

      // Optimistic Concurrency Protection
      if (data.clientUpdatedAt) {
        const clientDate = new Date(data.clientUpdatedAt).getTime();
        const serverDate = new Date(asset.updatedAt).getTime();
        if (Math.abs(serverDate - clientDate) > 1000) {
          throw new Error("Concurrency conflict: The asset has been modified by another process. Please refresh the page and try again.");
        }
      }

      // 1. Close current active assignment if any
      const activeAssignment = await tx.assetAssignment.findFirst({
        where: {
          assetId,
          status: AssignmentStatus.ACTIVE
        }
      });

      if (activeAssignment) {
        await tx.assetAssignment.update({
          where: { id: activeAssignment.id },
          data: {
            status: AssignmentStatus.TRANSFERRED,
            returnedAt: new Date(),
            notes: data.notes ? `Transferred. notes: ${data.notes}` : "Transferred"
          }
        });
        fromInfo = {
          assigneeType: activeAssignment.assigneeType,
          userId: activeAssignment.userId,
          departmentId: activeAssignment.departmentId,
          location: activeAssignment.location
        };
      } else {
        fromInfo = { unassigned: true };
      }

      // 2. Open new assignment
      let assigneeName = "";
      if (data.transferType === "USER") {
        if (!data.userId) throw new Error("userId is required for USER transfer.");
        const user = await tx.user.findUnique({ where: { id: data.userId } });
        if (!user) throw new Error("Target user not found.");
        assigneeName = `${user.firstName} ${user.lastName}`;
        toInfo = { userId: data.userId };
      } else if (data.transferType === "DEPARTMENT") {
        if (!data.departmentId) throw new Error("departmentId is required for DEPARTMENT transfer.");
        const dept = await tx.department.findUnique({ where: { id: data.departmentId } });
        if (!dept) throw new Error("Target department not found.");
        assigneeName = dept.name;
        toInfo = { departmentId: data.departmentId };
      } else if (data.transferType === "LOCATION") {
        if (!data.location) throw new Error("Location text is required for LOCATION transfer.");
        assigneeName = data.location;
        toInfo = { location: data.location };
      }

      const newAssignment = await tx.assetAssignment.create({
        data: {
          assetId,
          assigneeType: data.transferType,
          userId: data.userId || null,
          departmentId: data.departmentId || null,
          location: data.location || null,
          status: AssignmentStatus.ACTIVE,
          assignedById: userId,
          notes: data.notes || null,
        }
      });

      // 3. Update Asset columns
      const updateData: any = {
        lifecycleStage: LifecycleStage.ASSIGNED,
        updatedBy: userId
      };

      if (data.transferType === "DEPARTMENT") {
        updateData.departmentId = data.departmentId;
      } else if (data.transferType === "LOCATION") {
        updateData.location = data.location;
        updateData.building = data.building || null;
        updateData.floor = data.floor || null;
        updateData.room = data.room || null;
      }

      const updatedAsset = await tx.asset.update({
        where: { id: assetId },
        data: updateData
      });

      // 4. Record history
      await tx.assetHistory.create({
        data: {
          assetId,
          actionType: "TRANSFERRED",
          notes: `Asset transferred via ${data.transferType} to ${assigneeName}. Notes: ${data.notes || "None"}`,
          performedById: userId
        }
      });

      return { asset: updatedAsset, assignment: newAssignment };
    });

    // Publish AssetTransferred event outside transaction boundary
    sharedEventBus.publish("AssetTransferred", {
      assetId,
      from: fromInfo,
      to: toInfo,
      type: data.transferType,
      performedBy: userId
    });

    return result;
  }

  static async changeLifecycle(
    assetId: string,
    data: {
      lifecycleStage: LifecycleStage;
      notes?: string | null;
      clientUpdatedAt?: string | null;
    },
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({
        where: { id: assetId }
      });

      if (!asset || !asset.isActive) {
        throw new Error("Asset not found or is inactive.");
      }

      // 1. Validate State Transition using State Matrix
      const validDestinations = AssetLifecycleService.VALID_LIFECYCLE_TRANSITIONS[asset.lifecycleStage as LifecycleStage];
      if (!validDestinations.includes(data.lifecycleStage)) {
        throw new Error(`Invalid lifecycle transition: Cannot change stage from '${asset.lifecycleStage}' to '${data.lifecycleStage}'.`);
      }

      // 2. Optimistic Concurrency Protection
      if (data.clientUpdatedAt) {
        const clientDate = new Date(data.clientUpdatedAt).getTime();
        const serverDate = new Date(asset.updatedAt).getTime();
        if (Math.abs(serverDate - clientDate) > 1000) {
          throw new Error("Concurrency conflict: The asset has been modified by another process. Please refresh the page and try again.");
        }
      }

      const updateData: any = {
        lifecycleStage: data.lifecycleStage,
        updatedBy: userId
      };

      // 3. If target stage is RETIRED or DISPOSED, auto-close active assignment and change status
      if (data.lifecycleStage === LifecycleStage.RETIRED || data.lifecycleStage === LifecycleStage.DISPOSED) {
        updateData.status = AssetStatus.DECOMMISSIONED;

        const activeAssignment = await tx.assetAssignment.findFirst({
          where: {
            assetId,
            status: AssignmentStatus.ACTIVE
          }
        });

        if (activeAssignment) {
          await tx.assetAssignment.update({
            where: { id: activeAssignment.id },
            data: {
              status: AssignmentStatus.RETURNED,
              returnedAt: new Date(),
              notes: `Auto-closed due to asset lifecycle transition to ${data.lifecycleStage}.`
            }
          });
        }
      }

      const updatedAsset = await tx.asset.update({
        where: { id: assetId },
        data: updateData
      });

      // 4. Record history
      await tx.assetHistory.create({
        data: {
          assetId,
          actionType: "LIFECYCLE_CHANGED",
          notes: `Lifecycle stage manually changed from '${asset.lifecycleStage}' to '${data.lifecycleStage}'. Notes: ${data.notes || "None"}`,
          performedById: userId
        }
      });

      return updatedAsset;
    });
  }
}
