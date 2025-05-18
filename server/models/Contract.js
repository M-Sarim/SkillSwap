const mongoose = require('mongoose');
const { hashData } = require('../utils/hash');

const contractSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Freelancer',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Contract title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Contract description is required'],
    trim: true
  },
  terms: {
    type: String,
    required: [true, 'Contract terms are required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Contract amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  startDate: {
    type: Date,
    required: [true, 'Contract start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'Contract end date is required']
  },
  paymentTerms: {
    type: String,
    required: [true, 'Payment terms are required'],
    trim: true
  },
  deliverables: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    dueDate: {
      type: Date,
      required: true
    }
  }],
  clientSignature: {
    signed: {
      type: Boolean,
      default: false
    },
    date: Date,
    ipAddress: String
  },
  freelancerSignature: {
    signed: {
      type: Boolean,
      default: false
    },
    date: Date,
    ipAddress: String
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending', 'Active', 'Completed', 'Terminated', 'Disputed'],
    default: 'Draft'
  },
  hash: String,
  versions: [{
    versionNumber: Number,
    changes: String,
    date: {
      type: Date,
      default: Date.now
    },
    hash: String
  }],
  attachments: [{
    filename: String,
    fileUrl: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  terminationReason: String,
  terminationDate: Date,
  disputeDetails: {
    reason: String,
    description: String,
    filedBy: {
      type: String,
      enum: ['client', 'freelancer']
    },
    filedDate: Date,
    status: {
      type: String,
      enum: ['Open', 'Under Review', 'Resolved', 'Closed'],
      default: 'Open'
    },
    resolution: String,
    resolutionDate: Date
  }
}, {
  timestamps: true
});

// Generate hash for contract before saving
contractSchema.pre('save', function(next) {
  // Generate hash only for new contracts or when terms change
  if (this.isNew || this.isModified('terms') || this.isModified('amount') || 
      this.isModified('startDate') || this.isModified('endDate') || 
      this.isModified('paymentTerms') || this.isModified('deliverables')) {
    
    // Create a string representation of the contract
    const contractString = JSON.stringify({
      project: this.project,
      client: this.client,
      freelancer: this.freelancer,
      title: this.title,
      description: this.description,
      terms: this.terms,
      amount: this.amount,
      startDate: this.startDate,
      endDate: this.endDate,
      paymentTerms: this.paymentTerms,
      deliverables: this.deliverables
    });
    
    // Generate hash
    this.hash = hashData(contractString);
    
    // Add to versions if not a new contract
    if (!this.isNew) {
      const versionNumber = this.versions.length + 1;
      this.versions.push({
        versionNumber,
        changes: 'Contract terms updated',
        date: new Date(),
        hash: this.hash
      });
    } else {
      // Initialize versions array for new contract
      this.versions = [{
        versionNumber: 1,
        changes: 'Contract created',
        date: new Date(),
        hash: this.hash
      }];
    }
  }
  
  // Update status based on signatures
  if (this.clientSignature.signed && this.freelancerSignature.signed) {
    if (this.status === 'Pending' || this.status === 'Draft') {
      this.status = 'Active';
    }
  } else if (this.clientSignature.signed || this.freelancerSignature.signed) {
    if (this.status === 'Draft') {
      this.status = 'Pending';
    }
  }
  
  next();
});

const Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;
