const express = require('express');
const router = express.Router();
const financeController = require('../../controllers/admin/financeController');
const { protect, authorize } = require('../../middleware/auth');

// Protect all routes - require authentication
router.use(protect);
// Authorize only admin users
router.use(authorize('admin'));

// Get financial summary
router.get('/summary', financeController.getFinancialSummary);

// Get all transactions with filtering and pagination
router.get('/', financeController.getAllTransactions);

// Get transaction by ID
router.get('/:id', financeController.getTransactionById);

// Create a new transaction
router.post('/', financeController.createTransaction);

// Update transaction status
router.patch('/:id/status', financeController.updateTransactionStatus);

module.exports = router;
