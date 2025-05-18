import { Fragment, useRef, useEffect, useContext } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import AuthContext from "../../context/AuthContext";

/**
 * Modal component for displaying notification details
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to call when the modal is closed
 * @param {Object} props.notification - The notification to display
 * @param {function} props.onMarkAsRead - Function to call to mark the notification as read
 * @param {function} props.getCorrectActionLink - Function to get the correct action link
 */
const NotificationModal = ({
  isOpen,
  onClose,
  notification,
  onMarkAsRead,
  getCorrectActionLink,
}) => {
  const cancelButtonRef = useRef(null);
  const { user } = useContext(AuthContext);

  // Mark as read when opened - only once when the modal is first opened
  useEffect(() => {
    // Only mark as read when the modal is first opened and notification is unread
    // We use a ref to track if we've already marked this notification as read
    if (isOpen && notification && !notification.read) {
      // Use a custom property on the notification object to track if we've marked it
      if (!notification._markedAsReadInModal) {
        notification._markedAsReadInModal = true;
        onMarkAsRead(notification._id);
      }
    }
  }, [isOpen, notification, onMarkAsRead]);

  // Determine if the actionLink is valid and should be shown
  const hasValidActionLink =
    notification &&
    notification.actionLink &&
    notification.actionLink.trim() !== "" &&
    notification.actionLink !== "#";

  // Get the correct action link based on notification type and user role
  const getCorrectActionLinkInternal = () => {
    if (!notification || !notification.actionLink) return "#";

    // If a getCorrectActionLink function was passed as a prop, use it
    if (getCorrectActionLink && typeof getCorrectActionLink === "function") {
      return getCorrectActionLink(notification);
    }

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

  // Get appropriate action button text based on notification type
  const getActionButtonText = (type) => {
    switch (type) {
      case "message_received":
        return "View Message";
      case "bid_received":
      case "bid_accepted":
      case "bid_rejected":
      case "bid_countered":
        return "View Bid";
      case "project_created":
      case "project_completed":
        return "View Project";
      case "contract_created":
      case "contract_signed":
        return "View Contract";
      case "payment_received":
        return "View Payment";
      case "verification_request":
      case "freelancer_verified":
        return "View Profile";
      case "milestone_completed":
        return "View Milestone";
      default:
        return "View Details";
    }
  };

  if (!notification) return null;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed z-50 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        onClose={onClose}
      >
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={onClose}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div
                  className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${getNotificationIcon(
                    notification.type
                  )} sm:mx-0 sm:h-10 sm:w-10`}
                >
                  <span className="text-lg font-bold">
                    {notification.title.charAt(0)}
                  </span>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <Dialog.Title
                    as="h3"
                    className="text-lg leading-6 font-medium text-gray-900"
                  >
                    {notification.title}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                {hasValidActionLink && (
                  <Link
                    to={getCorrectActionLinkInternal()}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={(e) => {
                      // For message notifications, we need special handling
                      if (notification.type === "message_received") {
                        e.preventDefault(); // Prevent default navigation

                        // Close the modal first
                        onClose();

                        // Get the correct action link
                        const correctLink = getCorrectActionLinkInternal();

                        // Add a small delay to ensure the modal is closed before navigation
                        setTimeout(() => {
                          // Force navigation to the correct link
                          window.location.href = correctLink;
                        }, 100);
                      } else {
                        // For other notification types, just close the modal
                        onClose();

                        // Get the correct action link
                        const correctLink = getCorrectActionLinkInternal();

                        // Add a small delay to ensure the modal is closed before navigation
                        setTimeout(() => {
                          // Force a page reload if the user is already on the same page
                          if (window.location.pathname === correctLink) {
                            window.location.reload();
                          }
                        }, 100);
                      }
                    }}
                  >
                    {getActionButtonText(notification.type)}
                  </Link>
                )}
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={onClose}
                  ref={cancelButtonRef}
                >
                  Close
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default NotificationModal;
