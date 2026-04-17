import { Router } from "express";
import { stripeWebhook } from "../controllers/webhooks.controller";

const router = Router();

// POST /api/webhooks/stripe
// Body is raw Buffer (see app.ts for raw body middleware)
router.post("/stripe", stripeWebhook);

export default router;
