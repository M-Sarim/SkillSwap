const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Milestone title is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Milestone description is required"],
    trim: true,
  },
  dueDate: {
    type: Date,
    required: [true, "Milestone due date is required"],
  },
  amount: {
    type: Number,
    required: [true, "Milestone amount is required"],
    min: [0, "Amount cannot be negative"],
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed", "Approved", "Rejected"],
    default: "Pending",
  },
  completionDate: Date,
  feedback: String,
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
});

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
    },
    category: {
      type: String,
      required: [true, "Project category is required"],
      trim: true,
    },
    skills: {
      type: [String],
      required: [true, "At least one skill is required"],
    },
    budget: {
      type: Number,
      required: [true, "Project budget is required"],
      min: [0, "Budget cannot be negative"],
    },
    deadline: {
      type: Date,
      required: [true, "Project deadline is required"],
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Completed", "Cancelled"],
      default: "Open",
    },
    paymentType: {
      type: String,
      enum: ["Fixed", "Hourly"],
      default: "Fixed",
    },
    bids: [
      {
        freelancer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Freelancer",
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: [0, "Bid amount cannot be negative"],
        },
        deliveryTime: {
          type: Number,
          required: true,
          min: [1, "Delivery time must be at least 1 day"],
        },
        proposal: {
          type: String,
          required: true,
          trim: true,
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
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    milestones: [milestoneSchema],
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
    startDate: Date,
    completionDate: Date,
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate project progress based on milestones
projectSchema.methods.calculateProgress = function () {
  if (!this.milestones || this.milestones.length === 0) {
    return 0;
  }

  const completedMilestones = this.milestones.filter((milestone) =>
    ["Completed", "Approved"].includes(milestone.status)
  ).length;

  return Math.round((completedMilestones / this.milestones.length) * 100);
};

// Update project progress before saving
projectSchema.pre("save", function (next) {
  if (this.milestones && this.milestones.length > 0) {
    this.progress = this.calculateProgress();
  }

  // Update status based on progress
  if (this.progress === 100 && this.status !== "Completed") {
    this.status = "Completed";
    this.completionDate = new Date();
  } else if (
    this.progress > 0 &&
    this.progress < 100 &&
    this.status === "Open"
  ) {
    this.status = "In Progress";
    if (!this.startDate) {
      this.startDate = new Date();
    }
  }

  next();
});

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
