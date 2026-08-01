import { Router } from "express";
import { IncidentsController } from "./incidents.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

export const incidentsRouter = Router();

// ── Incidents CRUD ────────────────────────────────────────────────────────────
incidentsRouter.get(
  "/",
  authenticate,
  authorize("incidents:read"),
  IncidentsController.list,
);

incidentsRouter.get(
  "/:id",
  authenticate,
  authorize("incidents:read"),
  IncidentsController.getById,
);

incidentsRouter.post(
  "/",
  authenticate,
  authorize("incidents:manage"),
  IncidentsController.create,
);

incidentsRouter.put(
  "/:id",
  authenticate,
  authorize("incidents:manage"),
  IncidentsController.update,
);

incidentsRouter.delete(
  "/:id",
  authenticate,
  authorize("incidents:manage"),
  IncidentsController.delete,
);

incidentsRouter.get(
  "/:id/timeline",
  authenticate,
  authorize("incidents:read"),
  IncidentsController.getTimeline,
);

