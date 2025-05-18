const mongoose = require("mongoose");

/**
 * Finance schema for tracking all financial transactions in the platform
 */
const financeSchema = new mongoose.Schema(
  {
    // Transaction type (payment, withdrawal, refund, fee, etc.)
    type: {
      type: String,
      enum: [
        "payment",        // Client pays for a project
        "withdrawal",     // Freelancer withdraws earnings
        "refund",         // Refund to client
        "fee",            // Platform fee
        "bonus",          // Bonus payment
        "adjustment",     // Manual adjustment
        "escrow",         // Money held in escrow
        "escrow_release", // Money released from escrow
        "tax"             // Tax deduction
      ],
      required: [true, "Transaction type is required"]
    },
    
    // Amount of the transaction
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be at least 0.01"]
    },
    
    // Currency of the transaction
    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR"]
    },
    
    // Status of the transaction
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled", "refunded"],
      default: "pending"
    },
    
    // Description of the transaction
    description: {
      type: String,
      trim: true
    },
    
    // Related entities
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project"
    },
    
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client"
    },
    
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer"
    },
    
    // Payment details
    paymentMethod: {
      type: String,
      enum: ["credit_card", "paypal", "bank_transfer", "platform_credit", "other"],
    },
    
    paymentReference: {
      type: String,
      trim: true
    },
    
    // Fee details
    platformFee: {
      amount: {
        type: Number,
        default: 0
      },
      percentage: {
        type: Number,
        default: 0
      }
    },
    
    // Tax details
    tax: {
      amount: {
        type: Number,
        default: 0
      },
      percentage: {
        type: Number,
        default: 0
      },
      reference: String
    },
    
    // Milestone reference if applicable
    milestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project.milestones"
    },
    
    // For escrow transactions
    escrow: {
      releaseDate: Date,
      conditions: String,
      status: {
        type: String,
        enum: ["held", "released", "disputed", "cancelled"],
      }
    },
    
    // For refunds
    refund: {
      originalTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Finance"
      },
      reason: String
    },
    
    // Metadata for additional information
    metadata: {
      type: Map,
      of: String
    },
    
    // Processing dates
    processedAt: Date,
    
    // Created by (admin for manual transactions)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
financeSchema.index({ type: 1, status: 1 });
financeSchema.index({ client: 1 });
financeSchema.index({ freelancer: 1 });
financeSchema.index({ project: 1 });
financeSchema.index({ createdAt: 1 });

// Virtual for calculating the net amount (amount - fees - tax)
financeSchema.virtual('netAmount').get(function() {
  return this.amount - (this.platformFee?.amount || 0) - (this.tax?.amount || 0);
});

// Method to mark transaction as completed
financeSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.processedAt = new Date();
  return this.save();
};

// Method to mark transaction as failed
financeSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.description = this.description ? `${this.description}. Failed: ${reason}` : `Failed: ${reason}`;
  return this.save();
};

// Static method to get total revenue
financeSchema.statics.getTotalRevenue = async function() {
  const result = await this.aggregate([
    { $match: { status: 'completed', type: { $in: ['payment', 'fee'] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  return result.length > 0 ? result[0].total : 0;
};

// Static method to get revenue by period
financeSchema.statics.getRevenueByPeriod = async function(startDate, endDate) {
  return this.aggregate([
    { 
      $match: { 
        status: 'completed', 
        type: { $in: ['payment', 'fee'] },
        createdAt: { $gte: startDate, $lte: endDate }
      } 
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
};

const Finance = mongoose.model("Finance", financeSchema);

module.exports = Finance;
