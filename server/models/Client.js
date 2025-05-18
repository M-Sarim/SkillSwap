const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  completedProjects: {
    type: Number,
    default: 0
  },
  activeProjects: {
    type: Number,
    default: 0
  },
  paymentMethods: [{
    type: {
      type: String,
      enum: ['Credit Card', 'PayPal', 'Bank Transfer'],
      required: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    // We'll store a reference to the payment method, not the actual details for security
    reference: {
      type: String,
      required: true
    }
  }],
  preferredCategories: [String],
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    inApp: {
      type: Boolean,
      default: true
    }
  },
  ratings: [{
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Freelancer'
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate average rating when a new rating is added
clientSchema.pre('save', function(next) {
  if (this.ratings && this.ratings.length > 0) {
    const totalRating = this.ratings.reduce((sum, item) => sum + item.rating, 0);
    this.averageRating = totalRating / this.ratings.length;
  }
  next();
});

// Update project counts
clientSchema.methods.updateProjectCounts = async function() {
  const Project = mongoose.model('Project');
  
  const completedCount = await Project.countDocuments({
    client: this._id,
    status: 'Completed'
  });
  
  const activeCount = await Project.countDocuments({
    client: this._id,
    status: { $in: ['Open', 'In Progress'] }
  });
  
  this.completedProjects = completedCount;
  this.activeProjects = activeCount;
  
  return this.save();
};

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
