import { useState, useEffect } from "react";
import {
  CalendarIcon,
  ArrowPathIcon,
  UsersIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import useApi from "../../hooks/useApi";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { toast } from "react-toastify";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const { get, loading } = useApi();
  const [dateRange, setDateRange] = useState("last30days");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalRevenue: 0,
    completionRate: 0,
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
    verifiedFreelancers: {
      count: 0,
      change: 0,
    },
  });
  const [chartData, setChartData] = useState({
    userGrowth: {
      labels: [],
      data: [],
    },
    projectGrowth: {
      labels: [],
      data: [],
    },
    revenue: {
      labels: [],
      data: [],
    },
    categories: {
      labels: [],
      data: [],
    },
    userTypes: {
      labels: ["Clients", "Freelancers", "Admin"],
      data: [0, 0, 0],
    },
  });

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const response = await get("/admin/analytics", { period: dateRange });
        if (response.success) {
          setStats(response.data.stats);
          setChartData(response.data.charts);
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);

        // Set mock data for demonstration
        setStats({
          totalUsers: 1250,
          totalProjects: 875,
          totalRevenue: 125000,
          completionRate: 78,
          newUsers: {
            count: 85,
            change: 12,
          },
          newProjects: {
            count: 64,
            change: 8,
          },
          revenue: {
            amount: 12500,
            change: 15,
          },
          verifiedFreelancers: {
            count: 45,
            change: -5,
          },
        });

        setChartData({
          userGrowth: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            data: [150, 220, 280, 350, 410, 480],
          },
          projectGrowth: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            data: [80, 120, 160, 210, 250, 310],
          },
          revenue: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            data: [5000, 8000, 12000, 15000, 18000, 22000],
          },
          categories: {
            labels: [
              "Web Development",
              "Mobile App",
              "UI/UX Design",
              "Content Writing",
              "Digital Marketing",
              "Other",
            ],
            data: [35, 25, 15, 10, 10, 5],
          },
          userTypes: {
            labels: ["Clients", "Freelancers", "Admin"],
            data: [750, 480, 20],
          },
        });
      }
    };

    fetchAnalyticsData();
  }, [get, dateRange]);

  // User growth chart options
  const userGrowthOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "User Growth",
      },
    },
  };

  // User growth chart data
  const userGrowthData = {
    labels: chartData.userGrowth.labels,
    datasets: [
      {
        label: "Users",
        data: chartData.userGrowth.data,
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Project growth chart options
  const projectGrowthOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Project Growth",
      },
    },
  };

  // Project growth chart data
  const projectGrowthData = {
    labels: chartData.projectGrowth.labels,
    datasets: [
      {
        label: "Projects",
        data: chartData.projectGrowth.data,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Revenue chart options
  const revenueOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Revenue",
      },
    },
  };

  // Revenue chart data
  const revenueData = {
    labels: chartData.revenue.labels,
    datasets: [
      {
        label: "Revenue ($)",
        data: chartData.revenue.data,
        backgroundColor: "rgba(255, 159, 64, 0.6)",
      },
    ],
  };

  // Categories chart options
  const categoriesOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
      },
      title: {
        display: true,
        text: "Project Categories",
      },
    },
  };

  // Categories chart data
  const categoriesData = {
    labels: chartData.categories.labels,
    datasets: [
      {
        label: "Categories",
        data: chartData.categories.data,
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // User types chart options
  const userTypesOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
      },
      title: {
        display: true,
        text: "User Types",
      },
    },
  };

  // User types chart data
  const userTypesData = {
    labels: chartData.userTypes.labels,
    datasets: [
      {
        label: "User Types",
        data: chartData.userTypes.data,
        backgroundColor: [
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(255, 206, 86, 0.6)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Function to export analytics as PDF
  const exportAsPDF = () => {
    try {
      toast.info("Generating PDF...");

      // Check if jspdf is loaded
      if (typeof window.jspdf === "undefined") {
        toast.error(
          "PDF generation libraries are not loaded. Please refresh the page and try again."
        );
        return;
      }

      // Create a new jsPDF instance
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Add title
      doc.setFontSize(18);
      doc.text("Admin Analytics Report", pageWidth / 2, 15, {
        align: "center",
      });

      // Add date range
      doc.setFontSize(12);
      doc.text(`Date Range: ${dateRange}`, pageWidth / 2, 25, {
        align: "center",
      });
      doc.text(
        `Generated on: ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        32,
        { align: "center" }
      );

      // Add platform overview
      doc.setFontSize(14);
      doc.text("Platform Overview", 14, 45);

      // Create platform overview table
      const overviewData = [
        ["Total Users", stats.totalUsers.toString()],
        ["Total Projects", stats.totalProjects.toString()],
        ["Total Revenue", formatCurrency(stats.totalRevenue)],
        ["Completion Rate", `${stats.completionRate}%`],
      ];

      doc.autoTable({
        startY: 50,
        head: [["Metric", "Value"]],
        body: overviewData,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Get the final Y position after the first table
      const finalY1 = doc.lastAutoTable.finalY || 120;

      // Add user growth chart title
      doc.setFontSize(14);
      doc.text("User Growth", 14, finalY1 + 15);

      // Create user growth table
      const userGrowthTableData = chartData.userGrowth.labels.map(
        (label, index) => [label, chartData.userGrowth.data[index].toString()]
      );

      doc.autoTable({
        startY: finalY1 + 20,
        head: [["Month", "Number of Users"]],
        body: userGrowthTableData,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Get the final Y position after the second table
      const finalY2 = doc.lastAutoTable.finalY || 180;

      // Add project growth chart title
      doc.setFontSize(14);
      doc.text("Project Growth", 14, finalY2 + 15);

      // Create project growth table
      const projectGrowthTableData = chartData.projectGrowth.labels.map(
        (label, index) => [
          label,
          chartData.projectGrowth.data[index].toString(),
        ]
      );

      doc.autoTable({
        startY: finalY2 + 20,
        head: [["Month", "Number of Projects"]],
        body: projectGrowthTableData,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Get the final Y position after the third table
      const finalY3 = doc.lastAutoTable.finalY || 240;

      // Add revenue chart title
      doc.setFontSize(14);
      doc.text("Revenue", 14, finalY3 + 15);

      // Create revenue table
      const revenueTableData = chartData.revenue.labels.map((label, index) => [
        label,
        formatCurrency(chartData.revenue.data[index]),
      ]);

      doc.autoTable({
        startY: finalY3 + 20,
        head: [["Month", "Revenue"]],
        body: revenueTableData,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Save the PDF
      doc.save("admin_analytics.pdf");
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  // Function to export analytics as CSV
  const exportAsCSV = () => {
    try {
      toast.info("Generating CSV...");

      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";

      // Add header
      csvContent += "Admin Analytics Report\r\n";
      csvContent += `Date Range: ${dateRange}\r\n`;
      csvContent += `Generated on: ${new Date().toLocaleDateString()}\r\n\r\n`;

      // Add platform overview
      csvContent += "Platform Overview\r\n";
      csvContent += "Metric,Value\r\n";
      csvContent += `Total Users,${stats.totalUsers}\r\n`;
      csvContent += `Total Projects,${stats.totalProjects}\r\n`;
      csvContent += `Total Revenue,${formatCurrency(stats.totalRevenue)}\r\n`;
      csvContent += `Completion Rate,${stats.completionRate}%\r\n\r\n`;

      // Add user growth
      csvContent += "User Growth\r\n";
      csvContent += "Month,Number of Users\r\n";
      chartData.userGrowth.labels.forEach((month, index) => {
        csvContent += `${month},${chartData.userGrowth.data[index]}\r\n`;
      });
      csvContent += "\r\n";

      // Add project growth
      csvContent += "Project Growth\r\n";
      csvContent += "Month,Number of Projects\r\n";
      chartData.projectGrowth.labels.forEach((month, index) => {
        csvContent += `${month},${chartData.projectGrowth.data[index]}\r\n`;
      });
      csvContent += "\r\n";

      // Add revenue
      csvContent += "Revenue\r\n";
      csvContent += "Month,Revenue\r\n";
      chartData.revenue.labels.forEach((month, index) => {
        csvContent += `${month},${formatCurrency(
          chartData.revenue.data[index]
        )}\r\n`;
      });
      csvContent += "\r\n";

      // Add categories
      csvContent += "Project Categories\r\n";
      csvContent += "Category,Percentage\r\n";
      chartData.categories.labels.forEach((category, index) => {
        csvContent += `${category},${chartData.categories.data[index]}%\r\n`;
      });
      csvContent += "\r\n";

      // Add user types
      csvContent += "User Types\r\n";
      csvContent += "Type,Count\r\n";
      chartData.userTypes.labels.forEach((type, index) => {
        csvContent += `${type},${chartData.userTypes.data[index]}\r\n`;
      });

      // Create a download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "admin_analytics.csv");
      document.body.appendChild(link);

      // Trigger download
      link.click();
      document.body.removeChild(link);

      toast.success("CSV generated successfully!");
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error("Failed to generate CSV. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>

        <div className="flex items-center space-x-4">
          {/* Date Range Selector */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none pl-10 pr-10 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="last3months">Last 3 Months</option>
              <option value="last6months">Last 6 Months</option>
              <option value="lastyear">Last Year</option>
              <option value="alltime">All Time</option>
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => {
              toast.info("Refreshing data...");
              const fetchAnalyticsData = async () => {
                try {
                  const response = await get("/admin/analytics", {
                    period: dateRange,
                  });
                  if (response.success) {
                    setStats(response.data.stats);
                    setChartData(response.data.charts);
                    toast.success("Data refreshed successfully!");
                  }
                } catch (err) {
                  console.error("Error fetching analytics data:", err);
                  toast.error("Failed to refresh data. Please try again.");
                }
              };
              fetchAnalyticsData();
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2 text-gray-400" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                  <UsersIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">New Users</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.newUsers.count}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {stats.newUsers.change > 0 ? (
                  <>
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-500 font-medium">
                      {stats.newUsers.change}%
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-red-500 font-medium">
                      {Math.abs(stats.newUsers.change)}%
                    </span>
                  </>
                )}
                <span className="text-gray-500 ml-2">from last period</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                  <BriefcaseIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    New Projects
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.newProjects.count}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {stats.newProjects.change > 0 ? (
                  <>
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-500 font-medium">
                      {stats.newProjects.change}%
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-red-500 font-medium">
                      {Math.abs(stats.newProjects.change)}%
                    </span>
                  </>
                )}
                <span className="text-gray-500 ml-2">from last period</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                  <CurrencyDollarIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(stats.revenue.amount)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {stats.revenue.change > 0 ? (
                  <>
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-500 font-medium">
                      {stats.revenue.change}%
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-red-500 font-medium">
                      {Math.abs(stats.revenue.change)}%
                    </span>
                  </>
                )}
                <span className="text-gray-500 ml-2">from last period</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                  <CheckCircleIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Verified Freelancers
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.verifiedFreelancers.count}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {stats.verifiedFreelancers.change > 0 ? (
                  <>
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-500 font-medium">
                      {stats.verifiedFreelancers.change}%
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-red-500 font-medium">
                      {Math.abs(stats.verifiedFreelancers.change)}%
                    </span>
                  </>
                )}
                <span className="text-gray-500 ml-2">from last period</span>
              </div>
            </div>
          </div>

          {/* Platform Overview */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Platform Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-gray-900">
                  {stats.totalUsers}
                </div>
                <div className="text-sm text-gray-500">Total Users</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-gray-900">
                  {stats.totalProjects}
                </div>
                <div className="text-sm text-gray-500">Total Projects</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <div className="text-sm text-gray-500">Total Revenue</div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Line options={userGrowthOptions} data={userGrowthData} />
            </div>

            {/* Project Growth Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Line options={projectGrowthOptions} data={projectGrowthData} />
            </div>

            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Bar options={revenueOptions} data={revenueData} />
            </div>

            {/* Categories Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Doughnut options={categoriesOptions} data={categoriesData} />
            </div>

            {/* User Types Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Doughnut options={userTypesOptions} data={userTypesData} />
            </div>

            {/* Project Completion Rate */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex flex-col items-center justify-center h-full">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Project Completion Rate
                </h3>
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-gray-200"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-primary-600"
                      strokeWidth="8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 40 * (1 - stats.completionRate / 100)
                      }`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">
                      {stats.completionRate}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  {stats.completionRate}% of projects are completed successfully
                </p>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={exportAsCSV}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-gray-500" />
              Export as CSV
            </button>
            <button
              type="button"
              onClick={exportAsPDF}
              className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-500" />
              Export as PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
