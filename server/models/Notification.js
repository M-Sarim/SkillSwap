const mongoose = require("mongoose");
const config = require("../utils/config");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: Object.values(config.NOTIFICATION_TYPES),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    relatedBid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project.bids",
    },
    relatedContract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
    },
    relatedMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    actionLink: String,
    deliveryStatus: {
      inApp: {
        delivered: {
          type: Boolean,
          default: true,
        },
        deliveredAt: {
          type: Date,
          default: Date.now,
        },
      },
      email: {
        delivered: {
          type: Boolean,
          default: false,
        },
        deliveredAt: Date,
        emailId: String,
      },
      sms: {
        delivered: {
          type: Boolean,
          default: false,
        },
        deliveredAt: Date,
        smsId: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Method to mark notification as read
notificationSchema.methods.markAsRead = function () {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread notifications count
notificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({
    recipient: userId,
    read: false,
  });
};

// Static method to mark all notifications as read
notificationSchema.statics.markAllAsRead = async function (userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() }
  );
};

// Static method to create and send notification
notificationSchema.statics.createNotification = async function (data) {
  try {
    // Extract email and SMS specific data before creating the notification
    const {
      emailTemplate,
      emailData,
      smsTemplate,
      smsData,
      ...notificationData
    } = data;

    // Create the notification
    const notification = await this.create(notificationData);

    // Here you would implement the actual sending of email/SMS
    // For now, we'll use mock implementations

    // Mock email delivery
    if (data.sendEmail) {
      try {
        // In a real implementation, you would use a real email service
        // For now, we'll just log the email details and update the status
        console.log(
          `[MOCK EMAIL] Sending email to recipient ${notification.recipient}`
        );
        console.log(`[MOCK EMAIL] Template: ${emailTemplate || "default"}`);
        console.log(`[MOCK EMAIL] Data:`, emailData || data);

        // In a real implementation, you would get the email template and send it
        // const emailTemplateService = require('../utils/emailTemplateService');
        // const template = emailTemplateService.getEmailTemplate(emailTemplate, emailData || { name: 'User', ...data });
        // const emailService = require('../utils/emailService');
        // const result = await emailService.sendEmail(recipientEmail, template.subject, template.body);

        // Update delivery status
        notification.deliveryStatus.email.delivered = true;
        notification.deliveryStatus.email.deliveredAt = new Date();
        notification.deliveryStatus.email.emailId = `email_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 9)}`;
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
        // Don't throw the error to prevent disrupting the main flow
      }
    }

    // Mock SMS delivery
    if (data.sendSMS) {
      try {
        // In a real implementation, you would use a real SMS service like Twilio
        // For now, we'll just log the SMS details and update the status
        console.log(
          `[MOCK SMS] Sending SMS to recipient ${notification.recipient}`
        );
        console.log(`[MOCK SMS] Template: ${smsTemplate || "default"}`);
        console.log(`[MOCK SMS] Data:`, smsData || data);

        // In a real implementation, you would get the SMS template and send it
        // const smsService = require('../utils/smsService');
        // const message = smsService.getSmsTemplate(smsTemplate, smsData || data);
        // const result = await smsService.sendSms(recipientPhone, message);

        // Update delivery status
        notification.deliveryStatus.sms.delivered = true;
        notification.deliveryStatus.sms.deliveredAt = new Date();
        notification.deliveryStatus.sms.smsId = `sms_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 9)}`;
      } catch (smsError) {
        console.error("Error sending SMS notification:", smsError);
        // Don't throw the error to prevent disrupting the main flow
      }
    }

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
