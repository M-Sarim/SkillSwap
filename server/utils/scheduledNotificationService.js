/**
 * Scheduled Notification Service
 * This service provides functionality for scheduling notifications to be sent at a later time
 * It uses a simple in-memory queue for demonstration purposes
 * In a production environment, this would be replaced with a more robust solution like a message queue
 */

const notificationService = require('./notificationService');
const smsService = require('./smsService');
const config = require('./config');

// In-memory queue for scheduled notifications
// In a real application, this would be stored in a database
const scheduledNotifications = [];

/**
 * Schedule a notification to be sent at a later time
 * @param {Object} notificationData - Notification data
 * @param {Date} scheduledTime - Time to send the notification
 * @returns {string} - ID of the scheduled notification
 */
const scheduleNotification = (notificationData, scheduledTime) => {
  // Generate a unique ID for the scheduled notification
  const id = `sched_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Add to queue
  scheduledNotifications.push({
    id,
    notificationData,
    scheduledTime,
    status: 'pending'
  });
  
  console.log(`Scheduled notification ${id} for ${scheduledTime}`);
  
  return id;
};

/**
 * Cancel a scheduled notification
 * @param {string} id - ID of the scheduled notification
 * @returns {boolean} - Whether the notification was successfully cancelled
 */
const cancelScheduledNotification = (id) => {
  const index = scheduledNotifications.findIndex(n => n.id === id);
  
  if (index === -1) {
    return false;
  }
  
  // Mark as cancelled
  scheduledNotifications[index].status = 'cancelled';
  console.log(`Cancelled scheduled notification ${id}`);
  
  return true;
};

/**
 * Process scheduled notifications that are due
 * This function would typically be called by a cron job or scheduler
 * @returns {Promise<Array>} - Results of processed notifications
 */
const processScheduledNotifications = async () => {
  const now = new Date();
  const results = [];
  
  for (const notification of scheduledNotifications) {
    // Skip if not pending or not due yet
    if (notification.status !== 'pending' || notification.scheduledTime > now) {
      continue;
    }
    
    try {
      // Mark as processing
      notification.status = 'processing';
      
      // Send notification
      const result = await notificationService.createNotification({
        ...notification.notificationData,
        type: config.NOTIFICATION_TYPES.SCHEDULED_NOTIFICATION,
      });
      
      // Mark as sent
      notification.status = 'sent';
      notification.sentAt = new Date();
      notification.result = result;
      
      results.push({
        id: notification.id,
        success: true,
        result
      });
    } catch (error) {
      console.error(`Error processing scheduled notification ${notification.id}:`, error);
      
      // Mark as failed
      notification.status = 'failed';
      notification.error = error.message;
      
      results.push({
        id: notification.id,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};

/**
 * Schedule a reminder notification
 * @param {string} userId - User ID to send the reminder to
 * @param {string} title - Reminder title
 * @param {string} message - Reminder message
 * @param {Date} reminderTime - Time to send the reminder
 * @param {Object} options - Additional options
 * @returns {string} - ID of the scheduled notification
 */
const scheduleReminder = (userId, title, message, reminderTime, options = {}) => {
  const { actionLink, sendEmail = true, sendSMS = false } = options;
  
  return scheduleNotification({
    recipient: userId,
    title,
    message,
    actionLink,
    sendEmail,
    sendSMS,
    emailTemplate: config.EMAIL_TEMPLATES.SCHEDULED_REMINDER
  }, reminderTime);
};

module.exports = {
  scheduleNotification,
  cancelScheduledNotification,
  processScheduledNotifications,
  scheduleReminder
};
