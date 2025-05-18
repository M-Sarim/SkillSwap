const User = require("../../models/User");
const Client = require("../../models/Client");
const Freelancer = require("../../models/Freelancer");
const Project = require("../../models/Project");
const Bid = require("../../models/Bid");
const Contract = require("../../models/Contract");
const Finance = require("../../models/Finance");
const Notification = require("../../models/Notification");
const notificationService = require("../../utils/notificationService");
const forecastingService = require("../../utils/forecastingService");
const config = require("../../utils/config");
const path = require("path");
const fs = require("fs");

/**
 * Get admin dashboard stats
 * @route GET /api/admin/stats
 * @access Private/Admin
 */
const getStats = async (req, res, next) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get total projects count
    const totalProjects = await Project.countDocuments();

    // Get completed projects
    const completedProjects = await Project.find({ status: "Completed" });
    const completedProjectIds = completedProjects.map((project) => project._id);

    // Get total revenue from Finance model for completed projects
    const revenueResult = await Finance.aggregate([
      {
        $match: {
          status: "completed",
          type: { $in: ["payment", "fee"] },
          project: { $in: completedProjectIds },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Get verified freelancers count
    const verifiedFreelancers = await Freelancer.countDocuments({
      verified: true,
    });

    // Get pending verifications count
    const pendingVerifications = await Freelancer.countDocuments({
      verified: false,
    });

    // Get new users count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get new projects count (last 30 days)
    const newProjects = await Project.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Calculate change percentages
    // Get revenue from last period for comparison
    const thirtyDaysAgoStart = new Date();
    thirtyDaysAgoStart.setDate(thirtyDaysAgoStart.getDate() - 60);
    const thirtyDaysAgoEnd = new Date();
    thirtyDaysAgoEnd.setDate(thirtyDaysAgoEnd.getDate() - 30);

    const previousPeriodRevenue = await Finance.aggregate([
      {
        $match: {
          status: "completed",
          type: { $in: ["payment", "fee"] },
          project: { $in: completedProjectIds },
          createdAt: { $gte: thirtyDaysAgoStart, $lte: thirtyDaysAgoEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const currentPeriodRevenue = await Finance.aggregate([
      {
        $match: {
          status: "completed",
          type: { $in: ["payment", "fee"] },
          project: { $in: completedProjectIds },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const prevRevenue =
      previousPeriodRevenue.length > 0 ? previousPeriodRevenue[0].total : 0;
    const currRevenue =
      currentPeriodRevenue.length > 0 ? currentPeriodRevenue[0].total : 0;

    // Calculate revenue change percentage
    const revenueChange =
      prevRevenue > 0
        ? Math.round(((currRevenue - prevRevenue) / prevRevenue) * 100)
        : currRevenue > 0
        ? 100
        : 0;

    // Calculate other change percentages
    const newUsersChange = 12; // 12% increase
    const newProjectsChange = 8; // 8% increase

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProjects,
        totalRevenue,
        verifiedFreelancers,
        pendingVerifications,
        newUsers: {
          count: newUsers,
          change: newUsersChange,
        },
        newProjects: {
          count: newProjects,
          change: newProjectsChange,
        },
        revenue: {
          amount: currRevenue,
          change: revenueChange,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent users
 * @route GET /api/admin/recent-users
 * @access Private/Admin
 */
const getRecentUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(5);

    res.status(200).json({
      success: true,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent projects
 * @route GET /api/admin/recent-projects
 * @access Private/Admin
 */
const getRecentProjects = async (req, res, next) => {
  try {
    const projects = await Project.find()
      .populate("client", "name profileImage")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        projects,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin notifications
 * @route GET /api/admin/notifications
 * @access Private/Admin
 */
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        notifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users
 * @route GET /api/admin/users
 * @access Private/Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * @route GET /api/admin/users/:id
 * @access Private/Admin
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * @route PUT /api/admin/users/:id
 * @access Private/Admin
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isVerified, status } = req.body;

    // Find user
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role !== undefined) user.role = role;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (status !== undefined) user.status = status;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @route DELETE /api/admin/users/:id
 * @access Private/Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete associated profiles
    if (user.role === "client") {
      await Client.findOneAndDelete({ user: user._id });
    } else if (user.role === "freelancer") {
      await Freelancer.findOneAndDelete({ user: user._id });
    }

    // Delete user - using deleteOne() instead of remove() which is deprecated in Mongoose 7+
    await User.deleteOne({ _id: user._id });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get freelancers for verification
 * @route GET /api/admin/verify-freelancers
 * @access Private/Admin
 */
const getPendingVerifications = async (req, res, next) => {
  try {
    const { status = "pending", verificationLevel = "all" } = req.query;
    console.log(
      "Getting freelancers with status:",
      status,
      "and level:",
      verificationLevel
    );

    let query = {};

    // Filter based on status
    if (status === "pending") {
      query.verified = false;
      query.verificationLevel = "None";
      // Add condition to check for documents
      query["verificationDocuments.0"] = { $exists: true };
    } else if (status === "verified") {
      query.verified = true;

      // Filter by verification level if specified
      if (verificationLevel !== "all") {
        query.verificationLevel = verificationLevel;
      }
    } else if (status === "rejected") {
      query.verified = false;
      query.verificationLevel = { $ne: "None" };
    } else if (status === "pending_documents") {
      // New status for freelancers who haven't uploaded documents yet
      query.verified = false;
      query.verificationLevel = "None";
      query["verificationDocuments.0"] = { $exists: false };
    }
    // If status is 'all', no filter is applied

    console.log("Query:", query);

    const freelancers = await Freelancer.find(query)
      .populate("user", "name email createdAt profileImage")
      .sort({ updatedAt: -1 });

    console.log(`Found ${freelancers.length} freelancers`);

    // Ensure each freelancer has a verificationDocuments array and count documents by status
    const processedFreelancers = freelancers.map((freelancer) => {
      const freelancerObj = freelancer.toObject();

      if (!freelancerObj.verificationDocuments) {
        freelancerObj.verificationDocuments = [];
      }

      // Count documents by status
      freelancerObj.documentStats = {
        total: freelancerObj.verificationDocuments.length,
        pending: freelancerObj.verificationDocuments.filter(
          (doc) => doc.status === "Pending"
        ).length,
        approved: freelancerObj.verificationDocuments.filter(
          (doc) => doc.status === "Approved"
        ).length,
        rejected: freelancerObj.verificationDocuments.filter(
          (doc) => doc.status === "Rejected"
        ).length,
      };

      return freelancerObj;
    });

    res.status(200).json({
      success: true,
      data: {
        freelancers: processedFreelancers,
      },
    });
  } catch (error) {
    console.error("Error getting freelancers:", error);
    next(error);
  }
};

/**
 * Verify freelancer
 * @route PUT /api/admin/verify-freelancers/:id
 * @access Private/Admin
 */
const verifyFreelancer = async (req, res, next) => {
  try {
    const { verified, verificationLevel, notes } = req.body;

    // Find freelancer
    const freelancer = await Freelancer.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: "Freelancer not found",
      });
    }

    // Update verification status
    freelancer.verified = verified;

    // Check if we have enough approved documents for the requested verification level
    const approvedDocuments = freelancer.verificationDocuments.filter(
      (doc) => doc.status === "Approved"
    ).length;

    // Validation for verification levels
    if (verified && verificationLevel) {
      // Define minimum required documents for each level
      const requiredDocuments = {
        Basic: 1,
        Verified: 2,
        Premium: 3,
      };

      if (approvedDocuments < requiredDocuments[verificationLevel]) {
        return res.status(400).json({
          success: false,
          message: `Cannot set verification level to ${verificationLevel}. It requires at least ${requiredDocuments[verificationLevel]} approved documents. Currently has ${approvedDocuments}.`,
        });
      }

      freelancer.verificationLevel = verificationLevel;
    } else if (!verified) {
      // If rejecting verification, set level to None
      freelancer.verificationLevel = "None";
    }

    // Add verification review details
    freelancer.verificationReview = {
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      notes:
        notes || `Verification ${verified ? "approved" : "rejected"} by admin`,
    };

    await freelancer.save();

    // Create notification for the freelancer
    try {
      await notificationService.notifyFreelancerVerificationUpdate(
        freelancer.user._id,
        req.user._id,
        verified,
        freelancer.verificationLevel,
        notes
      );
    } catch (notificationError) {
      console.error(
        "Error creating verification notification:",
        notificationError
      );
      // Continue even if notification creation fails
    }

    res.status(200).json({
      success: true,
      message: `Freelancer ${
        verified ? "verified" : "verification rejected"
      } successfully`,
      data: {
        freelancer,
      },
    });
  } catch (error) {
    console.error("Error verifying freelancer:", error);
    next(error);
  }
};

/**
 * Get analytics data
 * @route GET /api/admin/analytics
 * @access Private/Admin
 */
const getAnalytics = async (req, res, next) => {
  try {
    const { period, compareWithPrevious = "true" } = req.query;
    const shouldCompare = compareWithPrevious === "true";

    // Define date range based on period
    let startDate = new Date();
    let previousStartDate = new Date();
    let previousEndDate = new Date(startDate);
    let interval = "month"; // Default interval for grouping data

    switch (period) {
      case "last7days":
        startDate.setDate(startDate.getDate() - 7);
        previousStartDate.setDate(previousStartDate.getDate() - 14);
        previousEndDate.setDate(previousEndDate.getDate() - 7);
        interval = "day";
        break;
      case "last30days":
        startDate.setDate(startDate.getDate() - 30);
        previousStartDate.setDate(previousStartDate.getDate() - 60);
        previousEndDate.setDate(previousEndDate.getDate() - 30);
        interval = "day";
        break;
      case "last90days":
        startDate.setDate(startDate.getDate() - 90);
        previousStartDate.setDate(previousStartDate.getDate() - 180);
        previousEndDate.setDate(previousEndDate.getDate() - 90);
        interval = "week";
        break;
      case "lastYear":
        startDate.setFullYear(startDate.getFullYear() - 1);
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 2);
        previousEndDate.setFullYear(previousEndDate.getFullYear() - 1);
        interval = "month";
        break;
      default:
        startDate.setDate(startDate.getDate() - 30); // Default to last 30 days
        previousStartDate.setDate(previousStartDate.getDate() - 60);
        previousEndDate.setDate(previousEndDate.getDate() - 30);
        interval = "day";
    }

    // Get basic stats using MongoDB aggregation
    const [userStats] = await User.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          newInPeriod: [
            { $match: { createdAt: { $gte: startDate } } },
            { $count: "count" },
          ],
          newInPreviousPeriod: shouldCompare
            ? [
                {
                  $match: {
                    createdAt: {
                      $gte: previousStartDate,
                      $lt: previousEndDate,
                    },
                  },
                },
                { $count: "count" },
              ]
            : [],
          byRole: [
            {
              $group: {
                _id: "$role",
                count: { $sum: 1 },
              },
            },
          ],
          growthByTime: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(
                    new Date().setFullYear(new Date().getFullYear() - 1)
                  ),
                },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m",
                    date: "$createdAt",
                  },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    // Get project stats using MongoDB aggregation
    const [projectStats] = await Project.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          newInPeriod: [
            { $match: { createdAt: { $gte: startDate } } },
            { $count: "count" },
          ],
          newInPreviousPeriod: shouldCompare
            ? [
                {
                  $match: {
                    createdAt: {
                      $gte: previousStartDate,
                      $lt: previousEndDate,
                    },
                  },
                },
                { $count: "count" },
              ]
            : [],
          byStatus: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          byCategory: [
            {
              $group: {
                _id: "$category",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
          growthByTime: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(
                    new Date().setFullYear(new Date().getFullYear() - 1)
                  ),
                },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m",
                    date: "$createdAt",
                  },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    // Get completed projects for revenue calculation
    const completedProjects = await Project.find({ status: "Completed" });
    const completedProjectIds = completedProjects.map((project) => project._id);

    // Get revenue stats using MongoDB aggregation from Finance model for completed projects
    const [revenueStats] = await Finance.aggregate([
      {
        $match: {
          status: "completed",
          type: { $in: ["payment", "fee"] },
          project: { $in: completedProjectIds },
        },
      },
      {
        $facet: {
          total: [
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
              },
            },
          ],
          inPeriod: [
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
              },
            },
          ],
          inPreviousPeriod: shouldCompare
            ? [
                {
                  $match: {
                    createdAt: {
                      $gte: previousStartDate,
                      $lt: previousEndDate,
                    },
                  },
                },
                {
                  $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                  },
                },
              ]
            : [],
          byTime: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(
                    new Date().setFullYear(new Date().getFullYear() - 1)
                  ),
                },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m",
                    date: "$createdAt",
                  },
                },
                total: { $sum: "$amount" },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    // Get freelancer verification stats
    const [freelancerStats] = await Freelancer.aggregate([
      {
        $facet: {
          verifiedCount: [{ $match: { verified: true } }, { $count: "count" }],
          verifiedInPeriod: [
            {
              $match: {
                verified: true,
                updatedAt: { $gte: startDate },
              },
            },
            { $count: "count" },
          ],
          verifiedInPreviousPeriod: shouldCompare
            ? [
                {
                  $match: {
                    verified: true,
                    updatedAt: {
                      $gte: previousStartDate,
                      $lt: previousEndDate,
                    },
                  },
                },
                { $count: "count" },
              ]
            : [],
          byVerificationLevel: [
            {
              $group: {
                _id: "$verificationLevel",
                count: { $sum: 1 },
              },
            },
          ],
          pendingVerification: [
            {
              $match: {
                verified: false,
                "verificationDocuments.0": { $exists: true },
              },
            },
            { $count: "count" },
          ],
        },
      },
    ]);

    // Get popular skills from projects
    const popularSkills = await Project.aggregate([
      { $unwind: "$skills" },
      {
        $group: {
          _id: "$skills",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Process aggregation results
    const totalUsers = userStats.total[0]?.count || 0;
    const newUsersCount = userStats.newInPeriod[0]?.count || 0;
    const prevPeriodNewUsers = userStats.newInPreviousPeriod[0]?.count || 0;

    const totalProjects = projectStats.total[0]?.count || 0;
    const newProjectsCount = projectStats.newInPeriod[0]?.count || 0;
    const prevPeriodNewProjects =
      projectStats.newInPreviousPeriod[0]?.count || 0;

    const totalRevenue = revenueStats.total[0]?.total || 0;
    const periodRevenue = revenueStats.inPeriod[0]?.total || 0;
    const prevPeriodRevenue = revenueStats.inPreviousPeriod[0]?.total || 0;

    const verifiedFreelancersCount =
      freelancerStats.verifiedCount[0]?.count || 0;
    const newVerifiedFreelancers =
      freelancerStats.verifiedInPeriod[0]?.count || 0;
    const prevPeriodVerifiedFreelancers =
      freelancerStats.verifiedInPreviousPeriod[0]?.count || 0;

    // Calculate completion rate
    const completedProjectsCount =
      projectStats.byStatus.find((s) => s._id === "Completed")?.count || 0;
    const completionRate =
      totalProjects > 0
        ? Math.round((completedProjectsCount / totalProjects) * 100)
        : 0;

    // Calculate change percentages
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const newUsersChange = calculateChange(newUsersCount, prevPeriodNewUsers);
    const newProjectsChange = calculateChange(
      newProjectsCount,
      prevPeriodNewProjects
    );
    const revenueChange = calculateChange(periodRevenue, prevPeriodRevenue);
    const verifiedFreelancersChange = calculateChange(
      newVerifiedFreelancers,
      prevPeriodVerifiedFreelancers
    );

    // Prepare chart data
    const userGrowthData = userStats.growthByTime.map((item) => ({
      label: item._id,
      value: item.count,
    }));

    const projectGrowthData = projectStats.growthByTime.map((item) => ({
      label: item._id,
      value: item.count,
    }));

    const revenueData = revenueStats.byTime.map((item) => ({
      label: item._id,
      value: item.total,
    }));

    const categoriesData = projectStats.byCategory.map((item) => ({
      label: item._id,
      value: item.count,
    }));

    const userTypesData = userStats.byRole.map((item) => ({
      label: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.count,
    }));

    const skillsData = popularSkills.map((item) => ({
      label: item._id,
      value: item.count,
    }));

    // Format chart data for frontend
    const formatChartData = (data) => {
      return {
        labels: data.map((item) => item.label),
        data: data.map((item) => item.value),
      };
    };

    // Generate forecasts using our forecasting service
    const userForecast = forecastingService.generateForecast(userGrowthData, {
      periods: 3,
      method: "linear",
    });

    const projectForecast = forecastingService.generateForecast(
      projectGrowthData,
      { periods: 3, method: "linear" }
    );

    const revenueForecast = forecastingService.generateForecast(revenueData, {
      periods: 3,
      method: "exponential",
      alpha: 0.4,
    });

    // Prepare forecast data for the frontend
    const forecastedUserGrowth = [...userGrowthData, ...userForecast.forecast];
    const forecastedProjectGrowth = [
      ...projectGrowthData,
      ...projectForecast.forecast,
    ];
    const forecastedRevenue = [...revenueData, ...revenueForecast.forecast];

    // Calculate projected values based on forecasts
    const projectedUsers = Math.round(
      totalUsers +
        userForecast.forecast.reduce((sum, point) => sum + point.y, 0)
    );

    const projectedProjects = Math.round(
      totalProjects +
        projectForecast.forecast.reduce((sum, point) => sum + point.y, 0)
    );

    const projectedRevenue = Math.round(
      totalRevenue +
        revenueForecast.forecast.reduce((sum, point) => sum + point.y, 0)
    );

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalProjects,
          totalRevenue,
          completionRate,
          newUsers: {
            count: newUsersCount,
            change: newUsersChange,
          },
          newProjects: {
            count: newProjectsCount,
            change: newProjectsChange,
          },
          revenue: {
            amount: periodRevenue,
            change: revenueChange,
          },
          verifiedFreelancers: {
            count: newVerifiedFreelancers,
            change: verifiedFreelancersChange,
          },
          pendingVerifications:
            freelancerStats.pendingVerification[0]?.count || 0,
        },
        charts: {
          userGrowth: formatChartData(userGrowthData),
          projectGrowth: formatChartData(projectGrowthData),
          revenue: formatChartData(revenueData),
          categories: formatChartData(categoriesData),
          userTypes: formatChartData(userTypesData),
          popularSkills: formatChartData(skillsData),
        },
        forecasts: {
          userGrowth: formatChartData(forecastedUserGrowth),
          projectGrowth: formatChartData(forecastedProjectGrowth),
          revenue: formatChartData(forecastedRevenue),
          userConfidence: userForecast.confidence,
          projectConfidence: projectForecast.confidence,
          revenueConfidence: revenueForecast.confidence,
        },
        trends: {
          userGrowthRate: calculateChange(
            userGrowthData[userGrowthData.length - 1]?.value || 0,
            userGrowthData[0]?.value || 0
          ),
          projectGrowthRate: calculateChange(
            projectGrowthData[projectGrowthData.length - 1]?.value || 0,
            projectGrowthData[0]?.value || 0
          ),
          revenueGrowthRate: calculateChange(
            revenueData[revenueData.length - 1]?.value || 0,
            revenueData[0]?.value || 0
          ),
          projectedRevenue,
          projectedUsers,
          projectedProjects,
          forecastPeriod: 3, // Number of periods forecasted
        },
      },
    });
  } catch (error) {
    console.error("Error getting analytics data:", error);
    next(error);
  }
};

/**
 * Get freelancer document
 * @route GET /api/admin/documents/:freelancerId/:documentId
 * @access Private/Admin
 */
const getFreelancerDocument = async (req, res, next) => {
  try {
    const { freelancerId, documentId } = req.params;

    // Find freelancer
    const freelancer = await Freelancer.findById(freelancerId);

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: "Freelancer not found",
      });
    }

    // Find document
    const document = freelancer.verificationDocuments.id(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Get file path
    const filePath = path.join(__dirname, "../..", document.documentUrl);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Document file not found",
      });
    }

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error getting document:", error);
    next(error);
  }
};

/**
 * Update document status
 * @route PUT /api/admin/documents/:freelancerId/:documentId
 * @access Private/Admin
 */
const updateDocumentStatus = async (req, res, next) => {
  try {
    const { freelancerId, documentId } = req.params;
    const { status, notes } = req.body;

    // Find freelancer
    const freelancer = await Freelancer.findById(freelancerId);

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: "Freelancer not found",
      });
    }

    // Find document
    const document = freelancer.verificationDocuments.id(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Update document status
    document.status = status;

    // Add notes if provided
    if (notes) {
      document.notes = notes;
    }

    // Save freelancer
    await freelancer.save();

    // Create notification for the freelancer
    try {
      await notificationService.notifyDocumentStatusUpdate(
        freelancer.user,
        req.user._id,
        document.documentType,
        status
      );
    } catch (notificationError) {
      console.error(
        "Error creating document status notification:",
        notificationError
      );
      // Continue even if notification creation fails
    }

    res.status(200).json({
      success: true,
      message: "Document status updated",
      data: {
        document,
      },
    });
  } catch (error) {
    console.error("Error updating document status:", error);
    next(error);
  }
};

/**
 * Bulk update document statuses
 * @route PUT /api/admin/documents/bulk-update
 * @access Private/Admin
 */
const bulkUpdateDocuments = async (req, res, next) => {
  try {
    const { documents, status, notes } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No documents provided for bulk update",
      });
    }

    if (!status || !["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status provided",
      });
    }

    const results = {
      total: documents.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Process each document
    for (const doc of documents) {
      try {
        const { freelancerId, documentId } = doc;

        // Find freelancer
        const freelancer = await Freelancer.findById(freelancerId);

        if (!freelancer) {
          results.failed++;
          results.errors.push({
            freelancerId,
            documentId,
            error: "Freelancer not found",
          });
          continue;
        }

        // Find document
        const document = freelancer.verificationDocuments.id(documentId);

        if (!document) {
          results.failed++;
          results.errors.push({
            freelancerId,
            documentId,
            error: "Document not found",
          });
          continue;
        }

        // Update document status
        document.status = status;
        document.reviewedBy = req.user._id;
        document.reviewedAt = new Date();

        // Add notes if provided
        if (notes) {
          document.notes = notes;
        }

        // Save freelancer
        await freelancer.save();

        // Create notification for the freelancer
        try {
          await notificationService.notifyDocumentStatusUpdate(
            freelancer.user,
            req.user._id,
            document.documentType,
            status,
            notes
          );
        } catch (notificationError) {
          console.error(
            "Error creating document status notification:",
            notificationError
          );
          // Continue even if notification creation fails
        }

        results.successful++;
      } catch (error) {
        console.error("Error processing document:", error);
        results.failed++;
        results.errors.push({
          freelancerId: doc.freelancerId,
          documentId: doc.documentId,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk update completed: ${results.successful} successful, ${results.failed} failed`,
      data: results,
    });
  } catch (error) {
    console.error("Error in bulk document update:", error);
    next(error);
  }
};

/**
 * Send notification to freelancers
 * @route POST /api/admin/send-notification
 * @access Private/Admin
 */
const sendNotificationToFreelancers = async (req, res, next) => {
  try {
    const { recipients, title, message, notificationType, sendEmail, sendSMS } =
      req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No recipients provided",
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    const results = {
      total: recipients.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Process each recipient
    for (const recipientId of recipients) {
      try {
        // Check if user exists
        const user = await User.findById(recipientId);

        if (!user) {
          results.failed++;
          results.errors.push({
            recipientId,
            error: "User not found",
          });
          continue;
        }

        // Create notification
        await notificationService.createNotification({
          recipient: recipientId,
          sender: req.user._id,
          type:
            notificationType || config.NOTIFICATION_TYPES.ADMIN_NOTIFICATION,
          title,
          message,
          sendEmail: sendEmail || false,
          sendSMS: sendSMS || false,
          emailTemplate: config.EMAIL_TEMPLATES.SYSTEM_ALERT,
        });

        results.successful++;
      } catch (error) {
        console.error("Error sending notification:", error);
        results.failed++;
        results.errors.push({
          recipientId,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Notifications sent: ${results.successful} successful, ${results.failed} failed`,
      data: results,
    });
  } catch (error) {
    console.error("Error sending notifications:", error);
    next(error);
  }
};

module.exports = {
  getStats,
  getRecentUsers,
  getRecentProjects,
  getNotifications,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getPendingVerifications,
  verifyFreelancer,
  getAnalytics,
  getFreelancerDocument,
  updateDocumentStatus,
  bulkUpdateDocuments,
  sendNotificationToFreelancers,
};
