const Finance = require("../../models/Finance");
const Project = require("../../models/Project");
const mongoose = require("mongoose");

/**
 * Get all financial transactions
 * @route GET /api/admin/finances
 * @access Private (Admin only)
 */
const getAllTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      startDate,
      endDate,
      client,
      freelancer,
      project,
      sort = "-createdAt",
    } = req.query;

    // Build query
    const query = {};

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Filter by client
    if (client) {
      query.client = mongoose.Types.ObjectId(client);
    }

    // Filter by freelancer
    if (freelancer) {
      query.freelancer = mongoose.Types.ObjectId(freelancer);
    }

    // Filter by project
    if (project) {
      query.project = mongoose.Types.ObjectId(project);
    }

    // Execute query with pagination
    const transactions = await Finance.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate("client", "user company")
      .populate("freelancer", "user")
      .populate("project", "title")
      .populate("createdBy", "name email");

    // Get total count
    const total = await Finance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transaction by ID
 * @route GET /api/admin/finances/:id
 * @access Private (Admin only)
 */
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Finance.findById(req.params.id)
      .populate("client", "user company")
      .populate({
        path: "client",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .populate("freelancer", "user")
      .populate({
        path: "freelancer",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .populate("project", "title client freelancer")
      .populate("createdBy", "name email");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new transaction
 * @route POST /api/admin/finances
 * @access Private (Admin only)
 */
const createTransaction = async (req, res, next) => {
  try {
    // Add the admin user as creator
    req.body.createdBy = req.user.id;

    const transaction = await Finance.create(req.body);

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update transaction status
 * @route PATCH /api/admin/finances/:id/status
 * @access Private (Admin only)
 */
const updateTransactionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const transaction = await Finance.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    transaction.status = status;

    if (status === "completed") {
      transaction.processedAt = new Date();
    }

    await transaction.save();

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get financial summary
 * @route GET /api/admin/finances/summary
 * @access Private (Admin only)
 */
const getFinancialSummary = async (req, res, next) => {
  try {
    const { period = "all" } = req.query;

    let startDate,
      endDate = new Date();

    // Set date range based on period
    switch (period) {
      case "today":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // Beginning of time
    }

    // Get completed projects for revenue calculation
    const completedProjects = await Project.find({ status: "Completed" });
    const completedProjectIds = completedProjects.map((project) => project._id);

    // Get total revenue (completed payments and fees from completed projects)
    const totalRevenue = await Finance.aggregate([
      {
        $match: {
          status: "completed",
          type: { $in: ["payment", "fee"] },
          project: { $in: completedProjectIds },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    // Get total withdrawals
    const totalWithdrawals = await Finance.aggregate([
      {
        $match: {
          status: "completed",
          type: "withdrawal",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    // Get total refunds
    const totalRefunds = await Finance.aggregate([
      {
        $match: {
          status: "completed",
          type: "refund",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    // Get total platform fees
    const totalFees = await Finance.aggregate([
      {
        $match: {
          status: "completed",
          type: "fee",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    // Get transactions by type
    const transactionsByType = await Finance.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        totalWithdrawals:
          totalWithdrawals.length > 0 ? totalWithdrawals[0].total : 0,
        totalRefunds: totalRefunds.length > 0 ? totalRefunds[0].total : 0,
        totalFees: totalFees.length > 0 ? totalFees[0].total : 0,
        netProfit:
          (totalRevenue.length > 0 ? totalRevenue[0].total : 0) -
          (totalWithdrawals.length > 0 ? totalWithdrawals[0].total : 0) -
          (totalRefunds.length > 0 ? totalRefunds[0].total : 0),
        transactionsByType,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransactionStatus,
  getFinancialSummary,
};
