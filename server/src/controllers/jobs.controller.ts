import { Request, Response } from "express";
import { randomBytes } from "crypto";
import Stripe from "stripe";
import twilio from "twilio";
import { Job, JobStatus } from "../models/Job";
import { JobStatus as _JobStatus } from "../models/Job";

// ── Default provider config (single-tenant MVP) ─────────────────────────────
// When multi-tenancy is added, replace this with a DB lookup by providerId.
function getProviderConfig() {
  return {
    name: process.env.BUSINESS_NAME || "Our Service",
    logoUrl: process.env.BUSINESS_LOGO_URL || "",
    primaryColor: "#3b82f6",
    accentColor: "#6366f1",
    contractText:
      process.env.CONTRACT_TEXT ||
      "By signing below, you agree to the service terms and authorise the deposit payment.",
    zelleInfo:
      process.env.ZELLE_INFO || "Contact us for final payment details.",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
  };
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === "1") return `+${digits}`;
  return phone.startsWith("+") ? phone : `+${phone}`;
}

// ── POST /api/jobs ────────────────────────────────────────────────────────────
export async function createJob(req: Request, res: Response): Promise<void> {
  const {
    customerPhone, customerName, serviceDescription, totalAmount, depositAmount,
    scheduledDate, timeSlotStart, timeSlotEnd,
  } = req.body;

  if (!customerPhone || !serviceDescription || !totalAmount || !depositAmount) {
    res.status(400).json({ error: "Missing required fields." });
    return;
  }

  const total = parseFloat(totalAmount);
  const deposit = parseFloat(depositAmount);

  if (isNaN(total) || isNaN(deposit) || total <= 0 || deposit <= 0) {
    res.status(400).json({ error: "Invalid amount values." });
    return;
  }
  if (deposit > total) {
    res.status(400).json({ error: "Deposit cannot exceed total amount." });
    return;
  }

  // Both start and end must be provided together
  if ((timeSlotStart && !timeSlotEnd) || (!timeSlotStart && timeSlotEnd)) {
    res.status(400).json({ error: "Both timeSlotStart and timeSlotEnd are required when setting a time slot." });
    return;
  }

  const jobId = randomBytes(4).toString("hex");
  const phone = normalizePhone(customerPhone);

  const job = await Job.create({
    jobId,
    customerPhone: phone,
    customerName: customerName || undefined,
    serviceDescription,
    totalAmount: Math.round(total * 100),
    depositAmount: Math.round(deposit * 100),
    scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
    timeSlotStart: timeSlotStart || undefined,
    timeSlotEnd: timeSlotEnd || undefined,
  });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:4200";
  const jobUrl = `${clientUrl}/job/${jobId}`;
  const provider = getProviderConfig();

  // Send SMS via Twilio (non-blocking — job is created regardless of SMS success)
  if (provider.twilioAccountSid && provider.twilioAuthToken) {
    try {
      const smsClient = twilio(provider.twilioAccountSid, provider.twilioAuthToken);
      const slotLine = job.scheduledDate && job.timeSlotStart && job.timeSlotEnd
        ? ` Appointment: ${new Date(job.scheduledDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}, ${job.timeSlotStart}–${job.timeSlotEnd}.`
        : "";
      await smsClient.messages.create({
        body: `Hi${customerName ? ` ${customerName}` : ""}! ${provider.name} has sent you a service booking.${slotLine} Tap to review & pay your deposit: ${jobUrl}\nReply STOP to opt out. Msg & data rates may apply.`,
        from: provider.twilioPhoneNumber,
        to: phone,
      });
      await Job.findByIdAndUpdate(job._id, { smsLinkSentAt: new Date() });
    } catch (smsErr) {
      console.error("Twilio error (non-fatal):", smsErr);
    }
  }

  res.status(201).json({ jobId, jobUrl, message: "Job created and link sent." });
}

// ── POST /api/jobs/:jobId/consent ─────────────────────────────────────────────
export async function recordConsent(req: Request, res: Response): Promise<void> {
  const job = await Job.findOne({ jobId: req.params.jobId });
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }

  await Job.findByIdAndUpdate(job._id, {
    smsConsentGiven: true,
    smsConsentAt: new Date(),
    smsConsentIp: req.ip ?? "unknown",
  });

  res.json({ message: "SMS consent recorded." });
}

// ── GET /api/jobs ─────────────────────────────────────────────────────────────
export async function listJobs(_req: Request, res: Response): Promise<void> {
  const jobs = await Job.find().sort({ createdAt: -1 }).lean();
  res.json({
    jobs: jobs.map((j) => ({
      ...j,
      totalAmount: j.totalAmount / 100,
      depositAmount: j.depositAmount / 100,
    })),
  });
}

// ── GET /api/jobs/:jobId ──────────────────────────────────────────────────────
export async function getJob(req: Request, res: Response): Promise<void> {
  const job = await Job.findOne({ jobId: req.params.jobId }).lean();
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }

  const provider = getProviderConfig();

  let contractText = provider.contractText;
  if (job.scheduledDate && job.timeSlotStart && job.timeSlotEnd) {
    const dateStr = new Date(job.scheduledDate).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    const start = formatTime(job.timeSlotStart);
    const end = formatTime(job.timeSlotEnd);
    const deposit = (job.depositAmount / 100).toFixed(2);
    contractText +=
      `\n\nScheduled Appointment: ${dateStr}, ${start} – ${end}.` +
      `\n\nNo-Show Policy: If our technician arrives at the scheduled location and you are not present within 15 minutes of their arrival, your deposit of $${deposit} will be forfeited in full as a no-show fee. By signing this agreement, you acknowledge and accept this policy.`;
  }

  res.json({
    job: {
      ...job,
      totalAmount: job.totalAmount / 100,
      depositAmount: job.depositAmount / 100,
    },
    provider: {
      name: provider.name,
      logoUrl: provider.logoUrl,
      primaryColor: provider.primaryColor,
      accentColor: provider.accentColor,
      contractText,
    },
  });
}

// ── PATCH /api/jobs/:jobId/sign ───────────────────────────────────────────────
export async function signContract(req: Request, res: Response): Promise<void> {
  const { signatureData } = req.body;
  if (!signatureData) {
    res.status(400).json({ error: "Signature data is required." });
    return;
  }

  const job = await Job.findOne({ jobId: req.params.jobId });
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  if (job.status !== "link_sent") {
    res.status(400).json({ error: "Contract has already been signed." });
    return;
  }

  await Job.findByIdAndUpdate(job._id, {
    status: "contract_signed" as JobStatus,
    contractSignedAt: new Date(),
    contractSignatureData: signatureData,
    contractSignatureIp: req.ip ?? "unknown",
  });

  res.json({ message: "Contract signed successfully." });
}

// ── POST /api/jobs/:jobId/checkout ────────────────────────────────────────────
export async function createCheckout(req: Request, res: Response): Promise<void> {
  const job = await Job.findOne({ jobId: req.params.jobId }).lean();
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  if (job.status !== "contract_signed") {
    res.status(400).json({ error: "Contract must be signed before payment." });
    return;
  }

  const provider = getProviderConfig();
  if (!provider.stripeSecretKey) {
    res.status(500).json({ error: "Payment gateway not configured." });
    return;
  }

  const stripe = new Stripe(provider.stripeSecretKey);
  const clientUrl = process.env.CLIENT_URL || "http://localhost:4200";
  const remaining = ((job.totalAmount - job.depositAmount) / 100).toFixed(2);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Deposit — ${job.serviceDescription}`,
            description: `Remaining balance due on completion: $${remaining}`,
          },
          unit_amount: job.depositAmount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    payment_intent_data: {
      capture_method: "manual",
    },
    success_url: `${clientUrl}/job/${job.jobId}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl}/job/${job.jobId}/checkout`,
    metadata: { jobId: job.jobId },
  });

  await Job.findByIdAndUpdate(job._id, { stripeSessionId: session.id });

  res.json({ checkoutUrl: session.url });
}

// ── PATCH /api/jobs/:jobId/complete ───────────────────────────────────────────
export async function markComplete(req: Request, res: Response): Promise<void> {
  const job = await Job.findOne({ jobId: req.params.jobId });
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  if (!["deposit_authorized", "deposit_paid", "in_progress"].includes(job.status)) {
    res.status(400).json({ error: "Job must have an authorized deposit before it can be marked complete." });
    return;
  }

  await Job.findByIdAndUpdate(job._id, {
    status: "pending_confirmation" as JobStatus,
    completedAt: new Date(),
  });

  const provider = getProviderConfig();
  const clientUrl = process.env.CLIENT_URL || "http://localhost:4200";

  if (provider.twilioAccountSid && provider.twilioAuthToken) {
    try {
      const smsClient = twilio(provider.twilioAccountSid, provider.twilioAuthToken);
      await smsClient.messages.create({
        body: `Your service from ${provider.name} is complete! Please confirm here: ${clientUrl}/job/${job.jobId}/confirm\nReply STOP to opt out. Msg & data rates may apply.`,
        from: provider.twilioPhoneNumber,
        to: job.customerPhone,
      });
    } catch (smsErr) {
      console.error("Twilio error (non-fatal):", smsErr);
    }
  }

  res.json({ message: "Job marked complete. Customer notified via SMS." });
}

// ── POST /api/jobs/:jobId/confirm ─────────────────────────────────────────────
export async function confirmCompletion(req: Request, res: Response): Promise<void> {
  const job = await Job.findOne({ jobId: req.params.jobId });
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  if (job.status !== "pending_confirmation") {
    res.status(400).json({ error: "Job is not awaiting confirmation." });
    return;
  }

  const provider = getProviderConfig();
  const remaining = ((job.totalAmount - job.depositAmount) / 100).toFixed(2);

  // Capture the authorized hold — this is when the deposit is actually charged.
  if (job.stripePaymentIntentId && provider.stripeSecretKey) {
    const stripe = new Stripe(provider.stripeSecretKey);
    await stripe.paymentIntents.capture(job.stripePaymentIntentId);
  }

  await Job.findByIdAndUpdate(job._id, {
    status: "completed" as JobStatus,
    customerConfirmedAt: new Date(),
    zelleInfoSentAt: new Date(),
  });

  if (provider.twilioAccountSid && provider.twilioAuthToken) {
    try {
      const smsClient = twilio(provider.twilioAccountSid, provider.twilioAuthToken);
      await smsClient.messages.create({
        body: `Thank you for confirming! Please send the remaining balance of $${remaining} via Zelle. ${provider.zelleInfo}\nReply STOP to opt out. Msg & data rates may apply.`,
        from: provider.twilioPhoneNumber,
        to: job.customerPhone,
      });
    } catch (smsErr) {
      console.error("Twilio error (non-fatal):", smsErr);
    }
  }

  res.json({
    message: "Completion confirmed. Zelle info sent.",
    zelleInfo: provider.zelleInfo,
    remainingBalance: remaining,
  });
}
