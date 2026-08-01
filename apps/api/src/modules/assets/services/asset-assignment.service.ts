import { prisma } from "../../../database/prisma.js";
import { LifecycleStage, AssignmentStatus } from "@campuscare/shared-types";

export class AssetAssignmentService {
  static async assign(
    assetId: string,
    data: {
      assigneeType: "USER" | "DEPARTMENT" | "LOCATION";
      userId?: string | null;
      departmentId?: string | null;
      location?: string | null;
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

      // 1. Business Rule: Cannot assign retired/disposed assets.
      if (asset.lifecycleStage === LifecycleStage.RETIRED || asset.lifecycleStage === LifecycleStage.DISPOSED) {
        throw new Error(`Cannot assign asset in terminal lifecycle stage '${asset.lifecycleStage}'.`);
      }

      // 2. Optimistic Concurrency Protection
      if (data.clientUpdatedAt) {
        const clientDate = new Date(data.clientUpdatedAt).getTime();
        const serverDate = new Date(asset.updatedAt).getTime();
        // Allow a small tolerance (e.g. 1000ms) for string format conversions
        if (Math.abs(serverDate - clientDate) > 1000) {
          throw new Error("Concurrency conflict: The asset has been modified by another process. Please refresh the page and try again.");
        }
      }

      // 3. Business Rule: Only one active assignment at a time.
      const activeAssignment = await tx.assetAssignment.findFirst({
        where: {
          assetId,
          status: AssignmentStatus.ACTIVE
        }
      });
      if (activeAssignment) {
        throw new Error("Asset already has an active assignment. Please return or transfer it first.");
      }

      // Resolve assignee name for history logging
      let assigneeName = "";
      if (data.assigneeType === "USER") {
        if (!data.userId) throw new Error("userId is required for USER assignment.");
        const user = await tx.user.findUnique({ where: { id: data.userId } });
        if (!user) throw new Error("Assignee user not found.");
        assigneeName = `${user.firstName} ${user.lastName}`;
      } else if (data.assigneeType === "DEPARTMENT") {
        if (!data.departmentId) throw new Error("departmentId is required for DEPARTMENT assignment.");
        const dept = await tx.department.findUnique({ where: { id: data.departmentId } });
        if (!dept) throw new Error("Assignee department not found.");
        assigneeName = dept.name;
      } else if (data.assigneeType === "LOCATION") {
        if (!data.location) throw new Error("Location text is required for LOCATION assignment.");
        assigneeName = data.location;
      }

      // Create new AssetAssignment
      const assignment = await tx.assetAssignment.create({
        data: {
          assetId,
          assigneeType: data.assigneeType,
          userId: data.userId || null,
          departmentId: data.departmentId || null,
          location: data.location || null,
          status: AssignmentStatus.ACTIVE,
          assignedById: userId,
          notes: data.notes || null,
        }
      });

      // Update Asset lifecycle stage
      const updatedAsset = await tx.asset.update({
        where: { id: assetId },
        data: {
          lifecycleStage: LifecycleStage.ASSIGNED,
          updatedBy: userId
        }
      });

      // Record history
      await tx.assetHistory.create({
        data: {
          assetId,
          actionType: "ASSIGNED",
          notes: `Asset assigned to ${data.assigneeType} (${assigneeName}). Notes: ${data.notes || "None"}`,
          performedById: userId
        }
      });

      return { assignment, asset: updatedAsset };
    });
  }

  static async returnAsset(
    assetId: string,
    payload: {
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

      // Optimistic Concurrency Protection
      if (payload.clientUpdatedAt) {
        const clientDate = new Date(payload.clientUpdatedAt).getTime();
        const serverDate = new Date(asset.updatedAt).getTime();
        if (Math.abs(serverDate - clientDate) > 1000) {
          throw new Error("Concurrency conflict: The asset has been modified by another process. Please refresh the page and try again.");
        }
      }

      // Find active assignment
      const activeAssignment = await tx.assetAssignment.findFirst({
        where: {
          assetId,
          status: AssignmentStatus.ACTIVE
        }
      });
      if (!activeAssignment) {
        throw new Error("Asset is not currently assigned.");
      }

      // Update assignment
      await tx.assetAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          status: AssignmentStatus.RETURNED,
          returnedAt: new Date(),
          notes: payload.notes ? `${activeAssignment.notes || ""}\nReturn Notes: ${payload.notes}` : activeAssignment.notes
        }
      });

      // Update Asset
      const updatedAsset = await tx.asset.update({
        where: { id: assetId },
        data: {
          lifecycleStage: LifecycleStage.AVAILABLE,
          updatedBy: userId
        }
      });

      // Record history
      await tx.assetHistory.create({
        data: {
          assetId,
          actionType: "RETURNED",
          notes: `Asset returned. Notes: ${payload.notes || "None"}`,
          performedById: userId
        }
      });

      return updatedAsset;
    });
  }
}
