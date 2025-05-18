const mongoose = require("mongoose");

const portfolioItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Portfolio item title is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Portfolio item description is required"],
    trim: true,
  },
  imageUrl: String,
  projectUrl: String,
  technologies: [String],
  completionDate: Date,
});

const freelancerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    hourlyRate: {
      type: Number,
      min: [0, "Hourly rate cannot be negative"],
    },
    portfolio: [portfolioItemSchema],
    education: [
      {
        institution: String,
        degree: String,
        fieldOfStudy: String,
        from: Date,
        to: Date,
        current: Boolean,
        description: String,
      },
    ],
    experience: [
      {
        company: String,
        position: String,
        from: Date,
        to: Date,
        current: Boolean,
        description: String,
      },
    ],
    verified: {
      type: Boolean,
      default: false,
    },
    verificationLevel: {
      type: String,
      enum: ["None", "Basic", "Verified", "Premium"],
      default: "None",
    },
    verificationReview: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reviewedAt: Date,
      notes: String,
    },
    verificationDocuments: [
      {
        documentType: {
          type: String,
          required: [true, "Document type is required"],
        },
        documentUrl: String,
        originalName: String,
        mimeType: String,
        size: Number,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["Pending", "Approved", "Rejected"],
          default: "Pending",
        },
        notes: String,
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reviewedAt: Date,
        annotations: [
          {
            text: String,
            x: Number,
            y: Number,
            width: Number,
            height: Number,
            createdBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],
    availability: {
      type: String,
      enum: ["Full-time", "Part-time", "Weekends", "Not Available"],
      default: "Full-time",
    },
    completedProjects: {
      type: Number,
      default: 0,
    },
    ratings: [
      {
        client: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Client",
        },
        project: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project",
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: String,
        response: String,
        responseDate: Date,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
    },
    socialProfiles: {
      linkedin: String,
      github: String,
      website: String,
      twitter: String,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate average rating when a new rating is added
freelancerSchema.pre("save", function (next) {
  if (this.ratings && this.ratings.length > 0) {
    const totalRating = this.ratings.reduce(
      (sum, item) => sum + item.rating,
      0
    );
    this.averageRating = totalRating / this.ratings.length;
  }
  next();
});

const Freelancer = mongoose.model("Freelancer", freelancerSchema);

module.exports = Freelancer;
