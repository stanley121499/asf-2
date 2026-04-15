import Stripe from "stripe";

let stripeSingleton: Stripe | undefined;

/**
 * Lazily constructs a singleton Stripe SDK instance using STRIPE_SECRET_KEY.
 */
export function getStripe(): Stripe {
  if (stripeSingleton !== undefined) {
    return stripeSingleton;
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (key === undefined || key.length === 0) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  stripeSingleton = new Stripe(key);
  return stripeSingleton;
}
