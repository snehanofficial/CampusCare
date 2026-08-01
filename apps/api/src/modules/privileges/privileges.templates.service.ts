import { logger } from "../../utils/logger.js";
import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors.js";
import { PrivilegesRepository } from "./privileges.repository.js";
import { GTPE_ACTIONS, writeAudit } from "./privileges.events.js";
import type { ActorContext } from "./privileges.helpers.js";
import type {
  CreatePolicyInput,
  CreateTemplateInput,
  UpdatePolicyInput,
  UpdateTemplateInput,
} from "./privileges.schema.js";

/** CRUD for reusable permission templates and approval policies. */
export class PrivilegeTemplatesService {
  // ─── Templates ───────────────────────────────────────────────────────────────
  static async listTemplates(includeInactive: boolean) {
    return PrivilegesRepository.listTemplates(includeInactive);
  }

  static async createTemplate(actor: ActorContext, input: CreateTemplateInput) {
    logger.info({ actorId: actor.id, name: input.name }, "PrivilegeTemplatesService.createTemplate");

    const existing = await PrivilegesRepository.findTemplateByName(input.name);
    if (existing) throw new ConflictError("A template with this name already exists");

    const permissions = await PrivilegesRepository.findPermissionsByIds(input.permissionIds);
    if (permissions.length !== new Set(input.permissionIds).size) {
      throw new BadRequestError("One or more selected permissions do not exist");
    }

    const template = await PrivilegesRepository.createTemplate(
      {
        name: input.name,
        description: input.description ?? null,
        defaultDurationMinutes: input.defaultDurationMinutes,
        isActive: true,
        createdById: actor.id,
      },
      input.permissionIds,
    );

    await writeAudit({
      action: GTPE_ACTIONS.TEMPLATE_CREATE,
      targetTable: "permission_templates",
      targetId: template.id,
      newValue: { name: template.name, permissions: permissions.map((p) => p.code) },
      performedById: actor.id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return template;
  }

  static async updateTemplate(actor: ActorContext, id: string, input: UpdateTemplateInput) {
    const existing = await PrivilegesRepository.findTemplateById(id);
    if (!existing) throw new NotFoundError("Permission template not found");

    if (input.name && input.name !== existing.name) {
      const clash = await PrivilegesRepository.findTemplateByName(input.name);
      if (clash) throw new ConflictError("A template with this name already exists");
    }

    if (input.permissionIds) {
      const permissions = await PrivilegesRepository.findPermissionsByIds(input.permissionIds);
      if (permissions.length !== new Set(input.permissionIds).size) {
        throw new BadRequestError("One or more selected permissions do not exist");
      }
    }

    const updated = await PrivilegesRepository.updateTemplate(
      id,
      {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.defaultDurationMinutes !== undefined
          ? { defaultDurationMinutes: input.defaultDurationMinutes }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      input.permissionIds,
    );

    await writeAudit({
      action: GTPE_ACTIONS.TEMPLATE_UPDATE,
      targetTable: "permission_templates",
      targetId: id,
      oldValue: {
        name: existing.name,
        defaultDurationMinutes: existing.defaultDurationMinutes,
        isActive: existing.isActive,
        permissions: existing.items.map((i) => i.permission.code),
      },
      newValue: {
        name: updated.name,
        defaultDurationMinutes: updated.defaultDurationMinutes,
        isActive: updated.isActive,
        permissions: updated.items.map((i) => i.permission.code),
      },
      performedById: actor.id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return updated;
  }

  /** Soft delete — templates are referenced by historical grants via `templateId`. */
  static async deleteTemplate(actor: ActorContext, id: string) {
    const existing = await PrivilegesRepository.findTemplateById(id);
    if (!existing) throw new NotFoundError("Permission template not found");

    const updated = await PrivilegesRepository.updateTemplate(id, { isActive: false });

    await writeAudit({
      action: GTPE_ACTIONS.TEMPLATE_DELETE,
      targetTable: "permission_templates",
      targetId: id,
      oldValue: { isActive: true },
      newValue: { isActive: false },
      performedById: actor.id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return updated;
  }

  // ─── Approval policies ───────────────────────────────────────────────────────
  static async listPolicies() {
    return PrivilegesRepository.listPolicies();
  }

  static async createPolicy(actor: ActorContext, input: CreatePolicyInput) {
    if (input.permissionId) {
      const permissions = await PrivilegesRepository.findPermissionsByIds([input.permissionId]);
      if (permissions.length === 0) throw new BadRequestError("Permission does not exist");
    }

    const policy = await PrivilegesRepository.createPolicy({
      permissionId: input.permissionId ?? null,
      permissionCategory: input.permissionCategory ?? null,
      approvalLevel: input.approvalLevel,
      approverRole: input.approverRole,
      maxDurationMinutes: input.maxDurationMinutes,
      autoApprove: input.autoApprove ?? false,
      isActive: true,
    });

    await writeAudit({
      action: GTPE_ACTIONS.POLICY_UPDATE,
      targetTable: "approval_policies",
      targetId: policy.id,
      newValue: policy,
      performedById: actor.id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return policy;
  }

  static async updatePolicy(actor: ActorContext, id: string, input: UpdatePolicyInput) {
    const existing = await PrivilegesRepository.findPolicyById(id);
    if (!existing) throw new NotFoundError("Approval policy not found");

    const updated = await PrivilegesRepository.updatePolicy(id, {
      ...(input.approvalLevel !== undefined ? { approvalLevel: input.approvalLevel } : {}),
      ...(input.approverRole !== undefined ? { approverRole: input.approverRole } : {}),
      ...(input.maxDurationMinutes !== undefined
        ? { maxDurationMinutes: input.maxDurationMinutes }
        : {}),
      ...(input.autoApprove !== undefined ? { autoApprove: input.autoApprove } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });

    await writeAudit({
      action: GTPE_ACTIONS.POLICY_UPDATE,
      targetTable: "approval_policies",
      targetId: id,
      oldValue: existing,
      newValue: updated,
      performedById: actor.id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return updated;
  }
}
