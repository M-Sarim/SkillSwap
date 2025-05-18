/**
 * SMS Service - Mock implementation for Twilio SMS
 * This service provides a mock implementation of SMS functionality
 * In a production environment, this would be replaced with actual Twilio API calls
 */

const config = require('./config');

/**
 * Get SMS template based on template name
 * @param {string} templateName - Template name from config.SMS_TEMPLATES
 * @param {Object} data - Data for the template
 * @returns {string} - SMS message text
 */
const getSmsTemplate = (templateName, data) => {
  switch (templateName) {
    case config.SMS_TEMPLATES.VERIFICATION_CODE:
      return `SkillSwap: Your verification code is ${data.code}. This code will expire in 10 minutes.`;
    
    case config.SMS_TEMPLATES.BID_ACCEPTED:
      return `SkillSwap: Good news! Your bid for project "${data.projectTitle}" has been accepted. Log in to view details.`;
    
    case config.SMS_TEMPLATES.PAYMENT_RECEIVED:
      return `SkillSwap: You've received a payment of $${data.amount} for project "${data.projectTitle}". Log in to view details.`;
    
    case config.SMS_TEMPLATES.DOCUMENT_VERIFIED:
      return `SkillSwap: Your account has been verified with ${data.level} level. You now have access to additional features.`;
    
    case config.SMS_TEMPLATES.URGENT_NOTIFICATION:
      return `SkillSwap URGENT: ${data.message}`;
    
    default:
      return `SkillSwap: ${data.message || 'You have a new notification.'}`;
  }
};

/**
 * Send SMS message
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - SMS message text
 * @returns {Promise<Object>} - Mock response object
 */
const sendSms = async (phoneNumber, message) => {
  try {
    // In a real implementation, this would call the Twilio API
    console.log(`[MOCK SMS] To: ${phoneNumber}, Message: ${message}`);
    
    // Generate a mock SMS ID
    const smsId = `sms_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Return a mock response similar to Twilio's response format
    return {
      success: true,
      sid: smsId,
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER || '+15551234567',
      body: message,
      status: 'delivered',
      dateCreated: new Date().toISOString(),
      dateUpdated: new Date().toISOString(),
      errorCode: null,
      errorMessage: null
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      errorCode: error.code || 'UNKNOWN_ERROR',
      errorMessage: error.message || 'An unknown error occurred while sending SMS'
    };
  }
};

/**
 * Send SMS using template
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} templateName - Template name from config.SMS_TEMPLATES
 * @param {Object} data - Data for the template
 * @returns {Promise<Object>} - Mock response object
 */
const sendSmsWithTemplate = async (phoneNumber, templateName, data) => {
  const message = getSmsTemplate(templateName, data);
  return await sendSms(phoneNumber, message);
};

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - Whether the phone number is valid
 */
const isValidPhoneNumber = (phoneNumber) => {
  // Basic validation for international phone numbers
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
};

module.exports = {
  sendSms,
  sendSmsWithTemplate,
  isValidPhoneNumber
};
