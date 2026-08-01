import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";
import { AssetCodeGenerator } from "./services/asset-code-generator.js";
import { sharedEventBus } from "@campuscare/shared-utils";
import { AssetStatus, LifecycleStage, HealthStatus } from "@campuscare/shared-types";
import { Prisma } from "@prisma/client";

export class AssetsService {
  // ---------------------------------------------------------
  // Core Asset CRUD
  // ---------------------------------------------------------

  static async list(params: {
    search?: string;
    status?: AssetStatus;
    lifecycleStage?: LifecycleStage;
    healthStatus?: HealthStatus;
    categoryId?: string;
    departmentId?: string;
    building?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.AssetWhereInput = {
      isActive: true,
    };

    if (params.search) {
      const q = params.search;
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { assetCode: { contains: q, mode: "insensitive" } },
        { tag: { contains: q, mode: "insensitive" } },
        { serialNumber: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { manufacturer: { contains: q, mode: "insensitive" } },
      ];
    }

    if (params.status) where.status = params.status;
    if (params.lifecycleStage) where.lifecycleStage = params.lifecycleStage;
    if (params.healthStatus) where.healthStatus = params.healthStatus;
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.departmentId) where.departmentId = params.departmentId;
    if (params.building) where.building = { contains: params.building, mode: "insensitive" };

    logger.debug({ where, skip, take: pageSize }, "AssetsService.list executing query");

    const [total, data] = await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          department: {
            select: { id: true, name: true, code: true }
          },
          category: {
            select: { id: true, name: true }
          }
        }
      })
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize)
    };
  }

  static async get(id: string) {
    const asset = await prisma.asset.findFirst({
      where: { id, isActive: true },
      include: {
        department: true,
        category: true,
        history: {
          orderBy: { createdAt: "desc" },
          include: {
            performedBy: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        },
        tickets: {
          orderBy: { createdAt: "desc" },
          include: {
            creator: { select: { firstName: true, lastName: true } },
            assignee: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    if (!asset) {
      throw new Error("Asset not found or is inactive");
    }

    return asset;
  }

  static async create(data: any, userId: string) {
    // 1. Validations
    if (data.tag) {
      const existingTag = await prisma.asset.findUnique({ where: { tag: data.tag } });
      if (existingTag) throw new Error(`Asset tag '${data.tag}' is already registered.`);
    }

    if (data.serialNumber) {
      const existingSerial = await prisma.asset.findUnique({ where: { serialNumber: data.serialNumber } });
      if (existingSerial) throw new Error(`Serial number '${data.serialNumber}' is already registered.`);
    }

    // Verify Department
    const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!department) throw new Error("Department not found");

    // Verify Category
    if (data.categoryId) {
      const cat = await prisma.assetCategory.findFirst({ where: { id: data.categoryId, isActive: true } });
      if (!cat) throw new Error("Asset Category not found");
    }

    // Generate unique code if not set
    const assetCode = data.assetCode || (await AssetCodeGenerator.generateCode());

    // 2. Transaction
    const asset = await prisma.$transaction(async (tx) => {
      const newAsset = await tx.asset.create({
        data: {
          name: data.name,
          assetCode,
          tag: data.tag,
          qrCodeId: data.qrCodeId || data.tag,
          serialNumber: data.serialNumber || null,
          model: data.model,
          manufacturer: data.manufacturer || null,
          status: data.status || AssetStatus.OPERATIONAL,
          lifecycleStage: data.lifecycleStage || LifecycleStage.PROCURED,
          healthStatus: data.healthStatus || HealthStatus.HEALTHY,
          location: data.location,
          building: data.building || null,
          floor: data.floor || null,
          room: data.room || null,
          purchaseOrderNumber: data.purchaseOrderNumber || null,
          vendorId: data.vendorId || null,
          purchasePrice: data.purchasePrice ? new Prisma.Decimal(data.purchasePrice) : null,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
          warrantyStart: data.warrantyStart ? new Date(data.warrantyStart) : null,
          warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
          contractNumber: data.contractNumber || null,
          departmentId: data.departmentId,
          categoryId: data.categoryId || null,
          createdBy: userId,
        }
      });

      await tx.assetHistory.create({
        data: {
          assetId: newAsset.id,
          actionType: "CREATED",
          notes: `Asset registered in database with asset code ${newAsset.assetCode}.`,
          performedById: userId
        }
      });

      return newAsset;
    });

    sharedEventBus.publish("AssetCreated", { assetId: asset.id, assetCode: asset.assetCode, performedBy: userId });
    return asset;
  }

  static async update(id: string, data: any, userId: string) {
    const existing = await prisma.asset.findFirst({ where: { id, isActive: true } });
    if (!existing) throw new Error("Asset not found");

    // Immutable code check
    if (data.assetCode && data.assetCode !== existing.assetCode) {
      throw new Error("Asset code is immutable once set.");
    }

    // State conflict check
    const status = data.status || existing.status;
    const lifecycleStage = data.lifecycleStage || existing.lifecycleStage;

    if (
      (lifecycleStage === LifecycleStage.ASSIGNED || lifecycleStage === LifecycleStage.IN_USE) &&
      (status === AssetStatus.BROKEN || status === AssetStatus.DECOMMISSIONED)
    ) {
      throw new Error(`Cannot assign or place asset in-use when its status is ${status}.`);
    }

    // Uniqueness checks
    if (data.tag && data.tag !== existing.tag) {
      const duplicateTag = await prisma.asset.findUnique({ where: { tag: data.tag } });
      if (duplicateTag) throw new Error(`Asset tag '${data.tag}' is already in use.`);
    }

    if (data.serialNumber && data.serialNumber !== existing.serialNumber) {
      const duplicateSerial = await prisma.asset.findUnique({ where: { serialNumber: data.serialNumber } });
      if (duplicateSerial) throw new Error(`Serial number '${data.serialNumber}' is already in use.`);
    }

    // Lifecycle cascade
    let finalStatus = status;
    if (lifecycleStage === LifecycleStage.RETIRED || lifecycleStage === LifecycleStage.DISPOSED) {
      finalStatus = AssetStatus.DECOMMISSIONED;
    }

    const updatedAsset = await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.update({
        where: { id },
        data: {
          name: data.name,
          tag: data.tag,
          qrCodeId: data.qrCodeId,
          serialNumber: data.serialNumber,
          model: data.model,
          manufacturer: data.manufacturer,
          status: finalStatus,
          lifecycleStage,
          healthStatus: data.healthStatus,
          location: data.location,
          building: data.building,
          floor: data.floor,
          room: data.room,
          purchaseOrderNumber: data.purchaseOrderNumber,
          vendorId: data.vendorId,
          purchasePrice: data.purchasePrice ? new Prisma.Decimal(data.purchasePrice) : undefined,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
          warrantyStart: data.warrantyStart ? new Date(data.warrantyStart) : undefined,
          warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : undefined,
          contractNumber: data.contractNumber,
          departmentId: data.departmentId,
          categoryId: data.categoryId,
          updatedBy: userId,
        }
      });

      // Construct activity history notes
      const notes = Object.keys(data)
        .filter((key) => data[key] !== undefined && (existing as any)[key] !== data[key])
        .map((key) => `Modified ${key} from ${(existing as any)[key]} to ${data[key]}`)
        .join("; ");

      await tx.assetHistory.create({
        data: {
          assetId: id,
          actionType: "STATUS_CHANGE",
          notes: notes || "Asset details modified manually.",
          performedById: userId
        }
      });

      return asset;
    });

    sharedEventBus.publish("AssetUpdated", { assetId: id, updatedFields: data, performedBy: userId });
    return updatedAsset;
  }

  static async delete(id: string, userId: string) {
    const existing = await prisma.asset.findFirst({ where: { id, isActive: true } });
    if (!existing) throw new Error("Asset not found");

    await prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id },
        data: {
          isActive: false,
          status: AssetStatus.DECOMMISSIONED,
          lifecycleStage: LifecycleStage.RETIRED,
          updatedBy: userId
        }
      });

      await tx.assetHistory.create({
        data: {
          assetId: id,
          actionType: "RETIRED",
          notes: "Asset soft deleted (decommissioned and deactivated).",
          performedById: userId
        }
      });
    });

    sharedEventBus.publish("AssetDeleted", { assetId: id, performedBy: userId });
    return true;
  }

  // ---------------------------------------------------------
  // Asset Category Services
  // ---------------------------------------------------------

  static async listCategories() {
    return prisma.assetCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" }
    });
  }

  static async createCategory(data: any) {
    const existing = await prisma.assetCategory.findFirst({
      where: { name: data.name, isActive: true }
    });
    if (existing) throw new Error("An active asset category with this name already exists.");

    return prisma.assetCategory.create({
      data: {
        name: data.name,
        description: data.description || null
      }
    });
  }

  static async updateCategory(id: string, data: any) {
    return prisma.assetCategory.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description
      }
    });
  }

  static async deleteCategory(id: string) {
    // Soft delete category
    await prisma.assetCategory.update({
      where: { id },
      data: { isActive: false }
    });
    return true;
  }

  // ---------------------------------------------------------
  // Bulk Operations Foundation
  // ---------------------------------------------------------

  static async bulkValidate(assets: any[]) {
    const results = [];
    for (const asset of assets) {
      const errors = [];
      if (!asset.name) errors.push("Name is required");
      if (!asset.tag) errors.push("Asset Tag is required");
      if (!asset.model) errors.push("Model is required");

      if (asset.tag) {
        const dupTag = await prisma.asset.findUnique({ where: { tag: asset.tag } });
        if (dupTag) errors.push("Asset Tag already exists");
      }

      if (asset.serialNumber) {
        const dupSerial = await prisma.asset.findUnique({ where: { serialNumber: asset.serialNumber } });
        if (dupSerial) errors.push("Serial Number already exists");
      }

      results.push({
        asset,
        isValid: errors.length === 0,
        errors
      });
    }
    return results;
  }

  static async bulkCreate(assets: any[], userId: string) {
    return prisma.$transaction(async (tx) => {
      const created = [];
      for (const item of assets) {
        const assetCode = item.assetCode || (await AssetCodeGenerator.generateCode());
        const asset = await tx.asset.create({
          data: {
            name: item.name,
            assetCode,
            tag: item.tag,
            qrCodeId: item.qrCodeId || item.tag,
            serialNumber: item.serialNumber || null,
            model: item.model,
            manufacturer: item.manufacturer || null,
            status: item.status || AssetStatus.OPERATIONAL,
            lifecycleStage: item.lifecycleStage || LifecycleStage.PROCURED,
            healthStatus: item.healthStatus || HealthStatus.HEALTHY,
            location: item.location,
            building: item.building || null,
            floor: item.floor || null,
            room: item.room || null,
            departmentId: item.departmentId,
            categoryId: item.categoryId || null,
            createdBy: userId
          }
        });

        await tx.assetHistory.create({
          data: {
            assetId: asset.id,
            actionType: "CREATED",
            notes: `Asset bulk imported with asset code ${asset.assetCode}.`,
            performedById: userId
          }
        });

        created.push(asset);
      }

      sharedEventBus.publish("AssetsBulkImported", { count: created.length, performedBy: userId });
      return created;
    });
  }

  static async bulkUpdate(assets: any[], userId: string) {
    return prisma.$transaction(async (tx) => {
      const updated = [];
      for (const item of assets) {
        if (!item.id) continue;
        const asset = await tx.asset.update({
          where: { id: item.id },
          data: {
            name: item.name,
            status: item.status,
            lifecycleStage: item.lifecycleStage,
            healthStatus: item.healthStatus,
            location: item.location,
            building: item.building,
            floor: item.floor,
            room: item.room,
            updatedBy: userId
          }
        });

        await tx.assetHistory.create({
          data: {
            assetId: asset.id,
            actionType: "STATUS_CHANGE",
            notes: "Asset bulk updated manually.",
            performedById: userId
          }
        });

        updated.push(asset);
      }
      return updated;
    });
  }

  static async bulkAssign(assetIds: string[], departmentId: string, location: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const updated = [];
      for (const id of assetIds) {
        const asset = await tx.asset.update({
          where: { id },
          data: {
            departmentId,
            location,
            lifecycleStage: LifecycleStage.ASSIGNED,
            updatedBy: userId
          }
        });

        await tx.assetHistory.create({
          data: {
            assetId: id,
            actionType: "ASSIGNED",
            notes: `Asset bulk assigned to department ${departmentId} at location ${location}.`,
            performedById: userId
          }
        });
        updated.push(asset);
      }

      sharedEventBus.publish("AssetsBulkAssigned", { assetIds, departmentId, performedBy: userId });
      return updated;
    });
  }

  static async bulkTransfer(assetIds: string[], targetDepartmentId: string, location: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const updated = [];
      for (const id of assetIds) {
        const asset = await tx.asset.update({
          where: { id },
          data: {
            departmentId: targetDepartmentId,
            location,
            updatedBy: userId
          }
        });

        await tx.assetHistory.create({
          data: {
            assetId: id,
            actionType: "ASSIGNED",
            notes: `Asset bulk transferred to department ${targetDepartmentId} at location ${location}.`,
            performedById: userId
          }
        });
        updated.push(asset);
      }

      sharedEventBus.publish("AssetsBulkTransferred", { assetIds, targetDepartmentId, performedBy: userId });
      return updated;
    });
  }

  static async bulkRetire(assetIds: string[], notes: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const updated = [];
      for (const id of assetIds) {
        const asset = await tx.asset.update({
          where: { id },
          data: {
            status: AssetStatus.DECOMMISSIONED,
            lifecycleStage: LifecycleStage.RETIRED,
            updatedBy: userId
          }
        });

        await tx.assetHistory.create({
          data: {
            assetId: id,
            actionType: "RETIRED",
            notes: notes || "Asset bulk retired and decommissioned.",
            performedById: userId
          }
        });
        updated.push(asset);
      }

      sharedEventBus.publish("AssetsBulkRetired", { assetIds, performedBy: userId });
      return updated;
    });
  }

  static async bulkGenerateQR(assetIds: string[], userId: string) {
    // Generate QR validation foundation logic
    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds }, isActive: true }
    });
    return assets.map((a) => ({
      assetId: a.id,
      assetCode: a.assetCode,
      qrUrl: `/assets/scan/${a.tag}`
    }));
  }
}
