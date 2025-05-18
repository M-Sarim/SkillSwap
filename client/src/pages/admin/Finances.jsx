import { useState, useEffect } from "react";
import {
  CurrencyDollarIcon,
  ArrowPathIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BanknotesIcon,
  ArrowUturnLeftIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import useApi from "../../hooks/useApi";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { toast } from "react-toastify";

const Finances = () => {
  const { get, loading } = useApi();
  const [period, setPeriod] = useState("all");
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalWithdrawals: 0,
    totalRefunds: 0,
    totalFees: 0,
    netProfit: 0,
    transactionsByType: [],
  });
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    startDate: "",
    endDate: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  // Initial empty state for financial data

  // Fetch financial summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await get("/admin/finances/summary", { period });
        if (response.success && response.data) {
          // Ensure all required properties exist with default values if missing
          setSummary({
            totalRevenue: response.data.totalRevenue || 0,
            totalWithdrawals: response.data.totalWithdrawals || 0,
            totalRefunds: response.data.totalRefunds || 0,
            totalFees: response.data.totalFees || 0,
            netProfit: response.data.netProfit || 0,
            transactionsByType: response.data.transactionsByType || [],
          });
        } else {
          // Reset to default values if API fails
          setSummary({
            totalRevenue: 0,
            totalWithdrawals: 0,
            totalRefunds: 0,
            totalFees: 0,
            netProfit: 0,
            transactionsByType: [],
          });
          toast.error("Failed to load financial data from database");
        }
      } catch (err) {
        console.error("Error fetching financial summary:", err);
        toast.error("Failed to load financial summary from database");
        // Reset to default values if API fails
        setSummary({
          totalRevenue: 0,
          totalWithdrawals: 0,
          totalRefunds: 0,
          totalFees: 0,
          netProfit: 0,
          transactionsByType: [],
        });
      }
    };

    fetchSummary();
  }, [get, period]);

  // Fetch transactions with filters and pagination
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const queryParams = {
          page: pagination.page,
          limit: pagination.limit,
          ...filters,
        };

        const response = await get("/admin/finances", queryParams);
        if (response.success) {
          // Check if response.data.transactions exists, otherwise use empty array
          setTransactions(response.data?.transactions || []);
          setPagination({
            ...pagination,
            total: response.data?.pagination?.total || 0,
            pages: response.data?.pagination?.pages || 1,
          });
        } else {
          // If API call was not successful, set empty transactions
          setTransactions([]);
          setPagination({
            ...pagination,
            total: 0,
            pages: 1,
          });
          toast.error("Failed to load transactions from database");
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
        toast.error("Failed to load transactions from database");
        // Set empty transactions if API fails
        setTransactions([]);
        setPagination({
          ...pagination,
          total: 0,
          pages: 1,
        });
      }
    };

    fetchTransactions();
  }, [get, pagination.page, pagination.limit, filters]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
    // Reset to first page when filters change
    setPagination({
      ...pagination,
      page: 1,
    });
  };

  // Handle period change
  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      type: "",
      status: "",
      startDate: "",
      endDate: "",
    });
  };

  // Get icon for transaction type
  const getTransactionIcon = (type) => {
    switch (type) {
      case "payment":
        return <BanknotesIcon className="h-5 w-5 text-green-500" />;
      case "withdrawal":
        return <ArrowDownIcon className="h-5 w-5 text-red-500" />;
      case "refund":
        return <ArrowUturnLeftIcon className="h-5 w-5 text-amber-500" />;
      case "fee":
        return <ShieldCheckIcon className="h-5 w-5 text-blue-500" />;
      case "escrow":
        return <DocumentTextIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border border-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border border-gray-200";
      case "refunded":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Financial Management
        </h1>
        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={handlePeriodChange}
            className="rounded-lg border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={() => {
              const fetchSummary = async () => {
                try {
                  toast.info("Refreshing data...");
                  const response = await get("/admin/finances/summary", {
                    period,
                  });
                  if (response.success && response.data) {
                    // Ensure all required properties exist with default values if missing
                    setSummary({
                      totalRevenue: response.data.totalRevenue || 0,
                      totalWithdrawals: response.data.totalWithdrawals || 0,
                      totalRefunds: response.data.totalRefunds || 0,
                      totalFees: response.data.totalFees || 0,
                      netProfit: response.data.netProfit || 0,
                      transactionsByType:
                        response.data.transactionsByType || [],
                    });
                    toast.success("Data refreshed successfully!");
                  } else {
                    // Reset to default values if API fails
                    setSummary({
                      totalRevenue: 0,
                      totalWithdrawals: 0,
                      totalRefunds: 0,
                      totalFees: 0,
                      netProfit: 0,
                      transactionsByType: [],
                    });
                    toast.error("Failed to refresh data from database");
                  }
                } catch (err) {
                  console.error("Error refreshing financial summary:", err);
                  toast.error("Failed to refresh data from database");
                  // Reset to default values if API fails
                  setSummary({
                    totalRevenue: 0,
                    totalWithdrawals: 0,
                    totalRefunds: 0,
                    totalFees: 0,
                    netProfit: 0,
                    transactionsByType: [],
                  });
                }
              };
              fetchSummary();
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2 text-gray-400" />
            Refresh
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-6 border border-green-200 transform transition-all duration-200 hover:scale-105 hover:shadow-lg">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white mr-4 shadow-md">
              <BanknotesIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">
                Total Revenue{" "}
                <span className="text-xs text-green-400">
                  (from completed projects)
                </span>
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(summary.totalRevenue)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <div className="flex items-center bg-green-500/10 rounded-full px-3 py-1">
              <ArrowUpIcon className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">15%</span>
              <span className="text-gray-500 ml-2">from last period</span>
            </div>
          </div>
        </div>

        {/* Total Withdrawals */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-md p-6 border border-red-200 transform transition-all duration-200 hover:scale-105 hover:shadow-lg">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white mr-4 shadow-md">
              <ArrowDownIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-600">
                Total Withdrawals
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(summary.totalWithdrawals)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <div className="flex items-center bg-red-500/10 rounded-full px-3 py-1">
              <ArrowUpIcon className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-red-600 font-medium">8%</span>
              <span className="text-gray-500 ml-2">from last period</span>
            </div>
          </div>
        </div>

        {/* Total Refunds */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-md p-6 border border-amber-200 transform transition-all duration-200 hover:scale-105 hover:shadow-lg">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white mr-4 shadow-md">
              <ArrowUturnLeftIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-600">
                Total Refunds
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(summary.totalRefunds)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <div className="flex items-center bg-amber-500/10 rounded-full px-3 py-1">
              <ArrowDownIcon className="h-4 w-4 text-amber-600 mr-1" />
              <span className="text-amber-600 font-medium">3%</span>
              <span className="text-gray-500 ml-2">from last period</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6 border border-blue-200 transform transition-all duration-200 hover:scale-105 hover:shadow-lg">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white mr-4 shadow-md">
              <CurrencyDollarIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">Net Profit</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(summary.netProfit)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <div className="flex items-center bg-blue-500/10 rounded-full px-3 py-1">
              <ArrowUpIcon className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-blue-600 font-medium">12%</span>
              <span className="text-gray-500 ml-2">from last period</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-indigo-600">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Financial Transactions
          </h3>
        </div>

        {/* Filters */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center">
              <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                Filters:
              </span>
            </div>

            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Types</option>
              <option value="payment">Payments</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="refund">Refunds</option>
              <option value="fee">Fees</option>
              <option value="escrow">Escrow</option>
            </select>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>

            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-1" />
                <span className="text-sm text-gray-700">From:</span>
              </div>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-1" />
                <span className="text-sm text-gray-700">To:</span>
              </div>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              onClick={resetFilters}
              className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors duration-150"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
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
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTransactionIcon(transaction.type)}
                        <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                          {transaction.type
                            ? transaction.type.replace("_", " ")
                            : "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {transaction.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <DocumentTextIcon className="h-8 w-8 text-indigo-500" />
            </div>
            <p className="text-gray-500 font-medium">No transactions found</p>
            <p className="text-gray-400 text-sm mt-1">
              Try adjusting your filters
            </p>
          </div>
        )}

        {/* Pagination */}
        {transactions.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of <span className="font-medium">{pagination.total}</span> results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  setPagination({
                    ...pagination,
                    page: Math.max(1, pagination.page - 1),
                  })
                }
                disabled={pagination.page === 1}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  pagination.page === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination({
                    ...pagination,
                    page: Math.min(pagination.pages, pagination.page + 1),
                  })
                }
                disabled={pagination.page === pagination.pages}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  pagination.page === pagination.pages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finances;
