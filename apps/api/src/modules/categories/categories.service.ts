import { CategoriesRepository } from "./categories.repository.js";
import { CreateCategoryInput, UpdateCategoryInput } from "./categories.schema.js";
import { NotFoundError, ConflictError } from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";
import { Prisma } from "@prisma/client";

export class CategoriesService {
  static async getSummary() {
    logger.debug("Executing CategoriesService.getSummary");
    return { message: "Placeholder summary for categories module" };
  }

  static async listCategories(params: {
    search?: string;
    active?: string;
    page?: number;
    pageSize?: number;
  }) {
    logger.debug({ params }, "Executing CategoriesService.listCategories");

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Prisma.CategoryWhereInput = {};

    if (params.search) {
      const q = params.search;
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    if (params.active !== undefined && params.active !== "") {
      where.isActive = params.active === "true" || params.active === "ACTIVE";
    }

    const [categories, total] = await Promise.all([
      CategoriesRepository.findMany({
        skip,
        take,
        where,
        orderBy: { sortOrder: "asc" },
      }),
      CategoriesRepository.count(where),
    ]);

    const pageCount = Math.ceil(total / pageSize);

    // Map backend database names to match frontend expectations if necessary
    return {
      data: categories,
      total,
      page,
      pageSize,
      pageCount,
    };
  }

  static async getCategoryById(id: string) {
    logger.debug(`Executing CategoriesService.getCategoryById: ${id}`);
    const cat = await CategoriesRepository.findById(id);
    if (!cat) {
      throw new NotFoundError("Category not found");
    }
    return cat;
  }

  static async createCategory(input: CreateCategoryInput) {
    logger.debug(`Executing CategoriesService.createCategory: ${input.name}`);

    // Check name uniqueness
    const existing = await CategoriesRepository.findByName(input.name);
    if (existing) {
      throw new ConflictError("Category name is already in use");
    }

    return CategoriesRepository.create({
      name: input.name,
      description: input.description || null,
      icon: input.icon || "Folder",
      color: input.color || "#64748B",
      sortOrder: input.sortOrder || 0,
      isActive: true,
    });
  }

  static async updateCategory(id: string, input: UpdateCategoryInput) {
    logger.debug(`Executing CategoriesService.updateCategory: ${id}`);

    const cat = await CategoriesRepository.findById(id);
    if (!cat) {
      throw new NotFoundError("Category not found");
    }

    const updateData: Prisma.CategoryUpdateInput = {};

    if (input.description !== undefined) updateData.description = input.description || null;
    if (input.icon !== undefined) updateData.icon = input.icon || null;
    if (input.color !== undefined) updateData.color = input.color || null;
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    if (input.name !== undefined && input.name !== cat.name) {
      const existing = await CategoriesRepository.findByName(input.name);
      if (existing) {
        throw new ConflictError("Category name is already in use");
      }
      updateData.name = input.name;
    }

    return CategoriesRepository.update(id, updateData);
  }

  static async deleteCategory(id: string) {
    logger.debug(`Executing CategoriesService.deleteCategory: ${id}`);

    const cat = await CategoriesRepository.findById(id);
    if (!cat) {
      throw new NotFoundError("Category not found");
    }

    try {
      await CategoriesRepository.delete(id);
      return { deleted: true, deactivated: false };
    } catch (err: any) {
      // Handle Prisma foreign key constraint code (P2003)
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        logger.warn(`ForeignKey constraint prevents hard deleting category ${id}. Soft-deactivating instead.`);
        await CategoriesRepository.update(id, { isActive: false });
        return { deleted: false, deactivated: true };
      }
      throw err;
    }
  }
}
