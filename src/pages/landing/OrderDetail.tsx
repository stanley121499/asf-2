import React, { useState, useEffect } from "react";
import { Button, Card, Badge, Timeline, Alert, Avatar, Spinner } from "flowbite-react";
import NavbarHome from "../../components/navbar-home";
import { Link, useParams, useNavigate } from "react-router-dom";
import { 
  HiOutlineArrowLeft, 
  HiOutlinePrinter, 
  HiOutlineDocumentDownload, 
  HiOutlineClipboardCheck,
  HiOutlineTruck,
  HiOutlineCalendar,
  HiOutlineShoppingBag,
  HiOutlineCreditCard,
  HiOutlineLocationMarker,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineX,
  HiOutlineQuestionMarkCircle
} from "react-icons/hi";

// Define TypeScript types for the component
interface OrderItem {
  id: string;
  name: string;
  variant: string;
  price: number;
  quantity: number;
  image: string;
}

interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface OrderStatus {
  status: "processing" | "confirmed" | "shipped" | "delivered" | "cancelled";
  timestamp: string;
  details?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: "processing" | "confirmed" | "shipped" | "delivered" | "cancelled";
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  total: number;
  paymentMethod: string;
  lastFour?: string;
  shippingAddress: Address;
  billingAddress: Address;
  trackingNumber?: string;
  carrierName?: string;
  estimatedDelivery?: string;
  statusHistory: OrderStatus[];
}

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Mock function to fetch order data
  useEffect(() => {
    // Simulate API call
    const fetchOrder = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        // For demo purposes, we're creating mock data
        const mockOrder: Order = {
          id: "123",
          orderNumber: "ORD-2023-4567",
          date: "2023-05-15T14:30:00Z",
          status: "delivered",
          items: [
            {
              id: "item1",
              name: "Wireless Headphones",
              variant: "Black",
              price: 49.99,
              quantity: 1,
              image: "/images/products/product-1.jpg"
            },
            {
              id: "item2",
              name: "Smart Watch",
              variant: "Silver",
              price: 89.99,
              quantity: 1,
              image: "/images/products/product-2.jpg"
            },
            {
              id: "item3",
              name: "Bluetooth Speaker",
              variant: "Blue",
              price: 34.99,
              quantity: 1,
              image: "/images/products/product-3.jpg"
            }
          ],
          subtotal: 174.97,
          shipping: 5.99,
          tax: 14.04,
          discount: 70.00,
          total: 125.00,
          paymentMethod: "Credit Card",
          lastFour: "4242",
          shippingAddress: {
            name: "John Doe",
            line1: "123 Main Street",
            line2: "Apt 4B",
            city: "New York",
            state: "NY",
            postalCode: "10001",
            country: "United States",
            phone: "+1 (555) 123-4567"
          },
          billingAddress: {
            name: "John Doe",
            line1: "123 Main Street",
            line2: "Apt 4B",
            city: "New York",
            state: "NY",
            postalCode: "10001",
            country: "United States",
            phone: "+1 (555) 123-4567"
          },
          trackingNumber: "1Z999AA10123456784",
          carrierName: "UPS",
          estimatedDelivery: "2023-05-20",
          statusHistory: [
            {
              status: "processing",
              timestamp: "2023-05-15T14:30:00Z",
              details: "Order placed and payment confirmed"
            },
            {
              status: "confirmed",
              timestamp: "2023-05-16T09:45:00Z",
              details: "Order confirmed and sent to warehouse"
            },
            {
              status: "shipped",
              timestamp: "2023-05-17T10:20:00Z",
              details: "Order shipped via UPS with tracking number 1Z999AA10123456784"
            },
            {
              status: "delivered",
              timestamp: "2023-05-19T15:10:00Z",
              details: "Package delivered and signed for by resident"
            }
          ]
        };

        // Wait for 1 second to simulate network delay
        setTimeout(() => {
          if (id === "123") {
            setOrder(mockOrder);
          } else {
            // Show an error for any other ID to demonstrate error handling
            setError("Order not found. Please check the order ID and try again.");
          }
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError("An error occurred while fetching the order. Please try again later.");
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // Format date
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      year: "numeric", 
      month: "long", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate current step for stepper
  const getCurrentStep = (status: string): number => {
    switch (status) {
      case "processing":
        return 1;
      case "confirmed":
        return 2;
      case "shipped":
        return 3;
      case "delivered":
        return 4;
      case "cancelled":
        return 0;
      default:
        return 0;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return HiOutlineClock;
      case "confirmed":
        return HiOutlineClipboardCheck;
      case "shipped":
        return HiOutlineTruck;
      case "delivered":
        return HiOutlineCheckCircle;
      case "cancelled":
        return HiOutlineX;
      default:
        return HiOutlineQuestionMarkCircle;
    }
  };

  // Generate status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "processing":
        return "info";
      case "confirmed":
        return "info";
      case "shipped":
        return "warning";
      case "delivered":
        return "success";
      case "cancelled":
        return "failure";
      default:
        return "gray";
    }
  };

  if (loading) {
    return (
      <>
        <NavbarHome />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <Spinner size="xl" />
            <p className="mt-4 text-gray-700 dark:text-gray-300">Loading order details...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <NavbarHome />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <Card>
              <div className="text-center p-6">
                <Alert color="failure">
                  <p>{error || "Order not found"}</p>
                </Alert>
                <Button 
                  color="gray" 
                  className="mt-4"
                  onClick={() => navigate("/orders")}
                >
                  <HiOutlineArrowLeft className="mr-2 h-5 w-5" />
                  Back to Orders
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavbarHome />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header with order summary */}
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div>
                <div className="flex items-center mb-2">
                  <Link to="/orders">
                    <Button color="gray" size="xs" className="mr-3">
                      <HiOutlineArrowLeft className="mr-1 h-4 w-4" />
                      Back
                    </Button>
                  </Link>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Order #{order.orderNumber}
                  </h1>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Placed on {formatDate(order.date)}
                </p>
              </div>
              <div className="flex space-x-2 mt-4 md:mt-0">
                <Button color="light" size="sm">
                  <HiOutlinePrinter className="mr-2 h-5 w-5" />
                  Print
                </Button>
                <Button color="light" size="sm">
                  <HiOutlineDocumentDownload className="mr-2 h-5 w-5" />
                  Download Invoice
                </Button>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex flex-wrap gap-4">
                <Badge color={getStatusColor(order.status)} size="lg">
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
                {order.trackingNumber && (
                  <div className="flex items-center">
                    <HiOutlineTruck className="mr-1 h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 mr-1">
                      Tracking:
                    </span>
                    <Link to={`/orders/${order.id}/tracking`} className="text-sm text-blue-600 hover:underline">
                      {order.trackingNumber}
                    </Link>
                  </div>
                )}
                {order.estimatedDelivery && (
                  <div className="flex items-center">
                    <HiOutlineCalendar className="mr-1 h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 mr-1">
                      Estimated Delivery:
                    </span>
                    <span className="text-sm font-medium">
                      {new Date(order.estimatedDelivery).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Order Status/Progress */}
          {order.status !== "cancelled" && (
            <Card className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Order Progress
              </h2>
              <div className="relative">
                <Timeline>
                  <Timeline.Item>
                    <Timeline.Point icon={HiOutlineShoppingBag} />
                    <Timeline.Content>
                      <Timeline.Title>Order Placed</Timeline.Title>
                      <Timeline.Time>
                        {formatDate(order.statusHistory[0]?.timestamp || order.date)}
                      </Timeline.Time>
                      <Timeline.Body>
                        {getCurrentStep(order.status) > 0 && (
                          <Badge color="success" className="mt-1">Completed</Badge>
                        )}
                      </Timeline.Body>
                    </Timeline.Content>
                  </Timeline.Item>
                  <Timeline.Item>
                    <Timeline.Point icon={HiOutlineClipboardCheck} />
                    <Timeline.Content>
                      <Timeline.Title>Order Confirmed</Timeline.Title>
                      {order.statusHistory[1] && (
                        <Timeline.Time>
                          {formatDate(order.statusHistory[1].timestamp)}
                        </Timeline.Time>
                      )}
                      <Timeline.Body>
                        {getCurrentStep(order.status) > 1 ? (
                          <Badge color="success" className="mt-1">Completed</Badge>
                        ) : getCurrentStep(order.status) === 1 ? (
                          <Badge color="info" className="mt-1">In Progress</Badge>
                        ) : (
                          <Badge color="gray" className="mt-1">Pending</Badge>
                        )}
                      </Timeline.Body>
                    </Timeline.Content>
                  </Timeline.Item>
                  <Timeline.Item>
                    <Timeline.Point icon={HiOutlineTruck} />
                    <Timeline.Content>
                      <Timeline.Title>Shipped</Timeline.Title>
                      {order.statusHistory[2] && (
                        <Timeline.Time>
                          {formatDate(order.statusHistory[2].timestamp)}
                        </Timeline.Time>
                      )}
                      <Timeline.Body>
                        {getCurrentStep(order.status) > 2 ? (
                          <Badge color="success" className="mt-1">Completed</Badge>
                        ) : getCurrentStep(order.status) === 2 ? (
                          <Badge color="info" className="mt-1">In Progress</Badge>
                        ) : (
                          <Badge color="gray" className="mt-1">Pending</Badge>
                        )}
                      </Timeline.Body>
                    </Timeline.Content>
                  </Timeline.Item>
                  <Timeline.Item>
                    <Timeline.Point icon={HiOutlineCheckCircle} />
                    <Timeline.Content>
                      <Timeline.Title>Delivered</Timeline.Title>
                      {order.statusHistory[3] && (
                        <Timeline.Time>
                          {formatDate(order.statusHistory[3].timestamp)}
                        </Timeline.Time>
                      )}
                      <Timeline.Body>
                        {getCurrentStep(order.status) > 3 ? (
                          <Badge color="success" className="mt-1">Completed</Badge>
                        ) : getCurrentStep(order.status) === 3 ? (
                          <Badge color="info" className="mt-1">In Progress</Badge>
                        ) : (
                          <Badge color="gray" className="mt-1">Pending</Badge>
                        )}
                      </Timeline.Body>
                    </Timeline.Content>
                  </Timeline.Item>
                </Timeline>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Items */}
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Items in Your Order
                </h2>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                      <div className="w-20 h-20 flex-shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                      <div className="ml-4 flex-grow">
                        <Link to={`/product-details/product-${item.id}`} className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600">
                          {item.name}
                        </Link>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Variant: {item.variant}
                        </p>
                        <div className="flex justify-between mt-2">
                          <p className="text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Qty: </span>
                            <span className="font-medium">{item.quantity}</span>
                          </p>
                          <p className="font-medium">${item.price.toFixed(2)}</p>
                        </div>
                        {order.status === "delivered" && (
                          <div className="mt-3">
                            <Link to={`/product-details/product-${item.id}/review`}>
                              <Button size="xs" color="light">Write a Review</Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Order History Timeline */}
              <Card>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Order History
                </h2>
                <Timeline>
                  {order.statusHistory.map((status, index) => {
                    const StatusIcon = getStatusIcon(status.status);
                    return (
                      <Timeline.Item key={index}>
                        <Timeline.Point icon={StatusIcon} />
                        <Timeline.Content>
                          <Timeline.Time>
                            {formatDate(status.timestamp)}
                          </Timeline.Time>
                          <Timeline.Title>
                            {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                          </Timeline.Title>
                          {status.details && (
                            <Timeline.Body>
                              {status.details}
                            </Timeline.Body>
                          )}
                        </Timeline.Content>
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              </Card>
            </div>

            {/* Order Summary and Details */}
            <div className="lg:col-span-1">
              <Card className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Order Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                    <span>${order.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  {order.discount && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Payment Information
                </h2>
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-md mr-3">
                    <HiOutlineCreditCard className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.paymentMethod}
                    </p>
                    {order.lastFour && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ending in {order.lastFour}
                      </p>
                    )}
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    Billing Address
                  </h3>
                  <address className="not-italic text-sm text-gray-600 dark:text-gray-400">
                    {order.billingAddress.name}<br />
                    {order.billingAddress.line1}<br />
                    {order.billingAddress.line2 && <>{order.billingAddress.line2}<br /></>}
                    {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}<br />
                    {order.billingAddress.country}<br />
                    {order.billingAddress.phone}
                  </address>
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Shipping Information
                </h2>
                <div className="flex items-start mb-4">
                  <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-md mr-3 mt-1">
                    <HiOutlineLocationMarker className="h-6 w-6 text-orange-600 dark:text-orange-300" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      Shipping Address
                    </h3>
                    <address className="not-italic text-sm text-gray-600 dark:text-gray-400">
                      {order.shippingAddress.name}<br />
                      {order.shippingAddress.line1}<br />
                      {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                      {order.shippingAddress.country}<br />
                      {order.shippingAddress.phone}
                    </address>
                  </div>
                </div>
                {order.trackingNumber && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      Shipping Method
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.carrierName} Standard Shipping
                    </p>
                    <div className="mt-2">
                      <Link to={`/orders/${order.id}/tracking`}>
                        <Button size="xs" color="light">
                          <HiOutlineTruck className="mr-2 h-4 w-4" />
                          Track Package
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Help section */}
          <div className="mt-6">
            <Card>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Need Help?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/support-chat">
                  <Button color="blue" fullSized>
                    <HiOutlineQuestionMarkCircle className="mr-2 h-5 w-5" />
                    Chat with Support
                  </Button>
                </Link>
                {order.status !== "delivered" && order.status !== "cancelled" && (
                  <Button color="light" fullSized>
                    Cancel Order
                  </Button>
                )}
                {order.status === "delivered" && (
                  <Button color="light" fullSized>
                    Return Items
                  </Button>
                )}
                <Link to="/faq#orders">
                  <Button color="light" fullSized>
                    Order FAQs
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetailPage; 