const express = require("express");
const { body, param } = require("express-validator");
const notificationController = require("../../controllers/notifications/notificationController");
const preferenceController = require("../../controllers/notifications/preferenceController");
const { protect, authorize } = require("../../middleware/auth");
const validate = require("../../middleware/validation");

const router = express.Router();

// Get all notifications for the current user
router.get("/", protect, notificationController.getNotifications);

// Mark a notification as read
router.put(
  "/:id/read",
  protect,
  [param("id").isMongoId().withMessage("Invalid notification ID"), validate],
  notificationController.markAsRead
);

// Mark all notifications as read
router.put("/read-all", protect, notificationController.markAllAsRead);

// Send email notification
router.post(
  "/email",
  protect,
  authorize("admin"),
  [
    body("subject").trim().notEmpty().withMessage("Subject is required"),
    body("message").trim().notEmpty().withMessage("Message is required"),
    body("recipients")
      .optional()
      .isArray()
      .withMessage("Recipients must be an array"),
    body("sendToAll")
      .optional()
      .isBoolean()
      .withMessage("sendToAll must be a boolean"),
    validate,
  ],
  notificationController.sendEmailNotification
);

// Send SMS notification
router.post(
  "/sms",
  protect,
  authorize("admin"),
  [
    body("message").trim().notEmpty().withMessage("Message is required"),
    body("recipients")
      .optional()
      .isArray()
      .withMessage("Recipients must be an array"),
    body("sendToAll")
      .optional()
      .isBoolean()
      .withMessage("sendToAll must be a boolean"),
    validate,
  ],
  notificationController.sendSmsNotification
);

// Get notification preferences
router.get("/preferences", protect, preferenceController.getPreferences);

// Update notification preferences
router.put(
  "/preferences",
  protect,
  [
    body("preferences")
      .optional()
      .isObject()
      .withMessage("Preferences must be an object"),
    body("phone")
      .optional()
      .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
      .withMessage("Please provide a valid phone number"),
    validate,
  ],
  preferenceController.updatePreferences
);

// Get available notification types
router.get("/types", protect, preferenceController.getNotificationTypes);

module.exports = router;
