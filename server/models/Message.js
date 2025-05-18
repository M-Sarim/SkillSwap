const mongoose = require('mongoose');
const { hashMessageMetadata } = require('../utils/hash');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  readStatus: {
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: Date
  },
  attachments: [{
    filename: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    type: String, // Hashed metadata for privacy
    select: false // Don't return metadata in queries by default
  },
  originalMetadata: {
    type: Object,
    select: false // Don't return original metadata in queries by default
  }
}, {
  timestamps: true
});

// Hash metadata before saving
messageSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('originalMetadata')) {
    // Create metadata object with sensitive information
    this.originalMetadata = {
      ipAddress: this.originalMetadata?.ipAddress,
      userAgent: this.originalMetadata?.userAgent,
      location: this.originalMetadata?.location,
      deviceInfo: this.originalMetadata?.deviceInfo
    };
    
    // Hash the metadata
    this.metadata = hashMessageMetadata(this.originalMetadata);
  }
  
  next();
});

// Method to mark message as read
messageSchema.methods.markAsRead = function() {
  this.readStatus.isRead = true;
  this.readStatus.readAt = new Date();
  return this.save();
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = async function(user1Id, user2Id, limit = 50, skip = 0) {
  return this.find({
    $or: [
      { sender: user1Id, receiver: user2Id },
      { sender: user2Id, receiver: user1Id }
    ]
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('sender', 'name profileImage')
  .populate('receiver', 'name profileImage');
};

// Static method to get unread messages count
messageSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    receiver: userId,
    'readStatus.isRead': false
  });
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
