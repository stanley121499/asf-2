import React from "react";
import { loadStripe } from "@stripe/stripe-js";

/**
 * Read and validate the Stripe public key from the environment.
 * We avoid unsafe casts so this remains strict and resilient.
 */
const stripePublicKeyEnv = process.env.REACT_APP_STRIPE_PUBLIC_KEY;
const stripePublicKey: string | undefined =
  typeof stripePublicKeyEnv === "string" && stripePublicKeyEnv.trim().length > 0
    ? stripePublicKeyEnv
    : undefined;

const stripePromise = loadStripe(stripePublicKey ?? "");

interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutButtonProps {
  items: CartItem[];
  customerId: string;
  buttonTitle?: string;
  /**
   * Optional pre-check that must pass before redirecting to Stripe.
   * Return `false` to block checkout.
   */
  beforeCheckout?: () => boolean | Promise<boolean>;
  /** Optional disabled flag for UI and click-blocking. */
  disabled?: boolean;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  items,
  customerId,
  buttonTitle,
  beforeCheckout,
  disabled,
}) => {
  /**
   * Type guard for the session response returned by the serverless endpoint.
   */
  const isSessionResponse = (value: unknown): value is { id: string } => {
    if (typeof value !== "object" || value === null) {
      return false;
    }
    if (!("id" in value)) {
      return false;
    }
    const record = value as Record<string, unknown>;
    return typeof record.id === "string" && record.id.trim().length > 0;
  };

  /**
   * Compute the base URL for return/cancel navigation.
   */
  const getAppBaseUrl = (): string => {
    const envRaw = process.env.REACT_APP_ENV;
    const envString: string = typeof envRaw === "string" ? envRaw : "";
    const env: string = envString.toLowerCase().trim();
    const appUrlEnv = process.env.REACT_APP_APP_URL;
    const appUrl: string | undefined =
      typeof appUrlEnv === "string" && appUrlEnv.trim().length > 0 ? appUrlEnv : undefined;
    const portEnvRaw = process.env.REACT_APP_PORT;
    const portEnv: string | undefined =
      typeof portEnvRaw === "string" && portEnvRaw.trim().length > 0 ? portEnvRaw : undefined;
    const isDev: boolean = env === "development" || env.startsWith("dev") || env.includes("local");

    console.log(env, appUrl, portEnv, isDev);
    console.log("Condition Check:", isDev);

    if (isDev) {
      const port: string = portEnv && /^\d+$/.test(portEnv) ? portEnv : "3000";
      return `http://localhost:${port}`;
    }

    if (appUrl && appUrl.trim().length > 0) {
      return appUrl.replace(/\/$/, "");
    }

    return window.location.origin;
  };

  /**
   * Initiate Stripe Checkout session creation and redirect.
   */
  const handleCheckout = async (): Promise<void> => {
    try {
      // Block click when disabled (UI may still call onClick in some browsers).
      if (disabled) {
        return;
      }

      // Optional caller validation hook.
      if (beforeCheckout) {
        const allowed = await beforeCheckout();
        if (!allowed) {
          return;
        }
      }

      // Validate required inputs early to fail fast with a clear message.
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("No items provided for checkout.");
      }
      if (typeof customerId !== "string" || customerId.trim().length === 0) {
        throw new Error("Missing customer id for checkout.");
      }

      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error("Stripe has not loaded correctly.");
      }

      if (!stripePublicKey) {
        throw new Error("Missing Stripe public key environment variable.");
      }

      const baseUrl = getAppBaseUrl();
      const successUrl = `${baseUrl}/order-success`;
      const cancelUrl = `${baseUrl}/order-cancel`;
      
      // Call the Vercel serverless function to create a checkout session
      const response = await fetch(
        "https://asf-serverless-2.vercel.app/api/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items, customerId, successUrl, cancelUrl }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Error creating checkout session: ${response.statusText}`
        );
      }

      const json: unknown = await response.json();
      if (!isSessionResponse(json)) {
        throw new Error("Unexpected response when creating a checkout session.");
      }
      const sessionId = json.id;
      if (!sessionId || sessionId.trim().length === 0) {
        throw new Error("Session ID is not available.");
      }

      // Redirect to Stripe Checkout
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("There was an issue with the checkout process. Please try again.");
    }
  };

  return (
    // <Button onClick={handleCheckout} color={"blue"} size={"lg"}>
    //   Checkout Now
    // </Button>
    <button
      className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 sm:mt-0"
      onClick={() => void handleCheckout()}
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
    >
      {buttonTitle || "Proceed to Checkout"}
    </button>
  );
};

export default CheckoutButton;
