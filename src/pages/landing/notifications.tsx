import React from "react";
import { LandingLayout } from "../../layouts";

/**
 * Interface for notification data structure
 */
interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: "info" | "success" | "warning" | "error";
}

/**
 * Mock notification data
 */
const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "New Product Alert",
    message: "Check out our latest collection of summer wear",
    timestamp: "2 hours ago",
    isRead: false,
    type: "info"
  },
  {
    id: "2",
    title: "Order Confirmed",
    message: "Your order #12345 has been confirmed",
    timestamp: "1 day ago",
    isRead: false,
    type: "success"
  },
  {
    id: "3",
    title: "Special Offer",
    message: "Get 20% off on all sports equipment",
    timestamp: "2 days ago",
    isRead: true,
    type: "warning"
  },
  {
    id: "4",
    title: "Payment Failed",
    message: "Your recent payment could not be processed",
    timestamp: "3 days ago",
    isRead: true,
    type: "error"
  }
];

/**
 * Notification page component
 */
const NotificationsPage: React.FC = () => {
  const unreadCount = mockNotifications.filter(n => !n.isRead).length;

  return (
    <LandingLayout>
      <div className="p-5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-indigo-600 text-white text-sm font-medium px-3 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="space-y-4">
          {mockNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl p-4 shadow-sm border ${
                notification.isRead ? "border-gray-100" : "border-indigo-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{notification.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{notification.timestamp}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  notification.isRead ? "bg-gray-300" : "bg-indigo-600"
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LandingLayout>
  );
};

export default NotificationsPage; 