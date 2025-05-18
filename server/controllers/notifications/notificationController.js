const Notification = require('../../models/Notification');
const User = require('../../models/User');
const nodemailer = require('nodemailer');
const config = require('../../utils/config');

/**
 * Get all notifications for the current user
 * @route GET /api/notify
 * @access Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, read } = req.query;
    
    // Build query
    const query = { recipient: req.user._id };
    
    if (read === 'true') {
      query.read = true;
    } else if (read === 'false') {
      query.read = false;
    }
    
    // Execute query
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('sender', 'name profileImage')
      .populate('relatedProject', 'title')
      .populate('relatedContract', 'title');
    
    // Get total count
    const count = await Notification.countDocuments(query);
    
    // Get unread count
    const unreadCount = await Notification.getUnreadCount(req.user._id);
    
    res.status(200).json({
      success: true,
      data: {
        notifications,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalNotifications: count,
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a notification as read
 * @route PUT /api/notify/:id/read
 * @access Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find notification
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Check if user is the recipient
    if (!notification.recipient.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to mark this notification as read'
      });
    }
    
    // Mark as read
    await notification.markAsRead();
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 * @route PUT /api/notify/read-all
 * @access Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    // Mark all as read
    await Notification.markAllAsRead(req.user._id);
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send email notification
 * @route POST /api/notify/email
 * @access Private (Admin only)
 */
const sendEmailNotification = async (req, res, next) => {
  try {
    const { recipients, subject, message, sendToAll } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can send mass email notifications'
      });
    }
    
    // Get recipients
    let users = [];
    
    if (sendToAll) {
      // Send to all users
      users = await User.find({}, 'email name');
    } else if (recipients && recipients.length > 0) {
      // Send to specific users
      users = await User.find({ _id: { $in: recipients } }, 'email name');
    } else {
      return res.status(400).json({
        success: false,
        message: 'No recipients specified'
      });
    }
    
    // Mock email sending
    // In a real app, you would use a proper email service
    console.log(`Sending email to ${users.length} users: ${subject}`);
    
    // Create notifications for each user
    const notifications = [];
    
    for (const user of users) {
      const notification = await Notification.createNotification({
        recipient: user._id,
        sender: req.user._id,
        type: 'admin_notification',
        title: subject,
        message,
        sendEmail: true
      });
      
      notifications.push(notification);
    }
    
    res.status(200).json({
      success: true,
      message: `Email notification sent to ${users.length} users`,
      data: {
        notificationCount: notifications.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send SMS notification (mock)
 * @route POST /api/notify/sms
 * @access Private (Admin only)
 */
const sendSmsNotification = async (req, res, next) => {
  try {
    const { recipients, message, sendToAll } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can send mass SMS notifications'
      });
    }
    
    // Get recipients
    let users = [];
    
    if (sendToAll) {
      // Send to all users with phone numbers
      users = await User.find({ phone: { $exists: true, $ne: null } }, 'phone name');
    } else if (recipients && recipients.length > 0) {
      // Send to specific users
      users = await User.find({ 
        _id: { $in: recipients },
        phone: { $exists: true, $ne: null }
      }, 'phone name');
    } else {
      return res.status(400).json({
        success: false,
        message: 'No recipients specified'
      });
    }
    
    // Mock SMS sending
    // In a real app, you would use a proper SMS service like Twilio
    console.log(`Sending SMS to ${users.length} users: ${message}`);
    
    // Create notifications for each user
    const notifications = [];
    
    for (const user of users) {
      const notification = await Notification.createNotification({
        recipient: user._id,
        sender: req.user._id,
        type: 'admin_notification',
        title: 'SMS Notification',
        message,
        sendSMS: true
      });
      
      notifications.push(notification);
    }
    
    res.status(200).json({
      success: true,
      message: `SMS notification sent to ${users.length} users`,
      data: {
        notificationCount: notifications.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update notification preferences
 * @route PUT /api/notify/preferences
 * @access Private
 */
const updateNotificationPreferences = async (req, res, next) => {
  try {
    const { email, sms, inApp } = req.body;
    
    // Find client or freelancer
    let profile;
    
    if (req.user.role === 'client') {
      const Client = require('../../models/Client');
      profile = await Client.findOne({ user: req.user._id });
    } else if (req.user.role === 'freelancer') {
      const Freelancer = require('../../models/Freelancer');
      profile = await Freelancer.findOne({ user: req.user._id });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user role'
      });
    }
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    // Update preferences
    profile.notificationPreferences = {
      email: email !== undefined ? email : profile.notificationPreferences?.email,
      sms: sms !== undefined ? sms : profile.notificationPreferences?.sms,
      inApp: inApp !== undefined ? inApp : profile.notificationPreferences?.inApp
    };
    
    await profile.save();
    
    res.status(200).json({
      success: true,
      message: 'Notification preferences updated',
      data: {
        notificationPreferences: profile.notificationPreferences
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  sendEmailNotification,
  sendSmsNotification,
  updateNotificationPreferences
};
