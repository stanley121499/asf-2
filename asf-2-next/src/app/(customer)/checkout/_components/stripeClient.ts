import { loadStripe, type Stripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

/**
 * Lazily loaded Stripe.js instance for Payment Element (client-only).
 */
export const stripePromise: Promise<Stripe | null> | null =
  typeof publishableKey === "string" && publishableKey.length > 0 ? loadStripe(publishableKey) : null;
