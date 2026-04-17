import { Router } from "express";
import {
  createJob,
  listJobs,
  getJob,
  signContract,
  createCheckout,
  markComplete,
  confirmCompletion,
  recordConsent,
} from "../controllers/jobs.controller";

const router = Router();

router.post("/", createJob);
router.get("/", listJobs);
router.get("/:jobId", getJob);
router.patch("/:jobId/sign", signContract);
router.post("/:jobId/checkout", createCheckout);
router.patch("/:jobId/complete", markComplete);
router.post("/:jobId/confirm", confirmCompletion);
router.post("/:jobId/consent", recordConsent);

export default router;
