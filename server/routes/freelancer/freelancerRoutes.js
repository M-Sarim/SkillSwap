const express = require("express");
const { body } = require("express-validator");
const freelancerController = require("../../controllers/freelancer/freelancerController");
const documentController = require("../../controllers/freelancer/documentController");
const { protect, authorize } = require("../../middleware/auth");
const validate = require("../../middleware/validation");
const fileUpload = require("express-fileupload");

const router = express.Router();

// All routes require authentication and freelancer role
router.use(protect);
router.use(authorize("freelancer"));

// Get freelancer profile
router.get("/profile", freelancerController.getFreelancerProfile);

// Update freelancer profile
router.put(
  "/profile",
  [
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
    body("phone")
      .optional()
      .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
      .withMessage("Please provide a valid phone number"),
    body("bio")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Bio cannot exceed 500 characters"),
    body("hourlyRate")
      .optional()
      .isNumeric()
      .withMessage("Hourly rate must be a number"),
    validate,
  ],
  freelancerController.updateFreelancerProfile
);

// Get freelancer analytics
router.get("/analytics", freelancerController.getFreelancerAnalytics);

// Document management routes
// Upload documents
router.post(
  "/documents",
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    abortOnLimit: true,
    createParentPath: true,
  }),
  documentController.uploadDocuments
);

// Get documents
router.get("/documents", documentController.getDocuments);

// Delete document
router.delete("/documents/:id", documentController.deleteDocument);

module.exports = router;
