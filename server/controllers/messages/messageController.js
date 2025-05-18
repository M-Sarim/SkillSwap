const Message = require('../../models/Message');
const User = require('../../models/User');
const mongoose = require('mongoose');
const notificationService = require('../../utils/notificationService');

/**
 * Send a message
 * @route POST /api/messages
 * @access Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content, projectId } = req.body;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Create message
    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content,
      project: projectId || null
    });

    await message.save();

    // Populate sender and receiver
    await message.populate('sender', 'name profileImage');
    await message.populate('receiver', 'name profileImage');

    // Send notification to the receiver
    try {
      await notificationService.notifyNewMessage(
        receiverId,
        req.user._id,
        content,
        message._id,
        projectId
      );
    } catch (notificationError) {
      console.error('Error sending message notification:', notificationError);
      // Continue even if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all conversations for the current user
 * @route GET /api/messages/conversations
 * @access Private
 */
const getConversations = async (req, res, next) => {
  try {
    // Find all messages where the current user is either sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'name profileImage')
    .populate('receiver', 'name profileImage');

    // Group messages by conversation
    const conversationsMap = new Map();

    for (const message of messages) {
      // Determine the other user in the conversation
      const otherUser = message.sender._id.equals(req.user._id)
        ? message.receiver
        : message.sender;

      const otherUserId = otherUser._id.toString();

      if (!conversationsMap.has(otherUserId)) {
        // Count unread messages
        const unreadCount = await Message.countDocuments({
          sender: otherUser._id,
          receiver: req.user._id,
          'readStatus.isRead': false
        });

        conversationsMap.set(otherUserId, {
          user: otherUser,
          lastMessage: {
            content: message.content,
            createdAt: message.createdAt
          },
          unreadCount
        });
      }
    }

    // Convert map to array
    const conversations = Array.from(conversationsMap.values());

    res.status(200).json({
      success: true,
      data: {
        conversations
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages between current user and another user
 * @route GET /api/messages/:userId
 * @access Private
 */
const getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get conversation
    const messages = await Message.getConversation(
      req.user._id,
      userId,
      parseInt(limit),
      parseInt(skip)
    );

    // Mark messages as read
    await Message.updateMany(
      {
        sender: userId,
        receiver: req.user._id,
        'readStatus.isRead': false
      },
      {
        $set: {
          'readStatus.isRead': true,
          'readStatus.readAt': new Date()
        }
      }
    );

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse() // Return in chronological order
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a message as read
 * @route PUT /api/messages/:messageId/read
 * @access Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    // Find message
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the receiver
    if (!message.receiver.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to mark this message as read'
      });
    }

    // Mark as read
    await message.markAsRead();

    res.status(200).json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getMessages,
  markAsRead
};
