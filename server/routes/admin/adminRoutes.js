const express = require("express");
const { body, param } = require("express-validator");
const adminController = require("../../controllers/admin/adminController");
const dbController = require("../../controllers/admin/dbController");
const documentController = require("../../controllers/admin/documentController");
const financeRoutes = require("./financeRoutes");
const { protect, authorize } = require("../../middleware/auth");
const { isAdmin } = require("../../middleware/roleCheck");
const validate = require("../../middleware/validation");
const config = require("../../utils/config");

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize("admin"));

// Use finance routes
router.use("/finances", financeRoutes);

// Get admin dashboard stats
router.get("/stats", adminController.getStats);

// Get recent users
router.get("/recent-users", adminController.getRecentUsers);

// Get recent projects
router.get("/recent-projects", adminController.getRecentProjects);

// Get admin notifications
router.get("/notifications", adminController.getNotifications);

// Get all users
router.get("/users", adminController.getAllUsers);

// Get user by ID
router.get(
  "/users/:id",
  [param("id").isMongoId().withMessage("Invalid user ID"), validate],
  adminController.getUserById
);

// Update user
router.put(
  "/users/:id",
  [
    param("id").isMongoId().withMessage("Invalid user ID"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("email")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email"),
    body("role")
      .optional()
      .isIn(["client", "freelancer", "admin"])
      .withMessage("Role must be either client, freelancer, or admin"),
    body("isVerified")
      .optional()
      .isBoolean()
      .withMessage("isVerified must be a boolean"),
    body("status")
      .optional()
      .isIn(["active", "inactive"])
      .withMessage("Status must be either active or inactive"),
    validate,
  ],
  adminController.updateUser
);

// Delete user
router.delete(
  "/users/:id",
  [param("id").isMongoId().withMessage("Invalid user ID"), validate],
  adminController.deleteUser
);

// Get freelancers pending verification
router.get("/verify-freelancers", adminController.getPendingVerifications);

// Verify freelancer
router.put(
  "/verify-freelancers/:id",
  [
    param("id").isMongoId().withMessage("Invalid freelancer ID"),
    body("verified").isBoolean().withMessage("Verified must be a boolean"),
    body("verificationLevel")
      .optional()
      .isIn(["None", "Basic", "Verified", "Premium"])
      .withMessage("Invalid verification level"),
    body("notes").optional().isString().withMessage("Notes must be a string"),
    validate,
  ],
  adminController.verifyFreelancer
);

// Get analytics data
router.get("/analytics", adminController.getAnalytics);

// Get freelancer document
router.get(
  "/documents/:freelancerId/:documentId",
  [
    param("freelancerId").isMongoId().withMessage("Invalid freelancer ID"),
    param("documentId").isMongoId().withMessage("Invalid document ID"),
    validate,
  ],
  adminController.getFreelancerDocument
);

// Update document status
router.put(
  "/documents/:freelancerId/:documentId",
  [
    param("freelancerId").isMongoId().withMessage("Invalid freelancer ID"),
    param("documentId").isMongoId().withMessage("Invalid document ID"),
    body("status")
      .isIn(["Pending", "Approved", "Rejected"])
      .withMessage("Status must be either Pending, Approved, or Rejected"),
    body("notes").optional().isString().withMessage("Notes must be a string"),
    validate,
  ],
  adminController.updateDocumentStatus
);

// Get verification levels
router.get("/verification-levels", (req, res) => {
  res.status(200).json({
    success: true,
    data: config.VERIFICATION_LEVELS,
  });
});

// Bulk update document statuses
router.put(
  "/documents/bulk-update",
  [
    body("documents")
      .isArray()
      .withMessage("Documents must be an array")
      .notEmpty()
      .withMessage("Documents array cannot be empty"),
    body("status")
      .isIn(["Pending", "Approved", "Rejected"])
      .withMessage("Status must be either Pending, Approved, or Rejected"),
    body("notes").optional().isString().withMessage("Notes must be a string"),
    validate,
  ],
  adminController.bulkUpdateDocuments
);

// Send notification to freelancers
router.post(
  "/send-notification",
  [
    body("recipients")
      .isArray()
      .withMessage("Recipients must be an array")
      .notEmpty()
      .withMessage("Recipients array cannot be empty"),
    body("title").notEmpty().withMessage("Title is required"),
    body("message").notEmpty().withMessage("Message is required"),
    body("notificationType")
      .optional()
      .isString()
      .withMessage("Notification type must be a string"),
    body("sendEmail")
      .optional()
      .isBoolean()
      .withMessage("sendEmail must be a boolean"),
    body("sendSMS")
      .optional()
      .isBoolean()
      .withMessage("sendSMS must be a boolean"),
    validate,
  ],
  adminController.sendNotificationToFreelancers
);

// Document management routes
router.get("/documents", documentController.getAllDocuments);

// Document annotations
router.post(
  "/documents/:freelancerId/:documentId/annotations",
  [
    param("freelancerId").isMongoId().withMessage("Invalid freelancer ID"),
    param("documentId").isMongoId().withMessage("Invalid document ID"),
    body("text").notEmpty().withMessage("Annotation text is required"),
    body("x").isNumeric().withMessage("X coordinate must be a number"),
    body("y").isNumeric().withMessage("Y coordinate must be a number"),
    body("width").optional().isNumeric().withMessage("Width must be a number"),
    body("height")
      .optional()
      .isNumeric()
      .withMessage("Height must be a number"),
    validate,
  ],
  documentController.addAnnotation
);

router.get(
  "/documents/:freelancerId/:documentId/annotations",
  [
    param("freelancerId").isMongoId().withMessage("Invalid freelancer ID"),
    param("documentId").isMongoId().withMessage("Invalid document ID"),
    validate,
  ],
  documentController.getAnnotations
);

router.delete(
  "/documents/:freelancerId/:documentId/annotations/:annotationId",
  [
    param("freelancerId").isMongoId().withMessage("Invalid freelancer ID"),
    param("documentId").isMongoId().withMessage("Invalid document ID"),
    param("annotationId").isMongoId().withMessage("Invalid annotation ID"),
    validate,
  ],
  documentController.deleteAnnotation
);

// Database management routes
// Get database status
router.get("/db/status", dbController.getDbStatus);

// Create database backup
router.post("/db/backup", dbController.createDbBackup);

// Restore database from backup
router.post(
  "/db/restore",
  [
    body("backupPath").notEmpty().withMessage("Backup path is required"),
    validate,
  ],
  dbController.restoreDbBackup
);

// List database backups
router.get("/db/backups", dbController.listDbBackups);

module.exports = router;
