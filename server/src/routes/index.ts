import { Router } from "express";

const router = Router();

// Example route (you can add more, or keep empty)
router.get("/", (req, res) => {
  res.json({ message: "API root is working." });
});

export default router;