/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, Badge, Button, Select, Modal } from "flowbite-react";
import { HiArrowLeft, HiPencilAlt, HiCheck, HiX } from "react-icons/hi";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { supabase } from "../../utils/supabaseClient";
import { useAlertContext } from "../../context/AlertContext";
import type { Database } from "../../database.types";

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
  user_name?: string;
  user_email?: string;
  user_phone?: string;
}

interface StatusHistory {
  id: string;
  old_status: string | null;
  new_status: string | null;
  changed_by: string | null;
  created_at: string;
  user_id: string | null;
}

/**
 * Helper function to format order ID as a shorter, capitalized identifier
 */
const formatOrderNumber = (id: string): string => {
  return `#${id.substring(0, 8).toUpperCase()}`;
};

/**
 * Helper function to get badge color based on order status
 */
const getStatusBadgeColor = (status: string | null): string => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "success";
    case "processing":
      return "warning";
    case "cancelled":
      return "failure";
    case "pending":
      return "gray";
    case "shipped":
      return "info";
    case null:
    case undefined:
      return "warning"; // Treat null as processing
    default:
      return "gray";
  }
};

/**
 * Helper function to get display text for order status
 */
const getStatusDisplayText = (status: string | null): string => {
  if (status === null || status === undefined) {
    return "Processing";
  }
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

/**
 * Order Detail Page
 * 
 * Displays detailed information about a specific order including items,
 * customer details, status history, and allows status management.
 */
const OrderDetailPage: React.FC = function () {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { showAlert } = useAlertContext();
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  /**
   * Fetch order details including items and customer information
   */
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        navigate("/orders");
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

        // Fetch customer details
        let userName = "Unknown User";
        let userEmail = "";
        let userPhone = "";

        if (orderData.user_id) {
          // Get user details from user_details table (for future use)
          await supabase
            .from("user_details")
            .select("*")
            .eq("id", orderData.user_id)
            .single();

          // Get email from auth users
          const { data: authData } = await supabase.auth.admin.getUserById(orderData.user_id);
          if (authData.user?.email) {
            userEmail = authData.user.email;
            userName = authData.user.email.split("@")[0];
          }

          // Note: Phone would come from user_details if available
          // userPhone = userDetails?.phone || "";
        }

        // TODO: Fetch status history once order_status_logs table is available
        // For now, create a mock status history based on current status
        const mockStatusHistory: StatusHistory[] = orderData.status ? [{
          id: "mock-1",
          old_status: null,
          new_status: orderData.status,
          changed_by: "system",
          created_at: orderData.created_at,
          user_id: orderData.user_id,
        }] : [];

        setOrder({
          ...orderData,
          items: itemsData || [],
          user_name: userName,
          user_email: userEmail,
          user_phone: userPhone,
        });
        
        setStatusHistory(mockStatusHistory);
        setNewStatus(orderData.status || "processing");

      } catch (err) {
        console.error("Error fetching order details:", err);
        showAlert(err instanceof Error ? err.message : "Failed to load order", "error");
        navigate("/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, navigate, showAlert]);

  /**
   * Handle status update
   */
  const handleStatusUpdate = async () => {
    if (!order || newStatus === order.status) {
      setIsStatusModalOpen(false);
      return;
    }

    try {
      setUpdatingStatus(true);

      // Update order status
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // TODO: Add status change log once order_status_logs table is available
      // For now, just log to console
      console.log("Status change:", {
        order_id: order.id,
        old_status: order.status,
        new_status: newStatus,
        changed_by: "admin",
        user_id: order.user_id,
      });

      // Update local state
      setOrder({ ...order, status: newStatus });
      
      // Update status history with new entry
      const newHistoryEntry: StatusHistory = {
        id: `mock-${Date.now()}`,
        old_status: order.status,
        new_status: newStatus,
        changed_by: "admin",
        created_at: new Date().toISOString(),
        user_id: order.user_id,
      };
      
      setStatusHistory(prev => [newHistoryEntry, ...prev]);

      showAlert("Order status updated successfully", "success");
      setIsStatusModalOpen(false);

    } catch (err) {
      console.error("Error updating status:", err);
      showAlert(err instanceof Error ? err.message : "Failed to update status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!order) {
    return (
      <NavbarSidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Order Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The order you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link to="/orders">
              <Button color="blue">
                <HiArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </Button>
            </Link>
          </div>
        </div>
      </NavbarSidebarLayout>
    );
  }

  const totalItems = order.items.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <NavbarSidebarLayout>
      {/* Header */}
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <Link to="/orders">
                <Button color="gray" size="sm">
                  <HiArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Order {formatOrderNumber(order.id)}
              </h1>
              <Badge color={getStatusBadgeColor(order.status)} size="lg" className="w-fit">
                {getStatusDisplayText(order.status)}
              </Badge>
            </div>
            <Button
              color="blue"
              onClick={() => setIsStatusModalOpen(true)}
            >
              <HiPencilAlt className="mr-2 h-4 w-4" />
              Change Status
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <Card>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Order Details
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Created: {new Date(order.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Last Updated: {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Customer Details */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                  Customer Details
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Name:</p>
                      <p className="text-sm text-gray-900 dark:text-white">{order.user_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email:</p>
                      <p className="text-sm text-gray-900 dark:text-white">{order.user_email}</p>
                    </div>
                    {order.user_phone && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone:</p>
                        <p className="text-sm text-gray-900 dark:text-white">{order.user_phone}</p>
                      </div>
                    )}
                    {order.shipping_address && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Shipping Address:</p>
                        <p className="text-sm text-gray-900 dark:text-white">{order.shipping_address}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                  Items ({totalItems})
                </h3>
                <div className="space-y-4">
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
                          Quantity: {item.amount || 0} × RM{item.product?.price?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          RM{item.product?.price
                            ? (item.product.price * (item.amount || 0)).toFixed(2)
                            : "0.00"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Order Summary
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Total Amount</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    RM{typeof order.total_amount === "number"
                      ? order.total_amount.toFixed(2)
                      : "0.00"}
                  </span>
                </div>

                {order.discounted_amount && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Discount</span>
                    <span className="text-red-600 dark:text-red-400">
                      -RM{order.discounted_amount.toFixed(2)}
                    </span>
                  </div>
                )}

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
            </Card>

            {/* Status History */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Orders History
              </h3>
              
              <div className="space-y-3">
                {/* Current Status */}
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mr-3">
                      <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getStatusDisplayText(order.status)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Current Status
                      </p>
                    </div>
                  </div>
                  <Badge color={getStatusBadgeColor(order.status)} className="w-fit">
                    {getStatusDisplayText(order.status)}
                  </Badge>
                </div>

                {/* Status History */}
                {statusHistory.map((status, index) => (
                  <div key={status.id} className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Changed from &quot;{status.old_status || "none"}&quot; to &quot;{status.new_status}&quot;
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(status.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}

                {statusHistory.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No status changes recorded
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal show={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)}>
        <Modal.Header>Update Order Status</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Status: <Badge color={getStatusBadgeColor(order.status)} className="w-fit">{getStatusDisplayText(order.status)}</Badge>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Status
              </label>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                required
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="blue"
            onClick={handleStatusUpdate}
            disabled={updatingStatus || newStatus === order.status}
          >
            <HiCheck className="mr-2 h-4 w-4" />
            {updatingStatus ? "Updating..." : "Update Status"}
          </Button>
          <Button color="gray" onClick={() => setIsStatusModalOpen(false)}>
            <HiX className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </NavbarSidebarLayout>
  );
};

export default OrderDetailPage;
