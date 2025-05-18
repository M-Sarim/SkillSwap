import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import useApi from "../../hooks/useApi";
import { formatDistanceToNow } from "date-fns";
import NotificationModal from "../../components/common/NotificationModal";
import AuthContext from "../../context/AuthContext";

const Notifications = () => {
  const { get, put, loading } = useApi();
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const queryParams = { page, limit: 20 };

      if (filter === "unread") {
        queryParams.read = false;
      } else if (filter === "read") {
        queryParams.read = true;
      }

      const response = await get("/notify", queryParams);

      if (response.success) {
        setNotifications(response.data.notifications || []);
        setTotalPages(response.data.totalPages || 1);
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
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Pass false as the third parameter to disable toast notifications
      const response = await put("/notify/read-all", {}, false);
      if (response.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notification) => {
            // Mark all notifications as read and add the _markedAsReadInModal flag
            // to prevent duplicate marking in the modal
            return {
              ...notification,
              read: true,
              _markedAsReadInModal: true,
            };
          })
        );
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
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

  // Load notifications on mount and when filter or page changes
  useEffect(() => {
    fetchNotifications();
  }, [filter, page]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>

        <div className="flex items-center space-x-4">
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                filter === "all"
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border border-gray-300`}
              onClick={() => handleFilterChange("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${
                filter === "unread"
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border-t border-b border-gray-300`}
              onClick={() => handleFilterChange("unread")}
            >
              Unread
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                filter === "read"
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border border-gray-300`}
              onClick={() => handleFilterChange("read")}
            >
              Read
            </button>
          </div>

          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm"
            onClick={markAllAsRead}
          >
            Mark all as read
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : notifications.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li key={notification._id}>
                <Link
                  to="#" // We'll handle navigation in the click handler
                  className={`block hover:bg-gray-50 ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                  onClick={(e) => handleNotificationClick(notification, e)}
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-start">
                      <div
                        className={`flex-shrink-0 h-10 w-10 rounded-full ${getNotificationIcon(
                          notification.type
                        )} flex items-center justify-center`}
                      >
                        <span className="text-sm font-bold">
                          {notification.title.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="ml-2 flex-shrink-0">
                          <span className="inline-block h-2 w-2 rounded-full bg-primary-600"></span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No notifications found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                page === 1 ? "text-gray-300" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <span className="sr-only">Previous</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  page === i + 1
                    ? "z-10 bg-primary-50 border-primary-500 text-primary-600"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                page === totalPages
                  ? "text-gray-300"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <span className="sr-only">Next</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>
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

export default Notifications;
