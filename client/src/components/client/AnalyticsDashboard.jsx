import { useState, useEffect, useRef } from "react";
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
import { toast } from "react-toastify";
import useApi from "../../hooks/useApi";

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

const AnalyticsDashboard = () => {
  const { get, loading } = useApi();
  const projectChartRef = useRef(null);
  const spendingChartRef = useRef(null);
  const categoryChartRef = useRef(null);

  const [analyticsData, setAnalyticsData] = useState({
    projectStats: {
      labels: [],
      data: [],
    },
    spendingStats: {
      labels: [],
      data: [],
    },
    categoryStats: {
      labels: [],
      data: [],
    },
    completionRate: 0,
  });

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
      doc.text("Client Analytics Report", pageWidth / 2, 15, {
        align: "center",
      });

      // Add date
      doc.setFontSize(12);
      doc.text(
        `Generated on: ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        25,
        { align: "center" }
      );

      // Add project stats
      doc.setFontSize(14);
      doc.text("Projects Posted Over Time", 14, 40);

      // Create project stats table
      const projectTableData = [];

      // Check if we have data
      if (analyticsData.projectStats.labels.length === 0) {
        // Add sample data for testing if no real data exists
        projectTableData.push(
          ["January", 2],
          ["February", 3],
          ["March", 1],
          ["April", 4]
        );
      } else {
        // Use real data
        analyticsData.projectStats.labels.forEach((month, index) => {
          projectTableData.push([
            month,
            analyticsData.projectStats.data[index],
          ]);
        });
      }

      // Log the data for debugging
      console.log("Project stats table data:", projectTableData);

      doc.autoTable({
        startY: 45,
        head: [["Month", "Number of Projects"]],
        body: projectTableData,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Add spending stats
      const finalY1 = doc.lastAutoTable?.finalY || 100;
      doc.setFontSize(14);
      doc.text("Monthly Spending", 14, finalY1 + 15);

      // Create spending table
      const spendingTableData = [];

      // Check if we have data
      if (analyticsData.spendingStats.labels.length === 0) {
        // Add sample data for testing if no real data exists
        spendingTableData.push(
          ["January", "$1,500"],
          ["February", "$2,200"],
          ["March", "$1,800"],
          ["April", "$2,500"]
        );
      } else {
        // Use real data
        analyticsData.spendingStats.labels.forEach((month, index) => {
          spendingTableData.push([
            month,
            `$${analyticsData.spendingStats.data[index]}`,
          ]);
        });
      }

      // Log the data for debugging
      console.log("Spending table data:", spendingTableData);

      doc.autoTable({
        startY: finalY1 + 20,
        head: [["Month", "Amount Spent"]],
        body: spendingTableData,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Add category stats
      const finalY2 = doc.lastAutoTable?.finalY || 150;
      doc.setFontSize(14);
      doc.text("Project Categories", 14, finalY2 + 15);

      // Create category table
      const categoryTableData = [];

      // Check if we have data
      if (analyticsData.categoryStats.labels.length === 0) {
        // Add sample data for testing if no real data exists
        categoryTableData.push(
          ["Web Development", 5],
          ["Mobile App", 3],
          ["UI/UX Design", 2],
          ["Data Science", 1],
          ["Content Writing", 4]
        );
      } else {
        // Use real data
        analyticsData.categoryStats.labels.forEach((category, index) => {
          categoryTableData.push([
            category,
            analyticsData.categoryStats.data[index],
          ]);
        });
      }

      // Log the data for debugging
      console.log("Category table data:", categoryTableData);

      doc.autoTable({
        startY: finalY2 + 20,
        head: [["Category", "Number of Projects"]],
        body: categoryTableData,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Save the PDF
      doc.save("client_analytics.pdf");
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
      csvContent += "Client Analytics Report\r\n";
      csvContent += `Generated on: ${new Date().toLocaleDateString()}\r\n\r\n`;

      // Add project stats
      csvContent += "Projects Posted Over Time\r\n";
      csvContent += "Month,Number of Projects\r\n";
      analyticsData.projectStats.labels.forEach((month, index) => {
        csvContent += `${month},${analyticsData.projectStats.data[index]}\r\n`;
      });
      csvContent += "\r\n";

      // Add spending stats
      csvContent += "Monthly Spending\r\n";
      csvContent += "Month,Amount Spent\r\n";
      analyticsData.spendingStats.labels.forEach((month, index) => {
        csvContent += `${month},$${analyticsData.spendingStats.data[index]}\r\n`;
      });
      csvContent += "\r\n";

      // Add category stats
      csvContent += "Project Categories\r\n";
      csvContent += "Category,Number of Projects\r\n";
      analyticsData.categoryStats.labels.forEach((category, index) => {
        csvContent += `${category},${analyticsData.categoryStats.data[index]}\r\n`;
      });

      // Create a download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "client_analytics.csv");
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

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        console.log("Fetching client analytics data...");
        const response = await get("/projects/client/analytics");
        if (response.success && response.data) {
          console.log("Setting analytics data from API:", response.data);
          setAnalyticsData(response.data);
        } else {
          console.warn("API response successful but missing analytics data");
          showEmptyState();
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        showEmptyState();
      }
    };

    const showEmptyState = () => {
      console.log(
        "No analytics data found or error occurred, showing empty state"
      );
      setAnalyticsData({
        projectStats: {
          labels: [],
          data: [],
        },
        spendingStats: {
          labels: [],
          data: [],
        },
        categoryStats: {
          labels: [],
          data: [],
        },
        completionRate: 0,
      });
    };

    fetchAnalyticsData();
  }, [get]);

  // Project trend chart options
  const projectChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Projects Posted Over Time",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  // Project trend chart data
  const projectChartData = {
    labels: analyticsData.projectStats.labels,
    datasets: [
      {
        label: "Number of Projects",
        data: analyticsData.projectStats.data,
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        tension: 0.3,
      },
    ],
  };

  // Spending chart options
  const spendingChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Monthly Spending",
      },
    },
  };

  // Spending chart data
  const spendingChartData = {
    labels: analyticsData.spendingStats.labels,
    datasets: [
      {
        label: "Amount Spent ($)",
        data: analyticsData.spendingStats.data,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  // Category distribution chart options
  const categoryChartOptions = {
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

  // Category distribution chart data
  const categoryChartData = {
    labels: analyticsData.categoryStats.labels,
    datasets: [
      {
        label: "Categories",
        data: analyticsData.categoryStats.data,
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-900">
        Analytics Dashboard
      </h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Trend Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Line
                ref={projectChartRef}
                options={projectChartOptions}
                data={projectChartData}
              />
            </div>

            {/* Spending Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Bar
                ref={spendingChartRef}
                options={spendingChartOptions}
                data={spendingChartData}
              />
            </div>

            {/* Category Distribution Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Doughnut
                ref={categoryChartRef}
                options={categoryChartOptions}
                data={categoryChartData}
              />
            </div>

            {/* Project Success Rate */}
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
                        2 *
                        Math.PI *
                        40 *
                        (1 - analyticsData.completionRate / 100)
                      }`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">
                      {analyticsData.completionRate}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  {analyticsData.completionRate}% of your projects have been
                  completed successfully
                </p>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={exportAsCSV}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Export as CSV
            </button>
            <button
              type="button"
              onClick={exportAsPDF}
              className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Export as PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
