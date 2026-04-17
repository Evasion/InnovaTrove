import { Request, Response } from "express";
import Stripe from "stripe";
import { Job, JobStatus } from "../models/Job";

// ── POST /api/webhooks/stripe ────────────────────────────────────────────────
// NOTE: This route receives a raw body (Buffer), not parsed JSON.
// app.ts registers express.raw() for this path before express.json().
export async function stripeWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !stripeKey) {
    console.warn("Stripe webhook or secret key not configured.");
    res.status(400).send("Webhook not configured.");
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(stripeKey);
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    res.status(400).send(`Webhook Error: ${message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const jobId = session.metadata?.jobId;

    if (jobId) {
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent as Stripe.PaymentIntent | null)?.id;

      await Job.findOneAndUpdate(
        { jobId },
        {
          status: "deposit_authorized" as JobStatus,
          depositPaidAt: new Date(),
          stripePaymentIntentId: paymentIntentId,
        }
      );
      console.log(`✓ Job ${jobId} deposit authorization hold placed via Stripe webhook.`);
    }
  }

  res.json({ received: true });
}
