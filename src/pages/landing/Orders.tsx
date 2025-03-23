import React, { useState } from "react";
import { Button, Card, Badge, Select, TextInput, Table, Pagination } from "flowbite-react";
import NavbarHome from "../../components/navbar-home";
import { Link } from "react-router-dom";
import { HiOutlineSearch, HiOutlineFilter, HiOutlineRefresh, HiOutlineCalendar, HiOutlineEye } from "react-icons/hi";

// Define TypeScript types
interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: "delivered" | "processing" | "cancelled" | "shipped";
  totalAmount: number;
  itemCount: number;
  trackingNumber?: string;
}

const OrdersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [timeRange, setTimeRange] = useState<string>("all");
  
  // Mock data for orders
  const orders: Order[] = [
    {
      id: "123",
      orderNumber: "ORD-2023-4567",
      date: "2023-05-15",
      status: "delivered",
      totalAmount: 125.00,
      itemCount: 3,
      trackingNumber: "1Z999AA10123456784"
    },
    {
      id: "122",
      orderNumber: "ORD-2023-4321",
      date: "2023-04-23",
      status: "processing",
      totalAmount: 79.99,
      itemCount: 1
    },
    {
      id: "121",
      orderNumber: "ORD-2023-3999",
      date: "2023-03-12",
      status: "cancelled",
      totalAmount: 45.50,
      itemCount: 2
    },
    {
      id: "120",
      orderNumber: "ORD-2023-3750",
      date: "2023-02-28",
      status: "shipped",
      totalAmount: 199.99,
      itemCount: 4,
      trackingNumber: "1Z999AA10123456785"
    },
    {
      id: "119",
      orderNumber: "ORD-2023-3600",
      date: "2023-02-10",
      status: "delivered",
      totalAmount: 67.25,
      itemCount: 2,
      trackingNumber: "1Z999AA10123456786"
    }
  ];

  // Filter orders based on search term, status, and time range
  const filteredOrders = orders.filter((order) => {
    // Search filter
    const searchMatch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status filter
    const statusMatch = statusFilter === "all" || order.status === statusFilter;
    
    // Time range filter - simplified for demo
    let timeMatch = true;
    const orderDate = new Date(order.date);
    const now = new Date();
    
    if (timeRange === "last30") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      timeMatch = orderDate >= thirtyDaysAgo;
    } else if (timeRange === "last90") {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(now.getDate() - 90);
      timeMatch = orderDate >= ninetyDaysAgo;
    } else if (timeRange === "last365") {
      const yearAgo = new Date();
      yearAgo.setDate(now.getDate() - 365);
      timeMatch = orderDate >= yearAgo;
    }
    
    return searchMatch && statusMatch && timeMatch;
  });

  // Pagination
  const ordersPerPage = 5;
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  // Format date string to more readable format
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Status badge color mapping
  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case "delivered":
        return "success";
      case "processing":
        return "info";
      case "cancelled":
        return "failure";
      case "shipped":
        return "warning";
      default:
        return "gray";
    }
  };

  return (
    <>
      <NavbarHome />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
                My Orders
              </h1>
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3 w-full md:w-auto">
                <div className="relative">
                  <TextInput
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={HiOutlineSearch}
                    className="min-w-[250px]"
                  />
                </div>
                <div className="flex space-x-2">
                  <Select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="min-w-[130px]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="delivered">Delivered</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                  <Select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="min-w-[130px]"
                  >
                    <option value="all">All Time</option>
                    <option value="last30">Last 30 Days</option>
                    <option value="last90">Last 90 Days</option>
                    <option value="last365">Last Year</option>
                  </Select>
                </div>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No orders match your search criteria.</p>
                <Button 
                  color="gray" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setTimeRange("all");
                  }}
                >
                  <HiOutlineRefresh className="mr-2 h-5 w-5" />
                  Reset Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table striped>
                    <Table.Head>
                      <Table.HeadCell>Order #</Table.HeadCell>
                      <Table.HeadCell>Date</Table.HeadCell>
                      <Table.HeadCell>Status</Table.HeadCell>
                      <Table.HeadCell>Items</Table.HeadCell>
                      <Table.HeadCell>Total</Table.HeadCell>
                      <Table.HeadCell>Actions</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                      {paginatedOrders.map((order) => (
                        <Table.Row key={order.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                          <Table.Cell className="font-medium text-gray-900 dark:text-white">
                            {order.orderNumber}
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex items-center">
                              <HiOutlineCalendar className="mr-2 h-4 w-4 text-gray-500" />
                              {formatDate(order.date)}
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <Badge color={getStatusBadgeColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>
                            {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                          </Table.Cell>
                          <Table.Cell>
                            ${order.totalAmount.toFixed(2)}
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex items-center space-x-2">
                              <Link to={`/orders/${order.id}`}>
                                <Button size="xs" color="blue">
                                  <HiOutlineEye className="mr-1 h-4 w-4" />
                                  View
                                </Button>
                              </Link>
                              {order.status === "delivered" && (
                                <Link to={`/orders/${order.id}/review`}>
                                  <Button size="xs" color="light">
                                    Review
                                  </Button>
                                </Link>
                              )}
                              {(order.status === "shipped" || order.status === "delivered") && order.trackingNumber && (
                                <Link to={`/orders/${order.id}/tracking`}>
                                  <Button size="xs" color="light">
                                    Track
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(page) => setCurrentPage(page)}
                      showIcons
                    />
                  </div>
                )}
              </>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Need Help?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                If you need assistance with your orders or have questions about returns and refunds,
                our customer support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <Link to="/support-chat">
                  <Button color="blue">
                    Chat with Support
                  </Button>
                </Link>
                <Link to="/faq#orders">
                  <Button color="light">
                    Order FAQs
                  </Button>
                </Link>
              </div>
            </Card>
            
            <Card>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Return Policy
              </h2>
              <ul className="list-disc pl-5 mb-4 text-gray-600 dark:text-gray-400 space-y-2">
                <li>Items can be returned within 30 days of delivery</li>
                <li>Products must be unopened and in original packaging</li>
                <li>Free return shipping for eligible items</li>
                <li>Refunds are processed within 5-7 business days</li>
              </ul>
              <Link to="/return-policy">
                <Button color="light">
                  View Return Policy
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrdersPage; 