import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { EmailPreferenceController } from "./email-preference.controller.js";

const router = Router();

// Secure all settings endpoints using user authentication middleware
router.use(authenticate as any);

router.get("/", EmailPreferenceController.getPreferences as any);
router.put("/", EmailPreferenceController.updatePreferences as any);

export const emailPreferenceRouter = router;
export default emailPreferenceRouter;
