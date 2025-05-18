/**
 * Document Controller for Admin
 * Handles document management, annotations, and advanced document operations
 */

const Freelancer = require("../../models/Freelancer");
const User = require("../../models/User");
const notificationService = require("../../utils/notificationService");
const path = require("path");
const fs = require("fs");

/**
 * Get all documents pending verification
 * @route GET /api/admin/documents
 * @access Private/Admin
 */
const getAllDocuments = async (req, res, next) => {
  try {
    const { status = "all", type = "all" } = req.query;

    // Find all freelancers with documents
    const freelancers = await Freelancer.find({
      "verificationDocuments.0": { $exists: true },
    }).populate("user", "name email profileImage");

    // Extract and flatten all documents
    let allDocuments = [];
    freelancers.forEach((freelancer) => {
      const freelancerDocs = freelancer.verificationDocuments.map((doc) => ({
        ...doc.toObject(),
        freelancerId: freelancer._id,
        freelancerName: freelancer.user.name,
        freelancerEmail: freelancer.user.email,
        freelancerProfileImage: freelancer.user.profileImage,
      }));
      allDocuments = [...allDocuments, ...freelancerDocs];
    });

    // Filter by status if specified
    if (status !== "all") {
      allDocuments = allDocuments.filter((doc) => doc.status === status);
    }

    // Filter by document type if specified
    if (type !== "all") {
      allDocuments = allDocuments.filter(
        (doc) => doc.documentType.toLowerCase() === type.toLowerCase()
      );
    }

    // Sort by upload date (newest first)
    allDocuments.sort(
      (a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)
    );

    res.status(200).json({
      success: true,
      count: allDocuments.length,
      data: allDocuments,
    });
  } catch (error) {
    console.error("Error getting documents:", error);
    next(error);
  }
};

/**
 * Add annotation to document
 * @route POST /api/admin/documents/:freelancerId/:documentId/annotations
 * @access Private/Admin
 */
const addAnnotation = async (req, res, next) => {
  try {
    const { freelancerId, documentId } = req.params;
    const { text, x, y, width, height } = req.body;

    // Validate required fields
    if (!text || x === undefined || y === undefined) {
      return res.status(400).json({
        success: false,
        message: "Text, x, and y coordinates are required for annotation",
      });
    }

    // Find freelancer
    const freelancer = await Freelancer.findById(freelancerId);

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: "Freelancer not found",
      });
    }

    // Find document
    const document = freelancer.verificationDocuments.id(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Initialize annotations array if it doesn't exist
    if (!document.annotations) {
      document.annotations = [];
    }

    // Create annotation
    const annotation = {
      text,
      x,
      y,
      width: width || 100,
      height: height || 20,
      createdBy: req.user._id,
      createdAt: new Date(),
    };

    // Add annotation to document
    document.annotations.push(annotation);

    // Save freelancer
    await freelancer.save();

    // Notify freelancer about the annotation
    try {
      await notificationService.notifyDocumentAnnotation(
        freelancer.user,
        req.user._id,
        document.documentType,
        text
      );
    } catch (notificationError) {
      console.error("Error creating annotation notification:", notificationError);
      // Continue even if notification creation fails
    }

    res.status(200).json({
      success: true,
      message: "Annotation added successfully",
      data: annotation,
    });
  } catch (error) {
    console.error("Error adding annotation:", error);
    next(error);
  }
};

/**
 * Get document annotations
 * @route GET /api/admin/documents/:freelancerId/:documentId/annotations
 * @access Private/Admin
 */
const getAnnotations = async (req, res, next) => {
  try {
    const { freelancerId, documentId } = req.params;

    // Find freelancer
    const freelancer = await Freelancer.findById(freelancerId);

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: "Freelancer not found",
      });
    }

    // Find document
    const document = freelancer.verificationDocuments.id(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Return annotations
    res.status(200).json({
      success: true,
      data: document.annotations || [],
    });
  } catch (error) {
    console.error("Error getting annotations:", error);
    next(error);
  }
};

/**
 * Delete annotation
 * @route DELETE /api/admin/documents/:freelancerId/:documentId/annotations/:annotationId
 * @access Private/Admin
 */
const deleteAnnotation = async (req, res, next) => {
  try {
    const { freelancerId, documentId, annotationId } = req.params;

    // Find freelancer
    const freelancer = await Freelancer.findById(freelancerId);

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: "Freelancer not found",
      });
    }

    // Find document
    const document = freelancer.verificationDocuments.id(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check if annotations exist
    if (!document.annotations || document.annotations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No annotations found for this document",
      });
    }

    // Find annotation index
    const annotationIndex = document.annotations.findIndex(
      (a) => a._id.toString() === annotationId
    );

    if (annotationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Annotation not found",
      });
    }

    // Remove annotation
    document.annotations.splice(annotationIndex, 1);

    // Save freelancer
    await freelancer.save();

    res.status(200).json({
      success: true,
      message: "Annotation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting annotation:", error);
    next(error);
  }
};

module.exports = {
  getAllDocuments,
  addAnnotation,
  getAnnotations,
  deleteAnnotation,
};
