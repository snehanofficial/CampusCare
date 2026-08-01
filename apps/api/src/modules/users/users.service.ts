import bcrypt from "bcrypt";
import { UsersRepository } from "./users.repository.js";
import { CreateUserInput, UpdateUserInput } from "./users.schema.js";
import { NotFoundError, ConflictError } from "../../utils/errors.js";
import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";
import { Prisma } from "@prisma/client";

export class UsersService {
  static async getSummary() {
    logger.debug("Executing UsersService.getSummary");
    return { message: "Placeholder summary for users module" };
  }

  static async listUsers(params: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    logger.debug({ params }, "Executing UsersService.listUsers");
    
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Prisma.UserWhereInput = {};

    if (params.search) {
      const q = params.search;
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    if (params.role) {
      where.role = {
        name: params.role,
      };
    }

    if (params.status) {
      if (params.status === "ACTIVE") {
        where.isActive = true;
      } else if (params.status === "INACTIVE") {
        where.isActive = false;
      }
    }

    const [users, total] = await Promise.all([
      UsersRepository.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: "desc" },
      }),
      UsersRepository.count(where),
    ]);

    const pageCount = Math.ceil(total / pageSize);

    // Map database structures to match frontend user types
    const formattedData = users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role.name,
      roleDisplayName: u.role.displayName,
      departmentId: u.departmentId,
      departmentName: u.department?.name || null,
      departmentCode: u.department?.code || null,
      phone: u.phone,
      status: u.isActive ? "ACTIVE" : "INACTIVE",
      createdAt: u.createdAt.toISOString(),
      createdTicketsCount: (u as any)._count?.createdTickets ?? 0,
      assignedTicketsCount: (u as any)._count?.assignedTickets ?? 0,
    }));

    return {
      data: formattedData,
      total,
      page,
      pageSize,
      pageCount,
    };
  }

  static async getUserById(id: string) {
    logger.debug(`Executing UsersService.getUserById: ${id}`);
    const user = await UsersRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      roleDisplayName: user.role.displayName,
      departmentId: user.departmentId,
      departmentName: user.department?.name || null,
      departmentCode: user.department?.code || null,
      phone: user.phone,
      status: user.isActive ? "ACTIVE" : "INACTIVE",
      createdAt: user.createdAt.toISOString(),
      createdTicketsCount: (user as any)._count?.createdTickets ?? 0,
      assignedTicketsCount: (user as any)._count?.assignedTickets ?? 0,
    };
  }

  static async createUser(input: CreateUserInput) {
    logger.debug(`Executing UsersService.createUser: ${input.email}`);
    
    // Check email uniqueness
    const existing = await UsersRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("Email is already registered");
    }

    const password = input.password || "CampusCare123!";
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await UsersRepository.create({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash,
      role: { connect: { id: input.roleId } },
      department: input.departmentId ? { connect: { id: input.departmentId } } : undefined,
      phone: input.phone || null,
      isActive: true,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      roleDisplayName: user.role.displayName,
      departmentId: user.departmentId,
      departmentName: user.department?.name || null,
      departmentCode: user.department?.code || null,
      phone: user.phone,
      status: user.isActive ? "ACTIVE" : "INACTIVE",
      createdAt: user.createdAt.toISOString(),
    };
  }

  static async updateUser(id: string, input: UpdateUserInput) {
    logger.debug(`Executing UsersService.updateUser: ${id}`);
    
    const user = await UsersRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (input.firstName !== undefined) updateData.firstName = input.firstName;
    if (input.lastName !== undefined) updateData.lastName = input.lastName;
    if (input.phone !== undefined) updateData.phone = input.phone || null;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    if (input.email !== undefined) {
      if (input.email !== user.email) {
        const existing = await UsersRepository.findByEmail(input.email);
        if (existing) {
          throw new ConflictError("Email is already in use");
        }
      }
      updateData.email = input.email;
    }

    if (input.password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(input.password, 12);
    }

    if (input.roleId !== undefined) {
      updateData.role = { connect: { id: input.roleId } };
    }

    if (input.departmentId !== undefined) {
      if (input.departmentId === null) {
        updateData.department = { disconnect: true };
      } else {
        updateData.department = { connect: { id: input.departmentId } };
      }
    }

    const updated = await UsersRepository.update(id, updateData);

    // Security: If user deactivation occurred, terminate active sessions
    if (input.isActive === false) {
      logger.info(`Deactivating user ${id}: revoking all active sessions.`);
      await prisma.session.updateMany({
        where: { userId: id, revoked: false },
        data: {
          revoked: true,
          revokedReason: "SECURITY",
          revokedAt: new Date(),
        },
      });
    }

    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      role: updated.role.name,
      roleDisplayName: updated.role.displayName,
      departmentId: updated.departmentId,
      departmentName: updated.department?.name || null,
      departmentCode: updated.department?.code || null,
      phone: updated.phone,
      status: updated.isActive ? "ACTIVE" : "INACTIVE",
      createdAt: updated.createdAt.toISOString(),
    };
  }

  static async deleteUser(id: string) {
    logger.debug(`Executing UsersService.deleteUser: ${id}`);
    
    const user = await UsersRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    try {
      await UsersRepository.delete(id);
      return { deleted: true, deactivated: false };
    } catch (err: any) {
      // Prisma foreign key constraint code (P2003)
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        logger.warn(`ForeignKey constraint prevents hard deleting user ${id}. Falling back to deactivation.`);
        
        await UsersRepository.update(id, { isActive: false });
        
        await prisma.session.updateMany({
          where: { userId: id, revoked: false },
          data: {
            revoked: true,
            revokedReason: "SECURITY",
            revokedAt: new Date(),
          },
        });

        return { deleted: false, deactivated: true };
      }
      throw err;
    }
  }
}
