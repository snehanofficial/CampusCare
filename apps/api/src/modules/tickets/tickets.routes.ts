import { Router } from "express";
import { TicketsController } from "./tickets.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize, authorizeAny } from "../../middleware/authorize.js";

export const ticketsRouter = Router();

// ── Tickets CRUD ──────────────────────────────────────────────────────────────
ticketsRouter.get(
  "/",
  authenticate,
  authorizeAny("tickets:read_all", "technician:assigned:view", "tickets:read_own"),
  TicketsController.list,
);

ticketsRouter.get(
  "/:id",
  authenticate,
  authorizeAny("tickets:read_all", "technician:ticket:view", "tickets:read_own"),
  TicketsController.getById,
);

ticketsRouter.post(
  "/",
  authenticate,
  authorize("tickets:create"),
  TicketsController.create,
);

ticketsRouter.put(
  "/:id",
  authenticate,
  authorizeAny(
    "tickets:update_all",
    "technician:ticket:update-status",
    "tickets:update_own",
  ),
  TicketsController.update,
);

ticketsRouter.delete(
  "/:id",
  authenticate,
  authorize("tickets:delete"),
  TicketsController.delete,
);

// ── Comments ──────────────────────────────────────────────────────────────────
ticketsRouter.post(
  "/:id/comments",
  authenticate,
  authorizeAny("tickets:read_all", "technician:ticket:view", "tickets:read_own"), // Any user who can read tickets can comment
  TicketsController.addComment,
);

ticketsRouter.delete(
  "/:id/comments/:commentId",
  authenticate,
  authorize("tickets:delete"),
  TicketsController.deleteComment,
);

ticketsRouter.post(
  "/merge",
  authenticate,
  authorize("tickets:update_all"),
  TicketsController.merge,
);

ticketsRouter.post(
  "/:id/verify",
  authenticate,
  TicketsController.verify,
);

ticketsRouter.post(
  "/:id/reopen",
  authenticate,
  TicketsController.reopen,
);

ticketsRouter.post(
  "/auto-close",
  authenticate,
  authorize("tickets:delete"),
  TicketsController.autoClose,
);


