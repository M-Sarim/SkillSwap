const express = require('express');
const { body, param } = require('express-validator');
const messageController = require('../../controllers/messages/messageController');
const { protect } = require('../../middleware/auth');
const validate = require('../../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Send a message
router.post(
  '/',
  [
    body('receiverId')
      .isMongoId()
      .withMessage('Invalid receiver ID'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Message content is required'),
    body('projectId')
      .optional()
      .isMongoId()
      .withMessage('Invalid project ID'),
    validate
  ],
  messageController.sendMessage
);

// Get all conversations
router.get('/conversations', messageController.getConversations);

// Get messages with a specific user
router.get(
  '/:userId',
  [
    param('userId')
      .isMongoId()
      .withMessage('Invalid user ID'),
    validate
  ],
  messageController.getMessages
);

// Mark a message as read
router.put(
  '/:messageId/read',
  [
    param('messageId')
      .isMongoId()
      .withMessage('Invalid message ID'),
    validate
  ],
  messageController.markAsRead
);

module.exports = router;
