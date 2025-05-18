import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import useApi from "../../hooks/useApi";

const ReviewForm = ({ freelancerId, projectId, onSuccess, onCancel }) => {
  const { post, loading } = useApi();
  const [success, setSuccess] = useState(false);

  const validationSchema = Yup.object({
    rating: Yup.number()
      .required("Rating is required")
      .min(1, "Rating must be at least 1 star")
      .max(5, "Rating cannot exceed 5 stars"),
    comment: Yup.string()
      .required("Review comment is required")
      .min(10, "Comment must be at least 10 characters")
      .max(500, "Comment cannot exceed 500 characters"),
  });

  const initialValues = {
    rating: 0,
    comment: "",
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const response = await post("/reviews", {
        freelancerId,
        projectId,
        rating: values.rating,
        comment: values.comment,
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(response.data.review);
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const RatingSelector = ({ field, form }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none transition-colors duration-150"
            onClick={() => form.setFieldValue(field.name, star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`Rate ${star} stars`}
          >
            {star <= (hoverRating || field.value) ? (
              <StarIcon className="h-8 w-8 text-yellow-400" />
            ) : (
              <StarOutlineIcon className="h-8 w-8 text-gray-300 hover:text-yellow-200" />
            )}
          </button>
        ))}
      </div>
    );
  };

  if (success) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Review submitted successfully!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Thank you for your feedback. Your review helps other clients
                  make informed decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Rate Your Experience
      </h3>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values }) => (
          <Form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              <Field name="rating" component={RatingSelector} />
              <ErrorMessage
                name="rating"
                component="p"
                className="mt-2 text-sm text-red-600"
              />
            </div>

            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-gray-700"
              >
                Review
              </label>
              <Field
                as="textarea"
                name="comment"
                id="comment"
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Share your experience working with this freelancer..."
              />
              <ErrorMessage
                name="comment"
                component="p"
                className="mt-2 text-sm text-red-600"
              />
              <div className="mt-1 text-xs text-gray-500 flex justify-end">
                <span
                  className={values.comment.length > 500 ? "text-red-500" : ""}
                >
                  {values.comment.length}/500 characters
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ReviewForm;
