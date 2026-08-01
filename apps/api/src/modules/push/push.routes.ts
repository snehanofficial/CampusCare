import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { sendSuccess } from "../../middleware/response.js";
import { pushSubscriptionSchema } from "./push.validator.js";
import { PushRepository } from "./push.repository.js";
import { UnauthorizedError } from "../../utils/errors.js";

const router = Router();

// Secure all endpoints with user authentication middleware
router.use(authenticate as any);

/**
 * POST /api/v1/push/subscribe
 * Register or update a browser push subscription.
 */
router.post("/subscribe", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const validatedBody = pushSubscriptionSchema.parse(req.body);
    const result = await PushRepository.saveSubscription(req.user.id, validatedBody);
    
    sendSuccess(res, { success: true, id: result.id });
  } catch (err) {
    next(err);
  }
});

import { env } from "../../config/env.js";

/**
 * DELETE /api/v1/push/unsubscribe
 * Deregister a browser push subscription.
 */
router.delete("/unsubscribe", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const endpoint = req.body?.endpoint || (req.query?.endpoint as string);
    if (!endpoint) {
      res.status(400).json({ error: "Endpoint parameter is required" });
      return;
    }

    await PushRepository.removeSubscription(endpoint);
    sendSuccess(res, { success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/push/status
 * Check current push subscription status for authenticated user.
 */
router.get("/status", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const subscriptions = await PushRepository.getSubscriptionsByUserId(req.user.id);
    sendSuccess(res, {
      isSubscribed: subscriptions.length > 0,
      subscriptionsCount: subscriptions.length,
      publicKey: env.VAPID_PUBLIC_KEY,
    });
  } catch (err) {
    next(err);
  }
});

export const pushRouter = router;
export default pushRouter;
