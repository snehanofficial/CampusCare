import { Router } from "express";
import { RolesController } from "./roles.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

export const rolesRouter = Router();

// Apply authentication to all routes.
// The role catalogue is only consumed by the user-management form
// (apps/web/src/features/users/components/UserFormDialog.tsx), so it's
// gated behind the same "users:read" permission that guards that feature
// rather than being enumerable by every authenticated account.
rolesRouter.use(authenticate);
rolesRouter.use(authorize("users:read"));

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     summary: Retrieve list of roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 */
rolesRouter.get("/", authenticate, RolesController.list);

