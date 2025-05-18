const Freelancer = require('../../models/Freelancer');
const User = require('../../models/User');
const path = require('path');
const fs = require('fs');
const config = require('../../utils/config');
const notificationService = require('../../utils/notificationService');

/**
 * Upload verification documents
 * @route POST /api/freelancer/documents
 * @access Private (Freelancer only)
 */
const uploadDocuments = async (req, res, next) => {
  try {
    // Check if files were uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files were uploaded'
      });
    }

    // Get freelancer
    const freelancer = await Freelancer.findOne({ user: req.user._id });

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    // Process uploaded files
    const documents = [];
    const uploadedFiles = Array.isArray(req.files.documents) 
      ? req.files.documents 
      : [req.files.documents];

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../../uploads/documents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Process each file
    for (const file of uploadedFiles) {
      // Validate file size
      if (file.size > config.MAX_FILE_SIZE) {
        return res.status(400).json({
          success: false,
          message: `File ${file.name} exceeds the maximum file size of 5MB`
        });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `File ${file.name} has an invalid file type. Allowed types: JPEG, PNG, PDF`
        });
      }

      // Generate unique filename
      const fileName = `${req.user._id}_${Date.now()}${path.extname(file.name)}`;
      const filePath = path.join(uploadsDir, fileName);

      // Move file to uploads directory
      await file.mv(filePath);

      // Determine document type from file name or request body
      const documentType = req.body.documentType || 'Identity Document';

      // Create document object
      const document = {
        documentType,
        documentUrl: `/uploads/documents/${fileName}`,
        originalName: file.name,
        mimeType: file.mimetype,
        size: file.size,
        uploadDate: new Date(),
        status: 'Pending'
      };

      // Add document to array
      documents.push(document);

      // Add document to freelancer's verificationDocuments array
      freelancer.verificationDocuments.push(document);
    }

    // Save freelancer
    await freelancer.save();

    // Notify admin about new verification documents
    try {
      await notificationService.notifyAdminVerificationRequest(
        freelancer._id,
        req.user._id,
        req.user.name
      );
    } catch (notificationError) {
      console.error('Error creating verification notification:', notificationError);
      // Continue even if notification creation fails
    }

    res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully',
      data: {
        documents
      }
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    next(error);
  }
};

/**
 * Get verification documents
 * @route GET /api/freelancer/documents
 * @access Private (Freelancer only)
 */
const getDocuments = async (req, res, next) => {
  try {
    // Get freelancer
    const freelancer = await Freelancer.findOne({ user: req.user._id });

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        documents: freelancer.verificationDocuments || []
      }
    });
  } catch (error) {
    console.error('Error getting documents:', error);
    next(error);
  }
};

/**
 * Delete verification document
 * @route DELETE /api/freelancer/documents/:id
 * @access Private (Freelancer only)
 */
const deleteDocument = async (req, res, next) => {
  try {
    // Get freelancer
    const freelancer = await Freelancer.findOne({ user: req.user._id });

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    // Find document
    const documentIndex = freelancer.verificationDocuments.findIndex(
      doc => doc._id.toString() === req.params.id
    );

    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Get document
    const document = freelancer.verificationDocuments[documentIndex];

    // Delete file from server
    try {
      const filePath = path.join(__dirname, '../..', document.documentUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Continue even if file deletion fails
    }

    // Remove document from array
    freelancer.verificationDocuments.splice(documentIndex, 1);

    // Save freelancer
    await freelancer.save();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    next(error);
  }
};

module.exports = {
  uploadDocuments,
  getDocuments,
  deleteDocument
};
