require("dotenv").config();

module.exports = {
  // Server configuration
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // MongoDB Atlas configuration
  MONGODB_URI:
    process.env.MONGODB_URI ||
    "mongodb+srv://username:password@cluster.mongodb.net/skillswap?retryWrites=true&w=majority",

  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || "skillswap_secret_key",
  JWT_EXPIRE: process.env.JWT_EXPIRE || "30d",

  // Bcrypt configuration
  BCRYPT_SALT_ROUNDS: 10,

  // Email configuration
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || "gmail",
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,

  // File upload configuration
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB

  // Notification settings
  NOTIFICATION_TYPES: {
    PROJECT_CREATED: "project_created",
    PROJECT_COMPLETED: "project_completed",
    BID_RECEIVED: "bid_received",
    BID_ACCEPTED: "bid_accepted",
    BID_REJECTED: "bid_rejected",
    MESSAGE_RECEIVED: "message_received",
    CONTRACT_CREATED: "contract_created",
    CONTRACT_SIGNED: "contract_signed",
    MILESTONE_COMPLETED: "milestone_completed",
    PAYMENT_RECEIVED: "payment_received",
    FREELANCER_VERIFIED: "freelancer_verified",
    ADMIN_NOTIFICATION: "admin_notification",
    USER_REGISTERED: "user_registered",
    VERIFICATION_REQUEST: "verification_request",
    DOCUMENT_STATUS_UPDATED: "document_status_updated",
    UPLOAD_VERIFICATION_DOCUMENTS: "upload_verification_documents",
    VERIFICATION_LEVEL_CHANGED: "verification_level_changed",
    SCHEDULED_NOTIFICATION: "scheduled_notification",
    DISPUTE_OPENED: "dispute_opened",
    DISPUTE_RESOLVED: "dispute_resolved",
    SYSTEM_ALERT: "system_alert",
    DOCUMENT_ANNOTATION: "document_annotation",
  },

  // Email templates
  EMAIL_TEMPLATES: {
    WELCOME: "welcome",
    VERIFICATION: "verification",
    PASSWORD_RESET: "password_reset",
    BID_NOTIFICATION: "bid_notification",
    PROJECT_UPDATE: "project_update",
    PAYMENT_CONFIRMATION: "payment_confirmation",
    DOCUMENT_STATUS: "document_status",
    UPLOAD_DOCUMENTS: "upload_documents",
    VERIFICATION_STATUS: "verification_status",
    DISPUTE_NOTIFICATION: "dispute_notification",
    SCHEDULED_REMINDER: "scheduled_reminder",
    SYSTEM_ALERT: "system_alert",
  },

  // SMS templates
  SMS_TEMPLATES: {
    VERIFICATION_CODE: "verification_code",
    BID_ACCEPTED: "bid_accepted",
    PAYMENT_RECEIVED: "payment_received",
    DOCUMENT_VERIFIED: "document_verified",
    URGENT_NOTIFICATION: "urgent_notification",
  },

  // Verification levels and requirements
  VERIFICATION_LEVELS: {
    NONE: {
      name: "None",
      requiredDocuments: 0,
      features: ["Basic project browsing", "Limited bids per month"],
    },
    BASIC: {
      name: "Basic",
      requiredDocuments: 1,
      features: [
        "Unlimited bids",
        "Basic profile visibility",
        "Standard support",
      ],
    },
    VERIFIED: {
      name: "Verified",
      requiredDocuments: 2,
      features: ["Verified badge", "Higher search ranking", "Priority support"],
    },
    PREMIUM: {
      name: "Premium",
      requiredDocuments: 3,
      features: [
        "Premium badge",
        "Top search ranking",
        "Featured profile",
        "24/7 support",
      ],
    },
  },
};
