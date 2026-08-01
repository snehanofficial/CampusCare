import { AutomationRepository } from "./automation.repository.js";
import { CreateRuleInput, UpdateRuleInput, RuleCondition, RuleAction } from "./automation.schema.js";
import { NotFoundError, ConflictError } from "../../utils/errors.js";
import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";
import { Prisma } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────
type TicketSnapshot = {
  id: string;
  status: string;
  priority: string;
  categoryId: string;
  departmentId: string;
  assigneeId: string | null;
  creatorId: string;
  title: string;
  description: string;
};

// ─── Condition Evaluator ──────────────────────────────────────────────────────
function evaluateCondition(ticket: TicketSnapshot, cond: RuleCondition): boolean {
  const fieldValue: string | null = (ticket as any)[cond.field] ?? null;

  switch (cond.operator) {
    case "eq":
      return fieldValue === (cond.value as string);
    case "neq":
      return fieldValue !== (cond.value as string);
    case "in":
      return Array.isArray(cond.value) && cond.value.includes(fieldValue ?? "");
    case "not_in":
      return Array.isArray(cond.value) && !cond.value.includes(fieldValue ?? "");
    case "is_null":
      return fieldValue === null;
    case "is_not_null":
      return fieldValue !== null;
    default:
      return false;
  }
}

function evaluateConditions(ticket: TicketSnapshot, conditions: RuleCondition[]): boolean {
  return conditions.every((cond) => evaluateCondition(ticket, cond));
}

// ─── Duplicate Detection ──────────────────────────────────────────────────────
async function findDuplicateTicket(ticket: TicketSnapshot): Promise<string | null> {
  // Look for an OPEN ticket with same title (case-insensitive) created within the last 24h
  const recent = await prisma.ticket.findFirst({
    where: {
      id: { not: ticket.id },
      title: { equals: ticket.title, mode: "insensitive" },
      status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING"] },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    select: { id: true, ticketNumber: true },
  });
  return recent ? recent.id : null;
}

// ─── Action Executor ──────────────────────────────────────────────────────────
async function executeAction(
  ticketId: string,
  action: RuleAction,
  executedActions: string[],
): Promise<void> {
  try {
    switch (action.type) {
      case "ASSIGN_TO":
        if (action.value) {
          await prisma.ticket.update({
            where: { id: ticketId },
            data: {
              assignee: { connect: { id: action.value } },
              status: "ASSIGNED",
            },
          });
          executedActions.push(`ASSIGN_TO:${action.value}`);
        }
        break;

      case "SET_PRIORITY":
        if (action.value) {
          await prisma.ticket.update({
            where: { id: ticketId },
            data: { priority: action.value },
          });
          executedActions.push(`SET_PRIORITY:${action.value}`);
        }
        break;

      case "SET_STATUS":
        if (action.value) {
          const updateData: Prisma.TicketUpdateInput = { status: action.value };
          if (action.value === "RESOLVED") updateData.resolvedAt = new Date();
          if (action.value === "CLOSED") updateData.closedAt = new Date();
          await prisma.ticket.update({ where: { id: ticketId }, data: updateData });
          executedActions.push(`SET_STATUS:${action.value}`);
        }
        break;

      case "ADD_COMMENT":
        if (action.value) {
          // Find admin user to author the system comment
          const adminUser = await prisma.user.findFirst({
            where: { role: { name: "SYSTEM_ADMIN" }, isActive: true },
            select: { id: true },
          });
          if (adminUser) {
            await prisma.ticketComment.create({
              data: {
                ticketId,
                authorId: adminUser.id,
                content: `[Automation] ${action.value}`,
                isInternal: true,
              },
            });
            executedActions.push(`ADD_COMMENT`);
          }
        }
        break;

      case "SET_DEPARTMENT":
        if (action.value) {
          await prisma.ticket.update({
            where: { id: ticketId },
            data: { department: { connect: { id: action.value } } },
          });
          executedActions.push(`SET_DEPARTMENT:${action.value}`);
        }
        break;
    }
  } catch (err: any) {
    logger.debug({ err: err.message, action }, "Automation action execution failed (non-fatal)");
  }
}

// ─── Format helpers ───────────────────────────────────────────────────────────
function formatRule(rule: any) {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description ?? null,
    isActive: rule.isActive,
    priority: rule.priority,
    trigger: rule.trigger,
    conditions: rule.conditions,
    actions: rule.actions,
    executionCount: rule.executionCount,
    logCount: rule._count?.logs ?? 0,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────
export class AutomationService {
  // ── Rule CRUD ─────────────────────────────────────────────────────────────
  static async listRules(params: {
    search?: string;
    isActive?: string;
    trigger?: string;
    page?: number;
    pageSize?: number;
  }) {
    logger.debug({ params }, "AutomationService.listRules");

    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.AutomationRuleWhereInput = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (params.isActive === "true") where.isActive = true;
    if (params.isActive === "false") where.isActive = false;
    if (params.trigger) where.trigger = params.trigger;

    const [rules, total] = await Promise.all([
      AutomationRepository.findMany({ skip, take: pageSize, where }),
      AutomationRepository.count(where),
    ]);

    return {
      data: rules.map(formatRule),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  }

  static async getRuleById(id: string) {
    logger.debug(`AutomationService.getRuleById: ${id}`);
    const rule = await AutomationRepository.findById(id);
    if (!rule) throw new NotFoundError("Automation rule not found");
    return formatRule(rule);
  }

  static async createRule(input: CreateRuleInput) {
    logger.debug({ name: input.name }, "AutomationService.createRule");

    // Check name uniqueness
    const existing = await prisma.automationRule.findUnique({ where: { name: input.name } });
    if (existing) throw new ConflictError(`A rule named "${input.name}" already exists`);

    const rule = await AutomationRepository.create({
      name: input.name,
      description: input.description ?? null,
      isActive: input.isActive ?? true,
      priority: input.priority ?? 0,
      trigger: input.trigger,
      conditions: input.conditions as unknown as Prisma.InputJsonValue,
      actions: input.actions as unknown as Prisma.InputJsonValue,
    });

    return formatRule(rule);
  }

  static async updateRule(id: string, input: UpdateRuleInput) {
    logger.debug({ id }, "AutomationService.updateRule");

    const existing = await AutomationRepository.findById(id);
    if (!existing) throw new NotFoundError("Automation rule not found");

    if (input.name && input.name !== existing.name) {
      const conflict = await prisma.automationRule.findUnique({ where: { name: input.name } });
      if (conflict) throw new ConflictError(`A rule named "${input.name}" already exists`);
    }

    const data: Prisma.AutomationRuleUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description ?? null;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.trigger !== undefined) data.trigger = input.trigger;
    if (input.conditions !== undefined)
      data.conditions = input.conditions as unknown as Prisma.InputJsonValue;
    if (input.actions !== undefined)
      data.actions = input.actions as unknown as Prisma.InputJsonValue;

    const updated = await AutomationRepository.update(id, data);
    return formatRule(updated);
  }

  static async deleteRule(id: string) {
    logger.debug(`AutomationService.deleteRule: ${id}`);
    const existing = await AutomationRepository.findById(id);
    if (!existing) throw new NotFoundError("Automation rule not found");
    await AutomationRepository.delete(id);
    return { deleted: true };
  }

  // ── Logs ──────────────────────────────────────────────────────────────────
  static async getLogs(params: {
    ruleId?: string;
    ticketId?: string;
    page?: number;
    pageSize?: number;
  }) {
    logger.debug({ params }, "AutomationService.getLogs");

    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      AutomationRepository.findLogs({ skip, take: pageSize, ...params }),
      AutomationRepository.countLogs(params),
    ]);

    return {
      data: logs.map((l) => ({
        id: l.id,
        ruleId: l.ruleId,
        ruleName: (l as any).rule?.name ?? null,
        ticketId: l.ticketId,
        triggered: l.triggered,
        actionsRun: l.actionsRun,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  }

  // ── Rule Engine ───────────────────────────────────────────────────────────
  /**
   * Evaluate all active rules for a given trigger against the ticket snapshot.
   * Called from TicketsService after create/update.
   * Non-blocking: errors are caught and logged, never thrown to caller.
   */
  static async evaluateRules(
    ticket: TicketSnapshot,
    trigger: "ON_CREATE" | "ON_UPDATE" | "ON_STATUS_CHANGE",
  ): Promise<void> {
    try {
      const rules = await AutomationRepository.findActive(trigger);

      if (rules.length === 0) return;

      logger.debug(
        { ticketId: ticket.id, trigger, ruleCount: rules.length },
        "AutomationService.evaluateRules: evaluating",
      );

      // ── Duplicate detection (special built-in rule) ────────────────────────
      if (trigger === "ON_CREATE") {
        const duplicateId = await findDuplicateTicket(ticket);
        if (duplicateId) {
          logger.debug(
            { ticketId: ticket.id, duplicateId },
            "AutomationService: duplicate ticket detected",
          );
          // Add a system comment flagging the possible duplicate
          const adminUser = await prisma.user.findFirst({
            where: { role: { name: "SYSTEM_ADMIN" }, isActive: true },
            select: { id: true },
          });
          if (adminUser) {
            await prisma.ticketComment.create({
              data: {
                ticketId: ticket.id,
                authorId: adminUser.id,
                content: `[Automation] Possible duplicate detected. Similar open ticket exists (ID: ${duplicateId}). Please review before processing.`,
                isInternal: true,
              },
            });
          }
        }
      }

      // ── Evaluate each rule in priority order ───────────────────────────────
      for (const rule of rules) {
        const conditions = rule.conditions as unknown as RuleCondition[];
        const actions = rule.actions as unknown as RuleAction[];

        const triggered = evaluateConditions(ticket, conditions);
        const executedActions: string[] = [];

        if (triggered) {
          logger.debug({ ruleId: rule.id, ruleName: rule.name }, "Rule matched — executing actions");

          for (const action of actions) {
            await executeAction(ticket.id, action, executedActions);
          }

          // Increment the execution counter asynchronously
          AutomationRepository.incrementExecutionCount(rule.id).catch(() => {});
        }

        // Write log entry for every evaluated rule (triggered or not)
        await AutomationRepository.logExecution({
          ruleId: rule.id,
          ticketId: ticket.id,
          triggered,
          actionsRun: executedActions,
        });
      }
    } catch (err: any) {
      // Rule engine failures MUST NOT break the ticket operation
      logger.debug({ err: err.message }, "AutomationService.evaluateRules: non-fatal error");
    }
  }

  // ── Legacy getSummary stub (keep for router backwards compat) ─────────────
  static async getSummary() {
    const [totalRules, activeRules, totalLogs] = await Promise.all([
      prisma.automationRule.count(),
      prisma.automationRule.count({ where: { isActive: true } }),
      prisma.automationLog.count(),
    ]);
    return { totalRules, activeRules, totalLogs };
  }
}
