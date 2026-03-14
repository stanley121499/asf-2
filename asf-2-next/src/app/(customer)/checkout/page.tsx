"use client";
import React, { useState } from "react";
import {
  Button,
  Card,
  TextInput,
  Label,
  Checkbox,
  Select,
  Accordion,
  Spinner,
  Alert,
} from "flowbite-react";
import NavbarHome from "@/components/navbar-home";
import Link from "next/link";
import {
  HiOutlineShoppingCart,
  HiOutlineLocationMarker,
  HiOutlineDocumentText,
  HiOutlineCurrencyDollar,
  HiOutlineChevronLeft,
  HiOutlineShieldCheck,
} from "react-icons/hi";

// TypeScript interfaces
interface Address {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant: string;
}

enum CheckoutStep {
  Shipping = "shipping",
  Review = "review",
  Confirmation = "confirmation",
}

const CheckoutPage: React.FC = () => {
  // Mock data for cart items
  const cartItems: CartItem[] = [
    {
      id: "p1",
      name: "Wireless Noise-Cancelling Headphones",
      price: 99.99,
      quantity: 1,
      image: "/images/products/product-1.jpg",
      variant: "Black",
    },
    {
      id: "p2",
      name: "Smart Watch Series 5",
      price: 199.99,
      quantity: 2,
      image: "/images/products/product-2.jpg",
      variant: "Silver",
    },
    {
      id: "p3",
      name: "Premium Leather Wallet",
      price: 49.99,
      quantity: 1,
      image: "/images/products/product-3.jpg",
      variant: "Brown",
    },
  ];

  // Checkout state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(
    CheckoutStep.Shipping
  );

  // Shipping details
  const [shippingAddress, setShippingAddress] = useState<Address>({
    firstName: "John",
    lastName: "Doe",
    address1: "123 Main Street",
    address2: "Apt 4B",
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "United States",
    phone: "555-123-4567",
  });

  const [useAsBilling, setUseAsBilling] = useState<boolean>(true);
  const [billingAddress, setBillingAddress] =
    useState<Address>(shippingAddress);
  // Payment step and methods removed

  // Order details
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [orderError, setOrderError] = useState<string | null>(null);

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal;

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Handle form submission for each step
  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!useAsBilling) {
      // In a real app, validate billing address here
    }
    setCurrentStep(CheckoutStep.Review);
    window.scrollTo(0, 0);
  };
  

  const handlePlaceOrder = async () => {
    if (!agreeToTerms) {
      setOrderError(
        "请同意服务条款和条件后再提交订单。"
      );
      return;
    }

    setIsSubmitting(true);
    setOrderError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate a random order number
      // Generate a pseudo-random order number from timestamp
      const randomOrderNum = Math.floor(100000 + (Date.now() % 900000));
      setOrderNumber(`ORD-${randomOrderNum}`);

      // Move to confirmation step
      setCurrentStep(CheckoutStep.Confirmation);
      window.scrollTo(0, 0);
    } catch (error) {
      setOrderError(
        "处理订单时出错，请重试。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle navigation between steps
  const goToPreviousStep = () => {
    if (currentStep === CheckoutStep.Review) {
      setCurrentStep(CheckoutStep.Shipping);
    }
    window.scrollTo(0, 0);
  };

  // Handle address field changes
  const handleAddressChange = (
    field: keyof Address,
    value: string,
    addressType: "shipping" | "billing"
  ) => {
    if (addressType === "shipping") {
      setShippingAddress({
        ...shippingAddress,
        [field]: value,
      });

      // Update billing address if using same as shipping
      if (useAsBilling) {
        setBillingAddress({
          ...shippingAddress,
          [field]: value,
        });
      }
    } else {
      setBillingAddress({
        ...billingAddress,
        [field]: value,
      });
    }
  };

  // Toggle using same address for billing
  const handleUseAsBillingChange = (checked: boolean) => {
    setUseAsBilling(checked);
    if (checked) {
      setBillingAddress(shippingAddress);
    }
  };

  // Render shipping address form
  const renderAddressForm = (addressType: "shipping" | "billing") => {
    const address =
      addressType === "shipping" ? shippingAddress : billingAddress;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="mb-2">
            <Label htmlFor={`${addressType}-firstName`}>名</Label>
            <TextInput
              id={`${addressType}-firstName`}
              type="text"
              value={address.firstName}
              onChange={(e) =>
                handleAddressChange("firstName", e.target.value, addressType)
              }
              required
            />
          </div>
        </div>
        <div>
          <div className="mb-2">
            <Label htmlFor={`${addressType}-lastName`}>姓</Label>
            <TextInput
              id={`${addressType}-lastName`}
              type="text"
              value={address.lastName}
              onChange={(e) =>
                handleAddressChange("lastName", e.target.value, addressType)
              }
              required
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="mb-2">
            <Label htmlFor={`${addressType}-address1`}>地址行 1</Label>
            <TextInput
              id={`${addressType}-address1`}
              type="text"
              value={address.address1}
              onChange={(e) =>
                handleAddressChange("address1", e.target.value, addressType)
              }
              required
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="mb-2">
            <Label htmlFor={`${addressType}-address2`}>
              地址行 2（可选）
            </Label>
            <TextInput
              id={`${addressType}-address2`}
              type="text"
              value={address.address2}
              onChange={(e) =>
                handleAddressChange("address2", e.target.value, addressType)
              }
            />
          </div>
        </div>
        <div>
          <div className="mb-2">
            <Label htmlFor={`${addressType}-city`}>城市</Label>
            <TextInput
              id={`${addressType}-city`}
              type="text"
              value={address.city}
              onChange={(e) =>
                handleAddressChange("city", e.target.value, addressType)
              }
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-2">
              <Label htmlFor={`${addressType}-state`}>州/省</Label>
              <Select
                id={`${addressType}-state`}
                value={address.state}
                onChange={(e) =>
                  handleAddressChange("state", e.target.value, addressType)
                }
                required>
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                <option value="AZ">Arizona</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="NY">New York</option>
                {/* Add more states as needed */}
              </Select>
            </div>
          </div>
          <div>
            <div className="mb-2">
              <Label htmlFor={`${addressType}-postalCode`}>邮政编码</Label>
              <TextInput
                id={`${addressType}-postalCode`}
                type="text"
                value={address.postalCode}
                onChange={(e) =>
                  handleAddressChange("postalCode", e.target.value, addressType)
                }
                required
              />
            </div>
          </div>
        </div>
        <div>
          <div className="mb-2">
            <Label htmlFor={`${addressType}-country`}>国家</Label>
            <Select
              id={`${addressType}-country`}
              value={address.country}
              onChange={(e) =>
                handleAddressChange("country", e.target.value, addressType)
              }
              required>
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
              {/* Add more countries as needed */}
            </Select>
          </div>
        </div>
        <div>
          <div className="mb-2">
            <Label htmlFor={`${addressType}-phone`}>电话号码</Label>
            <TextInput
              id={`${addressType}-phone`}
              type="tel"
              value={address.phone}
              onChange={(e) =>
                handleAddressChange("phone", e.target.value, addressType)
              }
              required
            />
          </div>
        </div>
      </div>
    );
  };

  // Payment method capture removed

  // Render order summary for sidebar
  const renderOrderSummary = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.quantity}x
                </span>
                <span className="ml-2 text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                  {item.name}
                </span>
              </div>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">小计</span>
            <span className="text-gray-900 dark:text-white">
              {formatCurrency(subtotal)}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              总计
            </span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Different content based on the current step
  const renderStepContent = () => {
    switch (currentStep) {
      case CheckoutStep.Shipping:
        return (
          <form onSubmit={handleShippingSubmit}>
            <Card className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <HiOutlineLocationMarker className="mr-2 h-6 w-6" />
                配送信息
              </h2>

              {renderAddressForm("shipping")}

              <div className="mt-4">
                <Checkbox
                  id="useAsBilling"
                  checked={useAsBilling}
                  onChange={(e) => handleUseAsBillingChange(e.target.checked)}
                  className="mr-2"
                />
                <Label htmlFor="useAsBilling">用作账单地址</Label>
              </div>
            </Card>

            {!useAsBilling && (
              <Card className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  账单信息
                </h2>

                {renderAddressForm("billing")}
              </Card>
            )}

            

            <div className="flex justify-end">
              <Button type="submit" color="blue">
                继续付款
              </Button>
            </div>
          </form>
        );

      

      case CheckoutStep.Review:
        return (
          <>
            <Card className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <HiOutlineDocumentText className="mr-2 h-6 w-6" />
                确认订单
              </h2>

              <div className="space-y-6">
                <Accordion>
                  <Accordion.Panel key="shipping">
                    <Accordion.Title>配送信息</Accordion.Title>
                    <Accordion.Content>
                      <div className="space-y-2">
                        <p className="font-medium">
                          {shippingAddress.firstName} {shippingAddress.lastName}
                        </p>
                        <p>{shippingAddress.address1}</p>
                        {shippingAddress.address2 && (
                          <p>{shippingAddress.address2}</p>
                        )}
                        <p>
                          {shippingAddress.city}, {shippingAddress.state}{" "}
                          {shippingAddress.postalCode}
                        </p>
                        <p>{shippingAddress.country}</p>
                        <p>{shippingAddress.phone}</p>
                      </div>

                      
                    </Accordion.Content>
                  </Accordion.Panel>

                  <Accordion.Panel key="billing">
                    <Accordion.Title>账单信息</Accordion.Title>
                    <Accordion.Content>
                      <div className="space-y-2">
                        <p className="font-medium">
                          {billingAddress.firstName} {billingAddress.lastName}
                        </p>
                        <p>{billingAddress.address1}</p>
                        {billingAddress.address2 && (
                          <p>{billingAddress.address2}</p>
                        )}
                        <p>
                          {billingAddress.city}, {billingAddress.state}{" "}
                          {billingAddress.postalCode}
                        </p>
                        <p>{billingAddress.country}</p>
                        <p>{billingAddress.phone}</p>
                      </div>
                    </Accordion.Content>
                  </Accordion.Panel>

                  

                  <Accordion.Panel key="items">
                    <Accordion.Title>订单商品</Accordion.Title>
                    <Accordion.Content>
                      <div className="space-y-4">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex items-start">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-md mr-4"
                            />
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                规格：{item.variant}
                              </p>
                              <div className="flex items-center mt-1">
                                <span className="text-sm">
                                  {item.quantity} x {formatCurrency(item.price)}
                                </span>
                                <span className="ml-2 font-medium">
                                  = {formatCurrency(item.price * item.quantity)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Accordion.Content>
                  </Accordion.Panel>
                </Accordion>

                <div className="mt-6">
                  <Label htmlFor="orderNotes">订单备注（可选）</Label>
                  <textarea
                    id="orderNotes"
                    rows={3}
                    className="block w-full border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="配送特殊说明或其他备注"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                  />
                </div>

                <div className="flex items-start mt-4">
                  <div className="flex items-center h-5">
                    <Checkbox
                      id="terms"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="mr-2"
                    />
                  </div>
                  <Label htmlFor="terms" className="text-sm">
                    我同意{" "}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      服务条款
                    </Link>{" "}
                    和{" "}
                    <Link href="/privacy"
                      className="text-blue-600 hover:underline">
                      隐私政策
                    </Link>
                  </Label>
                </div>

                {orderError && (
                  <Alert color="failure">
                    <span className="font-medium">错误！</span> {orderError}
                  </Alert>
                )}
              </div>
            </Card>

            <div className="flex justify-between">
              <Button type="button" color="light" onClick={goToPreviousStep}>
                <HiOutlineChevronLeft className="mr-2 h-5 w-5" />
                返回配送
              </Button>
              <Button
                type="button"
                color="blue"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    处理中...
                  </>
                ) : (
                  <>
                    <HiOutlineCurrencyDollar className="mr-2 h-5 w-5" />
                    提交订单（{formatCurrency(total)}）
                  </>
                )}
              </Button>
            </div>
          </>
        );

      case CheckoutStep.Confirmation:
        return (
          <Card>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <HiOutlineShieldCheck className="h-10 w-10 text-green-600 dark:text-green-300" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                订单已确认！
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                感谢您的购买，您的订单已收到并正在处理中。
              </p>

              <div className="mb-6">
                <div className="inline-block bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 mb-4">
                  <p className="text-gray-800 dark:text-gray-200">
                    订单编号：
                  </p>
                  <p className="text-xl font-bold">{orderNumber}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  订单摘要
                </h3>
                {renderOrderSummary()}
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                确认邮件已发送至您的邮箱。
              </p>

              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3">
                <Link href="/orders">
                  <Button color="blue">查看订单</Button>
                </Link>
                <Link href="/">
                  <Button color="light">继续购物</Button>
                </Link>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  // Steps indicator
  const renderStepsIndicator = () => {
    return (
      <div className="mb-8">
        <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400 sm:text-base">
          {[
            { key: CheckoutStep.Shipping, label: "配送" },
            { key: CheckoutStep.Review, label: "确认" },
            { key: CheckoutStep.Confirmation, label: "已完成" },
          ].map((step, index) => {
            const isActive = currentStep === step.key;
            const isPassed =
              (currentStep === CheckoutStep.Review &&
                step.key === CheckoutStep.Shipping) ||
              currentStep === CheckoutStep.Confirmation;

            return (
              <li
                key={step.key}
                className={`flex md:w-full items-center ${
                  isPassed ? "text-blue-600 dark:text-blue-500" : ""
                } ${isActive ? "text-blue-600 dark:text-blue-500" : ""} ${
                  index === 3
                    ? "sm:flex-auto"
                    : 'after:content-[""] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700'
                }`}>
                <span
                  className={`flex items-center justify-center w-8 h-8 ${
                    isPassed || isActive
                      ? "bg-blue-100 dark:bg-blue-800"
                      : "bg-gray-100 dark:bg-gray-700"
                  } rounded-full shrink-0`}>
                  {isPassed ? (
                    <svg
                      className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 16 12">
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M1 5.917 5.724 10.5 15 1.5"
                      />
                    </svg>
                  ) : (
                    <span
                      className={
                        isActive ? "text-blue-600 dark:text-blue-500" : ""
                      }>
                      {index + 1}
                    </span>
                  )}
                </span>
                <span className="hidden sm:inline-flex sm:ml-2">
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    );
  };

  return (
    <>
      <NavbarHome />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/cart"
              className="inline-flex items-center text-blue-600 hover:underline">
              <HiOutlineChevronLeft className="mr-2 h-5 w-5" />
              返回购物车
            </Link>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <HiOutlineShoppingCart className="mr-3 h-8 w-8" />
            结账
          </h1>

          {/* Steps indicator */}
          {currentStep !== CheckoutStep.Confirmation && renderStepsIndicator()}

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">{renderStepContent()}</div>

            {currentStep !== CheckoutStep.Confirmation && (
              <div className="lg:col-span-1">
                <Card>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    订单摘要
                  </h2>

                  {renderOrderSummary()}
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
