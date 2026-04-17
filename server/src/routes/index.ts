import { Router } from "express";
import jobRoutes from "./jobs";
import webhookRoutes from "./webhooks";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "API is running." });
});

router.use("/jobs", jobRoutes);
router.use("/webhooks", webhookRoutes);

export default router;