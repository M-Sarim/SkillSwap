const Notification = require("../models/Notification");
const User = require("../models/User");
const config = require("./config");

/**
 * Create a notification
 * @param {Object} data - Notification data
 * @returns {Promise<Object>} - Created notification
 */
const createNotification = async (data) => {
  try {
    return await Notification.createNotification(data);
  } catch (error) {
    console.error("Error creating notification:", error);
    // Don't throw the error to prevent disrupting the main flow
    return null;
  }
};

/**
 * Notify admin about a new user registration
 * @param {string} userId - User ID of the new user
 * @param {string} userName - Name of the new user
 * @param {string} userRole - Role of the new user (client/freelancer)
 */
const notifyAdminNewUser = async (userId, userName, userRole) => {
  try {
    // Find all admin users
    const admins = await User.find({ role: "admin" });

    for (const admin of admins) {
      await createNotification({
        recipient: admin._id,
        sender: userId,
        type: config.NOTIFICATION_TYPES.USER_REGISTERED,
        title: "New User Registration",
        message: `${userName} has registered as a ${userRole}`,
        actionLink: `/admin/users/${userId}`,
      });
    }
  } catch (error) {
    console.error("Error notifying admin about new user:", error);
  }
};

/**
 * Notify admin about a freelancer verification request
 * @param {string} freelancerId - Freelancer ID
 * @param {string} userId - User ID of the freelancer
 * @param {string} userName - Name of the freelancer
 */
const notifyAdminVerificationRequest = async (
  freelancerId,
  userId,
  userName
) => {
  try {
    // Find all admin users
    const admins = await User.find({ role: "admin" });

    for (const admin of admins) {
      await createNotification({
        recipient: admin._id,
        sender: userId,
        type: config.NOTIFICATION_TYPES.VERIFICATION_REQUEST,
        title: "Freelancer Verification Request",
        message: `${userName} has requested verification for their freelancer account`,
        actionLink: `/admin/freelancers/${freelancerId}`,
      });
    }
  } catch (error) {
    console.error("Error notifying admin about verification request:", error);
  }
};

/**
 * Notify freelancer about verification status update
 * @param {string} freelancerUserId - User ID of the freelancer
 * @param {string} adminId - Admin user ID
 * @param {boolean} verified - Whether the freelancer was verified
 * @param {string} verificationLevel - Verification level
 * @param {string} notes - Optional notes from admin
 */
const notifyFreelancerVerificationUpdate = async (
  freelancerUserId,
  adminId,
  verified,
  verificationLevel,
  notes = null
) => {
  try {
    const admin = await User.findById(adminId, "name");

    // Create a more detailed message based on verification level
    let message = "";
    if (verified) {
      switch (verificationLevel) {
        case "Basic":
          message = `Your account has been verified with Basic level by ${admin.name}. You now have access to basic platform features.`;
          break;
        case "Verified":
          message = `Your account has been verified with Verified level by ${admin.name}. You now have access to most platform features and will appear higher in search results.`;
          break;
        case "Premium":
          message = `Your account has been verified with Premium level by ${admin.name}. You now have access to all platform features, priority support, and will appear at the top of search results.`;
          break;
        default:
          message = `Your account has been verified with ${
            verificationLevel || "Basic"
          } level by ${admin.name}.`;
      }
    } else {
      message = `Your verification request has been reviewed by ${admin.name} and was not approved at this time.`;
    }

    // Add notes if provided
    if (notes) {
      message += ` Note from admin: "${notes}"`;
    }

    await createNotification({
      recipient: freelancerUserId,
      sender: adminId,
      type: config.NOTIFICATION_TYPES.FREELANCER_VERIFIED,
      title: verified
        ? `Account Verified - ${verificationLevel} Level`
        : "Verification Request Reviewed",
      message: message,
      actionLink: "/freelancer/profile",
      sendEmail: true,
      emailTemplate: config.EMAIL_TEMPLATES.VERIFICATION_STATUS,
    });
  } catch (error) {
    console.error(
      "Error notifying freelancer about verification update:",
      error
    );
  }
};

/**
 * Notify client about a new bid on their project
 * @param {string} clientUserId - User ID of the client
 * @param {string} freelancerUserId - User ID of the freelancer
 * @param {string} projectId - Project ID
 * @param {string} projectTitle - Project title
 * @param {number} bidAmount - Bid amount
 */
const notifyClientNewBid = async (
  clientUserId,
  freelancerUserId,
  projectId,
  projectTitle,
  bidAmount
) => {
  try {
    const freelancer = await User.findById(freelancerUserId, "name");

    await createNotification({
      recipient: clientUserId,
      sender: freelancerUserId,
      type: config.NOTIFICATION_TYPES.BID_RECEIVED,
      title: "New Bid Received",
      message: `${freelancer.name} has placed a bid of $${bidAmount} on your project "${projectTitle}"`,
      relatedProject: projectId,
      actionLink: `/client/projects/${projectId}`,
    });
  } catch (error) {
    console.error("Error notifying client about new bid:", error);
  }
};

/**
 * Notify freelancer about bid acceptance
 * @param {string} freelancerUserId - User ID of the freelancer
 * @param {string} clientUserId - User ID of the client
 * @param {string} projectId - Project ID
 * @param {string} projectTitle - Project title
 */
const notifyFreelancerBidAccepted = async (
  freelancerUserId,
  clientUserId,
  projectId,
  projectTitle
) => {
  try {
    const client = await User.findById(clientUserId, "name");

    await createNotification({
      recipient: freelancerUserId,
      sender: clientUserId,
      type: config.NOTIFICATION_TYPES.BID_ACCEPTED,
      title: "Bid Accepted",
      message: `${client.name} has accepted your bid for the project "${projectTitle}"`,
      relatedProject: projectId,
      actionLink: `/freelancer/projects/${projectId}`,
    });
  } catch (error) {
    console.error("Error notifying freelancer about bid acceptance:", error);
  }
};

/**
 * Notify freelancer about bid rejection
 * @param {string} freelancerUserId - User ID of the freelancer
 * @param {string} clientUserId - User ID of the client
 * @param {string} projectId - Project ID
 * @param {string} projectTitle - Project title
 * @param {string} rejectionReason - Reason for rejection
 */
const notifyFreelancerBidRejected = async (
  freelancerUserId,
  clientUserId,
  projectId,
  projectTitle,
  rejectionReason
) => {
  try {
    const client = await User.findById(clientUserId, "name");

    await createNotification({
      recipient: freelancerUserId,
      sender: clientUserId,
      type: config.NOTIFICATION_TYPES.BID_REJECTED,
      title: "Bid Rejected",
      message: `${
        client.name
      } has rejected your bid for the project "${projectTitle}"${
        rejectionReason ? `: ${rejectionReason}` : ""
      }`,
      relatedProject: projectId,
      actionLink: `/freelancer/projects`,
    });
  } catch (error) {
    console.error("Error notifying freelancer about bid rejection:", error);
  }
};

/**
 * Notify user about a new message
 * @param {string} recipientId - User ID of the recipient
 * @param {string} senderId - User ID of the sender
 * @param {string} content - Message content
 * @param {string} messageId - Message ID
 * @param {string} projectId - Project ID (optional)
 */
const notifyNewMessage = async (
  recipientId,
  senderId,
  content,
  messageId,
  projectId = null
) => {
  try {
    const sender = await User.findById(senderId, "name");

    // Truncate message content if too long
    const truncatedContent =
      content.length > 50 ? `${content.substring(0, 50)}...` : content;

    await createNotification({
      recipient: recipientId,
      sender: senderId,
      type: config.NOTIFICATION_TYPES.MESSAGE_RECEIVED,
      title: "New Message",
      message: `${sender.name}: ${truncatedContent}`,
      relatedMessage: messageId,
      relatedProject: projectId,
      actionLink: projectId
        ? `/messages/${senderId}?project=${projectId}`
        : `/messages/${senderId}`,
    });
  } catch (error) {
    console.error("Error notifying about new message:", error);
  }
};

/**
 * Notify client about a new project created by a freelancer
 * @param {string} clientUserId - User ID of the client
 * @param {string} freelancerUserId - User ID of the freelancer
 * @param {string} projectId - Project ID
 * @param {string} projectTitle - Project title
 */
const notifyClientProjectCreated = async (
  clientUserId,
  freelancerUserId,
  projectId,
  projectTitle
) => {
  try {
    const freelancer = await User.findById(freelancerUserId, "name");

    await createNotification({
      recipient: clientUserId,
      sender: freelancerUserId,
      type: config.NOTIFICATION_TYPES.PROJECT_CREATED,
      title: "New Project Created",
      message: `${freelancer.name} has created a new project "${projectTitle}"`,
      relatedProject: projectId,
      actionLink: `/client/projects/${projectId}`,
    });
  } catch (error) {
    console.error("Error notifying client about new project:", error);
  }
};

/**
 * Notify about contract creation
 * @param {string} recipientId - User ID of the recipient
 * @param {string} senderId - User ID of the sender
 * @param {string} contractId - Contract ID
 * @param {string} projectId - Project ID
 * @param {string} projectTitle - Project title
 */
const notifyContractCreated = async (
  recipientId,
  senderId,
  contractId,
  projectId,
  projectTitle
) => {
  try {
    const sender = await User.findById(senderId, "name");

    await createNotification({
      recipient: recipientId,
      sender: senderId,
      type: config.NOTIFICATION_TYPES.CONTRACT_CREATED,
      title: "Contract Created",
      message: `${sender.name} has created a contract for the project "${projectTitle}"`,
      relatedContract: contractId,
      relatedProject: projectId,
      actionLink: `/projects/${projectId}/contract`,
    });
  } catch (error) {
    console.error("Error notifying about contract creation:", error);
  }
};

/**
 * Notify about contract signing
 * @param {string} recipientId - User ID of the recipient
 * @param {string} senderId - User ID of the sender
 * @param {string} contractId - Contract ID
 * @param {string} projectId - Project ID
 * @param {string} projectTitle - Project title
 */
const notifyContractSigned = async (
  recipientId,
  senderId,
  contractId,
  projectId,
  projectTitle
) => {
  try {
    const sender = await User.findById(senderId, "name");

    await createNotification({
      recipient: recipientId,
      sender: senderId,
      type: config.NOTIFICATION_TYPES.CONTRACT_SIGNED,
      title: "Contract Signed",
      message: `${sender.name} has signed the contract for the project "${projectTitle}"`,
      relatedContract: contractId,
      relatedProject: projectId,
      actionLink: `/projects/${projectId}/contract`,
    });
  } catch (error) {
    console.error("Error notifying about contract signing:", error);
  }
};

/**
 * Notify about milestone completion
 * @param {string} clientUserId - User ID of the client
 * @param {string} freelancerUserId - User ID of the freelancer
 * @param {string} projectId - Project ID
 * @param {string} projectTitle - Project title
 * @param {string} milestoneName - Milestone name
 */
const notifyMilestoneCompleted = async (
  clientUserId,
  freelancerUserId,
  projectId,
  projectTitle,
  milestoneName
) => {
  try {
    const freelancer = await User.findById(freelancerUserId, "name");

    await createNotification({
      recipient: clientUserId,
      sender: freelancerUserId,
      type: config.NOTIFICATION_TYPES.MILESTONE_COMPLETED,
      title: "Milestone Completed",
      message: `${freelancer.name} has completed the milestone "${milestoneName}" for project "${projectTitle}"`,
      relatedProject: projectId,
      actionLink: `/client/projects/${projectId}`,
    });
  } catch (error) {
    console.error("Error notifying about milestone completion:", error);
  }
};

/**
 * Notify freelancer about payment received
 * @param {string} freelancerUserId - User ID of the freelancer
 * @param {string} clientUserId - User ID of the client
 * @param {string} projectId - Project ID
 * @param {string} projectTitle - Project title
 * @param {number} amount - Payment amount
 */
const notifyPaymentReceived = async (
  freelancerUserId,
  clientUserId,
  projectId,
  projectTitle,
  amount
) => {
  try {
    const client = await User.findById(clientUserId, "name");

    await createNotification({
      recipient: freelancerUserId,
      sender: clientUserId,
      type: config.NOTIFICATION_TYPES.PAYMENT_RECEIVED,
      title: "Payment Received",
      message: `You have received a payment of $${amount} from ${client.name} for project "${projectTitle}"`,
      relatedProject: projectId,
      actionLink: `/freelancer/projects/${projectId}`,
    });
  } catch (error) {
    console.error("Error notifying about payment received:", error);
  }
};

/**
 * Notify client about project completion
 * @param {string} clientUserId - User ID of the client
 * @param {string} freelancerUserId - User ID of the freelancer
 * @param {string} projectId - Project ID
 * @param {string} projectTitle - Project title
 */
const notifyProjectCompleted = async (
  clientUserId,
  freelancerUserId,
  projectId,
  projectTitle
) => {
  try {
    const freelancer = await User.findById(freelancerUserId, "name");

    await createNotification({
      recipient: clientUserId,
      sender: freelancerUserId,
      type: config.NOTIFICATION_TYPES.PROJECT_COMPLETED,
      title: "Project Completed",
      message: `${freelancer.name} has marked the project "${projectTitle}" as completed`,
      relatedProject: projectId,
      actionLink: `/client/projects/${projectId}`,
    });
  } catch (error) {
    console.error("Error notifying about project completion:", error);
  }
};

/**
 * Notify freelancer about document status update
 * @param {string} freelancerUserId - User ID of the freelancer
 * @param {string} adminId - Admin user ID
 * @param {string} documentType - Type of document
 * @param {string} status - New status (Approved/Rejected)
 * @param {string} notes - Optional notes from admin
 */
const notifyDocumentStatusUpdate = async (
  freelancerUserId,
  adminId,
  documentType,
  status,
  notes = null
) => {
  try {
    const admin = await User.findById(adminId, "name");
    const user = await User.findById(freelancerUserId, "name phone");

    // Create base message
    let message = `Your ${documentType} has been ${status.toLowerCase()} by ${
      admin.name
    }`;

    // Add notes if provided
    if (notes) {
      message += `. Note: "${notes}"`;
    }

    // Create notification data
    const notificationData = {
      recipient: freelancerUserId,
      sender: adminId,
      type: config.NOTIFICATION_TYPES.DOCUMENT_STATUS_UPDATED,
      title: "Document Status Updated",
      message: message,
      actionLink: "/freelancer/profile",
      sendEmail: true,
      emailTemplate: config.EMAIL_TEMPLATES.DOCUMENT_STATUS,
      emailData: {
        name: user.name,
        documentType,
        status,
        notes,
        adminName: admin.name,
      },
    };

    // Add SMS if user has phone number and status is important
    if (user.phone && (status === "Approved" || status === "Rejected")) {
      notificationData.sendSMS = true;
      notificationData.smsTemplate = config.SMS_TEMPLATES.DOCUMENT_VERIFIED;
      notificationData.smsData = {
        documentType,
        status,
      };
    }

    await createNotification(notificationData);
  } catch (error) {
    console.error(
      "Error notifying freelancer about document status update:",
      error
    );
  }
};

/**
 * Notify freelancer to upload verification documents
 * @param {string} freelancerUserId - User ID of the freelancer
 * @param {string} freelancerName - Name of the freelancer
 */
const notifyFreelancerUploadDocuments = async (
  freelancerUserId,
  freelancerName
) => {
  try {
    await createNotification({
      recipient: freelancerUserId,
      sender: freelancerUserId, // Self-notification
      type: config.NOTIFICATION_TYPES.UPLOAD_VERIFICATION_DOCUMENTS,
      title: "Verification Required",
      message: `${freelancerName}, please upload your verification documents to get your account verified by admin`,
      actionLink: "/freelancer/profile",
      sendEmail: true,
      emailTemplate: config.EMAIL_TEMPLATES.UPLOAD_DOCUMENTS,
    });
  } catch (error) {
    console.error("Error notifying freelancer to upload documents:", error);
  }
};

/**
 * Notify freelancer about document annotation
 * @param {string} freelancerUserId - User ID of the freelancer
 * @param {string} adminId - Admin user ID
 * @param {string} documentType - Type of document
 * @param {string} annotationText - Text of the annotation
 */
const notifyDocumentAnnotation = async (
  freelancerUserId,
  adminId,
  documentType,
  annotationText
) => {
  try {
    const admin = await User.findById(adminId, "name");

    await createNotification({
      recipient: freelancerUserId,
      sender: adminId,
      type: config.NOTIFICATION_TYPES.DOCUMENT_ANNOTATION,
      title: "Document Annotation Added",
      message: `${
        admin.name
      } added a comment to your ${documentType}: "${annotationText.substring(
        0,
        50
      )}${annotationText.length > 50 ? "..." : ""}"`,
      actionLink: "/freelancer/profile",
      sendEmail: true,
      emailTemplate: config.EMAIL_TEMPLATES.DOCUMENT_STATUS,
      emailData: {
        documentType,
        annotationText,
        adminName: admin.name,
      },
    });
  } catch (error) {
    console.error(
      "Error notifying freelancer about document annotation:",
      error
    );
  }
};

module.exports = {
  createNotification,
  notifyAdminNewUser,
  notifyAdminVerificationRequest,
  notifyFreelancerVerificationUpdate,
  notifyClientNewBid,
  notifyFreelancerBidAccepted,
  notifyFreelancerBidRejected,
  notifyNewMessage,
  notifyClientProjectCreated,
  notifyContractCreated,
  notifyContractSigned,
  notifyMilestoneCompleted,
  notifyPaymentReceived,
  notifyProjectCompleted,
  notifyDocumentStatusUpdate,
  notifyFreelancerUploadDocuments,
  notifyDocumentAnnotation,
};
