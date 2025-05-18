import { useState, useContext } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import AuthContext from "../../context/AuthContext";
import SocketContext from "../../context/SocketContext";
import useApi from "../../hooks/useApi";
import { formatCurrency } from "../../utils/helpers";

const BidForm = ({ project, onClose }) => {
  const { user } = useContext(AuthContext);
  const { submitBid } = useContext(SocketContext);
  const { post, loading, error } = useApi();
  const [success, setSuccess] = useState(false);

  // Validation schema
  const validationSchema = Yup.object({
    amount: Yup.number()
      .required("Bid amount is required")
      .positive("Bid amount must be positive")
      .max(
        project.budget * 2,
        `Bid amount cannot exceed ${formatCurrency(project.budget * 2)}`
      ),
    deliveryTime: Yup.number()
      .required("Delivery time is required")
      .positive("Delivery time must be positive")
      .integer("Delivery time must be a whole number"),
    proposal: Yup.string()
      .required("Proposal is required")
      .min(50, "Proposal must be at least 50 characters")
      .max(1000, "Proposal cannot exceed 1000 characters"),
  });

  // Initial values
  const initialValues = {
    amount: project.budget,
    deliveryTime: 14, // Default to 14 days
    proposal: "",
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      const bidData = {
        amount: parseFloat(values.amount),
        deliveryTime: parseInt(values.deliveryTime),
        proposal: values.proposal,
      };

      console.log("Submitting bid with data:", bidData);

      // Submit bid using API
      const response = await post(`/projects/${project._id}/bids`, bidData);

      console.log("Bid submission response:", response);

      if (response.success) {
        // Emit socket event for real-time updates
        if (submitBid) {
          submitBid(project._id, response.data.bid || response.data);
        }

        setSuccess(true);

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error("Error submitting bid:", err);
      // Show error toast
      toast.error(
        err.response?.data?.message || "Failed to submit bid. Please try again."
      );
    }
  };

  return (
    <div>
      {success ? (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
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
                Bid submitted successfully!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Your bid has been submitted. You will be notified if the
                  client responds to your bid.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values }) => (
            <Form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Bid Amount (USD)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <Field
                      type="number"
                      name="amount"
                      id="amount"
                      className="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">USD</span>
                    </div>
                  </div>
                  <ErrorMessage
                    name="amount"
                    component="p"
                    className="mt-2 text-sm text-red-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="deliveryTime"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Delivery Time (days)
                  </label>
                  <Field
                    type="number"
                    name="deliveryTime"
                    id="deliveryTime"
                    className="mt-1 block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    min="1"
                    step="1"
                  />
                  <ErrorMessage
                    name="deliveryTime"
                    component="p"
                    className="mt-2 text-sm text-red-600"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="proposal"
                  className="block text-sm font-medium text-gray-700"
                >
                  Proposal
                </label>
                <Field
                  as="textarea"
                  name="proposal"
                  id="proposal"
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Explain why you're the best fit for this project. Highlight your relevant skills and experience."
                />
                <ErrorMessage
                  name="proposal"
                  component="p"
                  className="mt-2 text-sm text-red-600"
                />
                <div className="mt-1 text-xs text-gray-500 flex justify-between">
                  <span>Min 50 characters</span>
                  <span>{values.proposal.length}/1000 characters</span>
                </div>
              </div>

              <div className="bg-gray-50 -mx-6 px-6 py-3 flex justify-end space-x-3">
                <button
                  type="button"
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    "Submit Bid"
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      )}
    </div>
  );
};

export default BidForm;
