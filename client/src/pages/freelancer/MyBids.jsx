import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import {
  ArrowPathIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import useApi from "../../hooks/useApi";
import AuthContext from "../../context/AuthContext";
import SocketContext from "../../context/SocketContext";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { toast } from "react-toastify";

const MyBids = () => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const { get, loading, error } = useApi();
  const [bids, setBids] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchBids = async () => {
    try {
      console.log("Fetching bids for freelancer...");

      // Clear any existing cache to ensure fresh data
      localStorage.removeItem("freelancer_bids_cache");

      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await get(`/projects/bids/freelancer?t=${timestamp}`);
      console.log("Bids response:", response);

      if (response.success) {
        // Check if the response has the expected structure
        if (response.data && response.data.bids) {
          console.log(
            "Setting bids from response.data.bids:",
            response.data.bids
          );

          // Process bids to ensure counter offers are properly displayed
          const processedBids = response.data.bids.map((bid) => {
            // Ensure status is correctly set for counter offers
            if (bid.counterOffer && bid.status !== "Countered") {
              console.log(
                `Fixing status for bid ${bid._id} with counter offer`
              );
              return { ...bid, status: "Countered" };
            }
            return bid;
          });

          setBids(processedBids);
        } else if (Array.isArray(response.data)) {
          console.log("Setting bids from response.data array:", response.data);

          // Process bids to ensure counter offers are properly displayed
          const processedBids = response.data.map((bid) => {
            // Ensure status is correctly set for counter offers
            if (bid.counterOffer && bid.status !== "Countered") {
              console.log(
                `Fixing status for bid ${bid._id} with counter offer`
              );
              return { ...bid, status: "Countered" };
            }
            return bid;
          });

          setBids(processedBids);
        } else {
          console.log("Response has unexpected structure:", response.data);
          toast.warning("Received unexpected data format from server");
        }
      } else {
        console.log("Failed to fetch bids from server");
        toast.error("Failed to fetch bids from server");

        // Try alternative endpoint as fallback
        try {
          console.log("Trying alternative endpoint: /bids/freelancer");
          const altResponse = await get(`/bids/freelancer?t=${timestamp}`);
          console.log("Alternative endpoint response:", altResponse);

          if (altResponse.success) {
            if (altResponse.data && altResponse.data.bids) {
              console.log(
                "Setting bids from alternative endpoint:",
                altResponse.data.bids
              );

              // Process bids to ensure counter offers are properly displayed
              const processedBids = altResponse.data.bids.map((bid) => {
                // Ensure status is correctly set for counter offers
                if (bid.counterOffer && bid.status !== "Countered") {
                  console.log(
                    `Fixing status for bid ${bid._id} with counter offer`
                  );
                  return { ...bid, status: "Countered" };
                }
                return bid;
              });

              setBids(processedBids);
            } else if (Array.isArray(altResponse.data)) {
              console.log(
                "Setting bids from alternative endpoint array:",
                altResponse.data
              );

              // Process bids to ensure counter offers are properly displayed
              const processedBids = altResponse.data.map((bid) => {
                // Ensure status is correctly set for counter offers
                if (bid.counterOffer && bid.status !== "Countered") {
                  console.log(
                    `Fixing status for bid ${bid._id} with counter offer`
                  );
                  return { ...bid, status: "Countered" };
                }
                return bid;
              });

              setBids(processedBids);
            }
          }
        } catch (altErr) {
          console.error("Error fetching from alternative endpoint:", altErr);
        }
      }
    } catch (err) {
      console.error("Error fetching bids:", err);
      toast.error("Error fetching bids: " + err.message);
    }
  };

  useEffect(() => {
    fetchBids();
  }, [refreshKey]);

  // Listen for bid acceptance and counter offer events
  useEffect(() => {
    if (!socket) return;

    const handleBidAccepted = (data) => {
      // Show notification
      toast.success(data.message, {
        position: "top-right",
        autoClose: 5000,
      });

      // Refresh bids list to update the status of the accepted bid
      fetchBids();
    };

    const handleCounterOfferReceived = (data) => {
      // Show notification
      toast.info(`You have received a counter offer from ${data.clientName}`, {
        position: "top-right",
        autoClose: 10000,
        onClick: () => {
          // Navigate to the project details page
          window.location.href = `/freelancer/projects/${data.projectId}`;
        },
      });

      // Refresh bids list to update the status of the countered bid
      fetchBids();
    };

    const handleCounterOfferBroadcast = (data) => {
      // Only process if this broadcast is for the current user
      if (data.freelancerId === user._id) {
        console.log("Counter offer broadcast received for current user");

        // Show notification
        toast.info(`You have received a counter offer for a project`, {
          position: "top-right",
          autoClose: 10000,
          onClick: () => {
            // Navigate to the project details page
            window.location.href = `/freelancer/projects/${data.projectId}`;
          },
        });

        // Refresh bids list
        fetchBids();
      }
    };

    socket.on("yourBidAccepted", handleBidAccepted);
    socket.on("counterOfferReceived", handleCounterOfferReceived);
    socket.on("counterOfferBroadcast", handleCounterOfferBroadcast);
    socket.on("counterOfferUpdate", () => fetchBids());

    return () => {
      socket.off("yourBidAccepted", handleBidAccepted);
      socket.off("counterOfferReceived", handleCounterOfferReceived);
      socket.off("counterOfferBroadcast", handleCounterOfferBroadcast);
      socket.off("counterOfferUpdate");
    };
  }, [socket, user._id]);

  const handleRefresh = () => {
    toast.info("Refreshing bids...");
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const getBidStatusClass = (status) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Countered":
        return "bg-orange-100 text-orange-800";
      case "Withdrawn":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Debug function to log bid data
  const logBidData = (bid) => {
    console.log("Bid data:", {
      id: bid._id,
      project: bid.project?.title,
      amount: bid.amount,
      status: bid.status,
      counterOffer: bid.counterOffer,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Bids</h1>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2 text-gray-500" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : bids.length > 0 ? (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Project
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Bid Amount
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Delivery Time
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bids.map((bid) => {
                  // Log bid data for debugging
                  logBidData(bid);

                  return (
                    <tr key={bid._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {bid.project?.title || "Unknown Project"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {bid.project?.category || "No category"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-1" />
                          {formatCurrency(bid.amount)}
                        </div>
                        {bid.counterOffer && bid.counterOffer.amount && (
                          <div className="flex items-center text-xs text-orange-600 mt-1">
                            <span className="font-medium">
                              Counter: {formatCurrency(bid.counterOffer.amount)}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <ClockIcon className="h-5 w-5 text-gray-400 mr-1" />
                          {bid.deliveryTime} days
                        </div>
                        {bid.counterOffer && bid.counterOffer.deliveryTime && (
                          <div className="flex items-center text-xs text-orange-600 mt-1">
                            <span className="font-medium">
                              Counter: {bid.counterOffer.deliveryTime} days
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBidStatusClass(
                            bid.status
                          )}`}
                        >
                          {bid.status}
                        </span>
                        {bid.status === "Countered" && (
                          <div className="text-xs text-orange-600 mt-1">
                            New offer!
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(bid.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={
                            bid.status === "Countered"
                              ? `/freelancer/projects/${bid.project?._id}?showCounterOffer=true`
                              : `/freelancer/projects/${bid.project?._id}`
                          }
                          className="text-primary-600 hover:text-primary-900"
                        >
                          {bid.status === "Countered" ? (
                            <span className="font-bold">
                              View Counter Offer
                            </span>
                          ) : (
                            "View Project"
                          )}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg p-6 text-center">
          <p className="text-gray-500 mb-4">
            You haven't submitted any bids yet.
          </p>
          <Link
            to="/freelancer/find-projects"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Find Projects
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyBids;
