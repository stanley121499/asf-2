import React, { useState, useEffect } from "react";
import { Button, Card, Avatar, Badge, Tooltip, Tabs } from "flowbite-react";
import NavbarHome from "../../components/navbar-home";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineShoppingBag, HiOutlineHeart, HiOutlineCog, HiOutlineUser, HiOutlineQuestionMarkCircle, HiOutlineLogout, HiOutlineLocationMarker, HiOutlineCreditCard } from "react-icons/hi";
import OrdersList from "./components/OrdersList";
import { useAuthContext } from "../../context/AuthContext";
import { usePointsMembership } from "../../context/PointsMembershipContext";

const ProfileSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("account");
  const [userPoints, setUserPoints] = useState<number>(0);
  const { user } = useAuthContext();
  const pointsAPI = usePointsMembership();

  // Fetch user points
  useEffect(() => {
    const fetchUserPoints = async () => {
      if (user?.id) {
        try {
          const pointsRecord = await pointsAPI.getUserPointsByUserId(user.id);
          setUserPoints(pointsRecord?.amount || 0);
        } catch (err) {
          console.error("Error fetching user points:", err);
          setUserPoints(0);
        }
      }
    };
    fetchUserPoints();
  }, [user, pointsAPI]);

  const handleLogout = () => {
    console.log("Logging out...");
    // Add your logout functionality here
    navigate("/authentication/sign-in"); // Redirect to sign-in page
  };

  return (
    <>
      <NavbarHome />
      <section className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 md:p-6">
        <Card className="w-full max-w-4xl p-0 rounded-lg shadow-md dark:bg-gray-800">
          <div className="flex flex-col md:flex-row w-full">
            {/* Left sidebar for larger screens */}
            <div className="md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
              <div className="flex flex-col items-center mb-6">
                <Avatar
                  img="/images/users/roberta-casas-2x.png"
                  alt="Profile Picture"
                  rounded={true}
                  size="xl"
                  className="mb-4"
                />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  John Doe
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  john.doe@example.com
                </p>
                <div className="flex items-center mt-1 mb-4">
                  <Badge color="info" className="px-3 py-1.5">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Gold Member</span>
                    </div>
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Points:
                  </span>
                  <Tooltip content="You can redeem these points for discounts">
                    <span className="text-sm text-gray-800 dark:text-white font-semibold">
                      {userPoints.toLocaleString()}
                    </span>
                  </Tooltip>
                </div>
              </div>

              {/* Navigation Menu */}
              <div className="flex flex-col space-y-2">
                <Button 
                  color={activeTab === "account" ? "blue" : "gray"}
                  className="justify-start"
                  onClick={() => setActiveTab("account")}
                >
                  <HiOutlineUser className="mr-2 h-5 w-5" />
                  Account
                </Button>
                <Button 
                  color={activeTab === "orders" ? "blue" : "gray"}
                  className="justify-start"
                  onClick={() => setActiveTab("orders")}
                >
                  <HiOutlineShoppingBag className="mr-2 h-5 w-5" />
                  Orders
                </Button>
                <Button 
                  color={activeTab === "wishlist" ? "blue" : "gray"}
                  className="justify-start"
                  onClick={() => setActiveTab("wishlist")}
                >
                  <HiOutlineHeart className="mr-2 h-5 w-5" />
                  Wishlist
                </Button>
                <Button 
                  color={activeTab === "addresses" ? "blue" : "gray"}
                  className="justify-start"
                  onClick={() => setActiveTab("addresses")}
                >
                  <HiOutlineLocationMarker className="mr-2 h-5 w-5" />
                  Addresses
                </Button>
                <Button 
                  color={activeTab === "payment" ? "blue" : "gray"}
                  className="justify-start"
                  onClick={() => setActiveTab("payment")}
                >
                  <HiOutlineCreditCard className="mr-2 h-5 w-5" />
                  Payment Methods
                </Button>
                <Button 
                  color={activeTab === "support" ? "blue" : "gray"}
                  className="justify-start"
                  onClick={() => setActiveTab("support")}
                >
                  <HiOutlineQuestionMarkCircle className="mr-2 h-5 w-5" />
                  Support
                </Button>
                <Button 
                  color="red"
                  className="justify-start mt-8"
                  onClick={handleLogout}
                >
                  <HiOutlineLogout className="mr-2 h-5 w-5" />
                  Logout
                </Button>
              </div>
            </div>

            {/* Right content area */}
            <div className="md:w-2/3 p-6">
              {activeTab === "account" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Account Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        defaultValue="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        defaultValue="Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        defaultValue="john.doe@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        defaultValue="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  <Button color="blue">
                    Save Changes
                  </Button>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Password
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                    <Button color="blue" className="mt-4">
                      Update Password
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "orders" && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    Order History
                  </h3>
                  <OrdersList />
                </div>
              )}

              {activeTab === "wishlist" && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    My Wishlist
                  </h3>
                  {/* Wishlist items */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center space-x-4">
                        <img src="/images/products/product-1.jpg" alt="Product" className="w-16 h-16 object-cover rounded-md" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">Wireless Headphones</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">$99.99</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="xs" color="blue">Add to Cart</Button>
                          <Button size="xs" color="light">Remove</Button>
                        </div>
                      </div>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center space-x-4">
                        <img src="/images/products/product-2.jpg" alt="Product" className="w-16 h-16 object-cover rounded-md" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">Smart Watch</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">$199.99</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="xs" color="blue">Add to Cart</Button>
                          <Button size="xs" color="light">Remove</Button>
                        </div>
                      </div>
                    </div>
                    <Link to="/wishlist" className="text-blue-600 hover:underline flex items-center justify-center mt-2">
                      View full wishlist
                    </Link>
                  </div>
                </div>
              )}
              
              {activeTab === "addresses" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      My Addresses
                    </h3>
                    <Button size="sm" color="blue">Add New Address</Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white mb-1">Home</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">John Doe</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">123 Main Street, Apt 4B</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">New York, NY 10001</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">United States</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">+1 (555) 123-4567</p>
                        </div>
                        <div>
                          <Badge color="blue" className="mb-2">Default</Badge>
                          <div className="flex flex-col space-y-2">
                            <Button size="xs">Edit</Button>
                            <Button size="xs" color="light">Remove</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white mb-1">Work</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">John Doe</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">456 Business Ave, Floor 12</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">New York, NY 10002</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">United States</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">+1 (555) 987-6543</p>
                        </div>
                        <div>
                          <div className="flex flex-col space-y-2">
                            <Button size="xs">Edit</Button>
                            <Button size="xs" color="light">Remove</Button>
                            <Button size="xs" color="light">Set as Default</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === "payment" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Payment Methods
                    </h3>
                    <Button size="sm" color="blue">Add Payment Method</Button>
                  </div>
                  <div className="space-y-4">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-md mr-3">
                            <HiOutlineCreditCard className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Visa ending in 4242</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Expires 05/2025</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge color="blue">Default</Badge>
                          <Button size="xs">Edit</Button>
                          <Button size="xs" color="light">Remove</Button>
                        </div>
                      </div>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="bg-red-100 dark:bg-red-900 p-2 rounded-md mr-3">
                            <HiOutlineCreditCard className="h-6 w-6 text-red-600 dark:text-red-300" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Mastercard ending in 8888</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Expires 08/2026</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="xs">Edit</Button>
                          <Button size="xs" color="light">Remove</Button>
                          <Button size="xs" color="light">Set Default</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "support" && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    Customer Support
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Need help with your orders, returns, or have questions about our products?
                      Our customer support team is here to help.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Link to="/support-chat">
                        <Button fullSized color="blue">
                          <HiOutlineQuestionMarkCircle className="mr-2 h-5 w-5" />
                          Chat with Support
                        </Button>
                      </Link>
                      <a href="mailto:support@example.com">
                        <Button fullSized color="light">
                          Email Support
                        </Button>
                      </a>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Frequently Asked Questions
                      </h4>
                      <div className="space-y-2">
                        <Link to="/faq#returns" className="block text-blue-600 hover:underline">
                          How do I return an item?
                        </Link>
                        <Link to="/faq#shipping" className="block text-blue-600 hover:underline">
                          What are the shipping options?
                        </Link>
                        <Link to="/faq#payment" className="block text-blue-600 hover:underline">
                          What payment methods do you accept?
                        </Link>
                        <Link to="/faq" className="block text-blue-600 hover:underline mt-2">
                          View all FAQs
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </section>
    </>
  );
};

export default ProfileSettingsPage;
