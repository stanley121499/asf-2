import React, { useEffect, useState } from "react";

interface Session {
  id: string;
  customer_details?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: Address;
  };
  payment_method_details?: {
    type?: string;
  };
  created?: number;
  shipping?: {
    address?: string;
  };
}
interface Address {
  city?: string;
  country?: string;
  line1?: string;
  line2?: string;
  postal_code?: string;
  state?: string;
}

const OrderSuccess: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const sessionId = new URLSearchParams(window.location.search).get(
    "session_id"
  );

  useEffect(() => {
    const fetchSession = async () => {
      if (sessionId) {
        const response = await fetch(
          `https://asf-serverless-2.vercel.app/api/get-checkout-session?session_id=${sessionId}`
        );
        const data = await response.json();
        setSession(data);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (!session) {
    return <div>Loading...</div>;
  }

  const formatAddress = (address: Address): string => {
    const {
      line1 = "",
      line2 = "",
      city = "",
      state = "",
      postal_code = "",
      country = "",
    } = address;

    // Construct the address array to handle optional values
    const addressParts = [
      line1,
      line2,
      city,
      state,
      postal_code,
      country,
    ].filter((part) => part && part.trim() !== ""); // Remove empty or undefined parts

    // Join all non-empty parts with a comma and a space
    return addressParts.join(", ");
  };

  const { customer_details, id, created } = session;
  const date = created ? new Date(created * 1000).toLocaleDateString() : "N/A";
  const customerName = customer_details?.name || "Customer";
  const address = session.customer_details?.address ? formatAddress(session.customer_details.address) : "N/A";
  const phone = session.customer_details?.phone || "N/A";

  return (
    <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16 h-screen flex flex-col justify-center">
      <div className="mx-auto max-w-2xl px-4 2xl:px-0">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl mb-2">
          Thanks for your order!
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 md:mb-8">
          Your order{" "}
          <span className="font-medium text-gray-900 dark:text-white">
            #{id}
          </span>{" "}
          will be processed within 24 hours during working days. We will notify
          you by email once your order has been shipped.
        </p>

        <div className="space-y-4 sm:space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800 mb-6 md:mb-8 max-w-full mx-auto">
          <dl className="sm:flex items-center justify-between gap-4">
            <dt className="font-normal mb-1 sm:mb-0 text-gray-500 dark:text-gray-400">
              Date
            </dt>
            <dd className="font-medium text-gray-900 dark:text-white sm:text-end">
              {date}
            </dd>
          </dl>
          <dl className="sm:flex items-center justify-between gap-4">
            <dt className="font-normal mb-1 sm:mb-0 text-gray-500 dark:text-gray-400">
              Name
            </dt>
            <dd className="font-medium text-gray-900 dark:text-white sm:text-end">
              {customerName}
            </dd>
          </dl>
          <dl className="sm:flex items-center justify-between gap-4">
            <dt className="font-normal mb-1 sm:mb-0 text-gray-500 dark:text-gray-400">
              Address
            </dt>
            <dd className="font-medium text-gray-900 dark:text-white sm:text-end">
              {address}
            </dd>
          </dl>
          <dl className="sm:flex items-center justify-between gap-4">
            <dt className="font-normal mb-1 sm:mb-0 text-gray-500 dark:text-gray-400">
              Phone
            </dt>
            <dd className="font-medium text-gray-900 dark:text-white sm:text-end">
              {phone}
            </dd>
          </dl>
        </div>

        <div className="flex items-center space-x-4">
          {/* <a
            href="#"
            className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800">
            Track your order
          </a> */}
          <a
            href="/"
            className="py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
            Return to shopping
          </a>
        </div>
      </div>
    </section>
  );
};

export default OrderSuccess;
