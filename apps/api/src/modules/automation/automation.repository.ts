import { prisma } from "../../database/prisma.js";
import { Prisma } from "@prisma/client";

const RULE_INCLUDE = {
  _count: { select: { logs: true } },
} satisfies Prisma.AutomationRuleInclude;

export class AutomationRepository {
  // ── Rules CRUD ──────────────────────────────────────────────────────────────
  static async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.AutomationRuleWhereInput;
  }) {
    return prisma.automationRule.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      include: RULE_INCLUDE,
    });
  }

  static async count(where?: Prisma.AutomationRuleWhereInput) {
    return prisma.automationRule.count({ where });
  }

  static async findById(id: string) {
    return prisma.automationRule.findUnique({
      where: { id },
      include: RULE_INCLUDE,
    });
  }

  static async findActive(trigger: string) {
    return prisma.automationRule.findMany({
      where: { isActive: true, trigger },
      orderBy: { priority: "asc" },
    });
  }

  static async create(data: Prisma.AutomationRuleCreateInput) {
    return prisma.automationRule.create({ data, include: RULE_INCLUDE });
  }

  static async update(id: string, data: Prisma.AutomationRuleUpdateInput) {
    return prisma.automationRule.update({ where: { id }, data, include: RULE_INCLUDE });
  }

  static async delete(id: string) {
    return prisma.automationRule.delete({ where: { id } });
  }

  static async incrementExecutionCount(id: string) {
    return prisma.automationRule.update({
      where: { id },
      data: { executionCount: { increment: 1 } },
    });
  }

  // ── Logs ────────────────────────────────────────────────────────────────────
  static async logExecution(entry: {
    ruleId: string;
    ticketId: string;
    triggered: boolean;
    actionsRun: object;
  }) {
    return prisma.automationLog.create({ data: entry });
  }

  static async findLogs(params: {
    skip?: number;
    take?: number;
    ruleId?: string;
    ticketId?: string;
  }) {
    const where: Prisma.AutomationLogWhereInput = {};
    if (params.ruleId) where.ruleId = params.ruleId;
    if (params.ticketId) where.ticketId = params.ticketId;
    return prisma.automationLog.findMany({
      skip: params.skip,
      take: params.take,
      where,
      orderBy: { createdAt: "desc" },
      include: {
        rule: { select: { id: true, name: true } },
      },
    });
  }

  static async countLogs(params: { ruleId?: string; ticketId?: string }) {
    const where: Prisma.AutomationLogWhereInput = {};
    if (params.ruleId) where.ruleId = params.ruleId;
    if (params.ticketId) where.ticketId = params.ticketId;
    return prisma.automationLog.count({ where });
  }
}
