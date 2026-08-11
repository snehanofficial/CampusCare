import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorizeAny, authorize } from "../../middleware/authorize.js";
import { TechniciansController } from "./technicians.controller.js";

export const techniciansRouter = Router();

techniciansRouter.use(authenticate);

// Team-visibility endpoints: whoever can assign tickets or manage the team
// needs to see workload/availability to make that call.
techniciansRouter.get(
  "/eligible",
  authorizeAny("technicians:manage", "tickets:assign"),
  TechniciansController.listEligible,
);
techniciansRouter.get(
  "/availability",
  authorizeAny("technicians:manage", "tickets:assign"),
  TechniciansController.listAvailability,
);
// Not gated by authorize() here — getWorkload restricts the requested id set
// to the caller's own id internally when they lack technicians:manage/
// tickets:assign, rather than 403ing a technician who just wants their own
// workload (see the controller for the exact rule).
techniciansRouter.get("/workload", TechniciansController.getWorkload);

// Self-service-or-admin: ownership vs. technicians:manage is resolved inside
// the controller (needs req.user, which route-level authorize() doesn't see).
techniciansRouter.get("/:id/availability", TechniciansController.getAvailabilityForOne);
techniciansRouter.put("/:id/unavailability", TechniciansController.setUnavailability);
techniciansRouter.delete("/:id/unavailability", TechniciansController.clearUnavailability);

// Reuses the existing "assign tickets to technicians" permission — this is
// just a different (algorithmic) way of doing the same action a manual
// PUT /tickets/:id { assigneeId } already performs.
techniciansRouter.post(
  "/auto-assign/:ticketId",
  authorize("tickets:assign"),
  TechniciansController.autoAssign,
);

export default techniciansRouter;
