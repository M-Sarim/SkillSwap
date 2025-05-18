const express = require("express");
const { body, param, query } = require("express-validator");
const projectController = require("../../controllers/projects/projectController");
const bidController = require("../../controllers/projects/bidController");
const contractController = require("../../controllers/projects/contractController");
const reviewController = require("../../controllers/projects/reviewController");
const timeTrackingController = require("../../controllers/projects/timeTrackingController");
const { protect, authorize } = require("../../middleware/auth");
const {
  isClient,
  isFreelancer,
  isProjectOwner,
} = require("../../middleware/roleCheck");
const validate = require("../../middleware/validation");

const router = express.Router();

// Get all projects
router.get("/", projectController.getAllProjects);

// Get project by ID
router.get("/:id", projectController.getProjectById);

// Create project
router.post(
  "/",
  protect,
  authorize("client"),
  [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Title is required")
      .isLength({ min: 5, max: 100 })
      .withMessage("Title must be between 5 and 100 characters"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ min: 20 })
      .withMessage("Description must be at least 20 characters"),
    body("category").trim().notEmpty().withMessage("Category is required"),
    body("skills")
      .isArray({ min: 1 })
      .withMessage("At least one skill is required"),
    body("budget")
      .isNumeric()
      .withMessage("Budget must be a number")
      .custom((value) => value >= 0)
      .withMessage("Budget cannot be negative"),
    body("deadline")
      .notEmpty()
      .withMessage("Deadline is required")
      .isISO8601()
      .withMessage("Deadline must be a valid date")
      .custom((value) => new Date(value) > new Date())
      .withMessage("Deadline must be in the future"),
    body("paymentType")
      .optional()
      .isIn(["Fixed", "Hourly"])
      .withMessage("Payment type must be either Fixed or Hourly"),
    validate,
  ],
  projectController.createProject
);

// Update project
router.put(
  "/:id",
  protect,
  authorize("client"),
  [
    param("id").isMongoId().withMessage("Invalid project ID"),
    body("title")
      .optional()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage("Title must be between 5 and 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 20 })
      .withMessage("Description must be at least 20 characters"),
    body("budget")
      .optional()
      .isNumeric()
      .withMessage("Budget must be a number")
      .custom((value) => value >= 0)
      .withMessage("Budget cannot be negative"),
    body("deadline")
      .optional()
      .isISO8601()
      .withMessage("Deadline must be a valid date")
      .custom((value) => new Date(value) > new Date())
      .withMessage("Deadline must be in the future"),
    body("status")
      .optional()
      .isIn(["Open", "In Progress", "Completed", "Cancelled"])
      .withMessage("Invalid status"),
    validate,
  ],
  projectController.updateProject
);

// Delete project
router.delete(
  "/:id",
  protect,
  authorize("client"),
  [param("id").isMongoId().withMessage("Invalid project ID"), validate],
  projectController.deleteProject
);

// Get client's projects
router.get(
  "/client/projects",
  protect,
  authorize("client"),
  projectController.getClientProjects
);

// Get client stats
router.get(
  "/client/stats",
  protect,
  authorize("client"),
  projectController.getClientStats
);

// Get client recent bids
router.get(
  "/client/recent-bids",
  protect,
  authorize("client"),
  bidController.getClientRecentBids
);

// Get client analytics
router.get(
  "/client/analytics",
  protect,
  authorize("client"),
  projectController.getClientAnalytics
);

// Get freelancer's projects
router.get(
  "/freelancer/projects",
  protect,
  authorize("freelancer"),
  projectController.getFreelancerProjects
);

// Get freelancer stats
router.get(
  "/freelancer/stats",
  protect,
  authorize("freelancer"),
  projectController.getFreelancerStats
);

// Get freelancer analytics
router.get(
  "/freelancer/analytics",
  protect,
  authorize("freelancer"),
  projectController.getFreelancerAnalytics
);

// Mark project as complete (freelancer)
router.put(
  "/:id/complete",
  protect,
  authorize("freelancer"),
  [param("id").isMongoId().withMessage("Invalid project ID"), validate],
  projectController.completeProject
);

// Get time tracking for a project
router.get(
  "/:projectId/time-tracking",
  protect,
  [param("projectId").isMongoId().withMessage("Invalid project ID"), validate],
  timeTrackingController.getTimeTracking
);

// Add time tracking session
router.post(
  "/:projectId/time-tracking",
  protect,
  authorize("freelancer"),
  [
    param("projectId").isMongoId().withMessage("Invalid project ID"),
    body("startTime")
      .isISO8601()
      .withMessage("Start time must be a valid date"),
    body("endTime").isISO8601().withMessage("End time must be a valid date"),
    body("duration")
      .isInt({ min: 1 })
      .withMessage("Duration must be at least 1 second"),
    validate,
  ],
  timeTrackingController.addTimeTrackingSession
);

// Update project progress
router.put(
  "/:id/progress",
  protect,
  [
    param("id").isMongoId().withMessage("Invalid project ID"),
    body("progress")
      .isInt({ min: 0, max: 100 })
      .withMessage("Progress must be between 0 and 100"),
    validate,
  ],
  projectController.updateProjectProgress
);

// Add milestone to project
router.post(
  "/:id/milestones",
  protect,
  authorize("client"),
  [
    param("id").isMongoId().withMessage("Invalid project ID"),
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("dueDate")
      .notEmpty()
      .withMessage("Due date is required")
      .isISO8601()
      .withMessage("Due date must be a valid date")
      .custom((value) => new Date(value) > new Date())
      .withMessage("Due date must be in the future"),
    body("amount")
      .isNumeric()
      .withMessage("Amount must be a number")
      .custom((value) => value >= 0)
      .withMessage("Amount cannot be negative"),
    validate,
  ],
  projectController.addMilestone
);

// Update milestone status
router.put(
  "/:id/milestones/:milestoneId",
  protect,
  [
    param("id").isMongoId().withMessage("Invalid project ID"),
    param("milestoneId").isMongoId().withMessage("Invalid milestone ID"),
    body("status")
      .isIn(["Pending", "In Progress", "Completed", "Approved", "Rejected"])
      .withMessage("Invalid status"),
    validate,
  ],
  projectController.updateMilestoneStatus
);

// Submit a bid
router.post(
  "/:projectId/bids",
  protect,
  authorize("freelancer"),
  [
    param("projectId").isMongoId().withMessage("Invalid project ID"),
    body("amount")
      .isNumeric()
      .withMessage("Amount must be a number")
      .custom((value) => value >= 0)
      .withMessage("Amount cannot be negative"),
    body("deliveryTime")
      .isInt({ min: 1 })
      .withMessage("Delivery time must be at least 1 day"),
    body("proposal")
      .trim()
      .notEmpty()
      .withMessage("Proposal is required")
      .isLength({ min: 50 })
      .withMessage("Proposal must be at least 50 characters"),
    validate,
  ],
  bidController.submitBid
);

// Get all bids for a project
router.get(
  "/:projectId/bids",
  protect,
  authorize("client"),
  [param("projectId").isMongoId().withMessage("Invalid project ID"), validate],
  bidController.getProjectBids
);

// Get all bids by a freelancer
router.get(
  "/bids/freelancer",
  protect,
  authorize("freelancer"),
  bidController.getFreelancerBids
);

// Accept a bid
router.put(
  "/:projectId/bids/:bidId/accept",
  protect,
  authorize("client"),
  [
    param("projectId").isMongoId().withMessage("Invalid project ID"),
    param("bidId").isMongoId().withMessage("Invalid bid ID"),
    validate,
  ],
  bidController.acceptBid
);

// Reject a bid
router.put(
  "/:projectId/bids/:bidId/reject",
  protect,
  authorize("client"),
  [
    param("projectId").isMongoId().withMessage("Invalid project ID"),
    param("bidId").isMongoId().withMessage("Invalid bid ID"),
    validate,
  ],
  bidController.rejectBid
);

// Withdraw a bid
router.put(
  "/:projectId/bids/withdraw",
  protect,
  authorize("freelancer"),
  [param("projectId").isMongoId().withMessage("Invalid project ID"), validate],
  bidController.withdrawBid
);

// Counter offer on a bid
router.put(
  "/:projectId/bids/:bidId/counter",
  protect,
  authorize("client"),
  [
    param("projectId").isMongoId().withMessage("Invalid project ID"),
    param("bidId").isMongoId().withMessage("Invalid bid ID"),
    body("amount")
      .isNumeric()
      .withMessage("Amount must be a number")
      .custom((value) => value >= 0)
      .withMessage("Amount cannot be negative"),
    body("deliveryTime")
      .isInt({ min: 1 })
      .withMessage("Delivery time must be at least 1 day"),
    body("message").trim().notEmpty().withMessage("Message is required"),
    validate,
  ],
  bidController.counterOffer
);

// Accept counter offer
router.put(
  "/:projectId/bids/:bidId/counter/accept",
  protect,
  authorize("freelancer"),
  [
    param("projectId").isMongoId().withMessage("Invalid project ID"),
    param("bidId").isMongoId().withMessage("Invalid bid ID"),
    validate,
  ],
  bidController.acceptCounterOffer
);

// Reject counter offer
router.put(
  "/:projectId/bids/:bidId/counter/reject",
  protect,
  authorize("freelancer"),
  [
    param("projectId").isMongoId().withMessage("Invalid project ID"),
    param("bidId").isMongoId().withMessage("Invalid bid ID"),
    validate,
  ],
  bidController.rejectCounterOffer
);

// Contract routes
// Create a contract
router.post(
  "/:projectId/contract",
  protect,
  authorize("client"),
  [
    param("projectId").isMongoId().withMessage("Invalid project ID"),
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("terms").trim().notEmpty().withMessage("Terms are required"),
    body("amount")
      .isNumeric()
      .withMessage("Amount must be a number")
      .custom((value) => value >= 0)
      .withMessage("Amount cannot be negative"),
    body("startDate")
      .notEmpty()
      .withMessage("Start date is required")
      .isISO8601()
      .withMessage("Start date must be a valid date"),
    body("endDate")
      .notEmpty()
      .withMessage("End date is required")
      .isISO8601()
      .withMessage("End date must be a valid date")
      .custom(
        (value, { req }) => new Date(value) > new Date(req.body.startDate)
      )
      .withMessage("End date must be after start date"),
    body("paymentTerms")
      .trim()
      .notEmpty()
      .withMessage("Payment terms are required"),
    validate,
  ],
  contractController.createContract
);

// Get contract by project ID
router.get(
  "/:projectId/contract",
  protect,
  [param("projectId").isMongoId().withMessage("Invalid project ID"), validate],
  contractController.getContractByProject
);

// Update contract
router.put(
  "/:projectId/contract",
  protect,
  authorize("client"),
  [param("projectId").isMongoId().withMessage("Invalid project ID"), validate],
  contractController.updateContract
);

// Sign contract
router.put(
  "/:projectId/contract/sign",
  protect,
  [param("projectId").isMongoId().withMessage("Invalid project ID"), validate],
  contractController.signContract
);

// Terminate contract
router.put(
  "/:projectId/contract/terminate",
  protect,
  authorize("client"),
  [
    param("projectId").isMongoId().withMessage("Invalid project ID"),
    body("terminationReason")
      .trim()
      .notEmpty()
      .withMessage("Termination reason is required"),
    validate,
  ],
  contractController.terminateContract
);

// Review routes
// Add a review for a freelancer
router.post(
  "/:projectId/reviews",
  protect,
  authorize("client"),
  [
    param("projectId").isMongoId().withMessage("Invalid project ID"),
    body("rating")
      .isFloat({ min: 1, max: 5 })
      .withMessage("Rating must be a number between 1 and 5"),
    body("comment").trim().notEmpty().withMessage("Comment is required"),
    validate,
  ],
  reviewController.addFreelancerReview
);

// Add a review for a client
router.post(
  "/:projectId/reviews/client",
  protect,
  authorize("freelancer"),
  [
    param("projectId").isMongoId().withMessage("Invalid project ID"),
    body("rating")
      .isFloat({ min: 1, max: 5 })
      .withMessage("Rating must be a number between 1 and 5"),
    body("comment").trim().notEmpty().withMessage("Comment is required"),
    validate,
  ],
  reviewController.addClientReview
);

// Get freelancer reviews
router.get(
  "/freelancers/:freelancerId/reviews",
  [
    param("freelancerId").isMongoId().withMessage("Invalid freelancer ID"),
    query("rating")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Invalid rating filter"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("sort")
      .optional()
      .isIn(["date", "rating", "oldest"])
      .withMessage("Invalid sort parameter"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid start date format"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid end date format"),
    validate,
  ],
  reviewController.getFreelancerReviews
);

// Get client reviews
router.get(
  "/clients/:clientId/reviews",
  [param("clientId").isMongoId().withMessage("Invalid client ID"), validate],
  reviewController.getClientReviews
);

// Respond to a review
router.put(
  "/reviews/:reviewId/respond",
  protect,
  [
    param("reviewId").isMongoId().withMessage("Invalid review ID"),
    body("response")
      .isString()
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage("Response must be between 10 and 500 characters"),
    validate,
  ],
  reviewController.respondToReview
);

module.exports = router;
