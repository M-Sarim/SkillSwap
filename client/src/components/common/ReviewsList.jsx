import { useState, useMemo } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { formatDate } from "../../utils/helpers";
import ReviewResponse from "../freelancer/ReviewResponse";

const ReviewsList = ({ reviews, showFilters = true, isFreelancer = false }) => {
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [respondingToId, setRespondingToId] = useState(null);

  // Calculate average rating and stats
  const stats = useMemo(() => {
    if (!reviews.length) return { average: 0, counts: {} };

    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / reviews.length;
    const counts = {};

    // Count reviews by rating
    reviews.forEach((review) => {
      counts[review.rating] = (counts[review.rating] || 0) + 1;
    });

    return { average, counts };
  }, [reviews]);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      if (filter === "all") return true;
      return review.rating === parseInt(filter);
    });
  }, [reviews, filter]);

  // Sort reviews
  const sortedReviews = useMemo(() => {
    return [...filteredReviews].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.date) - new Date(a.date);
        case "oldest":
          return new Date(a.date) - new Date(b.date);
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });
  }, [filteredReviews, sortBy]);

  // Render star rating
  const renderStars = (rating) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  const handleResponseSuccess = (updatedReview) => {
    setRespondingToId(null);
    // Parent component should handle the review update
  };

  return (
    <div className="space-y-6">
      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="flex items-center">
                <span className="text-3xl font-bold text-gray-900">
                  {stats.average.toFixed(1)}
                </span>
                <div className="ml-2">
                  {renderStars(Math.round(stats.average))}
                  <p className="text-sm text-gray-500 mt-1">
                    {reviews.length} reviews
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
              <div>
                <label
                  htmlFor="filter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Filter by Rating
                </label>
                <select
                  id="filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="all">All Ratings</option>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} Stars ({stats.counts[rating] || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="sortBy"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sort By
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rating breakdown */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Rating Breakdown
            </h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.counts[rating] || 0;
                const percentage = reviews.length
                  ? (count / reviews.length) * 100
                  : 0;

                return (
                  <div key={rating} className="flex items-center">
                    <div className="w-24 flex items-center">
                      <span className="text-sm text-gray-600">
                        {rating} stars
                      </span>
                    </div>
                    <div className="flex-1 h-4 mx-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {sortedReviews.length > 0 ? (
        <div className="space-y-4">
          {sortedReviews.map((review) => (
            <div key={review._id} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  {review.client?.profileImage ? (
                    <img
                      src={review.client.profileImage}
                      alt={review.client.name}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-800 font-medium">
                        {review.client?.name?.charAt(0) || "C"}
                      </span>
                    </div>
                  )}
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      {review.client?.name || "Client"}
                    </h4>
                    <div className="flex items-center mt-1">
                      {renderStars(review.rating)}
                      <span className="ml-2 text-sm text-gray-500">
                        {formatDate(review.date)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-gray-600">{review.comment}</p>
              </div>

              {review.response ? (
                <div className="mt-4 pl-4 border-l-4 border-gray-200">
                  <h5 className="text-sm font-medium text-gray-900">
                    Response from Freelancer
                  </h5>
                  <p className="mt-1 text-sm text-gray-600">
                    {review.response}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDate(review.responseDate)}
                  </p>
                </div>
              ) : (
                isFreelancer &&
                !review.response && (
                  <div className="mt-4">
                    {respondingToId === review._id ? (
                      <ReviewResponse
                        reviewId={review._id}
                        onSuccess={handleResponseSuccess}
                        onCancel={() => setRespondingToId(null)}
                      />
                    ) : (
                      <button
                        onClick={() => setRespondingToId(review._id)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Respond to Review
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">No reviews found</p>
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
