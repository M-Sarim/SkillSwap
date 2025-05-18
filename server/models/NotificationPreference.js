const mongoose = require('mongoose');
const config = require('../utils/config');

const notificationPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  preferences: {
    inApp: {
      enabled: {
        type: Boolean,
        default: true
      },
      types: {
        type: Object,
        default: () => {
          // Create an object with all notification types enabled by default
          const types = {};
          Object.values(config.NOTIFICATION_TYPES).forEach(type => {
            types[type] = true;
          });
          return types;
        }
      }
    },
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      types: {
        type: Object,
        default: () => {
          // Create an object with all notification types enabled by default
          const types = {};
          Object.values(config.NOTIFICATION_TYPES).forEach(type => {
            types[type] = true;
          });
          return types;
        }
      }
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      types: {
        type: Object,
        default: () => {
          // Create an object with all notification types enabled by default
          const types = {};
          Object.values(config.NOTIFICATION_TYPES).forEach(type => {
            types[type] = false;
          });
          // Enable only important notifications for SMS by default
          types[config.NOTIFICATION_TYPES.BID_ACCEPTED] = true;
          types[config.NOTIFICATION_TYPES.PAYMENT_RECEIVED] = true;
          types[config.NOTIFICATION_TYPES.CONTRACT_SIGNED] = true;
          return types;
        }
      }
    }
  },
  // User's phone number for SMS notifications
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  }
}, {
  timestamps: true
});

// Static method to get or create notification preferences for a user
notificationPreferenceSchema.statics.getOrCreatePreferences = async function(userId) {
  let preferences = await this.findOne({ user: userId });
  
  if (!preferences) {
    preferences = await this.create({
      user: userId
    });
  }
  
  return preferences;
};

// Static method to update notification preferences for a user
notificationPreferenceSchema.statics.updatePreferences = async function(userId, updates) {
  const preferences = await this.findOne({ user: userId });
  
  if (!preferences) {
    return this.create({
      user: userId,
      ...updates
    });
  }
  
  // Update preferences
  if (updates.preferences) {
    // Update in-app preferences
    if (updates.preferences.inApp) {
      if (updates.preferences.inApp.enabled !== undefined) {
        preferences.preferences.inApp.enabled = updates.preferences.inApp.enabled;
      }
      
      if (updates.preferences.inApp.types) {
        Object.keys(updates.preferences.inApp.types).forEach(type => {
          preferences.preferences.inApp.types[type] = updates.preferences.inApp.types[type];
        });
      }
    }
    
    // Update email preferences
    if (updates.preferences.email) {
      if (updates.preferences.email.enabled !== undefined) {
        preferences.preferences.email.enabled = updates.preferences.email.enabled;
      }
      
      if (updates.preferences.email.types) {
        Object.keys(updates.preferences.email.types).forEach(type => {
          preferences.preferences.email.types[type] = updates.preferences.email.types[type];
        });
      }
    }
    
    // Update SMS preferences
    if (updates.preferences.sms) {
      if (updates.preferences.sms.enabled !== undefined) {
        preferences.preferences.sms.enabled = updates.preferences.sms.enabled;
      }
      
      if (updates.preferences.sms.types) {
        Object.keys(updates.preferences.sms.types).forEach(type => {
          preferences.preferences.sms.types[type] = updates.preferences.sms.types[type];
        });
      }
    }
  }
  
  // Update phone number
  if (updates.phone) {
    preferences.phone = updates.phone;
  }
  
  return preferences.save();
};

const NotificationPreference = mongoose.model('NotificationPreference', notificationPreferenceSchema);

module.exports = NotificationPreference;
