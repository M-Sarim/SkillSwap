import { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import ThemeContext from "../../context/ThemeContext";
import {
  Bars3Icon,
  XMarkIcon,
  MoonIcon,
  SunIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  UsersIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import NotificationBell from "./NotificationBell";
import useApi from "../../hooks/useApi";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const themeContext = useContext(ThemeContext);
  const { get } = useApi();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState("Dashboard");
  const [navLinks, setNavLinks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Default to light theme if ThemeContext is not available
  const theme = themeContext?.theme || "light";
  const toggleTheme = themeContext?.toggleTheme || (() => {});
  const isDarkMode = theme === "dark";

  // Check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Get color for active link
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

  // Update page title based on current route and generate navigation links
  useEffect(() => {
    const path = location.pathname;

    if (path.includes("/analytics")) {
      setPageTitle("Analytics");
    } else if (path.includes("/users")) {
      setPageTitle("Manage Users");
    } else if (path.includes("/verify-freelancers")) {
      setPageTitle("Verify Freelancers");
    } else if (path.includes("/finances")) {
      setPageTitle("Finances");
    } else if (path.includes("/settings")) {
      setPageTitle("Settings");
    } else if (path.includes("/profile")) {
      setPageTitle("Profile");
    } else if (
      path.endsWith("/admin") ||
      path.endsWith("/client") ||
      path.endsWith("/freelancer")
    ) {
      setPageTitle("Dashboard");
    }

    // Generate navigation links based on user role
    if (user && user.role) {
      let links = [];

      switch (user.role) {
        case "admin":
          links = [
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
          ];
          break;

        case "client":
          links = [
            {
              name: "Dashboard",
              path: "/client",
              icon: HomeIcon,
              color: "blue",
            },
            // Add other client links as needed
          ];
          break;

        case "freelancer":
          links = [
            {
              name: "Dashboard",
              path: "/freelancer",
              icon: HomeIcon,
              color: "blue",
            },
            // Add other freelancer links as needed
          ];
          break;

        default:
          links = [];
      }

      setNavLinks(links);
    }
  }, [location, user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === "") {
      setShowSearchResults(false);
      return;
    }

    // Debounce search to avoid too many requests
    setIsSearching(true);
    const timer = setTimeout(() => {
      performSearch(value);
    }, 300);

    return () => clearTimeout(timer);
  };

  // Perform search across the platform
  const performSearch = async (query) => {
    try {
      if (!user || !user.role) return;

      const response = await get(`/search?q=${encodeURIComponent(query)}`);

      if (response.success) {
        setSearchResults(response.data || []);
      } else {
        // If API fails, perform client-side search (simplified example)
        const mockResults = [];

        // Add mock results based on user role
        if (user.role === "admin") {
          mockResults.push(
            { type: "user", id: "1", name: "Ahmed Khan", role: "client" },
            { type: "user", id: "2", name: "Fatima Ali", role: "freelancer" },
            {
              type: "project",
              id: "1",
              title: "E-commerce Website Development",
              status: "Open",
            },
            {
              type: "project",
              id: "2",
              title: "Mobile App UI Design",
              status: "In Progress",
            }
          );
        } else if (user.role === "client") {
          mockResults.push(
            {
              type: "freelancer",
              id: "1",
              name: "Fatima Ali",
              skills: ["UI/UX Design", "Web Development"],
            },
            {
              type: "project",
              id: "1",
              title: "E-commerce Website Development",
              status: "Open",
            }
          );
        } else if (user.role === "freelancer") {
          mockResults.push(
            {
              type: "project",
              id: "1",
              title: "E-commerce Website Development",
              status: "Open",
            },
            {
              type: "project",
              id: "2",
              title: "Mobile App UI Design",
              status: "In Progress",
            }
          );
        }

        // Filter mock results based on search term
        const filteredResults = mockResults.filter((item) => {
          if (item.type === "user" || item.type === "freelancer") {
            return item.name.toLowerCase().includes(query.toLowerCase());
          } else if (item.type === "project") {
            return item.title.toLowerCase().includes(query.toLowerCase());
          }
          return false;
        });

        setSearchResults(filteredResults);
      }

      setShowSearchResults(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search result click
  const handleResultClick = (result) => {
    setShowSearchResults(false);
    setSearchTerm("");

    // Navigate based on result type
    if (result.type === "user") {
      navigate(`/admin/users?id=${result.id}`);
    } else if (result.type === "freelancer") {
      navigate(`/client/freelancers?id=${result.id}`);
    } else if (result.type === "project") {
      if (user.role === "admin") {
        navigate(`/admin/projects?id=${result.id}`);
      } else if (user.role === "client") {
        navigate(`/client/projects?id=${result.id}`);
      } else if (user.role === "freelancer") {
        navigate(`/freelancer/projects?id=${result.id}`);
      }
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".search-container")) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-800 backdrop-blur-md bg-white/90 dark:bg-gray-800/90 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link
                to={isAuthenticated ? `/${user?.role}` : "/"}
                className="flex items-center group"
              >
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                  SS
                </span>
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 ml-1 mt-1 group-hover:animate-pulse"></div>
              </Link>
            </div>

            {isAuthenticated && (
              <div className="hidden md:flex md:items-center md:ml-6">
                <div className="h-8 w-[1px] bg-gray-200 mx-4"></div>
                <h1 className="text-lg font-semibold text-gray-800">
                  {pageTitle}
                </h1>
              </div>
            )}

            {/* Navigation links moved to sidebar for authenticated users */}
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              {!isAuthenticated && (
                <>
                  <Link
                    to="/"
                    className="text-gray-600 hover:text-primary-600 transition-colors duration-150 inline-flex items-center px-1 py-1 text-sm font-medium border-b-2 border-transparent hover:border-primary-500"
                  >
                    Home
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Search bar - only visible for authenticated users */}
          {isAuthenticated && (
            <div className="hidden md:flex md:items-center md:flex-1 md:max-w-md md:mx-4">
              <div className="w-full relative search-container">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() =>
                    searchTerm.trim() !== "" && setShowSearchResults(true)
                  }
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
                />

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500 mr-2"></div>
                        <span className="text-gray-500">Searching...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div>
                        <div className="p-3 border-b border-gray-100">
                          <p className="text-xs font-medium text-gray-500">
                            {searchResults.length} results found for "
                            {searchTerm}"
                          </p>
                        </div>
                        <ul className="py-2">
                          {searchResults.map((result, index) => (
                            <li key={`${result.type}-${result.id || index}`}>
                              <button
                                onClick={() => handleResultClick(result)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
                              >
                                <span className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                                  {result.type === "user" ||
                                  result.type === "freelancer" ? (
                                    <UsersIcon className="h-4 w-4 text-gray-500" />
                                  ) : result.type === "project" ? (
                                    <BriefcaseIcon className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
                                  )}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {result.type === "user" ||
                                    result.type === "freelancer"
                                      ? result.name
                                      : result.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {result.type === "user"
                                      ? `User • ${result.role}`
                                      : result.type === "freelancer"
                                      ? `Freelancer${
                                          result.skills
                                            ? ` • ${result.skills.join(", ")}`
                                            : ""
                                        }`
                                      : `Project • ${result.status}`}
                                  </p>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-gray-500">
                          No results found for "{searchTerm}"
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Try a different search term
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <>
                {/* Dark mode toggle */}
                <button
                  onClick={handleThemeToggle}
                  className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                  aria-label={
                    isDarkMode ? "Switch to light mode" : "Switch to dark mode"
                  }
                >
                  {isDarkMode ? (
                    <SunIcon className="h-5 w-5" />
                  ) : (
                    <MoonIcon className="h-5 w-5" />
                  )}
                </button>

                {/* Notification bell */}
                <div className="ml-3">
                  <NotificationBell />
                </div>

                {/* Divider */}
                <div className="h-6 w-[1px] bg-gray-200 mx-4"></div>

                {/* User profile */}
                <div className="relative">
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {user?.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {user?.role}
                      </span>
                    </div>

                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-800 dark:to-purple-900 flex items-center justify-center text-primary-600 dark:text-primary-300 font-semibold shadow-sm border border-white dark:border-gray-700 overflow-hidden">
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user?.name || "User"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{user?.name?.charAt(0) || "U"}</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 transition-colors duration-200 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-150 text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-150 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden bg-white shadow-lg rounded-b-xl border border-gray-100 border-t-0 mx-2">
          {/* Search bar for mobile */}
          {isAuthenticated && (
            <div className="px-4 pt-4 pb-2">
              <div className="relative search-container">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() =>
                    searchTerm.trim() !== "" && setShowSearchResults(true)
                  }
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
                />

                {/* Mobile Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500 mr-2"></div>
                        <span className="text-gray-500">Searching...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div>
                        <div className="p-3 border-b border-gray-100">
                          <p className="text-xs font-medium text-gray-500">
                            {searchResults.length} results found for "
                            {searchTerm}"
                          </p>
                        </div>
                        <ul className="py-2">
                          {searchResults.map((result, index) => (
                            <li
                              key={`mobile-${result.type}-${
                                result.id || index
                              }`}
                            >
                              <button
                                onClick={() => {
                                  handleResultClick(result);
                                  setIsMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
                              >
                                <span className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                                  {result.type === "user" ||
                                  result.type === "freelancer" ? (
                                    <UsersIcon className="h-4 w-4 text-gray-500" />
                                  ) : result.type === "project" ? (
                                    <BriefcaseIcon className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
                                  )}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {result.type === "user" ||
                                    result.type === "freelancer"
                                      ? result.name
                                      : result.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {result.type === "user"
                                      ? `User • ${result.role}`
                                      : result.type === "freelancer"
                                      ? `Freelancer${
                                          result.skills
                                            ? ` • ${result.skills.join(", ")}`
                                            : ""
                                        }`
                                      : `Project • ${result.status}`}
                                  </p>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-gray-500">
                          No results found for "{searchTerm}"
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Try a different search term
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation links moved to sidebar for authenticated users */}
          {!isAuthenticated && (
            <div className="pt-2 pb-3 space-y-1 px-4">
              <Link
                to="/"
                className="block py-2 text-base font-medium text-gray-600 hover:text-primary-600 transition-colors duration-200"
              >
                Home
              </Link>
            </div>
          )}

          {isAuthenticated ? (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-800 dark:to-purple-900 flex items-center justify-center text-primary-600 dark:text-primary-300 font-semibold shadow-sm border border-white dark:border-gray-700 overflow-hidden">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user?.name || "User"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{user?.name?.charAt(0) || "U"}</span>
                    )}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                    {user?.name}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role}
                  </div>
                </div>
                <div className="ml-auto flex-shrink-0">
                  <NotificationBell />
                </div>
              </div>

              {/* Mobile menu links */}
              <div className="mt-3 space-y-1 px-4">
                {navLinks &&
                  navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                        isActive(link.path)
                          ? `bg-gradient-to-r ${getActiveColor(
                              link.color
                            )} text-white`
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span
                        className={`flex items-center justify-center w-7 h-7 rounded-lg ${
                          isActive(link.path)
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        <link.icon className="w-4 h-4" />
                      </span>
                      <span className="ml-3 text-sm font-medium">
                        {link.name}
                      </span>
                    </Link>
                  ))}

                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center w-full py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  >
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    </span>
                    <span className="ml-3">Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-5 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-3 px-4">
                <Link
                  to="/login"
                  className="block text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 py-2 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block text-base font-medium text-white bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 transition-all duration-150 px-4 py-2.5 rounded-xl shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
