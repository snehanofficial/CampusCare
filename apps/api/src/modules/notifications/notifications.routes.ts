import { Router } from "express";
import { NotificationsController } from "./notifications.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { updatePreferencesSchema, broadcastNotificationSchema } from "./validators/notifications.validator.js";

export const notificationsRouter = Router();

// Force authenticate on all notification actions
notificationsRouter.use(authenticate);

notificationsRouter.get("/", NotificationsController.list);
notificationsRouter.get("/preferences", NotificationsController.getPreferences);
notificationsRouter.put(
  "/preferences",
  validate(updatePreferencesSchema),
  NotificationsController.updatePreferences
);
notificationsRouter.patch("/:id/read", NotificationsController.markAsRead);
notificationsRouter.post("/read-all", NotificationsController.markAllAsRead);
notificationsRouter.delete("/:id", NotificationsController.delete);

// Admin broadcast requires NOTIFICATIONS_SEND permission
notificationsRouter.post(
  "/broadcast",
  authorize("notifications:send"),
  validate(broadcastNotificationSchema),
  NotificationsController.broadcast
);

// Dev / test endpoint to send push notification to self
notificationsRouter.post("/test-push", NotificationsController.testPush);

