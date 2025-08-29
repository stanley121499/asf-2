/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useMemo, useEffect } from "react";
import { Badge, Button, Card, TextInput, Select, Table } from "flowbite-react";
import { HiSearch, HiEye } from "react-icons/hi";
import { Link } from "react-router-dom";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { useOrderContext } from "../../context/product/OrderContext";
import { supabase } from "../../utils/supabaseClient";
import type { Database } from "../../../database.types";

type UserRow = Database["public"]["Tables"]["user_details"]["Row"];

interface OrderWithUser {
  id: string;
  created_at: string;
  status: string | null;
  total_amount: number | null;
  user_id: string | null;
  shipping_address: string | null;
  user_name?: string;
  user_email?: string;
  item_count?: number;
}

/**
 * Helper function to format order ID as a shorter, capitalized identifier
 * @param id - Full UUID
 * @returns Shortened, capitalized order number
 */
const formatOrderNumber = (id: string): string => {
  // Take first 8 characters and make uppercase
  return `#${id.substring(0, 8).toUpperCase()}`;
};

/**
 * Helper function to get badge color based on order status
 * @param status - Order status
 * @returns Flowbite badge color
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
 * @param status - Order status
 * @returns Capitalized status text
 */
const getStatusDisplayText = (status: string | null): string => {
  if (status === null || status === undefined) {
    return "Processing";
  }
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

/**
 * Helper function to check if an order falls within a time range
 * @param orderDate - Order creation date
 * @param timeRange - Selected time range
 * @returns Boolean indicating if order is within range
 */
const isOrderInTimeRange = (orderDate: string, timeRange: string): boolean => {
  const orderTime = new Date(orderDate);
  const now = new Date();
  
  switch (timeRange) {
    case "today":
      return orderTime.toDateString() === now.toDateString();
    
    case "yesterday":
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return orderTime.toDateString() === yesterday.toDateString();
    
    case "this_week":
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return orderTime >= startOfWeek;
    
    case "last_week":
      const startOfLastWeek = new Date(now);
      startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
      startOfLastWeek.setHours(0, 0, 0, 0);
      const endOfLastWeek = new Date(startOfLastWeek);
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
      endOfLastWeek.setHours(23, 59, 59, 999);
      return orderTime >= startOfLastWeek && orderTime <= endOfLastWeek;
    
    case "this_month":
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return orderTime >= startOfMonth;
    
    case "last_month":
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      endOfLastMonth.setHours(23, 59, 59, 999);
      return orderTime >= startOfLastMonth && orderTime <= endOfLastMonth;
    
    case "this_quarter":
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
      return orderTime >= startOfQuarter;
    
    case "last_quarter":
      const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
      const lastQuarterYear = lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const adjustedLastQuarter = lastQuarter < 0 ? 3 : lastQuarter;
      const startOfLastQuarter = new Date(lastQuarterYear, adjustedLastQuarter * 3, 1);
      const endOfLastQuarter = new Date(lastQuarterYear, adjustedLastQuarter * 3 + 3, 0);
      endOfLastQuarter.setHours(23, 59, 59, 999);
      return orderTime >= startOfLastQuarter && orderTime <= endOfLastQuarter;
    
    case "this_year":
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return orderTime >= startOfYear;
    
    case "last_year":
      const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
      endOfLastYear.setHours(23, 59, 59, 999);
      return orderTime >= startOfLastYear && orderTime <= endOfLastYear;
    
    case "all":
    default:
      return true;
  }
};

/**
 * Helper function to get display text for time ranges
 * @param timeRange - Time range key
 * @returns Display text for the time range
 */
const getTimeRangeDisplayText = (timeRange: string): string => {
  switch (timeRange) {
    case "today": return "Today";
    case "yesterday": return "Yesterday";
    case "this_week": return "This Week";
    case "last_week": return "Last Week";
    case "this_month": return "This Month";
    case "last_month": return "Last Month";
    case "this_quarter": return "This Quarter";
    case "last_quarter": return "Last Quarter";
    case "this_year": return "This Year";
    case "last_year": return "Last Year";
    case "all":
    default:
      return "All Time";
  }
};

/**
 * Orders List Page
 * 
 * Displays all orders in a table format with filtering and search capabilities.
 * Follows the same pattern as other admin pages in the system.
 */
const OrderListPage: React.FC = function () {
  const { orders, loading } = useOrderContext();
  const [searchValue, setSearchValue] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [ordersWithUsers, setOrdersWithUsers] = useState<OrderWithUser[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);

  /**
   * Fetch user details and item counts for all orders
   */
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (orders.length === 0) {
        setOrdersWithUsers([]);
        return;
      }

      try {
        setUsersLoading(true);

        // Get unique user IDs
        const userIdSet = new Set(orders.map(order => order.user_id).filter(Boolean));
        const userIds = Array.from(userIdSet);

        // Fetch user details
        const { data: users, error: usersError } = await supabase
          .from("user_details")
          .select("id, profile_image")
          .in("id", userIds);

        if (usersError) {
          console.error("Error fetching users:", usersError);
        }

        // Get auth users for email
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
          console.error("Error fetching auth users:", authError);
        }

        // Fetch order item counts
        const orderItemCounts = await Promise.all(
          orders.map(async (order) => {
            const { data: items, error } = await supabase
              .from("order_items")
              .select("amount")
              .eq("order_id", order.id);

            const itemCount = (items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
            return { orderId: order.id, itemCount };
          })
        );

        // Combine order data with user details and item counts
        const enrichedOrders: OrderWithUser[] = orders.map(order => {
          const user = users?.find(u => u.id === order.user_id);
          const authUser = authUsers?.users?.find(u => u.id === order.user_id);
          const itemData = orderItemCounts.find(item => item.orderId === order.id);

          // Extract name from email (before @)
          const userName = authUser?.email?.split("@")[0] || "Unknown User";

          return {
            ...order,
            user_name: userName,
            user_email: authUser?.email || "",
            item_count: itemData?.itemCount || 0,
          };
        });

        setOrdersWithUsers(enrichedOrders);
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orders]);

  /**
   * Filter orders based on search term, status, and time range
   */
  const filteredOrders = useMemo(() => {
    return ordersWithUsers.filter(order => {
      const matchesSearch = 
        formatOrderNumber(order.id).toLowerCase().includes(searchValue.toLowerCase()) ||
        order.user_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        order.user_email?.toLowerCase().includes(searchValue.toLowerCase()) ||
        order.shipping_address?.toLowerCase().includes(searchValue.toLowerCase());

      let matchesStatus = false;
      if (statusFilter === "all") {
        matchesStatus = true;
      } else if (statusFilter === "processing") {
        matchesStatus = order.status === "processing" || order.status === null;
      } else {
        matchesStatus = order.status === statusFilter;
      }

      const matchesTime = isOrderInTimeRange(order.created_at, timeFilter);

      return matchesSearch && matchesStatus && matchesTime;
    });
  }, [ordersWithUsers, searchValue, statusFilter, timeFilter]);

  /**
   * Calculate statistics for the summary cards based on time filter
   */
  const orderStats = useMemo(() => {
    const timeFilteredOrders = ordersWithUsers.filter(order => 
      isOrderInTimeRange(order.created_at, timeFilter)
    );

    const completed = timeFilteredOrders.filter(o => o.status === "completed").length;
    const processing = timeFilteredOrders.filter(o => o.status === "processing" || o.status === null).length;
    const cancelled = timeFilteredOrders.filter(o => o.status === "cancelled").length;

    return { completed, processing, cancelled, total: timeFilteredOrders.length };
  }, [ordersWithUsers, timeFilter]);

  if (loading || usersLoading) {
    return <LoadingPage />;
  }

  return (
    <NavbarSidebarLayout>
      {/* Header */}
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Orders
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col p-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {orderStats.completed}
                  </div>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Orders Completed
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{getTimeRangeDisplayText(timeFilter)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {orderStats.processing}
                  </div>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Orders Processing
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{getTimeRangeDisplayText(timeFilter)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {orderStats.cancelled}
                  </div>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Orders Cancelled
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{getTimeRangeDisplayText(timeFilter)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {orderStats.total}
                  </div>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Orders
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{getTimeRangeDisplayText(timeFilter)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1 md:w-80">
                <TextInput
                  id="orders-search"
                  placeholder="Search orders, customers, or addresses..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  icon={HiSearch}
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="md:w-48"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
              <Select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="md:w-48"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="last_week">Last Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_quarter">This Quarter</option>
                <option value="last_quarter">Last Quarter</option>
                <option value="this_year">This Year</option>
                <option value="last_year">Last Year</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Orders Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell>Order</Table.HeadCell>
                <Table.HeadCell>Customer</Table.HeadCell>
                <Table.HeadCell>Status</Table.HeadCell>
                <Table.HeadCell>Date</Table.HeadCell>
                <Table.HeadCell>Items</Table.HeadCell>
                <Table.HeadCell>Total</Table.HeadCell>
                <Table.HeadCell>Actions</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <Table.Row
                      key={order.id}
                      className="bg-white dark:border-gray-700 dark:bg-gray-800"
                    >
                      <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {formatOrderNumber(order.id)}
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {order.user_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {order.user_email}
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={getStatusBadgeColor(order.status)} className="w-fit">
                          {getStatusDisplayText(order.status)}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </Table.Cell>
                      <Table.Cell>{order.item_count}</Table.Cell>
                      <Table.Cell>
                        RM {typeof order.total_amount === "number" 
                          ? order.total_amount.toFixed(2) 
                          : "0.00"}
                      </Table.Cell>
                      <Table.Cell>
                        <Link to={`/orders/${order.id}`}>
                          <Button size="xs" color="gray">
                            <HiEye className="mr-1 h-3 w-3" />
                            View
                          </Button>
                        </Link>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <img
                          src="/images/illustrations/404.svg"
                          alt="No orders found"
                          className="mx-auto mb-4 h-32 w-32"
                        />
                        <p className="text-gray-500 dark:text-gray-400">
                          {searchValue || statusFilter !== "all" || timeFilter !== "all"
                            ? "No orders match your filter criteria" 
                            : "No orders found"}
                        </p>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </div>
        </Card>
      </div>
    </NavbarSidebarLayout>
  );
};

export default OrderListPage;
