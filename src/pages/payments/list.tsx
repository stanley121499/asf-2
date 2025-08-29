/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useMemo, useEffect } from "react";
import { Badge, Button, Card, TextInput, Select, Table } from "flowbite-react";
import { HiSearch, HiEye, HiRefresh } from "react-icons/hi";
import { Link } from "react-router-dom";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import LoadingPage from "../pages/loading";
import { usePaymentContext } from "../../context/PaymentContext";
import type { Database } from "../../../database.types";

type PaymentStatus = Database["public"]["Enums"]["payment_status"];
type RefundStatus = Database["public"]["Enums"]["refund_status"];

/**
 * Helper function to format payment ID as a shorter, capitalized identifier
 * @param id - Full UUID
 * @returns Shortened, capitalized payment number
 */
const formatPaymentNumber = (id: string): string => {
  // Take first 8 characters and make uppercase
  return `#${id.substring(0, 8).toUpperCase()}`;
};

/**
 * Helper function to get badge color based on payment status
 * @param status - Payment status
 * @returns Flowbite badge color
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
 * @param status - Refund status
 * @returns Flowbite badge color
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
 * @param status - Payment status
 * @returns Capitalized status text
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
 * @param status - Refund status
 * @returns Capitalized status text
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
 * Helper function to check if a payment falls within a time range
 * @param paymentDate - Payment creation date
 * @param timeRange - Selected time range
 * @returns Boolean indicating if payment is within range
 */
const isPaymentInTimeRange = (paymentDate: string, timeRange: string): boolean => {
  const paymentTime = new Date(paymentDate);
  const now = new Date();
  
  switch (timeRange) {
    case "today":
      return paymentTime.toDateString() === now.toDateString();
    
    case "yesterday":
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return paymentTime.toDateString() === yesterday.toDateString();
    
    case "this_week":
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return paymentTime >= startOfWeek;
    
    case "last_week":
      const startOfLastWeek = new Date(now);
      startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
      startOfLastWeek.setHours(0, 0, 0, 0);
      const endOfLastWeek = new Date(startOfLastWeek);
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
      endOfLastWeek.setHours(23, 59, 59, 999);
      return paymentTime >= startOfLastWeek && paymentTime <= endOfLastWeek;
    
    case "this_month":
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return paymentTime >= startOfMonth;
    
    case "last_month":
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      endOfLastMonth.setHours(23, 59, 59, 999);
      return paymentTime >= startOfLastMonth && paymentTime <= endOfLastMonth;
    
    case "this_year":
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return paymentTime >= startOfYear;
    
    case "last_year":
      const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
      endOfLastYear.setHours(23, 59, 59, 999);
      return paymentTime >= startOfLastYear && paymentTime <= endOfLastYear;
    
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
    case "this_year": return "This Year";
    case "last_year": return "Last Year";
    case "all":
    default:
      return "All Time";
  }
};

/**
 * Helper function to format currency amounts
 * @param amount - Amount in cents
 * @param currency - Currency code
 * @returns Formatted currency string
 */
const formatCurrency = (amount: number, currency: string = "MYR"): string => {
  const value = amount / 100; // Convert from cents to main currency unit
  
  if (currency.toLowerCase() === "myr") {
    return `RM ${value.toFixed(2)}`;
  }
  
  return `${currency.toUpperCase()} ${value.toFixed(2)}`;
};

/**
 * Payment Transaction List Page
 * 
 * Displays all payment transactions in a table format with comprehensive filtering,
 * search capabilities, and summary statistics.
 */
const PaymentListPage: React.FC = function () {
  const { payments, loading, refreshPayments } = usePaymentContext();
  const [searchValue, setSearchValue] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [refundFilter, setRefundFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("last_month");

  /**
   * Filter payments based on search term, status, and time range
   */
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch = 
        formatPaymentNumber(payment.id).toLowerCase().includes(searchValue.toLowerCase()) ||
        payment.user_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        payment.user_email?.toLowerCase().includes(searchValue.toLowerCase()) ||
        payment.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
        payment.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        payment.order_id?.toLowerCase().includes(searchValue.toLowerCase());

      const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
      const matchesRefund = refundFilter === "all" || payment.refund_status === refundFilter;
      const matchesTime = isPaymentInTimeRange(payment.created_at, timeFilter);

      return matchesSearch && matchesStatus && matchesRefund && matchesTime;
    });
  }, [payments, searchValue, statusFilter, refundFilter, timeFilter]);

  /**
   * Calculate statistics for the summary cards based on filters
   */
  const paymentStats = useMemo(() => {
    const timeFilteredPayments = payments.filter(payment => 
      isPaymentInTimeRange(payment.created_at, timeFilter)
    );

    const succeeded = timeFilteredPayments.filter(p => p.status === "succeeded").length;
    const failed = timeFilteredPayments.filter(p => p.status === "failed" || p.status === "canceled").length;
    const processing = timeFilteredPayments.filter(p => p.status === "processing" || p.status === "requires_action").length;
    const refunded = timeFilteredPayments.filter(p => p.refund_status === "refunded" || p.refund_status === "partially_refunded").length;

    // Calculate total amounts
    const totalAmount = timeFilteredPayments
      .filter(p => p.status === "succeeded")
      .reduce((sum, p) => sum + p.amount_total, 0);

    const refundedAmount = timeFilteredPayments
      .reduce((sum, p) => sum + p.refunded_amount, 0);

    return { 
      succeeded, 
      failed, 
      processing, 
      refunded,
      total: timeFilteredPayments.length,
      totalAmount,
      refundedAmount
    };
  }, [payments, timeFilter]);

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <NavbarSidebarLayout>
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              Payment Transactions
            </h1>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 sm:w-80">
              <TextInput
                id="payments-search"
                placeholder="Search transactions, customers, or order IDs..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                icon={HiSearch}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sm:w-40"
            >
              <option value="all">All Statuses</option>
              <option value="created">Created</option>
              <option value="requires_payment_method">Requires Payment Method</option>
              <option value="requires_action">Requires Action</option>
              <option value="processing">Processing</option>
              <option value="succeeded">Succeeded</option>
              <option value="canceled">Canceled</option>
              <option value="failed">Failed</option>
              <option value="expired">Expired</option>
            </Select>
            <Select
              value={refundFilter}
              onChange={(e) => setRefundFilter(e.target.value)}
              className="sm:w-40"
            >
              <option value="all">All Refund Status</option>
              <option value="not_refunded">Not Refunded</option>
              <option value="partially_refunded">Partially Refunded</option>
              <option value="refunded">Fully Refunded</option>
            </Select>
            <Select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="sm:w-32"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="last_year">Last Year</option>
            </Select>
            <Button 
              color="gray" 
              onClick={refreshPayments}
              disabled={loading}
              className="sm:w-auto"
            >
              <HiRefresh className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col p-4">
        {/* Summary Cards */}
        <div className="mb-6 space-y-4">
          {/* First Row - Financial Summary */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {formatCurrency(paymentStats.totalAmount)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Total Revenue
                </h3>
                <p className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                  {getTimeRangeDisplayText(timeFilter)}
                </p>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {formatCurrency(paymentStats.refundedAmount)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Total Refunded
                </h3>
                <p className="text-purple-600 dark:text-purple-400 font-medium text-sm">
                  {getTimeRangeDisplayText(timeFilter)}
                </p>
              </div>
            </Card>
          </div>

          {/* Second Row - Status Counts */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 mb-2 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {paymentStats.succeeded}
                  </div>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Succeeded
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getTimeRangeDisplayText(timeFilter)}
                </p>
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 mb-2 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                    {paymentStats.processing}
                  </div>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Processing
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getTimeRangeDisplayText(timeFilter)}
                </p>
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 mb-2 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">
                    {paymentStats.failed}
                  </div>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Failed
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getTimeRangeDisplayText(timeFilter)}
                </p>
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 mb-2 flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                  <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {paymentStats.refunded}
                  </div>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Refunded
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getTimeRangeDisplayText(timeFilter)}
                </p>
              </div>
            </Card>
          </div>
        </div>



        {/* Payments Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell>Date & Time</Table.HeadCell>
                <Table.HeadCell>Order ID</Table.HeadCell>
                <Table.HeadCell>Status</Table.HeadCell>
                <Table.HeadCell>Amount</Table.HeadCell>
                <Table.HeadCell>Qty</Table.HeadCell>
                <Table.HeadCell>Discount</Table.HeadCell>
                <Table.HeadCell>Credit</Table.HeadCell>
                <Table.HeadCell>Debit</Table.HeadCell>
                <Table.HeadCell>Grand Total</Table.HeadCell>
                <Table.HeadCell>Failed</Table.HeadCell>
                <Table.HeadCell>Actions</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <Table.Row
                      key={payment.id}
                      className="bg-white dark:border-gray-700 dark:bg-gray-800"
                    >
                      <Table.Cell className="whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {new Date(payment.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {new Date(payment.created_at).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {formatPaymentNumber(payment.order_id || payment.id)}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-col gap-1">
                          <Badge color={getStatusBadgeColor(payment.status)} className="w-fit">
                            {getStatusDisplayText(payment.status)}
                          </Badge>
                          {payment.refund_status !== "not_refunded" && (
                            <Badge color={getRefundBadgeColor(payment.refund_status)} size="sm" className="w-fit">
                              {getRefundDisplayText(payment.refund_status)}
                            </Badge>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {formatCurrency(payment.amount_total, payment.currency)}
                      </Table.Cell>
                      <Table.Cell>{payment.order_items_count || 0}</Table.Cell>
                      <Table.Cell>
                        {payment.amount_discount ? 
                          `-${formatCurrency(payment.amount_discount, payment.currency)}` : 
                          formatCurrency(0, payment.currency)
                        }
                      </Table.Cell>
                      <Table.Cell>
                        {formatCurrency(payment.amount_total - (payment.amount_discount || 0), payment.currency)}
                      </Table.Cell>
                      <Table.Cell>
                        {formatCurrency(payment.amount_total, payment.currency)}
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(payment.amount_total, payment.currency)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        {payment.status === "failed" || payment.status === "canceled" 
                          ? formatCurrency(payment.amount_total, payment.currency)
                          : formatCurrency(0, payment.currency)
                        }
                      </Table.Cell>
                      <Table.Cell>
                        <Link to={`/payments/${payment.id}`}>
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
                    <Table.Cell colSpan={11} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <img
                          src="/images/illustrations/404.svg"
                          alt="No payments found"
                          className="mx-auto mb-4 h-32 w-32"
                        />
                        <p className="text-gray-500 dark:text-gray-400">
                          {searchValue || statusFilter !== "all" || refundFilter !== "all" || timeFilter !== "all"
                            ? "No payments match your filter criteria" 
                            : "No payment transactions found"}
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

export default PaymentListPage;
