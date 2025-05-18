const NotificationPreference = require('../../models/NotificationPreference');
const config = require('../../utils/config');

/**
 * Get notification preferences
 * @route GET /api/notify/preferences
 * @access Private
 */
const getPreferences = async (req, res, next) => {
  try {
    // Get or create notification preferences
    const preferences = await NotificationPreference.getOrCreatePreferences(req.user._id);
    
    res.status(200).json({
      success: true,
      data: {
        preferences
      }
    });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    next(error);
  }
};

/**
 * Update notification preferences
 * @route PUT /api/notify/preferences
 * @access Private
 */
const updatePreferences = async (req, res, next) => {
  try {
    const { preferences, phone } = req.body;
    
    // Update notification preferences
    const updatedPreferences = await NotificationPreference.updatePreferences(req.user._id, {
      preferences,
      phone
    });
    
    res.status(200).json({
      success: true,
      message: 'Notification preferences updated',
      data: {
        preferences: updatedPreferences
      }
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    next(error);
  }
};

/**
 * Get available notification types
 * @route GET /api/notify/types
 * @access Private
 */
const getNotificationTypes = async (req, res, next) => {
  try {
    // Get notification types from config
    const notificationTypes = Object.entries(config.NOTIFICATION_TYPES).map(([key, value]) => ({
      key,
      value,
      label: key
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ')
    }));
    
    res.status(200).json({
      success: true,
      data: {
        notificationTypes
      }
    });
  } catch (error) {
    console.error('Error getting notification types:', error);
    next(error);
  }
};

module.exports = {
  getPreferences,
  updatePreferences,
  getNotificationTypes
};
