const config = require("./config");

/**
 * Get email template for welcome email
 * @param {Object} data - Data for the template
 * @returns {Object} - Email template with subject and body
 */
const getWelcomeTemplate = (data) => {
  const { name, role } = data;

  return {
    subject: "Welcome to SkillSwap!",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Welcome to SkillSwap!</h2>
        <p>Hello ${name},</p>
        <p>Thank you for joining SkillSwap as a ${role}. We're excited to have you on board!</p>
        <p>With SkillSwap, you can:</p>
        <ul>
          ${
            role === "client"
              ? `
            <li>Post projects and find talented freelancers</li>
            <li>Review bids and select the best match for your project</li>
            <li>Manage your projects and communicate with freelancers</li>
          `
              : `
            <li>Browse available projects and submit bids</li>
            <li>Showcase your skills and portfolio</li>
            <li>Communicate with clients and manage your projects</li>
          `
          }
        </ul>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The SkillSwap Team</p>
      </div>
    `,
  };
};

/**
 * Get email template for verification email
 * @param {Object} data - Data for the template
 * @returns {Object} - Email template with subject and body
 */
const getVerificationTemplate = (data) => {
  const { name, verificationLink } = data;

  return {
    subject: "Verify Your SkillSwap Account",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Verify Your Account</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering with SkillSwap. To complete your registration, please verify your email address by clicking the button below:</p>
        <p style="text-align: center;">
          <a href="${verificationLink}" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a>
        </p>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p>${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account on SkillSwap, please ignore this email.</p>
        <p>Best regards,<br>The SkillSwap Team</p>
      </div>
    `,
  };
};

/**
 * Get email template for password reset email
 * @param {Object} data - Data for the template
 * @returns {Object} - Email template with subject and body
 */
const getPasswordResetTemplate = (data) => {
  const { name, resetLink } = data;

  return {
    subject: "Reset Your SkillSwap Password",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Reset Your Password</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p style="text-align: center;">
          <a href="${resetLink}" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
        </p>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p>${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.</p>
        <p>Best regards,<br>The SkillSwap Team</p>
      </div>
    `,
  };
};

/**
 * Get email template for document status update
 * @param {Object} data - Data for the template
 * @returns {Object} - Email template with subject and body
 */
const getDocumentStatusTemplate = (data) => {
  const { name, documentType, status, notes } = data;

  const statusColor = status === "Approved" ? "#22c55e" : "#ef4444";
  const statusText = status === "Approved" ? "approved" : "rejected";

  return {
    subject: `Document ${status}: ${documentType}`,
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Document Status Update</h2>
        <p>Hello ${name},</p>
        <p>Your document <strong>${documentType}</strong> has been reviewed and <span style="color: ${statusColor};">${statusText}</span>.</p>
        ${
          notes
            ? `
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 15px 0;">
            <p style="margin: 0;"><strong>Reviewer Notes:</strong></p>
            <p style="margin: 10px 0 0;">${notes}</p>
          </div>
        `
            : ""
        }
        <p>You can view the status of all your documents in your profile dashboard.</p>
        ${
          status === "Rejected"
            ? `
          <p>If your document was rejected, you may need to upload a new document that meets our requirements.</p>
        `
            : ""
        }
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>The SkillSwap Team</p>
      </div>
    `,
  };
};

/**
 * Get email template for document upload notification
 * @param {Object} data - Data for the template
 * @returns {Object} - Email template with subject and body
 */
const getUploadDocumentsTemplate = (data) => {
  const { name } = data;

  return {
    subject: "Action Required: Upload Verification Documents",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Verification Documents Required</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering as a freelancer on SkillSwap!</p>
        <p>To complete your profile verification and gain access to all platform features, please upload your verification documents. This helps us maintain a trusted community of professionals.</p>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 15px 0;">
          <p style="margin: 0;"><strong>Required Documents:</strong></p>
          <ul style="margin-top: 10px;">
            <li>Government-issued ID (passport, driver's license, or national ID card)</li>
            <li>Proof of address (utility bill, bank statement, etc. issued within the last 3 months)</li>
            <li>Professional certifications (if applicable)</li>
          </ul>
        </div>

        <p style="text-align: center; margin: 25px 0;">
          <a href="/freelancer/profile" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Upload Documents Now</a>
        </p>

        <p>Benefits of verification:</p>
        <ul>
          <li>Higher visibility in search results</li>
          <li>Increased trust from potential clients</li>
          <li>Access to premium projects</li>
          <li>Higher earning potential</li>
        </ul>

        <p>If you have any questions about the verification process, please contact our support team.</p>
        <p>Best regards,<br>The SkillSwap Team</p>
      </div>
    `,
  };
};

/**
 * Get email template for verification status update
 * @param {Object} data - Data for the template
 * @returns {Object} - Email template with subject and body
 */
const getVerificationStatusTemplate = (data) => {
  const { name, verified, verificationLevel, notes, adminName } = data;

  // Set colors and styles based on verification status
  const statusColor = verified ? "#22c55e" : "#ef4444";
  const statusText = verified ? "Approved" : "Not Approved";
  const levelBadgeColor =
    {
      Basic: "#60a5fa",
      Verified: "#22c55e",
      Premium: "#8b5cf6",
    }[verificationLevel] || "#60a5fa";

  // Create level-specific benefits text
  let benefitsHtml = "";
  if (verified) {
    const benefits =
      config.VERIFICATION_LEVELS[verificationLevel.toUpperCase()]?.features ||
      [];
    if (benefits.length > 0) {
      benefitsHtml = `
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 15px 0;">
          <p style="margin: 0;"><strong>Your ${verificationLevel} Level Benefits:</strong></p>
          <ul style="margin-top: 10px;">
            ${benefits.map((benefit) => `<li>${benefit}</li>`).join("")}
          </ul>
        </div>
      `;
    }
  }

  return {
    subject: verified
      ? `Account Verified - ${verificationLevel} Level`
      : "Verification Status Update",
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Verification Status Update</h2>
        <p>Hello ${name},</p>

        <div style="text-align: center; margin: 20px 0;">
          <div style="display: inline-block; padding: 10px 20px; background-color: ${statusColor}; color: white; border-radius: 4px; font-weight: bold;">
            Status: ${statusText}
          </div>
          ${
            verified
              ? `
            <div style="display: inline-block; margin-left: 10px; padding: 10px 20px; background-color: ${levelBadgeColor}; color: white; border-radius: 4px; font-weight: bold;">
              Level: ${verificationLevel}
            </div>
          `
              : ""
          }
        </div>

        <p>Your account verification request has been reviewed by ${
          adminName || "our team"
        }.</p>

        ${
          verified
            ? `<p>Congratulations! Your account has been verified with <strong>${verificationLevel}</strong> level. You now have access to additional features and benefits on the platform.</p>`
            : `<p>Your verification request was not approved at this time. You may need to upload additional or clearer documents.</p>`
        }

        ${benefitsHtml}

        ${
          notes
            ? `
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 15px 0;">
            <p style="margin: 0;"><strong>Reviewer Notes:</strong></p>
            <p style="margin: 10px 0 0;">${notes}</p>
          </div>
        `
            : ""
        }

        ${
          !verified
            ? `
          <p style="text-align: center; margin: 25px 0;">
            <a href="/freelancer/profile" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Upload New Documents</a>
          </p>
        `
            : ""
        }

        <p>If you have any questions about your verification status, please contact our support team.</p>
        <p>Best regards,<br>The SkillSwap Team</p>
      </div>
    `,
  };
};

/**
 * Get email template for system alert
 * @param {Object} data - Data for the template
 * @returns {Object} - Email template with subject and body
 */
const getSystemAlertTemplate = (data) => {
  const { name, title, message, adminName } = data;

  return {
    subject: `SkillSwap Alert: ${title}`,
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">${title}</h2>
        <p>Hello ${name},</p>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 15px 0;">
          <p style="margin: 0;">${message}</p>
        </div>

        <p>This is an important notification from the SkillSwap administration team.</p>
        ${adminName ? `<p>Sent by: ${adminName}</p>` : ""}

        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>The SkillSwap Team</p>
      </div>
    `,
  };
};

/**
 * Get email template for dispute notification
 * @param {Object} data - Data for the template
 * @returns {Object} - Email template with subject and body
 */
const getDisputeNotificationTemplate = (data) => {
  const { name, projectTitle, disputeReason, otherPartyName } = data;

  return {
    subject: `Dispute Opened: ${projectTitle}`,
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Project Dispute Notification</h2>
        <p>Hello ${name},</p>

        <p>A dispute has been opened regarding the project <strong>${projectTitle}</strong>.</p>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 15px 0;">
          <p style="margin: 0;"><strong>Reason for dispute:</strong></p>
          <p style="margin: 10px 0 0;">${disputeReason}</p>
        </div>

        <p>The dispute has been filed by ${otherPartyName}. Our administration team will review the case and contact both parties to resolve the issue.</p>

        <p style="text-align: center; margin: 25px 0;">
          <a href="/disputes" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Dispute Details</a>
        </p>

        <p>Please be prepared to provide any relevant information or documentation to help resolve this dispute.</p>
        <p>Best regards,<br>The SkillSwap Team</p>
      </div>
    `,
  };
};

/**
 * Get email template for scheduled reminder
 * @param {Object} data - Data for the template
 * @returns {Object} - Email template with subject and body
 */
const getScheduledReminderTemplate = (data) => {
  const { name, title, message, actionLink, actionText } = data;

  return {
    subject: `Reminder: ${title}`,
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">${title}</h2>
        <p>Hello ${name},</p>

        <p>${message}</p>

        ${
          actionLink && actionText
            ? `
          <p style="text-align: center; margin: 25px 0;">
            <a href="${actionLink}" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">${actionText}</a>
          </p>
        `
            : ""
        }

        <p>This is an automated reminder from the SkillSwap system.</p>
        <p>Best regards,<br>The SkillSwap Team</p>
      </div>
    `,
  };
};

/**
 * Get email template based on template name
 * @param {string} templateName - Template name from config.EMAIL_TEMPLATES
 * @param {Object} data - Data for the template
 * @returns {Object} - Email template with subject and body
 */
const getEmailTemplate = (templateName, data) => {
  switch (templateName) {
    case config.EMAIL_TEMPLATES.WELCOME:
      return getWelcomeTemplate(data);
    case config.EMAIL_TEMPLATES.VERIFICATION:
      return getVerificationTemplate(data);
    case config.EMAIL_TEMPLATES.PASSWORD_RESET:
      return getPasswordResetTemplate(data);
    case config.EMAIL_TEMPLATES.DOCUMENT_STATUS:
      return getDocumentStatusTemplate(data);
    case config.EMAIL_TEMPLATES.UPLOAD_DOCUMENTS:
      return getUploadDocumentsTemplate(data);
    case config.EMAIL_TEMPLATES.VERIFICATION_STATUS:
      return getVerificationStatusTemplate(data);
    case config.EMAIL_TEMPLATES.SYSTEM_ALERT:
      return getSystemAlertTemplate(data);
    case config.EMAIL_TEMPLATES.DISPUTE_NOTIFICATION:
      return getDisputeNotificationTemplate(data);
    case config.EMAIL_TEMPLATES.SCHEDULED_REMINDER:
      return getScheduledReminderTemplate(data);
    default:
      return {
        subject: "SkillSwap Notification",
        body: `<p>Hello ${data.name},</p><p>${
          data.message || "You have a new notification."
        }</p>`,
      };
  }
};

module.exports = {
  getEmailTemplate,
};
