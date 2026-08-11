import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { authorize } from "../../../middleware/authorize.js";
import { EmailLogController } from "./email-log.controller.js";

const router = Router();

router.use(authenticate as any);

/**
 * GET /api/v1/mail/logs
 * List recent email delivery logs (admin only).
 */
router.get("/logs", authorize("users:manage") as any, EmailLogController.getLogs);

/**
 * GET /api/v1/mail/logs/:id
 * Get a single email delivery log (admin only).
 */
router.get("/logs/:id", authorize("users:manage") as any, EmailLogController.getLogById);

export const emailLogRouter = router;
export default emailLogRouter;
