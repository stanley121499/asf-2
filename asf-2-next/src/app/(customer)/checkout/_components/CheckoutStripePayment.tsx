"use client";

import React, { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Alert, Button, Spinner } from "flowbite-react";

interface CheckoutStripePaymentInnerProps {
  /** Pending order id — echoed in Stripe return_url for the success page. */
  orderId: string;
}

/**
 * Payment Element + confirm button. Must be rendered inside `<Elements>` with `clientSecret`.
 */
export function CheckoutStripePaymentInner(props: CheckoutStripePaymentInnerProps): React.ReactElement {
  const { orderId } = props;
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async (): Promise<void> => {
    if (stripe === null || elements === null) {
      return;
    }
    setErrorMessage(null);
    setSubmitting(true);
    const returnUrl = `${window.location.origin}/order-success?order_id=${encodeURIComponent(orderId)}`;
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });
    if (error !== null) {
      setErrorMessage(error.message ?? "Payment failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
      {errorMessage !== null ? <Alert color="failure">{errorMessage}</Alert> : null}
      <Button
        type="button"
        color="blue"
        onClick={() => void handleConfirm()}
        disabled={submitting || stripe === null || elements === null}>
        {submitting ? (
          <>
            <Spinner size="sm" className="mr-2" />
            处理中...
          </>
        ) : (
          "提交订单并付款"
        )}
      </Button>
    </div>
  );
}
