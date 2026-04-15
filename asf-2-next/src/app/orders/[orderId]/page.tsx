"use client";
import { useParams } from "next/navigation";
import { OrderContextBundle } from "@/context/RouteContextBundles";

/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Badge, Button, Select, Modal, Label } from "flowbite-react";
import { HiArrowLeft, HiPencilAlt, HiCheck, HiX } from "react-icons/hi";
import NavbarSidebarLayout from "@/layouts/navbar-sidebar";
import LoadingPage from "@/app/loading";
import { supabase } from "@/utils/supabaseClient";
import { useAlertContext } from "@/context/AlertContext";
import type { Database } from "@/database.types";
import { parseShippingAddressStructured } from "@/app/api/_lib/shippingAddress";
import type { NormalizedRate } from "@/app/api/_lib/delyvaQuoteMappers";

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

/** Matches the `order_status_logs` table schema exactly (no user_id column in DB). */
interface StatusHistory {
  id: string;
  old_status: string | null;
  new_status: string | null;
  changed_by: string | null;
  created_at: string;
}

/** One row for admin display of Delyva tracking history (loosely typed API payload). */
interface TrackingEventDisplay {
  id: string;
  summary: string;
  when: string | null;
}

/**
 * Maps Delyva tracking history entries to display rows.
 */
function mapTrackingEventsToDisplay(raw: unknown): TrackingEventDisplay[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: TrackingEventDisplay[] = [];
  let index = 0;
  for (const item of raw) {
    const id = `ev-${index}`;
    index += 1;
    if (typeof item !== "object" || item === null) {
      out.push({ id, summary: JSON.stringify(item), when: null });
      continue;
    }
    const o = item as Record<string, unknown>;
    const desc =
      typeof o.description === "string"
        ? o.description
        : typeof o.message === "string"
          ? o.message
          : typeof o.status === "string"
            ? o.status
            : typeof o.event === "string"
              ? o.event
              : null;
    const when =
      typeof o.date === "string"
        ? o.date
        : typeof o.timestamp === "string"
          ? o.timestamp
          : typeof o.createdAt === "string"
            ? o.createdAt
            : typeof o.time === "string"
              ? o.time
              : null;
    out.push({
      id,
      summary: desc ?? JSON.stringify(o),
      when,
    });
  }
  return out;
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
  const router = useRouter();
  const { showAlert } = useAlertContext();
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  const [isShipModalOpen, setIsShipModalOpen] = useState<boolean>(false);
  const [shipWeightKg, setShipWeightKg] = useState<number>(1);
  const [shipRates, setShipRates] = useState<NormalizedRate[]>([]);
  const [shipRatesLoading, setShipRatesLoading] = useState<boolean>(false);
  const [shipRatesError, setShipRatesError] = useState<string | null>(null);
  const [selectedServiceCode, setSelectedServiceCode] = useState<string>("");
  const [shipSubmitting, setShipSubmitting] = useState<boolean>(false);
  const [trackingLoading, setTrackingLoading] = useState<boolean>(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [trackingEventsDisplay, setTrackingEventsDisplay] = useState<TrackingEventDisplay[]>([]);
  const [trackingStatusLine, setTrackingStatusLine] = useState<string | null>(null);

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  type LoadOrderOptions = {
    isInitial: boolean;
  };

  /**
   * Loads order row, line items, customer name, and status logs from Supabase.
   */
  const loadOrderDetails = useCallback(
    async (opts: LoadOrderOptions): Promise<void> => {
      if (!orderId) {
        router.push("/orders");
        return;
      }

      try {
        if (opts.isInitial) {
          setLoading(true);
        }

        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .is("deleted_at", null)
          .single();

        if (orderError !== null || orderData === null) {
          throw new Error(orderError?.message ?? "Order not found");
        }

        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select(`
            *,
            product:products(id, name, price),
            color:product_colors(id, color),
            size:product_sizes(id, size)
          `)
          .eq("order_id", orderId)
          .is("deleted_at", null);

        if (itemsError !== null) {
          throw new Error(itemsError.message);
        }

        let userName = "Unknown User";
        const userEmail = "";
        const userPhone = "";

        if (orderData.user_id !== null) {
          const { data: userDetailData } = await supabase
            .from("user_details")
            .select("first_name, last_name")
            .eq("id", orderData.user_id)
            .single();

          if (userDetailData !== null) {
            const firstName = userDetailData.first_name ?? "";
            const lastName = userDetailData.last_name ?? "";
            const fullName = `${firstName} ${lastName}`.trim();
            userName =
              fullName.length > 0 ? fullName : `User ${orderData.user_id.substring(0, 8)}`;
          }
        }

        const { data: historyData } = await supabase
          .from("order_status_logs")
          .select("id, old_status, new_status, changed_by, created_at")
          .eq("order_id", orderId)
          .order("created_at", { ascending: false });

        const nextHistory: StatusHistory[] = historyData ?? [];

        setOrder({
          ...orderData,
          items: itemsData ?? [],
          user_name: userName,
          user_email: userEmail,
          user_phone: userPhone,
        });

        setStatusHistory(nextHistory);
        setNewStatus(orderData.status ?? "processing");
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching order details:", err);
        }
        const message = err instanceof Error ? err.message : "Failed to load order";
        showAlert(message, "error");
        if (opts.isInitial) {
          router.push("/orders");
        }
      } finally {
        if (opts.isInitial) {
          setLoading(false);
        }
      }
    },
    [orderId, router, showAlert],
  );

  useEffect(() => {
    void loadOrderDetails({ isInitial: true });
  }, [loadOrderDetails]);

  /**
   * Loads Delyva courier quotes for the ship modal (destination + weight).
   */
  const fetchShipRates = useCallback(async (): Promise<void> => {
    if (order === null) {
      return;
    }
    const structured = parseShippingAddressStructured(order.shipping_address_structured);
    if (structured === null) {
      setShipRatesError(
        "Order is missing structured shipping address. Customer must check out with a saved address first.",
      );
      setShipRates([]);
      return;
    }
    setShipRatesLoading(true);
    setShipRatesError(null);
    try {
      const destination = {
        address1: structured.address1,
        city: structured.city,
        state: structured.state,
        postcode: structured.postcode,
        country: structured.country,
      };
      const res = await fetch("/api/delivery/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          weight: { unit: "kg", value: shipWeightKg },
        }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed to fetch rates";
        setShipRatesError(msg);
        setShipRates([]);
        return;
      }
      const ratesRaw =
        typeof data === "object" &&
        data !== null &&
        "rates" in data &&
        Array.isArray((data as { rates: unknown }).rates)
          ? (data as { rates: NormalizedRate[] }).rates
          : [];
      setShipRates(ratesRaw);
      setSelectedServiceCode((prev) => {
        if (ratesRaw.length === 0) {
          return "";
        }
        const codes = ratesRaw.map((r) => r.serviceCode);
        if (prev !== "" && codes.includes(prev)) {
          return prev;
        }
        return ratesRaw[0].serviceCode;
      });
    } catch {
      setShipRatesError("Failed to fetch rates");
      setShipRates([]);
    } finally {
      setShipRatesLoading(false);
    }
  }, [order, shipWeightKg]);

  /**
   * Debounced refresh of courier quotes when the ship modal is open and weight changes.
   */
  useEffect(() => {
    if (!isShipModalOpen || order === null) {
      return undefined;
    }
    const handle = setTimeout(() => {
      void fetchShipRates();
    }, 350);
    return () => {
      clearTimeout(handle);
    };
  }, [isShipModalOpen, order, shipWeightKg, fetchShipRates]);

  /**
   * Loads carrier tracking events for orders that already have a tracking number.
   */
  useEffect(() => {
    if (orderId === undefined || orderId === "") {
      return undefined;
    }
    if (order === null) {
      return undefined;
    }
    const tn = order.tracking_number;
    if (tn === null || tn === "") {
      setTrackingEventsDisplay([]);
      setTrackingStatusLine(null);
      setTrackingError(null);
      setTrackingLoading(false);
      return undefined;
    }

    let cancelled = false;
    const run = async (): Promise<void> => {
      setTrackingLoading(true);
      setTrackingError(null);
      try {
        const res = await fetch(`/api/delivery/tracking/${orderId}`);
        const data: unknown = await res.json();
        if (cancelled) {
          return;
        }
        if (!res.ok) {
          const msg =
            typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof (data as { error?: unknown }).error === "string"
              ? (data as { error: string }).error
              : "Failed to load tracking";
          setTrackingError(msg);
          setTrackingEventsDisplay([]);
          setTrackingStatusLine(null);
          return;
        }
        const payload = data as {
          status?: unknown;
          trackingEvents?: unknown;
        };
        setTrackingStatusLine(typeof payload.status === "string" ? payload.status : null);
        setTrackingEventsDisplay(mapTrackingEventsToDisplay(payload.trackingEvents));
      } catch {
        if (!cancelled) {
          setTrackingError("Failed to load tracking");
        }
      } finally {
        if (!cancelled) {
          setTrackingLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [orderId, order, order?.tracking_number]);

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

      // Persist status change to order_status_logs audit trail
      const { data: logData, error: logError } = await supabase
        .from("order_status_logs")
        .insert({
          order_id: order.id,
          old_status: order.status,
          new_status: newStatus,
          changed_by: "admin",
        })
        .select("id, old_status, new_status, changed_by, created_at")
        .single();

      if (logError && process.env.NODE_ENV === "development") {
        console.error("order_status_logs insert failed:", logError.message);
      }

      // Update local state
      setOrder({ ...order, status: newStatus });

      if (logData) {
        setStatusHistory(prev => [logData, ...prev]);
      }

      showAlert("Order status updated successfully", "success");
      setIsStatusModalOpen(false);

    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error updating status:", err);
      }
      showAlert(err instanceof Error ? err.message : "Failed to update status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  /**
   * Books shipment via Delyva and refreshes the order row from the database.
   */
  const handleConfirmShip = async (): Promise<void> => {
    if (order === null) {
      return;
    }
    if (selectedServiceCode === "") {
      showAlert("Select a courier service.", "error");
      return;
    }
    if (!Number.isFinite(shipWeightKg) || shipWeightKg <= 0) {
      showAlert("Enter a valid weight in kilograms.", "error");
      return;
    }
    setShipSubmitting(true);
    try {
      const res = await fetch("/api/delivery/create-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          serviceCode: selectedServiceCode,
          weight: { unit: "kg", value: shipWeightKg },
        }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Failed to create shipment";
        throw new Error(msg);
      }
      showAlert("Shipment created successfully.", "success");
      setIsShipModalOpen(false);
      await loadOrderDetails({ isInitial: false });
    } catch (err) {
      showAlert(err instanceof Error ? err.message : "Failed to create shipment", "error");
    } finally {
      setShipSubmitting(false);
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
            <Link href="/orders">
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
              <Link href="/orders">
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
                      key={item.id ?? String(index)}
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

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Shipment</h2>

          {order.tracking_number !== null &&
          order.tracking_number !== undefined &&
          order.tracking_number.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Courier (service code)</p>
                  <p className="text-gray-900 dark:text-white">{order.courier_code ?? "—"}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Tracking number</p>
                  <p className="text-gray-900 dark:text-white font-mono">{order.tracking_number}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  color="blue"
                  disabled={
                    order.shipping_label_url === null || order.shipping_label_url === ""
                  }
                  onClick={() => {
                    const url = order.shipping_label_url;
                    if (url !== null && url !== "") {
                      window.open(url, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  Print Label
                </Button>
                {order.shipping_label_url === null || order.shipping_label_url === "" ? (
                  <span className="text-sm text-gray-500 self-center">Label URL not available</span>
                ) : null}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Tracking updates
                </h3>
                {trackingLoading ? (
                  <p className="text-sm text-gray-500">Loading tracking…</p>
                ) : trackingError !== null ? (
                  <p className="text-sm text-red-600">{trackingError}</p>
                ) : (
                  <div className="space-y-2">
                    {trackingStatusLine !== null && trackingStatusLine !== "" ? (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Status: {trackingStatusLine}
                      </p>
                    ) : null}
                    {trackingEventsDisplay.length === 0 ? (
                      <p className="text-sm text-gray-500">No tracking events yet.</p>
                    ) : (
                      <ul className="border border-gray-200 dark:border-gray-600 rounded-lg divide-y divide-gray-200 dark:divide-gray-600">
                        {trackingEventsDisplay.map((ev) => (
                          <li key={ev.id} className="p-3 text-sm">
                            {ev.when !== null && ev.when !== "" ? (
                              <p className="text-xs text-gray-500 mb-1">{ev.when}</p>
                            ) : null}
                            <p className="text-gray-900 dark:text-white">{ev.summary}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (order.status ?? "").toLowerCase() === "processing" ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Book a courier pickup when the parcel is packed. Weight and service are sent to Delyva.
              </p>
              <Button
                color="blue"
                onClick={() => {
                  setShipWeightKg(1);
                  setShipRates([]);
                  setShipRatesError(null);
                  setIsShipModalOpen(true);
                }}
              >
                Ship This Order
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Shipment booking is available when the order status is Processing and no tracking number is
              set yet.
            </p>
          )}
        </Card>
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

      <Modal
        show={isShipModalOpen}
        onClose={() => {
          setIsShipModalOpen(false);
        }}
      >
        <Modal.Header>Ship this order</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ship-weight-kg" value="Parcel weight (kg)" />
              <input
                id="ship-weight-kg"
                type="number"
                min={0.1}
                step={0.1}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={Number.isFinite(shipWeightKg) ? shipWeightKg : ""}
                onChange={(e) => {
                  const v = Number.parseFloat(e.target.value);
                  if (Number.isFinite(v) && v > 0) {
                    setShipWeightKg(v);
                  } else if (e.target.value === "") {
                    setShipWeightKg(0);
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="ship-service" value="Courier" />
              {shipRatesLoading ? (
                <p className="text-sm text-gray-500 mt-2">Loading courier options…</p>
              ) : shipRatesError !== null ? (
                <p className="text-sm text-red-600 mt-2">{shipRatesError}</p>
              ) : (
                <Select
                  id="ship-service"
                  className="mt-1"
                  value={selectedServiceCode}
                  onChange={(e) => {
                    setSelectedServiceCode(e.target.value);
                  }}
                >
                  {shipRates.map((r) => (
                    <option key={r.serviceCode} value={r.serviceCode}>
                      {r.name} — {r.currency} {r.price.toFixed(2)}
                      {r.etaDays !== null ? ` (~${r.etaDays} d)` : ""}
                    </option>
                  ))}
                </Select>
              )}
              {!shipRatesLoading && shipRates.length === 0 && shipRatesError === null ? (
                <p className="text-sm text-gray-500 mt-2">No courier options returned.</p>
              ) : null}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="blue"
            onClick={() => {
              void handleConfirmShip();
            }}
            disabled={
              shipSubmitting ||
              shipRatesLoading ||
              selectedServiceCode === "" ||
              shipRates.length === 0 ||
              shipRatesError !== null
            }
          >
            <HiCheck className="mr-2 h-4 w-4" />
            {shipSubmitting ? "Creating…" : "Confirm shipment"}
          </Button>
          <Button
            color="gray"
            onClick={() => {
              setIsShipModalOpen(false);
            }}
          >
            <HiX className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </NavbarSidebarLayout>
  );
};

export default function WrappedOrderDetailPage(): React.ReactElement {
  return (
    <OrderContextBundle>
      <OrderDetailPage />
    </OrderContextBundle>
  );
}

