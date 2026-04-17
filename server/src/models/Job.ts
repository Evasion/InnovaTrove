import { Schema, model, Document, Types } from "mongoose";

export type JobStatus =
  | "link_sent"
  | "contract_signed"
  | "deposit_authorized"
  | "deposit_paid"
  | "in_progress"
  | "pending_confirmation"
  | "completed";

export interface IJob extends Document {
  jobId: string;
  // providerId is optional now; becomes required when multi-tenancy is added
  providerId?: Types.ObjectId;
  customerPhone: string;
  customerName?: string;
  serviceDescription: string;
  /** Stored in cents to avoid floating-point issues */
  totalAmount: number;
  /** Stored in cents */
  depositAmount: number;
  status: JobStatus;
  scheduledDate?: Date;
  timeSlotStart?: string;
  timeSlotEnd?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  contractSignedAt?: Date;
  contractSignatureData?: string;
  contractSignatureIp?: string;
  smsConsentGiven?: boolean;
  smsConsentAt?: Date;
  smsConsentIp?: string;
  smsLinkSentAt?: Date;
  depositPaidAt?: Date;
  completedAt?: Date;
  customerConfirmedAt?: Date;
  zelleInfoSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    providerId: { type: Schema.Types.ObjectId, ref: "ServiceProvider" },
    customerPhone: { type: String, required: true },
    customerName: String,
    serviceDescription: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    depositAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "link_sent",
        "contract_signed",
        "deposit_authorized",
        "deposit_paid",
        "in_progress",
        "pending_confirmation",
        "completed",
      ],
      default: "link_sent",
    },
    scheduledDate: Date,
    timeSlotStart: String,
    timeSlotEnd: String,
    stripeSessionId: String,
    stripePaymentIntentId: String,
    contractSignedAt: Date,
    contractSignatureData: String,
    contractSignatureIp: String,
    smsConsentGiven: { type: Boolean, default: false },
    smsConsentAt: Date,
    smsConsentIp: String,
    smsLinkSentAt: Date,
    depositPaidAt: Date,
    completedAt: Date,
    customerConfirmedAt: Date,
    zelleInfoSentAt: Date,
  },
  { timestamps: true }
);

export const Job = model<IJob>("Job", JobSchema);
