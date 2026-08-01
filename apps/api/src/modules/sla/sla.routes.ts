import { Router } from "express";
import { SlaController } from "./sla.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

export const slaRouter = Router();

// ─── Compliance Dashboard ───────────────────────────────────────────────────
slaRouter.get(
  "/compliance",
  authenticate,
  SlaController.getCompliance,
);

// ─── Trigger Violation Run ──────────────────────────────────────────────────
slaRouter.post(
  "/check-violations",
  authenticate,
  authorize("sla:manage"),
  SlaController.checkViolations,
);

// ─── SLA Policies CRUD ───────────────────────────────────────────────────────
slaRouter.get(
  "/policies",
  authenticate,
  SlaController.list,
);

slaRouter.get(
  "/policies/:id",
  authenticate,
  SlaController.getById,
);

slaRouter.post(
  "/policies",
  authenticate,
  authorize("sla:manage"),
  SlaController.create,
);

slaRouter.put(
  "/policies/:id",
  authenticate,
  authorize("sla:manage"),
  SlaController.update,
);

slaRouter.delete(
  "/policies/:id",
  authenticate,
  authorize("sla:manage"),
  SlaController.delete,
);
