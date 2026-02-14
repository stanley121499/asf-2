import React, { useEffect, useState } from "react";
import { Card, Badge, Button } from "flowbite-react";
import { useParams, useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi";
import NavbarHome from "../../components/navbar-home";
import { supabase } from "../../utils/supabaseClient";
import type { Database } from "../../database.types";
import { formatCurrency } from "../../utils/pointsConfig";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

interface OrderItemWithProduct extends OrderItemRow {
  product: {
    id: string;
    name: string;
    price: number;
  } | null;
  color: {
    id: string;
    color: string;
  } | null;
  size: {
    id: string;
    size: string;
  } | null;
}

interface OrderDetail extends OrderRow {
  items: OrderItemWithProduct[];
}

/**
 * OrderDetail
 *
 * Displays detailed information about a specific order including items,
 * shipping details, and order status.
 */
const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        navigate("/settings");
        return;
      }

      try {
        setLoading(true);

        // Fetch order
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (orderError || !orderData) {
          throw new Error(orderError?.message || "Order not found");
        }

        // Fetch order items with product details
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select(`
            *,
            product:products(id, name, price),
            color:product_colors(id, color),
            size:product_sizes(id, size)
          `)
          .eq("order_id", orderId);

        if (itemsError) {
          throw new Error(itemsError.message);
        }

        setOrder({
          ...orderData,
          items: itemsData || [],
        });
      } catch (err) {
        console.error("Error fetching order details:", err);
        // Could show error state here
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, navigate]);



  if (loading) {
    return (
      <>
        <NavbarHome />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 pt-20 md:pt-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-10">
              <p className="text-gray-600 dark:text-gray-300">Loading order details...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <NavbarHome />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 pt-20 md:pt-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-10">
              <p className="text-gray-600 dark:text-gray-300">Order not found.</p>
              <Button
                color="blue"
                className="mt-4"
                onClick={() => navigate("/settings")}
              >
                Back to Settings
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const totalItems = order.items.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <>
      <NavbarHome />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 pt-20 md:pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              color="light"
              onClick={() => navigate("/settings")}
              className="mb-4"
            >
              <HiOutlineArrowLeft className="mr-2 h-4 w-4" />
              Back to Settings
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Order Details
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Summary */}
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Order #{order.id}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge color="info">Placed</Badge>
                </div>

                {/* Order Items */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Items ({totalItems})
                  </h3>
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {item.product?.name || "Product"}
                        </h4>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.color && <span>Color: {item.color.color}</span>}
                          {item.color && item.size && <span> • </span>}
                          {item.size && <span>Size: {item.size.size}</span>}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Quantity: {item.amount || 0}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {item.product?.price
                            ? formatCurrency(item.product.price * (item.amount || 0))
                            : "$0.00"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Order Info Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Order Summary
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Total</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {typeof order.total_amount === "number"
                        ? formatCurrency(order.total_amount)
                        : "$0.00"}
                    </span>
                  </div>

                  {order.points_earned && (
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Points Earned</span>
                      <span className="text-green-600 dark:text-green-400">
                        +{order.points_earned}
                      </span>
                    </div>
                  )}

                  {order.points_spent && (
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Points Used</span>
                      <span className="text-red-600 dark:text-red-400">
                        -{order.points_spent}
                      </span>
                    </div>
                  )}
                </div>

                {order.shipping_address && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Shipping Address
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {order.shipping_address}
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetailPage;