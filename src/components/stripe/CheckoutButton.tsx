import React from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY!);

interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutButtonProps {
  items: CartItem[];
  customerId: string;
  buttonTitle?: string;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  items,
  customerId,
  buttonTitle,
}) => {
  const handleCheckout = async () => {
    try {
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error("Stripe has not loaded correctly.");
      }

      // Call the Vercel serverless function to create a checkout session
      const response = await fetch(
        "https://asf-serverless-2.vercel.app/api/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items, customerId }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Error creating checkout session: ${response.statusText}`
        );
      }

      const { id: sessionId } = await response.json();
      console.log(sessionId);
      if (!sessionId) {
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
      onClick={handleCheckout}>
      {buttonTitle || "Proceed to Checkout"}
    </button>
  );
};

export default CheckoutButton;
