const User = require("../../models/User");
const Client = require("../../models/Client");
const Freelancer = require("../../models/Freelancer");
const { generateToken } = require("../../utils/jwt");
const { hashPassword, comparePassword } = require("../../utils/hash");
const nodemailer = require("nodemailer");
const config = require("../../utils/config");
const notificationService = require("../../utils/notificationService");

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "client",
      phone,
      isVerified: false,
    });

    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // Create profile based on role
    if (user.role === "client") {
      const client = await Client.create({
        user: user._id,
      });
    } else if (user.role === "freelancer") {
      const freelancer = await Freelancer.create({
        user: user._id,
      });

      // Notify admins about freelancer registration for verification
      try {
        await notificationService.notifyAdminVerificationRequest(
          freelancer._id,
          user._id,
          user.name
        );
      } catch (notificationError) {
        console.error(
          "Error sending freelancer verification notification:",
          notificationError
        );
        // Continue even if notification fails
      }

      // Notify freelancer to upload verification documents
      try {
        await notificationService.notifyFreelancerUploadDocuments(
          user._id,
          user.name
        );
      } catch (notificationError) {
        console.error(
          "Error sending document upload notification to freelancer:",
          notificationError
        );
        // Continue even if notification fails
      }
    }

    // Notify admins about new user registration
    try {
      await notificationService.notifyAdminNewUser(
        user._id,
        user.name,
        user.role
      );
    } catch (notificationError) {
      console.error("Error sending new user notification:", notificationError);
      // Continue even if notification fails
    }

    // Send verification email (mock)
    // In a real application, you would set up a proper email service
    console.log(`Verification token for ${email}: ${verificationToken}`);

    // Generate JWT token
    const token = generateToken({ id: user._id });

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate JWT token
    const token = generateToken({ id: user._id });

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user email
 * @route GET /api/auth/verify/:token
 * @access Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Find user with the verification token
    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 * @access Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate reset token
    const resetToken = user.generateResetPasswordToken();
    await user.save();

    // Send reset email (mock)
    // In a real application, you would set up a proper email service
    console.log(`Reset token for ${email}: ${resetToken}`);

    res.status(200).json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * @route POST /api/auth/reset-password/:token
 * @access Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Find user with the reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 * @access Private
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get profile based on role
    let profile = null;

    if (user.role === "client") {
      profile = await Client.findOne({ user: user._id });
    } else if (user.role === "freelancer") {
      profile = await Freelancer.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      profileImage,
      // Client-specific fields
      company,
      position,
      website,
      location,
      bio,
      // Freelancer-specific fields
      skills,
      hourlyRate,
      portfolio,
      education,
      experience,
      availability,
      socialProfiles,
    } = req.body;

    // Find user by ID (don't use findByIdAndUpdate to allow for pre-save hooks)
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update basic user info
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (profileImage !== undefined) user.profileImage = profileImage;

    // Log the changes being made
    console.log("Updating user with data:", { name, phone, profileImage });

    // Save user changes
    await user.save();

    // Log the updated user
    console.log("Updated user:", user);

    // Get profile based on role and update role-specific fields
    let profile = null;

    if (user.role === "client") {
      // Find and update client profile
      const client = await Client.findOne({ user: user._id });
      console.log("Found client profile:", client);

      if (client) {
        // Update client fields if they are provided
        if (company !== undefined) client.company = company;
        if (position !== undefined) client.position = position;
        if (website !== undefined) client.website = website;
        if (location !== undefined) client.location = location;
        if (bio !== undefined) client.bio = bio;

        // Log the changes being made
        console.log("Updating client with data:", {
          company,
          position,
          website,
          location,
          bio,
        });

        await client.save();
        profile = client;

        // Log the updated client
        console.log("Updated client profile:", client);
      } else {
        console.warn("Client profile not found for user:", user._id);
      }
    } else if (user.role === "freelancer") {
      // Find and update freelancer profile
      const freelancer = await Freelancer.findOne({ user: user._id });
      console.log("Found freelancer profile:", freelancer);

      if (freelancer) {
        // Update freelancer fields if they are provided
        if (bio !== undefined) freelancer.bio = bio;
        if (skills !== undefined) freelancer.skills = skills;
        if (hourlyRate !== undefined) freelancer.hourlyRate = hourlyRate;
        if (portfolio !== undefined) freelancer.portfolio = portfolio;
        if (education !== undefined) freelancer.education = education;
        if (experience !== undefined) freelancer.experience = experience;
        if (availability !== undefined) freelancer.availability = availability;
        if (socialProfiles !== undefined)
          freelancer.socialProfiles = socialProfiles;

        // Log the changes being made
        console.log("Updating freelancer with data:", {
          bio,
          skills,
          hourlyRate,
          portfolio,
          education,
          experience,
          availability,
          socialProfiles,
        });

        await freelancer.save();
        profile = freelancer;

        // Log the updated freelancer
        console.log("Updated freelancer profile:", freelancer);
      } else {
        console.warn("Freelancer profile not found for user:", user._id);
      }
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user,
        profile,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    next(error);
  }
};

/**
 * Change password
 * @route PUT /api/auth/change-password
 * @access Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if current password matches
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile,
  changePassword,
};
