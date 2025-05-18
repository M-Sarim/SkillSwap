import {
  ClockIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency, formatDate } from "../../utils/helpers";

const BidCard = ({
  bid,
  onAccept,
  onReject,
  onCounter,
  onMessage,
  isClient = false,
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200">
      <div className="flex flex-col md:flex-row md:items-start">
        {/* Freelancer Info */}
        <div className="flex items-start mb-4 md:mb-0 md:w-1/4">
          <div className="flex-shrink-0">
            {bid.freelancer.user.profileImage ? (
              <img
                src={bid.freelancer.user.profileImage}
                alt={bid.freelancer.user.name}
                className="h-12 w-12 rounded-full"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-800 font-medium text-sm">
                  {bid.freelancer.user && bid.freelancer.user.name
                    ? bid.freelancer.user.name.charAt(0).toUpperCase()
                    : "F"}
                </span>
              </div>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {bid.freelancer.user && bid.freelancer.user.name
                ? bid.freelancer.user.name
                : "Freelancer"}
            </p>
            <div className="flex items-center">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-4 w-4 ${
                      star <= bid.freelancer.averageRating
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                      clipRule="evenodd"
                    />
                  </svg>
                ))}
              </div>
              <span className="ml-1 text-xs text-gray-500">
                ({bid.freelancer.averageRating})
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {bid.freelancer.skills.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {skill}
                </span>
              ))}
              {bid.freelancer.skills.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{bid.freelancer.skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bid Details */}
        <div className="md:w-2/4 mb-4 md:mb-0">
          <div className="text-sm text-gray-900 whitespace-pre-line">
            {bid.proposal}
          </div>
          <div className="mt-2 flex flex-wrap gap-4">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-1" />
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(bid.amount)}
              </span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-gray-400 mr-1" />
              <span className="text-sm font-medium text-gray-900">
                {bid.deliveryTime} days
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Bid placed on {formatDate(bid.createdAt)}
            </div>
          </div>

          {/* Counter Offer Details */}
          {bid.counterOffer && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <div className="text-xs font-medium text-gray-500 mb-2">
                Counter Offer:
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(bid.counterOffer.amount)}
                  </span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm font-medium text-gray-900">
                    {bid.counterOffer.deliveryTime} days
                  </span>
                </div>
              </div>
              {bid.counterOffer.message && (
                <div className="mt-2 text-xs text-gray-700 italic">
                  "{bid.counterOffer.message}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="md:w-1/4 flex md:flex-col md:items-end space-x-2 md:space-x-0 md:space-y-2">
          {bid.status === "Pending" && isClient ? (
            <>
              <button
                type="button"
                onClick={onAccept}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Accept
              </button>
              <button
                type="button"
                onClick={onCounter}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Counter
              </button>
              <button
                type="button"
                onClick={onReject}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                Reject
              </button>
              <button
                type="button"
                onClick={onMessage}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                Message
              </button>
            </>
          ) : bid.status === "Pending" ? (
            <>
              <button
                type="button"
                onClick={onAccept}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Accept
              </button>
              <button
                type="button"
                onClick={onReject}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                Reject
              </button>
              <button
                type="button"
                onClick={onMessage}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                Message
              </button>
            </>
          ) : (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                bid.status === "Accepted"
                  ? "bg-green-100 text-green-800"
                  : bid.status === "Countered"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {bid.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BidCard;
