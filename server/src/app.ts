import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import routes from "./routes";

const app = express();

// Stripe webhooks require the raw body for signature verification.
// This middleware MUST be registered before express.json().
app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));

// CORS — allow Angular dev server and production domain
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:4200",
    credentials: true,
  })
);

// JSON body parsing for all other routes
app.use(express.json());

// API routes
app.use("/api", routes);

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error." });
});

export default app;