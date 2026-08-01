import { prisma } from "../../../database/prisma.js";
import { AssetCodeGenerator } from "./asset-code-generator.js";
import { ProcurementNumberGenerator } from "./procurement-number-generator.js";
import { sharedEventBus } from "@campuscare/shared-utils";
import { ProcurementStatus, LifecycleStage, AssetStatus, HealthStatus } from "@campuscare/shared-types";
import { Prisma } from "@prisma/client";

export class ProcurementService {
  static async list(params: {
    search?: string;
    status?: ProcurementStatus;
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProcurementWhereInput = {};

    if (params.search) {
      const q = params.search;
      where.OR = [
        { requestNumber: { contains: q, mode: "insensitive" } },
        { purchaseOrderNumber: { contains: q, mode: "insensitive" } },
        { invoiceNumber: { contains: q, mode: "insensitive" } },
        { assetName: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    const [total, data] = await Promise.all([
      prisma.procurement.count({ where }),
      prisma.procurement.findMany({
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
    const procurement = await prisma.procurement.findUnique({
      where: { id },
      include: {
        department: true,
        category: true,
      }
    });

    if (!procurement) {
      throw new Error("Procurement request not found");
    }

    return procurement;
  }

  static async create(data: any) {
    const requestNumber = await ProcurementNumberGenerator.generateNumber();

    // Verify Department
    const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!department) throw new Error("Department not found");

    // Verify Category
    if (data.categoryId) {
      const cat = await prisma.assetCategory.findFirst({ where: { id: data.categoryId, isActive: true } });
      if (!cat) throw new Error("Asset Category not found");
    }

    const procurement = await prisma.procurement.create({
      data: {
        requestNumber,
        purchaseOrderNumber: data.purchaseOrderNumber || null,
        invoiceNumber: data.invoiceNumber || null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchaseCost: new Prisma.Decimal(data.purchaseCost),
        vendorReference: data.vendorReference || null,
        status: data.status || ProcurementStatus.REQUESTED,
        assetName: data.assetName,
        model: data.model,
        manufacturer: data.manufacturer || null,
        categoryId: data.categoryId || null,
        departmentId: data.departmentId,
        quantity: parseInt(data.quantity, 10),
      }
    });

    return procurement;
  }

  static async update(id: string, data: any) {
    const existing = await prisma.procurement.findUnique({ where: { id } });
    if (!existing) throw new Error("Procurement request not found");

    // If changing quantity, check if it goes below already registered count
    if (data.quantity !== undefined) {
      const qty = parseInt(data.quantity, 10);
      if (qty < existing.registeredCount) {
        throw new Error(`Quantity cannot be less than registered assets (${existing.registeredCount}).`);
      }
    }

    // Verify Department if changed
    if (data.departmentId && data.departmentId !== existing.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!department) throw new Error("Department not found");
    }

    // Verify Category if changed
    if (data.categoryId && data.categoryId !== existing.categoryId) {
      const cat = await prisma.assetCategory.findFirst({ where: { id: data.categoryId, isActive: true } });
      if (!cat) throw new Error("Asset Category not found");
    }

    const updateData: Prisma.ProcurementUncheckedUpdateInput = {
      purchaseOrderNumber: data.purchaseOrderNumber,
      invoiceNumber: data.invoiceNumber,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      purchaseCost: data.purchaseCost ? new Prisma.Decimal(data.purchaseCost) : undefined,
      vendorReference: data.vendorReference,
      status: data.status,
      assetName: data.assetName,
      model: data.model,
      manufacturer: data.manufacturer,
      categoryId: data.categoryId,
      departmentId: data.departmentId,
      quantity: data.quantity ? parseInt(data.quantity, 10) : undefined,
    };

    const updated = await prisma.procurement.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }

  static async delete(id: string) {
    const existing = await prisma.procurement.findUnique({ where: { id } });
    if (!existing) throw new Error("Procurement request not found");

    if (existing.registeredCount > 0) {
      throw new Error("Cannot delete a procurement request that has registered assets.");
    }

    await prisma.procurement.delete({ where: { id } });
    return true;
  }

  static async registerAssets(id: string, payload: { assets: Array<{ serialNumber?: string; tag?: string; location: string; building?: string; floor?: string; room?: string }> }, userId: string) {
    const procurement = await prisma.procurement.findUnique({ where: { id } });
    if (!procurement) throw new Error("Procurement request not found");

    if (procurement.status === ProcurementStatus.REGISTERED) {
      throw new Error("This procurement is already fully registered.");
    }

    const newAssetsCount = payload.assets.length;
    const remainingToRegister = procurement.quantity - procurement.registeredCount;

    if (newAssetsCount > remainingToRegister) {
      throw new Error(`Cannot register ${newAssetsCount} assets. Only ${remainingToRegister} remaining to register.`);
    }

    // Cost per asset
    const costPerAsset = new Prisma.Decimal(Number(procurement.purchaseCost) / procurement.quantity);

    // Perform database operations within a transaction to ensure rollback on failure
    const registeredAssets = await prisma.$transaction(async (tx) => {
      const createdAssets = [];

      for (const inputAsset of payload.assets) {
        // Tag uniqueness verification
        if (inputAsset.tag) {
          const existingTag = await tx.asset.findUnique({ where: { tag: inputAsset.tag } });
          if (existingTag) {
            throw new Error(`Asset tag '${inputAsset.tag}' is already registered.`);
          }
        }

        // Serial number uniqueness verification
        if (inputAsset.serialNumber) {
          const existingSerial = await tx.asset.findUnique({ where: { serialNumber: inputAsset.serialNumber } });
          if (existingSerial) {
            throw new Error(`Serial number '${inputAsset.serialNumber}' is already registered.`);
          }
        }

        const assetCode = await AssetCodeGenerator.generateCode();
        const tag = inputAsset.tag || assetCode;

        const newAsset = await tx.asset.create({
          data: {
            name: procurement.assetName,
            assetCode,
            tag,
            qrCodeId: tag,
            serialNumber: inputAsset.serialNumber || null,
            model: procurement.model,
            manufacturer: procurement.manufacturer || null,
            status: AssetStatus.OPERATIONAL,
            lifecycleStage: LifecycleStage.AVAILABLE,
            healthStatus: HealthStatus.HEALTHY,
            location: inputAsset.location,
            building: inputAsset.building || null,
            floor: inputAsset.floor || null,
            room: inputAsset.room || null,
            purchaseOrderNumber: procurement.purchaseOrderNumber || null,
            purchasePrice: costPerAsset,
            purchaseDate: procurement.purchaseDate || null,
            departmentId: procurement.departmentId,
            categoryId: procurement.categoryId || null,
            createdBy: userId,
          }
        });

        await tx.assetHistory.create({
          data: {
            assetId: newAsset.id,
            actionType: "CREATED",
            notes: `Asset registered from Procurement request ${procurement.requestNumber} with asset code ${newAsset.assetCode}.`,
            performedById: userId
          }
        });

        createdAssets.push(newAsset);
      }

      // Update procurement registration status
      const updatedRegisteredCount = procurement.registeredCount + newAssetsCount;
      const isFullyRegistered = updatedRegisteredCount === procurement.quantity;
      const newStatus = isFullyRegistered ? ProcurementStatus.REGISTERED : ProcurementStatus.RECEIVED;

      await tx.procurement.update({
        where: { id },
        data: {
          registeredCount: updatedRegisteredCount,
          status: newStatus
        }
      });

      return createdAssets;
    });

    // Publish events outside the transaction
    for (const asset of registeredAssets) {
      sharedEventBus.publish("AssetCreated", { assetId: asset.id, assetCode: asset.assetCode, performedBy: userId });
    }

    return registeredAssets;
  }
}
