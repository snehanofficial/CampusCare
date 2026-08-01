import { DepartmentsRepository } from "./departments.repository.js";
import { CreateDepartmentInput, UpdateDepartmentInput } from "./departments.schema.js";
import { NotFoundError, ConflictError } from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";
import { Prisma } from "@prisma/client";

export class DepartmentsService {
  static async getSummary() {
    logger.debug("Executing DepartmentsService.getSummary");
    return { message: "Placeholder summary for departments module" };
  }

  static async listDepartments(params: {
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    logger.debug({ params }, "Executing DepartmentsService.listDepartments");

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Prisma.DepartmentWhereInput = {};

    if (params.search) {
      const q = params.search;
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
      ];
    }

    const [departments, total] = await Promise.all([
      DepartmentsRepository.findMany({
        skip,
        take,
        where,
        orderBy: { name: "asc" },
      }),
      DepartmentsRepository.count(where),
    ]);

    const pageCount = Math.ceil(total / pageSize);

    return {
      data: departments,
      total,
      page,
      pageSize,
      pageCount,
    };
  }

  static async getDepartmentById(id: string) {
    logger.debug(`Executing DepartmentsService.getDepartmentById: ${id}`);
    const dept = await DepartmentsRepository.findById(id);
    if (!dept) {
      throw new NotFoundError("Department not found");
    }
    return dept;
  }

  static async createDepartment(input: CreateDepartmentInput) {
    logger.debug(`Executing DepartmentsService.createDepartment: ${input.code}`);

    // Check code uniqueness
    const existingCode = await DepartmentsRepository.findByCode(input.code);
    if (existingCode) {
      throw new ConflictError("Department code is already in use");
    }

    // Check name uniqueness
    const existingName = await DepartmentsRepository.findByName(input.name);
    if (existingName) {
      throw new ConflictError("Department name is already registered");
    }

    return DepartmentsRepository.create({
      code: input.code,
      name: input.name,
      description: input.description || null,
      isActive: true,
    });
  }

  static async updateDepartment(id: string, input: UpdateDepartmentInput) {
    logger.debug(`Executing DepartmentsService.updateDepartment: ${id}`);

    const dept = await DepartmentsRepository.findById(id);
    if (!dept) {
      throw new NotFoundError("Department not found");
    }

    const updateData: Prisma.DepartmentUpdateInput = {};

    if (input.description !== undefined) updateData.description = input.description || null;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    if (input.code !== undefined && input.code !== dept.code) {
      const existingCode = await DepartmentsRepository.findByCode(input.code);
      if (existingCode) {
        throw new ConflictError("Department code is already in use");
      }
      updateData.code = input.code;
    }

    if (input.name !== undefined && input.name !== dept.name) {
      const existingName = await DepartmentsRepository.findByName(input.name);
      if (existingName) {
        throw new ConflictError("Department name is already in use");
      }
      updateData.name = input.name;
    }

    return DepartmentsRepository.update(id, updateData);
  }

  static async deleteDepartment(id: string) {
    logger.debug(`Executing DepartmentsService.deleteDepartment: ${id}`);

    const dept = await DepartmentsRepository.findById(id);
    if (!dept) {
      throw new NotFoundError("Department not found");
    }

    try {
      await DepartmentsRepository.delete(id);
      return { deleted: true, deactivated: false };
    } catch (err: any) {
      // Handle Prisma foreign key constraint code (P2003)
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        logger.warn(`ForeignKey constraint prevents hard deleting department ${id}. Soft-deactivating instead.`);
        await DepartmentsRepository.update(id, { isActive: false });
        return { deleted: false, deactivated: true };
      }
      throw err;
    }
  }
}
