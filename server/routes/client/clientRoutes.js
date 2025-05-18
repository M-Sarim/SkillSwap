const express = require('express');
const { body } = require('express-validator');
const clientController = require('../../controllers/client/clientController');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validation');

const router = express.Router();

// All routes require authentication and client role
router.use(protect);
router.use(authorize('client'));

// Get client profile
router.get('/profile', clientController.getClientProfile);

// Update client profile
router.put(
  '/profile',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('phone')
      .optional()
      .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
      .withMessage('Please provide a valid phone number'),
    body('company')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name cannot exceed 100 characters'),
    body('position')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Position cannot exceed 100 characters'),
    body('website')
      .optional()
      .trim()
      .isURL()
      .withMessage('Please provide a valid URL'),
    body('location')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Location cannot exceed 100 characters'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters'),
    validate
  ],
  clientController.updateClientProfile
);

module.exports = router;
