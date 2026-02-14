/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, Badge, Button, Select, Modal, TextInput } from "flowbite-react";
import { HiArrowLeft, HiPencilAlt, HiCheck, HiX, HiRefresh, HiCreditCard } from "react-icons/hi";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { supabase } from "../../utils/supabaseClient";
import { useAlertContext } from "../../context/AlertContext";
import { usePaymentContext } from "../../context/PaymentContext";
import type { Database } from "../../database.types";

type PaymentStatus = Database["public"]["Enums"]["payment_status"];
type RefundStatus = Database["public"]["Enums"]["refund_status"];
type PaymentEventRow = Database["public"]["Tables"]["payment_events"]["Row"];

interface PaymentDetailData {
  id: string;
  created_at: string;
  updated_at: string;
  amount_total: number;
  amount_subtotal: number | null;
  amount_tax: number | null;
  amount_shipping: number | null;
  amount_discount: number | null;
  currency: string;
  status: PaymentStatus;
  refund_status: RefundStatus;
  refunded_amount: number;
  provider: string;
  payment_method_type: string | null;
  email: string | null;
  name: string | null;
  phone: string | null;
  shipping_address: string | null;
  receipt_url: string | null;
  failure_message: string | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  attempt_count: number;
  livemode: boolean;
  order_id: string | null;
  user_id: string | null;
  // Additional computed fields
  user_name?: string;
  user_email?: string;
  order_items?: Array<{
    id: string;
    amount: number;
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
  }>;
  payment_events?: PaymentEventRow[];
}

/**
 * Helper function to format payment ID as a shorter, capitalized identifier
 */
const formatPaymentNumber = (id: string): string => {
  return `#${id.substring(0, 8).toUpperCase()}`;
};

/**
 * Helper function to get badge color based on payment status
 */
const getStatusBadgeColor = (status: PaymentStatus): string => {
  switch (status) {
    case "succeeded":
      return "success";
    case "processing":
      return "warning";
    case "requires_action":
      return "info";
    case "requires_payment_method":
      return "gray";
    case "failed":
    case "canceled":
      return "failure";
    case "expired":
      return "dark";
    case "created":
    default:
      return "gray";
  }
};

/**
 * Helper function to get badge color based on refund status
 */
const getRefundBadgeColor = (status: RefundStatus): string => {
  switch (status) {
    case "refunded":
      return "success";
    case "partially_refunded":
      return "warning";
    case "not_refunded":
    default:
      return "gray";
  }
};

/**
 * Helper function to get display text for payment status
 */
const getStatusDisplayText = (status: PaymentStatus): string => {
  switch (status) {
    case "requires_payment_method":
      return "Requires Payment Method";
    case "requires_action":
      return "Requires Action";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }
};

/**
 * Helper function to get display text for refund status
 */
const getRefundDisplayText = (status: RefundStatus): string => {
  switch (status) {
    case "not_refunded":
      return "Not Refunded";
    case "partially_refunded":
      return "Partially Refunded";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
};

/**
 * Helper function to format currency amounts
 */
const formatCurrency = (amount: number, currency: string = "MYR"): string => {
  const value = amount / 100; // Convert from cents to main currency unit
  
  if (currency.toLowerCase() === "myr") {
    return `RM ${value.toFixed(2)}`;
  }
  
  return `${currency.toUpperCase()} ${value.toFixed(2)}`;
};

/**
 * Payment Detail Page
 * 
 * Displays comprehensive information about a specific payment transaction including
 * payment details, customer information, order items, and payment events history.
 */
const PaymentDetailPage: React.FC = function () {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { showAlert } = useAlertContext();
  const { updatePaymentStatus, updateRefundStatus } = usePaymentContext();
  
  const [payment, setPayment] = useState<PaymentDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<PaymentStatus>("created");
  const [newRefundStatus, setNewRefundStatus] = useState<RefundStatus>("not_refunded");
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [updatingRefund, setUpdatingRefund] = useState<boolean>(false);

  const statusOptions: Array<{ value: PaymentStatus; label: string }> = [
    { value: "created", label: "Created" },
    { value: "requires_payment_method", label: "Requires Payment Method" },
    { value: "requires_action", label: "Requires Action" },
    { value: "processing", label: "Processing" },
    { value: "succeeded", label: "Succeeded" },
    { value: "canceled", label: "Canceled" },
    { value: "failed", label: "Failed" },
    { value: "expired", label: "Expired" },
  ];

  const refundStatusOptions: Array<{ value: RefundStatus; label: string }> = [
    { value: "not_refunded", label: "Not Refunded" },
    { value: "partially_refunded", label: "Partially Refunded" },
    { value: "refunded", label: "Fully Refunded" },
  ];

  /**
   * Fetch payment details including order items and customer information
   */
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!paymentId) {
        navigate("/payments");
        return;
      }

      try {
        setLoading(true);

        // Fetch payment with related data
        const { data: paymentData, error: paymentError } = await supabase
          .from("payments")
          .select(`
            *,
            payment_events(*),
            order:orders(
              id,
              user_id,
              order_items(
                id,
                amount,
                product:products(id, name, price),
                color:product_colors(id, color),
                size:product_sizes(id, size)
              )
            )
          `)
          .eq("id", paymentId)
          .single();

        if (paymentError || !paymentData) {
          throw new Error(paymentError?.message || "Payment not found");
        }

        // Fetch customer details
        let userName = "Unknown User";
        let userEmail = "";

        if (paymentData.user_id) {
          // Get email from auth users
          const { data: authData } = await supabase.auth.admin.getUserById(paymentData.user_id);
          if (authData.user?.email) {
            userEmail = authData.user.email;
            userName = authData.user.email.split("@")[0];
          }
        } else if (paymentData.email) {
          // Use payment email if no user_id
          userEmail = paymentData.email;
          userName = paymentData.name || paymentData.email.split("@")[0];
        }

        const enrichedPayment: PaymentDetailData = {
          ...paymentData,
          user_name: userName,
          user_email: userEmail,
          order_items: (paymentData as any).order?.order_items || [],
          payment_events: (paymentData as any).payment_events || [],
        };

        setPayment(enrichedPayment);
        setNewStatus(paymentData.status);
        setNewRefundStatus(paymentData.refund_status);

      } catch (err) {
        console.error("Error fetching payment details:", err);
        showAlert(err instanceof Error ? err.message : "Failed to load payment", "error");
        navigate("/payments");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [paymentId, navigate, showAlert]);

  /**
   * Handle status update
   */
  const handleStatusUpdate = async () => {
    if (!payment || newStatus === payment.status) {
      setIsStatusModalOpen(false);
      return;
    }

    try {
      setUpdatingStatus(true);
      const success = await updatePaymentStatus(payment.id, newStatus);
      
      if (success) {
        setPayment({ ...payment, status: newStatus, updated_at: new Date().toISOString() });
        setIsStatusModalOpen(false);
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  /**
   * Handle refund update
   */
  const handleRefundUpdate = async () => {
    if (!payment) {
      setIsRefundModalOpen(false);
      return;
    }

    try {
      setUpdatingRefund(true);
      
      // Parse refund amount (convert to cents)
      const refundAmountCents = Math.round(parseFloat(refundAmount || "0") * 100);
      
      if (refundAmountCents < 0 || refundAmountCents > payment.amount_total) {
        showAlert("Invalid refund amount", "error");
        return;
      }

      const success = await updateRefundStatus(payment.id, newRefundStatus, refundAmountCents);
      
      if (success) {
        setPayment({ 
          ...payment, 
          refund_status: newRefundStatus, 
          refunded_amount: refundAmountCents,
          updated_at: new Date().toISOString() 
        });
        setIsRefundModalOpen(false);
        setRefundAmount("");
      }
    } catch (err) {
      console.error("Error updating refund:", err);
    } finally {
      setUpdatingRefund(false);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!payment) {
    return (
      <NavbarSidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Payment Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The payment transaction you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link to="/payments">
              <Button color="blue">
                <HiArrowLeft className="mr-2 h-4 w-4" />
                Back to Payments
              </Button>
            </Link>
          </div>
        </div>
      </NavbarSidebarLayout>
    );
  }

  const totalItems = payment.order_items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

  return (
    <NavbarSidebarLayout>
      {/* Header */}
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <Link to="/payments">
                <Button color="gray" size="sm">
                  <HiArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Payment {formatPaymentNumber(payment.id)}
              </h1>
              <Badge color={getStatusBadgeColor(payment.status)} size="lg" className="w-fit">
                {getStatusDisplayText(payment.status)}
              </Badge>
              {payment.refund_status !== "not_refunded" && (
                <Badge color={getRefundBadgeColor(payment.refund_status)} size="lg" className="w-fit">
                  {getRefundDisplayText(payment.refund_status)}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                color="gray"
                onClick={() => setIsRefundModalOpen(true)}
                disabled={payment.status !== "succeeded"}
              >
                <HiRefresh className="mr-2 h-4 w-4" />
                Manage Refund
              </Button>
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
      </div>

      <div className="flex flex-col p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Payment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Info */}
            <Card>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Transaction Details
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Created: {new Date(payment.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Last Updated: {new Date(payment.updated_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <HiCreditCard className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {payment.payment_method_type || "Unknown"}
                  </span>
                </div>
              </div>

              {/* Payment Method Details */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                  Payment Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Provider:</p>
                      <p className="text-sm text-gray-900 dark:text-white capitalize">{payment.provider}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Method:</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {payment.payment_method_type || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Attempts:</p>
                      <p className="text-sm text-gray-900 dark:text-white">{payment.attempt_count}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Environment:</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {payment.livemode ? "Live" : "Test"}
                      </p>
                    </div>
                    {payment.stripe_payment_intent_id && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Stripe Payment Intent:
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white font-mono">
                          {payment.stripe_payment_intent_id}
                        </p>
                      </div>
                    )}
                    {payment.failure_message && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-red-700 dark:text-red-300">Failure Reason:</p>
                        <p className="text-sm text-red-900 dark:text-red-100">{payment.failure_message}</p>
                      </div>
                    )}
                  </div>
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
                      <p className="text-sm text-gray-900 dark:text-white">
                        {payment.name || payment.user_name || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email:</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {payment.email || payment.user_email || "Not provided"}
                      </p>
                    </div>
                    {payment.phone && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone:</p>
                        <p className="text-sm text-gray-900 dark:text-white">{payment.phone}</p>
                      </div>
                    )}
                    {payment.shipping_address && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Shipping Address:
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">{payment.shipping_address}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {payment.order_items && payment.order_items.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Order Items ({totalItems})
                  </h3>
                  <div className="space-y-4">
                    {payment.order_items.map((item, index) => (
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
                            Quantity: {item.amount || 0} × {formatCurrency((item.product?.price || 0) * 100)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(((item.product?.price || 0) * (item.amount || 0)) * 100)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Payment Summary */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Payment Summary
              </h3>
              
              <div className="space-y-3">
                {payment.amount_subtotal && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Subtotal</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatCurrency(payment.amount_subtotal, payment.currency)}
                    </span>
                  </div>
                )}

                {payment.amount_tax && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Tax</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatCurrency(payment.amount_tax, payment.currency)}
                    </span>
                  </div>
                )}

                {payment.amount_shipping && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Shipping</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatCurrency(payment.amount_shipping, payment.currency)}
                    </span>
                  </div>
                )}

                {payment.amount_discount && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Discount</span>
                    <span className="text-red-600 dark:text-red-400">
                      -{formatCurrency(payment.amount_discount, payment.currency)}
                    </span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">Total Amount</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(payment.amount_total, payment.currency)}
                    </span>
                  </div>
                </div>

                {payment.refunded_amount > 0 && (
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-medium text-red-700 dark:text-red-300">Refunded Amount</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -{formatCurrency(payment.refunded_amount, payment.currency)}
                    </span>
                  </div>
                )}
              </div>

              {payment.receipt_url && (
                <div className="mt-4 pt-4 border-t">
                  <a
                    href={payment.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                  >
                    View Receipt →
                  </a>
                </div>
              )}
            </Card>

            {/* Payment Events History */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Payment Events
              </h3>
              
              <div className="space-y-3">
                {payment.payment_events && payment.payment_events.length > 0 ? (
                  payment.payment_events
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((event) => (
                      <div key={event.id} className="flex items-start p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {event.stripe_event_type.replace(/\./g, " ").replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No payment events recorded
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal show={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)}>
        <Modal.Header>Update Payment Status</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Status: <Badge color={getStatusBadgeColor(payment.status)} className="w-fit">{getStatusDisplayText(payment.status)}</Badge>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Status
              </label>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as PaymentStatus)}
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
            disabled={updatingStatus || newStatus === payment.status}
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

      {/* Refund Modal */}
      <Modal show={isRefundModalOpen} onClose={() => setIsRefundModalOpen(false)}>
        <Modal.Header>Manage Refund</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Refund Status: <Badge color={getRefundBadgeColor(payment.refund_status)} className="w-fit">{getRefundDisplayText(payment.refund_status)}</Badge>
              </label>
              {payment.refunded_amount > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Refunded: {formatCurrency(payment.refunded_amount, payment.currency)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Refund Status
              </label>
              <Select
                value={newRefundStatus}
                onChange={(e) => setNewRefundStatus(e.target.value as RefundStatus)}
                required
              >
                {refundStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            {newRefundStatus !== "not_refunded" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Refund Amount ({payment.currency.toUpperCase()})
                </label>
                <TextInput
                  type="number"
                  step="0.01"
                  min="0"
                  max={payment.amount_total / 100}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={`Max: ${(payment.amount_total / 100).toFixed(2)}`}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter amount in {payment.currency.toUpperCase()} (e.g., 50.00)
                </p>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="blue"
            onClick={handleRefundUpdate}
            disabled={updatingRefund}
          >
            <HiCheck className="mr-2 h-4 w-4" />
            {updatingRefund ? "Updating..." : "Update Refund"}
          </Button>
          <Button color="gray" onClick={() => setIsRefundModalOpen(false)}>
            <HiX className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </NavbarSidebarLayout>
  );
};

export default PaymentDetailPage;
