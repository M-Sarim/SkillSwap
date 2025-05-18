import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import {
  HomeIcon,
  BriefcaseIcon,
  UserIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getNavLinks = () => {
    if (!user) return [];

    switch (user.role) {
      case "client":
        return [
          {
            name: "Dashboard",
            path: "/client",
            icon: HomeIcon,
            color: "blue",
          },
          {
            name: "Post Project",
            path: "/client/post-project",
            icon: DocumentTextIcon,
            color: "green",
          },
          {
            name: "My Projects",
            path: "/client/projects",
            icon: BriefcaseIcon,
            color: "indigo",
          },
          {
            name: "Messages",
            path: "/client/messages",
            icon: ChatBubbleLeftRightIcon,
            color: "purple",
          },
          {
            name: "Analytics",
            path: "/client/analytics",
            icon: ChartBarIcon,
            color: "amber",
          },
          {
            name: "Profile",
            path: "/client/profile",
            icon: UserIcon,
            color: "rose",
          },
        ];
      case "freelancer":
        return [
          {
            name: "Dashboard",
            path: "/freelancer",
            icon: HomeIcon,
            color: "blue",
          },
          {
            name: "Find Projects",
            path: "/freelancer/find-projects",
            icon: BriefcaseIcon,
            color: "green",
          },
          {
            name: "My Projects",
            path: "/freelancer/projects",
            icon: DocumentTextIcon,
            color: "indigo",
          },
          {
            name: "My Bids",
            path: "/freelancer/bids",
            icon: DocumentTextIcon,
            color: "purple",
          },
          {
            name: "Messages",
            path: "/freelancer/messages",
            icon: ChatBubbleLeftRightIcon,
            color: "amber",
          },
          {
            name: "Analytics",
            path: "/freelancer/analytics",
            icon: ChartBarIcon,
            color: "rose",
          },
          {
            name: "Profile",
            path: "/freelancer/profile",
            icon: UserIcon,
            color: "teal",
          },
        ];
      case "admin":
        return [
          {
            name: "Dashboard",
            path: "/admin",
            icon: HomeIcon,
            color: "blue",
          },
          {
            name: "Manage Users",
            path: "/admin/users",
            icon: UsersIcon,
            color: "purple",
          },
          {
            name: "Verify Freelancers",
            path: "/admin/verify-freelancers",
            icon: ShieldCheckIcon,
            color: "amber",
          },
          {
            name: "Analytics",
            path: "/admin/analytics",
            icon: ChartBarIcon,
            color: "green",
          },
          {
            name: "Finances",
            path: "/admin/finances",
            icon: CurrencyDollarIcon,
            color: "indigo",
          },
          {
            name: "Settings",
            path: "/admin/settings",
            icon: Cog6ToothIcon,
            color: "rose",
          },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  // Get the color for the active link
  const getActiveColor = (color) => {
    const colorMap = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      purple: "from-purple-500 to-purple-600",
      amber: "from-amber-500 to-amber-600",
      indigo: "from-indigo-500 to-indigo-600",
      rose: "from-rose-500 to-rose-600",
      teal: "from-teal-500 to-teal-600",
    };

    return colorMap[color] || "from-primary-500 to-primary-600";
  };

  return (
    <aside className="w-72 bg-white dark:bg-gray-800 shadow-lg hidden md:block rounded-xl mx-3 my-3 border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      {/* Sidebar Header */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-4">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-semibold shadow-sm">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user?.name || "User"}
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              <span>{user?.name?.charAt(0) || "U"}</span>
            )}
          </div>
          <div className="ml-3">
            <p className="text-xs text-primary-100 mb-0.5">Welcome,</p>
            <p className="text-sm font-medium text-white">
              {user?.name || "User"}
            </p>
          </div>
        </div>
      </div>

      <div className="h-full px-4 py-6 overflow-y-auto">
        <div className="mb-6">
          <p className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wider mb-2">
            Main Menu
          </p>
          <ul className="space-y-1.5 font-medium">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`flex items-center p-3 rounded-xl transition-all duration-200 group ${
                    isActive(link.path)
                      ? `bg-gradient-to-r ${getActiveColor(
                          link.color
                        )} text-white shadow-md`
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                      isActive(link.path)
                        ? "bg-white/20 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                    } transition-all duration-200`}
                  >
                    <link.icon className="w-5 h-5" />
                  </span>
                  <span
                    className={`ml-3 text-sm font-medium ${
                      isActive(link.path) ? "text-white" : ""
                    }`}
                  >
                    {link.name}
                  </span>

                  {isActive(link.path) && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wider mb-2">
            Account
          </p>
          <ul className="space-y-1.5 font-medium">
            {user?.role !== "admin" && (
              <li>
                <Link
                  to={`/${user?.role}/profile`}
                  className={`flex items-center p-3 rounded-xl transition-all duration-200 group ${
                    isActive(`/${user?.role}/profile`)
                      ? `bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md`
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                      isActive(`/${user?.role}/profile`)
                        ? "bg-white/20 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                    } transition-all duration-200`}
                  >
                    <UserIcon className="w-5 h-5" />
                  </span>
                  <span
                    className={`ml-3 text-sm font-medium ${
                      isActive(`/${user?.role}/profile`) ? "text-white" : ""
                    }`}
                  >
                    Profile
                  </span>
                </Link>
              </li>
            )}
            <li>
              <button
                onClick={logout}
                className="w-full flex items-center p-3 rounded-xl transition-all duration-200 group text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-all duration-200">
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </span>
                <span className="ml-3 text-sm font-medium">Logout</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="mt-8 pt-6">
          <div className="p-4 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl shadow-sm border border-white dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                Platform Status
              </p>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              All systems operational
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
