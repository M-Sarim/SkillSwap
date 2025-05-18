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
import useApi from "../../hooks/useApi";
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

const AnalyticsDashboard = ({ dateRange = "last30days" }) => {
  const { get, loading } = useApi();
  const earningsChartRef = useRef(null);
  const projectsChartRef = useRef(null);
  const bidChartRef = useRef(null);
  const skillsChartRef = useRef(null);

  const [analyticsData, setAnalyticsData] = useState({
    earningsStats: {
      labels: [],
      data: [],
    },
    projectStats: {
      labels: [],
      data: [],
    },
    bidStats: {
      labels: [],
      data: [],
    },
    skillStats: {
      labels: [],
      data: [],
    },
  });

  const [stats, setStats] = useState({
    bidSuccessRate: 43,
    acceptedBids: 12,
    totalBids: 28,
    averageRating: 4.5,
    reviewCount: 18,
    responseRate: 92,
    onTimeRate: 88,
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
      doc.text("Freelancer Analytics Report", pageWidth / 2, 15, {
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

      // Add stats summary
      doc.setFontSize(14);
      doc.text("Performance Summary", 14, 45);

      doc.setFontSize(10);
      doc.text(`Bid Success Rate: ${stats.bidSuccessRate}%`, 14, 55);
      doc.text(
        `Accepted Bids: ${stats.acceptedBids} out of ${stats.totalBids}`,
        14,
        62
      );
      doc.text(
        `Average Rating: ${stats.averageRating} (${stats.reviewCount} reviews)`,
        14,
        69
      );
      doc.text(`Response Rate: ${stats.responseRate}%`, 14, 76);
      doc.text(`On-Time Delivery: ${stats.onTimeRate}%`, 14, 83);

      // Add earnings data
      doc.setFontSize(14);
      doc.text("Earnings Data", 14, 100);

      // Create earnings table
      const earningsTableData = [];

      // Check if we have data
      if (analyticsData.earningsStats.labels.length === 0) {
        // Add sample data for testing if no real data exists
        earningsTableData.push(
          ["January", "$1,200"],
          ["February", "$1,500"],
          ["March", "$1,800"]
        );
      } else {
        // Use real data
        analyticsData.earningsStats.labels.forEach((month, index) => {
          earningsTableData.push([
            month,
            `$${analyticsData.earningsStats.data[index]}`,
          ]);
        });
      }

      // Log the data for debugging
      console.log("Earnings table data:", earningsTableData);

      doc.autoTable({
        startY: 105,
        head: [["Month", "Earnings"]],
        body: earningsTableData,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Add projects data
      const finalY = doc.lastAutoTable.finalY || 150;
      doc.setFontSize(14);
      doc.text("Projects Completed", 14, finalY + 15);

      // Create projects table
      const projectsTableData = [];

      // Check if we have data
      if (analyticsData.projectStats.labels.length === 0) {
        // Add sample data for testing if no real data exists
        projectsTableData.push(["January", 3], ["February", 2], ["March", 4]);
      } else {
        // Use real data
        analyticsData.projectStats.labels.forEach((month, index) => {
          projectsTableData.push([
            month,
            analyticsData.projectStats.data[index],
          ]);
        });
      }

      // Log the data for debugging
      console.log("Projects table data:", projectsTableData);

      doc.autoTable({
        startY: finalY + 20,
        head: [["Month", "Projects Completed"]],
        body: projectsTableData,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Add bid status data
      const finalY2 = doc.lastAutoTable.finalY || 200;
      doc.setFontSize(14);
      doc.text("Bid Status Distribution", 14, finalY2 + 15);

      // Create bid status table
      const bidTableData = [];

      // Check if we have data
      if (analyticsData.bidStats.labels.length === 0) {
        // Add sample data for testing if no real data exists
        bidTableData.push(
          ["Accepted", 12],
          ["Pending", 8],
          ["Rejected", 5],
          ["Withdrawn", 3]
        );
      } else {
        // Use real data
        analyticsData.bidStats.labels.forEach((status, index) => {
          bidTableData.push([status, analyticsData.bidStats.data[index]]);
        });
      }

      // Log the data for debugging
      console.log("Bid status table data:", bidTableData);

      doc.autoTable({
        startY: finalY2 + 20,
        head: [["Status", "Count"]],
        body: bidTableData,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Add skills data
      const finalY3 = doc.lastAutoTable.finalY || 250;
      doc.setFontSize(14);
      doc.text("Skills in Demand", 14, finalY3 + 15);

      // Create skills table
      const skillsTableData = [];

      // Check if we have data
      if (analyticsData.skillStats.labels.length === 0) {
        // Add sample data for testing if no real data exists
        skillsTableData.push(
          ["JavaScript", 45],
          ["React", 35],
          ["Node.js", 30],
          ["Python", 25],
          ["UI/UX Design", 20]
        );
      } else {
        // Use real data
        analyticsData.skillStats.labels.forEach((skill, index) => {
          skillsTableData.push([skill, analyticsData.skillStats.data[index]]);
        });
      }

      // Log the data for debugging
      console.log("Skills table data:", skillsTableData);

      doc.autoTable({
        startY: finalY3 + 20,
        head: [["Skill", "Demand"]],
        body: skillsTableData,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Save the PDF
      doc.save("freelancer_analytics.pdf");
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  // Function to export analytics as CSV
  const exportAsCSV = () => {
    try {
      toast.info("Generating CSV...");

      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";

      // Add header
      csvContent += "Freelancer Analytics Report\r\n";
      csvContent += `Date Range: ${dateRange}\r\n`;
      csvContent += `Generated on: ${new Date().toLocaleDateString()}\r\n\r\n`;

      // Add stats summary
      csvContent += "Performance Summary\r\n";
      csvContent += `Bid Success Rate,${stats.bidSuccessRate}%\r\n`;
      csvContent += `Accepted Bids,${stats.acceptedBids} out of ${stats.totalBids}\r\n`;
      csvContent += `Average Rating,${stats.averageRating} (${stats.reviewCount} reviews)\r\n`;
      csvContent += `Response Rate,${stats.responseRate}%\r\n`;
      csvContent += `On-Time Delivery,${stats.onTimeRate}%\r\n\r\n`;

      // Add earnings data
      csvContent += "Earnings Data\r\n";
      csvContent += "Month,Earnings\r\n";
      analyticsData.earningsStats.labels.forEach((month, index) => {
        csvContent += `${month},$${analyticsData.earningsStats.data[index]}\r\n`;
      });
      csvContent += "\r\n";

      // Add projects data
      csvContent += "Projects Completed\r\n";
      csvContent += "Month,Projects\r\n";
      analyticsData.projectStats.labels.forEach((month, index) => {
        csvContent += `${month},${analyticsData.projectStats.data[index]}\r\n`;
      });
      csvContent += "\r\n";

      // Add bid status data
      csvContent += "Bid Status Distribution\r\n";
      csvContent += "Status,Count\r\n";
      analyticsData.bidStats.labels.forEach((status, index) => {
        csvContent += `${status},${analyticsData.bidStats.data[index]}\r\n`;
      });
      csvContent += "\r\n";

      // Add skills data
      csvContent += "Skills in Demand\r\n";
      csvContent += "Skill,Demand\r\n";
      analyticsData.skillStats.labels.forEach((skill, index) => {
        csvContent += `${skill},${analyticsData.skillStats.data[index]}\r\n`;
      });

      // Create a Blob and use saveAs from FileSaver.js
      const blob = new Blob(
        [csvContent.replace("data:text/csv;charset=utf-8,", "")],
        { type: "text/csv;charset=utf-8" }
      );

      // Check if FileSaver.js is loaded
      if (typeof window.saveAs === "undefined") {
        // If FileSaver is not available, use a fallback method
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "freelancer_analytics.csv";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 0);
      } else {
        window.saveAs(blob, "freelancer_analytics.csv");
      }

      toast.success("CSV generated successfully!");
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error("Failed to generate CSV");
    }
  };

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        console.log("Fetching analytics data for range:", dateRange);
        const response = await get("/freelancer/analytics", { dateRange });
        console.log("Analytics response:", response);

        if (response.success && response.data) {
          console.log("Setting analytics data from server:", response.data);
          setAnalyticsData({
            earningsStats: response.data.earningsStats || {
              labels: [],
              data: [],
            },
            projectStats: response.data.projectStats || {
              labels: [],
              data: [],
            },
            bidStats: response.data.bidStats || {
              labels: [],
              data: [],
            },
            skillStats: response.data.skillStats || {
              labels: [],
              data: [],
            },
          });

          // Set stats
          if (response.data.stats) {
            setStats(response.data.stats);
          }
        } else {
          console.log("Invalid response format from server");
          // Show empty state if response is invalid
          showEmptyState();
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        // Show empty state if there's an error
        showEmptyState();
      }
    };

    const showEmptyState = () => {
      console.log(
        "No analytics data found or error occurred, showing empty state"
      );
      setAnalyticsData({
        earningsStats: {
          labels: [],
          data: [],
        },
        projectStats: {
          labels: [],
          data: [],
        },
        bidStats: {
          labels: [],
          data: [],
        },
        skillStats: {
          labels: [],
          data: [],
        },
      });

      setStats({
        bidSuccessRate: 0,
        acceptedBids: 0,
        totalBids: 0,
        averageRating: 0,
        reviewCount: 0,
        responseRate: 0,
        onTimeRate: 0,
      });
    };

    fetchAnalyticsData();
  }, [get, dateRange]);

  // Earnings chart options
  const earningsChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Monthly Earnings",
      },
    },
  };

  // Earnings chart data
  const earningsChartData = {
    labels: analyticsData.earningsStats.labels,
    datasets: [
      {
        label: "Earnings ($)",
        data: analyticsData.earningsStats.data,
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Projects chart options
  const projectsChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Projects Completed",
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

  // Projects chart data
  const projectsChartData = {
    labels: analyticsData.projectStats.labels,
    datasets: [
      {
        label: "Number of Projects",
        data: analyticsData.projectStats.data,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  // Bid status chart options
  const bidChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
      },
      title: {
        display: true,
        text: "Bid Status Distribution",
      },
    },
  };

  // Bid status chart data
  const bidChartData = {
    labels: analyticsData.bidStats.labels,
    datasets: [
      {
        label: "Bids",
        data: analyticsData.bidStats.data,
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Skills chart options
  const skillsChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
      },
      title: {
        display: true,
        text: "Skills in Demand",
      },
    },
  };

  // Skills chart data
  const skillsChartData = {
    labels: analyticsData.skillStats.labels,
    datasets: [
      {
        label: "Demand (%)",
        data: analyticsData.skillStats.data,
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
            {/* Earnings Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Line
                ref={earningsChartRef}
                options={earningsChartOptions}
                data={earningsChartData}
              />
            </div>

            {/* Projects Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Bar
                ref={projectsChartRef}
                options={projectsChartOptions}
                data={projectsChartData}
              />
            </div>

            {/* Bid Status Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Doughnut
                ref={bidChartRef}
                options={bidChartOptions}
                data={bidChartData}
              />
            </div>

            {/* Skills Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Doughnut
                ref={skillsChartRef}
                options={skillsChartOptions}
                data={skillsChartData}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Bid Success Rate
              </h3>
              <div className="flex items-center">
                <div className="relative w-16 h-16">
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
                        2 * Math.PI * 40 * (1 - stats.bidSuccessRate / 100)
                      }`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">
                      {stats.bidSuccessRate}%
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">
                    {stats.acceptedBids} out of {stats.totalBids} bids were
                    accepted
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Average Rating
              </h3>
              <div className="flex items-center">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`h-6 w-6 ${
                        star <= stats.averageRating
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ))}
                </div>
                <div className="ml-2">
                  <span className="text-lg font-bold text-gray-900">
                    {stats.averageRating}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    ({stats.reviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Response Rate
              </h3>
              <div className="flex items-center">
                <div className="relative w-16 h-16">
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
                      className="text-green-500"
                      strokeWidth="8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 40 * (1 - stats.responseRate / 100)
                      }`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">
                      {stats.responseRate}%
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">
                    You respond to {stats.responseRate}% of client messages
                    within 24 hours
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                On-Time Delivery
              </h3>
              <div className="flex items-center">
                <div className="relative w-16 h-16">
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
                      className="text-blue-500"
                      strokeWidth="8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 40 * (1 - stats.onTimeRate / 100)
                      }`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">
                      {stats.onTimeRate}%
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">
                    You delivered {stats.onTimeRate}% of projects on time or
                    early
                  </p>
                </div>
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
