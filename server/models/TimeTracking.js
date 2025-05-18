const mongoose = require('mongoose');

const timeTrackingSessionSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // Duration in seconds
    required: true,
    min: [1, 'Duration must be at least 1 second']
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const timeTrackingSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Freelancer',
    required: true
  },
  totalSeconds: {
    type: Number,
    default: 0,
    min: 0
  },
  sessions: [timeTrackingSessionSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create a compound index for project and freelancer
timeTrackingSchema.index({ project: 1, freelancer: 1 }, { unique: true });

// Method to add a new session
timeTrackingSchema.methods.addSession = function(session) {
  this.sessions.push(session);
  this.totalSeconds += session.duration;
  this.lastUpdated = new Date();
  return this.save();
};

// Static method to get time tracking for a project and freelancer
timeTrackingSchema.statics.getTimeTracking = async function(projectId, freelancerId) {
  let timeTracking = await this.findOne({ 
    project: projectId, 
    freelancer: freelancerId 
  });
  
  if (!timeTracking) {
    timeTracking = await this.create({
      project: projectId,
      freelancer: freelancerId,
      totalSeconds: 0,
      sessions: []
    });
  }
  
  return timeTracking;
};

const TimeTracking = mongoose.model('TimeTracking', timeTrackingSchema);

module.exports = TimeTracking;
