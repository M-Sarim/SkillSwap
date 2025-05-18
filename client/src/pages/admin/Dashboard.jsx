import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  UsersIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BellIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import AuthContext from "../../context/AuthContext";
import useApi from "../../hooks/useApi";
import { formatCurrency, formatDate } from "../../utils/helpers";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { get, put, loading } = useApi();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalRevenue: 0,
    verifiedFreelancers: 0,
    pendingVerifications: 0,
    newUsers: {
      count: 0,
      change: 0,
    },
    newProjects: {
      count: 0,
      change: 0,
    },
    revenue: {
      amount: 0,
      change: 0,
    },
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log("Fetching admin dashboard data...");

        // Fetch admin stats
        const statsResponse = await get("/admin/stats");
        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        }

        // Fetch recent users - ensure we're getting real data
        console.log("Fetching real user data for dashboard...");
        const usersResponse = await get("/admin/recent-users");
        console.log("Recent users response:", usersResponse);

        if (usersResponse.success && usersResponse.data?.users) {
          console.log("Setting users from database:", usersResponse.data.users);
          setRecentUsers(usersResponse.data.users);
        }

        // Fetch recent projects
        const projectsResponse = await get("/admin/recent-projects");
        if (projectsResponse.success && projectsResponse.data?.projects) {
          setRecentProjects(projectsResponse.data.projects);
        }

        // Fetch notifications
        const notificationsResponse = await get("/admin/notifications");
        if (
          notificationsResponse.success &&
          notificationsResponse.data?.notifications
        ) {
          setNotifications(notificationsResponse.data.notifications);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        toast.error("Failed to fetch dashboard data. Please try again later.");
      }
    };

    fetchDashboardData();
  }, [get]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "verification":
        return <ShieldCheckIcon className="h-5 w-5 text-blue-500" />;
      case "user":
        return <UsersIcon className="h-5 w-5 text-green-500" />;
      case "dispute":
        return <BellIcon className="h-5 w-5 text-red-500" />;
      case "payment":
        return <CurrencyDollarIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <EnvelopeIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await put("/notify/read-all");
      if (response.success) {
        // Update local state to mark all notifications as read
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, read: true }))
        );
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark notifications as read");
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-primary-100">
              Monitor and manage your platform's performance
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            {/* User Profile */}
            <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center mr-3">
                <span className="text-primary-600 font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                </span>
              </div>
              <span className="font-medium">Welcome, {user?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500 text-white mr-4">
              <UsersIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalUsers ? stats.totalUsers.toLocaleString() : "0"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <div className="flex items-center text-blue-500">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              <span className="font-medium">
                {stats.newUsers?.count || 0} new
              </span>
              <span className="text-gray-500 ml-2">this month</span>
            </div>
          </div>
        </div>

        {/* Total Projects Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500 text-white mr-4">
              <BriefcaseIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Projects
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalProjects
                  ? stats.totalProjects.toLocaleString()
                  : "0"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <div className="flex items-center text-green-500">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              <span className="font-medium">
                {stats.newProjects?.count || 0} new
              </span>
              <span className="text-gray-500 ml-2">this month</span>
            </div>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500 text-white mr-4">
              <CurrencyDollarIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Revenue{" "}
                <span className="text-xs text-gray-400">
                  (from completed projects)
                </span>
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.revenue?.amount || stats.totalRevenue) ||
                  "$0.00"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <div className="flex items-center">
              {stats.revenue?.change > 0 ? (
                <>
                  <ArrowUpIcon className="h-4 w-4 mr-1 text-green-500" />
                  <span className="font-medium text-green-500">
                    {stats.revenue.change}%
                  </span>
                </>
              ) : stats.revenue?.change < 0 ? (
                <>
                  <ArrowDownIcon className="h-4 w-4 mr-1 text-red-500" />
                  <span className="font-medium text-red-500">
                    {Math.abs(stats.revenue.change)}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowUpIcon className="h-4 w-4 mr-1 text-purple-500" />
                  <span className="font-medium text-purple-500">0%</span>
                </>
              )}
              <span className="text-gray-500 ml-2">from last period</span>
            </div>
          </div>
        </div>

        {/* Verified Freelancers Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-500 text-white mr-4">
              <ShieldCheckIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Verified Freelancers
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.verifiedFreelancers
                  ? stats.verifiedFreelancers.toLocaleString()
                  : "0"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <div className="flex items-center text-amber-500">
              <span className="font-medium">
                {stats.pendingVerifications || 0} pending
              </span>
              <span className="text-gray-500 ml-2">verifications</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden lg:col-span-1 border border-gray-100">
          <div className="px-6 py-5 bg-gradient-to-r from-blue-500 to-blue-600 border-b border-blue-400">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <UsersIcon className="h-5 w-5 mr-2" />
                Recent Users
              </h3>
              <span className="bg-blue-400/30 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                {recentUsers.length} users
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : recentUsers.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {recentUsers.map((user) => (
                <li
                  key={user._id}
                  className="px-6 py-4 hover:bg-blue-50 transition-colors duration-150"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          className="h-12 w-12 rounded-full object-cover border-2 border-blue-100"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-lg">
                            {user.name && user.name.charAt(0)
                              ? user.name.charAt(0).toUpperCase()
                              : "U"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <div className="text-sm font-semibold text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {formatDate(user.createdAt)}
                        </div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <div className="text-sm text-gray-500 truncate max-w-[150px]">
                          {user.email}
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : user.role === "freelancer"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-green-100 text-green-800 border border-green-200"
                          }`}
                        >
                          {user.role && typeof user.role === "string"
                            ? user.role.charAt(0).toUpperCase() +
                              user.role.slice(1)
                            : "User"}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <UsersIcon className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-gray-500 font-medium">No recent users found</p>
              <p className="text-gray-400 text-sm mt-1">
                New users will appear here
              </p>
            </div>
          )}
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden lg:col-span-1 border border-gray-100">
          <div className="px-6 py-5 bg-gradient-to-r from-green-500 to-green-600 border-b border-green-400">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <BriefcaseIcon className="h-5 w-5 mr-2" />
                Recent Projects
              </h3>
              <span className="bg-green-400/30 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                {recentProjects.length} projects
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : recentProjects.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {recentProjects.map((project) => (
                <li
                  key={project._id}
                  className="px-6 py-4 hover:bg-green-50 transition-colors duration-150"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {project.client?.profileImage ? (
                        <img
                          src={project.client.profileImage}
                          alt={project.client?.name || "Client"}
                          className="h-12 w-12 rounded-full object-cover border-2 border-green-100"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-lg">
                            {project.client?.name &&
                            project.client.name.charAt(0)
                              ? project.client.name.charAt(0).toUpperCase()
                              : "C"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <div className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
                          {project.title}
                        </div>
                        <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {formatDate(project.createdAt)}
                        </div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <div className="text-sm text-gray-500 truncate max-w-[120px]">
                          By {project.client?.name || "Unknown Client"}
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 mr-2 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                            {formatCurrency(project.budget)}
                          </span>
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              project.status === "Open"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : project.status === "In Progress"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-green-100 text-green-800 border border-green-200"
                            }`}
                          >
                            {project.status || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <BriefcaseIcon className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-gray-500 font-medium">
                No recent projects found
              </p>
              <p className="text-gray-400 text-sm mt-1">
                New projects will appear here
              </p>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden lg:col-span-1 border border-gray-100">
          <div className="px-6 py-5 bg-gradient-to-r from-purple-500 to-purple-600 border-b border-purple-400">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <BellIcon className="h-5 w-5 mr-2" />
                Notifications
              </h3>
              <button
                type="button"
                className="text-sm font-medium text-white bg-purple-400/30 hover:bg-purple-400/50 px-3 py-1 rounded-full transition-colors duration-150"
                onClick={markAllAsRead}
              >
                Mark All as Read
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : notifications.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <li
                  key={notification._id}
                  className={`px-6 py-4 hover:bg-purple-50 transition-colors duration-150 ${
                    notification.read ? "" : "bg-purple-50"
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1 p-2 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 shadow-sm">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <div className="text-sm font-semibold text-gray-900 flex items-center">
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-purple-600 animate-pulse"></span>
                          )}
                        </div>
                        <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-gray-600 bg-white p-2 rounded-md border border-gray-100 shadow-sm">
                        {notification.message}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <BellIcon className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-gray-500 font-medium">
                No notifications found
              </p>
              <p className="text-gray-400 text-sm mt-1">
                You're all caught up!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="p-2 bg-primary-100 rounded-lg text-primary-600 mr-3">
            <ArrowPathIcon className="h-5 w-5" />
          </span>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/verify-freelancers"
            className="flex items-center px-6 py-4 rounded-xl shadow-sm text-white bg-primary-500 hover:bg-primary-600 transition-all duration-200"
          >
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <ShieldCheckIcon className="h-6 w-6" />
            </div>
            <div>
              <span className="font-semibold block">Verify Freelancers</span>
              <span className="text-xs text-primary-100">
                {stats.pendingVerifications || 0} pending
              </span>
            </div>
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center px-6 py-4 rounded-xl shadow-sm text-white bg-purple-500 hover:bg-purple-600 transition-all duration-200"
          >
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <UsersIcon className="h-6 w-6" />
            </div>
            <div>
              <span className="font-semibold block">Manage Users</span>
              <span className="text-xs text-purple-100">
                {stats.totalUsers || 0} total users
              </span>
            </div>
          </Link>
          <Link
            to="/admin/analytics"
            className="flex items-center px-6 py-4 rounded-xl shadow-sm text-white bg-green-500 hover:bg-green-600 transition-all duration-200"
          >
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <ChartBarIcon className="h-6 w-6" />
            </div>
            <div>
              <span className="font-semibold block">View Analytics</span>
              <span className="text-xs text-green-100">
                Performance insights
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
