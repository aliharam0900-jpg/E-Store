import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === "production") {
  console.warn("⚠️ STRIPE_SECRET_KEY is missing from environment variables.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-02-25.acacia" as any,
  appInfo: {
    name: "Enterprise E-Store Monolith",
    version: "1.0.0",
  },
});
