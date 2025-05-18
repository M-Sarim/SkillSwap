const express = require("express");
const { body } = require("express-validator");
const authController = require("../../controllers/auth/authController");
const { protect } = require("../../middleware/auth");
const validate = require("../../middleware/validation");

const router = express.Router();

// Register user
router.post(
  "/register",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("role")
      .optional()
      .isIn(["client", "freelancer"])
      .withMessage("Role must be either client or freelancer"),
    body("phone")
      .optional()
      .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
      .withMessage("Please provide a valid phone number"),
    validate,
  ],
  authController.register
);

// Login user
router.post(
  "/login",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email"),
    body("password").trim().notEmpty().withMessage("Password is required"),
    validate,
  ],
  authController.login
);

// Verify email
router.get("/verify/:token", authController.verifyEmail);

// Forgot password
router.post(
  "/forgot-password",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email"),
    validate,
  ],
  authController.forgotPassword
);

// Reset password
router.post(
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    validate,
  ],
  authController.resetPassword
);

// Get current user
router.get("/me", protect, authController.getCurrentUser);

// Update profile
router.put(
  "/profile",
  protect,
  [
    // Basic user fields
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("phone")
      .optional()
      .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
      .withMessage("Please provide a valid phone number"),
    body("profileImage")
      .optional()
      .isURL()
      .withMessage("Profile image must be a valid URL"),

    // Client-specific fields
    body("company")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Company name cannot exceed 100 characters"),
    body("position")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Position cannot exceed 100 characters"),
    body("website")
      .optional()
      .isURL()
      .withMessage("Website must be a valid URL"),
    body("location")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Location cannot exceed 100 characters"),
    body("bio")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Bio cannot exceed 500 characters"),

    // Freelancer-specific fields
    body("skills").optional().isArray().withMessage("Skills must be an array"),
    body("hourlyRate")
      .optional()
      .isNumeric()
      .withMessage("Hourly rate must be a number")
      .custom((value) => value >= 0)
      .withMessage("Hourly rate cannot be negative"),
    body("portfolio")
      .optional()
      .isArray()
      .withMessage("Portfolio must be an array"),
    body("education")
      .optional()
      .isArray()
      .withMessage("Education must be an array"),
    body("experience")
      .optional()
      .isArray()
      .withMessage("Experience must be an array"),
    body("availability")
      .optional()
      .isIn(["Full-time", "Part-time", "Weekends", "Not Available"])
      .withMessage("Invalid availability option"),
    body("socialProfiles")
      .optional()
      .isObject()
      .withMessage("Social profiles must be an object"),

    validate,
  ],
  authController.updateProfile
);

// Change password
router.put(
  "/change-password",
  protect,
  [
    body("currentPassword")
      .trim()
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .trim()
      .notEmpty()
      .withMessage("New password is required")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters"),
    validate,
  ],
  authController.changePassword
);

module.exports = router;
