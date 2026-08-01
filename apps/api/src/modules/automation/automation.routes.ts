import { Router } from "express";
import { AutomationController } from "./automation.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

export const automationRouter = Router();

// ── Summary ───────────────────────────────────────────────────────────────────
automationRouter.get(
  "/",
  authenticate,
  authorize("automation:read"),
  AutomationController.getSummary,
);

// ── Rules CRUD ────────────────────────────────────────────────────────────────
automationRouter.get(
  "/rules",
  authenticate,
  authorize("automation:read"),
  AutomationController.listRules,
);

automationRouter.get(
  "/rules/:id",
  authenticate,
  authorize("automation:read"),
  AutomationController.getRuleById,
);

automationRouter.post(
  "/rules",
  authenticate,
  authorize("automation:manage"),
  AutomationController.createRule,
);

automationRouter.put(
  "/rules/:id",
  authenticate,
  authorize("automation:manage"),
  AutomationController.updateRule,
);

automationRouter.delete(
  "/rules/:id",
  authenticate,
  authorize("automation:manage"),
  AutomationController.deleteRule,
);

// ── Logs ──────────────────────────────────────────────────────────────────────
automationRouter.get(
  "/logs",
  authenticate,
  authorize("automation:read"),
  AutomationController.getLogs,
);
