import React from 'react';

const OrderCancel: React.FC = () => {
  return (
    <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16 h-screen flex flex-col justify-center">
      <div className="mx-auto max-w-2xl px-4 2xl:px-0">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl mb-2">
          Order Cancelled
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 md:mb-8">
          It looks like you canceled your order. If you wish to try again, you can restart the checkout process, or contact our support team if you need assistance.
        </p>

        <div className="flex items-center space-x-4">
          <a
            href="/"
            className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
          >
            Continue Shopping
          </a>
          <a
            href="/support"
            className="py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
};

export default OrderCancel;
