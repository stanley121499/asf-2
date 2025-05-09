import React, { useEffect, useState } from "react";
import CheckoutButton from "../../components/stripe/CheckoutButton";
import NavbarHome from "../../components/navbar-home";
import { useAuthContext } from "../../context/AuthContext";
import LoadingPage from "../pages/loading";

interface CartItem {
  name: string;
  price: number;
  quantity: number;
  media_url: string;
  id: string;
}

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>(
    JSON.parse(localStorage.getItem("cart") || "[]")
  );
  const { user } = useAuthContext();
  const [promoCodeInput, setPromoCodeInput] = useState("");

  const handleIncrement = (index: number) => {
    setCartItems((prevCartItems) =>
      prevCartItems.map((item, i) =>
        i === index ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
    // Temp: use localStorage to store cart items
    const updatedCart = cartItems.map((item, i) =>
      i === index ? { ...item, quantity: item.quantity + 1 } : item
    );
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const handleDecrement = (index: number) => {
    setCartItems((prevCartItems) =>
      prevCartItems.map((item, i) =>
        i === index && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
    // Temp: use localStorage to store cart items
    const updatedCart = cartItems.map((item, i) =>
      i === index && item.quantity > 1
        ? { ...item, quantity: item.quantity - 1 }
        : item
    );
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const handleRemove = (index: number) => {
    setCartItems((prevCartItems) =>
      prevCartItems.filter((_, i) => i !== index)
    );
    // Temp: use localStorage to store cart items
    const updatedCart = cartItems.filter((_, i) => i !== index);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (!user) {
    return <LoadingPage />;
  }

  return (
    <>
      <NavbarHome />

      <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl mb-6 text-center">
              Your Cart
            </h2>

            <div className="relative mt-6 overflow-x-auto border-b border-gray-200 dark:border-gray-800 sm:mt-8">
              <table className="w-full text-left text-base text-gray-900 dark:text-white md:table-fixed">
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {cartItems.map((item, index) => (
                    <tr key={index}>
                      <td className="w-96 min-w-56 whitespace-nowrap py-4">
                        <a
                          href={`/product-details/${item.id}`}
                          className="flex items-center gap-4 font-medium hover:underline">
                          <img
                            src={item.media_url}
                            alt="product"
                            className="w-16 h-16 rounded-lg"
                          />
                          {item.name}
                        </a>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => handleDecrement(index)}
                            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700">
                            <svg
                              className="h-2.5 w-2.5 text-gray-900 dark:text-white"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 18 2">
                              <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M1 1h16"
                              />
                            </svg>
                          </button>
                          <input
                            type="text"
                            value={item.quantity}
                            readOnly
                            className="w-10 shrink-0 border-0 bg-transparent text-center text-sm font-medium text-gray-900 focus:outline-none focus:ring-0 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleIncrement(index)}
                            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700">
                            <svg
                              className="h-2.5 w-2.5 text-gray-900 dark:text-white"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 18 18">
                              <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 1v16M1 9h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>

                      <td className="p-4 text-end text-base font-bold text-gray-900 dark:text-white">
                        ${(item.price / 100) * item.quantity}
                      </td>

                      <td className="py-4">
                        <button
                          onClick={() => handleRemove(index)}
                          type="button"
                          className="ml-auto block rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:text-gray-400">
                          <span className="sr-only"> Remove </span>
                          <svg
                            className="h-5 w-5"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            viewBox="0 0 24 24">
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                Order summary
              </p>

              <div className="mt-6 space-y-4">
                <dl className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2 dark:border-gray-700">
                  <dt className="text-base font-bold text-gray-900 dark:text-white">
                    Total
                  </dt>
                  <dd className="text-base font-bold text-gray-900 dark:text-white">
                    ${(totalPrice / 100).toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>

            {/* Promotion code area */}

            <div className="mt-6">
              <label
                htmlFor="promo_code"
                className="block text-sm font-medium text-gray-900 dark:text-white">
                Promotion code
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <input
                  type="text"
                  name="promo_code"
                  id="promo_code"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white"
                  onClick={() => setPromoCodeInput("")}>
                  Apply
                </button>
              </div>
            </div>

            <div className="mt-6 gap-4 sm:flex sm:items-center sm:justify-center">
              <button className="w-full flex rounded-lg border border-gray-200 bg-white px-5 py-2.5 justify-center text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                Continue Shopping
              </button>
              <div className="mt-4 flex w-full items-center justify-center sm:mt-0">
                <CheckoutButton items={cartItems} customerId={user.id} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CartPage;
