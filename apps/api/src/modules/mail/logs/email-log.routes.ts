import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { authorize } from "../../../middleware/authorize.js";
import { sendSuccess } from "../../../middleware/response.js";
import { prisma } from "../../../database/prisma.js";

const router = Router();

router.use(authenticate as any);

/**
 * GET /api/v1/mail/logs
 * List recent email delivery logs (admin only).
 */
router.get("/logs", authorize("users:manage") as any, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const logs = await prisma.emailLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
    });
    sendSuccess(res, logs);
  } catch (err) {
    next(err);
  }
});

export const emailLogRouter = router;
export default emailLogRouter;
