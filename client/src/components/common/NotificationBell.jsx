import { useState, useEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import { BellIcon } from "@heroicons/react/24/outline";
import AuthContext from "../../context/AuthContext";
import useApi from "../../hooks/useApi";
import { formatDistanceToNow } from "date-fns";
import NotificationModal from "./NotificationModal";

const NotificationBell = () => {
  const { user } = useContext(AuthContext);
  const { get, put } = useApi();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await get("/notify");
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      // Pass false as the third parameter to disable toast notifications
      const response = await put(`/notify/${id}/read`, {}, false);
      if (response.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === id
              ? {
                  ...notification,
                  read: true,
                  _markedAsReadInModal: true, // Add flag to prevent duplicate marking
                }
              : notification
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch notifications on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "verification_request":
      case "freelancer_verified":
        return "bg-blue-100 text-blue-600";
      case "bid_received":
      case "bid_accepted":
      case "bid_rejected":
        return "bg-green-100 text-green-600";
      case "message_received":
        return "bg-purple-100 text-purple-600";
      case "project_completed":
        return "bg-yellow-100 text-yellow-600";
      case "contract_created":
      case "contract_signed":
        return "bg-indigo-100 text-indigo-600";
      case "payment_received":
        return "bg-emerald-100 text-emerald-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification, e) => {
    e.preventDefault(); // Prevent default link behavior

    // For message notifications, handle direct navigation
    if (notification.type === "message_received") {
      // Mark as read if not already read
      if (!notification.read) {
        markAsRead(notification._id);
      }

      // Close the dropdown
      setIsOpen(false);

      // Navigate directly to the message page
      handleMessageNavigation(notification);
      return;
    }

    // For other notification types, show the modal
    setSelectedNotification(notification);
    setModalOpen(true);

    // Mark as read if not already read
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Close the dropdown
    setIsOpen(false);
  };

  // Get the correct action link based on notification type and user role
  const getCorrectActionLink = (notification) => {
    if (!notification || !notification.actionLink) return "#";

    // For message notifications, we need to ensure the correct path format
    if (notification.type === "message_received") {
      // Extract the sender ID from the actionLink
      // The format is typically "/messages/{senderId}" or "/messages/{senderId}?project={projectId}"
      const match = notification.actionLink.match(/\/messages\/([^?]+)/);
      if (match && match[1]) {
        const senderId = match[1];
        // Get user role from AuthContext or localStorage as fallback
        const userRole =
          user?.role || localStorage.getItem("current_user_role");

        // Return the correct path based on user role
        if (userRole === "client") {
          return `/client/messages/${senderId}`;
        } else if (userRole === "freelancer") {
          return `/freelancer/messages/${senderId}`;
        }
      }
    }

    // For other notification types, use the original actionLink
    return notification.actionLink;
  };

  // Handle direct navigation to message page
  const handleMessageNavigation = (notification) => {
    if (notification.type === "message_received") {
      const correctLink = getCorrectActionLink(notification);

      // Force navigation to the correct link
      window.location.href = correctLink;
      return true;
    }
    return false;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="p-1 rounded-full text-gray-500 hover:text-secondary-600 transition-colors duration-200 focus:outline-none"
        onClick={toggleDropdown}
      >
        <span className="sr-only">View notifications</span>
        <BellIcon className="h-6 w-6" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-2 px-4 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="py-1">
                {notifications.map((notification) => (
                  <Link
                    key={notification._id}
                    to="#" // We'll handle navigation in the click handler
                    className={`block px-4 py-3 hover:bg-gray-50 ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                    onClick={(e) => handleNotificationClick(notification, e)}
                  >
                    <div className="flex items-start">
                      <div
                        className={`flex-shrink-0 h-8 w-8 rounded-full ${getNotificationIcon(
                          notification.type
                        )} flex items-center justify-center`}
                      >
                        <span className="text-xs font-bold">
                          {notification.title.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            { addSuffix: true }
                          )}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="ml-2 flex-shrink-0">
                          <span className="inline-block h-2 w-2 rounded-full bg-primary-600"></span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-4 px-4 text-center text-gray-500">
                <p>No notifications</p>
              </div>
            )}
          </div>
          <div className="py-2 px-4 border-t border-gray-100 text-center">
            <Link
              to={
                user?.role === "admin"
                  ? "/admin/notifications"
                  : "/notifications"
              }
              className="text-xs font-medium text-primary-600 hover:text-primary-500"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        notification={selectedNotification}
        onMarkAsRead={markAsRead}
        getCorrectActionLink={getCorrectActionLink}
      />
    </div>
  );
};

export default NotificationBell;
