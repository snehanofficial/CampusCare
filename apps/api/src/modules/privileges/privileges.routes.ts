import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize, authorizeAny } from "../../middleware/authorize.js";
import { hydrateTemporaryPermissions } from "./privileges.middleware.js";
import { PrivilegesController } from "./privileges.controller.js";
import { PrivilegesAdminController } from "./privileges.admin.controller.js";
import { PrivilegeTemplatesController } from "./privileges.templates.controller.js";

export const privilegesRouter = Router();

// Every GTPE endpoint is authenticated and re-reads live temporary grants,
// so a mid-session revocation takes effect here within ~30 seconds.
privilegesRouter.use(authenticate, hydrateTemporaryPermissions);

// ── Self-service requests ─────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/privileges/request:
 *   post:
 *     summary: Submit a temporary privilege escalation request
 *     tags: [Privileges]
 *     responses:
 *       201:
 *         description: Request submitted
 */
privilegesRouter.post("/request", authorize("privileges:request"), PrivilegesController.createRequest);

privilegesRouter.get("/my", PrivilegesController.listMyRequests);

/**
 * @swagger
 * /api/v1/privileges/my/effective:
 *   get:
 *     summary: Live temporary permissions for the calling user
 *     tags: [Privileges]
 *     responses:
 *       200:
 *         description: Effective temporary privileges
 */
privilegesRouter.get("/my/effective", PrivilegesController.getMyEffective);

// ── Review queue ──────────────────────────────────────────────────────────────
privilegesRouter.get(
  "/pending",
  authorizeAny("privileges:approve", "privileges:manage"),
  PrivilegesController.listPending,
);

privilegesRouter.get(
  "/active",
  authorizeAny("privileges:grant", "privileges:manage"),
  PrivilegesAdminController.listActive,
);

privilegesRouter.get(
  "/history",
  authorizeAny("privileges:grant", "privileges:manage"),
  PrivilegesAdminController.listHistory,
);

// ── Direct admin grant ────────────────────────────────────────────────────────
privilegesRouter.post(
  "/grant",
  authorizeAny("privileges:grant", "privileges:manage"),
  PrivilegesAdminController.grant,
);

privilegesRouter.post(
  "/grants/:grantId/revoke",
  authorizeAny("privileges:grant", "privileges:manage"),
  PrivilegesAdminController.revoke,
);

// ── Templates ─────────────────────────────────────────────────────────────────
privilegesRouter.get(
  "/templates",
  authorizeAny("privileges:grant", "privileges:manage"),
  PrivilegeTemplatesController.listTemplates,
);
privilegesRouter.post(
  "/templates",
  authorize("privileges:manage"),
  PrivilegeTemplatesController.createTemplate,
);
privilegesRouter.put(
  "/templates/:id",
  authorize("privileges:manage"),
  PrivilegeTemplatesController.updateTemplate,
);
privilegesRouter.delete(
  "/templates/:id",
  authorize("privileges:manage"),
  PrivilegeTemplatesController.deleteTemplate,
);

// ── Approval policies ─────────────────────────────────────────────────────────
privilegesRouter.get(
  "/policies",
  authorizeAny("privileges:approve", "privileges:manage"),
  PrivilegeTemplatesController.listPolicies,
);
privilegesRouter.post(
  "/policies",
  authorize("privileges:manage"),
  PrivilegeTemplatesController.createPolicy,
);
privilegesRouter.put(
  "/policies/:id",
  authorize("privileges:manage"),
  PrivilegeTemplatesController.updatePolicy,
);

// ── Request review actions (declared last: `/:id` must not shadow static paths) ─
privilegesRouter.post(
  "/:id/approve",
  authorizeAny("privileges:approve", "privileges:manage"),
  PrivilegesController.approve,
);
privilegesRouter.post(
  "/:id/reject",
  authorizeAny("privileges:approve", "privileges:manage"),
  PrivilegesController.reject,
);
privilegesRouter.post("/:id/cancel", PrivilegesController.cancel);
