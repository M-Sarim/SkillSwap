import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseIcon,
  ClockIcon,
  CurrencyDollarIcon,
  StarIcon,
  ArrowPathIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import AuthContext from "../../context/AuthContext";
import SocketContext from "../../context/SocketContext";
import useApi from "../../hooks/useApi";
import { formatCurrency, formatDate } from "../../utils/helpers";
import ProjectCard from "../../components/common/ProjectCard";
import { toast } from "react-toastify";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const { get, loading, error } = useApi();
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedProjects: 0,
    totalEarnings: 0,
    averageRating: 0,
  });
  const [projects, setProjects] = useState([]);
  const [recentBids, setRecentBids] = useState([]);

  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDashboardData = async () => {
    try {
      // Fetch freelancer stats
      try {
        console.log("Fetching freelancer stats...");
        const statsResponse = await get("/projects/freelancer/stats");
        if (statsResponse.success) {
          console.log("Fetched stats:", statsResponse.data);
          setStats(statsResponse.data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Use default stats
        setStats({
          activeProjects: 0,
          completedProjects: 0,
          totalEarnings: 0,
          averageRating: 0,
        });
      }

      // Fetch active projects
      try {
        console.log("Fetching active projects for dashboard...");
        const projectsResponse = await get("/projects/freelancer/projects", {
          status: "In Progress",
        });
        if (projectsResponse.success) {
          console.log(
            "Fetched projects for dashboard:",
            projectsResponse.data.projects
          );
          setProjects(projectsResponse.data.projects.slice(0, 3)); // Get only the first 3 projects
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      }

      // Fetch recent bids - using the same pattern as FindProjects
      try {
        console.log("Fetching bids from server...");
        const bidsResponse = await get("/projects/bids/freelancer");
        console.log("Bids response:", bidsResponse);

        if (bidsResponse.success) {
          // Check if the response has the expected structure
          if (bidsResponse.data && bidsResponse.data.bids) {
            console.log(
              "Setting bids from response.data.bids:",
              bidsResponse.data.bids
            );

            // Filter out bids with null project references
            const validBids = bidsResponse.data.bids.filter(
              (bid) => bid && bid.project
            );
            console.log("Filtered valid bids:", validBids.length);

            setRecentBids(validBids.slice(0, 5)); // Get only the first 5 bids
          } else if (Array.isArray(bidsResponse.data)) {
            console.log(
              "Setting bids from response.data array:",
              bidsResponse.data
            );

            // Filter out bids with null project references
            const validBids = bidsResponse.data.filter(
              (bid) => bid && bid.project
            );
            console.log("Filtered valid bids from array:", validBids.length);

            setRecentBids(validBids.slice(0, 5)); // Get only the first 5 bids
          } else {
            console.log(
              "Response has unexpected structure:",
              bidsResponse.data
            );
          }
        } else {
          console.log("Failed to fetch bids from server");

          // Try alternative endpoint as fallback
          try {
            console.log("Trying alternative endpoint: /bids/freelancer");
            const altResponse = await get("/bids/freelancer");
            console.log("Alternative endpoint response:", altResponse);

            if (altResponse.success) {
              if (altResponse.data && altResponse.data.bids) {
                console.log(
                  "Setting bids from alternative endpoint:",
                  altResponse.data.bids
                );

                // Filter out bids with null project references
                const validBids = altResponse.data.bids.filter(
                  (bid) => bid && bid.project
                );
                console.log(
                  "Filtered valid bids from alternative endpoint:",
                  validBids.length
                );

                setRecentBids(validBids.slice(0, 5));
              } else if (Array.isArray(altResponse.data)) {
                console.log(
                  "Setting bids from alternative endpoint array:",
                  altResponse.data
                );

                // Filter out bids with null project references
                const validBids = altResponse.data.filter(
                  (bid) => bid && bid.project
                );
                console.log(
                  "Filtered valid bids from alternative endpoint array:",
                  validBids.length
                );

                setRecentBids(validBids.slice(0, 5));
              }
            }
          } catch (altErr) {
            console.error("Error fetching from alternative endpoint:", altErr);
          }
        }
      } catch (error) {
        console.error("Error fetching bids:", error);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  // Function to handle refresh button click
  const handleRefresh = () => {
    console.log("Refreshing dashboard data...");
    setRefreshKey((prevKey) => prevKey + 1);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [get, refreshKey]);

  // Listen for bid acceptance and counter offer events
  useEffect(() => {
    if (!socket) return;

    const handleBidAccepted = (data) => {
      // Show notification
      toast.success(data.message, {
        position: "top-right",
        autoClose: 5000,
      });

      // Refresh dashboard data to show the newly assigned project
      console.log("Bid accepted, refreshing dashboard data...");
      fetchDashboardData();
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

      // Refresh dashboard data to show the updated bid status
      console.log("Counter offer received, refreshing dashboard data...");
      fetchDashboardData();
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

        // Refresh dashboard data to show the updated bid status
        console.log(
          "Counter offer broadcast received, refreshing dashboard data..."
        );
        fetchDashboardData();
      }
    };

    socket.on("yourBidAccepted", handleBidAccepted);
    socket.on("counterOfferReceived", handleCounterOfferReceived);
    socket.on("counterOfferBroadcast", handleCounterOfferBroadcast);
    socket.on("counterOfferUpdate", () => fetchDashboardData());

    return () => {
      socket.off("yourBidAccepted", handleBidAccepted);
      socket.off("counterOfferReceived", handleCounterOfferReceived);
      socket.off("counterOfferBroadcast", handleCounterOfferBroadcast);
      socket.off("counterOfferUpdate");
    };
  }, [socket, user._id, fetchDashboardData]);

  // Generate star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarIcon key={i} className="h-5 w-5 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarIcon className="h-5 w-5 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <StarIcon className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<StarIcon key={i} className="h-5 w-5 text-gray-300" />);
      }
    }

    return stars;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link to="/freelancer/find-projects" className="btn btn-primary">
          Find Projects
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <BriefcaseIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Projects
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.activeProjects}
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Projects you're currently working on
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <ClockIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Completed Projects
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.completedProjects}
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Projects you've successfully completed
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <CurrencyDollarIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Earnings
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.totalEarnings)}
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Total amount earned from all projects
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <StarIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Average Rating
              </p>
              <div className="flex items-center mt-1">
                <div className="flex">{renderStars(stats.averageRating)}</div>
                <span className="ml-1 text-lg font-semibold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/freelancer/find-projects"
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <BriefcaseIcon className="h-5 w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700">Find New Projects</span>
          </Link>

          <Link
            to="/freelancer/profile"
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <StarIcon className="h-5 w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700">Update Profile</span>
          </Link>

          <Link
            to="/freelancer/messages"
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <CurrencyDollarIcon className="h-5 w-5 text-primary-600 mr-2" />
            <span className="font-medium text-gray-700">Check Messages</span>
          </Link>
        </div>
      </div>

      {/* Active Projects */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Active Projects
          </h2>
          <Link
            to="/freelancer/projects"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            View All Projects
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                linkTo={`/freelancer/projects/${project._id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No active projects found</p>
            <Link
              to="/freelancer/find-projects"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Find Projects
            </Link>
          </div>
        )}
      </div>

      {/* Recent Bids */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-900 mr-2">
              Recent Bids
            </h2>
            <button
              onClick={handleRefresh}
              className="p-1 rounded-full hover:bg-gray-100"
              title="Refresh bids"
            >
              <ArrowPathIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <Link
            to="/freelancer/bids"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            View All Bids
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : recentBids.length > 0 ? (
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
                    Amount
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
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentBids.map((bid) => (
                  <tr key={bid._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {bid.project?.title || "Unknown Project"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {bid.project?.category || "No category"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(bid.amount)}
                      </div>
                      {bid.counterOffer && bid.counterOffer.amount && (
                        <div className="text-xs text-orange-600 mt-1">
                          <span className="font-medium">
                            Counter: {formatCurrency(bid.counterOffer.amount)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          bid.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : bid.status === "Accepted"
                            ? "bg-green-100 text-green-800"
                            : bid.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : bid.status === "Countered"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {bid.status}
                      </span>
                      {bid.counterOffer && (
                        <div className="text-xs text-orange-600 mt-1">
                          New offer!
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(bid.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {bid.project?._id ? (
                        <Link
                          to={
                            bid.status === "Countered" || bid.counterOffer
                              ? `/freelancer/projects/${bid.project._id}?showCounterOffer=true`
                              : `/freelancer/projects/${bid.project._id}`
                          }
                          className="text-primary-600 hover:text-primary-900"
                        >
                          {bid.status === "Countered" || bid.counterOffer ? (
                            <span className="font-bold">
                              View Counter Offer
                            </span>
                          ) : (
                            "View"
                          )}
                        </Link>
                      ) : (
                        <span className="text-gray-400">Not available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No bids submitted yet</p>
            <Link
              to="/freelancer/find-projects"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Find Projects to Bid
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
