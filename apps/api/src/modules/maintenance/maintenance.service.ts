import { prisma } from "../../database/prisma.js";
import { sharedEventBus } from "@campuscare/shared-utils";
import { BadRequestError, NotFoundError, ConflictError } from "../../utils/errors.js";
import {
  MaintenanceType,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceRecurrence,
  MaintenanceOutcome,
  LifecycleStage,
  AssetStatus,
} from "@campuscare/shared-types";

export class MaintenanceService {
  /**
   * Helper to calculate the next scheduled date based on recurrence
   */
  private static calculateNextDate(currentDate: Date, recurrence: MaintenanceRecurrence): Date {
    const next = new Date(currentDate);
    switch (recurrence) {
      case MaintenanceRecurrence.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case MaintenanceRecurrence.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case MaintenanceRecurrence.QUARTERLY:
        next.setMonth(next.getMonth() + 3);
        break;
      case MaintenanceRecurrence.HALF_YEARLY:
        next.setMonth(next.getMonth() + 6);
        break;
      case MaintenanceRecurrence.ANNUAL:
        next.setFullYear(next.getFullYear() + 1);
        break;
      case MaintenanceRecurrence.ONE_TIME:
      default:
        break;
    }
    return next;
  }

  /**
   * Reusable service method to generate the next recurring record
   */
  static async processRecurringGeneration(scheduleId: string, tx: any = prisma) {
    const schedule = await tx.maintenanceSchedule.findUnique({
      where: { id: scheduleId, isActive: true },
    });

    if (!schedule || schedule.recurrence === MaintenanceRecurrence.ONE_TIME) {
      return;
    }

    // Check if there is already a future SCHEDULED or ASSIGNED record linked to this schedule
    const existingFutureRecord = await tx.maintenanceRecord.findFirst({
      where: {
        scheduleId,
        status: {
          in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.ASSIGNED],
        },
      },
    });

    if (existingFutureRecord) {
      return;
    }

    const nextDate = this.calculateNextDate(schedule.scheduledDate, schedule.recurrence);

    const record = await tx.maintenanceRecord.create({
      data: {
        assetId: schedule.assetId,
        scheduleId: schedule.id,
        type: schedule.type,
        status: MaintenanceStatus.SCHEDULED,
        priority: schedule.priority,
        technicianId: schedule.technicianId,
        scheduledDate: nextDate,
        estimatedDuration: schedule.estimatedDuration,
        notes: `Automatically generated recurring instance from Schedule.`,
      },
    });

    // Update the schedule's next date
    await tx.maintenanceSchedule.update({
      where: { id: schedule.id },
      data: { scheduledDate: nextDate },
    });

    // Create history
    await tx.maintenanceHistory.create({
      data: {
        recordId: record.id,
        status: MaintenanceStatus.SCHEDULED,
        notes: "Recurring maintenance scheduled automatically.",
        performedById: schedule.technicianId || "system", // Fallback to system if no technician
      },
    });

    // Publish event
    sharedEventBus.publish("MaintenanceScheduled", {
      recordId: record.id,
      scheduleId: schedule.id,
      assetId: schedule.assetId,
      scheduledDate: nextDate,
    });
  }

  /**
   * Check if asset can receive maintenance
   */
  private static validateAssetLifecycle(lifecycleStage: LifecycleStage) {
    if (
      lifecycleStage === LifecycleStage.RETIRED ||
      lifecycleStage === LifecycleStage.DISPOSED
    ) {
      throw new BadRequestError("Retired or disposed assets cannot receive maintenance.");
    }
  }

  /**
   * Check for other active maintenance records on this asset
   */
  private static async checkActiveMaintenance(assetId: string, excludeRecordId?: string, tx: any = prisma) {
    const activeRecord = await tx.maintenanceRecord.findFirst({
      where: {
        assetId,
        status: {
          in: [
            MaintenanceStatus.SCHEDULED,
            MaintenanceStatus.ASSIGNED,
            MaintenanceStatus.IN_PROGRESS,
          ],
        },
        id: excludeRecordId ? { not: excludeRecordId } : undefined,
      },
    });

    if (activeRecord) {
      throw new ConflictError(
        `Asset already has an active maintenance record: ${activeRecord.type} (Status: ${activeRecord.status})`
      );
    }
  }

  /**
   * List all records
   */
  static async listRecords(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: MaintenanceStatus;
    priority?: MaintenancePriority;
    type?: MaintenanceType;
    assetId?: string;
    technicianId?: string;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (params.status) where.status = params.status;
    if (params.priority) where.priority = params.priority;
    if (params.type) where.type = params.type;
    if (params.assetId) where.assetId = params.assetId;
    if (params.technicianId) where.technicianId = params.technicianId;

    if (params.search) {
      where.OR = [
        {
          asset: {
            name: { contains: params.search, mode: "insensitive" },
          },
        },
        {
          asset: {
            tag: { contains: params.search, mode: "insensitive" },
          },
        },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.maintenanceRecord.findMany({
        where,
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              assetCode: true,
              tag: true,
              model: true,
              status: true,
              lifecycleStage: true,
            },
          },
          technician: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { scheduledDate: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.maintenanceRecord.count({ where }),
    ]);

    return {
      data: records,
      page,
      pageSize,
      total,
      pageCount: Math.ceil(total / pageSize),
    };
  }

  /**
   * List all schedules
   */
  static async listSchedules(params: { assetId?: string; technicianId?: string }) {
    const where: any = {};
    if (params.assetId) where.assetId = params.assetId;
    if (params.technicianId) where.technicianId = params.technicianId;

    const schedules = await prisma.maintenanceSchedule.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetCode: true,
            tag: true,
          },
        },
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { data: schedules };
  }

  /**
   * Retrieve single record with timeline
   */
  static async getRecord(id: string) {
    const record = await prisma.maintenanceRecord.findUnique({
      where: { id },
      include: {
        asset: {
          include: {
            department: true,
            category: true,
          },
        },
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        history: {
          include: {
            performedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!record) {
      throw new NotFoundError("Maintenance record not found");
    }

    return record;
  }

  /**
   * Create a schedule (and first record)
   */
  static async createSchedule(
    data: {
      assetId: string;
      type: MaintenanceType;
      technicianId?: string | null;
      priority: MaintenancePriority;
      recurrence: MaintenanceRecurrence;
      scheduledDate: string | Date;
      estimatedDuration: number;
      notes?: string | null;
    },
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch asset and validate stage
      const asset = await tx.asset.findUnique({ where: { id: data.assetId } });
      if (!asset) throw new NotFoundError("Asset not found");
      this.validateAssetLifecycle(asset.lifecycleStage as LifecycleStage);

      // 2. Ensure only one active maintenance record
      await this.checkActiveMaintenance(data.assetId, undefined, tx);

      // 3. Create schedule
      const scheduledDate = new Date(data.scheduledDate);
      const schedule = await tx.maintenanceSchedule.create({
        data: {
          assetId: data.assetId,
          type: data.type,
          technicianId: data.technicianId || null,
          priority: data.priority,
          recurrence: data.recurrence,
          scheduledDate,
          estimatedDuration: data.estimatedDuration,
          notes: data.notes,
        },
      });

      // 4. Create first maintenance record
      const record = await tx.maintenanceRecord.create({
        data: {
          assetId: data.assetId,
          scheduleId: schedule.id,
          type: data.type,
          status: MaintenanceStatus.SCHEDULED,
          priority: data.priority,
          technicianId: data.technicianId || null,
          scheduledDate,
          estimatedDuration: data.estimatedDuration,
          notes: data.notes,
        },
      });

      // 5. Create history log
      await tx.maintenanceHistory.create({
        data: {
          recordId: record.id,
          status: MaintenanceStatus.SCHEDULED,
          notes: `Initial maintenance record scheduled. Recurrence: ${data.recurrence}`,
          performedById: userId,
        },
      });

      // 6. Publish event
      sharedEventBus.publish("MaintenanceScheduled", {
        recordId: record.id,
        scheduleId: schedule.id,
        assetId: data.assetId,
        scheduledDate,
        performedBy: userId,
      });

      return schedule;
    });
  }

  /**
   * Assign technician to a maintenance record
   */
  static async assignTechnician(
    recordId: string,
    technicianId: string | null,
    clientUpdatedAt: string | null,
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const record = await tx.maintenanceRecord.findUnique({
        where: { id: recordId },
      });

      if (!record) throw new NotFoundError("Maintenance record not found");

      // Concurrency check
      if (clientUpdatedAt) {
        const clientTime = new Date(clientUpdatedAt).getTime();
        const serverTime = new Date(record.updatedAt).getTime();
        if (Math.abs(serverTime - clientTime) > 1000) {
          throw new ConflictError(
            "Concurrency conflict: The record has been updated by another process. Please refresh."
          );
        }
      }

      // Check status: completed or cancelled cannot be modified
      if (
        record.status === MaintenanceStatus.COMPLETED ||
        record.status === MaintenanceStatus.CANCELLED ||
        record.status === MaintenanceStatus.ARCHIVED
      ) {
        throw new BadRequestError("Cannot assign technician to a terminal maintenance record.");
      }

      const nextStatus =
        record.status === MaintenanceStatus.SCHEDULED && technicianId
          ? MaintenanceStatus.ASSIGNED
          : record.status;

      const updatedRecord = await tx.maintenanceRecord.update({
        where: { id: recordId },
        data: {
          technicianId: technicianId || null,
          status: nextStatus,
        },
      });

      let technicianName = "Unassigned";
      if (technicianId) {
        const tech = await tx.user.findUnique({ where: { id: technicianId } });
        if (tech) technicianName = `${tech.firstName} ${tech.lastName}`;
      }

      await tx.maintenanceHistory.create({
        data: {
          recordId,
          status: nextStatus,
          notes: `Technician updated to: ${technicianName}`,
          performedById: userId,
        },
      });

      sharedEventBus.publish("MaintenanceAssigned", {
        recordId,
        technicianId,
        status: nextStatus,
        performedBy: userId,
      });

      return updatedRecord;
    });
  }

  /**
   * Start executing maintenance (Scheduled/Assigned -> In Progress)
   */
  static async startMaintenance(recordId: string, clientUpdatedAt: string | null, userId: string) {
    return prisma.$transaction(async (tx) => {
      const record = await tx.maintenanceRecord.findUnique({
        where: { id: recordId },
        include: { asset: true },
      });

      if (!record) throw new NotFoundError("Maintenance record not found");

      // Concurrency check
      if (clientUpdatedAt) {
        const clientTime = new Date(clientUpdatedAt).getTime();
        const serverTime = new Date(record.updatedAt).getTime();
        if (Math.abs(serverTime - clientTime) > 1000) {
          throw new ConflictError(
            "Concurrency conflict: The record has been updated by another process. Please refresh."
          );
        }
      }

      if (
        record.status === MaintenanceStatus.COMPLETED ||
        record.status === MaintenanceStatus.CANCELLED ||
        record.status === MaintenanceStatus.ARCHIVED
      ) {
        throw new BadRequestError("Cannot start a terminal maintenance record.");
      }

      this.validateAssetLifecycle(record.asset.lifecycleStage as LifecycleStage);

      // Check if there are other records in progress (double check)
      const inProgressRecord = await tx.maintenanceRecord.findFirst({
        where: {
          assetId: record.assetId,
          status: MaintenanceStatus.IN_PROGRESS,
          id: { not: recordId },
        },
      });

      if (inProgressRecord) {
        throw new ConflictError("Asset is already in an IN_PROGRESS maintenance record.");
      }

      // Update record status
      const updatedRecord = await tx.maintenanceRecord.update({
        where: { id: recordId },
        data: {
          status: MaintenanceStatus.IN_PROGRESS,
          startTime: new Date(),
        },
      });

      // Update asset lifecycle stage & status
      await tx.asset.update({
        where: { id: record.assetId },
        data: {
          status: AssetStatus.MAINTENANCE,
          lifecycleStage: LifecycleStage.MAINTENANCE,
          updatedBy: userId,
        },
      });

      // Insert timeline logs
      await tx.maintenanceHistory.create({
        data: {
          recordId,
          status: MaintenanceStatus.IN_PROGRESS,
          notes: "Maintenance started, asset status updated to MAINTENANCE.",
          performedById: userId,
        },
      });

      await tx.assetHistory.create({
        data: {
          assetId: record.assetId,
          actionType: "MAINTENANCE",
          notes: `Asset entered maintenance cycle (Record ID: ${recordId}).`,
          performedById: userId,
        },
      });

      sharedEventBus.publish("MaintenanceStarted", {
        recordId,
        assetId: record.assetId,
        performedBy: userId,
      });

      return updatedRecord;
    });
  }

  /**
   * Complete maintenance execution
   */
  static async completeMaintenance(
    recordId: string,
    data: {
      actualDuration: number;
      completionNotes?: string | null;
      outcome: MaintenanceOutcome;
      clientUpdatedAt: string | null;
    },
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const record = await tx.maintenanceRecord.findUnique({
        where: { id: recordId },
        include: { asset: true },
      });

      if (!record) throw new NotFoundError("Maintenance record not found");

      // Concurrency check
      if (data.clientUpdatedAt) {
        const clientTime = new Date(data.clientUpdatedAt).getTime();
        const serverTime = new Date(record.updatedAt).getTime();
        if (Math.abs(serverTime - clientTime) > 1000) {
          throw new ConflictError(
            "Concurrency conflict: The record has been updated by another process. Please refresh."
          );
        }
      }

      if (record.status !== MaintenanceStatus.IN_PROGRESS) {
        throw new BadRequestError("Only maintenance records IN_PROGRESS can be completed.");
      }

      const now = new Date();

      // Update record to COMPLETED
      const updatedRecord = await tx.maintenanceRecord.update({
        where: { id: recordId },
        data: {
          status: MaintenanceStatus.COMPLETED,
          endTime: now,
          actualDuration: data.actualDuration,
          completionNotes: data.completionNotes,
          outcome: data.outcome,
        },
      });

      // Update asset back to operational & available
      await tx.asset.update({
        where: { id: record.assetId },
        data: {
          status: AssetStatus.OPERATIONAL,
          lifecycleStage: LifecycleStage.AVAILABLE,
          updatedBy: userId,
        },
      });

      // Create history logs
      await tx.maintenanceHistory.create({
        data: {
          recordId,
          status: MaintenanceStatus.COMPLETED,
          notes: `Maintenance completed successfully. Outcome: ${data.outcome}. Notes: ${data.completionNotes || "None"}`,
          performedById: userId,
        },
      });

      await tx.assetHistory.create({
        data: {
          assetId: record.assetId,
          actionType: "MAINTENANCE",
          notes: `Asset maintenance completed. Outcome: ${data.outcome}. Status updated back to OPERATIONAL.`,
          performedById: userId,
        },
      });

      sharedEventBus.publish("MaintenanceCompleted", {
        recordId,
        assetId: record.assetId,
        outcome: data.outcome,
        performedBy: userId,
      });

      // Auto-generate next recurring run if it has a schedule
      if (record.scheduleId) {
        await this.processRecurringGeneration(record.scheduleId, tx);
      }

      return updatedRecord;
    });
  }

  /**
   * Cancel maintenance record
   */
  static async cancelMaintenance(
    recordId: string,
    data: {
      cancellationReason: string;
      clientUpdatedAt: string | null;
    },
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const record = await tx.maintenanceRecord.findUnique({
        where: { id: recordId },
        include: { asset: true },
      });

      if (!record) throw new NotFoundError("Maintenance record not found");

      // Concurrency check
      if (data.clientUpdatedAt) {
        const clientTime = new Date(data.clientUpdatedAt).getTime();
        const serverTime = new Date(record.updatedAt).getTime();
        if (Math.abs(serverTime - clientTime) > 1000) {
          throw new ConflictError(
            "Concurrency conflict: The record has been updated by another process. Please refresh."
          );
        }
      }

      if (
        record.status === MaintenanceStatus.COMPLETED ||
        record.status === MaintenanceStatus.CANCELLED ||
        record.status === MaintenanceStatus.ARCHIVED
      ) {
        throw new BadRequestError("Cannot cancel an already completed or cancelled maintenance record.");
      }

      // Update record to CANCELLED
      const updatedRecord = await tx.maintenanceRecord.update({
        where: { id: recordId },
        data: {
          status: MaintenanceStatus.CANCELLED,
          cancellationReason: data.cancellationReason,
        },
      });

      // If the asset was in MAINTENANCE status, revert it back
      if (record.status === MaintenanceStatus.IN_PROGRESS) {
        await tx.asset.update({
          where: { id: record.assetId },
          data: {
            status: AssetStatus.OPERATIONAL,
            lifecycleStage: LifecycleStage.AVAILABLE,
            updatedBy: userId,
          },
        });

        await tx.assetHistory.create({
          data: {
            assetId: record.assetId,
            actionType: "MAINTENANCE",
            notes: `Asset maintenance record cancelled. Status reverted to OPERATIONAL. Reason: ${data.cancellationReason}`,
            performedById: userId,
          },
        });
      }

      await tx.maintenanceHistory.create({
        data: {
          recordId,
          status: MaintenanceStatus.CANCELLED,
          notes: `Maintenance record cancelled. Reason: ${data.cancellationReason}`,
          performedById: userId,
        },
      });

      sharedEventBus.publish("MaintenanceCancelled", {
        recordId,
        assetId: record.assetId,
        reason: data.cancellationReason,
        performedBy: userId,
      });

      // Recurring check
      if (record.scheduleId) {
        await this.processRecurringGeneration(record.scheduleId, tx);
      }

      return updatedRecord;
    });
  }

  /**
   * Get Active Technicians for dialog selector
   */
  static async getTechnicians() {
    const techs = await prisma.user.findMany({
      where: {
        role: { name: "TECHNICIAN" },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    return techs;
  }

  /**
   * Get Dashboard overview metrics
   */
  static async getSummary() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [scheduledToday, upcoming, overdue, inProgress, completed, assetSummary] = await Promise.all([
      // Scheduled/Assigned today
      prisma.maintenanceRecord.count({
        where: {
          status: { in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.ASSIGNED] },
          scheduledDate: { gte: startOfToday, lte: endOfToday },
        },
      }),
      // Upcoming (future days)
      prisma.maintenanceRecord.count({
        where: {
          status: { in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.ASSIGNED] },
          scheduledDate: { gt: endOfToday },
        },
      }),
      // Overdue (scheduledDate in past, still Scheduled/Assigned)
      prisma.maintenanceRecord.count({
        where: {
          status: { in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.ASSIGNED] },
          scheduledDate: { lt: now },
        },
      }),
      // In Progress
      prisma.maintenanceRecord.count({
        where: { status: MaintenanceStatus.IN_PROGRESS },
      }),
      // Completed in the past 30 days
      prisma.maintenanceRecord.count({
        where: {
          status: MaintenanceStatus.COMPLETED,
          endTime: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      // Total assets in maintenance status
      prisma.asset.count({
        where: { status: AssetStatus.MAINTENANCE },
      }),
    ]);

    return {
      scheduledToday,
      upcoming,
      overdue,
      inProgress,
      completed,
      assetSummary,
    };
  }

  /**
   * Run manual background checks (Self-healing recurring generation)
   */
  static async runAutomationChecks() {
    const activeSchedules = await prisma.maintenanceSchedule.findMany({
      where: { isActive: true },
    });

    let count = 0;
    for (const schedule of activeSchedules) {
      // For each schedule, see if there is any pending record
      const pendingRecord = await prisma.maintenanceRecord.findFirst({
        where: {
          scheduleId: schedule.id,
          status: {
            in: [
              MaintenanceStatus.SCHEDULED,
              MaintenanceStatus.ASSIGNED,
              MaintenanceStatus.IN_PROGRESS,
            ],
          },
        },
      });

      if (!pendingRecord) {
        // Generate next recurring record
        await prisma.$transaction(async (tx) => {
          await this.processRecurringGeneration(schedule.id, tx);
        });
        count++;
      }
    }

    return { generatedCount: count };
  }

  static async bulkSchedule(data: {
    assetIds: string[];
    type: MaintenanceType;
    technicianId?: string | null;
    priority: MaintenancePriority;
    recurrence: MaintenanceRecurrence;
    scheduledDate: string | Date;
    estimatedDuration: number;
    notes?: string | null;
  }, userId: string) {
    return prisma.$transaction(async (tx) => {
      const results = [];
      const scheduledDate = new Date(data.scheduledDate);
      
      for (const assetId of data.assetIds) {
        const asset = await tx.asset.findUnique({ where: { id: assetId } });
        if (!asset) throw new NotFoundError(`Asset not found: ${assetId}`);
        this.validateAssetLifecycle(asset.lifecycleStage as LifecycleStage);

        await this.checkActiveMaintenance(assetId, undefined, tx);

        const schedule = await tx.maintenanceSchedule.create({
          data: {
            assetId,
            type: data.type,
            technicianId: data.technicianId || null,
            priority: data.priority,
            recurrence: data.recurrence,
            scheduledDate,
            estimatedDuration: data.estimatedDuration,
            notes: data.notes,
          },
        });

        const record = await tx.maintenanceRecord.create({
          data: {
            assetId,
            scheduleId: schedule.id,
            type: data.type,
            status: data.technicianId ? MaintenanceStatus.ASSIGNED : MaintenanceStatus.SCHEDULED,
            priority: data.priority,
            technicianId: data.technicianId || null,
            scheduledDate,
            estimatedDuration: data.estimatedDuration,
            notes: data.notes,
          },
        });

        await tx.maintenanceHistory.create({
          data: {
            recordId: record.id,
            status: data.technicianId ? MaintenanceStatus.ASSIGNED : MaintenanceStatus.SCHEDULED,
            notes: `Bulk scheduled maintenance task. Recurrence: ${data.recurrence}`,
            performedById: userId,
          },
        });

        sharedEventBus.publish("MaintenanceScheduled", {
          recordId: record.id,
          scheduleId: schedule.id,
          assetId,
          scheduledDate,
          performedBy: userId,
        });

        results.push(schedule);
      }
      return results;
    });
  }

  static async bulkAssignTechnicians(
    recordIds: string[],
    technicianId: string | null,
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const results = [];
      let technicianName = "Unassigned";
      if (technicianId) {
        const tech = await tx.user.findUnique({ where: { id: technicianId } });
        if (tech) technicianName = `${tech.firstName} ${tech.lastName}`;
      }

      for (const recordId of recordIds) {
        const record = await tx.maintenanceRecord.findUnique({
          where: { id: recordId },
        });
        if (!record) throw new NotFoundError(`Maintenance record not found: ${recordId}`);

        if (
          record.status === MaintenanceStatus.COMPLETED ||
          record.status === MaintenanceStatus.CANCELLED ||
          record.status === MaintenanceStatus.ARCHIVED
        ) {
          throw new BadRequestError(`Cannot assign technician to a terminal maintenance record: ${recordId}`);
        }

        const nextStatus =
          record.status === MaintenanceStatus.SCHEDULED && technicianId
            ? MaintenanceStatus.ASSIGNED
            : record.status;

        const updatedRecord = await tx.maintenanceRecord.update({
          where: { id: recordId },
          data: {
            technicianId: technicianId || null,
            status: nextStatus,
          },
        });

        await tx.maintenanceHistory.create({
          data: {
            recordId,
            status: nextStatus,
            notes: `Bulk technician updated to: ${technicianName}`,
            performedById: userId,
          },
        });

        sharedEventBus.publish("MaintenanceAssigned", {
          recordId,
          technicianId,
          status: nextStatus,
          performedBy: userId,
        });

        results.push(updatedRecord);
      }
      return results;
    });
  }
}
export default MaintenanceService;
