const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Bid amount is required"],
      min: [0, "Bid amount cannot be negative"],
    },
    deliveryTime: {
      type: Number,
      required: [true, "Delivery time is required"],
      min: [1, "Delivery time must be at least 1 day"],
    },
    proposal: {
      type: String,
      required: [true, "Proposal is required"],
      trim: true,
      minlength: [50, "Proposal must be at least 50 characters"],
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Withdrawn", "Countered"],
      default: "Pending",
    },
    counterOffer: {
      amount: Number,
      deliveryTime: Number,
      message: String,
      date: Date,
    },
    attachments: [
      {
        filename: String,
        fileUrl: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    milestones: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          required: true,
          trim: true,
        },
        amount: {
          type: Number,
          required: true,
          min: [0, "Milestone amount cannot be negative"],
        },
        deliveryTime: {
          type: Number,
          required: true,
          min: [1, "Delivery time must be at least 1 day"],
        },
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get all bids for a project
bidSchema.statics.getProjectBids = async function (projectId) {
  return this.find({ project: projectId })
    .populate({
      path: "freelancer",
      populate: {
        path: "user",
        select: "name email profileImage",
      },
    })
    .sort({ createdAt: -1 });
};

// Static method to get all bids by a freelancer
bidSchema.statics.getFreelancerBids = async function (freelancerId) {
  try {
    console.log("Getting bids for freelancer:", freelancerId);

    // Add a timestamp to prevent caching
    const timestamp = new Date().getTime();

    const bids = await this.find({
      freelancer: freelancerId,
      // Add a query parameter to ensure we get fresh data
      _timestamp: { $exists: false }, // This is a dummy condition that doesn't affect results
    })
      .populate("project", "title budget deadline status category")
      .populate({
        path: "freelancer",
        select: "user",
        populate: {
          path: "user",
          select: "name email profileImage",
        },
      })
      .sort({ createdAt: -1 });

    console.log("Found bids:", bids.length);

    // Process bids to ensure counter offers are properly handled
    bids.forEach((bid) => {
      // If bid has a counter offer, make sure status is set to "Countered"
      if (
        bid.counterOffer &&
        bid.counterOffer.amount &&
        bid.status !== "Countered"
      ) {
        console.log(`Fixing status for bid ${bid._id} with counter offer`);
        bid.status = "Countered";
      }
    });

    return bids;
  } catch (error) {
    console.error("Error getting freelancer bids:", error);
    throw error;
  }
};

// Static method to get bid statistics
bidSchema.statics.getBidStats = async function (freelancerId) {
  const stats = await this.aggregate([
    { $match: { freelancer: new mongoose.Types.ObjectId(freelancerId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgAmount: { $avg: "$amount" },
      },
    },
  ]);

  // Format the results
  const formattedStats = {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
    countered: 0,
    avgAmount: 0,
  };

  let totalAmount = 0;
  let totalBids = 0;

  stats.forEach((stat) => {
    const status = stat._id;
    formattedStats[status.toLowerCase()] = stat.count;
    formattedStats.total += stat.count;
    totalAmount += stat.avgAmount * stat.count;
    totalBids += stat.count;
  });

  if (totalBids > 0) {
    formattedStats.avgAmount = totalAmount / totalBids;
  }

  return formattedStats;
};

const Bid = mongoose.model("Bid", bidSchema);

module.exports = Bid;
