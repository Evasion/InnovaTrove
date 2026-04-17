import { Schema, model, Document } from "mongoose";

export interface IServiceProvider extends Document {
  name: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  contractText: string;
  zelleInfo: string;
  stripeSecretKey: string;
  stripePublishableKey: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  isDefault: boolean;
  isActive: boolean;
}

const ServiceProviderSchema = new Schema<IServiceProvider>(
  {
    name: { type: String, required: true },
    logoUrl: String,
    primaryColor: { type: String, default: "#3b82f6" },
    accentColor: { type: String, default: "#6366f1" },
    contractText: {
      type: String,
      default:
        "By signing below, you agree to the service terms and authorise the deposit payment.",
    },
    zelleInfo: { type: String, required: true },
    stripeSecretKey: { type: String, required: true },
    stripePublishableKey: { type: String, required: true },
    twilioAccountSid: { type: String, required: true },
    twilioAuthToken: { type: String, required: true },
    twilioPhoneNumber: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ServiceProvider = model<IServiceProvider>(
  "ServiceProvider",
  ServiceProviderSchema
);
